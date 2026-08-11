/* =====================================================================
   SECOND FACTEUR — TOTP (RFC 6238)
   ---------------------------------------------------------------------
   Codes à six chiffres qui changent toutes les trente secondes,
   compatibles avec n'importe quelle application d'authentification.

   Écrit avec le module crypto de Node, sans dépendance : l'algorithme
   tient en quarante lignes, et une bibliothèque de plus dans un projet
   de santé est une bibliothèque de plus à auditer.

   PROTECTIONS AU-DELÀ DE L'ALGORITHME
   - Une fenêtre d'un pas avant et après, pas plus : au-delà, on accepte
     des codes vieux de plusieurs minutes.
   - Le dernier pas utilisé est mémorisé : un code intercepté ne peut pas
     être rejoué, même dans sa fenêtre de validité.
   - Comparaison à temps constant.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');

const PAS = 30;              // secondes
const CHIFFRES = 6;
const FENETRE = 1;           // un pas de tolérance de part et d'autre

/* --- base32, l'encodage attendu par les applications d'authentification */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function versBase32(buf) {
  let bits = 0, valeur = 0, sortie = '';
  for (const octet of buf) {
    valeur = (valeur << 8) | octet; bits += 8;
    while (bits >= 5) { sortie += ALPHABET[(valeur >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) sortie += ALPHABET[(valeur << (5 - bits)) & 31];
  return sortie;
}

function depuisBase32(s) {
  let bits = 0, valeur = 0;
  const octets = [];
  for (const c of s.replace(/=+$/, '').toUpperCase()) {
    const i = ALPHABET.indexOf(c);
    if (i < 0) continue;
    valeur = (valeur << 5) | i; bits += 5;
    if (bits >= 8) { octets.push((valeur >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(octets);
}

function nouveauSecret() {
  return versBase32(crypto.randomBytes(20));   // 160 bits, recommandation du RFC
}

function pasCourant(instant = Date.now()) {
  return Math.floor(instant / 1000 / PAS);
}

function codePour(secretBase32, pas) {
  const cle = depuisBase32(secretBase32);
  const compteur = Buffer.alloc(8);
  compteur.writeBigUInt64BE(BigInt(pas));
  const h = crypto.createHmac('sha1', cle).update(compteur).digest();
  const decalage = h[h.length - 1] & 0x0f;
  const binaire = ((h[decalage] & 0x7f) << 24) | (h[decalage + 1] << 16)
                | (h[decalage + 2] << 8) | h[decalage + 3];
  return String(binaire % 10 ** CHIFFRES).padStart(CHIFFRES, '0');
}

/* Renvoie le pas validé, ou null. Le pas est rendu pour que l'appelant
   l'enregistre et refuse un rejeu du même code. */
function verifier(secretBase32, codeSaisi, dernierPasUtilise, instant = Date.now()) {
  if (!secretBase32 || !/^\d{6}$/.test(String(codeSaisi || '').trim())) return null;
  const saisi = Buffer.from(String(codeSaisi).trim());
  const maintenant = pasCourant(instant);
  for (let d = -FENETRE; d <= FENETRE; d++) {
    const pas = maintenant + d;
    if (dernierPasUtilise !== null && dernierPasUtilise !== undefined
        && Number(pas) <= Number(dernierPasUtilise)) continue;   // déjà servi
    const attendu = Buffer.from(codePour(secretBase32, pas));
    if (attendu.length === saisi.length && crypto.timingSafeEqual(attendu, saisi)) return pas;
  }
  return null;
}

/* L'URI que lisent les applications d'authentification. */
function uriProvisionnement(secret, courriel, emetteur = 'Prévention Santé') {
  return 'otpauth://totp/' + encodeURIComponent(emetteur + ':' + courriel)
       + '?secret=' + secret + '&issuer=' + encodeURIComponent(emetteur)
       + '&algorithm=SHA1&digits=' + CHIFFRES + '&period=' + PAS;
}

module.exports = { nouveauSecret, codePour, verifier, pasCourant, uriProvisionnement, PAS };
