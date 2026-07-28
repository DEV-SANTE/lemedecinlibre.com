#!/usr/bin/env node
/* =====================================================================
   TEST DE NON-RÉGRESSION — PLATEFORME DE PRÉVENTION
   À exécuter avant chaque publication :   node verifier.js

   Ce test protège la contrainte structurante du projet : la version 1
   ne doit produire aucune information propre à un patient donné à des
   fins de décision médicale. Un logiciel qui calcule un score validé,
   le compare à un seuil et en tire une conséquence relève selon toute
   vraisemblance de la classe IIa au sens du règlement (UE) 2017/745.

   MÉTHODE
   Le test analyse le code EXÉCUTABLE seulement : il retire d'abord les
   commentaires et les chaînes de caractères, puis cherche des noms
   d'identifiants interdits dans ce qui reste. « Seuil publié de
   repérage » dans une chaîne est du contenu documentaire, autorisé.
   Une variable nommée `seuil` est un calcul, interdit. Le mot est le
   même, le régime ne l'est pas.

   PÉRIMÈTRES
   - Périmètre CLINIQUE (interdiction de calculer) : la vue médecin,
     la définition des questionnaires, l'espace patient et ses modules.
   - Périmètre AGRÉGÉ (calcul autorisé) : le tableau de bord de
     contrôle interne. Le dossier de reprise autorise explicitement les
     statistiques agrégées et anonymisées. Ce périmètre est soumis à des
     contrôles différents : pas de lecture nominative, pas de réécriture
     vers un dossier.

   Si ce test échoue, ne publiez pas : soit le code a franchi la ligne,
   soit la ligne a été déplacée sciemment — et dans ce second cas le
   dossier de marquage CE doit être ouvert d'abord.
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
let echecs = 0, controles = 0;

const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const existe = f => fs.existsSync(path.join(RACINE, f));

function sansCommentaires(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');
}
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
function section(t) { console.log('\n\x1b[1m' + t + '\x1b[0m'); }

/* Périmètre clinique */
const CLINIQUE = [
  'plateforme/app.js',
  'plateforme/questionnaire.js',
  'espace/patient.js',
  'espace/modules.js'
];
/* Périmètre agrégé */
const AGREGE = ['pilotage/pilotage.js'];

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

console.log('\nPlateforme de prévention — contrôle avant publication');

/* ==================================================================
   1. PÉRIMÈTRE CLINIQUE — aucun calcul
================================================================== */
section('1. Périmètre clinique — interdiction de calculer');

CLINIQUE.forEach(f => {
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const code = codeSeul(lire(f));
  const trouves = INTERDITS.filter(j =>
    new RegExp('\\b' + j.replace('(', '\\(') + '\\b', 'i').test(code));
  verifier(f + ' — aucun identifiant de calcul (' + INTERDITS.length + ' motifs)',
    trouves.length === 0,
    trouves.length ? 'Trouvés dans le code exécutable : ' + trouves.join(', ') : null);
});

CLINIQUE.forEach(f => {
  if (!existe(f)) return;
  const code = codeSeul(lire(f));
  const m = code.match(/reponses\s*(\[[^\]]*\]|\.[A-Za-z_$][\w$]*)\s*(>=|<=|>|<)/g);
  verifier(f + ' — aucune comparaison numérique sur une réponse de santé',
    !m, m ? 'Comparaisons : ' + m.join(' | ') : null);
});

(function () {
  const code = codeSeul(lire('plateforme/questionnaire.js'));
  const ADMISES = ['sexe', 'ageMin', 'ageMax'];
  const re = /showIf:\s*\{([^}]*)\}/g;
  let m, mauvaises = [], nb = 0;
  while ((m = re.exec(code)) !== null) {
    nb++;
    m[1].split(',').forEach(p => {
      const cle = p.split(':')[0].trim();
      if (cle && ADMISES.indexOf(cle) === -1) mauvaises.push(cle);
    });
  }
  verifier('questionnaire.js — ' + nb + ' condition(s) showIf, toutes structurelles',
    mauvaises.length === 0,
    mauvaises.length ? 'Clés non structurelles : ' + [...new Set(mauvaises)].join(', ') : null);
})();

(function () {
  const code = codeSeul(lire('plateforme/questionnaire.js'));
  const bad = ['formule:', 'compute:', 'calcul:', 'points:', 'ponderation:', 'coefficient:']
    .filter(k => code.indexOf(k) !== -1);
  verifier('questionnaire.js — aucun champ de formule ou de pondération',
    bad.length === 0, bad.length ? 'Champs : ' + bad.join(', ') : null);
})();

