/* =====================================================================
   TABLEAU DE BORD DE SUIVI — ESPACE PATIENT
   Version 0.2 — données fictives.

   CE QUE CETTE PAGE FAIT, ET POURQUOI ELLE S'ARRÊTE LÀ

   Le dossier de reprise autorise explicitement de « stocker, archiver,
   historiser, représenter graphiquement l'évolution de résultats
   biologiques dans le temps ». C'est exactement ce que fait cette page,
   et rien de plus.

   Elle n'affiche AUCUNE zone de normalité, AUCUNE coloration selon la
   valeur, AUCUNE flèche d'amélioration ou de dégradation, AUCUN score
   de synthèse. Les intervalles de référence figurent sur le compte
   rendu du laboratoire, vers lequel la page renvoie.

   LA COULEUR EST CATÉGORIELLE, JAMAIS ÉVALUATIVE
   Chaque famille biologique a sa teinte : Numération, Métabolique,
   Rénal, Hormonal, Hépatique, Mesuré sur place. La couleur dit de quoi
   on parle, pas ce qu'il faut en penser.

   Plusieurs apparences sont proposées, dont une nettement plus colorée.
   La règle survit au changement de thème, et elle est contrôlée :
   aucune palette de familles ne reprend le vert, l'orange ni le rouge,
   qui restent réservés aux marques du médecin. Ces marques portent en
   plus une initiale, un nom et une date — elles ne dépendent donc pas
   de la couleur pour être reconnues.

   La LISTE des familles est définie dans biologie.js, qui fait autorité.
   Les TEINTES sont définies dans commun/themes.js, parce qu'une couleur
   d'affichage relève de la présentation. Aucune n'est écrite ici.

   TROIS CHOIX GRAPHIQUES ASSUMÉS

   1. Les points sont reliés par des SEGMENTS DROITS, pas par une
      courbe lissée. Une courbe suggérerait des valeurs entre deux
      prélèvements, valeurs qui n'existent pas.

   2. L'axe vertical ne part pas de zéro : il est cadré sur l'amplitude
      observée. L'amplitude affichée est écrite en clair, pour ne pas
      exagérer visuellement une variation faible.

   3. La superposition de deux paramètres n'est possible QUE s'ils
      partagent la même unité. Superposer des unités différentes
      obligerait à normaliser, donc à fabriquer une comparaison qui
      n'existe pas dans les données.
   ===================================================================== */

'use strict';

/* Source partagée avec la vue médecin : ../plateforme/biologie.js.
   Une seule définition des paramètres, des dates et des familles, pour
   que ce que le médecin annote soit exactement ce que le patient voit. */
const DATES = BIO_DATES;
const FAMILLES = BIO_FAMILLES;
const PARAMETRES = BIO_PARAMETRES;
/* THÈME COURANT.
   La LISTE des familles vient de biologie.js, qui fait autorité. La
   TEINTE de chaque famille vient de commun/themes.js, parce qu'une
   couleur d'affichage est de la présentation, pas de la médecine. Les
   seize endroits qui affichent une couleur passent tous par ici : il n'y
   a donc qu'un seul point à surveiller.

   teinte() ne reçoit qu'un nom de famille. Aucune valeur mesurée
   n'entre dans le calcul d'une couleur, ce qui est la raison d'être de
   cette indirection autant que le confort de lecture. */
/* APPARENCE FIXÉE. C'était une variable tant qu'un sélecteur permettait
   d'en changer ; le sélecteur est retiré, donc c'est une constante. Elle
   reste lue depuis le catalogue plutôt qu'écrite en dur : changer
   d'apparence se fait en modifiant THEMES.defaut, et rien d'autre. */
const theme = THEMES.defaut;
const famille = nom => {
  const base = Biologie.famille(nom);
  return { nom: base.nom, c: THEMES.teinte(theme, base.nom) || base.c };
};

/* =====================================================================
   MARQUES DU MÉDECIN — LUES DANS LE DOSSIER, PAS ÉCRITES EN DUR
   ---------------------------------------------------------------------
   Les seules couleurs évaluatives de cette page. Elles ne sont JAMAIS
   dérivées d'une valeur par le logiciel : elles proviennent d'un
   enregistrement posé par un médecin depuis l'onglet Biologie de la vue
   praticien, sur une valeur précise à une date précise.

   La chaîne est réelle : le médecin annote, le patient voit. Aucune
   donnée d'affichage n'est simulée ici.

   Trois conditions, sans exception :
     - la marque existe parce qu'un médecin l'a posée ;
     - elle est accompagnée de son nom et de la date ;
     - elle porte le mot « médecin » en clair, pour qu'aucun patient ne
       puisse la prendre pour un signalement automatique.

   Le contrôle de complétude est dans Biologie.lire() : une marque sans
   couleur, sans auteur ou sans horodatage n'est pas restituée.
   ===================================================================== */
const CLE_DOSSIERS = 'pv-sante-test-v1';
const CLE_COMPTE = 'pv-sante-compte-v1';

/* Dossier consulté : celui du compte connecté, sinon le premier dossier
   disponible pour la démonstration. */
function dossierCourant() {
  let base = null, compte = null;
  try { base = JSON.parse(localStorage.getItem(CLE_DOSSIERS) || 'null'); } catch (e) {}
  try { compte = JSON.parse(localStorage.getItem(CLE_COMPTE) || 'null'); } catch (e) {}
  if (!base || !Array.isArray(base.dossiers) || !base.dossiers.length) return null;
  if (compte && compte.dossierId) {
    const d = base.dossiers.find(x => x.id === compte.dossierId);
    if (d && Biologie.compte(d)) return d;
  }
  const avecMarques = base.dossiers.find(x => Biologie.compte(x));
  return avecMarques || base.dossiers[0];
}

let DOSSIER = null;

/* La marque la plus récente posée sur un paramètre. */
function marqueDu(id) {
  return DOSSIER ? Biologie.derniere(DOSSIER, id) : null;
}

/* Toutes les marques d'un paramètre, du relevé le plus récent au plus ancien. */
function marquesDu(id) {
  return DOSSIER ? Biologie.duParametre(DOSSIER, id) : [];
}

const LIB_COULEUR = { vert: 'Vert', orange: 'Orange', rouge: 'Rouge' };

/* Ruban de parcours : ce qui a été fait à chaque visite. */
const VISITES = [
  { date: '2022-04-12', titre: 'Première visite', lieu: 'Centre A (fictif)',
    faits: ['consultation', 'prelevement'] },
  { date: '2023-05-03', titre: 'Visite annuelle', lieu: 'Centre A (fictif)',
    faits: ['consultation', 'prelevement'] },
  { date: '2024-05-21', titre: 'Visite annuelle', lieu: 'Centre A (fictif)',
    faits: ['consultation', 'prelevement', 'respiratoire'] },
  { date: '2025-06-14', titre: 'Visite annuelle', lieu: 'Centre A (fictif)',
    faits: ['consultation', 'prelevement'] },
  { date: '2026-07-20', titre: 'Visite annuelle', lieu: 'Centre B (fictif)',
    faits: ['consultation', 'prelevement', 'vaccin'] }
];
const LIB_FAIT = {
  consultation: { l: 'Consultation', i: 'i-stetho' },
  prelevement:  { l: 'Prélèvement',  i: 'i-flask' },
  respiratoire: { l: 'Exploration respiratoire', i: 'i-lungs' },
  vaccin:       { l: 'Vaccination',  i: 'i-syringe' }
};

