/* =====================================================================
   CODES DE SECOURS DU SECOND FACTEUR
   ---------------------------------------------------------------------
   Huit codes à usage unique, remis une seule fois au moment où le second
   facteur est activé. Ils remplacent le code de l'application quand le
   téléphone est perdu, cassé ou remplacé.

   TROIS CHOIX
   - Seul le condensat est stocké. Une fuite de la table ne permet pas de
     se connecter, exactement comme pour les mots de passe.
   - Usage unique, et le compteur de codes restants est affiché à la
     personne : savoir qu'il n'en reste qu'un est ce qui pousse à en
     regénérer avant d'être bloqué.
   - Regénérer invalide tous les anciens. Un code noté sur un papier
     oublié dans un tiroir ne doit pas rester valable indéfiniment.

   Format : quatre groupes de quatre caractères, sans les lettres et
   chiffres qu'on confond (0/O, 1/I/L). Ils sont destinés à être écrits à
   la main sur un papier rangé ailleurs que le téléphone.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');
const db = require('./db');

const NOMBRE = 8;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // sans O, I, L, 0, 1

function unCode() {
  const octets = crypto.randomBytes(16);
  let brut = '';
  for (let i = 0; i < 16; i++) brut += ALPHABET[octets[i] % ALPHABET.length];
  return brut.match(/.{4}/g).join('-');
}

function condensat(code) {
  /* Normalisation : la personne peut saisir en minuscules, avec ou sans
     tirets. Ce qui compte est le code, pas sa présentation. */
  const propre = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(propre).digest('hex');
}

/* Remplace tous les codes du compte. Renvoie les codes en clair : c'est
   la seule et unique fois qu'ils sont lisibles. */
async function generer(compteId) {
  await db.requete(`DELETE FROM code_secours WHERE compte_id = $1`, [compteId]);
  const codes = [];
  for (let i = 0; i < NOMBRE; i++) {
    const c = unCode();
    codes.push(c);
    await db.requete(
      `INSERT INTO code_secours (compte_id, code_hash) VALUES ($1, $2)`,
      [compteId, condensat(c)]);
  }
  return codes;
}

/* Consomme un code s'il est valable. Renvoie le nombre de codes restants,
   ou null si le code ne convient pas. */
async function consommer(compteId, code) {
  const h = condensat(code);
  const trouve = await db.une(
    `UPDATE code_secours SET utilise_le = now()
      WHERE compte_id = $1 AND code_hash = $2 AND utilise_le IS NULL
      RETURNING id`, [compteId, h]);
  if (!trouve) return null;
  const reste = await db.une(
    `SELECT count(*)::int AS n FROM code_secours
      WHERE compte_id = $1 AND utilise_le IS NULL`, [compteId]);
  return reste.n;
}

async function restants(compteId) {
  const r = await db.une(
    `SELECT count(*)::int AS n FROM code_secours
      WHERE compte_id = $1 AND utilise_le IS NULL`, [compteId]);
  return r ? r.n : 0;
}

module.exports = { generer, consommer, restants, NOMBRE };
