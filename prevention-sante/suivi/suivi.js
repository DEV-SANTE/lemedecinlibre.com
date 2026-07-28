/* =====================================================================
   TABLEAU DE BORD DE SUIVI — ESPACE PATIENT
   Version 0.1 — données fictives.

   CE QUE CETTE PAGE FAIT, ET POURQUOI ELLE S'ARRÊTE LÀ

   Le dossier de reprise autorise explicitement de « stocker, archiver,
   historiser, représenter graphiquement l'évolution de résultats
   biologiques dans le temps ». C'est exactement ce que fait cette page,
   et rien de plus.

   Elle n'affiche donc AUCUNE zone de normalité, AUCUNE coloration selon
   la valeur, AUCUNE flèche d'amélioration ou de dégradation, AUCUN
   score de synthèse. Dessiner une bande verte et placer le point du
   patient en rouge à l'extérieur, ce serait comparer une valeur à un
   seuil et signaler le franchissement : interdit en version 1, et c'est
   précisément ce qui ferait relever la plateforme de la classe IIa.

   Les valeurs de référence figurent sur le compte rendu du laboratoire.
   La page y renvoie d'un clic. C'est la source légitime, et le médecin
   reste celui qui interprète.

   DEUX CHOIX GRAPHIQUES ASSUMÉS

   1. Les points sont reliés par des SEGMENTS DROITS, pas par une courbe
      lissée. Une courbe suggérerait des valeurs entre deux prélèvements,
      valeurs qui n'existent pas. Le lissage serait plus joli et moins
      honnête.

   2. L'axe vertical ne part pas de zéro : il est cadré sur l'amplitude
      observée, ce qui rend les variations lisibles. L'amplitude affichée
      est donc indiquée en clair sur l'axe, pour ne pas exagérer
      visuellement une variation faible.
   ===================================================================== */

'use strict';

/* =====================================================================
   DONNÉES FICTIVES — quatre années, cinq relevés
   ===================================================================== */
const DATES = ['2022-04-12', '2023-05-03', '2024-05-21', '2025-06-14', '2026-07-20'];

const PARAMETRES = [
  { id: 'hb',    nom: 'Hémoglobine',        unite: 'g/dL',   valeurs: [14.1, 13.8, 13.6, 13.4, 13.6], groupe: 'Numération' },
  { id: 'ferr',  nom: 'Ferritine',          unite: 'µg/L',   valeurs: [58, 47, 42, 31, 24],            groupe: 'Numération' },
  { id: 'gly',   nom: 'Glycémie à jeun',    unite: 'g/L',    valeurs: [0.88, 0.91, 0.94, 0.98, 1.02],  groupe: 'Métabolique' },
  { id: 'chol',  nom: 'Cholestérol total',  unite: 'g/L',    valeurs: [1.94, 2.02, 2.11, 2.18, 2.14],  groupe: 'Métabolique' },
  { id: 'hdl',   nom: 'HDL',               unite: 'g/L',    valeurs: [0.58, 0.56, 0.54, 0.52, 0.55],  groupe: 'Métabolique' },
  { id: 'tg',    nom: 'Triglycérides',      unite: 'g/L',    valeurs: [0.92, 1.05, 1.18, 1.34, 1.21],  groupe: 'Métabolique' },
  { id: 'creat', nom: 'Créatinine',         unite: 'µmol/L', valeurs: [71, 73, 74, 76, 75],            groupe: 'Rénal' },
  { id: 'tsh',   nom: 'TSH',               unite: 'mUI/L',  valeurs: [1.8, 2.1, 2.4, 2.2, 2.6],       groupe: 'Hormonal' },
  { id: 'vitd',  nom: 'Vitamine D',         unite: 'nmol/L', valeurs: [42, 38, 51, 44, 47],            groupe: 'Hormonal' },
  { id: 'alat',  nom: 'ALAT',              unite: 'UI/L',   valeurs: [22, 24, 27, 31, 28],            groupe: 'Hépatique' },
  { id: 'pas',   nom: 'Pression systolique', unite: 'mmHg', valeurs: [118, 121, 124, 128, 126],       groupe: 'Mesuré sur place' },
  { id: 'poids', nom: 'Poids',             unite: 'kg',     valeurs: [71.5, 73.2, 75.8, 77.1, 76.4],  groupe: 'Mesuré sur place' }
];