const PARCOURS = [
  { date: '2026-07-20', type: 'visite',   titre: 'Visite de prévention', detail: 'Consultation, prélèvement, mise à jour vaccinale.', lieu: 'Centre de santé B (fictif)' },
  { date: '2026-07-20', type: 'document', titre: 'Résultats d’analyses', detail: 'Compte rendu du laboratoire, 1 page.', lieu: 'Laboratoire 1 (fictif)' },
  { date: '2026-07-20', type: 'vaccin',   titre: 'Rappel diphtérie-tétanos-poliomyélite', detail: 'Réalisé sur place.', lieu: 'Centre de santé B (fictif)' },
  { date: '2025-06-14', type: 'visite',   titre: 'Visite de prévention', detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2025-06-14', type: 'document', titre: 'Résultats d’analyses', detail: 'Compte rendu du laboratoire, 1 page.', lieu: 'Laboratoire 1 (fictif)' },
  { date: '2024-05-21', type: 'examen',   titre: 'Exploration de la fonction respiratoire', detail: 'Réalisée après appréciation du médecin.', lieu: 'Centre de santé A (fictif)' },
  { date: '2024-05-21', type: 'visite',   titre: 'Visite de prévention', detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2023-05-03', type: 'visite',   titre: 'Visite de prévention', detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2022-04-12', type: 'visite',   titre: 'Première visite', detail: 'Consultation initiale, questionnaire complet, prélèvement.', lieu: 'Centre de santé A (fictif)' }
];

const COUVERTURE = [
  { libelle: 'Diphtérie, tétanos, poliomyélite', dernier: '2026-07-20', reference: 'Rappels espacés à l’âge adulte, selon le calendrier vaccinal en vigueur.' },
  { libelle: 'Grippe saisonnière', dernier: '2025-11-08', reference: 'Campagne annuelle, à l’automne.' },
  { libelle: 'Covid-19', dernier: '2024-10-15', reference: 'Selon les recommandations en vigueur et la situation de chacun.' },
  { libelle: 'Dépistage du cancer colorectal', dernier: '2023-03-02', reference: 'Le programme national propose un test tous les deux ans, de 50 à 74 ans.' },
  { libelle: 'Frottis ou test HPV', dernier: '2022-09-19', reference: 'Périodicité définie par le programme national, variable selon l’âge.' },
  { libelle: 'Mammographie', dernier: null, reference: 'Le programme national propose un examen tous les deux ans, de 50 à 74 ans.' }
];

const DOCUMENTS = [
  { id: 'DOC-1', date: '2026-07-20', titre: 'Résultats d’analyses — juillet 2026', pages: 1 },
  { id: 'DOC-2', date: '2026-07-20', titre: 'Compte rendu de consultation', pages: 2 },
  { id: 'DOC-3', date: '2025-06-14', titre: 'Résultats d’analyses — juin 2025', pages: 1 },
  { id: 'DOC-4', date: '2024-05-21', titre: 'Exploration respiratoire — compte rendu', pages: 2 }
];

/* ===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const jolieDate = iso => { if (!iso) return '—'; const d = new Date(iso);
  return d.getDate() + ' ' + MOIS_COURT[d.getMonth()] + ' ' + d.getFullYear(); };
const courteDate = iso => { const d = new Date(iso);
  return MOIS_COURT[d.getMonth()].replace('.', '') + ' ' + String(d.getFullYear()).slice(2); };
const annee = iso => new Date(iso).getFullYear();
const ic = (n, cls) => '<svg class="ico ' + (cls || '') + '"><use href="#' + n + '"/></svg>';
const fmtVal = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
/* Initiales d'un nom de médecin, pour la vignette ronde des cartes
   « points à discuter » — la maquette y met un portrait ; on n'a ni
   portrait, ni le droit d'en inventer un. */
const initiales = nom => String(nom || '').replace(/^(Dr|Docteur)\.?\s*/i, '')
  .split(/[\s-]+/).filter(Boolean).slice(0, 2).map(m => m.charAt(0).toUpperCase()).join('');

/* Paramètres partageant l'unité du paramètre donné. */
const memeUnite = p => PARAMETRES.filter(x => x.unite === p.unite && x.id !== p.id);

/* =====================================================================
   EXPLICATIONS

   Toutes les fonctions de ce bloc prennent en entrée un IDENTIFIANT —
   celui d'un paramètre, d'un acte, d'un dépistage — et jamais une
   valeur. C'est la garantie structurelle que le texte affiché ne peut
   pas dépendre du résultat de la personne : la valeur n'est pas
   disponible ici, il n'y a donc rien à comparer, même par accident.

   Si un jour quelqu'un veut afficher « attention, cette valeur est
   inhabituelle », il devra passer un chiffre à ces fonctions, et le
   vérificateur le refusera.
   ===================================================================== */
const LEX = LEXIQUE;

/* Ordre de lecture des actes : celui du parcours réel, du premier
   contact au document final. Il couvre les huit actes du lexique, y
   compris ceux qui ne figurent pas dans le parcours de cette personne :
   savoir en quoi consiste une spirométrie avant qu'elle ne soit
   proposée fait partie du consentement. */
const ORDRE_ACTES = ['questionnaire', 'visite', 'consultation', 'prelevement',
                     'respiratoire', 'vaccin', 'examen', 'document'];

function rubrique(titre, texte, sombre) {
  if (!texte) return '';
  return '<div class="ex-r' + (sombre ? ' sombre' : '') + '">' +
         '<span class="ex-k">' + esc(titre) + '</span>' +
         '<p class="ex-t">' + esc(texte) + '</p></div>';
}

/* Bloc long, sous le graphique. Reçoit le paramètre, pas ses valeurs. */
function blocExplication(paramId) {
  const p = PARAMETRES.find(x => x.id === paramId);
  const e = LEX.parametres[paramId];
  if (!p || !e) return '';
  return `
    <div class="expli">
      <div class="ex-h"><b>Comprendre cette mesure</b>
        <span>${esc(p.nom)} · explication identique pour tout le monde</span></div>
      <p class="ex-lede">Ce texte décrit la mesure elle-même. Il ne commente pas vos
      résultats et ne change pas selon vos chiffres.</p>
      <div class="ex-g">
        ${rubrique('De quoi il s’agit', e.quoi)}
        ${rubrique('Pourquoi c’est mesuré', e.pourquoi)}
        ${rubrique('Comment c’est obtenu', e.comment)}
        ${rubrique('Ce qui la fait varier sans que rien n’aille mal', e.varie)}
        ${rubrique('Ce que cette mesure ne dit pas', e.limites, true)}
        <div class="ex-r ex-u">
          <span class="ex-k">L’unité, en clair</span>
          <p class="ex-t">${esc(e.unite)}</p>
        </div>
      </div>
    </div>`;
}

/* Volet dépliable, sur chaque acte de la frise. */
function blocActe(type) {
  const a = LEX.actes[type];
  if (!a) return '';
  return `
    <details class="lire">
      <summary>Comprendre cet acte</summary>
      <div class="lire-c">
        ${rubrique('De quoi il s’agit', a.quoi)}
        ${rubrique('Comment ça se passe', a.deroulement)}
        ${a.duree && a.duree !== '—' ? rubrique('Combien de temps', a.duree) : ''}
        ${rubrique('Après', a.apres)}
        ${rubrique('Ce que ce n’est pas', a.pasCeQue, true)}
      </div>
    </details>`;
}

/* Volet dépliable, sur chaque ligne de vaccinations et dépistages. */
function blocDepistage(libelle) {
  const d = LEX.depistages[libelle];
  if (!d) return '';
  return `
    <details class="lire">
      <summary>Comprendre</summary>
      <div class="lire-c">
        ${rubrique('De quoi il s’agit', d.quoi)}
        ${rubrique('Pourquoi', d.pourquoi)}
        ${rubrique('Comment', d.comment)}
        ${rubrique('Ce qu’il faut savoir avant de décider', d.limites, true)}
      </div>
    </details>`;
}

/* =====================================================================
   GRAND GRAPHIQUE — une ou deux séries, même unité obligatoire
   ===================================================================== */
function grandGraphique(series) {
  const L = 880, H = 340;
  const mg = { g: 66, d: 26, h: 30, b: 52 };
  const n = DATES.length;

  let toutes = [];
  series.forEach(s => { toutes = toutes.concat(s.valeurs); });
  let mn = Math.min.apply(null, toutes), mx = Math.max.apply(null, toutes);
  if (mn === mx) { mn -= 1; mx += 1; }
  const marge = (mx - mn) * 0.2;
  mn -= marge; mx += marge;

  const x = i => mg.g + (i * (L - mg.g - mg.d)) / Math.max(1, n - 1);
  const y = v => mg.h + (1 - (v - mn) / (mx - mn)) * (H - mg.h - mg.b);

  const nGrid = 4, grid = [];
  for (let k = 0; k <= nGrid; k++) { const v = mn + (k / nGrid) * (mx - mn); grid.push({ y: y(v), v: v }); }

  let out = '<svg viewBox="0 0 ' + L + ' ' + H + '" class="gc" role="img" aria-label="Évolution de ' +
    esc(series.map(s => s.nom).join(' et ')) + '">';

  out += '<defs>';
  series.forEach((s, k) => {
    const co = famille(s.groupe).c;
    out += '<linearGradient id="ga' + k + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + co + '" stop-opacity="' + (series.length > 1 ? '.13' : '.18') + '"/>' +
      '<stop offset="1" stop-color="' + co + '" stop-opacity="0"/></linearGradient>';
  });
  out += '</defs>';

  /* repères horizontaux + valeurs de l'axe */
  grid.forEach(g => {
    out += '<line x1="' + mg.g + '" y1="' + g.y.toFixed(1) + '" x2="' + (L - mg.d) + '" y2="' + g.y.toFixed(1) + '" class="gl"/>';
    out += '<text x="' + (mg.g - 13) + '" y="' + (g.y + 4).toFixed(1) + '" class="gy">' + fmtVal(g.v) + '</text>';
  });

  /* séparateurs d'années, très discrets */
  for (let i = 1; i < n; i++) {
    if (annee(DATES[i]) !== annee(DATES[i - 1])) {
      const xm = (x(i) + x(i - 1)) / 2;
      out += '<line x1="' + xm.toFixed(1) + '" y1="' + mg.h + '" x2="' + xm.toFixed(1) + '" y2="' + (H - mg.b) + '" class="gyear"/>';
    }
  }

  /* aires puis lignes */
  series.forEach((s, k) => {
    const pts = s.valeurs.map((v, i) => ({ x: x(i), y: y(v) }));
    out += '<path d="M' + pts[0].x.toFixed(1) + ',' + (H - mg.b) +
      ' L' + pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' L') +
      ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (H - mg.b) + ' Z" fill="url(#ga' + k + ')"/>';
  });
  /* La seconde série est tracée en TIRETÉ, et non dans une autre teinte.
     Deux paramètres de même unité appartiennent presque toujours à la
     même famille : leur donner deux couleurs casserait la logique
     catégorielle, où une teinte désigne une famille. Le tireté distingue
     sans mentir, et reste lisible en cas de déficience de la vision des
     couleurs. */
  series.forEach((s, k) => {
    const co = famille(s.groupe).c;
    const pts = s.valeurs.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));
    out += '<polyline points="' + pts.join(' ') + '" class="gp' + (k === 1 ? ' gp2' : '') +
      '" stroke="' + co + '"/>';
  });

  /* points */
  series.forEach((s, k) => {
    const co = famille(s.groupe).c;
    s.valeurs.forEach((v, i) => {
      const dernier = i === s.valeurs.length - 1;
      const plein = dernier && k === 0;
      out += '<g class="gpt" data-i="' + i + '" data-s="' + k + '" tabindex="0">' +
        '<line x1="' + x(i).toFixed(1) + '" y1="' + mg.h + '" x2="' + x(i).toFixed(1) + '" y2="' + (H - mg.b) + '" class="gv"/>' +
        (dernier ? '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="11" fill="' + co + '" opacity=".14"/>' : '') +
        '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (dernier ? 7 : 6) +
          '" class="gdot" stroke="' + co + '" fill="' + (plein ? co : 'var(--card)') + '"/>' +
        '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="22" class="ghit"/>' +
        '</g>';
    });
  });

  /* axe des dates */
  DATES.forEach((d, i) => {
    out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - mg.b + 24) + '" class="gx">' + esc(courteDate(d)) + '</text>';
  });

  out += '<text x="' + (mg.g - 13) + '" y="' + (mg.h - 12) + '" class="gu">' + esc(series[0].unite) + '</text>';
  out += '</svg>';

  out += '<p class="gnote">Axe vertical cadré de ' + fmtVal(mn) + ' à ' + fmtVal(mx) + ' ' +
    esc(series[0].unite) + ' — il ne part pas de zéro. Points reliés par des segments droits : ' +
    'aucune valeur n’est supposée entre deux prélèvements.</p>';
  return out;
}

