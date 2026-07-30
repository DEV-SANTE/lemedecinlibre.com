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

/* ------------------------------------------------------------------
   COULEUR ÉVALUATIVE : PERMISE SI HUMAINE, INTERDITE SI AUTOMATIQUE

   La règle a changé, et c'est un assouplissement fondé. Le logiciel ne
   peut pas colorer une réponse selon sa valeur. Un médecin, lui, peut
   colorer ce qu'il veut : la couleur est alors l'expression de sa
   conclusion, pas celle d'un calcul.

   On ne vérifie donc plus l'absence de couleur évaluative, mais son
   ORIGINE. Trois contrôles remplacent l'ancien.
------------------------------------------------------------------- */
section('1 bis. Couleur évaluative — origine humaine obligatoire');

(function () {
  /* 1. Aucune fonction ne doit dériver une couleur d'une valeur. */
  ['plateforme/app.js', 'suivi/suivi.js', 'espace/modules.js'].forEach(f => {
    if (!existe(f)) return;
    const code = codeSeul(lire(f));
    const motifs = [
      /function\s+couleur[A-Za-z]*\s*\([^)]*valeur/i,
      /couleurPour|couleurDe[Ll]aValeur|teintePour|classePourValeur/i,
      /(reponses|valeurs?)\s*(\[[^\]]*\]|\.[\w$]+)\s*[><=]{1,3}[^;]{0,60}\?[^;]{0,40}(rouge|orange|vert)/i,
      /\?\s*['"](rouge|orange|vert)['"]\s*:/i
    ];
    const trouves = motifs.filter(r => r.test(code));
    verifier(f + ' — aucune couleur dérivée d’une valeur', trouves.length === 0,
      trouves.length ? 'Un motif de coloration automatique a été détecté.' : null);
  });

  /* 2. Toute couleur évaluative doit vivre dans un contexte de marque. */
  [['plateforme/style.css', 'marque-medecin'], ['suivi/index.html', 'mqm']].forEach(([f, ctx]) => {
    const src = lire(f);
    const css = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
    /* Les trois seules classes de teinte admises sont m-vert, m-orange, m-rouge. */
    const teintes = (css.match(/\.m-(vert|orange|rouge)\b/g) || []).length;
    const sauvages = ['.anormal', '.alerte', '.severe', '.eleve', '.critique', '.danger', '.risque']
      .filter(k => css.indexOf(k) !== -1);
    verifier(f + ' — teintes évaluatives limitées à m-vert, m-orange, m-rouge (' + teintes + ')',
      teintes >= 3 && sauvages.length === 0,
      sauvages.length ? 'Classes non encadrées : ' + sauvages.join(', ')
        : (teintes < 3 ? 'Les trois teintes de marque sont attendues.' : null));
    verifier(f + ' — contexte de marque « ' + ctx + ' » présent',
      css.indexOf(ctx) !== -1,
      'Les teintes doivent être portées par un conteneur de marque identifiable.');
  });

  /* 3. Toute marque doit être signée et horodatée, sans valeur de repli. */
  (function () {
    const src = lire('plateforme/app.js');
    verifier('app.js — la couleur est un paramètre obligatoire, sans repli',
      /function poserMarque\([^)]*couleur[^)]*\)/.test(src) &&
      /if\s*\(!couleur\)\s*throw/.test(src),
      'poserMarque doit refuser une couleur absente, ce qui interdit toute couleur par défaut.');
    verifier('app.js — la marque refuse d’être enregistrée sans auteur',
      /if\s*\(!medecin\)\s*throw/.test(src));
    verifier('app.js — la marque porte un horodatage',
      /marques\[qid\]\s*=\s*\{[\s\S]{0,220}date:\s*horodatage\(\)/.test(src));
    /* Le seul « checked » du formulaire de marquage doit être commandé
       par une marque déjà enregistrée. On exige la condition explicite,
       et on refuse tout « checked » inconditionnel. */
    const radio = (src.match(/name="mq-\$\{[^}]*\}"[^>]*>/) || [''])[0];
    const conditionnel = /mq\s*&&\s*mq\.couleur\s*===\s*c\.v\s*\?\s*'checked'/.test(radio);
    const enDur = /\schecked(?![^>]*\?)/.test(radio.replace(/\$\{[^}]*\}/g, '${}'));
    verifier('app.js — aucune couleur préremplie dans le formulaire',
      conditionnel && !enDur,
      !conditionnel ? 'Le « checked » doit être conditionné à une marque existante.'
        : 'Un « checked » inconditionnel a été trouvé.');
  })();

  /* 4. Côté patient, une marque sans auteur ne doit pas être rendue.
     Le contrôle de complétude est centralisé dans Biologie.lire() : on
     vérifie donc qu'il existe là, et que suivi.js passe bien par lui au
     lieu de lire le stockage en direct. */
  (function () {
    const src = lire('suivi/suivi.js');
    const bio = lire('plateforme/biologie.js');
    verifier('biologie.js — marque sans couleur, auteur ou date non restituée',
      /if\s*\(!m\.couleur\s*\|\|\s*!m\.medecin\s*\|\|\s*!m\.date\)\s*return null/.test(bio));
    verifier('suivi.js — passe par Biologie.lire et ne lit pas les marques en direct',
      /Biologie\.(derniere|duParametre|lire)\(/.test(src) && !/marquesBio\s*\[/.test(src),
      'Le suivi doit passer par le module pour bénéficier du contrôle de complétude.');
    verifier('suivi.js — attribution au médecin affichée avec la marque',
      /Note de votre m[éé]decin/.test(src) && /m\.medecin/.test(src));
  })();
})();

/* ==================================================================
   1 quater. BIOLOGIE — marquage par valeur datée, sans intervalle
================================================================== */
section('1 quater. Biologie — annoter sans comparer');

