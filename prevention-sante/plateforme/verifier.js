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

  /* --- 9.10 La page charge le module, et la barre est bien hors du
         contenu reconstruit à chaque rendu. --- */
  const srcHtml = lire('suivi/index.html');
  verifier('suivi/index.html — le module de thèmes est chargé',
    /commun\/themes\.js/.test(srcHtml));
  verifier('suivi/index.html — la barre de choix est hors du contenu',
    srcHtml.indexOf('id="th-b"') !== -1 &&
    srcHtml.indexOf('id="th-b"') < srcHtml.indexOf('<main id="app">'));
  verifier('suivi/index.html — les cinq apparences ont leurs règles',
    THEMES.liste.filter(t => t.id !== THEMES.defaut)
      .every(t => srcHtml.indexOf('data-theme="' + t.id + '"') !== -1));

  /* --- 9.11 La barre est provisoire, et le dit. --- */
  verifier('suivi.js — la barre de thèmes est annoncée comme provisoire',
    /Provisoire/i.test(srcSuivi) && /retirer/i.test(srcSuivi));
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
