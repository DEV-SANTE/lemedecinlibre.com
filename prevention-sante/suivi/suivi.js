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
   Rénal, Hormonal, Hépatique, Mesuré sur place. La palette est une
   rampe continue du pétrole au violet. Elle ne contient ni rouge ni
   vert, précisément pour qu'aucune teinte ne puisse se lire comme
   « bon » ou « mauvais ». La couleur dit de quoi on parle, pas ce
   qu'il faut en penser. Un test automatique vérifie qu'aucune teinte
   de la palette n'a de dominante rouge ou verte.

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

const DATES = ['2022-04-12', '2023-05-03', '2024-05-21', '2025-06-14', '2026-07-20'];

/* Rampe pétrole → violet. Aucune teinte à dominante rouge ou verte. */
const FAMILLES = [
  { nom: 'Numération',        c: '#0f5f6b', c2: '#0f5f6b22' },
  { nom: 'Métabolique',       c: '#1a6f8c', c2: '#1a6f8c22' },
  { nom: 'Rénal',             c: '#2a5f9c', c2: '#2a5f9c22' },
  { nom: 'Hormonal',          c: '#41529b', c2: '#41529b22' },
  { nom: 'Hépatique',         c: '#57488f', c2: '#57488f22' },
  { nom: 'Mesuré sur place',  c: '#6b4382', c2: '#6b438222' }
];
const famille = nom => FAMILLES.find(f => f.nom === nom) || FAMILLES[0];

const PARAMETRES = [
  { id: 'hb',    nom: 'Hémoglobine',        unite: 'g/dL',   groupe: 'Numération',       valeurs: [14.1, 13.8, 13.6, 13.4, 13.6] },
  { id: 'ferr',  nom: 'Ferritine',          unite: 'µg/L',   groupe: 'Numération',       valeurs: [58, 47, 42, 31, 24] },
  { id: 'gly',   nom: 'Glycémie à jeun',    unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.88, 0.91, 0.94, 0.98, 1.02] },
  { id: 'chol',  nom: 'Cholestérol total',  unite: 'g/L',    groupe: 'Métabolique',      valeurs: [1.94, 2.02, 2.11, 2.18, 2.14] },
  { id: 'hdl',   nom: 'HDL',                unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.58, 0.56, 0.54, 0.52, 0.55] },
  { id: 'tg',    nom: 'Triglycérides',      unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.92, 1.05, 1.18, 1.34, 1.21] },
  { id: 'creat', nom: 'Créatinine',         unite: 'µmol/L', groupe: 'Rénal',            valeurs: [71, 73, 74, 76, 75] },
  { id: 'tsh',   nom: 'TSH',                unite: 'mUI/L',  groupe: 'Hormonal',         valeurs: [1.8, 2.1, 2.4, 2.2, 2.6] },
  { id: 'vitd',  nom: 'Vitamine D',         unite: 'nmol/L', groupe: 'Hormonal',         valeurs: [42, 38, 51, 44, 47] },
  { id: 'alat',  nom: 'ALAT',               unite: 'UI/L',   groupe: 'Hépatique',        valeurs: [22, 24, 27, 31, 28] },
  { id: 'pas',   nom: 'Pression systolique', unite: 'mmHg',  groupe: 'Mesuré sur place', valeurs: [118, 121, 124, 128, 126] },
  { id: 'poids', nom: 'Poids',              unite: 'kg',     groupe: 'Mesuré sur place', valeurs: [71.5, 73.2, 75.8, 77.1, 76.4] }
];

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
          '" class="gdot" stroke="' + co + '" fill="' + (plein ? co : '#fff') + '"/>' +
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

      <div class="avis">
        ${ic('i-info')}
        <span><b>Aucune valeur n’est commentée ici.</b> Les intervalles de référence figurent
        sur le compte rendu de votre laboratoire, que vous pouvez ouvrir plus bas. Leur lecture
        appartient au médecin qui vous reçoit : une valeur ne se lit pas seule, mais avec votre
        âge, vos antécédents et le reste de votre bilan. Les couleurs de cette page désignent
        des familles d’analyses, jamais un état de santé.</span>
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
                <span class="m-nom">${esc(x.nom)}</span>
                ${mini(x)}
                <span class="m-val"><b>${fmtVal(x.valeurs[x.valeurs.length - 1])}</b> ${esc(x.unite)}</span>
                <span class="m-per">${esc(courteDate(DATES[0]))} → ${esc(courteDate(DATES[DATES.length - 1]))}</span>
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
            </div>
          </li>`).join('')}
      </ol>
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
            <td><b>${esc(c.libelle)}</b></td>
            <td class="cv-d">${c.dernier ? esc(jolieDate(c.dernier)) : '<span class="cv-non">Aucun enregistré</span>'}</td>
            <td class="cv-r">${esc(c.reference)}</td></tr>`).join('')}
        </tbody>
      </table>
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

    <!-- ===== limites ===== -->
    <section class="limites">
      <h2>Ce que ce tableau de bord ne fait pas</h2>
      <ul>
        <li>${ic('i-x')}<span>Il ne dit pas si une valeur est normale ou anormale.</span></li>
        <li>${ic('i-x')}<span>Il ne colore, ne surligne et ne signale aucun résultat selon sa valeur. Les couleurs désignent des familles d’analyses.</span></li>
        <li>${ic('i-x')}<span>Il ne calcule aucun score de santé, aucun âge biologique, aucun indice de synthèse.</span></li>
        <li>${ic('i-x')}<span>Il ne propose aucun examen et ne recommande aucune conduite.</span></li>
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

window.addEventListener('DOMContentLoaded', rendre);
