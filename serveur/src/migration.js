/* =====================================================================
   MIGRATIONS DE SCHÉMA
   ---------------------------------------------------------------------
   POURQUOI CE MÉCANISME EXISTE

   Jusqu'ici la base se créait d'un seul fichier. Cela suffit tant qu'on
   part d'une base vide. Le jour où le schéma évolue alors que la base
   contient de vrais dossiers, il n'y a plus de chemin propre : il reste à
   écrire des ALTER TABLE à la main, sur une base de santé en
   exploitation, sans savoir avec certitude lesquels ont déjà été passés.

   Chaque fichier de migrations/ est donc appliqué une fois, dans l'ordre
   de son numéro, et son passage est inscrit dans schema_version avec
   l'empreinte du fichier.

   L'EMPREINTE EST LE POINT IMPORTANT. Si un fichier déjà appliqué est
   modifié après coup, la migration s'arrête et le dit. Sans ce contrôle,
   deux serveurs pourraient tourner sur des schémas différents en croyant
   être à la même version — panne silencieuse, la pire espèce.
   ===================================================================== */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db');

const DOSSIER = path.join(__dirname, '..', 'migrations');

async function creerTableVersion() {
  await db.executerScript(`
    CREATE TABLE IF NOT EXISTS schema_version (
      numero      INTEGER PRIMARY KEY,
      nom         TEXT NOT NULL,
      empreinte   TEXT NOT NULL,
      appliquee_le TIMESTAMPTZ NOT NULL DEFAULT now(),
      duree_ms    INTEGER
    );`);
}

function fichiers() {
  if (!fs.existsSync(DOSSIER)) return [];
  return fs.readdirSync(DOSSIER)
    .filter((f) => /^\d{3}-.*\.sql$/.test(f))
    .sort()
    .map((f) => {
      const contenu = fs.readFileSync(path.join(DOSSIER, f), 'utf8');
      return {
        numero: Number(f.slice(0, 3)),
        nom: f,
        contenu,
        empreinte: crypto.createHash('sha256').update(contenu, 'utf8').digest('hex'),
      };
    });
}

async function etat() {
  await creerTableVersion();
  const appliquees = await db.requete(
    `SELECT numero, nom, empreinte, appliquee_le FROM schema_version ORDER BY numero`);
  const surDisque = fichiers();
  const parNumero = new Map(appliquees.rows.map((r) => [Number(r.numero), r]));
  return surDisque.map((m) => {
    const deja = parNumero.get(m.numero);
    return {
      numero: m.numero, nom: m.nom,
      appliquee: !!deja,
      modifieeDepuis: !!deja && deja.empreinte !== m.empreinte,
      appliqueeLe: deja ? deja.appliquee_le : null,
    };
  });
}

/* Applique ce qui manque. S'arrête à la première anomalie plutôt que de
   continuer : une migration partiellement appliquée est plus difficile à
   réparer qu'une migration non commencée. */
async function migrer({ silencieux = false } = {}) {
  await creerTableVersion();
  const deja = await db.requete(`SELECT numero, empreinte, nom FROM schema_version`);
  const connues = new Map(deja.rows.map((r) => [Number(r.numero), r]));
  const dire = (m) => { if (!silencieux) console.log(m); };
  const appliquees = [];

  for (const m of fichiers()) {
    const trace = connues.get(m.numero);
    if (trace) {
      if (trace.empreinte !== m.empreinte) {
        throw new Error(
          `La migration ${m.nom} a été modifiée après avoir été appliquée. `
          + `Ne la corrigez pas : créez une nouvelle migration. `
          + `Deux serveurs pourraient sinon tourner sur des schémas différents `
          + `en croyant être à la même version.`);
      }
      continue;
    }
    const debut = Date.now();
    dire('  → application de ' + m.nom);
    await db.executerScript(m.contenu);
    await db.requete(
      `INSERT INTO schema_version (numero, nom, empreinte, duree_ms) VALUES ($1,$2,$3,$4)`,
      [m.numero, m.nom, m.empreinte, Date.now() - debut]);
    appliquees.push(m.nom);
  }

  if (!appliquees.length) dire('  base déjà à jour');
  return appliquees;
}

async function version() {
  await creerTableVersion();
  const r = await db.une(
    `SELECT numero, nom, appliquee_le FROM schema_version ORDER BY numero DESC LIMIT 1`);
  return r || null;
}

module.exports = { migrer, etat, version, fichiers };
