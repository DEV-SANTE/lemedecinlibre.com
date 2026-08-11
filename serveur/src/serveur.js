/* =====================================================================
   SERVEUR HTTP
   ---------------------------------------------------------------------
   http natif de Node. Rôle : lire la requête, retrouver la session,
   appeler la route, écrire la réponse. Aucune décision d'accès ici —
   elles sont toutes dans droits.js.

   Le cookie de session est httpOnly (inaccessible au JavaScript de la
   page, donc inexploitable par une injection), SameSite=Strict (pas
   d'envoi depuis un autre site) et Secure hors développement.
   ===================================================================== */
'use strict';
const http = require('node:http');
const db = require('./db');
const journal = require('./journal');
const { routes, compteDeLaSession } = require('./api');
const statique = require('./statique');
const entretien = require('./entretien');
const migration = require('./migration');
const trace = require('./trace');

const NOM_COOKIE = 'pv_session';

/* Les seules routes accessibles sans session. Toutes les autres reçoivent
   401 AVANT d'atteindre la base.

   Ce n'est pas une simplification : sans cela, une route commençait par
   charger le dossier demandé, puis vérifiait les droits. Un visiteur non
   connecté obtenait donc 404 pour un dossier inexistant et 401 pour un
   dossier existant — de quoi énumérer les dossiers de la base sans aucun
   compte. La vérification passe donc avant l'accès aux données. */
const PUBLIQUES = new Set([
  'POST /api/inscription',
  'POST /api/connexion',
  'POST /api/deconnexion',
  /* Un mot de passe oublié se répare sans être connecté — c'est tout
     l'objet de ces deux routes. Elles sont protégées autrement : réponse
     identique que l'adresse existe ou non, jeton à usage unique et de
     durée limitée, et limitation des tentatives. */
  'POST /api/mot-de-passe/oublie',
  'POST /api/mot-de-passe/reinitialiser',
  /* Le texte du consentement doit être lisible AVANT de créer un compte :
     consentir suppose d'avoir pu lire. */
  'GET /api/consentement',
]);

/* Routes accessibles avec une session dont le second facteur n'est pas
   encore franchi. Rien d'autre ne doit l'être : une session à demi
   authentifiée ne vaut pas mieux que pas de session du tout. */
const AVANT_SECOND_FACTEUR = new Set([
  'POST /api/totp/preparer',
  'POST /api/totp/activer',
  'POST /api/totp/verifier',
  'POST /api/deconnexion',
  'GET /api/moi',
  /* Savoir combien de codes de secours il reste doit être possible avant
     d'avoir franchi le second facteur : c'est précisément quand on est
     bloqué qu'on se pose la question. En regénérer, non — cela exige
     d'être pleinement identifié. */
  'GET /api/totp/secours',
]);

/* Les rôles pour lesquels le second facteur est exigé. Doit rester
   identique à SECOND_FACTEUR_REQUIS de api.js — le contrôle croisé est
   dans les tests. */
const ROLES_SECOND_FACTEUR = ['medecin', 'secretaire'];
const EN_TETES = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',            // aucune réponse d'API en cache
  'Referrer-Policy': 'no-referrer',
};

