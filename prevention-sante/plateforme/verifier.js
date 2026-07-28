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
 'commun/navigation.js', 'commun/visuels.js'].forEach(f => {
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
 'suivi/index.html', 'commun/navigation.js'].forEach(f => {
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