const PARCOURS = [
  { date: '2026-07-20', type: 'visite',   titre: 'Visite de prévention',
    detail: 'Consultation, prélèvement, mise à jour vaccinale.', lieu: 'Centre de santé B (fictif)' },
  { date: '2026-07-20', type: 'document', titre: 'Résultats d’analyses',
    detail: 'Compte rendu du laboratoire, 1 page.', lieu: 'Laboratoire 1 (fictif)' },
  { date: '2026-07-20', type: 'vaccin',   titre: 'Rappel diphtérie-tétanos-poliomyélite',
    detail: 'Réalisé sur place.', lieu: 'Centre de santé B (fictif)' },
  { date: '2025-06-14', type: 'visite',   titre: 'Visite de prévention',
    detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2025-06-14', type: 'document', titre: 'Résultats d’analyses',
    detail: 'Compte rendu du laboratoire, 1 page.', lieu: 'Laboratoire 1 (fictif)' },
  { date: '2024-05-21', type: 'examen',   titre: 'Exploration de la fonction respiratoire',
    detail: 'Réalisée après appréciation du médecin.', lieu: 'Centre de santé A (fictif)' },
  { date: '2024-05-21', type: 'visite',   titre: 'Visite de prévention',
    detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2023-05-03', type: 'visite',   titre: 'Visite de prévention',
    detail: 'Consultation, prélèvement.', lieu: 'Centre de santé A (fictif)' },
  { date: '2022-04-12', type: 'visite',   titre: 'Première visite',
    detail: 'Consultation initiale, questionnaire complet, prélèvement.', lieu: 'Centre de santé A (fictif)' }
];

/* Faits déclaratifs et dates. Aucune conclusion n'est tirée : la
   périodicité publiée est affichée à côté de la date, comme deux
   informations distinctes que la personne rapproche elle-même. */
const COUVERTURE = [
  { libelle: 'Diphtérie, tétanos, poliomyélite', dernier: '2026-07-20',
    reference: 'Rappels espacés à l’âge adulte, selon le calendrier vaccinal en vigueur.' },
  { libelle: 'Grippe saisonnière', dernier: '2025-11-08',
    reference: 'Campagne annuelle, à l’automne.' },
  { libelle: 'Covid-19', dernier: '2024-10-15',
    reference: 'Selon les recommandations en vigueur et la situation de chacun.' },
  { libelle: 'Dépistage du cancer colorectal', dernier: '2023-03-02',
    reference: 'Le programme national propose un test tous les deux ans, de 50 à 74 ans.' },
  { libelle: 'Frottis ou test HPV', dernier: '2022-09-19',
    reference: 'Périodicité définie par le programme national, variable selon l’âge.' },
  { libelle: 'Mammographie', dernier: null,
    reference: 'Le programme national propose un examen tous les deux ans, de 50 à 74 ans.' }
];

const DOCUMENTS = [
  { id: 'DOC-1', date: '2026-07-20', titre: 'Résultats d’analyses — juillet 2026', pages: 1 },
  { id: 'DOC-2', date: '2026-07-20', titre: 'Compte rendu de consultation', pages: 2 },
  { id: 'DOC-3', date: '2025-06-14', titre: 'Résultats d’analyses — juin 2025', pages: 1 },
  { id: 'DOC-4', date: '2024-05-21', titre: 'Exploration respiratoire — compte rendu', pages: 2 }
];

/* =====================================================================
   UTILITAIRES
   ===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function jolieDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.getDate() + ' ' + MOIS_COURT[d.getMonth()] + ' ' + d.getFullYear();
}
function courteDate(iso) {
  const d = new Date(iso);
  return MOIS_COURT[d.getMonth()].replace('.', '') + ' ' + String(d.getFullYear()).slice(2);
}
function ic(n, cls) { return '<svg class="ico ' + (cls || '') + '"><use href="#' + n + '"/></svg>'; }

/* Formatage : on garde la précision de la donnée source, sans arrondi
   qui masquerait une variation. */
function fmtVal(v) {
  return (Math.round(v * 100) / 100).toString().replace('.', ',');
}

