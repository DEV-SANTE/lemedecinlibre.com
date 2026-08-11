/* =====================================================================
   TRACES DU SERVEUR
   ---------------------------------------------------------------------
   Une ligne de JSON par événement, sur la sortie standard. C'est le
   format qu'attendent les collecteurs de journaux, et il reste lisible à
   l'œil nu.

   AUCUNE DONNÉE DE SANTÉ, JAMAIS. Les journaux techniques sont copiés,
   agrégés, conservés longtemps et lus par des personnes qui n'ont rien à
   voir avec le soin. Une réponse de questionnaire qui atterrit dans un
   fichier de log est une fuite, même si le fichier reste sur le serveur.

   Ce n'est pas une consigne : nettoyer() retire les champs sensibles, et
   un contrôle automatique vérifie qu'aucun appel ne passe des données de
   dossier.
   ===================================================================== */
'use strict';

const NIVEAUX = { erreur: 0, avert: 1, info: 2, debug: 3 };
const SEUIL = NIVEAUX[process.env.TRACE_NIVEAU] !== undefined
  ? NIVEAUX[process.env.TRACE_NIVEAU] : NIVEAUX.info;

/* Champs dont la valeur ne doit jamais sortir dans un journal. */
const INTERDITS = ['valeur', 'reponses', 'texte', 'commentaire', 'motDePasse', 'mdp_hash',
                   'nir', 'nir_chiffre', 'code', 'jeton', 'secret', 'totp_secret',
                   'codesSecours', 'cookie'];

function nettoyer(objet) {
  if (!objet || typeof objet !== 'object') return objet;
  const sortie = {};
  for (const [cle, valeur] of Object.entries(objet)) {
    if (INTERDITS.includes(cle)) { sortie[cle] = '[retiré]'; continue; }
    if (valeur && typeof valeur === 'object' && !Array.isArray(valeur)) {
      sortie[cle] = nettoyer(valeur);
    } else if (Array.isArray(valeur)) {
      sortie[cle] = '[' + valeur.length + ' élément(s)]';
    } else {
      sortie[cle] = valeur;
    }
  }
  return sortie;
}

function ecrire(niveau, message, details) {
  if (NIVEAUX[niveau] > SEUIL) return;
  const ligne = Object.assign({
    quand: new Date().toISOString(),
    niveau,
    message,
  }, nettoyer(details));
  const texte = JSON.stringify(ligne);
  if (niveau === 'erreur') process.stderr.write(texte + '\n');
  else process.stdout.write(texte + '\n');
}

module.exports = {
  erreur: (m, d) => ecrire('erreur', m, d),
  avert:  (m, d) => ecrire('avert', m, d),
  info:   (m, d) => ecrire('info', m, d),
  debug:  (m, d) => ecrire('debug', m, d),
  nettoyer, INTERDITS,
};