function lireCookie(entete, nom) {
  if (!entete) return null;
  for (const p of entete.split(';')) {
    const [k, ...v] = p.trim().split('=');
    if (k === nom) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function lireCorps(req) {
  const morceaux = [];
  let taille = 0;
  for await (const c of req) {
    taille += c.length;
    if (taille > 1e6) throw new Error('corps trop volumineux');
    morceaux.push(c);
  }
  if (!morceaux.length) return {};
  try { return JSON.parse(Buffer.concat(morceaux).toString('utf8')); }
  catch (e) { throw new Error('JSON invalide'); }
}

/* Association d'une requête à une route, en extrayant les paramètres. */
function trouverRoute(methode, chemin) {
  const cible = chemin.replace(/\/+$/, '') || '/';
  for (const cle of Object.keys(routes)) {
    const [m, motif] = cle.split(' ');
    if (m !== methode) continue;
    const partsM = motif.split('/'), partsC = cible.split('/');
    if (partsM.length !== partsC.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < partsM.length; i++) {
      if (partsM[i].startsWith(':')) {
        if (!/^\d+$/.test(partsC[i])) { ok = false; break; }
        params[partsM[i].slice(1)] = partsC[i];
      } else if (partsM[i] !== partsC[i]) { ok = false; break; }
    }
    if (ok) return { gestionnaire: routes[cle], params, cle };
  }
  return null;
}

function creerServeur({ securise = true, site = null } = {}) {
  const servirFichier = site ? statique.servir(site) : null;
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://interne');

    /* Tout ce qui ne commence pas par /api/ est une page ou une ressource
       du site. Les fichiers sont servis avant toute logique d'API : une
       page ne demande pas de session, c'est le JavaScript de la page qui
       appellera l'API et recevra 401 s'il n'est pas connecté. */
    if (servirFichier && !url.pathname.startsWith('/api/')) {
      return servirFichier(req, res, url.pathname);
    }
    let statut = 200, charge = null, cookie = null;

    const ctx = {
      ip: req.socket.remoteAddress,
      agent: req.headers['user-agent'] || null,
      params: {}, corps: {}, compte: null, idSession: null,
      ok: (o) => { charge = o; return null; },
      err: (code, message) => { statut = code; charge = { erreur: message }; return null; },
      /* Un refus est journalisé avant d'être renvoyé : les tentatives
         repoussées sont ce qu'on veut voir dans un journal d'accès. */
      refus: async (d, action, cibleId = null) => {
        await journal.tracer({ compte: ctx.compte, action, cibleType: cibleId ? 'dossier' : null,
                               cibleId, autorise: false, ip: ctx.ip });
        statut = ctx.compte ? 403 : 401;
        charge = { erreur: d.motif };
        return null;
      },
      poserCookie: (id) => {
        cookie = `${NOM_COOKIE}=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`
               + (securise ? '; Secure' : '');
      },
      effacerCookie: () => { cookie = `${NOM_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`; },
    };

    try {
      ctx.idSession = lireCookie(req.headers.cookie, NOM_COOKIE);
      ctx.compte = await compteDeLaSession(ctx.idSession);
      /* DELETE aussi : la confirmation d'un effacement voyage dans le
         corps, et non dans l'URL — une adresse est journalisée par les
         serveurs et les navigateurs, ce qui est le dernier endroit où
         mettre une confirmation de suppression de données de santé.
         La spécification HTTP autorise un corps sur DELETE ; ne pas le
         lire faisait échouer la route sans expliquer pourquoi. */
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        ctx.corps = await lireCorps(req);
      }

      const r = trouverRoute(req.method, url.pathname);
      if (!r) {
        statut = 404; charge = { erreur: 'route inconnue' };
      } else if (!PUBLIQUES.has(r.cle) && !ctx.compte) {
        statut = 401; charge = { erreur: 'non connecté' };
        await journal.tracer({ compte: null, action: 'acces_sans_session',
                               autorise: false, ip: ctx.ip });
      } else if (ctx.compte
                 && ROLES_SECOND_FACTEUR.includes(ctx.compte.role)
                 && !ctx.compte.totp_valide
                 && !AVANT_SECOND_FACTEUR.has(r.cle)) {
        /* Session ouverte mais second facteur non franchi : on refuse
           tout, y compris la lecture d'un dossier. C'est la seule façon
           qu'un mot de passe volé ne suffise pas. */
        statut = 403;
        charge = { erreur: 'second facteur requis', secondFacteur: ctx.compte.totp_actif
                   ? 'attendu' : 'a-configurer' };
        await journal.tracer({ compte: ctx.compte, action: 'acces_sans_second_facteur',
                               autorise: false, ip: ctx.ip });
      } else {
        ctx.params = r.params;
        /* La requête s'exécute dans un contexte où le serveur s'est
           présenté à la base : c'est ce qui active les politiques RLS.
           Sans cela elles seraient posées mais jamais utilisées — une
           protection écrite et inopérante, ce qui est pire qu'aucune. */
        await db.avecContexte({
          compteId: ctx.compte ? ctx.compte.id : 0,
          role: ctx.compte ? ctx.compte.role : 'aucun',
          centreId: ctx.compte ? ctx.compte.centre_id : 0,
        }, () => r.gestionnaire(ctx));
      }
    } catch (e) {
      /* Le détail de l'erreur va au journal du serveur, pas au client :
         un message technique renseigne un attaquant. */
      trace.erreur('erreur de traitement', {
        message: e.message, methode: req.method, chemin: url.pathname,
        role: ctx.compte ? ctx.compte.role : null,
      });
      statut = 500; charge = { erreur: 'erreur interne' };
    }

    const entetes = { ...EN_TETES };
    if (cookie) entetes['Set-Cookie'] = cookie;
    res.writeHead(statut, entetes);
    res.end(JSON.stringify(charge ?? {}));
  });
}

async function demarrer({ port = 3000, url = null, site = null } = {}) {
  const info = await db.ouvrir({ url });

  /* Les migrations passent au démarrage. Sur une base neuve elles créent
     tout ; sur une base existante elles n'appliquent que ce qui manque, et
     s'arrêtent si un fichier déjà appliqué a été modifié. */
  const appliquees = await migration.migrer({ silencieux: false });
  const v = await migration.version();
  trace.info('schéma à jour', {
    version: v ? v.numero : 0, nom: v ? v.nom : null,
    migrationsAppliquees: appliquees.length,
  });

  if (info.type === 'pglite') {
    console.log('Base en mémoire (PGlite) — développement uniquement.');
  }
  const s = creerServeur({ securise: !!url, site });

  /* L'entretien démarre avec le serveur. Une durée de conservation
     annoncée dans la politique de confidentialité mais appliquée par
     personne n'est pas une durée de conservation. */
  entretien.programmer(24);

  await new Promise((r) => s.listen(port, r));
  console.log(`À l'écoute sur le port ${port} — base : ${info.type}`
    + (site ? `\nSite servi depuis ${site}` : ' (API seule)'));
  if (site) console.log(`Ouvrez http://localhost:${port}/connexion/`);
  return s;
}

module.exports = { creerServeur, demarrer };
if (require.main === module) {
  demarrer({ port: Number(process.env.PORT) || 3000,
             url: process.env.DATABASE_URL,
             site: process.env.SITE || require('node:path').join(__dirname, '..', '..', 'prevention-sante') })
    .catch((e) => { console.error(e); process.exit(1); });
}
