/* =====================================================================
   MOTS DE PASSE
   ---------------------------------------------------------------------
   scrypt, du module crypto de Node — aucune dépendance externe.

   POURQUOI scrypt ET PAS UNE BIBLIOTHÈQUE
   Argon2id est légèrement préférable en théorie, mais c'est un module
   natif à compiler : une dépendance de plus à auditer, et un risque
   d'échec d'installation sur le serveur. scrypt est intégré à Node,
   recommandé par l'OWASP, et résiste au matériel spécialisé. Pour ce
   projet, l'absence de dépendance vaut mieux que le gain marginal.

   Un sel aléatoire par mot de passe : deux personnes ayant le même mot
   de passe n'ont pas le même condensat.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');

const N = 16384;   // coût processeur (2^14)
const r = 8;
const p = 1;
const LONGUEUR = 64;

function hacher(motDePasse) {
  verifierSolidite(motDePasse);
  const sel = crypto.randomBytes(16);
  const cle = crypto.scryptSync(motDePasse, sel, LONGUEUR, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${sel.toString('hex')}$${cle.toString('hex')}`;
}

function verifier(motDePasse, stocke) {
  try {
    const [algo, n, rr, pp, selHex, cleHex] = String(stocke).split('$');
    if (algo !== 'scrypt') return false;
    const sel = Buffer.from(selHex, 'hex');
    const attendu = Buffer.from(cleHex, 'hex');
    const calcule = crypto.scryptSync(motDePasse, sel, attendu.length,
      { N: Number(n), r: Number(rr), p: Number(pp) });
    /* Comparaison à temps constant : une comparaison ordinaire s'arrête
       au premier octet différent et laisse deviner le condensat. */
    return crypto.timingSafeEqual(calcule, attendu);
  } catch (e) {
    return false;
  }
}

/* Exigences minimales. Volontairement sobres : la longueur protège plus
   que l'obligation d'un caractère spécial, qui pousse aux « Passw0rd! ». */
function verifierSolidite(mdp) {
  if (typeof mdp !== 'string' || mdp.length < 12) {
    throw new Error('Le mot de passe doit comporter au moins douze caractères.');
  }
  const frequents = ['motdepasse123', 'azertyuiop12', '123456789012', 'preventionsante'];
  if (frequents.includes(mdp.toLowerCase())) {
    throw new Error('Ce mot de passe est trop courant.');
  }
}

module.exports = { hacher, verifier, verifierSolidite };
