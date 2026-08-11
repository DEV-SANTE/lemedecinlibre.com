/* =====================================================================
   ACCÈS À LA BASE
   ---------------------------------------------------------------------
   Une seule interface, deux implémentations :

     - production : PostgreSQL par le module « pg » ;
     - développement et tests : PGlite, le même PostgreSQL compilé en
       WebAssembly, en mémoire. Le SQL est donc identique dans les deux
       cas — pas de divergence entre ce qu'on teste et ce qu'on déploie.

   Tout passe par requete(). Aucun autre fichier n'ouvre de connexion.
   ===================================================================== */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { AsyncLocalStorage } = require('node:async_hooks');

let client = null;
let type = null;

/* =====================================================================
   CONTEXTE DE REQUÊTE — CE QUI FAIT VIVRE LES POLITIQUES RLS
   ---------------------------------------------------------------------
   Les politiques de rls.sql comparent chaque ligne à trois réglages de
   session : app.compte_id, app.role, app.centre_id. Si le serveur ne les
   pose pas, les fonctions renvoient leurs valeurs par défaut et AUCUNE
   ligne ne passe — ce qui est le bon sens de l'échec, mais rend
   l'application inutilisable.

   Il faut donc, pour chaque requête HTTP, ouvrir une transaction sur une
   connexion dédiée et s'y présenter. AsyncLocalStorage transporte cette
   connexion jusqu'aux appels à requete(), sans avoir à la passer en
   paramètre à travers tout le code.

   EN DÉVELOPPEMENT (PGlite) il n'y a qu'une connexion et pas de rôle
   séparé : le contexte pose les réglages mais les politiques sont
   contournées, PGlite tournant en superutilisateur. C'est une asymétrie
   assumée, et c'est pourquoi les politiques ont leur propre série de
   tests (npm run rls) qui bascule explicitement sur le rôle applicatif.
   ===================================================================== */
const contexte = new AsyncLocalStorage();

async function ouvrir(options = {}) {
  const url = options.url || process.env.DATABASE_URL;
  if (url) {
    const { Pool } = require('pg');
    client = new Pool({ connectionString: url, max: 10 });
    type = 'postgres';
  } else {
    const { PGlite } = require('@electric-sql/pglite');
    client = await PGlite.create();
    type = 'pglite';
  }
  return { type };
}

async function requete(sql, params = []) {
  if (!client) throw new Error('La base n’est pas ouverte.');
  /* Une connexion dédiée si l'on est dans un contexte de requête, la
     connexion partagée sinon (tâches d'entretien, scripts). */
  const dans = contexte.getStore();
  const cible = (dans && dans.client) ? dans.client : client;
  const r = await cible.query(sql, params);
  /* Les deux pilotes ne nomment pas la même chose : « pg » renvoie
     rowCount, PGlite renvoie affectedRows. Lire l'un sans l'autre faisait
     croire qu'un UPDATE n'avait touché aucune ligne — un test échouait
     alors que la production aurait fonctionné, ce qui est le pire cas :
     on ne teste plus ce qu'on déploie. */
  const nb = r.rowCount ?? r.affectedRows ?? (r.rows ? r.rows.length : 0);
  return { rows: r.rows || [], nb };
}

async function une(sql, params = []) {
  const r = await requete(sql, params);
  return r.rows[0] || null;
}

/* Un script SQL contient plusieurs commandes ; query() n'en accepte qu'une.
   Les deux pilotes n'exposent pas la même méthode pour cela. */
async function executerScript(sql) {
  if (type === 'pglite') await client.exec(sql);
  else await client.query(sql);
}

async function creerSchema() {
  await executerScript(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
}

/* Politiques de sécurité au niveau des lignes. Séparé du schéma parce
   qu'on peut vouloir créer la base sans elles — en développement — mais
   jamais en production. */
async function appliquerRls() {
  await executerScript(fs.readFileSync(path.join(__dirname, '..', 'rls.sql'), 'utf8'));
}

async function fermer() {
  if (!client) return;
  if (type === 'postgres') await client.end();
  else await client.close();
  client = null; type = null;
}

/* Exécute fn() dans une transaction où le serveur s'est présenté à la
   base. À utiliser autour de chaque requête HTTP.

   « SET LOCAL » limite les réglages à cette transaction : aucune fuite
   d'une requête à la suivante, même si la connexion est recyclée par le
   pool — ce qui serait autrement une confusion d'identité entre deux
   patients. */
async function avecContexte({ compteId = 0, role = 'aucun', centreId = 0 }, fn) {
  if (type !== 'postgres') {
    /* PGlite : une seule connexion, pas de transaction imbriquée possible.
       On pose les réglages sans transaction, et on les remet à zéro après. */
    await client.query(`SELECT set_config('app.compte_id', $1, false)`, [String(compteId || 0)]);
    await client.query(`SELECT set_config('app.role', $1, false)`, [String(role || 'aucun')]);
    await client.query(`SELECT set_config('app.centre_id', $1, false)`, [String(centreId || 0)]);
    try {
      return await fn();
    } finally {
      await client.query(`SELECT set_config('app.compte_id', '0', false)`);
      await client.query(`SELECT set_config('app.role', 'aucun', false)`);
      await client.query(`SELECT set_config('app.centre_id', '0', false)`);
    }
  }

  const dedie = await client.connect();
  try {
    await dedie.query('BEGIN');
    await dedie.query(`SELECT set_config('app.compte_id', $1, true)`, [String(compteId || 0)]);
    await dedie.query(`SELECT set_config('app.role', $1, true)`, [String(role || 'aucun')]);
    await dedie.query(`SELECT set_config('app.centre_id', $1, true)`, [String(centreId || 0)]);
    const resultat = await contexte.run({ client: dedie }, fn);
    await dedie.query('COMMIT');
    return resultat;
  } catch (e) {
    try { await dedie.query('ROLLBACK'); } catch (x) {}
    throw e;
  } finally {
    dedie.release();
  }
}

module.exports = { ouvrir, requete, une, creerSchema, appliquerRls, executerScript,
                   avecContexte, fermer, get type() { return type; } };