(function () {
  const f = 'plateforme/biologie.js';
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const src = lire(f);
  const code = codeSeul(src);

  /* Aucun intervalle de référence stocké : c'est le point central.
     Un intervalle stocké permettrait au logiciel de comparer, même si
     c'est un médecin qui l'a saisi. */
  const bornes = /\b(refMin|refMax|borneMin|borneMax|normeMin|normeMax|intervalle|normale?s?\s*[:=])\b/i
    .test(code);
  verifier(f + ' — aucun intervalle de référence stocké', !bornes,
    bornes ? 'Un intervalle permettrait une comparaison automatique et continue.' : null);

  /* Aucune arithmétique ni comparaison sur les valeurs. */
  const calc = [/valeurs?\s*(\[[^\]]*\]|\.[\w$]+)\s*[><=+\-*/]{1,3}/, /\breduce\s*\(/]
    .filter(r => r.test(code));
  verifier(f + ' — aucune arithmétique ni comparaison sur les valeurs', calc.length === 0);

  /* Aucun identifiant de calcul. */
  const trouves = INTERDITS.filter(j =>
    new RegExp('\\b' + j.replace('(', '\\(') + '\\b', 'i').test(code));
  verifier(f + ' — aucun identifiant de calcul', trouves.length === 0,
    trouves.length ? 'Trouvés : ' + trouves.join(', ') : null);

  /* Garanties de la pose de marque. */
  verifier(f + ' — couleur obligatoire, sans repli',
    /if\s*\(!couleur\)\s*throw/.test(src));
  verifier(f + ' — couleur restreinte à la liste admise',
    /BIO_COULEURS\.some\([^)]*\)\)\s*throw/.test(src));
  verifier(f + ' — auteur obligatoire',
    /if\s*\(!medecin\)\s*throw/.test(src));
  verifier(f + ' — marque incomplète non restituée',
    /if\s*\(!m\.couleur\s*\|\|\s*!m\.medecin\s*\|\|\s*!m\.date\)\s*return null/.test(src));
  verifier(f + ' — la marque porte le paramètre et la date de la valeur',
    /parametre:\s*paramId/.test(src) && /dateValeur:\s*dateIso/.test(src));
  verifier(f + ' — aucun tri par couleur ni par gravité',
    !/sort\([^)]*couleur/.test(code));

  /* La palette des familles reste à dominante bleue. */
  const bloc = src.match(/const BIO_FAMILLES = \[[\s\S]*?\n\];/);
  if (bloc) {
    const hex = (bloc[0].match(/#([0-9a-f]{6})\b/gi) || []).map(h => h.slice(1));
    const fautives = hex.filter(h => {
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      return !(b > r && b >= g);
    });
    verifier(f + ' — palette des familles à dominante bleue (' + hex.length + ')',
      hex.length >= 4 && fautives.length === 0,
      fautives.length ? 'Teintes évaluatives : #' + fautives.join(', #') : null);
  }

  /* Le suivi patient doit LIRE les marques, pas les écrire en dur. */
  (function () {
    const s = lire('suivi/suivi.js');
    verifier('suivi.js — marques lues dans le dossier, non écrites en dur',
      /Biologie\.(derniere|duParametre)\(/.test(s) && !/MARQUES_MEDECIN\s*=/.test(s),
      'Les marques affichées au patient doivent venir du stockage partagé.');
    verifier('suivi.js — paramètres et dates issus de la source partagée',
      /const DATES\s*=\s*BIO_DATES/.test(s) && /const PARAMETRES\s*=\s*BIO_PARAMETRES/.test(s));
    verifier('suivi/index.html — module biologie chargé',
      /biologie\.js/.test(lire('suivi/index.html')));
  })();
})();

/* ==================================================================
   1 ter. COMPOSANT CERTIFIÉ — le bouchon doit échouer, pas simuler
================================================================== */
section('1 ter. Composant certifié — délégation du calcul');

(function () {
  const f = 'plateforme/calculateur.js';
  if (!existe(f)) { verifier(f + ' — fichier présent', false, 'Fichier introuvable.'); return; }
  const src = lire(f);
  const code = codeSeul(src);

  /* Aucun identifiant de calcul. */
  const trouves = INTERDITS.filter(j =>
    new RegExp('\\b' + j.replace('(', '\\(') + '\\b', 'i').test(code));
  verifier(f + ' — aucun identifiant de calcul', trouves.length === 0,
    trouves.length ? 'Trouvés : ' + trouves.join(', ') : null);

  /* AUCUNE ARITHMÉTIQUE sur les réponses. C'est le contrôle central de
     ce fichier : un bouchon qui calcule finirait en production. */
  const arith = [
    /reponses\s*(\[[^\]]*\]|\.[\w$]+)\s*[+\-*/]/,
    /\breduce\s*\(/,
    /somme|total\s*\+=|\+\=\s*Number/i
  ].filter(r => r.test(code));
  verifier(f + ' — aucune arithmétique sur les réponses du patient', arith.length === 0,
    arith.length ? 'Le bouchon doit échouer, jamais simuler un calcul.' : null);

  /* Aucun barème ni seuil embarqué : ils appartiennent au composant. */
  const bareme = /(bareme|ponderation|coefficients?\s*[:=]\s*\[|tranches?\s*[:=]\s*\[)/i.test(code);
  verifier(f + ' — aucun barème ni pondération embarqués', !bareme,
    bareme ? 'Les barèmes appartiennent au composant certifié, pas à la plateforme.' : null);

  /* Le bouchon doit renvoyer une indisponibilité explicite. */
  verifier(f + ' — le bouchon renvoie une indisponibilité',
    /function appelerComposant[\s\S]{0,400}disponible:\s*false/.test(src),
    'appelerComposant() doit se résoudre en indisponibilité tant qu’aucun composant n’est branché.');

  /* Le composant est inactif par défaut. */
  verifier(f + ' — composant inactif par défaut',
    /actif:\s*false/.test(src),
    'COMPOSANT.actif doit valoir false jusqu’au branchement effectif.');

  /* Provenance obligatoire à la saisie manuelle. */
  verifier(f + ' — outil obligatoire à la saisie manuelle',
    /if\s*\(!outil\)\s*throw/.test(src));
  verifier(f + ' — auteur obligatoire à la saisie manuelle',
    /if\s*\(!auteur\)\s*throw/.test(src));
  verifier(f + ' — score sans provenance complète non restitué',
    /if\s*\(!s\.outil\s*\|\|\s*!s\.auteur\s*\|\|\s*!s\.date\)\s*return null/.test(src));

  /* Point d'intégration unique : app.js ne doit pas court-circuiter.
     On analyse ici la source sans commentaires mais AVEC les chaînes :
     app.js est truffé de gabarits imbriqués que le dépouillement des
     littéraux abîme, et l'on cherche des appels de méthode, pas des
     identifiants susceptibles de se cacher dans une chaîne. */
  const app = sansCommentaires(lire('plateforme/app.js'));
  const passeParModule = /Calculateur\.(saisir|lire|instruments|entreesDisponibles|disponible|configure|retirer)/.test(app);
  const calculeSeul = /function\s+calcul[a-zA-Z]*\s*\(/i.test(app);
  verifier('app.js — passe par Calculateur et ne calcule aucun score',
    passeParModule && !calculeSeul,
    !passeParModule ? 'Aucun appel au module Calculateur détecté.'
      : 'Une fonction de calcul a été trouvée dans app.js.');
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

  /* Le CSS ne doit contenir aucune palette d'état de santé appliquée
     automatiquement. Les marques du médecin sont contrôlées en §1 bis. */
  const css = lire('suivi/index.html').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const pal = ['.normal', '.anormal', '.eleve', '.bas', '.alerte', '.danger', '.bon', '.mauvais']
    .filter(k => css.indexOf(k) !== -1);
  verifier('suivi/index.html — aucune classe codant un état de santé automatique', pal.length === 0,
    pal.length ? 'Classes : ' + pal.join(', ') : null);

  /* Exigé : la mention qui explique le choix, et le renvoi au laboratoire. */
  verifier(f + ' — renvoi explicite au compte rendu du laboratoire',
    /intervalles de r[éé]f[éé]rence[\s\S]{0,120}laboratoire/i.test(src));
  verifier(f + ' — segments droits assumés et documentés',
    /segments droits/i.test(src));

  /* LA COULEUR NE DOIT PAS POUVOIR SE LIRE COMME UNE ÉVALUATION.
     La palette des familles est désormais définie une seule fois, dans
     plateforme/biologie.js, et contrôlée en §1 quater. On vérifie ici
     que suivi.js ne la redéfinit pas localement — une seconde palette
     pourrait dériver et introduire une teinte évaluative sans que le
     contrôle central s'en aperçoive. */
  const redefinit = /const\s+FAMILLES\s*=\s*\[/.test(src);
  verifier(f + ' — ne redéfinit pas la palette, utilise la source partagée',
    !redefinit && /const\s+FAMILLES\s*=\s*BIO_FAMILLES/.test(src),
    redefinit ? 'Une palette locale a été trouvée : elle échapperait au contrôle central.'
      : 'La palette doit être reprise de BIO_FAMILLES.');

  /* La superposition ne doit être possible qu'à unité identique.
     Deux garanties attendues : le filtre qui construit la liste des
     paramètres proposés, et le contrôle au moment du tracé. */
  const filtre = /memeUnite\s*=[\s\S]{0,160}?x\.unite\s*===\s*p\.unite/.test(src);
  const garde = /alt\.unite\s*===\s*p\.unite/.test(src);
  verifier(f + ' — superposition restreinte à une unité identique', filtre && garde,
    !filtre ? 'Le filtre memeUnite() ne compare pas les unités.'
      : (!garde ? 'Aucun contrôle d’unité au moment du tracé.' : null));
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
   7. RESSOURCES EXTERNES

   La règle a changé le jour où des photographies ont été ajoutées, et
   elle a été resserrée plutôt qu'assouplie.

   Avant : aucune ressource externe nulle part.
   Maintenant : aucun script, aucune feuille de style, aucune police et
   aucun cadre distant NULLE PART — y compris sur la page publique, car
   ce sont ces ressources-là qui déposent des cookies et exécutent du
   code tiers. Et aucune image distante nulle part SAUF sur la page
   publique, où cinq photographies déclarées sont admises.

   La distinction n'est pas cosmétique. Une image distante ne dépose pas
   de cookie et n'exécute rien, mais elle révèle une adresse IP à un
   tiers. Sur une page qui affiche un dossier médical, cette seule
   requête indique qu'une personne consulte des données de santé. C'est
   pour cela que le périmètre est verrouillé ici et non laissé à la
   vigilance de celui qui écrira la page suivante.
================================================================== */
section('7. Ressources externes');

const VISUELS = require('../commun/visuels.js');

/* --- 7.1 Aucun script, style, police ou cadre distant, aucune page --- */
['index.html', 'plateforme/index.html', 'plateforme/style.css',
 'espace/index.html', 'pilotage/index.html', 'entreprise/index.html',
 'contenus/index.html', 'suivi/index.html',
 'commun/navigation.js', 'commun/visuels.js', 'commun/lexique.js',
 'commun/themes.js'].forEach(f => {
  const src = lire(f);
  const fautes = [];
  if (/<script[^>]+src\s*=\s*["'](?:https?:)?\/\//i.test(src)) fautes.push('script distant');
  if (/<link[^>]+href\s*=\s*["'](?:https?:)?\/\//i.test(src)) fautes.push('feuille de style ou préchargement distant');
  if (/@import/i.test(src)) fautes.push('@import');
  if (/@font-face/i.test(src)) fautes.push('@font-face');
  if (/<iframe|<embed|<object/i.test(src)) fautes.push('cadre incorporé');
  verifier(f + ' — aucun script, style, police ni cadre distant', fautes.length === 0,
    fautes.length ? fautes.join(', ') : null);
});

/* --- 7.2 Aucune image distante hors de la page publique --- */
['plateforme/index.html', 'plateforme/style.css', 'espace/index.html',
 'pilotage/index.html', 'entreprise/index.html', 'contenus/index.html',
 'suivi/index.html', 'commun/navigation.js', 'commun/lexique.js',
 'commun/themes.js'].forEach(f => {
  const src = lire(f);
  const ext = (src.match(/(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .filter(u => !/w3\.org/.test(u));
  verifier(f + ' — aucune ressource distante, image comprise', ext.length === 0,
    ext.length ? 'Domaines : ' + [...new Set(ext)].join(', ')
      + ' — une page qui affiche des données de santé ne doit rien demander à un tiers.' : null);
});

/* --- 7.3 Les images de la page publique sont conformes au catalogue --- */
(function () {
  const src = lire(VISUELS.pagePublique);
  const balises = src.match(/<img\b[^>]*>/gi) || [];

  verifier('index.html — autant d’images que de photographies déclarées (' +
    balises.length + '/' + VISUELS.photos.length + ')',
    balises.length === VISUELS.photos.length,
    balises.length !== VISUELS.photos.length
      ? 'Toute image affichée doit être déclarée dans commun/visuels.js, et inversement.' : null);

  const vus = [];
  balises.forEach((b, i) => {
    const rang = 'index.html — image ' + (i + 1);

    /* Toutes les origines de la balise, src et srcset confondus. */
    const urls = b.match(/https?:\/\/[^\s"',]+/g) || [];
    const hotes = [...new Set(urls.map(u => u.split('/')[2]))];
    const horsListe = hotes.filter(h => VISUELS.hotes.indexOf(h) === -1);
    verifier(rang + ' — origine en liste blanche', urls.length > 0 && horsListe.length === 0,
      horsListe.length ? 'Hôte non autorisé : ' + horsListe.join(', ') : null);

    /* Un seul identifiant par balise : src et srcset doivent viser la
       même photographie, sinon l'image affichée dépend de la largeur. */
    const ids = [...new Set((b.match(/photo-[0-9a-z]+-[0-9a-z]+/gi) || []))];
    verifier(rang + ' — src et srcset visent la même photographie', ids.length === 1,
      ids.length !== 1 ? 'Identifiants trouvés : ' + ids.join(', ') : null);

    const decl = ids.length === 1
      ? VISUELS.photos.filter(p => p.id === ids[0])[0] : null;
    verifier(rang + ' — déclarée dans commun/visuels.js', !!decl,
      !decl ? 'Identifiant absent du catalogue : ' + ids.join(', ') : null);
    if (decl) vus.push(decl.id);

    verifier(rang + ' — page de renvoi masquée (referrerpolicy)',
      /referrerpolicy\s*=\s*["']no-referrer["']/i.test(b),
      null);

    verifier(rang + ' — dimensions déclarées, pas de saut de mise en page',
      /\bwidth\s*=\s*["']?\d+/i.test(b) && /\bheight\s*=\s*["']?\d+/i.test(b));

    const alt = (b.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1];
    verifier(rang + ' — texte alternatif renseigné', !!alt && alt.trim().length > 12,
      !alt ? 'Attribut alt absent ou vide.' : null);

    if (decl) {
      const differe = /loading\s*=\s*["']lazy["']/i.test(b);
      verifier(rang + ' — chargement différé conforme au catalogue (' +
        (decl.differe ? 'différé attendu' : 'immédiat attendu') + ')',
        differe === decl.differe,
        differe !== decl.differe
          ? 'Le premier visuel doit être immédiat, les autres différés.' : null);
    }
  });

  /* Toute déclaration doit servir : un catalogue qui gonfle sans être
     affiché finirait par ne plus décrire la page. */
  const orphelines = VISUELS.photos.filter(p => vus.indexOf(p.id) === -1);
  verifier('commun/visuels.js — aucune déclaration inutilisée', orphelines.length === 0,
    orphelines.length ? 'Déclarées sans être affichées : '
      + orphelines.map(p => p.id).join(', ') : null);

  /* Un auteur non cité est une attribution perdue : la licence n'exige
     pas le crédit, mais le projet se l'impose. */
  VISUELS.photos.forEach(p => {
    verifier('index.html — auteur cité : ' + p.auteur,
      src.indexOf(p.auteur) !== -1 && src.indexOf(p.compte) !== -1,
      null);
  });

  /* Le pied de page doit dire ce qui est chargé et ce que ça implique.
     Une page qui promet « aucune ressource externe » alors qu'elle en
     charge cinq est plus dommageable que la fuite d'IP elle-même. */
  verifier('index.html — le pied de page ne promet plus l’absence de ressource externe',
    !/[Aa]ucune\s+ressource\s+externe\s+n['’]est\s+charg/i.test(src),
    null);
  verifier('index.html — la fuite d’adresse IP est écrite noir sur blanc',
    /adresse\s+IP/i.test(src));
})();

/* ==================================================================
   8. LES EXPLICATIONS NE PEUVENT PAS DEVENIR UNE INTERPRÉTATION

   Expliquer beaucoup est un progrès pour la personne, et un risque
   pour le périmètre. Le glissement est facile et il se ferait en une
   ligne : il suffirait qu'un texte change selon la valeur mesurée pour
   que la page produise une information propre à un patient à des fins
   de décision médicale — c'est-à-dire pour qu'elle sorte du cadre de la
   version 1. Les contrôles ci-dessous ferment cette porte.

   Trois verrous, de nature différente :
     - COUVERTURE : rien ne peut être affiché sans explication, et rien
       ne peut être expliqué sans être affiché.
     - CONTENU : aucun seuil chiffré, aucune affirmation sur le lecteur.
       Publier une valeur limite reviendrait à faire interpréter la
       personne à notre place, ce qui est le même acte déguisé.
     - STRUCTURE : les fonctions d'affichage ne reçoivent qu'un
       identifiant. La valeur ne leur est pas accessible, il n'y a donc
       rien à comparer, même par inadvertance.
================================================================== */
section('8. Explications non individualisées');

const LEXIQUE = require('../commun/lexique.js');

(function () {
  const srcBio = lire('plateforme/biologie.js');
  const srcSuivi = lire('suivi/suivi.js');
  const srcLex = lire('commun/lexique.js');

  /* Les contrôles de contenu portent sur ce qui est AFFICHÉ, donc sur le
     texte hors commentaires. L'en-tête du lexique énonce les interdits
     en les citant — « votre taux », « vous avez » — et se ferait
     évidemment refuser par ses propres règles. Un fichier qui ne peut
     pas documenter sa propre discipline finit par ne plus la documenter. */
  const texteLex = sansCommentaires(srcLex);

  /* --- 8.1 Un paramètre affiché sans explication est un paramètre
         que la personne ne peut pas comprendre. --- */
  const blocParam = (srcBio.match(/BIO_PARAMETRES\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
  const ids = (blocParam.match(/id:\s*'([a-z0-9]+)'/g) || [])
    .map(s => s.replace(/.*'([a-z0-9]+)'.*/, '$1'));

  verifier('biologie.js — identifiants de paramètres relus (' + ids.length + ')',
    ids.length >= 12, ids.length < 12 ? 'Extraction incomplète : contrôle non concluant.' : null);

  const CHAMPS = ['resume', 'quoi', 'pourquoi', 'comment', 'varie', 'limites', 'unite'];
  ids.forEach(id => {
    const e = LEXIQUE.parametres[id];
    verifier('lexique — ' + id + ' expliqué', !!e,
      !e ? 'Aucune explication : ce paramètre s’afficherait sans que la personne sache de quoi il s’agit.' : null);
    if (!e) return;
    const manquants = CHAMPS.filter(c => !e[c] || String(e[c]).trim().length < 12);
    verifier('lexique — ' + id + ' : sept rubriques renseignées', manquants.length === 0,
      manquants.length ? 'Rubriques vides ou trop courtes : ' + manquants.join(', ') : null);
  });

  /* --- 8.2 Et l'inverse : une explication orpheline décrirait une
         mesure qui n'existe plus, donc mentirait. --- */
  const orphelins = Object.keys(LEXIQUE.parametres).filter(k => ids.indexOf(k) === -1);
  verifier('lexique — aucune explication orpheline', orphelins.length === 0,
    orphelins.length ? 'Expliqués sans exister dans biologie.js : ' + orphelins.join(', ') : null);

  /* --- 8.3 Aucun seuil chiffré dans une unité biologique.
         Écrire un chiffre suivi de son unité fournirait au lecteur de
         quoi se juger seul : c'est déplacer l'interprétation, pas
         l'éviter. Les âges et les durées restent permis. --- */
  const UNITES = ['g/dL', 'µg/L', 'g/L', 'µmol/L', 'mmol/L', 'mUI/L', 'nmol/L',
                  'ng/mL', 'UI/L', 'mmHg', 'mg/L'];
  const motifUnite = new RegExp(
    '\\d+(?:[.,]\\d+)?\\s*(?:' + UNITES.map(u => u.replace(/[/]/g, '\\/')).join('|') + ')', 'g');
  const seuils = texteLex.match(motifUnite) || [];
  verifier('lexique.js — aucun seuil chiffré dans une unité biologique', seuils.length === 0,
    seuils.length ? 'Trouvé : ' + [...new Set(seuils)].join(', ')
      + ' — les intervalles de référence appartiennent au compte rendu du laboratoire.' : null);

  const comparaisons = texteLex.match(/(sup[eé]rieur|inf[eé]rieur|au-dessus|au-dessous)\s+(?:à\s+|de\s+)?\d/gi) || [];
  verifier('lexique.js — aucune comparaison chiffrée', comparaisons.length === 0,
    comparaisons.length ? 'Trouvé : ' + comparaisons.join(', ') : null);

  /* --- 8.4 Aucune affirmation sur le lecteur. Le « vous » est admis
         pour décrire un acte ou une consigne, jamais pour lui dire
         quelque chose sur son état. --- */
  const affirmations = texteLex.match(
    /votre\s+(taux|valeur|r[eé]sultat|chiffre|risque|bilan|score)|vous\s+(avez|pr[eé]sentez|souffrez|êtes\s+en)/gi) || [];
  verifier('lexique.js — aucune affirmation sur l’état du lecteur', affirmations.length === 0,
    affirmations.length ? 'Trouvé : ' + [...new Set(affirmations)].join(', ') : null);

  /* --- 8.5 Le lexique est statique : il ne lit aucun dossier. --- */
  const fuites = ['localStorage', 'sessionStorage', 'DOSSIER', 'dossierCourant', 'Biologie.']
    .filter(t => srcLex.indexOf(t) !== -1);
  verifier('lexique.js — aucun accès aux données d’une personne', fuites.length === 0,
    fuites.length ? 'Références trouvées : ' + fuites.join(', ') : null);

  /* --- 8.6 STRUCTURE : les fonctions d'affichage reçoivent un
         identifiant et rien d'autre. C'est ce contrôle qui empêche
         durablement le glissement, parce qu'il porte sur la forme du
         code et non sur le texte. --- */
  ['blocExplication', 'blocActe', 'blocDepistage'].forEach(fn => {
    const sig = new RegExp('function\\s+' + fn + '\\s*\\(([^)]*)\\)').exec(srcSuivi);
    verifier('suivi.js — ' + fn + ' existe', !!sig);
    if (!sig) return;
    const args = sig[1].split(',').map(s => s.trim()).filter(Boolean);
    verifier('suivi.js — ' + fn + ' ne reçoit qu’un identifiant', args.length === 1,
      args.length !== 1 ? 'Arguments : ' + args.join(', ')
        + ' — une valeur passée ici rendrait une interprétation possible.' : null);

    /* Corps de la fonction, jusqu'à la prochaine déclaration. */
    const dep = srcSuivi.indexOf(sig[0]);
    const suite = srcSuivi.slice(dep + sig[0].length);
    const fin = suite.search(/\nfunction\s|\n\/\* =====/);
    const corps = fin === -1 ? suite : suite.slice(0, fin);
    const interdits = ['.valeurs', 'Biologie.valeur', 'fmtVal', 'DATES['].filter(t => corps.indexOf(t) !== -1);
    verifier('suivi.js — ' + fn + ' ne touche aucune valeur mesurée', interdits.length === 0,
      interdits.length ? 'Trouvé dans le corps : ' + interdits.join(', ') : null);
  });

  verifier('suivi.js — l’explication est demandée par identifiant',
    /blocExplication\(\s*p\.id\s*\)/.test(srcSuivi),
    !/blocExplication\(\s*p\.id\s*\)/.test(srcSuivi)
      ? 'L’appel doit passer un identifiant, pas un objet porteur de valeurs.' : null);

  /* --- 8.7 Les huit actes du parcours sont expliqués, y compris ceux
         que la personne n'a pas eus : le consentement suppose de savoir
         avant, pas après. --- */
  const ordre = ((srcSuivi.match(/ORDRE_ACTES\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '')
    .match(/'([a-z]+)'/g) || [];
  const clesActes = ordre.map(s => s.replace(/'/g, ''));
  verifier('suivi.js — ordre de lecture des actes défini (' + clesActes.length + ')',
    clesActes.length >= 8);
  clesActes.forEach(k => {
    const a = LEXIQUE.actes[k];
    verifier('lexique — acte « ' + k + ' » expliqué',
      !!a && !!a.titre && !!a.quoi && !!a.deroulement && !!a.apres && !!a.pasCeQue);
  });
  const actesOrphelins = Object.keys(LEXIQUE.actes).filter(k => clesActes.indexOf(k) === -1);
  verifier('lexique — aucun acte expliqué sans être affiché', actesOrphelins.length === 0,
    actesOrphelins.length ? 'Non affichés : ' + actesOrphelins.join(', ') : null);

  /* --- 8.8 Chaque ligne du tableau vaccinations-dépistages a son
         explication, limites comprises. Un dépistage présenté sans ses
         limites n'est pas une information, c'est une incitation. --- */
  const blocCouv = (srcSuivi.match(/COUVERTURE\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
  const libelles = (blocCouv.match(/libelle:\s*'([^']+)'/g) || [])
    .map(s => s.replace(/libelle:\s*'([^']+)'/, '$1'));
  verifier('suivi.js — libellés de couverture relus (' + libelles.length + ')', libelles.length >= 6);
  libelles.forEach(l => {
    const d = LEXIQUE.depistages[l];
    verifier('lexique — « ' + l +
      ' » expliqué, limites comprises', !!d && !!d.quoi && !!d.pourquoi && !!d.limites,
      !d ? 'Aucune entrée dans LEXIQUE.depistages.' : null);
  });

  /* --- 8.9 Le glossaire : c'est lui qui rend le reste lisible. --- */
  verifier('lexique — glossaire fourni (' + LEXIQUE.glossaire.length + ' entrées)',
    LEXIQUE.glossaire.length >= 15);
  const glosFaibles = LEXIQUE.glossaire.filter(g => !g.terme || !g.def || g.def.length < 40);
  verifier('lexique — chaque terme du glossaire est réellement défini', glosFaibles.length === 0,
    glosFaibles.length ? 'Définitions manquantes ou trop courtes : '
      + glosFaibles.map(g => g.terme).join(', ') : null);

  /* Les notions qui évitent les conclusions hâtives ne sont pas
     facultatives : sans elles, expliquer davantage revient à donner
     plus d'assurance, pas plus de discernement. */
  ['Intervalle de référence', 'Faux positif', 'Faux négatif', 'Surdiagnostic',
   'Variabilité de la mesure', 'Dépistage', 'Diagnostic'].forEach(t => {
    verifier('lexique — notion présente au glossaire : ' + t,
      LEXIQUE.glossaire.some(g => g.terme === t));
  });

  /* --- 8.10 La page charge bien le lexique. --- */
  verifier('suivi/index.html — le lexique est chargé',
    /commun\/lexique\.js/.test(lire('suivi/index.html')));

  /* --- 8.11 Et elle dit à la personne que ces textes ne la visent
         pas personnellement. Sans cette phrase, un lecteur peut croire
         que le contenu a été adapté à son cas. --- */
  verifier('suivi.js — la non-individualisation est écrite pour la personne',
    /identique pour tout le monde/i.test(srcSuivi) &&
    /n’adapte aucune explication|n'adapte aucune explication/i.test(srcSuivi));
})();

/* ==================================================================
   9. LES THÈMES CHANGENT L'APPARENCE, JAMAIS LE SENS

   Proposer une version « plus colorée » du tableau de bord touche à la
   seule chose que ce projet a soigneusement encadrée depuis le début :
   la signification de la couleur. Une teinte y désigne une famille
   d'analyses et jamais un état de santé. Élargir la palette est donc
   permis, mais deux confusions deviennent possibles et sont fermées ici.

   PREMIÈRE CONFUSION — une famille pourrait prendre la couleur d'une
   marque. Si « Métabolique » devenait orange, une courbe orange se
   lirait comme un avertissement. Aucune palette ne reprend donc le
   vert, l'orange ni le rouge : ces trois teintes appartiennent aux
   marques du médecin, dans les cinq thèmes.

   SECONDE CONFUSION — un thème pourrait modifier ce qui est dit. Un
   thème qui masquerait une réserve ou raccourcirait une explication ne
   serait plus une apparence, ce serait une autre version du contenu.
   Le contrôle porte sur la forme du code : rien ne se décide en
   fonction du thème en dehors de la teinte et de la barre de choix.
================================================================== */
section('9. Thèmes — apparence seulement');

const THEMES = require('../commun/themes.js');

(function () {
  const srcSuivi = lire('suivi/suivi.js');
  const srcTh = lire('commun/themes.js');
  const srcBio = lire('plateforme/biologie.js');

  /* --- 9.1 Les familles déclarées dans les thèmes sont exactement
         celles de biologie.js, qui fait autorité. --- */
  const blocFam = (srcBio.match(/BIO_FAMILLES\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
  const famBio = (blocFam.match(/nom:\s*'([^']+)'/g) || [])
    .map(s => s.replace(/nom:\s*'([^']+)'/, '$1'));
  verifier('biologie.js — familles relues (' + famBio.length + ')', famBio.length >= 6);
  verifier('themes.js — même liste de familles que biologie.js',
    famBio.length === THEMES.familles.length &&
    famBio.every(f => THEMES.familles.indexOf(f) !== -1),
    'Attendu : ' + famBio.join(', ') + ' — déclaré : ' + THEMES.familles.join(', '));

  verifier('themes.js — cinq apparences proposées (' + THEMES.liste.length + ')',
    THEMES.liste.length >= 4);
  verifier('themes.js — le thème par défaut existe',
    THEMES.liste.some(t => t.id === THEMES.defaut));

  const reservees = THEMES.reservees.map(c => c.toLowerCase());
  verifier('themes.js — les trois teintes de marque sont déclarées réservées',
    reservees.length === 3);

  THEMES.liste.forEach(t => {
    /* --- 9.2 Couverture exacte : ni famille sans teinte, ni teinte
           orpheline. Une famille sans couleur casserait le classement. --- */
    const cles = Object.keys(t.palette);
    const manquantes = THEMES.familles.filter(f => !t.palette[f]);
    const enTrop = cles.filter(k => THEMES.familles.indexOf(k) === -1);
    verifier('thème « ' + t.nom + ' » — une teinte par famille, sans surplus',
      manquantes.length === 0 && enTrop.length === 0,
      manquantes.length ? 'Sans teinte : ' + manquantes.join(', ')
        : (enTrop.length ? 'Teintes orphelines : ' + enTrop.join(', ') : null));

    /* --- 9.3 Six teintes distinctes : deux familles de même couleur
           ne se distingueraient plus, ce qui est le seul travail que la
           couleur ait à faire ici. --- */
    const vals = THEMES.familles.map(f => (t.palette[f] || '').toLowerCase());
    verifier('thème « ' + t.nom + ' » — six teintes distinctes',
      new Set(vals).size === vals.length,
      new Set(vals).size !== vals.length ? 'Doublons : ' + vals.join(', ') : null);

    /* --- 9.4 Aucune teinte de famille ne reprend une couleur de
           marque. C'est le contrôle qui autorise un thème vif. --- */
    const collisions = vals.filter(v => reservees.indexOf(v) !== -1);
    verifier('thème « ' + t.nom + ' » — aucune teinte réservée aux marques',
      collisions.length === 0,
      collisions.length ? 'Reprend une couleur de marque : ' + collisions.join(', ') : null);

    /* --- 9.5 Chaque thème s'annonce, avec ses inconvénients. Un thème
           décrit seulement par ses qualités n'aide pas à choisir. --- */
    verifier('thème « ' + t.nom + ' » — nommé, résumé et décrit',
      !!t.nom && !!t.resume && !!t.desc && t.desc.length > 80);
  });

  /* --- 9.6 Aucune couleur écrite en dur dans le rendu : tout passe par
         les variables CSS ou par themes.js. --- */
  const hexSuivi = (codeSeul(srcSuivi).match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  verifier('suivi.js — aucune couleur écrite en dur', hexSuivi.length === 0,
    hexSuivi.length ? 'Trouvées : ' + [...new Set(hexSuivi)].join(', ') : null);

  /* --- 9.7 STRUCTURE : rien ne se décide en fonction du thème en
         dehors de la teinte et de la barre de choix. C'est ce contrôle
         qui garantit qu'un thème ne peut pas devenir une autre version
         du contenu. --- */
  const code = codeSeul(srcSuivi);
  const branches = (code.match(/\btheme\b/g) || []).length;
  verifier('suivi.js — le thème n’est lu qu’à quelques endroits identifiés (' + branches + ')',
    branches <= 8, branches > 8
      ? 'Trop de lectures du thème : vérifier qu’aucune ne conditionne du contenu.' : null);
  const conditionnel = /\btheme\s*(===|!==|==|!=)\s*['"][a-z]+['"]/.test(code);
  verifier('suivi.js — aucun contenu conditionné par le thème', !conditionnel,
    conditionnel ? 'Une comparaison du thème à une valeur littérale a été trouvée : '
      + 'elle permettrait d’afficher un texte dans un thème et pas dans un autre.' : null);
  verifier('suivi.js — la teinte est demandée par nom de famille',
    /THEMES\.teinte\(\s*theme\s*,\s*base\.nom\s*\)/.test(srcSuivi));

  /* --- 9.8 Le thème ne connaît pas les données. Contrôle sur le code
         exécutable : le fichier doit pouvoir expliquer en commentaire
         pourquoi trois couleurs sont réservées aux marques du médecin
         sans que le mot « marque » soit pris pour un accès. --- */
  const fuites = ['localStorage', 'sessionStorage', 'BIO_PARAMETRES', 'Biologie',
                  '.valeurs', 'DOSSIER', 'marquesBio']
    .filter(t => codeSeul(srcTh).indexOf(t) !== -1);
  verifier('themes.js — aucune donnée de patient, aucun stockage', fuites.length === 0,
    fuites.length ? 'Références trouvées : ' + fuites.join(', ') : null);

  /* --- 9.9 Une marque reste reconnaissable sans la couleur. Dans un
         thème coloré, une pastille nue serait indistinguable d'une
         teinte de famille — et invisible pour qui distingue mal les
         couleurs. Elle porte donc une initiale. --- */
  verifier('suivi.js — la pastille de marque porte une initiale',
    /mqm-tag[\s\S]{0,320}LIB_COULEUR\[[^\]]+\]\.charAt\(0\)/.test(srcSuivi),
    'La marque ne doit pas reposer sur la seule couleur.');

  /* --- 9.10 La page charge le module, et L'APPARENCE EST FIXÉE.

         Ces deux contrôles disaient l'inverse jusqu'au 30 juillet 2026 :
         ils vérifiaient que le sélecteur d'apparence était présent. Il a
         été retiré, le choix graphique étant arrêté. Un contrôle qui
         exige la présence de ce qui vient d'être supprimé n'a aucune
         valeur — il fallait donc le retourner, pas le désactiver. Ce
         qu'il garantit désormais : personne ne remet un sélecteur
         d'apparence par accident, et l'apparence continue d'être lue dans
         le catalogue au lieu d'être écrite en dur dans le rendu. --- */
  const srcHtml = lire('suivi/index.html');
  verifier('suivi/index.html — le module de thèmes est chargé',
    /commun\/themes\.js/.test(srcHtml));
  verifier('suivi/index.html — aucun sélecteur d’apparence publié',
    srcHtml.indexOf('id="th-b"') === -1,
    srcHtml.indexOf('id="th-b"') !== -1
      ? 'Le choix graphique est fait : le sélecteur ne doit pas revenir.' : null);
  verifier('suivi.js — aucun bouton de changement d’apparence',
    !/data-t="/.test(srcSuivi),
    /data-t="/.test(srcSuivi) ? 'Un bouton d’apparence a été réintroduit.' : null);
  verifier('suivi.js — l’apparence est une constante, lue dans le catalogue',
    /const theme = THEMES\.defaut;/.test(codeSeul(srcSuivi)),
    'Une apparence écrite en dur se retrouverait à deux endroits.');
  /* Les règles des autres apparences restent dans la feuille de style :
     elles ne s'appliquent jamais sans attribut, et elles permettent de
     revenir sur le choix en changeant une ligne.

     « Sobre » est exclu de ce décompte, et pas par commodité : c'est la
     palette de base, celle qui vit dans :root sans attribut. Elle n'a
     donc pas de bloc html[data-theme="sobre"], et elle reste appliquée
     dès qu'aucune autre ne l'est. */
  verifier('suivi/index.html — les autres apparences restent disponibles',
    THEMES.liste.filter(t => t.id !== THEMES.defaut && t.id !== 'sobre')
      .every(t => srcHtml.indexOf('data-theme="' + t.id + '"') !== -1));

  /* --- 9.11 PLUS AUCUNE BARRE D'ESSAI.

         Deuxième retournement, et pour la même raison que le premier :
         la disposition est arrêtée elle aussi — « Vue d'ensemble », celle
         qui porte les photographies. Une seule est publiée, elle est
         fixée par une constante, et aucun bouton ne permet d'en changer.

         Ce qui suit garantit qu'on ne revient pas en arrière par
         accident : ni barre, ni bouton, et une disposition qui reste
         écrite à un seul endroit. --- */
  verifier('suivi/index.html — aucune barre d’essai publiée',
    srcHtml.indexOf('id="th-disp"') === -1 && srcHtml.indexOf('id="th-b"') === -1);
  verifier('suivi.js — aucun bouton de changement de disposition',
    !/data-d="/.test(srcSuivi),
    /data-d="/.test(srcSuivi) ? 'Un bouton de disposition a été réintroduit.' : null);
  /* Lu sur la source débarrassée des commentaires, et non sur codeSeul :
     celui-ci vide les chaînes, donc effacerait justement le nom de la
     disposition qu'on veut vérifier. */
  verifier('suivi.js — la disposition est une constante',
    /const disposition = 'domaines';/.test(sansCommentaires(srcSuivi)));
  /* Et la disposition publiée est bien celle qui montre les
     photographies : c'est le seul point de ce contrôle qui porte sur le
     dessin plutôt que sur la mécanique. */
  verifier('suivi.js — la disposition publiée est la vue d’ensemble illustrée',
    /\$\('#app'\)\.innerHTML = shellDomaines\(/.test(srcSuivi));
})();

/* ==================================================================
   10. LES DISPOSITIONS N'ESCAMOTENT RIEN

   Deux agencements du même tableau de bord : « Déroulé », tout sur une
   page, et « Rail et panneau », liste à gauche et détail à droite.

   Le risque d'un rail est simple et sérieux : il découpe une page longue
   en vues, et une vue peut être oubliée. Une information reléguée dans
   une vue qu'aucun lien n'atteint est perdue tout en paraissant
   présente. Sur un dossier médical, ce n'est pas un défaut d'ergonomie,
   c'est une information soustraite au patient.

   Les contrôles vérifient donc que les DIX sections sont construites une
   seule fois, indépendamment de l'agencement, et qu'elles apparaissent
   exactement une fois dans CHACUN des deux shells.

   Une disposition n'a le droit de masquer qu'un doublon de navigation —
   dans le rail, les pastilles de choix du paramètre, que le rail
   remplace. Ce masquage est nommé dans la liste ci-dessous ; tout autre
   fait échouer le contrôle.
================================================================== */
section('10. Dispositions — aucune section escamotée');

(function () {
  const src = lire('suivi/suivi.js');
  const html = lire('suivi/index.html');

  /* Les sections telles qu'elles sont construites. */
  const debut = src.indexOf('const S = {};');
  const fin = src.indexOf("$('#app').innerHTML");
  verifier('suivi.js — les sections sont construites avant d’être disposées',
    debut !== -1 && fin > debut);
  const zoneS = debut === -1 ? '' : src.slice(debut, fin);
  const cles = (zoneS.match(/S\.([a-z]+)\s*=\s*`/g) || [])
    .map(s => s.replace(/S\.([a-z]+).*/, '$1'));
  verifier('suivi.js — dix sections construites (' + cles.length + ')', cles.length === 10,
    cles.length !== 10 ? 'Trouvées : ' + cles.join(', ') : null);

  /* CONTRÔLE CENTRAL : la construction du contenu ignore l'agencement.
     Si « disposition » ou « vue » apparaissait dans cette zone, une
     section pourrait être écrite différemment selon l'arrangement — et
     tout le reste du raisonnement s'effondrerait. */
  const contamine = ['disposition', 'vue', 'railOuvert'].filter(t =>
    new RegExp('\\b' + t + '\\b').test(codeSeul(zoneS)));
  verifier('suivi.js — le contenu des sections ignore la disposition', contamine.length === 0,
    contamine.length ? 'Références trouvées dans la construction : ' + contamine.join(', ')
      + ' — le contenu doit être identique dans les deux agencements.' : null);

  /* Shell « Déroulé » : les dix, une fois chacune. */
  const ordre = ((src.match(/ORDRE_DEROULE\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '')
    .match(/'([a-z]+)'/g) || [];
  const deroule = ordre.map(s => s.replace(/'/g, ''));
  verifier('suivi.js — le déroulé affiche les dix sections',
    deroule.length === cles.length && cles.every(k => deroule.indexOf(k) !== -1),
    'Déroulé : ' + deroule.join(', '));
  verifier('suivi.js — le déroulé n’affiche aucune section deux fois',
    new Set(deroule).size === deroule.length);

  /* Shell « Rail » : la section « graphique » est la vue d'une mesure,
     les neuf autres sont réparties dans les entrées du rail. */
  const blocVues = (src.match(/const VUES\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
  const parVue = (blocVues.match(/sections:\s*\[([^\]]*)\]/g) || [])
    .join(' ').match(/'([a-z]+)'/g) || [];
  const rail = parVue.map(s => s.replace(/'/g, '')).concat(['graphique']);
  const absentes = cles.filter(k => rail.indexOf(k) === -1);
  verifier('suivi.js — le rail atteint les dix sections', absentes.length === 0,
    absentes.length ? 'Inatteignables depuis le rail : ' + absentes.join(', ')
      + ' — une section sans lien est une information soustraite.' : null);
  verifier('suivi.js — le rail n’affiche aucune section deux fois',
    new Set(rail).size === rail.length,
    new Set(rail).size !== rail.length ? 'Doublons : ' + rail.join(', ') : null);

  /* Shell « Domaines » : la grille conduit à tout le reste. Un
     agencement qui ferait disparaître le parcours ou les dépistages
     serait une information soustraite, pas une mise en page. */
  const sousGrille = ((src.match(/SOUS_GRILLE\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '')
    .match(/'([a-z]+)'/g) || [];
  const grille = sousGrille.map(x => x.replace(/'/g, ''))
    .concat(['cockpit', 'lire', 'vignettes', 'graphique']);

  /* BARRE LATÉRALE : aucune entrée morte. Chaque entrée mène soit à une
     section réelle, soit à un domaine réel, soit à un écran « à venir »
     qui dit ce qu'il contiendra. Une entrée qui ne mène nulle part est
     le défaut le plus courant des barres latérales — et celui qu'on
     cesse de voir dès qu'on s'y est habitué. */
  const blocLat = (src.match(/const LATERAL\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
  const entrees = (blocLat.match(/id:\s*'([^']+)'/g) || [])
    .map(x => x.replace(/id:\s*'([^']+)'/, '$1'));
  verifier('suivi.js — barre latérale fournie (' + entrees.length + ' entrées)',
    entrees.length >= 15);

  const DOMLAT = require('../commun/domaines.js');
  const blocAv = (src.match(/const A_VENIR\s*=\s*\{([\s\S]*?)\n\};/) || [])[1] || '';
  const mortes = entrees.filter(e => {
    if (e === 'apercu') return false;
    if (e.indexOf('section:') === 0) return cles.indexOf(e.slice(8)) === -1;
    if (e.indexOf('dom:') === 0) return !DOMLAT.trouver(e.slice(4));
    if (e.indexOf('avenir:') === 0) return blocAv.indexOf(e.slice(7) + ':') === -1;
    return true;
  });
  verifier('suivi.js — aucune entrée de barre latérale ne mène nulle part', mortes.length === 0,
    mortes.length ? 'Entrées mortes : ' + mortes.join(', ') : null);

  /* Un « bientôt disponible » sans raison écrite reste trois ans. Chaque
     module à venir doit dire ce qu'il contiendra ET ce qui manque. */
  const clesAv = (blocAv.match(/\n  ([a-z]+):\s*\{/g) || []).map(x => x.trim().replace(':', '').replace('{', '').trim());
  verifier('suivi.js — modules à venir déclarés (' + clesAv.length + ')', clesAv.length >= 5);
  const sansRaison = clesAv.filter(k => {
    const m = new RegExp(k + ":[\\s\\S]{0,900}?manque:").exec(blocAv);
    return !m;
  });
  verifier('suivi.js — chaque module à venir dit ce qui manque', sansRaison.length === 0,
    sansRaison.length ? 'Sans raison écrite : ' + sansRaison.join(', ') : null);
  verifier('suivi.js — les modules à venir sont annoncés comme non actifs',
    /pas pour laisser croire que c’est en service/.test(src));
  /* Les « insights » automatiques de la maquette sont nommés comme
     écartés, pas oubliés. */
  verifier('suivi.js — le refus des interprétations automatiques des objets connectés est écrit',
    /bonne récupération/.test(src) && /ne sera pas\s*\n?\s*repris|s’interdira de calculer/.test(src));
  const perdues = cles.filter(k => grille.indexOf(k) === -1);
  verifier('suivi.js — la disposition Domaines atteint les dix sections', perdues.length === 0,
    perdues.length ? 'Inatteignables depuis la grille : ' + perdues.join(', ') : null);
  verifier('suivi.js — la grille n’affiche aucune section deux fois',
    new Set(grille).size === grille.length,
    new Set(grille).size !== grille.length ? 'Doublons : ' + grille.join(', ') : null);
  verifier('suivi.js — trois agencements proposés',
    /id:\s*'domaines'/.test(src) && /shellDomaines/.test(src));

  const idsVues = (blocVues.match(/id:\s*'([a-z]+)'/g) || [])
    .map(s => s.replace(/id:\s*'([a-z]+)'/, '$1'));
  verifier('suivi.js — sept entrées de rail hors mesures (' + idsVues.length + ')',
    idsVues.length === 7);
  verifier('suivi.js — chaque entrée de rail est rendue dans le balisage',
    /data-vue="/.test(src) && /data-vue\]/.test(src));
  verifier('suivi.js — les douze mesures figurent au rail',
    /mesure:' \+ x\.id|'mesure:' \+ x\.id/.test(src));

  /* Le seul masquage autorisé, et un seul. */
  const masquages = (html.match(/html\[data-dispo="[a-z]+"\][^{]*\{[^}]*display:\s*none[^}]*\}/g) || []);
  const cibles = masquages.map(m => (m.match(/\]\s*([^{]*)\{/) || [])[1].trim());
  verifier('index.html — un seul masquage par disposition (' + cibles.length + ')',
    cibles.length === 1 && cibles[0] === '.chips',
    cibles.length ? 'Masqués : ' + cibles.join(' | ')
      + ' — seul un doublon de navigation peut l’être.' : null);

  /* Repliable sur téléphone : c'était la réserve annoncée sur cette
     disposition, elle doit être traitée et non oubliée. */
  verifier('index.html — le rail se replie sur petit écran',
    /\.rail-nav\{display:none/.test(html) && /\.rail-nav\.ouvert\{display:block/.test(html));
  verifier('suivi.js — le repli est annoncé aux lecteurs d’écran',
    /aria-expanded="\$\{railOuvert/.test(src));
  verifier('suivi.js — le rail est un point de repère nommé',
    /<nav class="rail-nav[\s\S]{0,120}aria-label=/.test(src));

  /* Sur fond sombre, une teinte lumineuse exige un texte sombre. */
  verifier('index.html — l’entrée active du rail reste lisible en thème sombre',
    /html\[data-theme="nuit"\]\s*\.rail-x\.on/.test(html));

  verifier('suivi.js — les deux dispositions sont proposées',
    /DISPOSITIONS\s*=\s*\[[\s\S]*?id:\s*'deroule'[\s\S]*?id:\s*'rail'/.test(src));
})();

/* ==================================================================
   11. UN INSTRUMENT REPRODUIT, JAMAIS SCORÉ

   Le questionnaire de repérage de la BPCO en cinq questions est le cas
   limite de toute cette architecture. Son intérêt clinique tient à une
   règle de décompte — deux réponses « oui » constituent un signal — et
   cette règle est exactement ce que la version 1 ne peut pas appliquer.
   Additionner cinq cases et en tirer une conséquence serait produire une
   information propre à un patient à des fins de décision médicale.

   La solution retenue n'est pas de retirer l'instrument, ce qui priverait
   le médecin d'un outil validé, mais de séparer strictement le RECUEIL
   de l'INTERPRÉTATION : les cinq réponses sont affichées telles quelles,
   la règle publiée figure au Référentiel, et le médecin compte. Cinq
   cases se comptent en quelques secondes.

   Deuxième point contrôlé : l'EFR complète ne doit jamais être
   déclenchée par du déclaratif. Aucune réponse à un questionnaire ne
   justifie une pléthysmographie. C'est le résultat de la spirométrie qui
   l'indique — et le vérificateur s'assure que le référentiel le dit.
================================================================== */
section('11. Repérage BPCO — recueil sans décompte');

(function () {
  const src = lire('plateforme/questionnaire.js');
  const code = codeSeul(src);
  const app = codeSeul(lire('plateforme/app.js'));

  const CINQ = ['bpco5_toux', 'bpco5_expecto', 'bpco5_essouffle', 'bpco5_age40', 'bpco5_tabac'];

  /* --- 11.1 Les cinq questions existent, en oui/non, et déclarent
         l'instrument dont elles proviennent. --- */
  CINQ.forEach(id => {
    const ligne = (src.match(new RegExp("\\{[^{}]*id: '" + id + "'[\\s\\S]{0,320}?\\}", '')) || [])[0] || '';
    verifier('questionnaire.js — ' + id + ' présente', ligne !== '');
    verifier('questionnaire.js — ' + id + ' en oui/non, instrument déclaré',
      /options:\s*OUI_NON/.test(ligne) && /instrument:\s*'Repérage BPCO/.test(ligne),
      ligne === '' ? 'Question introuvable.' : null);
  });

  /* --- 11.2 Rien ne branche sur ces réponses : un affichage
         conditionné par elles serait déjà une mise en avant. --- */
  const branche = CINQ.filter(id =>
    new RegExp('showIf[^}]*' + id).test(code) || new RegExp(id + "[^)]*\\)\\s*[><=]{1,3}").test(code));
  verifier('questionnaire.js — aucun affichage conditionné par ces réponses', branche.length === 0,
    branche.length ? 'Conditionnement trouvé sur : ' + branche.join(', ') : null);

  /* --- 11.3 CONTRÔLE CENTRAL : personne ne compte les « oui ».
         On cherche dans le code exécutable de la vue médecin toute
         agrégation portant sur ces identifiants. --- */
  const agrege = /bpco5[\s\S]{0,200}?(reduce|filter\s*\([^)]*\)\s*\.length|\+\+|nb\s*=|total|somme|compte)/i.test(app) ||
                 /bpco5[\s\S]{0,200}?(reduce|\+\+|total|somme)/i.test(code);
  verifier('aucun décompte des réponses de l’instrument', !agrege,
    agrege ? 'Une agrégation portant sur bpco5 a été trouvée : la règle des deux « oui » '
      + 'doit rester à la charge du médecin.' : null);

  /* --- 11.4 La règle publiée est fournie au médecin, et son statut est
         explicite : c'est un repère, pas un verdict, et ce n'est pas la
         plateforme qui l'applique. --- */
  const ref = (src.match(/const REFERENTIEL\s*=\s*\[([\s\S]*)\n\];/) || [])[1] || '';
  verifier('référentiel — la règle des deux « oui » est fournie au médecin',
    /deux réponses «\s*oui\s*» constituent un signal/i.test(ref));
  verifier('référentiel — le décompte est explicitement laissé au médecin',
    /décompte n’est pas fait par la plateforme/i.test(ref));
  verifier('référentiel — le questionnaire est présenté comme non diagnostique',
    /ne fait pas de diagnostic et ne remplace pas la spirométrie/i.test(ref));
  verifier('référentiel — deux « oui » n’obligent à rien',
    /n’obligent à rien/i.test(ref));

  /* --- 11.5 La séquence en deux temps est écrite, et l'EFR complète
         n'est jamais déclenchée par du déclaratif. --- */
  verifier('référentiel — la spirométrie est posée en première intention',
    /examen de première intention/i.test(ref));
  verifier('référentiel — l’EFR complète n’est pas déclenchée par le questionnaire',
    /EFR complète n’est pas déclenchée par le questionnaire/i.test(ref));
  verifier('référentiel — le surdiagnostic du repère fixe est signalé',
    /surdiagnostique chez les sujets plus âgés/i.test(ref));
  verifier('référentiel — la plateforme ne calcule ni rapport ni valeur prédite',
    /ne calcule ni le rapport VEMS\/CVF, ni le pourcentage de la valeur prédite/i.test(ref));

  /* --- 11.6 La reproduction mot pour mot est annoncée à la personne :
         sans cela, cinq questions qui ressemblent aux voisines passent
         pour une redondance négligée. --- */
  verifier('questionnaire.js — la reproduction littérale est annoncée',
    /reproduisent mot pour mot un questionnaire publié/i.test(src));
})();

/* ==================================================================
   12. SURVEILLANCE DU PLATEAU DE PNEUMOLOGIE

   Le groupe dispose déjà d'un plateau d'exploration fonctionnelle qui
   sert au pneumologue en soins courants. Le capital est engagé, donc
   l'argument « ne l'installez pas » ne s'applique plus. Reste le risque
   qui ne se corrige par aucun contrôle technique : une capacité
   installée finit par trouver des indications, et un parcours de
   prévention est un pourvoyeur commode.

   Trois indicateurs, et il en faut trois parce qu'un seul mentirait :
     - la part des explorations précédées d'une spirométrie anormale
       mesure la séquence voulue ;
     - la part des explorations sans justification écrite mesure la
       dérive, et c'est la seule ligne qu'un contrôle opposera ;
     - la part des spirométries anormales suivies d'une exploration
       mesure le risque symétrique, celui d'un repérage sans suite —
       qui n'est pas un risque de contrôle mais un risque pour la
       personne.

   Viser cent pour cent sur le premier serait une faute : cela pousserait
   à ne plus tracer les indications cliniques légitimes, donc à les
   rendre invisibles. Le contrôle vérifie que cette nuance est écrite.
================================================================== */
section('12. Plateau de pneumologie — surveillance de la dérive');

(function () {
  const src = lire('pilotage/pilotage.js');
  const TROIS = ['efr_origine', 'efr_sans_justif', 'tvo_suite'];

  TROIS.forEach(id => {
    const bloc = (src.match(new RegExp("id: '" + id + "'[\\s\\S]{0,900}?\\n    \\}", '')) || [])[0] || '';
    verifier('pilotage.js — indicateur « ' + id + ' » présent', bloc !== '');
    if (!bloc) return;

    /* --- 12.1 Garde d'effectif : pas d'alerte sur du bruit. --- */
    verifier('pilotage.js — ' + id + ' déclare son effectif et son minimum',
      /effectif:/.test(bloc) && /effectifMin:\s*\d+/.test(bloc));

    /* --- 12.2 Lisible sans le taux : à faible effectif, ce sont les
           effectifs bruts qui informent, pas le pourcentage. --- */
    verifier('pilotage.js — ' + id + ' affiche des effectifs bruts',
      /base:[^\n]*compte\([\s\S]{0,120}compte\(/.test(bloc),
      'La base doit donner numérateur et dénominateur en clair.');

    verifier('pilotage.js — ' + id + ' explique ce que l’écart révèle',
      /revele:/.test(bloc) && bloc.indexOf('revele') !== -1);
  });

  /* --- 12.3 Le sens des seuils : la dérive se surveille par le haut,
         la séquence et le suivi par le bas. Une inversion viderait les
         indicateurs de leur sens sans rien casser visiblement. --- */
  const sens = id => ((src.match(new RegExp("id: '" + id + "'[\\s\\S]{0,900}?sens: '([a-z]+)'", '')) || [])[1]);
  verifier('pilotage.js — la dérive est surveillée par le haut',
    sens('efr_sans_justif') === 'max');
  verifier('pilotage.js — la séquence en deux temps est surveillée par le bas',
    sens('efr_origine') === 'min');
  verifier('pilotage.js — le repérage sans suite est surveillé par le bas',
    sens('tvo_suite') === 'min');

  /* --- 12.4 La garde d'effectif est réellement appliquée, et elle
         suspend l'alerte au lieu de la transformer en « dans la cible » :
         un indicateur sans effectif n'est pas un indicateur satisfait. --- */
  verifier('pilotage.js — l’alerte est suspendue sous l’effectif minimal',
    /if \(ind\.effectifMin != null && \(ind\.effectif \|\| 0\) < ind\.effectifMin\) return 'attente';/.test(src));
  verifier('pilotage.js — l’état « attente » a son propre libellé',
    /Effectif insuffisant/.test(src));
  verifier('pilotage.js — le seuil suspendu est signalé en clair',
    /suspendu, effectif inférieur à/.test(src));

  /* --- 12.5 L'indication clinique tracée est distinguée de l'absence
         de justification. Sans cette distinction, l'indicateur pousse à
         cacher les indications légitimes plutôt qu'à les écrire. --- */
  verifier('pilotage.js — une exploration peut être justifiée sans spirométrie anormale',
    /efrIndicTracee/.test(src));
  verifier('pilotage.js — l’absence de justification est définie comme le solde des deux',
    /efrSansJustif:\s*efr && !efrApresTvo && !efrIndicTracee/.test(src));
  verifier('pilotage.js — le piège du cent pour cent est documenté',
    /serait une erreur|serait une faute/i.test(src) && /invisibles/i.test(src));

  /* --- 12.6 Le périmètre agrégé reste respecté : ces indicateurs
         comptent, ils ne lisent personne. --- */
  const code = codeSeul(src);
  const nominatif = ['nom', 'prenom', 'nir', 'dateNaissance', 'localStorage']
    .filter(t => new RegExp('\\b' + t + '\\b').test(code));
  verifier('pilotage.js — aucune lecture nominative introduite', nominatif.length === 0,
    nominatif.length ? 'Trouvé : ' + nominatif.join(', ') : null);
})();

/* ==================================================================
   13. IMAGES LOCALES — DEUX RÉGIMES, UNE SEULE RAISON

   La règle défendue jusqu'ici n'a jamais porté sur les images, elle
   portait sur les TIERS. Une image servie par notre propre domaine ne
   fait parler personne d'autre que nous : aucune adresse IP ne part
   ailleurs, aucun tiers n'apprend qu'une personne consulte un dossier
   médical. Les images locales sont donc admises partout, y compris sur
   les pages de santé, et c'est exactement ce qui rendait
   l'auto-hébergement préférable au lien vers un hôte externe.

   Les contrôles ci-dessous remplacent la confiance par des faits : le
   fichier existe, il est déclaré, il tient dans un budget de poids, et
   le dossier ne contient rien qui ne soit déclaré. Ce dernier point est
   le plus utile à terme : c'est ainsi qu'une image arrivée « juste pour
   essayer » ne reste pas six mois en production sans que personne sache
   d'où elle vient.
================================================================== */
section('13. Images locales — déclarées, présentes, légères');

(function () {
  const dossier = VISUELS.dossierLocal;
  verifier('visuels.js — le dossier des images locales est déclaré',
    typeof dossier === 'string' && dossier.length > 0);
  verifier('visuels.js — seize illustrations de domaine déclarées (' +
    (VISUELS.locales || []).length + ')', (VISUELS.locales || []).length === 16);

  /* --- 13.1 Chaque déclaration correspond à un fichier réellement
         présent, sous budget. Une carte qui pointe vers un fichier
         absent s'affiche vide, sans erreur visible. --- */
  let total = 0, manquants = [], lourds = [];
  (VISUELS.locales || []).forEach(v => {
    const rel = dossier + v.id + '.jpg';
    if (!existe(rel)) { manquants.push(v.id); return; }
    const ko = fs.statSync(path.join(RACINE, rel)).size / 1024;
    total += ko;
    if (ko > VISUELS.poidsMaxKo) lourds.push(v.id + ' (' + Math.round(ko) + ' Ko)');
  });
  verifier('images — les seize fichiers sont présents', manquants.length === 0,
    manquants.length ? 'Absents : ' + manquants.join(', ') : null);
  verifier('images — chacune sous ' + VISUELS.poidsMaxKo + ' Ko', lourds.length === 0,
    lourds.length ? 'Trop lourdes : ' + lourds.join(', ') : null);
  /* Seize photographies pèsent plus que seize aplats de couleur. Le
     plafond monte de 700 à 950 Ko, avec la contrepartie que le
     chargement reste différé : à l'ouverture, seules les cartes visibles
     sont téléchargées. */
  verifier('images — poids total raisonnable (' + Math.round(total) + ' Ko)', total < 950,
    total >= 950 ? 'La grille affiche seize cartes : le total compte, même en chargement différé.' : null);

  /* --- 13.2 Chaque déclaration a un sujet écrit : c'est ce qui
         alimentera le texte alternatif, donc la seule description
         disponible pour qui n'affiche pas les images. --- */
  const sansSujet = (VISUELS.locales || []).filter(v => !v.sujet || v.sujet.length < 20);
  verifier('visuels.js — chaque illustration a un sujet décrit', sansSujet.length === 0,
    sansSujet.length ? 'Sans sujet : ' + sansSujet.map(v => v.id).join(', ') : null);

  /* --- 13.3 Rien d'indéclaré dans le dossier. --- */
  if (existe(dossier)) {
    const surPlace = fs.readdirSync(path.join(RACINE, dossier))
      .filter(f => /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(f));
    const declares = (VISUELS.locales || []).map(v => v.id + '.jpg');
    const intrus = surPlace.filter(f => declares.indexOf(f) === -1);
    verifier('images — aucun fichier non déclaré dans le dossier (' + surPlace.length + ')',
      intrus.length === 0, intrus.length ? 'Non déclarés : ' + intrus.join(', ') : null);
  }

  /* --- 13.4 Un domaine sans illustration afficherait une carte
         bancale : la couverture doit être totale. --- */
  const DOM = require('../commun/domaines.js');
  const sansImage = DOM.liste.filter(d =>
    !(VISUELS.locales || []).some(v => v.id === d.id));
  verifier('images — chaque domaine a son illustration', sansImage.length === 0,
    sansImage.length ? 'Domaines sans image : ' + sansImage.map(d => d.id).join(', ') : null);

  /* --- 13.5 La provenance et les droits sont datés et nommés. Sans
         cela, la question « d'où viennent ces images » n'a pas de
         réponse écrite le jour où elle est posée. --- */
  const src = lire('commun/visuels.js');
  verifier('visuels.js — provenance des photographies écrite',
    /v0\.app/.test(src) && /Droits\s+d[ée]tenus\s+par/.test(src) && /d[ée]claration du/.test(src));
  /* Le bon dossier du zip est nommé : deux jeux d'images cohabitent, et
     j'ai commencé par extraire le mauvais. C'est écrit pour que
     personne ne recommence. */
  verifier('visuels.js — le bon dossier du zip est identifié',
    /public\/photos/.test(src) && /public\/domains/.test(src));
  /* La limite qui vaut pour ces photographies : privé oui, public non. */
  verifier('visuels.js — la limite page privée / page publique est écrite',
    /communication VERS LE PUBLIC/i.test(src) && /index\.html/.test(src));
  verifier('visuels.js — la réserve sur les images génératives est notée',
    /statut\s+d['’]auteur[\s\S]{0,80}?g[eé]n[eé]ratif/.test(src));
})();

/* ==================================================================
   13 bis. LE BANDEAU PHOTOGRAPHIQUE ET SON VOILE

   Le bandeau de bilan porte une photographie en fond et du texte blanc
   par-dessus. C'est le seul endroit du produit où la lisibilité d'un
   texte dépend d'un réglage graphique. Un voile trop léger ne provoque
   aucune erreur, ne casse aucune mise en page et n'apparaît dans aucun
   journal : il rend simplement le texte difficile à lire, et personne ne
   s'en aperçoit avant qu'un utilisateur ne le signale. C'est exactement
   le type de régression qui mérite un contrôle automatique.

   Ce qui est vérifié : la photographie est déclarée comme les autres,
   elle existe, elle est légère, elle porte un texte alternatif vide
   parce qu'elle n'apprend rien, et le voile qui la recouvre part de la
   couleur pleine du thème et ne descend jamais sous un tiers d'opacité.
   ================================================================== */
/* ==================================================================
   13 ter. LES PICTOGRAMMES DEMANDÉS EXISTENT, ET LE VERT D'AVANCEMENT
   NE SE FAIT PAS PASSER POUR UN AVIS

   Deux contrôles nés d'un même constat : ce qui ne provoque pas d'erreur
   ne se voit pas.

   Un <use href="#i-flask"> qui pointe vers un symbole absent ne casse
   rien et n'écrit rien dans la console : il dessine un vide. Cinq
   pictogrammes manquaient ainsi depuis l'origine dans la frise des
   visites, à côté de leurs libellés — personne ne l'avait vu.

   Le vert des étapes réalisées, lui, dit qu'un acte a eu lieu. C'est une
   information administrative. S'il devenait la même teinte que le vert
   « dans les valeurs usuelles » du médecin, la page se mettrait à
   suggérer qu'une étape faite est une étape rassurante.
   ================================================================== */
/* ==================================================================
   15. LES CINQ MODULES REMPLIS D'EXEMPLES

   Ils ont été construits pour la présentation, et c'est précisément
   pourquoi ils méritent des contrôles : un exemple crédible est ce qui
   ressemble le plus à un produit fini. Si un statut y apparaissait sans
   auteur, ou si une mesure d'objet connecté y était comparée à un seuil,
   la démonstration montrerait un logiciel qui interprète — et c'est
   l'inverse de ce qui est promis à l'écran juste à côté.

   Ce qui est vérifié :
     - tout le contenu inventé vit dans un seul fichier, supprimable ;
     - ce fichier dit qu'il est fictif, en toutes lettres ;
     - chacun de ses avis porte un statut, un auteur et une date ;
     - aucune phrase d'évaluation reprise de la maquette (« bonne
       récupération », « aucune anomalie détectée », « zone normale ») ;
     - aucun objectif ni fourchette de normalité sur les objets
       connectés ;
     - la page ne calcule rien d'autre qu'une moyenne, et le dit ;
     - chaque module affiche ce qui manque avant sa mise en service.
   ================================================================== */
/* ==================================================================
   16. LE MENU ET LA PAGE PORTENT LE MÊME NOM

   Le menu affichait « Dermatologie », la page ouverte s'intitulait
   « Peau ». Deux mots pour la même chose, à deux endroits de la même
   interface : impossible de savoir si on a cliqué au bon endroit. La
   cause était banale — le libellé du menu était écrit à la main dans le
   fichier d'affichage, à côté d'un identifiant qui pointait vers un
   domaine nommé autrement.

   Le libellé est maintenant lu dans commun/domaines.js. Ces contrôles
   empêchent qu'on le réécrive à la main, et vérifient que chaque domaine
   porte les deux textes qui rendent un nom de spécialité compréhensible.
   ================================================================== */
/* ==================================================================
   17. UNE SEULE CHARTE POUR SEPT PAGES

   Chaque page portait sa copie des couleurs. La page de suivi est passée
   à la palette de la maquette, les six autres sont restées au bleu-vert
   sombre, et le site s'est retrouvé dépareillé sans que rien ne soit
   cassé — personne n'avait fait d'erreur, la duplication avait
   simplement fait son travail.

   Les jetons vivent maintenant dans commun/charte.css. Ces contrôles
   empêchent qu'une page s'en refasse une copie, et surveillent la seule
   copie qui subsiste : celle de la page de suivi, gardée en ligne parce
   que sa feuille de style contient six apparences.
   ================================================================== */
section('17. Charte partagée — une seule définition des couleurs');

(function () {
  const CHARTE = 'commun/charte.css';
  verifier('la charte partagée existe', existe(CHARTE));
  if (!existe(CHARTE)) return;
  const ch = lire(CHARTE);
  /* Les deux contrôles qui suivent portent sur les RÈGLES, pas sur les
     commentaires : le fichier explique lui-même qu'il n'a pas le droit
     d'employer @import ni les trois teintes d'avis, et il échouerait sur
     sa propre documentation. Troisième fois que ce piège se referme dans
     ce vérificateur — d'où sansCommentaires, écrit pour ça. */
  const chNu = sansCommentaires(ch);

  /* --- 17.1 Aucune ressource tierce dans un fichier chargé par des pages
         de santé. --- */
  const tiers = ['@import', 'url(http', 'fonts.googleapis', 'fonts.gstatic']
    .filter(t => chNu.indexOf(t) !== -1);
  verifier('charte.css — aucune ressource distante, aucun @import', tiers.length === 0,
    tiers.length ? 'Trouvé : ' + tiers.join(', ') : null);

  /* --- 17.2 Les pages chargent la charte et n'ont plus de bloc :root de
         palette. On tolère un :root local s'il ne contient aucune couleur
         — une largeur propre à une page est légitime. --- */
  const PAGES = ['index.html', 'espace/index.html', 'contenus/index.html',
                 'entreprise/index.html', 'pilotage/index.html', 'plateforme/index.html'];
  const sansCharte = PAGES.filter(f => existe(f) && !/commun\/charte\.css/.test(lire(f)));
  verifier('les ' + PAGES.length + ' pages chargent la charte', sansCharte.length === 0,
    sansCharte.length ? 'Sans charte : ' + sansCharte.join(', ') : null);

  const FEUILLES = PAGES.concat(['plateforme/style.css']);
  const copies = [];
  FEUILLES.forEach(f => {
    if (!existe(f)) return;
    const src = sansCommentaires(lire(f));
    const blocs = src.match(/:root\s*\{[^}]*\}/g) || [];
    blocs.forEach(b => {
      /* Une couleur dans un :root local est une copie de palette. Sauf
         sur la page de pilotage, dont les couleurs d'indicateur qualifient
         l'organisation du centre et non une personne — c'est écrit dans
         le fichier, et c'est le seul cas admis. */
      if (/#[0-9a-fA-F]{3,6}/.test(b) && f.indexOf('pilotage') === -1) copies.push(f);
    });
  });
  verifier('aucune page ne redéfinit une couleur pour elle-même', copies.length === 0,
    copies.length ? 'Palettes locales : ' + [...new Set(copies)].join(', ') : null);
  verifier('pilotage — ses couleurs d’indicateur sont justifiées par écrit',
    existe('pilotage/index.html') &&
    /INDICATEUR DE PRATIQUE DU CENTRE/.test(lire('pilotage/index.html')) &&
    /#0f766e/.test(lire('pilotage/index.html')),
    'La distinction entre évaluer une organisation et évaluer une personne doit être écrite.');

  /* --- 17.3 LA COPIE QUI RESTE. La page de suivi garde ses jetons en
         ligne. Ce contrôle compare les deux jeux : c'est la seule
         protection honnête tant que la copie existe. --- */
  const jeton = (src, nom) => {
    const m = src.match(new RegExp('--' + nom + ':\\s*(#[0-9a-fA-F]{6})'));
    return m ? m[1].toLowerCase() : null;
  };
  const suivi = lire('suivi/index.html');
  const bloc = (suivi.match(/html\[data-theme="clinique"\]\{[^}]*\}/) || [''])[0];
  const divergents = [];
  ['pri', 'pri-d', 'pri-2', 'pri-l', 'ink', 'ink-2', 'line'].forEach(n => {
    const a = jeton(ch, n), b = jeton(bloc, n);
    if (a && b && a !== b) divergents.push(n + ' : charte ' + a + ' / suivi ' + b);
  });
  verifier('charte.css et la page de suivi emploient les mêmes couleurs',
    divergents.length === 0,
    divergents.length ? 'Divergences : ' + divergents.join(' · ') +
      ' — c’est exactement la dérive que la charte devait supprimer.' : null);
  verifier('charte.css — la duplication restante est documentée',
    /DUPLICATION QUI RESTE/.test(ch) && /suivi/.test(ch));

  /* --- 17.4 Les trois teintes d'avis n'entrent pas dans la charte : une
         page ne doit pas pouvoir les employer comme couleur décorative. --- */
  const reservees = require('../commun/themes.js').reservees;
  const fuites = reservees.filter(c => chNu.toLowerCase().indexOf(c.toLowerCase()) !== -1);
  verifier('charte.css — aucune teinte d’avis médical dans la charte', fuites.length === 0,
    fuites.length ? 'Teintes réservées présentes : ' + fuites.join(', ') : null);
  verifier('charte.css — la raison en est écrite',
    /TROIS TEINTES R[ÉE]SERV[ÉE]ES/.test(ch));

  /* --- 17.5 Plus aucune trace de l'ancienne palette bleu-vert, y compris
         dans les schémas dessinés à la main : c'est là qu'elle avait
         survécu au premier passage. --- */
  const ANCIENNES = ['#0f5f6b', '#0a464f', '#14818f', '#e4f1f3', '#08181f', '#0a1c24'];
  const restes = [];
  ['index.html', 'espace/index.html', 'contenus/index.html', 'entreprise/index.html',
   'pilotage/index.html', 'plateforme/index.html', 'plateforme/style.css',
   'suivi/index.html', 'espace/modules.js', 'espace/patient.js']
    .forEach(f => {
      if (!existe(f)) return;
      const src = lire(f);
      ANCIENNES.forEach(c => {
        /* La page de suivi conserve l'apparence « sobre » dans sa feuille :
           c'est une apparence non publiée, pas un reste de dérive. */
        if (f === 'suivi/index.html') return;
        if (src.toLowerCase().indexOf(c) !== -1) restes.push(f + ' → ' + c);
      });
    });
  verifier('aucune trace de l’ancienne palette dans les pages', restes.length === 0,
    restes.length ? 'À reprendre : ' + [...new Set(restes)].join(', ') : null);
})();

section('16. Nom de spécialité — un seul libellé, expliqué');

(function () {
  const DOM = require('../commun/domaines.js');
  const js = lire('suivi/suivi.js');

  /* --- 16.1 Aucune entrée de domaine n'écrit son libellé à la main. --- */
  const enDur = (js.match(/id: 'dom:[a-z-]+',\s*nom: '[^']+'/g) || []);
  verifier('suivi.js — aucun libellé de domaine écrit à la main', enDur.length === 0,
    enDur.length ? 'Écrits en dur : ' + enDur.join(' | ') +
      ' — c’est exactement ce qui avait fait diverger « Dermatologie » et « Peau ».' : null);
  verifier('suivi.js — les libellés de domaine sont lus dans domaines.js',
    /function nomDom\(id\)/.test(js) && /DOMAINES\.trouver\(id\)/.test(js) &&
    (js.match(/nom: nomDom\('/g) || []).length >= 5);

  /* --- 16.2 Chaque entrée « dom: » du menu vise un domaine existant. --- */
  const vises = (js.match(/nomDom\('([a-z-]+)'\)/g) || [])
    .map(t => t.replace(/nomDom\('|'\)/g, ''));
  const inconnus = vises.filter(id => !DOM.trouver(id));
  verifier('suivi.js — chaque entrée de menu vise un domaine existant (' + vises.length + ')',
    inconnus.length === 0, inconnus.length ? 'Inconnus : ' + inconnus.join(', ') : null);

  /* --- 16.3 Un nom de spécialité ne suffit pas : il faut dire de quoi il
         s'agit. Deux textes obligatoires, et une longueur minimale — une
         explication de dix mots n'explique rien. --- */
  const sansClair = DOM.liste.filter(d => !d.clair || d.clair.length < 18);
  verifier('domaines.js — chaque domaine nomme les organes concernés',
    sansClair.length === 0,
    sansClair.length ? 'Sans ligne claire : ' + sansClair.map(d => d.id).join(', ') : null);
  const sansExp = DOM.liste.filter(d => !d.explique || d.explique.length < 200);
  verifier('domaines.js — chaque domaine explique ce que la spécialité regarde',
    sansExp.length === 0,
    sansExp.length ? 'Explication absente ou trop courte : ' +
      sansExp.map(d => d.id).join(', ') : null);
  verifier('suivi.js — l’explication est affichée dans le panneau du domaine',
    /class="dt-exp"/.test(js) && /d\.explique/.test(js));

  /* --- 16.4 Ces textes décrivent une spécialité, pas une personne. Même
         règle que pour le lexique : aucune phrase ne doit pouvoir se lire
         comme un commentaire de résultat. --- */
  const individualise = [];
  DOM.liste.forEach(d => {
    const t = (d.clair + ' ' + d.explique);
    [/votre taux/i, /vos r[eé]sultats/i, /vous avez/i, /votre valeur/i,
     /est [eé]lev[eé]/i, /est normal/i, /anormal/i].forEach(rx => {
      if (rx.test(t)) individualise.push(d.id + ' (' + rx.source + ')');
    });
  });
  verifier('domaines.js — aucun texte ne commente un résultat',
    individualise.length === 0,
    individualise.length ? 'À réécrire : ' + individualise.join(', ') : null);
  /* Et aucun seuil chiffré dans une unité biologique : l'intervalle de
     référence appartient au compte rendu du laboratoire. */
  const seuils = DOM.liste.filter(d =>
    /\d+([.,]\d+)?\s*(g\/L|mg\/L|mmol\/L|µg\/L|UI\/L|mUI\/L|nmol\/L|µmol\/L)/i
      .test(d.clair + ' ' + d.explique));
  verifier('domaines.js — aucun seuil chiffré dans une unité biologique',
    seuils.length === 0, seuils.length ? 'Seuils trouvés : ' +
      seuils.map(d => d.id).join(', ') : null);
})();

section('15. Modules de démonstration — exemples crédibles, sans interprétation');

(function () {
  const DEMOF = 'commun/demonstration.js';
  verifier('le jeu de démonstration est isolé dans un seul fichier', existe(DEMOF));
  if (!existe(DEMOF)) return;

  const src = lire(DEMOF);
  const DM = require('../' + DEMOF);
  const js = lire('suivi/suivi.js');

  /* --- 15.1 Le fichier annonce ce qu'il est. --- */
  verifier('demonstration.js — annonce que tout est inventé',
    /TOUT EST INVENT[ÉE]/.test(src) && /n'existe pas|n’existe pas/.test(src));
  verifier('demonstration.js — la procédure de suppression est écrite',
    /supprime[\s\S]{0,80}fichier/.test(src));
  verifier('suivi/index.html — le fichier de démonstration est chargé et signalé',
    /demonstration\.js/.test(lire('suivi/index.html')));

  /* --- 15.2 Chaque avis d'exemple est signé. C'est le contrôle le plus
         important du lot : un statut sans auteur, dans une démonstration,
         montre exactement le produit qu'on ne fait pas. --- */
  const AV = require('../commun/avis.js').Avis;
  const nonSignes = (DM.avis || []).filter(a => !a.medecin || !a.date || !a.statut ||
    !AV.statut(a.statut));
  verifier('demonstration.js — les ' + (DM.avis || []).length +
    ' avis d’exemple sont signés et datés', nonSignes.length === 0,
    nonSignes.length ? 'Non signés : ' + nonSignes.map(a => a.domaine).join(', ') : null);
  const lisibles = (DM.avis || []).filter(a => AV.lire(DM.dossierDemo, a.domaine)).length;
  verifier('demonstration.js — les avis passent le contrôle de complétude d’avis.js (' +
    lisibles + ')', lisibles === (DM.avis || []).length);
  /* Tous les domaines ne sont pas commentés : une démonstration où tout
     porte une pastille laisserait croire à un statut automatique. */
  const DOM = require('../commun/domaines.js');
  verifier('demonstration.js — tous les domaines ne sont pas commentés (' +
    (DM.avis || []).length + ' sur ' + DOM.liste.length + ')',
    (DM.avis || []).length < DOM.liste.length,
    'Un dossier où chaque domaine porte une pastille ressemble à un calcul automatique.');

  /* --- 15.3 Les comptes rendus d'examen sont signés eux aussi. --- */
  const nonSignesEx = []
    .concat(DM.imagerie || [], DM.complementaires || [])
    .filter(e => e.conclusion && (!e.medecin || !e.date || !e.statut));
  verifier('demonstration.js — chaque conclusion d’examen porte un auteur et une date',
    nonSignesEx.length === 0,
    nonSignesEx.length ? 'Sans auteur : ' + nonSignesEx.map(e => e.id).join(', ') : null);
  verifier('suivi.js — la pastille d’examen refuse de s’afficher sans auteur',
    /function pastilleAvis\([^)]*\)\s*\{\s*if \(!statut \|\| !medecin\) return ''/.test(js),
    'Sans ce refus, un statut pourrait apparaître sans être attribué à personne.');

  /* --- 15.4 Aucune phrase d'évaluation reprise de la maquette. La
         maquette d'origine en plaçait une sous chacune de ses huit
         mesures d'objet connecté : c'est la seule partie de son contenu
         qui ne devait pas être reprise. --- */
  const interdits = ['bonne récupération', 'aucune anomalie', 'zone normale',
                     'objectif atteint', 'valeurs attendues', 'tout va bien',
                     'excellente', 'à améliorer'];
  const zone = sansCommentaires(src).toLowerCase();
  const trouves = interdits.filter(t => zone.indexOf(t) !== -1);
  verifier('demonstration.js — aucune phrase d’évaluation automatique', trouves.length === 0,
    trouves.length ? 'Formules trouvées : ' + trouves.join(', ') : null);

  /* --- 15.5 Aucun objectif, aucune fourchette de normalité sur les
         mesures d'objets connectés. La maquette en avait deux
         (refLow/refHigh) : elles n'ont pas été reprises. --- */
  const champs = Object.keys((DM.objets.mesures || [])[0] || {});
  const suspects = champs.filter(c => /^(ref|seuil|objectif|cible|min|max|tone|norme)/i.test(c));
  verifier('demonstration.js — aucune borne de normalité sur les objets connectés (' +
    champs.join(', ') + ')', suspects.length === 0,
    suspects.length ? 'Champs à retirer : ' + suspects.join(', ') : null);
  verifier('suivi.js — le module objets connectés écrit ce qu’il refuse de faire',
    /ni objectif à atteindre[\s\S]{0,200}fourchette/.test(js) &&
    /dispositif médical/.test(js));
  /* La seule opération faite sur ces séries est une moyenne, et elle est
     nommée à l'écran. */
  verifier('suivi.js — la seule opération sur les séries est une moyenne, annoncée',
    /moyenne \$\{esc\(fmtVal\(moyenne/.test(js));

  /* --- 15.6 Les photographies des modules sont déclarées, présentes,
         légères — même régime que les autres. --- */
  const V = require('../commun/visuels.js');
  let manquants = [], lourds = [];
  (V.modules || []).forEach(m => {
    const rel = V.dossierModules + m.id + '.jpg';
    if (!existe(rel)) { manquants.push(m.id); return; }
    const ko = fs.statSync(path.join(RACINE, rel)).size / 1024;
    if (ko > V.poidsMaxModuleKo) lourds.push(m.id + ' (' + Math.round(ko) + ' Ko)');
  });
  verifier('images — les photographies des modules sont présentes (' +
    (V.modules || []).length + ')', manquants.length === 0,
    manquants.length ? 'Absentes : ' + manquants.join(', ') : null);
  verifier('images — chaque photographie de module sous ' + V.poidsMaxModuleKo + ' Ko',
    lourds.length === 0, lourds.length ? 'Trop lourdes : ' + lourds.join(', ') : null);
  if (existe(V.dossierModules)) {
    const surPlace = fs.readdirSync(path.join(RACINE, V.dossierModules))
      .filter(f => /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(f));
    const declares = (V.modules || []).map(m => m.id + '.jpg');
    const intrus = surPlace.filter(f => declares.indexOf(f) === -1);
    verifier('images — aucun fichier de module non déclaré', intrus.length === 0,
      intrus.length ? 'Non déclarés : ' + intrus.join(', ') : null);
  }
  verifier('visuels.js — l’image écartée de la maquette est justifiée',
    /hero-editorial/.test(lire('commun/visuels.js')) &&
    /promesse/.test(lire('commun/visuels.js')),
    'Écarter une image sans écrire pourquoi, c’est la réintroduire au prochain passage.');

  /* --- 15.7 Chaque module dit ce qui manque avant sa mise en service, et
         le dit à l'écran. --- */
  const CLES = ['imagerie', 'complementaires', 'rdv', 'objets', 'messagerie'];
  const sansModule = CLES.filter(c => !new RegExp('\\b' + c + ':\\s*module').test(js));
  verifier('suivi.js — les cinq modules sont branchés', sansModule.length === 0,
    sansModule.length ? 'Non branchés : ' + sansModule.join(', ') : null);
  verifier('suivi.js — chaque module rappelle ce qui manque',
    (js.match(/blocManque\('/g) || []).length >= 5,
    'Un module d’exemple sans cette mention se prend pour une fonction livrée.');
  verifier('suivi.js — la mention « les exemples sont inventés » est à l’écran',
    /exemples ci-dessus sont inventés/.test(js));

  /* --- 15.8 Aucun bouton qui ne fait rien : c'était la règle posée pour
         la barre du haut, elle vaut pour les modules. --- */
  verifier('suivi.js — pas de bouton de prise de rendez-vous factice',
    !/Prendre rendez-vous<\/button>|class="btn-rdv"/.test(js) &&
    /pas de bouton de prise de rendez-vous/.test(js));
  verifier('suivi.js — pas de champ de réponse dans la messagerie',
    !/<textarea/.test(js) && /pas de champ de réponse/.test(js));

  /* --- 15.9 Rien ne part vers un tiers. Les modules « objets
         connectés » et « messagerie » sont les deux endroits où la
         tentation d'appeler une API existe. --- */
  const fuites = ['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'WebSocket',
                  'localStorage.setItem']
    .filter(t => codeSeul(js).indexOf(t) !== -1);
  verifier('suivi.js — aucun appel réseau, aucune écriture de stockage', fuites.length === 0,
    fuites.length ? 'Trouvé : ' + fuites.join(', ') : null);
})();

section('13 ter. Pictogrammes présents, vert d’avancement distinct');

(function () {
  const html = lire('suivi/index.html');
  const js = lire('suivi/suivi.js');

  /* --- Chaque pictogramme demandé par le code existe dans le sprite. --- */
  const demandes = [...new Set((js.match(/'(i-[a-z-]+)'/g) || [])
    .map(t => t.replace(/'/g, '')))];
  const presents = (html.match(/<symbol id="(i-[a-z-]+)"/g) || [])
    .map(t => t.replace(/.*id="/, '').replace('"', ''));
  const absents = demandes.filter(d => presents.indexOf(d) === -1);
  verifier('index.html — les ' + demandes.length + ' pictogrammes demandés existent',
    absents.length === 0,
    absents.length ? 'Absents du sprite : ' + absents.join(', ') +
      ' — un symbole manquant dessine un vide, sans erreur.' : null);
  /* Et l'inverse : un symbole que plus personne ne demande est du poids
     mort dans une page chargée à chaque visite. */
  const inutiles = presents.filter(p => demandes.indexOf(p) === -1);
  verifier('index.html — aucun pictogramme inutilisé (' + presents.length + ')',
    inutiles.length === 0, inutiles.length ? 'Jamais demandés : ' + inutiles.join(', ') : null);

  /* --- Le vert d'avancement existe, et n'est aucune des trois teintes
         réservées aux avis du médecin. --- */
  const m = html.match(/--fait:\s*(#[0-9a-fA-F]{6})/);
  verifier('index.html — le vert d’avancement est déclaré une seule fois', !!m);
  if (m) {
    const vert = m[1].toLowerCase();
    verifier('index.html — le vert d’avancement n’est pas une teinte d’avis',
      THEMES.reservees.map(c => c.toLowerCase()).indexOf(vert) === -1,
      'Une étape faite ne doit pas porter la couleur d’un avis médical.');
    /* Il doit rester franc : c'était la demande, et un vert éteint est
       exactement ce qu'on vient de corriger. On mesure la saturation. */
    const r = parseInt(vert.slice(1, 3), 16), g = parseInt(vert.slice(3, 5), 16),
          b = parseInt(vert.slice(5, 7), 16);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    verifier('index.html — le vert d’avancement est franc (saturation ' +
      Math.round(sat * 100) + ' %)', sat >= 0.6 && g === mx,
      'Un vert désaturé se lit comme un gris-vert éteint.');
  }
  /* Les étapes faites utilisent bien cette variable, et pas le bleu. */
  verifier('index.html — les étapes réalisées portent le vert d’avancement',
    /\.et-fait \.et-p\{background:var\(--fait\)/.test(html));
})();

section('13 bis. Bandeau photographique — déclaré, léger, lisible');

(function () {
  const b = (VISUELS.bandeaux || [])[0];
  verifier('visuels.js — la photographie du bandeau est déclarée', !!b);
  if (!b) return;

  const rel = VISUELS.dossierBandeau + b.id + '.jpg';
  verifier('bandeau — le fichier est présent (' + rel + ')', existe(rel));
  if (existe(rel)) {
    const ko = fs.statSync(path.join(RACINE, rel)).size / 1024;
    verifier('bandeau — sous ' + VISUELS.poidsMaxBandeauKo + ' Ko (' + Math.round(ko) + ' Ko)',
      ko <= VISUELS.poidsMaxBandeauKo,
      ko > VISUELS.poidsMaxBandeauKo ? 'Cette image est visible sans défiler : ' +
        'elle est chargée immédiatement, son poids se voit au premier écran.' : null);
  }
  verifier('bandeau — son sujet est décrit', !!b.sujet && b.sujet.length >= 20);

  /* --- Aucun fichier non déclaré dans le dossier du bandeau. --- */
  if (existe(VISUELS.dossierBandeau)) {
    const surPlace = fs.readdirSync(path.join(RACINE, VISUELS.dossierBandeau))
      .filter(f => /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(f));
    const declares = (VISUELS.bandeaux || []).map(v => v.id + '.jpg');
    const intrus = surPlace.filter(f => declares.indexOf(f) === -1);
    verifier('bandeau — aucun fichier non déclaré dans le dossier',
      intrus.length === 0, intrus.length ? 'Non déclarés : ' + intrus.join(', ') : null);
  }

  /* --- Le fond ne s'écrit pas en dur : il vient du catalogue. --- */
  /* Deux vérifications, sur la source nue plutôt que sur codeSeul.
     codeSeul efface les gabarits de chaîne, et sa règle d'effacement ne
     sait pas suivre des accolades imbriquées dans un ${...} : sur un
     fichier qui en contient autant que celui-ci, elle emporte des
     morceaux de vrai code. Ici la chaîne EST ce qu'on veut inspecter,
     donc on lit la source telle quelle. */
  const jsBrut = sansCommentaires(lire('suivi/suivi.js'));
  verifier('suivi.js — le nom du fichier de fond n’est pas écrit en dur',
    /images\/bandeau\/\$\{esc\(BANDEAU\.id\)\}\.jpg/.test(jsBrut));
  verifier('suivi.js — la photographie du bandeau vient du catalogue',
    /const BANDEAU\s*=[\s\S]{0,160}VISUELS\.bandeaux/.test(jsBrut));
  verifier('suivi.js — le fond du bandeau porte un texte alternatif vide',
    /class="bb-fond"[\s\S]{0,220}?alt=""/.test(lire('suivi/suivi.js')));
  verifier('suivi.js — le voile est posé au-dessus de la photographie',
    /class="bb-voile"/.test(lire('suivi/suivi.js')));

  /* --- LE CONTRÔLE QUI COMPTE : le voile tient le contraste. --- */
  const css = sansCommentaires(lire('suivi/index.html'));
  const m = css.match(/\.bb-voile\{[^}]*\}/);
  verifier('index.html — le voile de lisibilité existe', !!m);
  if (m) {
    const regle = m[0];
    verifier('voile — il part de la couleur pleine du thème, donc opaque',
      /var\(--pri\)\s+0%/.test(regle),
      !/var\(--pri\)\s+0%/.test(regle) ? 'Sans départ opaque, le texte blanc passe sur ' +
        'une photographie claire.' : null);
    /* Toutes les opacités déclarées dans le dégradé, y compris la plus
       faible : c'est celle-là qui décide de la lisibilité au pire
       endroit. */
    const opacites = (regle.match(/rgba\([^)]*?,\s*(\.\d+|0?\.\d+|1|0)\s*\)/g) || [])
      .map(t => parseFloat(t.replace(/.*,\s*/, '').replace(')', '')));
    const mini = opacites.length ? Math.min.apply(null, opacites) : 1;
    verifier('voile — jamais en dessous d’un tiers d’opacité (min ' + mini + ')',
      mini >= 0.3,
      mini < 0.3 ? 'Le côté clair du dégradé laisse passer trop de photographie : ' +
        'le texte blanc devient illisible sur les zones claires.' : null);
  }

  /* --- Quatre cartes par ligne, et mesurées sur le conteneur. --- */
  verifier('index.html — quatre cartes de domaine par ligne',
    /@container[^{]*\{\s*\.dgrille\{grid-template-columns:repeat\(4,/.test(
      css.replace(/\s*\n\s*/g, '')),
    null);
  verifier('index.html — le compte de colonnes est mesuré sur le conteneur',
    /\.dgrille-c\{container-type:inline-size\}/.test(css));
  verifier('suivi.js — la grille est bien placée dans son conteneur',
    /class="dgrille-c"/.test(lire('suivi/suivi.js')));
  /* Un repli existe pour les navigateurs sans requête de conteneur :
     sinon la grille s'effondrerait à une colonne. */
  verifier('index.html — repli sans requête de conteneur',
    /\.dgrille\{display:grid;grid-template-columns:repeat\(auto-fill/.test(css));
})();

/* ==================================================================
   14. LA MAQUETTE v0 N'A PAS IMPORTÉ SON AUTOMATISME

   L'esthétique de v0 est reprise telle quelle, y compris ses libellés.
   Ce qui a changé est invisible à l'œil : dans la maquette, la pastille
   d'un domaine était un attribut de la donnée, produite par personne et
   toujours affichée. Ici elle est produite par un médecin, elle porte
   son nom et sa date, et son absence s'affiche comme une absence.

   C'est exactement le genre de différence qui disparaît en six mois si
   rien ne la retient : rien, visuellement, n'empêcherait de rebrancher
   ces pastilles sur un calcul, et personne ne le verrait. D'où les
   contrôles ci-dessous, dont trois EXÉCUTENT le code au lieu de le
   lire — la seule façon de vérifier qu'un refus refuse vraiment.
================================================================== */
section('14. Avis par domaine — origine humaine vérifiée');

const A = require('../commun/avis.js');
const DOM2 = require('../commun/domaines.js');

(function () {
  const srcAvis = lire('commun/avis.js');
  const srcApp = lire('plateforme/app.js');
  const srcSuivi = lire('suivi/suivi.js');

  /* --- 14.1 EXÉCUTION : le refus doit refuser. --- */
  const d = {};
  let refuseAnonyme = false, refuseSansStatut = false, refuseStatutInconnu = false;
  try { A.Avis.poser(d, 'foie', 'usuelles', 'x', ''); } catch (e) { refuseAnonyme = true; }
  try { A.Avis.poser(d, 'foie', '', 'x', 'Dr X'); } catch (e) { refuseSansStatut = true; }
  try { A.Avis.poser(d, 'foie', 'parfait', 'x', 'Dr X'); } catch (e) { refuseStatutInconnu = true; }
  verifier('avis.js — un avis sans auteur est refusé', refuseAnonyme,
    !refuseAnonyme ? 'Un avis anonyme serait indistinguable d’un signalement automatique.' : null);
  verifier('avis.js — un avis sans statut est refusé', refuseSansStatut);
  verifier('avis.js — un statut hors liste est refusé', refuseStatutInconnu);

  /* --- 14.2 EXÉCUTION : un avis incomplet déjà en base n'est pas
         restitué. Le cas se produira : un enregistrement tronqué, une
         migration ratée. Il doit disparaître, pas s'afficher à moitié. --- */
  const d2 = { avisDomaines: {
    rein: { domaine: 'rein', statut: 'usuelles', synthese: 'x' },              /* sans auteur */
    foie: { domaine: 'foie', statut: 'usuelles', medecin: 'Dr X' },            /* sans date   */
    peau: { domaine: 'peau', medecin: 'Dr X', date: '2026-07-30' }             /* sans statut */
  } };
  verifier('avis.js — un avis sans auteur n’est pas restitué', A.Avis.lire(d2, 'rein') === null);
  verifier('avis.js — un avis sans date n’est pas restitué', A.Avis.lire(d2, 'foie') === null);
  verifier('avis.js — un avis sans statut n’est pas restitué', A.Avis.lire(d2, 'peau') === null);
  verifier('avis.js — le compte ignore les avis incomplets', A.Avis.compte(d2) === 0);

  /* --- 14.3 EXÉCUTION : un avis complet est bien restitué, signé,
         daté. Sans ce contrôle, on pourrait tout refuser et croire le
         verrou solide. --- */
  const d3 = {};
  A.Avis.poser(d3, 'foie', 'surveiller', 'À recontrôler dans trois mois.', 'Dr Camille Rousseau');
  const ok = A.Avis.lire(d3, 'foie');
  verifier('avis.js — un avis complet est restitué avec auteur et date',
    !!ok && ok.medecin === 'Dr Camille Rousseau' && /^\d{4}-\d{2}-\d{2}$/.test(ok.date));

  /* --- 14.4 Les libellés de la maquette sont conservés au mot. Les
         reformuler en « anormal » ferait perdre ce qu'ils ont de juste. --- */
  ['Dans les valeurs usuelles', 'À surveiller', 'À interpréter avec votre médecin']
    .forEach(l => {
      verifier('avis.js — libellé conservé : « ' + l + ' »',
        A.AVIS_STATUTS.some(s => s.l === l));
    });

  /* --- 14.5 CÔTÉ MÉDECIN : aucune présélection. Un statut coché par
         défaut est une position prise par le logiciel, qu'un clic
         distrait transforme en avis signé. --- */
  const formAvis = (srcApp.match(/function bloc_avis_form[\s\S]*?\n\}/) || [''])[0];
  verifier('app.js — le formulaire d’avis existe', formAvis !== '');
  verifier('app.js — aucun statut présélectionné',
    /a && a\.statut === st\.v \? 'checked' : ''/.test(formAvis) &&
    !/checked>/.test(formAvis.replace(/\$\{[^}]*checked[^}]*\}/g, '')),
    'Le coché ne doit dépendre que d’un avis déjà enregistré.');

  /* --- 14.6 CÔTÉ MÉDECIN : le formulaire ne lit aucune valeur. Un
         écran où l'on choisit une pastille à côté d'un chiffre est un
         écran de comparaison, et l'habitude s'installe vite. --- */
  const interdits = ['.valeurs', 'Biologie.valeur', 'fmtVal', 'BIO_DATES']
    .filter(t => formAvis.indexOf(t) !== -1);
  verifier('app.js — le formulaire d’avis n’affiche aucune valeur mesurée',
    interdits.length === 0,
    interdits.length ? 'Trouvé : ' + interdits.join(', ') : null);
  verifier('app.js — l’absence de suggestion est écrite au médecin',
    /ne propose rien|Aucun statut n’est présélectionné/.test(srcApp));

  /* --- 14.7 CÔTÉ PATIENT : la pastille vient de Avis.lire, et son
         absence s'affiche. --- */
  verifier('suivi.js — la pastille de domaine vient d’un avis lu',
    /Avis\.lire\(DOSSIER, d\.id\)/.test(srcSuivi));
  verifier('suivi.js — l’absence d’avis s’affiche « Non commenté »',
    /Non commenté/.test(srcSuivi));
  const carte = (srcSuivi.match(/function carteDomaine[\s\S]*?\n\}/) || [''])[0];
  const derive = ['.valeurs', 'Biologie.valeur', '>=', '<='].filter(t => carte.indexOf(t) !== -1);
  verifier('suivi.js — la carte de domaine ne compare aucune valeur', derive.length === 0,
    derive.length ? 'Trouvé dans carteDomaine : ' + derive.join(', ') : null);

  /* --- 14.8 Une seule échelle de teintes dans tout le produit : les
         trois statuts réutilisent les classes des marques. --- */
  ['plateforme/app.js', 'suivi/suivi.js'].forEach(f => {
    verifier(f + ' — les statuts réutilisent les teintes des marques',
      /usuelles: 'vert', surveiller: 'orange', interpreter: 'rouge'/.test(lire(f)));
  });

  /* --- 14.9 Les couleurs de domaine identifient, elles n'évaluent
         pas : distinctes entre elles, et aucune ne reprend une teinte
         d'état. --- */
  const cols = DOM2.liste.map(x => x.couleur.toLowerCase());
  verifier('domaines.js — seize teintes distinctes', new Set(cols).size === cols.length);
  const coll = cols.filter(c => DOM2.reservees.indexOf(c) !== -1);
  verifier('domaines.js — aucune teinte de domaine ne reprend une couleur d’état',
    coll.length === 0, coll.length ? 'Collision : ' + coll.join(', ') : null);

  /* --- 14.10 Rien de la chaîne de dépendances de v0 n'est entré. Le
         paquet contenait @vercel/analytics : un script tiers à cookies,
         qui aurait annulé la propriété défendue par tout le reste. --- */
  /* Contrôle sur ce qui est CHARGÉ, pas sur ce qui est documenté : le
     thème Clinique explique en commentaire qu'il n'importe pas
     @vercel/analytics, et se ferait refuser par sa propre règle. Un
     fichier qui ne peut pas nommer ce qu'il refuse finit par ne plus
     l'expliquer, et la raison se perd. */
  ['suivi/index.html', 'suivi/suivi.js', 'plateforme/index.html', 'plateforme/app.js',
   'commun/domaines.js', 'commun/avis.js'].forEach(f => {
    const src = sansCommentaires(lire(f)).replace(/<!--[\s\S]*?-->/g, ' ');
    const tiers = ['vercel', 'analytics', 'gtag', 'googletagmanager', 'next/', 'tailwind']
      .filter(t => src.toLowerCase().indexOf(t) !== -1);
    verifier(f + ' — aucune dépendance de la maquette importée', tiers.length === 0,
      tiers.length ? 'Trouvé : ' + tiers.join(', ') : null);
  });

  /* --- 14.11 L'échelle de référence dessinée de v0 n'est pas reprise :
         elle calcule une position et rend un verdict. --- */
  ['suivi/suivi.js', 'suivi/index.html', 'plateforme/app.js'].forEach(f => {
    const src = codeSeul(lire(f));
    const bad = ['refLow', 'refHigh', 'ReferenceScale', 'bandeNormalite']
      .filter(t => src.indexOf(t) !== -1);
    verifier(f + ' — aucune échelle de référence dessinée', bad.length === 0,
      bad.length ? 'Trouvé : ' + bad.join(', ') : null);
  });
})();

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