/* =====================================================================
   MOTEUR DE GRAPHIQUE — grand format
   Segments droits, aucune zone de référence, aucune couleur de valeur.
   ===================================================================== */
function grandGraphique(p) {
  const L = 900, H = 320;
  const mg = { g: 62, d: 24, h: 26, b: 46 };
  const vals = p.valeurs;

  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (mn === mx) { mn -= 1; mx += 1; }
  const marge = (mx - mn) * 0.22;
  mn -= marge; mx += marge;

  const x = i => mg.g + (i * (L - mg.g - mg.d)) / Math.max(1, vals.length - 1);
  const y = v => mg.h + (1 - (v - mn) / (mx - mn)) * (H - mg.h - mg.b);

  const pts = vals.map((v, i) => ({ x: x(i), y: y(v), v: v, d: DATES[i] }));

  /* Quatre repères horizontaux, valeurs réelles affichées à gauche. */
  const nGrid = 4;
  const grid = [];
  for (let k = 0; k <= nGrid; k++) {
    const v = mn + (k / nGrid) * (mx - mn);
    grid.push({ y: y(v), v: v });
  }

  const ligne = pts.map(p2 => p2.x.toFixed(1) + ',' + p2.y.toFixed(1)).join(' ');
  const aire = 'M' + pts[0].x.toFixed(1) + ',' + (H - mg.b) +
    ' L' + pts.map(p2 => p2.x.toFixed(1) + ',' + p2.y.toFixed(1)).join(' L') +
    ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (H - mg.b) + ' Z';

  return `
    <svg viewBox="0 0 ${L} ${H}" class="gc" role="img"
         aria-label="Évolution de ${esc(p.nom)} en ${esc(p.unite)}, de ${jolieDate(DATES[0])} à ${jolieDate(DATES[DATES.length - 1])}">
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0f5f6b" stop-opacity=".16"/>
          <stop offset="1" stop-color="#0f5f6b" stop-opacity="0"/>
        </linearGradient>
      </defs>

      ${grid.map(g => `
        <line x1="${mg.g}" y1="${g.y.toFixed(1)}" x2="${L - mg.d}" y2="${g.y.toFixed(1)}" class="gl"/>
        <text x="${mg.g - 12}" y="${(g.y + 4).toFixed(1)}" class="gy">${fmtVal(g.v)}</text>`).join('')}

      <path d="${aire}" fill="url(#ga)"/>
      <polyline points="${ligne}" class="gp"/>

      ${pts.map((p2, i) => `
        <g class="gpt" data-i="${i}">
          <line x1="${p2.x.toFixed(1)}" y1="${mg.h}" x2="${p2.x.toFixed(1)}" y2="${H - mg.b}" class="gv"/>
          <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="6.5" class="gdot"/>
          <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="20" class="ghit"/>
          <text x="${p2.x.toFixed(1)}" y="${H - mg.b + 22}" class="gx">${esc(courteDate(p2.d))}</text>
          <text x="${p2.x.toFixed(1)}" y="${(p2.y - 16).toFixed(1)}" class="gvl">${fmtVal(p2.v)}</text>
        </g>`).join('')}

      <text x="${mg.g - 12}" y="${mg.h - 10}" class="gu">${esc(p.unite)}</text>
    </svg>
    <p class="gnote">Axe vertical cadré de ${fmtVal(mn)} à ${fmtVal(mx)} ${esc(p.unite)} pour
    rendre les variations lisibles — il ne part pas de zéro. Les points sont reliés par des
    segments droits : aucune valeur n’est supposée entre deux prélèvements.</p>`;
}

/* Courbe miniature pour la grille de tous les paramètres. */
function mini(p) {
  const L = 200, H = 52, pad = 6;
  const vals = p.valeurs;
  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pts = vals.map((v, i) => {
    const x = pad + (i * (L - 2 * pad)) / Math.max(1, vals.length - 1);
    const y = H - pad - ((v - mn) / (mx - mn)) * (H - 2 * pad);
    return x.toFixed(1) + ',' + y.toFixed(1);
  });
  const dernier = pts[pts.length - 1].split(',');
  return `<svg viewBox="0 0 ${L} ${H}" class="mc" aria-hidden="true">
    <polyline points="${pts.join(' ')}" class="mp"/>
    <circle cx="${dernier[0]}" cy="${dernier[1]}" r="4" class="mdot"/>
  </svg>`;
}

