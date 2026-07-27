#!/usr/bin/env node
/* =====================================================================
   TEST DE NON-RÉGRESSION — ABSENCE DE CALCUL CLINIQUE

   À exécuter avant chaque publication :
       node verifier.js

   Ce test protège la contrainte structurante du projet : la version 1
   ne doit produire aucune information propre à un patient donné à des
   fins de décision médicale. Un logiciel qui calcule un score validé,
   le compare à un seuil et en tire une conséquence relève selon toute
   vraisemblance de la classe IIa au sens du règlement (UE) 2017/745.

   MÉTHODE
   Le test analyse le code EXÉCUTABLE seulement. Il retire d'abord les
   commentaires et les chaînes de caractères, puis cherche des noms
   d'identifiants interdits dans ce qui reste.

   Cette distinction est le cœur du test. « Seuil publié de repérage :
   4 ou plus chez l'homme » dans une chaîne est du contenu documentaire
   statique, ce qui est autorisé. Une variable nommée `seuil` est un
   calcul, ce qui est interdit. Le mot est le même, le régime ne l'est pas.

   Si ce test échoue, ne publiez pas : soit le code a franchi la ligne,
   soit la ligne a été déplacée sciemment — et dans ce second cas le
   dossier de marquage CE doit être ouvert d'abord.
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const RACINE = __dirname;
let echecs = 0, controles = 0;

const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function sansCommentaires(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');
}

/* Retire les littéraux de chaîne : ne reste que le code exécutable. */
function codeSeul(src) {
  return sansCommentaires(src)
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function verifier(nom, ok, detail) {
  controles++;
  if (ok) { console.log('  \x1b[32m✓\x1b[0m ' + nom); return; }
  echecs++;
  console.log('  \x1b[31m✗\x1b[0m ' + nom);
  if (detail) console.log('      ' + String(detail).replace(/\n/g, '\n      '));
}

console.log('\nAbsence de calcul clinique — contrôle avant publication\n');

/* ------------------------------------------------------------------
   1. Identifiants interdits dans le code exécutable
------------------------------------------------------------------- */
const INTERDITS = [
  'calculerScore', 'scoreTotal', 'totalScore', 'sommeScore', 'computeScore', 'getScore',
  'imc', 'bmi', 'indiceMasse',
  'paquetsAnnees', 'paquetAnnee', 'packYear',
  'seuil', 'threshold', 'depasse', 'franchit',
  'estAnormal', 'anormal', 'severite', 'gravite', 'niveauRisque',
  'declencher', 'proposerActe', 'actesSuggeres', 'suggerer',
  'risqueEleve', 'score2', 'stopbang', 'epworth', 'phqTotal', 'gadTotal',
  'eval', 'Function('
];

['app.js', 'questionnaire.js'].forEach(f => {
  const code = codeSeul(lire(f));
  const trouves = INTERDITS.filter(j => new RegExp('\\b' + j.replace('(', '\\(') + '\\b', 'i').test(code));
  verifier(f + ' — aucun identifiant de calcul (' + INTERDITS.length + ' motifs testés)',
    trouves.length === 0,
    trouves.length ? 'Identifiants trouvés dans le code exécutable : ' + trouves.join(', ') : null);
});

/* ------------------------------------------------------------------
   2. Aucun opérateur de comparaison appliqué à une réponse
------------------------------------------------------------------- */
(function () {
  const code = codeSeul(lire('app.js'));
  /* On cherche une comparaison portant sur reponses[...] ou .reponses. */
  const re = /reponses\s*(\[[^\]]*\]|\.[A-Za-z_$][\w$]*)\s*(>=|<=|>|<)/g;
  const m = code.match(re);
  verifier('app.js — aucune comparaison numérique sur une réponse de santé',
    !m, m ? 'Comparaisons trouvées : ' + m.join(' | ') : null);
})();