/* Vignette. */
function mini(p) {
  const L = 200, H = 50, pad = 6, co = famille(p.groupe).c;
  const vals = p.valeurs;
  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pts = vals.map((v, i) => {
    const x = pad + (i * (L - 2 * pad)) / Math.max(1, vals.length - 1);
    const y = H - pad - ((v - mn) / (mx - mn)) * (H - 2 * pad);
    return { x: x.toFixed(1), y: y.toFixed(1) };
  });
  const d = pts[pts.length - 1];
  return '<svg viewBox="0 0 ' + L + ' ' + H + '" class="mc" aria-hidden="true">' +
    '<polyline points="' + pts.map(p2 => p2.x + ',' + p2.y).join(' ') + '" class="mp" stroke="' + co + '"/>' +
    '<circle cx="' + d.x + '" cy="' + d.y + '" r="4" fill="' + co + '"/></svg>';
}

/* =====================================================================
   RENDU
   ===================================================================== */
let choisi = 'chol';
let compare = null;   /* id du second paramètre, même unité seulement */

/* =====================================================================
   DISPOSITIONS

   « Déroulé » : tout sur une page, dans l'ordre. Rien n'est caché, mais
   la page est longue et le premier écran ne dit pas par où commencer.

   « Rail et panneau » : la liste des douze mesures reste visible à
   gauche, le détail s'affiche à droite. La page cesse d'être longue,
   au prix d'un clic pour atteindre chaque chose.

   CE QUI NE CHANGE PAS D'UNE DISPOSITION À L'AUTRE
   Les dix sections sont construites une seule fois, identiquement, puis
   arrangées. Chacune apparaît exactement une fois dans chaque shell : le
   vérificateur le contrôle dans les deux sens. Autrement dit, aucune
   information ne peut se perdre en changeant d'agencement, et aucune ne
   peut apparaître dans l'un et pas dans l'autre.

   La seule chose qu'une disposition masque est un DOUBLON DE
   NAVIGATION : dans le rail, les pastilles de choix du paramètre sont
   cachées parce que le rail fait déjà ce travail. Masquer un bouton
   redondant n'est pas masquer une information — mais la frontière est
   assez fine pour être écrite ici et contrôlée.
   ===================================================================== */
const DISPOSITIONS = [
  { id: 'deroule',  nom: 'Déroulé', resume: 'Tout sur une page' },
  { id: 'rail',     nom: 'Rail et panneau', resume: 'Liste à gauche, détail à droite' },
  { id: 'domaines', nom: 'Vue d’ensemble', resume: 'Bilan, parcours, seize domaines' }
];

/* =====================================================================
   VUE D'ENSEMBLE — LES DONNÉES D'AVANCEMENT

   Reprises de la maquette v0, avec une correction de formulation. La
   maquette affichait « Votre bilan est complété à 82 % » en très gros.
   Un pourcentage nu, sur une page de santé, se lit comme une note : on
   ne sait pas 82 % de quoi, et le chiffre reste en tête. On affiche donc
   ce qu'il compte — quatorze examens réalisés sur dix-sept prévus — et
   le pourcentage n'apparaît que comme repère visuel de la barre.

   CE QUI EST COMPTÉ ICI N'EST PAS UNE INTERPRÉTATION. Compter des
   examens réalisés, des comptes rendus reçus et des avis posés par le
   médecin, c'est de l'administratif : aucune valeur mesurée n'entre dans
   ces nombres. La distinction tient tant que personne n'ajoute un
   compteur du genre « 3 valeurs hors normes », qui serait une
   comparaison déguisée en statistique.
   ===================================================================== */
const BILAN = {
  realises: 14, prevus: 17, resultats: 11,
  prochainRdv: '2026-09-22', lieuRdv: 'Centre de santé B (fictif)',
  debut: '2026-07-15', synthesePrevue: '2026-09-22'
};

/* Étapes du parcours. Leur statut est ADMINISTRATIF — fait, pas fait,
   programmé — et jamais clinique. D'où une règle de couleur que la
   maquette ne tenait pas : ces pastilles n'utilisent que le bleu et le
   gris. Reprendre le vert de « validé » aurait donné deux sens à une
   même couleur, à côté du vert de « dans les valeurs usuelles ». */
const ETAPES = [
  { nom: 'Questionnaire initial', etat: 'fait',      quand: '2026-06-28' },
  { nom: 'Prélèvement biologique', etat: 'fait',     quand: '2026-07-02' },
  { nom: 'Consultation', etat: 'fait',               quand: '2026-07-15' },
  { nom: 'Exploration du souffle', etat: 'fait',     quand: '2026-07-15' },
  { nom: 'Examens complémentaires', etat: 'encours', quand: '2026-08-20' },
  { nom: 'Synthèse médicale', etat: 'prevu',         quand: '2026-09-22' },
  { nom: 'Conduite à tenir', etat: 'prevu',          quand: '2026-09-22' }
];
const LIB_ETAT = { fait: 'Réalisé', encours: 'Programmé', prevu: 'À programmer' };

/* Entrée sélectionnée dans la barre latérale de la vue d'ensemble.
   Valeurs possibles : 'apercu', 'section:<clé>', 'dom:<id>',
   'avenir:<clé>'. Un seul sélecteur pour toute la navigation latérale :
   deux états concurrents finissent toujours par se désynchroniser. */
let lateral = 'apercu';
/* DISPOSITION ARRÊTÉE — « Vue d'ensemble ».
   C'est la seule disposition publiée : bandeau photographique, parcours,
   et les seize domaines en cartes illustrées. Comme pour l'apparence, ce
   qui était une variable devient une constante le jour où le choix est
   fait.

   Les deux autres agencements (« Déroulé », « Rail et panneau ») restent
   dans ce fichier sans être atteignables. C'est un choix, pas un oubli :
   ils ne coûtent rien à l'affichage, ils construisent les mêmes dix
   sections à partir du même objet S, et le vérificateur continue de
   contrôler qu'aucun des trois n'escamote une section. Le jour où on est
   certain de ne plus y revenir, ils se suppriment d'un bloc. */
const disposition = 'domaines';

/* Vue affichée dans le panneau. « mesure » suit le paramètre choisi. */
let vue = 'accueil';
let railOuvert = false;

/* Entrées du rail qui ne sont pas des mesures. */
const VUES = [
  { id: 'accueil',    nom: 'Accueil',                 sections: ['cockpit', 'lire', 'vignettes'] },
  { id: 'parcours',   nom: 'Mon parcours',            sections: ['parcours'] },
  { id: 'couverture', nom: 'Vaccinations, dépistages', sections: ['couverture'] },
  { id: 'documents',  nom: 'Mes comptes rendus',      sections: ['documents'] },
  { id: 'actes',      nom: 'Chaque acte expliqué',    sections: ['actes'] },
  { id: 'glossaire',  nom: 'Les mots qu’on emploie',  sections: ['glossaire'] },
  { id: 'limites',    nom: 'Ce que la page ne fait pas', sections: ['limites'] }
];

/* Ordre de la page longue. Les dix sections, une fois chacune. */
const ORDRE_DEROULE = ['cockpit', 'lire', 'graphique', 'vignettes', 'parcours',
                       'actes', 'couverture', 'documents', 'glossaire', 'limites'];

function shellDeroule(S) {
  return ORDRE_DEROULE.map(k => S[k]).join('\n');
}