/* =====================================================================
   RENDU
   ===================================================================== */
let choisi = 'ferr';

function rendre() {
  const p = PARAMETRES.find(x => x.id === choisi) || PARAMETRES[0];
  const groupes = [];
  PARAMETRES.forEach(x => {
    let g = groupes.find(y => y.nom === x.groupe);
    if (!g) { g = { nom: x.groupe, items: [] }; groupes.push(g); }
    g.items.push(x);
  });

  $('#app').innerHTML = `
    <!-- ===== bandeau cockpit ===== -->
    <div class="cockpit">
      <div class="c-hello">
        <p class="c-eyebrow">Mon suivi</p>
        <h1>Bonjour Camille.</h1>
        <p class="c-sub">Cinq visites depuis avril 2022. Tout ce qui suit vous appartient et
        n’est visible que de vous et du médecin qui vous suit.</p>
      </div>
      <div class="c-tiles">
        <div class="tile">
          <div class="t-ic">${ic('i-calendar')}</div>
          <span class="t-k">Prochain rendez-vous</span>
          <b class="t-v">Mardi 7h30</b>
          <span class="t-d">Centre de santé B (fictif)</span>
        </div>
        <div class="tile">
          <div class="t-ic">${ic('i-clipboard')}</div>
          <span class="t-k">Questionnaire</span>
          <b class="t-v">Transmis</b>
          <span class="t-d">le 20 juillet 2026</span>
        </div>
        <div class="tile">
          <div class="t-ic">${ic('i-file')}</div>
          <span class="t-k">Mes documents</span>
          <b class="t-v">${DOCUMENTS.length}</b>
          <span class="t-d">sur quatre années</span>
        </div>
        <div class="tile">
          <div class="t-ic">${ic('i-history')}</div>
          <span class="t-k">Paramètres suivis</span>
          <b class="t-v">${PARAMETRES.length}</b>
          <span class="t-d">depuis avril 2022</span>
        </div>
      </div>
    </div>

    <!-- ===== graphique principal ===== -->
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
        ${PARAMETRES.map(x => `<button class="chip ${x.id === choisi ? 'on' : ''}"
          data-p="${esc(x.id)}">${esc(x.nom)}</button>`).join('')}
      </div>

      <div class="g-head">
        <div>
          <b class="g-nom">${esc(p.nom)}</b>
          <span class="g-unit">${esc(p.unite)}</span>
        </div>
        <div class="g-last">
          <span>Dernier relevé · ${esc(jolieDate(DATES[DATES.length - 1]))}</span>
          <b>${fmtVal(p.valeurs[p.valeurs.length - 1])} ${esc(p.unite)}</b>
        </div>
      </div>

      <div class="g-wrap" id="gwrap">${grandGraphique(p)}</div>

      <div class="avis">
        ${ic('i-info')}
        <span><b>Aucune valeur n’est commentée ici.</b> Les intervalles de référence figurent
        sur le compte rendu de votre laboratoire, que vous pouvez ouvrir plus bas. Leur lecture
        et leur interprétation appartiennent au médecin qui vous reçoit : une valeur ne se lit
        pas seule, mais avec votre âge, vos antécédents et le reste de votre bilan.</span>
      </div>
    </section>

    <!-- ===== grille de tous les paramètres ===== -->
    <section class="bloc">
      <div class="b-h">
        <div>
          <h2>Tous vos paramètres</h2>
          <p class="b-s">Cliquez sur une vignette pour l’afficher en grand.</p>
        </div>
      </div>
      ${groupes.map(g => `
        <div class="grp">
          <p class="grp-t">${esc(g.nom)}</p>
          <div class="minis">
            ${g.items.map(x => `
              <button class="minicard ${x.id === choisi ? 'on' : ''}" data-p="${esc(x.id)}">
                <span class="m-nom">${esc(x.nom)}</span>
                ${mini(x)}
                <span class="m-val"><b>${fmtVal(x.valeurs[x.valeurs.length - 1])}</b> ${esc(x.unite)}</span>
                <span class="m-per">${esc(courteDate(DATES[0]))} → ${esc(courteDate(DATES[DATES.length - 1]))}</span>
              </button>`).join('')}
          </div>
        </div>`).join('')}
    </section>

    <!-- ===== frise du parcours ===== -->
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
        <p class="b-s">Deux informations côte à côte : la date de votre dernier acte, et ce
        que prévoit le calendrier ou le programme national. Le rapprochement vous appartient,
        et se discute avec le médecin.</p>
      </div></div>
      <table class="cv">
        <thead><tr><th>Acte</th><th>Mon dernier</th><th>Ce que prévoit le programme</th></tr></thead>
        <tbody>
          ${COUVERTURE.map(c => `
            <tr>
              <td><b>${esc(c.libelle)}</b></td>
              <td class="cv-d">${c.dernier ? esc(jolieDate(c.dernier)) : '<span class="cv-non">Aucun enregistré</span>'}</td>
              <td class="cv-r">${esc(c.reference)}</td>
            </tr>`).join('')}
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
      <table class="docs">
        <tbody>
          ${DOCUMENTS.map(d => `
            <tr>
              <td>${ic('i-file')}</td>
              <td><b>${esc(d.titre)}</b><span class="d-m">${d.pages} page${d.pages > 1 ? 's' : ''}</span></td>
              <td class="d-date">${esc(jolieDate(d.date))}</td>
              <td class="d-act"><span class="d-dl">Ouvrir</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p class="b-s" style="margin-top:14px">L’ouverture et le téléchargement seront activés
      sur l’hébergement certifié HDS.</p>
    </section>

    <!-- ===== limites ===== -->
    <section class="limites">
      <h2>Ce que ce tableau de bord ne fait pas</h2>
      <ul>
        <li>${ic('i-x')}<span>Il ne dit pas si une valeur est normale ou anormale.</span></li>
        <li>${ic('i-x')}<span>Il ne colore, ne surligne et ne signale aucun résultat.</span></li>
        <li>${ic('i-x')}<span>Il ne calcule aucun score de santé, aucun âge biologique, aucun indice de synthèse.</span></li>
        <li>${ic('i-x')}<span>Il ne propose aucun examen et ne recommande aucune conduite.</span></li>
        <li>${ic('i-x')}<span>Il ne transmet rien à votre employeur, ni à un assureur, ni à un tiers commercial.</span></li>
      </ul>
      <p>Ce n’est pas une limite technique mais un choix de conception. Un logiciel qui
      compare vos valeurs à des seuils et en tire une conclusion devient un dispositif médical,
      soumis à une certification que nous n’avons pas encore. En attendant, il vous montre vos
      données complètes et sans filtre, et c’est le médecin qui les interprète avec vous.</p>
    </section>`;

  /* Sélection d'un paramètre — deux points d'entrée, même effet. */
  document.querySelectorAll('[data-p]').forEach(b => {
    b.onclick = () => {
      choisi = b.dataset.p;
      rendre();
      const w = $('#gwrap');
      if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
  });

  brancherInfobulle(p);
}

/* Infobulle au survol des points du grand graphique. */
function brancherInfobulle(p) {
  const svg = document.querySelector('.gc');
  const tip = $('#tip');
  if (!svg || !tip) return;

  svg.querySelectorAll('.gpt').forEach(g => {
    const i = parseInt(g.dataset.i, 10);
    const montrer = ev => {
      tip.innerHTML = '<b>' + fmtVal(p.valeurs[i]) + ' ' + esc(p.unite) + '</b>' +
        '<span>' + esc(jolieDate(DATES[i])) + '</span>';
      tip.classList.add('on');
      const r = svg.getBoundingClientRect();
      const cx = g.querySelector('.gdot').getAttribute('cx');
      const cy = g.querySelector('.gdot').getAttribute('cy');
      const vb = svg.viewBox.baseVal;
      tip.style.left = (r.left + (cx / vb.width) * r.width) + 'px';
      tip.style.top = (r.top + (cy / vb.height) * r.height + window.scrollY - 14) + 'px';
    };
    g.addEventListener('mouseenter', montrer);
    g.addEventListener('focus', montrer);
    g.addEventListener('mouseleave', () => tip.classList.remove('on'));
  });
}

window.addEventListener('DOMContentLoaded', rendre);