(function () {
  const css = lire('plateforme/style.css').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const bad = ['.anormal', '.alerte', '.severe', '.eleve', '.critique', '.rouge', '.danger', '.risque']
    .filter(k => css.indexOf(k) !== -1);
  verifier('plateforme/style.css — aucune classe codant une gravité clinique',
    bad.length === 0, bad.length ? 'Classes : ' + bad.join(', ') : null);
})();

/* ==================================================================
   2. LIBRE CHOIX — aucun partenaire présélectionné
================================================================== */
section('2. Libre choix du centre et du laboratoire');

(function () {
  const src = lire('espace/modules.js');

  /* Aucun `checked` inconditionnel sur les listes de partenaires. */
  const dur = /(name="(?:centre|labo)"[^>]*\schecked(?!\s*\$|\s*\?))/.test(src.replace(/\$\{[^}]*\}/g, '${}'));
  verifier('modules.js — aucune présélection en dur du centre ou du laboratoire', !dur,
    dur ? 'Un attribut checked non conditionnel a été trouvé sur une liste de partenaires.' : null);

  verifier('modules.js — tri neutre imposé pour les listes de partenaires',
    /function\s+triNeutre/.test(src) && /triNeutre\(CENTRES_TEST\)/.test(src) && /triNeutre\(LABOS_TEST\)/.test(src));

  const horsGroupe = (src.match(/groupe:\s*false/g) || []).length;
  verifier('modules.js — présence de partenaires hors groupe (' + horsGroupe + ')',
    horsGroupe >= 2,
    horsGroupe < 2 ? 'Le référencement doit être ouvert et le démontrer : au moins deux partenaires indépendants.' : null);

  verifier('modules.js — aucun tri par appartenance au groupe',
    !/sort\([^)]*\.groupe/.test(codeSeul(src)));
})();

/* ==================================================================
   3. DEVIS HORS NOMENCLATURE
================================================================== */
section('3. Devis hors nomenclature');

(function () {
  const src = lire('espace/modules.js');
  verifier('modules.js — mention explicite de l’absence de prise en charge',
    /Aucune prise en charge/i.test(src) && /n’est rembours|n'est rembours/i.test(src));
  verifier('modules.js — signature horodatée du devis',
    /signature\s*=\s*\{[^}]*date:/.test(src.replace(/\n/g, ' ')));
  verifier('modules.js — refus proposé au même niveau que l’acceptation',
    /id="acc-/.test(src) && /id="ref-/.test(src));
})();

/* ==================================================================
   4. FACTURATION — garde exécutée réellement
================================================================== */
section('4. Séparation de facturation');

(function () {
  const src = lire('espace/modules.js');
  /* On extrait et exécute la fonction pour vérifier qu'elle refuse
     réellement une facture mixte, au lieu de faire confiance au texte. */
  const m = src.match(/function emettreFacture[\s\S]*?\n\}/);
  if (!m) { verifier('modules.js — fonction emettreFacture présente', false); return; }

  const FLUXdef = src.match(/const FLUX = \{[\s\S]*?\n\};/);
  let fn;
  try {
    fn = new Function(FLUXdef[0] + '\n' + m[0] + '\nreturn emettreFacture;')();
  } catch (e) {
    verifier('modules.js — emettreFacture exécutable', false, e.message); return;
  }

  verifier('modules.js — emettreFacture exécutable', true);

  let refuse = false, msg = '';
  try {
    fn('abonnement', [
      { libelle: 'Abonnement', montant: 129, flux: 'abonnement' },
      { libelle: 'Consultation', montant: 30, flux: 'actes' }
    ]);
  } catch (e) { refuse = true; msg = e.message; }
  verifier('facture mixte abonnement + actes → refusée', refuse,
    refuse ? null : 'La garde n’a pas fonctionné : une facture mixte a été produite.');

  let refuse2 = false;
  try {
    fn('actes', [{ libelle: 'Analyse HN', montant: 22, flux: 'hors_nomenclature' }]);
  } catch (e) { refuse2 = true; }
  verifier('ligne hors nomenclature dans une facture d’actes → refusée', refuse2);

  let ok = false;
  try {
    const f = fn('abonnement', [{ libelle: 'Abonnement', montant: 129, flux: 'abonnement' }]);
    ok = f && f.total === 129 && f.flux === 'abonnement';
  } catch (e) {}
  verifier('facture mono-flux → acceptée', ok);

  verifier('modules.js — récapitulatif de parcours explicitement non contractuel',
    /contractuel:\s*false/.test(src) && /non contractuel/i.test(src));
})();

/* ==================================================================
   5. PÉRIMÈTRE AGRÉGÉ — calcul autorisé, sous conditions
================================================================== */
section('5. Tableau de bord — calcul autorisé, anonymat exigé');