/* =====================================================================
   SHELL « DOMAINES » — L'ESTHÉTIQUE v0, L'ORIGINE INCHANGÉE

   Grille de seize cartes illustrées, exactement la structure de la
   maquette : image en haut avec la pastille de statut posée dessus,
   nom du domaine, formulation grand public, nombre de résultats.

   UNE SEULE DIFFÉRENCE, INVISIBLE À L'ŒIL, ET C'EST TOUT LE SUJET.
   Dans la maquette, la pastille était un attribut de la donnée : elle
   s'affichait toujours, produite par personne. Ici elle vient de
   Avis.lire(), qui rend null si l'avis n'a pas de statut, pas d'auteur
   ou pas de date. Un domaine que le médecin n'a pas commenté affiche
   « Non commenté » — pas une pastille verte par défaut. C'est le seul
   endroit où l'on pourrait rebrancher un calcul sans que ça se voie,
   donc le seul qu'il faut verrouiller.

   L'image ne dépend d'aucun avis : les seize cartes s'affichent
   toujours, y compris sur un dossier vierge. Un domaine masqué faute
   d'avis serait un domaine dont la personne ignore qu'il a été abordé.
   ===================================================================== */
function carteDomaine(d) {
  const a = DOSSIER ? Avis.lire(DOSSIER, d.id) : null;
  const st = a ? Avis.statut(a.statut) : null;
  const n = d.parametres.length;

  return `
    <button class="dcarte" data-dom="${esc(d.id)}" style="--dc:${d.couleur}">
      <span class="dc-img">
        <img src="../images/domaines/${esc(d.id)}.jpg" width="800" height="500"
             loading="lazy" decoding="async"
             alt="${esc(VIS_LOCAL[d.id] || ('Illustration : ' + d.nom))}">
        ${a ? `<span class="dc-pastille m-${esc(TEINTE_AVIS[a.statut])}">
                 <i></i>${esc(st.l)}</span>`
            : `<span class="dc-pastille dc-neutre"><i></i>Non commenté</span>`}
      </span>
      <span class="dc-corps">
        <b class="dc-nom">${esc(d.nom)}</b>
        <span class="dc-clair">${esc(d.clair)}</span>
        <span class="dc-syn">${a && a.synthese ? esc(a.synthese)
          : 'Aucune synthèse écrite pour ce domaine.'}</span>
        <span class="dc-pied">
          <em>${n ? n + ' mesure' + (n > 1 ? 's' : '') : 'Sans mesure biologique'}</em>
          <span class="dc-go">Consulter ${ic('i-arrow')}</span>
        </span>
      </span>
    </button>`;
}

/* Correspondance statut d'avis -> classe de teinte déjà en place. Une
   seule échelle de couleurs dans tout le produit. */
const TEINTE_AVIS = { usuelles: 'vert', surveiller: 'orange', interpreter: 'rouge' };

/* Photographie de fond du bandeau. Prise dans le catalogue, jamais
   écrite en dur : c'est ce qui garantit qu'aucune image ne s'affiche
   sans être déclarée. */
const BANDEAU = (typeof VISUELS !== 'undefined' && VISUELS.bandeaux &&
                 VISUELS.bandeaux[0]) || { id: 'hero-clinique' };

/* Textes alternatifs, repris du catalogue des visuels. */
const VIS_LOCAL = {};
if (typeof VISUELS !== 'undefined' && VISUELS.locales) {
  VISUELS.locales.forEach(v => { VIS_LOCAL[v.id] = v.sujet; });
}

/* BANDEAU DE BILAN — deux colonnes, et court.

   Il était trop haut : une barre de progression sur toute la largeur,
   puis deux lignes de mise en garde, empilées sous le titre. La maquette
   met tout de front — texte à gauche, cadran à droite — et tient en un
   peu plus de cent points de haut. C'est refait ainsi.

   Une différence assumée avec la maquette : elle affiche « 82 % » en gros
   dans le cadran. Un pourcentage nu sur une page de santé se lit comme
   une note, et on ne sait pas 82 % de quoi. Le cadran affiche donc la
   fraction — 14/17 — qui dit la même chose sans se faire passer pour un
   résultat. L'arc, lui, reste proportionnel.

   La mise en garde n'est pas supprimée, elle est ramenée à une phrase et
   collée au texte : un compteur d'avancement n'est pas un compteur de
   bonne santé, et ça doit rester écrit là où le compteur s'affiche. */
function bandeauBilan() {
  const pct = Math.round((BILAN.realises / BILAN.prevus) * 100);
  const lu = BILAN.realises + ' examens réalisés sur ' + BILAN.prevus + ' prévus';
  return `
    <section class="bilan-b">
      <img class="bb-fond" src="../images/bandeau/${esc(BANDEAU.id)}.jpg"
           width="1024" height="490" decoding="async" alt="">
      <span class="bb-voile" aria-hidden="true"></span>
      <div class="bb-in">
        <div class="bb-txt">
          <p class="bb-k">Bilan de prévention en cours</p>
          <h2 class="bb-t">${esc(lu)}</h2>
          <p class="bb-s">Commencé le ${esc(jolieDate(BILAN.debut))}. La synthèse avec votre
          médecin est prévue le ${esc(jolieDate(BILAN.synthesePrevue))}. Ce compteur suit
          l’avancement du parcours, pas vos résultats.</p>
        </div>
        <div class="bb-cadran" role="img" aria-label="${esc(lu)}"
             style="--part:${pct}%">
          <span class="bb-cadran-in">${BILAN.realises}<em>/${BILAN.prevus}</em></span>
        </div>
      </div>
    </section>`;
}

/* LES QUATRE CHIFFRES DE LA MAQUETTE.

   Ils remplacent mes quatre tuiles (rendez-vous, questionnaire,
   documents, antériorité), qui n'existent pas dans la maquette.

   « Points à discuter » est le seul des quatre qui demande une
   précaution. Ce n'est pas le logiciel qui décide de ce qui mérite un
   échange : le chiffre compte les domaines pour lesquels un médecin a
   écrit et signé un avis « à surveiller » ou « à interpréter ». Il
   dénombre des phrases de médecin, il n'évalue aucune valeur. */
function blocStats() {
  const aDiscuter = DOSSIER ? DOMAINES.liste
    .map(d => Avis.lire(DOSSIER, d.id))
    .filter(a => a && (a.statut === 'surveiller' || a.statut === 'interpreter')).length : 0;

  const cases = [
    { i: 'i-clipboard', v: BILAN.realises + '/' + BILAN.prevus, k: 'Examens réalisés',
      d: 'sur ce bilan' },
    { i: 'i-flask', v: String(BILAN.resultats), k: 'Résultats disponibles',
      d: (BILAN.prevus - BILAN.resultats) + ' encore attendus' },
    { i: 'i-chat', v: String(aDiscuter), k: 'Points à discuter',
      d: 'signalés par votre médecin' },
    { i: 'i-calendar', v: jolieDate(BILAN.synthesePrevue), k: 'Prochain rendez-vous',
      d: 'synthèse médicale' }
  ];

  return `
    <div class="c-tiles">
      ${cases.map(c => `
        <div class="tile">
          <div class="t-ic">${ic(c.i)}</div>
          <b class="t-v">${esc(c.v)}</b>
          <span class="t-k">${esc(c.k)}</span>
          <span class="t-d">${esc(c.d)}</span>
        </div>`).join('')}
    </div>`;
}

function blocEtapes() {
  return `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Votre parcours</h2>
        <p class="b-s">Les grandes étapes, dans l’ordre. Les pastilles disent seulement ce qui
        est fait ou pas : elles n’emploient jamais les couleurs qui servent aux avis de votre
        médecin.</p>
      </div></div>
      <div class="etapes-c">
      <ol class="etapes">
        ${ETAPES.map(e => `
          <li class="et et-${esc(e.etat)}">
            <span class="et-p">${e.etat === 'fait' ? ic('i-check') : ''}</span>
            <b class="et-n">${esc(e.nom)}</b>
            <span class="et-e">${esc(LIB_ETAT[e.etat])}</span>
            <span class="et-d">${esc(jolieDate(e.quand))}</span>
          </li>`).join('')}
      </ol>
      </div>
    </section>`;
}

/* Points à discuter : uniquement des avis SIGNÉS du médecin, et
   uniquement ceux qu'il a lui-même qualifiés « à surveiller » ou « à
   interpréter ». Rien n'est sélectionné à partir d'une valeur : la liste
   est le reflet de ses choix, filtrée sur son propre vocabulaire. */
function blocPoints() {
  const points = DOSSIER ? DOMAINES.liste
    .map(d => ({ d: d, a: Avis.lire(DOSSIER, d.id) }))
    .filter(x => x.a && (x.a.statut === 'surveiller' || x.a.statut === 'interpreter')) : [];

  return `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Points à discuter</h2>
        <p class="b-s">Ce que votre médecin a signalé comme méritant un échange. Chaque ligne
        porte son nom et la date. Cette liste n’est pas constituée par le logiciel : elle ne
        contient que ce qu’il a écrit.</p>
      </div></div>
      ${points.length ? `
        <div class="points">
          ${points.map(x => `
            <div class="pt m-${esc(TEINTE_AVIS[x.a.statut])}">
              <div class="pt-h">
                <span class="pt-ini">${esc(initiales(x.a.medecin))}</span>
                <span class="pt-qui">${esc(x.a.medecin)}
                  <em>Le ${esc(jolieDate(x.a.date))}</em></span>
                <span class="pt-st"><i></i>${esc(Avis.statut(x.a.statut).l)}</span>
              </div>
              <b class="pt-d" style="--dc:${x.d.couleur}">${esc(x.d.nom)}</b>
              <p class="pt-c">${x.a.synthese ? esc(x.a.synthese)
                : 'Domaine signalé, sans phrase écrite.'}</p>
            </div>`).join('')}
        </div>`
      : `<p class="cmp-n">Aucun point n’a été signalé par votre médecin à ce jour. Ce n’est pas
         une conclusion : c’est l’état de ce qui a été écrit.</p>`}
    </section>`;
}

