/* =====================================================================
   ENTRETIEN DES DONNÉES
   ---------------------------------------------------------------------
   Rien ne justifie de conserver indéfiniment une adresse IP d'échec de
   connexion, une session expirée ou un jeton déjà utilisé. Le RGPD
   demande des durées, et une durée écrite dans une politique de
   confidentialité mais appliquée par personne n'est pas une durée.

   Ce module supprime, et TRACE ce qu'il a supprimé dans la table
   « entretien ». Sans cette trace, on ne peut pas savoir si la purge
   tourne — et une purge qu'on croit active mais qui ne tourne pas est un
   manquement invisible, donc le pire.

   Les durées ici doivent correspondre à celles annoncées dans la page
   « Données personnelles ». Un contrôle croisé le vérifie.
   ===================================================================== */
'use strict';
const db = require('./db');

const DUREES_JOURS = {
  tentatives: 30,        // tentatives de connexion
  journal: 1095,         // journal des accès : trois ans
};

async function tracer(tache, n) {
  await db.requete(`INSERT INTO entretien (tache, supprimees) VALUES ($1, $2)`, [tache, n]);
  return n;
}

async function passer() {
  const bilan = {};

  /* Sessions expirées : aucune raison de les garder une seconde de plus,
     elles ne servent plus à identifier personne. */
  let r = await db.requete(`DELETE FROM session WHERE expire_le < now()`);
  bilan.sessions = await tracer('sessions expirées', r.nb);

  /* Jetons de réinitialisation utilisés ou périmés. */
  r = await db.requete(
    `DELETE FROM jeton_reinitialisation WHERE utilise_le IS NOT NULL OR expire_le < now()`);
  bilan.jetons = await tracer('jetons de réinitialisation', r.nb);

  /* Tentatives de connexion : elles ne protègent que sur une fenêtre
     courte, et elles contiennent des adresses IP. */
  r = await db.requete(
    `DELETE FROM tentative_connexion WHERE quand < now() - ($1 || ' days')::interval`,
    [String(DUREES_JOURS.tentatives)]);
  bilan.tentatives = await tracer('tentatives de connexion', r.nb);

  /* Journal des accès : conservé longtemps, parce que c'est une pièce de
     preuve pour la personne concernée — mais pas indéfiniment. */
  r = await db.requete(
    `DELETE FROM journal_acces WHERE quand < now() - ($1 || ' days')::interval`,
    [String(DUREES_JOURS.journal)]);
  bilan.journal = await tracer('journal des accès', r.nb);

  return bilan;
}

/* Dernier passage, pour qu'un écran d'administration puisse dire si
   l'entretien tourne. */
async function dernierPassage() {
  return db.une(`SELECT tache, supprimees, quand FROM entretien ORDER BY id DESC LIMIT 1`);
}

/* Programmation. Volontairement dans le serveur et non dans un cron
   externe : une tâche système qu'on oublie de recréer après une
   migration est une purge qui s'arrête sans que personne le voie. */
function programmer(heures = 24) {
  passer().catch((e) => console.error('[entretien] échec :', e.message));
  const minuteur = setInterval(() => {
    passer().catch((e) => console.error('[entretien] échec :', e.message));
  }, heures * 3600e3);
  minuteur.unref();   /* ne retient pas le processus à l'arrêt */
  return minuteur;
}

module.exports = { passer, programmer, dernierPassage, DUREES_JOURS };
