/* =====================================================================
   CONSENTEMENT
   ---------------------------------------------------------------------
   Le texte accepté vit ICI, en un seul endroit, avec un numéro de
   version. Deux raisons.

   D'abord la preuve : on enregistre l'empreinte du texte réellement
   accepté, pas seulement une case cochée. Si le texte évolue, on saura
   que telle personne a consenti à l'ancienne rédaction — ce qu'une
   colonne booléenne ne dirait pas, et c'est précisément ce qu'un
   contrôle demanderait.

   Ensuite l'honnêteté : l'écran d'inscription affiche ce texte-là, pas
   une reformulation. Un contrôle automatique vérifie que la page et le
   serveur parlent du même texte.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');
const db = require('./db');

const VERSION = '2026-08-1';

const TEXTE = [
  'J’accepte que mes réponses au questionnaire de prévention, mes résultats d’examens et',
  'les avis rédigés par le médecin soient enregistrés et conservés afin d’organiser mon',
  'parcours de prévention.',
  '',
  'Je comprends que ces informations sont des données de santé, qu’elles sont hébergées',
  'en France chez un prestataire certifié pour cet usage, et qu’elles ne sont accessibles',
  'qu’au médecin du centre où je suis suivi et, pour la partie administrative, à son',
  'secrétariat.',
  '',
  'Je comprends que mon employeur, s’il finance cet accès, ne reçoit aucune information',
  'me concernant, pas même le fait que je participe.',
  '',
  'Je peux retirer ce consentement à tout moment, consulter la liste des personnes ayant',
  'ouvert mon dossier, et demander une copie ou l’effacement de mes données.',
].join('\n');

function empreinte(texte) {
  return crypto.createHash('sha256').update(texte, 'utf8').digest('hex');
}

const EMPREINTE = empreinte(TEXTE);

async function enregistrer(compteId, ip) {
  await db.requete(
    `INSERT INTO consentement (compte_id, version, texte_hash, ip) VALUES ($1,$2,$3,$4)`,
    [compteId, VERSION, EMPREINTE, ip || null]);
  return { version: VERSION };
}

async function actuel(compteId) {
  return db.une(
    `SELECT version, texte_hash, donne_le, retire_le FROM consentement
      WHERE compte_id = $1 ORDER BY id DESC LIMIT 1`, [compteId]);
}

/* Le consentement est-il donné, et porte-t-il sur la version en cours ?
   Une personne ayant accepté une version antérieure n'est pas « sans
   consentement » : elle doit être invitée à réexaminer le texte, ce qui
   n'est pas la même chose que d'être bloquée. */
async function etat(compteId) {
  const c = await actuel(compteId);
  if (!c) return { donne: false, aJour: false, version: null };
  if (c.retire_le) return { donne: false, retireLe: c.retire_le, aJour: false, version: c.version };
  return { donne: true, aJour: c.texte_hash === EMPREINTE,
           version: c.version, donneLe: c.donne_le };
}

async function retirer(compteId) {
  await db.requete(
    `UPDATE consentement SET retire_le = now()
      WHERE compte_id = $1 AND retire_le IS NULL`, [compteId]);
}

module.exports = { VERSION, TEXTE, EMPREINTE, enregistrer, etat, retirer, empreinte };