/* =====================================================================
   BARRE LATÉRALE DE LA VUE D'ENSEMBLE

   La maquette v0 en avait une, avec quinze entrées réparties en quatre
   groupes. Fait notable, et vérifié dans son code : NEUF de ces quinze
   entrées mènent à un écran « module à venir ». Sa barre latérale
   annonce donc un produit plus large que ce qu'elle contient — ce qui est
   normal pour une maquette, à condition de ne pas le reproduire sans le
   savoir.

   Ici, cinq entrées seulement sont à venir, et elles le disent. Les
   autres mènent à quelque chose de réel, parce que les spécialités de la
   maquette correspondent à des domaines que nous avons déjà :
   Cardiologie est le domaine cardiovasculaire, Pneumologie la
   respiration, Dermatologie la peau, Ophtalmologie la vision. Plutôt que
   de créer neuf pages vides, on nomme ce qui existe.

   AUCUNE ENTRÉE MORTE. Le vérificateur exige que chaque entrée mène soit
   à une section réelle, soit à un domaine réel, soit à un écran « à
   venir » qui dit ce qu'il contiendra. Une entrée qui ne mène nulle part
   est le défaut le plus courant des barres latérales, et le plus difficile
   à repérer une fois qu'on s'y est habitué.
   ===================================================================== */
const LATERAL = [
  { titre: 'Mon bilan', items: [
    { id: 'apercu',            nom: 'Vue d’ensemble',        ic: 'i-grid' },
    { id: 'section:parcours',  nom: 'Mon parcours',          ic: 'i-route' }
  ]},
  { titre: 'Résultats', items: [
    { id: 'section:vignettes', nom: 'Mes mesures',           ic: 'i-tube' },
    { id: 'dom:cardiovasculaire', nom: 'Cardiologie',        ic: 'i-heart' },
    { id: 'dom:respiration',   nom: 'Pneumologie',           ic: 'i-lungs' },
    { id: 'dom:sommeil',       nom: 'Sommeil',               ic: 'i-moon' },
    { id: 'dom:peau',          nom: 'Dermatologie',          ic: 'i-face' },
    { id: 'dom:vision',        nom: 'Ophtalmologie',         ic: 'i-eye' },
    { id: 'avenir:imagerie',   nom: 'Imagerie',              ic: 'i-image' },
    { id: 'avenir:complementaires', nom: 'Examens complémentaires', ic: 'i-scan' }
  ]},
  { titre: 'Suivi', items: [
    { id: 'section:couverture', nom: 'Vaccinations, dépistages', ic: 'i-shield' },
    { id: 'section:documents',  nom: 'Mes comptes rendus',    ic: 'i-file' },
    { id: 'section:actes',      nom: 'Chaque acte expliqué',  ic: 'i-clipboard' },
    { id: 'avenir:rdv',         nom: 'Rendez-vous',           ic: 'i-calendar' },
    { id: 'avenir:objets',      nom: 'Objets connectés',      ic: 'i-watch' },
    { id: 'avenir:messagerie',  nom: 'Messagerie sécurisée',  ic: 'i-chat' }
  ]},
  { titre: 'Repères', items: [
    { id: 'section:glossaire',  nom: 'Les mots employés',     ic: 'i-book' },
    { id: 'section:limites',    nom: 'Ce que la page ne fait pas', ic: 'i-info' }
  ]}
];

/* Les cinq modules à venir. Chacun dit ce qu'il contiendra ET ce qui
   manque pour le faire : un « bientôt disponible » sans raison finit par
   rester trois ans. */
const A_VENIR = {
  imagerie: { nom: 'Imagerie',
    quoi: 'Les comptes rendus et les images des examens d’imagerie, avec leur historique.',
    manque: 'Un stockage certifié pour les fichiers d’imagerie, qui sont volumineux et ne ' +
            'peuvent pas vivre sur l’hébergement actuel.' },
  complementaires: { nom: 'Examens complémentaires',
    quoi: 'Les examens décidés au cas par cas hors du parcours de base, avec leur indication.',
    manque: 'La liste des actes réalisables par centre, qui varie selon le plateau disponible.' },
  rdv: { nom: 'Rendez-vous',
    quoi: 'La prise de rendez-vous et le choix du centre, avec les créneaux réels.',
    manque: 'Le raccordement à l’agenda des centres. Le module de rendez-vous existe déjà ' +
            'dans l’espace patient : cette entrée y renverra.' },
  objets: { nom: 'Objets connectés',
    quoi: 'Les données de votre montre, de votre balance ou de votre tensiomètre, ' +
          'rassemblées avec le reste de votre suivi.',
    manque: 'Une note de cadrage : base légale, durée de conservation, transferts hors Union ' +
            'européenne des interfaces constructeurs, et surtout ce que la plateforme ' +
            's’interdira de calculer sur ces mesures. La maquette affichait des phrases du ' +
            'type « signe d’une bonne récupération » : c’est exactement ce qui ne sera pas ' +
            'repris.' },
  messagerie: { nom: 'Messagerie sécurisée',
    quoi: 'Un échange écrit avec l’équipe médicale, conservé dans le dossier.',
    manque: 'Un hébergement certifié et un service de messagerie de santé conforme. Une ' +
            'messagerie improvisée sur cette base serait une fuite organisée.' }
};

function blocAVenir(cle) {
  const m = A_VENIR[cle];
  if (!m) return '';
  return `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>${esc(m.nom)}</h2>
        <p class="b-s">Module à venir. Cette entrée figure dans la navigation pour que vous
        sachiez ce qui est prévu, pas pour laisser croire que c’est en service.</p>
      </div></div>
      <div class="avenir">
        <div class="ex-r">
          <span class="ex-k">Ce que ce module contiendra</span>
          <p class="ex-t">${esc(m.quoi)}</p>
        </div>
        <div class="ex-r sombre">
          <span class="ex-k">Ce qui manque pour le faire</span>
          <p class="ex-t">${esc(m.manque)}</p>
        </div>
      </div>
    </section>`;
}

/* Sections atteintes par la barre latérale. Sert au vérificateur autant
   qu'à la lecture : c'est la liste de ce qui reste accessible. */
const SOUS_GRILLE = ['parcours', 'actes', 'couverture', 'documents',
                     'glossaire', 'limites'];

function shellDomaines(S, groupes, p) {
  /* Chaque entrée porte son pictogramme, et l'entrée active se signale
     par un fond bleu pâle plutôt que par un aplat bleu : c'est ce que
     fait la maquette, et c'est plus lisible — du texte foncé sur un fond
     clair, au lieu de blanc sur bleu saturé. */
  const item = (x, actif) =>
    '<button class="rail-x' + (actif ? ' on' : '') + '" data-lat="' + esc(x.id) + '">' +
    ic(x.ic || 'i-info') + '<span>' + esc(x.nom) + '</span></button>';

  const barre = `
    <aside class="rail">
      <button class="rail-b" id="rail-b" aria-expanded="${railOuvert ? 'true' : 'false'}">
        ${ic('i-grid')}<span>${esc(titreLateral())}</span><i class="chev"></i>
      </button>
      <nav class="rail-nav${railOuvert ? ' ouvert' : ''}" aria-label="Mes pages">
        <div class="rail-logo">
          <span class="rail-mark">${ic('i-heart')}</span>
          <span class="rail-nom">Prévention Santé<em>Médecine préventive</em></span>
        </div>
        ${LATERAL.map(g => '<p class="rail-t">' + esc(g.titre) + '</p>' +
          g.items.map(x => item(x, lateral === x.id)).join('')).join('')}
        <div class="rail-pied">
          <span class="rail-ini">CD</span>
          <span class="rail-qui">Camille Durand<em>Dossier fictif nº 0000-0000</em></span>
        </div>
      </nav>
    </aside>`;

  let panneau;
  if (lateral === 'apercu') {
    panneau = `
      ${S.cockpit}
      ${bandeauBilan()}
      ${blocStats()}
      ${blocEtapes()}
      ${blocPoints()}
      <section class="bloc">
        <div class="b-h"><div>
          <h2>Vos domaines de santé</h2>
          <p class="b-s">Seize domaines, qu’ils aient donné un résultat ou non. Une pastille
          n’apparaît que si votre médecin a qualifié le domaine : elle porte alors son nom et
          la date. Aucun statut n’est calculé.</p>
        </div></div>
        <div class="dgrille-c">
          <div class="dgrille">${DOMAINES.liste.map(carteDomaine).join('')}</div>
        </div>
      </section>
      ${S.lire}`;
  } else if (lateral.indexOf('section:') === 0) {
    panneau = S[lateral.slice(8)] || '';
  } else if (lateral.indexOf('avenir:') === 0) {
    panneau = blocAVenir(lateral.slice(7));
  } else if (lateral.indexOf('dom:') === 0) {
    panneau = panneauDomaine(S, lateral.slice(4));
  } else {
    panneau = S.cockpit;
  }

  return '<div class="shell">' + barre + '<div class="panneau">' + panneau + '</div></div>';
}