AGREGE.forEach(f => {
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const code = codeSeul(lire(f));

  /* Interdit : lire une identité. */
  const nominatif = /\b(nom|prenom|email|nir|nss|dateNaissance)\b/i.test(code);
  verifier(f + ' — aucune lecture de donnée nominative', !nominatif,
    nominatif ? 'Un champ d’identité est référencé dans le code exécutable.' : null);

  /* Interdit : réécrire vers un dossier ou un stockage patient. */
  const ecrit = /localStorage|sessionStorage|setItem/.test(code);
  verifier(f + ' — aucune écriture vers un stockage patient', !ecrit,
    ecrit ? 'Le tableau de bord doit rester en lecture seule.' : null);

  /* Exigé : le calcul agrégé existe bien. */
  verifier(f + ' — agrégation de population présente',
    /function\s+taux\b/.test(code) && /function\s+moyenne\b/.test(code));
});

/* ==================================================================
   5 bis. PORTAIL ENTREPRISE — seuil anti-réidentification
================================================================== */
section('5 bis. Portail entreprise — anonymat et seuil');

(function () {
  const f = 'entreprise/entreprise.js';
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const src = lire(f);
  const code = codeSeul(src);

  /* Le seuil doit exister, être une constante, et valoir au moins 11. */
  const m = src.match(/const\s+SEUIL_PUBLICATION\s*=\s*(\d+)/);
  verifier(f + ' — seuil de publication déclaré' + (m ? ' (' + m[1] + ')' : ''),
    !!m && parseInt(m[1], 10) >= 11,
    !m ? 'Aucune constante SEUIL_PUBLICATION.' :
      (parseInt(m[1], 10) < 11 ? 'Seuil trop bas : onze est le minimum retenu.' : null));

  /* La garde doit s'appliquer avant tout calcul de pourcentage. */
  verifier(f + ' — la fonction publier() bloque avant de calculer',
    /function publier[\s\S]{0,400}?<\s*SEUIL_PUBLICATION[\s\S]{0,120}?publie:\s*false/.test(src),
    'La comparaison au seuil doit précéder le calcul et renvoyer publie:false.');

  /* Aucun champ nominatif. */
  const nominatif = /\b(nom|prenom|email|nir|nss|salarieId|matricule)\b/i
    .test(code.replace(/\bnom:/g, 'libelleEntreprise:'));
  verifier(f + ' — aucun champ nominatif de personne', !nominatif,
    nominatif ? 'Un identifiant de personne est référencé.' : null);

  /* Aucune lecture de dossier patient ni de stockage. */
  const fuite = /localStorage|sessionStorage|reponses|dossier/.test(code);
  verifier(f + ' — aucun accès aux dossiers ni au stockage patient', !fuite,
    fuite ? 'Le portail ne doit recevoir que des compteurs déjà agrégés.' : null);

  /* Démonstration du seuil : une entreprise sous le seuil doit exister. */
  const petits = (src.match(/participants:\s*(\d+)/g) || [])
    .map(s => parseInt(s.replace(/\D/g, ''), 10)).filter(n => n < 11);
  verifier(f + ' — un cas sous le seuil est présent pour démonstration',
    petits.length >= 1,
    petits.length ? null : 'Ajouter un exemple d’effectif faible pour prouver la suppression.');
})();

/* ==================================================================
   5 quater. TABLEAU DE BORD DE SUIVI — historisation sans interprétation
================================================================== */
section('5 quater. Suivi patient — historiser sans interpréter');

(function () {
  const f = 'suivi/suivi.js';
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const src = lire(f);
  const code = codeSeul(src);

  /* Interdit : le moindre identifiant de comparaison ou de qualification. */
  const trouves = INTERDITS.filter(j =>
    new RegExp('\\b' + j.replace('(', '\\(') + '\\b', 'i').test(code));
  verifier(f + ' — aucun identifiant de calcul clinique', trouves.length === 0,
    trouves.length ? 'Trouvés : ' + trouves.join(', ') : null);

  /* Interdit : une bande ou un intervalle de référence dessiné. */
  const bande = /\b(refMin|refMax|borneMin|borneMax|intervalleRef|normeMin|normeMax|zoneNormale)\b/i.test(code);
  verifier(f + ' — aucun intervalle de référence dans les données', !bande,
    bande ? 'Les intervalles de référence appartiennent au compte rendu du laboratoire.' : null);

  /* Interdit : qualifier une évolution. */
  const tendance = /\b(amelioration|degradation|tendance|enHausse|enBaisse|variation\s*>)\b/i.test(code);
  verifier(f + ' — aucune qualification de l’évolution', !tendance,
    tendance ? 'Dire qu’une valeur s’améliore ou se dégrade est une interprétation.' : null);

  /* Le CSS ne doit contenir aucune palette d'état de santé. */
  const css = lire('suivi/index.html').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const pal = ['.normal', '.anormal', '.eleve', '.bas', '.alerte', '.danger', '.bon', '.mauvais']
    .filter(k => css.indexOf(k) !== -1);
  verifier('suivi/index.html — aucune classe codant un état de santé', pal.length === 0,
    pal.length ? 'Classes : ' + pal.join(', ') : null);

  /* Exigé : la mention qui explique le choix, et le renvoi au laboratoire. */
  verifier(f + ' — renvoi explicite au compte rendu du laboratoire',
    /intervalles de r[éé]f[éé]rence[\s\S]{0,120}laboratoire/i.test(src));
  verifier(f + ' — segments droits assumés et documentés',
    /segments droits/i.test(src));
})();

