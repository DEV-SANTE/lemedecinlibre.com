/* =====================================================================
   LIMITATION DES TENTATIVES DE CONNEXION
   ---------------------------------------------------------------------
   Deux compteurs, parce qu'ils protègent contre deux attaques
   différentes :

     par compte  — quelqu'un s'acharne sur une adresse connue ;
     par adresse IP — quelqu'un essaie un même mot de passe courant sur
                      beaucoup de comptes (« credential stuffing »), ce
                      qu'un compteur par compte ne verrait jamais.

   Le verrouillage est temporaire et progressif, jamais définitif : un
   blocage permanent transforme la protection en moyen de nuire, puisqu'il
   suffirait d'échouer volontairement pour priver quelqu'un de son compte.

   CE QUI N'EST PAS FAIT ICI : dire au visiteur combien d'essais il lui
   reste, ni si l'adresse existe. Le message reste le même dans tous les
   cas.
   ===================================================================== */
'use strict';
const db = require('./db');

const SEUIL_COMPTE = 5;         // échecs avant verrouillage d'un compte
const SEUIL_IP = 20;            // échecs avant verrouillage d'une adresse
const FENETRE_MIN = 15;         // durée d'observation, en minutes

/* Paliers de verrouillage : 1, 5, 15 puis 60 minutes. Un acharnement se
   heurte à des attentes qui s'allongent, sans jamais devenir un blocage
   définitif. */
const PALIERS_MIN = [1, 5, 15, 60];

function attenteMinutes(nbEchecs, seuil) {
  const depassements = Math.floor((nbEchecs - seuil) / seuil);
  return PALIERS_MIN[Math.min(depassements, PALIERS_MIN.length - 1)];
}

async function compter(champ, valeur) {
  if (!valeur) return 0;
  const colonne = champ === 'courriel' ? 'lower(courriel) = lower($1)' : 'ip = $1';
  const r = await db.une(
    `SELECT count(*)::int AS n FROM tentative_connexion
      WHERE ${colonne} AND reussie = FALSE AND quand > now() - interval '${FENETRE_MIN} minutes'`,
    [valeur]);
  return r ? r.n : 0;
}

/* Renvoie { bloque, attendreMinutes, motif } sans révéler de compteur. */
async function verifier(courriel, ip) {
  const parCompte = await compter('courriel', courriel);
  const parIp = await compter('ip', ip);
  if (parCompte >= SEUIL_COMPTE) {
    return { bloque: true, attendreMinutes: attenteMinutes(parCompte, SEUIL_COMPTE),
             motif: 'trop de tentatives sur ce compte' };
  }
  if (parIp >= SEUIL_IP) {
    return { bloque: true, attendreMinutes: attenteMinutes(parIp, SEUIL_IP),
             motif: 'trop de tentatives depuis cette adresse' };
  }
  return { bloque: false };
}

async function enregistrer(courriel, ip, reussie) {
  await db.requete(
    `INSERT INTO tentative_connexion (courriel, ip, reussie) VALUES ($1,$2,$3)`,
    [courriel || null, ip || null, !!reussie]);
  /* Une connexion réussie efface les échecs du compte : la personne a
     prouvé son identité, il n'y a plus de raison de la faire attendre. */
  if (reussie && courriel) {
    await db.requete(
      `DELETE FROM tentative_connexion
        WHERE lower(courriel) = lower($1) AND reussie = FALSE`, [courriel]);
  }
}

/* À appeler périodiquement : les tentatives anciennes ne servent plus à
   rien et rien ne justifie de conserver des adresses IP indéfiniment. */
async function purger(joursConservation = 30) {
  const r = await db.requete(
    `DELETE FROM tentative_connexion WHERE quand < now() - ($1 || ' days')::interval`,
    [String(joursConservation)]);
  return r.nb;
}

module.exports = { verifier, enregistrer, purger, SEUIL_COMPTE, SEUIL_IP, FENETRE_MIN };