function titreLateral() {
  for (let i = 0; i < LATERAL.length; i++) {
    for (let j = 0; j < LATERAL[i].items.length; j++) {
      if (LATERAL[i].items[j].id === lateral) return LATERAL[i].items[j].nom;
    }
  }
  if (lateral.indexOf('dom:') === 0) {
    const d = DOMAINES.trouver(lateral.slice(4));
    if (d) return d.nom;
  }
  return 'Vue d’ensemble';
}

/* Détail d'un domaine : bandeau illustré, avis du médecin s'il existe,
   puis les mesures du domaine et le graphique de celle qui est choisie. */
function panneauDomaine(S, id) {
  const d = DOMAINES.trouver(id);
  if (!d) return S.cockpit;
  const a = DOSSIER ? Avis.lire(DOSSIER, d.id) : null;
  const st = a ? Avis.statut(a.statut) : null;
  const params = d.parametres.map(x => PARAMETRES.filter(y => y.id === x)[0]).filter(Boolean);

  return `
    <div class="dtete" style="--dc:${d.couleur}">
      <button class="dretour" data-lat="apercu">${ic('i-arrow')}Vue d’ensemble</button>
      <div class="dt-in">
        <img class="dt-img" src="../images/domaines/${esc(d.id)}.jpg" width="720" height="450"
             decoding="async" alt="${esc(VIS_LOCAL[d.id] || ('Illustration : ' + d.nom))}">
        <div>
          <h1>${esc(d.nom)}</h1>
          <p class="dt-clair">${esc(d.clair)}</p>
          ${a ? `
          <div class="dt-avis m-${esc(TEINTE_AVIS[a.statut])}">
            <span class="dt-past"><i></i>${esc(st.l)}</span>
            <p class="dt-syn">${a.synthese ? esc(a.synthese)
              : 'Domaine qualifié, sans synthèse écrite.'}</p>
            <p class="dt-sig">${esc(a.medecin)} · le ${esc(jolieDate(a.date))}</p>
          </div>` : `
          <div class="dt-avis dc-neutre">
            <span class="dt-past"><i></i>Non commenté</span>
            <p class="dt-syn">Votre médecin n’a pas encore qualifié ce domaine. Les mesures
            ci-dessous sont affichées telles que transmises.</p>
          </div>`}
        </div>
      </div>
    </div>

    ${params.length ? `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Les mesures de ce domaine</h2>
        <p class="b-s">Cliquez une mesure pour l’afficher en grand, avec son historique et son
        explication.</p>
      </div></div>
      <div class="minis">
        ${params.map(x => `
          <button class="minicard ${x.id === choisi ? 'on' : ''}" data-p="${esc(x.id)}"
                  style="--fc:${famille(x.groupe).c}">
            <span class="m-nom">${esc(x.nom)}
              ${marqueDu(x.id) ? `<i class="mqm-tag m-${esc(marqueDu(x.id).couleur)}"
                 title="Marque ${esc(LIB_COULEUR[marqueDu(x.id).couleur])} posée par ${esc(marqueDu(x.id).medecin)}"
                 >${esc(LIB_COULEUR[marqueDu(x.id).couleur].charAt(0))}</i>` : ''}</span>
            ${mini(x)}
            <span class="m-val"><b>${fmtVal(x.valeurs[x.valeurs.length - 1])}</b> ${esc(x.unite)}</span>
            <span class="m-per">${esc(courteDate(DATES[0]))} → ${esc(courteDate(DATES[DATES.length - 1]))}</span>
            <span class="m-res">${esc(LEX.parametres[x.id].resume)}</span>
          </button>`).join('')}
      </div>
    </section>
    ${params.some(x => x.id === choisi) ? S.graphique : ''}`
    : `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Aucune mesure biologique dans ce domaine</h2>
        <p class="b-s">Ce domaine est abordé au questionnaire et en consultation, sans donner de
        chiffre de laboratoire. Il figure ici pour que vous sachiez qu’il a été abordé.</p>
      </div></div>
    </section>
    ${S.vignettes}`}`;
}

function shellRail(S, groupes, p) {
  const item = (id, nom, actif, couleur) =>
    '<button class="rail-x' + (actif ? ' on' : '') + '" data-vue="' + esc(id) + '"' +
    (couleur ? ' style="--fc:' + couleur + '"' : '') + '>' +
    (couleur ? '<i class="pt"></i>' : '') + esc(nom) + '</button>';

  const mesures = groupes.map(g =>
    '<p class="rail-f" style="--fc:' + famille(g.nom).c + '">' + esc(g.nom) + '</p>' +
    g.items.map(x => item('mesure:' + x.id,
      x.nom,
      vue === 'mesure' && x.id === choisi,
      famille(x.groupe).c)).join('')).join('');

  /* Sections affichées dans le panneau, selon la vue. */
  let panneau;
  if (vue === 'mesure') {
    panneau = S.graphique;
  } else {
    const v = VUES.filter(x => x.id === vue)[0] || VUES[0];
    panneau = v.sections.map(k => S[k]).join('\n');
  }

  const titreCourant = vue === 'mesure'
    ? p.nom
    : (VUES.filter(x => x.id === vue)[0] || VUES[0]).nom;

  return `
    <div class="shell">
      <aside class="rail">
        <button class="rail-b" id="rail-b" aria-expanded="${railOuvert ? 'true' : 'false'}">
          ${ic('i-clipboard')}<span>${esc(titreCourant)}</span><i class="chev"></i>
        </button>
        <nav class="rail-nav${railOuvert ? ' ouvert' : ''}" aria-label="Mes mesures et mes pages">
          ${item('accueil', 'Accueil', vue === 'accueil', null)}
          <p class="rail-t">Mes mesures</p>
          ${mesures}
          <p class="rail-t">Mes pages</p>
          ${VUES.filter(v => v.id !== 'accueil').map(v =>
            item(v.id, v.nom, vue === v.id, null)).join('')}
        </nav>
      </aside>
      <div class="panneau">${panneau}</div>
    </div>`;
}