/* ==================================================================
   5 ter. CONTENU ÉDUCATIF — aucune individualisation
================================================================== */
section('5 ter. Contenu éducatif — non individualisé');

(function () {
  const f = 'contenus/contenus.js';
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const code = codeSeul(lire(f));

  const lit = /\b(reponses|dossier|dossiers|compte|localStorage|sessionStorage)\b/.test(code);
  verifier(f + ' — ne lit aucune donnée patient', !lit,
    lit ? 'Une bibliothèque individualisée produirait une information propre à un patient.' : null);

  const filtre = /\.(filter|find|sort)\s*\([^)]*\b(reponses|profil|score|age|sexe)\b/.test(code);
  verifier(f + ' — aucun filtrage ni tri selon un profil', !filtre,
    filtre ? 'Les contenus doivent rester identiques et dans le même ordre pour tous.' : null);

  verifier(f + ' — mention explicite de la non-individualisation',
    /identiques pour tous|jamais s[ée]lectionn/i.test(lire(f)));
})();

/* ==================================================================
   6. GARDE-FOUS DE L'ENVIRONNEMENT DE TEST
================================================================== */
section('6. Garde-fous de l’environnement de test');

[['plateforme/index.html', 'patients fictifs uniquement'],
 ['espace/index.html', 'Environnement de test'],
 ['pilotage/index.html', 'Cohorte fictive'],
 ['entreprise/index.html', 'Données fictives'],
 ['contenus/index.html', 'Contenus provisoires'],
 ['suivi/index.html', 'données fictives']].forEach(([f, motif]) => {
  const src = lire(f);
  verifier(f + ' — bandeau de test présent', new RegExp(motif, 'i').test(src));
  verifier(f + ' — noindex actif', /name="robots"\s+content="noindex/i.test(src));
});

verifier('plateforme/index.html — mention de l’absence de certification HDS',
  /non\s+certifi/i.test(lire('plateforme/index.html')));

(function () {
  const code = codeSeul(lire('plateforme/app.js'));
  const n = (code.match(/localStorage/g) || []).length;
  verifier('plateforme/app.js — stockage confiné dans Store (' + n + ' accès)', n === 3,
    n !== 3 ? 'Trois accès attendus, tous dans Store.' : null);
})();

(function () {
  const code = codeSeul(lire('espace/patient.js'));
  const n = (code.match(/localStorage/g) || []).length;
  verifier('espace/patient.js — stockage confiné dans Db (' + n + ' accès)', n === 5,
    n !== 5 ? 'Cinq accès attendus, tous dans Db.' : null);
})();

(function () {
  const code = codeSeul(lire('espace/modules.js'));
  const n = (code.match(/localStorage/g) || []).length;
  verifier('espace/modules.js — aucun accès direct au stockage', n === 0,
    n !== 0 ? 'Les modules doivent passer par le contexte fourni par patient.js.' : null);
})();

/* ==================================================================
   7. AUCUNE RESSOURCE EXTERNE
================================================================== */
section('7. Aucune ressource externe');

['index.html', 'plateforme/index.html', 'plateforme/style.css',
 'espace/index.html', 'pilotage/index.html',
 'entreprise/index.html', 'contenus/index.html', 'suivi/index.html'].forEach(f => {
  const src = lire(f);
  const ext = (src.match(/(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .filter(u => !/w3\.org/.test(u));
  verifier(f + ' — aucune ressource externe', ext.length === 0,
    ext.length ? 'Domaines : ' + [...new Set(ext)].join(', ') : null);
});

/* ================================================================== */
console.log('');
if (echecs === 0) {
  console.log('\x1b[32m' + controles + ' contrôles, aucun échec.\x1b[0m');
  console.log('La version reste hors du champ du calcul clinique. Publication possible.\n');
  process.exit(0);
}
console.log('\x1b[31m' + echecs + ' échec(s) sur ' + controles + ' contrôles.\x1b[0m');
console.log('Ne pas publier avant correction.\n');
process.exit(1);