/* ------------------------------------------------------------------
   3. Les conditions d'affichage sont structurelles uniquement
------------------------------------------------------------------- */
(function () {
  const code = codeSeul(lire('questionnaire.js'));
  const ADMISES = ['sexe', 'ageMin', 'ageMax'];
  const re = /showIf:\s*\{([^}]*)\}/g;
  let m, mauvaises = [], nb = 0;
  while ((m = re.exec(code)) !== null) {
    nb++;
    m[1].split(',').forEach(part => {
      const cle = part.split(':')[0].trim();
      if (cle && ADMISES.indexOf(cle) === -1) mauvaises.push(cle);
    });
  }
  verifier('questionnaire.js — ' + nb + ' condition(s) showIf, toutes structurelles',
    mauvaises.length === 0,
    mauvaises.length ? 'Clés non structurelles : ' + [...new Set(mauvaises)].join(', ') : null);
})();

/* ------------------------------------------------------------------
   4. Aucun champ de formule ou de pondération
------------------------------------------------------------------- */
(function () {
  const code = codeSeul(lire('questionnaire.js'));
  const interdits = ['formule:', 'compute:', 'calcul:', 'points:', 'ponderation:', 'coefficient:'];
  const trouves = interdits.filter(k => code.indexOf(k) !== -1);
  verifier('questionnaire.js — aucun champ de formule ou de pondération',
    trouves.length === 0,
    trouves.length ? 'Champs trouvés : ' + trouves.join(', ') : null);
})();

/* ------------------------------------------------------------------
   5. Aucune classe CSS codant une gravité
------------------------------------------------------------------- */
(function () {
  const css = lire('style.css').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const interdits = ['.anormal', '.alerte', '.severe', '.eleve', '.critique',
                     '.rouge', '.danger', '.risque'];
  const trouves = interdits.filter(k => css.indexOf(k) !== -1);
  verifier('style.css — aucune classe codant une gravité clinique',
    trouves.length === 0,
    trouves.length ? 'Classes trouvées : ' + trouves.join(', ') : null);
})();

/* ------------------------------------------------------------------
   6. Garde-fous de l'environnement de test
------------------------------------------------------------------- */
(function () {
  const src = lire('index.html');
  verifier('index.html — bandeau « patients fictifs uniquement »',
    /patients fictifs uniquement/i.test(src));
  verifier('index.html — noindex actif',
    /name="robots"\s+content="noindex/i.test(src));
  verifier('index.html — mention de l’absence de certification HDS',
    /non\s+certifi/i.test(src));
})();

/* ------------------------------------------------------------------
   7. Couche de données isolée pour la migration HDS
------------------------------------------------------------------- */
(function () {
  const code = codeSeul(lire('app.js'));
  const n = (code.match(/localStorage/g) || []).length;
  verifier('app.js — stockage confiné dans Store (' + n + ' accès)',
    n === 3,
    n !== 3 ? 'Trois accès attendus, tous dans Store. La migration HDS ne doit toucher qu’un seul endroit du code.' : null);
})();

/* ------------------------------------------------------------------
   8. Aucune ressource externe
------------------------------------------------------------------- */
(function () {
  ['index.html', 'style.css'].forEach(f => {
    const src = lire(f);
    const ext = src.match(/(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    verifier(f + ' — aucune ressource externe chargée', ext.length === 0,
      ext.length ? 'Domaines référencés : ' + [...new Set(ext)].join(', ') : null);
  });
})();

/* ------------------------------------------------------------------ */
console.log('');
if (echecs === 0) {
  console.log('\x1b[32m' + controles + ' contrôles, aucun échec.\x1b[0m');
  console.log('La version reste hors du champ du calcul. Publication possible.\n');
  process.exit(0);
}
console.log('\x1b[31m' + echecs + ' échec(s) sur ' + controles + ' contrôles.\x1b[0m');
console.log('Ne pas publier avant correction.\n');
process.exit(1);