function rendre() {
  const p = PARAMETRES.find(x => x.id === choisi) || PARAMETRES[0];
  const alt = compare ? PARAMETRES.find(x => x.id === compare) : null;
  const series = alt && alt.unite === p.unite ? [p, alt] : [p];
  const co = famille(p.groupe).c;

  const groupes = [];
  PARAMETRES.forEach(x => {
    let g = groupes.find(y => y.nom === x.groupe);
    if (!g) { g = { nom: x.groupe, items: [] }; groupes.push(g); }
    g.items.push(x);
  });

  /* Chaque section est construite à part, puis DISPOSÉE par un shell.
     Le contenu ne dépend jamais de la disposition retenue : c'est la même
     condition que pour les thèmes, et pour la même raison. Changer
     d'agencement ne doit rien changer de ce que la personne apprend.
     Le vérificateur contrôle qu'aucune section n'est absente d'un shell. */
  const S = {};
  /* EN-TÊTE. Posé sur le fond de page, sans carte et sans encadrement :
     c'est ce que fait la maquette, et c'est ce qui permet au bandeau bleu
     d'être la première chose qu'on voit sous le nom. */
  S.cockpit = `
    <!-- ===== en-tête ===== -->
    <header class="entete">
      <p class="c-eyebrow">Mon suivi</p>
      <h1>Bonjour Camille.</h1>
      <p class="c-sub">Cinq visites depuis avril 2022, douze paramètres suivis. Tout ce qui
      suit vous appartient et n’est visible que de vous et du médecin qui vous suit.</p>
    </header>
  `;

  /* LA FRISE DES VISITES rejoint la section « Mon parcours ».
     Elle n'existe pas dans la maquette, et elle occupait le haut de la
     vue d'ensemble. Elle n'est pas supprimée pour autant : elle raconte
     quelque chose que la liste datée ne montre pas, la répartition des
     visites dans le temps. Elle est donc déplacée, pas jetée — et pas
     dans une clé de section à elle, qui serait une section de plus à
     rendre atteignable pour rien. */
  const friseVisites = `
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Mes visites, année par année</h2>
        <p class="b-s">Cinq passages depuis 2022, avec ce qui a été fait à chacun.</p>
      </div></div>
      <div class="ruban">
        <div class="r-line"></div>
        ${VISITES.map((v, i) => `
          <div class="r-v ${i === VISITES.length - 1 ? 'last' : ''}">
            <span class="r-dot"></span>
            <span class="r-an">${annee(v.date)}</span>
            <span class="r-d">${esc(jolieDate(v.date))}</span>
            <b class="r-t">${esc(v.titre)}</b>
            <span class="r-f">
              ${v.faits.map(f => `<span class="r-tag" title="${esc(LIB_FAIT[f].l)}">
                ${ic(LIB_FAIT[f].i)}<em>${esc(LIB_FAIT[f].l)}</em></span>`).join('')}
            </span>
            <span class="r-l">${esc(v.lieu)}</span>
          </div>`).join('')}
      </div>
    </section>
  `;
  S.lire = `
    <!-- ===== comment lire cette page ===== -->
    <section class="lire-page">
      <h2>${esc(LEX.intro.titre)}</h2>
      ${LEX.intro.paragraphes.map(t => `<p>${esc(t)}</p>`).join('')}
    </section>
  `;
  S.graphique = `
    <!-- ===== graphique ===== -->
    <section class="bloc">
      <div class="b-h">
        <div>
          <h2>Évolution dans le temps</h2>
          <p class="b-s">Les valeurs sont affichées telles que transmises par le
          laboratoire, sans être retouchées ni arrondies.</p>
        </div>
        <a class="b-lien" href="#documents" data-lien-doc>Ouvrir mes comptes rendus ${ic('i-arrow')}</a>
      </div>

      <div class="chips">
        ${groupes.map(g => `<span class="chip-grp" style="--fc:${famille(g.nom).c}">
          <em>${esc(g.nom)}</em>
          ${g.items.map(x => `<button class="chip ${x.id === choisi ? 'on' : ''}"
            data-p="${esc(x.id)}" style="--fc:${famille(x.groupe).c}">${esc(x.nom)}</button>`).join('')}
        </span>`).join('')}
      </div>

      <div class="g-layout">
        <div class="g-main">
          <div class="g-head">
            <div>
              <b class="g-nom" style="color:${co}">${esc(p.nom)}</b>
              <span class="g-unit">${esc(p.unite)}</span>
              <span class="g-fam" style="--fc:${co}">${esc(p.groupe)}</span>
            </div>
            ${series.length > 1 ? `
            <div class="g-leg">
              <span><i style="--fc:${famille(series[0].groupe).c}"></i>${esc(series[0].nom)}</span>
              <span><i class="tirets" style="--fc:${famille(series[1].groupe).c}"></i>${esc(series[1].nom)}</span>
            </div>` : ''}
          </div>
          <div class="g-wrap" id="gwrap">${grandGraphique(series)}</div>

          ${marquesDu(p.id).map(m => `
            <div class="mqm m-${esc(m.couleur)}">
              <span class="mqm-pt"></span>
              <div>
                <p class="mqm-k">Note de votre médecin — marque ${esc(LIB_COULEUR[m.couleur])}
                  · sur le relevé du ${esc(jolieDate(m.dateValeur))}</p>
                <p class="mqm-c">${m.commentaire ? esc(m.commentaire) : 'Valeur marquée, sans commentaire écrit.'}</p>
                <p class="mqm-s">${esc(m.medecin)} · annotation du ${esc(jolieDate(m.date))}</p>
              </div>
            </div>`).join('')}

          ${memeUnite(p).length ? `
          <div class="cmp">
            <span class="cmp-k">Superposer un paramètre en ${esc(p.unite)}</span>
            <div class="cmp-b">
              <button class="cmp-x ${!compare ? 'on' : ''}" data-c="">Aucun</button>
              ${memeUnite(p).map(x => `<button class="cmp-x ${compare === x.id ? 'on' : ''}"
                data-c="${esc(x.id)}" style="--fc:${famille(x.groupe).c}">${esc(x.nom)}</button>`).join('')}
            </div>
            <p class="cmp-n">Seuls les paramètres partageant l’unité sont proposés. Superposer
            des unités différentes obligerait à normaliser les échelles, donc à fabriquer une
            comparaison qui n’existe pas dans les données.</p>
          </div>` : `
          <p class="cmp-n" style="margin-top:18px">Aucun autre paramètre n’est exprimé en
          ${esc(p.unite)} : il n’y a donc rien à superposer sans déformer les échelles.</p>`}
        </div>

        <div class="g-side">
          <p class="s-k">Les relevés</p>
          <table class="s-tbl">
            ${series.map((s, k) => `
              <tr class="s-sep"><td colspan="2" style="color:${famille(s.groupe).c}">
                <i class="s-mk ${k === 1 ? 'tirets' : ''}" style="--fc:${famille(s.groupe).c}"></i>
                <b>${esc(s.nom)}</b> <span>${esc(s.unite)}</span></td></tr>
              ${s.valeurs.map((v, i) => `<tr>
                <td class="s-d">${esc(jolieDate(DATES[i]))}</td>
                <td class="s-v"><b>${fmtVal(v)}</b></td></tr>`).join('')}
            `).join('')}
          </table>
        </div>
      </div>

      ${blocExplication(p.id)}

      <div class="avis">
        ${ic('i-info')}
        <span><b>Deux sortes de couleurs sur cette page, et il faut les distinguer.</b>
        Les teintes des courbes et des vignettes désignent des <b>familles d’analyses</b> —
        Numération, Métabolique, Rénal — jamais un état de santé. Les marques vert, orange
        ou rouge sont, elles, des <b>annotations posées par votre médecin</b> : elles portent
        toujours son nom et la date. Le logiciel n’en pose aucune de lui-même et ne compare
        aucune valeur à un seuil. Les intervalles de référence figurent sur le compte rendu
        de votre laboratoire, plus bas.</span>
      </div>
    </section>
  `;
  S.vignettes = `
    <!-- ===== vignettes ===== -->
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Tous vos paramètres</h2>
        <p class="b-s">Cliquez sur une vignette pour l’afficher en grand.</p>
      </div></div>
      ${groupes.map(g => `
        <div class="grp">
          <p class="grp-t" style="--fc:${famille(g.nom).c}">${esc(g.nom)}</p>
          <div class="minis">
            ${g.items.map(x => `
              <button class="minicard ${x.id === choisi ? 'on' : ''}" data-p="${esc(x.id)}"
                      style="--fc:${famille(x.groupe).c}">
                <span class="m-nom">${esc(x.nom)}
                  ${marqueDu(x.id) ? `<i class="mqm-tag m-${esc(marqueDu(x.id).couleur)}"
                     title="Marque ${esc(LIB_COULEUR[marqueDu(x.id).couleur])} posée par ${esc(marqueDu(x.id).medecin)}"
                     >${esc(LIB_COULEUR[marqueDu(x.id).couleur].charAt(0))}</i>` : ''}</span>
                ${mini(x)}
                <span class="m-val"><b>${fmtVal(x.valeurs[x.valeurs.length - 1])}</b> ${esc(x.unite)}</span>
                <span class="m-per">${esc(courteDate(DATES[0]))} → ${esc(courteDate(DATES[DATES.length - 1]))}</span>
                <span class="m-res">${esc(LEX.parametres[x.id].resume)}</span>
              </button>`).join('')}
          </div>
        </div>`).join('')}
    </section>
  `;
  S.parcours = `
    ${friseVisites}
    <!-- ===== parcours daté ===== -->
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Mon parcours</h2>
        <p class="b-s">Tout ce qui a été fait, dans l’ordre, avec le lieu.</p>
      </div></div>
      <ol class="frise">
        ${PARCOURS.map(e => `
          <li class="ev ev-${esc(e.type)}">
            <span class="ev-p"></span>
            <div class="ev-c">
              <span class="ev-d">${esc(jolieDate(e.date))}</span>
              <b class="ev-t">${esc(e.titre)}</b>
              <span class="ev-x">${esc(e.detail)}</span>
              <span class="ev-l">${ic('i-pin')} ${esc(e.lieu)}</span>
              ${blocActe(e.type)}
            </div>
          </li>`).join('')}
      </ol>
    </section>
  `;
  S.actes = `
    <!-- ===== les actes, expliqués un par un ===== -->
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Chaque acte, expliqué</h2>
        <p class="b-s">Ce qui se passe concrètement, combien de temps ça prend, ce que ça fait,
        ce qui est normal ensuite, et ce que l’acte n’est pas. Y compris les actes que vous
        n’avez pas eus : autant savoir avant, si l’un d’eux vous est proposé un jour.</p>
      </div></div>
      ${ORDRE_ACTES.map(k => `
        <div class="grp">
          <p class="grp-t" style="--fc:var(--pri)">${esc(LEX.actes[k].titre)}</p>
          <div class="lire-c" style="margin-top:0;max-width:none">
            ${rubrique('De quoi il s’agit', LEX.actes[k].quoi)}
            ${rubrique('Comment ça se passe', LEX.actes[k].deroulement)}
            ${LEX.actes[k].duree && LEX.actes[k].duree !== '—'
              ? rubrique('Combien de temps', LEX.actes[k].duree) : ''}
            ${rubrique('Après', LEX.actes[k].apres)}
            ${rubrique('Ce que ce n’est pas', LEX.actes[k].pasCeQue, true)}
          </div>
        </div>`).join('')}
    </section>
  `;
  S.couverture = `
    <!-- ===== couverture ===== -->
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Vaccinations et dépistages</h2>
        <p class="b-s">Deux informations côte à côte : la date de votre dernier acte, et ce que
        prévoit le calendrier ou le programme national. Le rapprochement vous appartient, et se
        discute avec le médecin.</p>
      </div></div>
      <table class="cv">
        <thead><tr><th>Acte</th><th>Mon dernier</th><th>Ce que prévoit le programme</th></tr></thead>
        <tbody>
          ${COUVERTURE.map(c => `<tr>
            <td><b>${esc(c.libelle)}</b>${blocDepistage(c.libelle)}</td>
            <td class="cv-d">${c.dernier ? esc(jolieDate(c.dernier)) : '<span class="cv-non">Aucun enregistré</span>'}</td>
            <td class="cv-r">${esc(c.reference)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="avis" style="margin-top:22px">
        ${ic('i-info')}
        <span><b>Un rapprochement de dates, pas un rappel.</b> Le tableau met côte à côte
        une date et ce que prévoit un programme national. Il ne conclut pas que quelque chose
        est en retard, parce que la réponse dépend de votre âge, de vos antécédents et de vos
        traitements — et parce qu’un dépistage n’est pas une obligation mais une décision qui
        vous appartient, prise en connaissance de ses limites. Celles-ci sont écrites, pour
        chaque ligne, sous « Comprendre ».</span>
      </div>
    </section>
  `;
  S.documents = `
    <!-- ===== documents ===== -->
    <section class="bloc" id="documents">
      <div class="b-h"><div>
        <h2>Mes comptes rendus</h2>
        <p class="b-s">Les documents d’origine, tels que transmis. Ce sont eux qui portent les
        intervalles de référence.</p>
      </div></div>
      <table class="docs"><tbody>
        ${DOCUMENTS.map(d => `<tr>
          <td>${ic('i-file')}</td>
          <td><b>${esc(d.titre)}</b><span class="d-m">${d.pages} page${d.pages > 1 ? 's' : ''}</span></td>
          <td class="d-date">${esc(jolieDate(d.date))}</td>
          <td class="d-act"><span class="d-dl">Ouvrir</span></td></tr>`).join('')}
      </tbody></table>
      <p class="b-s" style="margin-top:14px">L’ouverture et le téléchargement seront activés sur
      l’hébergement certifié HDS.</p>
    </section>
  `;
  S.glossaire = `
    <!-- ===== glossaire ===== -->
    <section class="bloc">
      <div class="b-h"><div>
        <h2>Les mots qu’on emploie</h2>
        <p class="b-s">Les termes qui reviennent sur un compte rendu, dans une ordonnance ou
        dans une consultation, et que personne ne prend le temps d’expliquer.</p>
      </div></div>
      <div class="glo">
        ${LEX.glossaire.map(g => `
          <div class="glo-i">
            <span class="glo-t">${esc(g.terme)}</span>
            <p class="glo-d">${esc(g.def)}</p>
          </div>`).join('')}
      </div>
    </section>
  `;
  S.limites = `
    <!-- ===== limites ===== -->
    <section class="limites">
      <h2>Ce que ce tableau de bord ne fait pas</h2>
      <ul>
        <li>${ic('i-x')}<span>Il ne dit pas de lui-même si une valeur est normale ou anormale. Quand une couleur apparaît, c’est votre médecin qui l’a posée, et son nom l’accompagne.</span></li>
        <li>${ic('i-x')}<span>Il ne colore, ne surligne et ne signale aucun résultat selon sa valeur. Les teintes des courbes désignent des familles d’analyses.</span></li>
        <li>${ic('i-x')}<span>Il ne calcule aucun score de santé, aucun âge biologique, aucun indice de synthèse.</span></li>
        <li>${ic('i-x')}<span>Il ne propose aucun examen et ne recommande aucune conduite.</span></li>
        <li>${ic('i-x')}<span>Il n’adapte aucune explication à vos résultats. Les textes « Comprendre » décrivent la mesure ou l’acte, et sont rigoureusement les mêmes pour tout le monde. Une explication qui changerait selon vos chiffres serait une interprétation déguisée.</span></li>
        <li>${ic('i-x')}<span>Il ne transmet rien à votre employeur, ni à un assureur, ni à un tiers commercial.</span></li>
      </ul>
      <p>Ce n’est pas une limite technique mais un choix de conception. Un logiciel qui compare
      vos valeurs à des seuils et en tire une conclusion devient un dispositif médical, soumis à
      une certification que nous n’avons pas encore. En attendant, il vous montre vos données
      complètes et sans filtre, et c’est le médecin qui les interprète avec vous.</p>
    </section>
  `;

  /* Une seule disposition publiée, donc plus de branche à l'affichage.
     Les deux autres coquilles restent définies plus haut (voir la note
     sur la constante « disposition ») mais ne sont plus appelées. */
  $('#app').innerHTML = shellDomaines(S, groupes, p);

  document.querySelectorAll('[data-p]').forEach(b => {
    b.onclick = () => {
      const prec = PARAMETRES.find(x => x.id === choisi);
      choisi = b.dataset.p;
      const nouv = PARAMETRES.find(x => x.id === choisi);
      /* on ne conserve la comparaison que si l'unité reste la même */
      if (compare && (!prec || nouv.unite !== prec.unite)) compare = null;
      if (compare === choisi) compare = null;
      rendre();
      const w = $('#gwrap'); if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
  });
  document.querySelectorAll('[data-c]').forEach(b => {
    b.onclick = () => { compare = b.dataset.c || null; rendre(); };
  });

  /* Rail : une entrée « mesure:id » sélectionne un paramètre, les autres
     changent de vue. Les deux passent par le même chemin de rendu. */
  document.querySelectorAll('[data-vue]').forEach(b => {
    b.onclick = () => {
      const v = b.dataset.vue;
      if (v.indexOf('mesure:') === 0) {
        const id = v.slice(7);
        const prec = PARAMETRES.find(x => x.id === choisi);
        const nouv = PARAMETRES.find(x => x.id === id);
        if (compare && (!prec || nouv.unite !== prec.unite)) compare = null;
        if (compare === id) compare = null;
        choisi = id;
        vue = 'mesure';
      } else {
        vue = v;
      }
      railOuvert = false;
      rendre();
      const h = document.querySelector('.panneau');
      if (h && window.innerWidth <= 960) h.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
  });

  /* Ouvrir un domaine : depuis une carte ou depuis la barre latérale,
     c'est le même chemin. Le paramètre affiché en grand est le premier
     du domaine, sauf si l'un d'eux est déjà choisi. */
  const ouvrirDomaine = id => {
    const d = DOMAINES.trouver(id);
    if (d && d.parametres.length && d.parametres.indexOf(choisi) === -1) {
      choisi = d.parametres[0];
      compare = null;
    }
  };

  document.querySelectorAll('[data-dom]').forEach(b => {
    b.onclick = () => {
      ouvrirDomaine(b.dataset.dom);
      lateral = 'dom:' + b.dataset.dom;
      railOuvert = false;
      rendre();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  document.querySelectorAll('[data-lat]').forEach(b => {
    b.onclick = () => {
      lateral = b.dataset.lat;
      if (lateral.indexOf('dom:') === 0) ouvrirDomaine(lateral.slice(4));
      railOuvert = false;
      rendre();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  const rb = document.getElementById('rail-b');
  if (rb) rb.onclick = () => { railOuvert = !railOuvert; rendre(); };

  /* Dans le rail, la section des comptes rendus n'est pas dans la page :
     l'ancre serait un lien mort. On change de vue à la place. */
  const ld = document.querySelector('[data-lien-doc]');
  if (ld && disposition === 'rail') {
    ld.onclick = e => { e.preventDefault(); vue = 'documents'; rendre(); };
  }

  brancherInfobulle(series);
}

function brancherInfobulle(series) {
  const svg = document.querySelector('.gc'), tip = $('#tip');
  if (!svg || !tip) return;
  svg.querySelectorAll('.gpt').forEach(g => {
    const i = parseInt(g.dataset.i, 10), k = parseInt(g.dataset.s, 10);
    const s = series[k];
    const montrer = () => {
      tip.innerHTML = '<i style="background:' + famille(s.groupe).c + '"></i>' +
        '<b>' + fmtVal(s.valeurs[i]) + ' ' + esc(s.unite) + '</b>' +
        '<span>' + esc(s.nom) + ' · ' + esc(jolieDate(DATES[i])) + '</span>';
      tip.classList.add('on');
      const r = svg.getBoundingClientRect();
      const d = g.querySelector('.gdot');
      const vb = svg.viewBox.baseVal;
      tip.style.left = (r.left + (d.getAttribute('cx') / vb.width) * r.width) + 'px';
      tip.style.top = (r.top + (d.getAttribute('cy') / vb.height) * r.height + window.scrollY - 16) + 'px';
    };
    g.addEventListener('mouseenter', montrer);
    g.addEventListener('focus', montrer);
    g.addEventListener('mouseleave', () => tip.classList.remove('on'));
    g.addEventListener('blur', () => tip.classList.remove('on'));
  });
}

/* =====================================================================
   PLUS AUCUNE BARRE D'ESSAI

   Il y en avait deux : l'apparence et la disposition. Les deux choix
   sont faits, les deux barres sont parties, et le retrait n'a demandé
   dans les deux cas que de supprimer un bout de balisage et une
   fonction. C'était tout l'intérêt de ne jamais laisser une apparence ni
   une disposition conditionner un CONTENU : on retire le choix sans
   toucher à ce qui s'affiche.

   Rien n'a jamais été mémorisé dans le navigateur. Une préférence
   d'affichage y aurait été la première donnée persistée par cette page
   en dehors du dossier, et il n'y avait aucune raison d'ouvrir cette
   porte pour une maquette. La question ne se pose plus.
   ===================================================================== */

window.addEventListener('DOMContentLoaded', () => {
  DOSSIER = dossierCourant();
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-dispo', disposition);
  rendre();
});
