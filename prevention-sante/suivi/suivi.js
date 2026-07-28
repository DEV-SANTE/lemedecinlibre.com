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
let theme = THEMES.defaut;
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

  $('#app').innerHTML = `
    <!-- ===== cockpit ===== -->
    <div class="cockpit">
      <div class="c-hello">
        <p class="c-eyebrow">Mon suivi</p>
        <h1>Bonjour Camille.</h1>
        <p class="c-sub">Cinq visites depuis avril 2022, douze paramètres suivis. Tout ce qui
        suit vous appartient et n’est visible que de vous et du médecin qui vous suit.</p>
      </div>

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

      <div class="c-tiles">
        <div class="tile"><div class="t-ic">${ic('i-calendar')}</div>
          <span class="t-k">Prochain rendez-vous</span><b class="t-v">Mardi 7h30</b>
          <span class="t-d">Centre de santé B (fictif)</span></div>
        <div class="tile"><div class="t-ic">${ic('i-clipboard')}</div>
          <span class="t-k">Questionnaire</span><b class="t-v">Transmis</b>
          <span class="t-d">le 20 juillet 2026</span></div>
        <div class="tile"><div class="t-ic">${ic('i-file')}</div>
          <span class="t-k">Mes documents</span><b class="t-v">${DOCUMENTS.length}</b>
          <span class="t-d">sur quatre années</span></div>
        <div class="tile"><div class="t-ic">${ic('i-history')}</div>
          <span class="t-k">Antériorité</span><b class="t-v">4 ans</b>
          <span class="t-d">depuis avril 2022</span></div>
      </div>
    </div>

    <!-- ===== comment lire cette page ===== -->
    <section class="lire-page">
      <h2>${esc(LEX.intro.titre)}</h2>
      ${LEX.intro.paragraphes.map(t => `<p>${esc(t)}</p>`).join('')}
    </section>

    <!-- ===== graphique ===== -->
    <section class="bloc">
      <div class="b-h">
        <div>
          <h2>Évolution dans le temps</h2>
          <p class="b-s">Choisissez un paramètre. Les valeurs sont affichées telles que
          transmises par le laboratoire.</p>
        </div>
        <a class="b-lien" href="#documents">Ouvrir mes comptes rendus ${ic('i-arrow')}</a>
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

    <!-- ===== frise ===== -->
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
    </section>`;

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
   BARRE DE THÈMES

   Provisoire : elle sert à arbitrer une direction graphique en la
   voyant. À retirer une fois le choix fait — et le retrait consiste à
   supprimer cette fonction et la section correspondante du balisage,
   rien d'autre : aucun thème ne conditionne le contenu.

   Le choix n'est pas mémorisé. Une préférence d'apparence stockée dans
   le navigateur serait la première donnée persistée par cette page en
   dehors du dossier, et il n'y a aucune raison d'ouvrir cette porte
   pour une maquette.
   ===================================================================== */
function barreThemes() {
  const zone = $('#th-b'), desc = $('#th-d');
  if (!zone || !desc) return;

  zone.innerHTML = THEMES.liste.map(t =>
    '<button class="th-x' + (t.id === theme ? ' on' : '') + '" data-t="' + esc(t.id) + '">' +
    esc(t.nom) + '<em>' + esc(t.resume) + '</em></button>').join('');

  desc.textContent = THEMES.trouver(theme).desc;

  zone.querySelectorAll('[data-t]').forEach(b => {
    b.onclick = () => {
      theme = b.dataset.t;
      document.documentElement.setAttribute('data-theme', theme);
      barreThemes();
      rendre();   /* les teintes sont injectées dans le balisage */
    };
  });
}

window.addEventListener('DOMContentLoaded', () => {
  DOSSIER = dossierCourant();
  document.documentElement.setAttribute('data-theme', theme);
  barreThemes();
  rendre();
});
