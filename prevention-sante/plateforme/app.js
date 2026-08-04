/* =====================================================================
   PLATEFORME DE PRÉVENTION — APPLICATION
   Version 0.1 — environnement de test, patients fictifs uniquement

   RÈGLE ABSOLUE DU CODE
   Ce fichier ne contient aucune opération arithmétique ou logique
   appliquée aux réponses de santé d'un patient. Pas de somme, pas de
   moyenne, pas de comparaison à un seuil, pas de coloration selon la
   réponse, pas de tri par gravité, pas de proposition d'acte.

   La SEULE valeur dérivée est l'âge, calculé depuis l'année de
   naissance, et utilisée exclusivement pour l'affichage structurel des
   questions de dépistage (âge et sexe). Ce n'est pas une donnée de
   santé et cela ne produit aucune information clinique.

   Un test de non-régression vérifie cette règle : voir verifier.js
   ===================================================================== */

'use strict';

const MODE = 'TEST';
const STORAGE_KEY = 'pv-sante-test-v1';

/* =====================================================================
   COUCHE DE DONNÉES
   ---------------------------------------------------------------------
   MIGRATION VERS L'HÉBERGEMENT HDS
   Quatre fonctions à remplacer, et rien d'autre dans l'application.
   Chacune devient un appel réseau authentifié vers le back-office HDS :

     Store.lire()          ->  GET    /api/dossiers
     Store.ecrire(d)       ->  PUT    /api/dossiers          (ou par dossier)
     Store.vider()         ->  DELETE /api/dossiers          (test uniquement)
     Store.exporter()      ->  conservé pour la reprise de données

   Aucun autre endroit du code ne touche au stockage. À la migration,
   ajouter également : authentification forte, journalisation des accès,
   chiffrement au repos, et suppression de tout stockage navigateur.
   ===================================================================== */
const Store = {
  lire() {
    try {
      const brut = window.localStorage.getItem(STORAGE_KEY);
      return brut ? JSON.parse(brut) : null;
    } catch (e) {
      console.warn('Lecture impossible', e);
      return null;
    }
  },
  ecrire(donnees) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(donnees));
      return true;
    } catch (e) {
      console.warn('Écriture impossible', e);
      return false;
    }
  },
  vider() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  },
  exporter() {
    return JSON.stringify(Etat, null, 2);
  }
};

/* =====================================================================
   ÉTAT
   ===================================================================== */
let Etat = { version: '0.1', mode: MODE, dossiers: [] };

function sauver() { Store.ecrire(Etat); }

function nouvelId() {
  return 'D' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function horodatage() {
  return new Date().toISOString();
}

function formaterDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* Âge : seule valeur dérivée, à usage structurel exclusif. */
function ageStructurel(dossier) {
  const a = parseInt(dossier.reponses.annee_naissance, 10);
  if (!a || isNaN(a)) return null;
  return new Date().getFullYear() - a;
}

function nomDossier(d) {
  const n = (d.reponses.nom || '').trim();
  const p = (d.reponses.prenom || '').trim();
  if (!n && !p) return 'Dossier sans nom';
  return (n.toUpperCase() + ' ' + p).trim();
}

/* =====================================================================
   PATIENTS FICTIFS
   Noms manifestement inventés. Les trois profils du dossier de reprise.
   ===================================================================== */
function patientsFictifs() {
  return [
    {
      id: nouvelId(), cree: horodatage(), modifie: horodatage(),
      statut: 'transmis', fictif: true,
      validation: null,
      /* Marques de démonstration, posées comme le ferait un médecin :
         dans le stockage, sur une valeur datée, signées et horodatées.
         Elles ne sont pas écrites en dur dans l'affichage — le suivi
         patient les lit ici, ce qui rend la chaîne réelle. */
      marquesBio: {
        'ferr|2026-07-20': { parametre: 'ferr', dateValeur: '2026-07-20', couleur: 'orange',
          commentaire: 'Baisse régulière depuis 2022. Bilan martial complémentaire prescrit, nous en reparlons.',
          medecin: 'Dr DÉMO (fictif)', date: '2026-07-20T11:40:00.000Z' },
        'gly|2026-07-20': { parametre: 'gly', dateValeur: '2026-07-20', couleur: 'orange',
          commentaire: 'À surveiller. Nous avons parlé d’activité physique et d’alimentation.',
          medecin: 'Dr DÉMO (fictif)', date: '2026-07-20T11:42:00.000Z' },
        'hb|2026-07-20': { parametre: 'hb', dateValeur: '2026-07-20', couleur: 'vert',
          commentaire: 'Stable, sans particularité.',
          medecin: 'Dr DÉMO (fictif)', date: '2026-07-20T11:43:00.000Z' },
        'creat|2026-07-20': { parametre: 'creat', dateValeur: '2026-07-20', couleur: 'vert',
          commentaire: 'Fonction rénale stable.',
          medecin: 'Dr DÉMO (fictif)', date: '2026-07-20T11:44:00.000Z' }
      },
      reponses: {
        nom: 'DÉMO', prenom: 'Profil-Un', annee_naissance: 1970, sexe: 'M',
        profession: 'Conducteur routier (fictif)',
        taille: 176, poids: 96, ta_syst: 152, ta_diast: 94,
        tabac_statut: 'actuel', tabac_cig_jour: 20, tabac_annees: 30,
        auditc_1: '3', auditc_2: '2', auditc_3: '2',
        activite_min: 40, sedentarite: 'plus8',
        atcd_perso: ['hta'], atcd_fam: ['idm_precoce', 'diabete'],
        traitements: 'Amlodipine 5 mg (fictif)',
        expo_pro: ['poussieres', 'bruit', 'nuit'],
        expo_pro_precisions: 'Chantiers puis transport routier (fictif)',
        vaccins: ['dtp'], carnet_vaccinal: 'non',
        resp_dyspnee: 'oui', resp_toux: 'oui', resp_expecto: 'oui',
        resp_sifflements: 'oui', resp_infections: 'oui', mmrc: '2',
        som_ronflement: 'oui', som_apnees_constatees: 'oui', som_fatigue_jour: 'oui',
        som_tour_cou: 44, som_volant: 'oui', som_conducteur_pro: 'oui',
        som_duree: 6,
        ess_1: '2', ess_2: '3', ess_3: '2', ess_4: '3',
        ess_5: '2', ess_6: '0', ess_7: '1', ess_8: '0',
        cut_phototype: 'III', cut_expo_pro: 'oui', cut_nb_naevi: 'moins20',
        cv_hta_connue: 'oui', cv_diabete: 'non',
        cv_douleur_thoracique: 'non', cv_palpitations: 'oui',
        cv_bilan_lipidique_date: 'mars 2024',
        cv_bilan_lipidique_valeurs: 'Cholestérol total 6,2 — HDL 0,9 (valeurs fictives)',
        vis_dernier_examen: 'plus5', vis_gene_loin: 'oui',
        aud_expo_pro: 'oui', aud_acouphenes: 'oui', aud_repetition: 'oui', aud_volume: 'oui',
        hhie_1: '2', hhie_2: '2', hhie_3: '1', hhie_4: '2', hhie_5: '2',
        hhie_6: '1', hhie_7: '1', hhie_8: '0', hhie_9: '2', hhie_10: '1',
        phq_1: '1', phq_2: '1', phq_3: '2', phq_4: '3', phq_5: '1',
        phq_6: '1', phq_7: '1', phq_8: '0', phq_9: '0',
        gad_1: '1', gad_2: '1', gad_3: '0', gad_4: '1', gad_5: '0', gad_6: '2', gad_7: '0',
        dep_colorectal: 'jamais',
        bio_dernier_bilan: '1a3', bio_jeune: 'oui', bio_apporter: 'non',
        att_motif: 'Mon employeur me l’a proposé et je suis fatigué en permanence.',
        att_inquietude: 'Mon père a fait un infarctus à 52 ans.',
        att_declaration: 'oui'
      }
    },
    {
      id: nouvelId(), cree: horodatage(), modifie: horodatage(),
      statut: 'transmis', fictif: true,
      validation: null,
      reponses: {
        nom: 'ESSAI', prenom: 'Profil-Deux', annee_naissance: 1984, sexe: 'F',
        profession: 'Cadre administratif (fictif)',
        taille: 165, poids: 60, ta_syst: 118, ta_diast: 72,
        tabac_statut: 'jamais',
        auditc_1: '1', auditc_2: '0', auditc_3: '0',
        activite_min: 120, sedentarite: '4a8',
        atcd_perso: [], atcd_fam: [],
        traitements: 'Aucun',
        expo_pro: ['ecrans'],
        vaccins: ['dtp', 'covid', 'hpv'], carnet_vaccinal: 'oui',
        resp_dyspnee: 'non', resp_toux: 'non', resp_expecto: 'non',
        resp_sifflements: 'non', resp_infections: 'non', mmrc: '0',
        som_ronflement: 'non', som_apnees_constatees: 'non', som_fatigue_jour: 'oui',
        som_volant: 'non', som_conducteur_pro: 'non', som_duree: 7,
        som_endormissement: 'oui',
        ess_1: '1', ess_2: '1', ess_3: '0', ess_4: '1',
        ess_5: '1', ess_6: '0', ess_7: '1', ess_8: '0',
        cut_phototype: 'III', cut_lesion_nouvelle: 'non', cut_nb_naevi: '20a50',
        cv_hta_connue: 'non', cv_diabete: 'non',
        cv_douleur_thoracique: 'non', cv_palpitations: 'non', cv_syncope: 'non',
        vis_dernier_examen: '1a2', vis_correction: 'oui', vis_secheresse: 'oui',
        aud_expo_pro: 'non', aud_acouphenes: 'non', aud_repetition: 'non',
        hhie_1: '0', hhie_2: '0', hhie_3: '0', hhie_4: '0', hhie_5: '0',
        hhie_6: '0', hhie_7: '0', hhie_8: '0', hhie_9: '0', hhie_10: '0',
        phq_1: '1', phq_2: '1', phq_3: '2', phq_4: '3', phq_5: '1',
        phq_6: '2', phq_7: '2', phq_8: '0', phq_9: '0',
        gad_1: '2', gad_2: '2', gad_3: '1', gad_4: '2', gad_5: '1', gad_6: '1', gad_7: '1',
        mental_travail: 'oui', mental_suivi: 'non',
        dep_col_uterus: '3a5',
        bio_dernier_bilan: 'plus3', bio_jeune: 'oui', bio_apporter: 'non',
        bio_grossesse: 'non',
        att_motif: 'Je suis fatiguée depuis plusieurs mois sans raison évidente.',
        att_question: 'Est-ce que ça peut être la thyroïde ?',
        att_declaration: 'oui'
      }
    },
    {
      id: nouvelId(), cree: horodatage(), modifie: horodatage(),
      statut: 'transmis', fictif: true,
      validation: null,
      reponses: {
        nom: 'FICTIF', prenom: 'Profil-Trois', annee_naissance: 1995, sexe: 'M',
        profession: 'Développeur, moniteur de voile l’été (fictif)',
        taille: 182, poids: 74, ta_syst: 122, ta_diast: 76,
        tabac_statut: 'jamais',
        auditc_1: '2', auditc_2: '1', auditc_3: '1',
        activite_min: 420, sedentarite: '4a8',
        atcd_perso: [], atcd_fam: ['melanome'],
        traitements: 'Aucun',
        expo_pro: ['soleil', 'ecrans'],
        expo_pro_precisions: 'Encadrement nautique quatre mois par an (fictif)',
        vaccins: ['dtp', 'covid'], carnet_vaccinal: 'oui',
        resp_dyspnee: 'non', resp_toux: 'non', mmrc: '0',
        som_ronflement: 'non', som_apnees_constatees: 'non', som_fatigue_jour: 'non',
        som_duree: 8,
        ess_1: '0', ess_2: '1', ess_3: '0', ess_4: '1',
        ess_5: '1', ess_6: '0', ess_7: '0', ess_8: '0',
        cut_lesion_nouvelle: 'oui',
        cut_abcde: ['couleur', 'evolution', 'bords'],
        cut_vilain_canard: 'oui',
        cut_atcd_perso: 'non', cut_atcd_fam: 'oui',
        cut_phototype: 'II', cut_coups_soleil: 'oui',
        cut_nb_naevi: 'plus50', cut_naevi_atypiques: 'ne_sais_pas',
        cut_immunodep: 'non', cut_uv: 'non', cut_expo_pro: 'oui',
        cv_hta_connue: 'non', cv_diabete: 'non', cv_sport_intense: 'oui',
        cv_douleur_thoracique: 'non', cv_palpitations: 'non',
        vis_dernier_examen: '2a5',
        aud_expo_loisir: 'oui', aud_acouphenes: 'non',
        hhie_1: '0', hhie_2: '0', hhie_3: '0', hhie_4: '0', hhie_5: '0',
        hhie_6: '0', hhie_7: '0', hhie_8: '0', hhie_9: '0', hhie_10: '0',
        phq_1: '0', phq_2: '0', phq_3: '0', phq_4: '1', phq_5: '0',
        phq_6: '0', phq_7: '0', phq_8: '0', phq_9: '0',
        gad_1: '1', gad_2: '0', gad_3: '0', gad_4: '0', gad_5: '0', gad_6: '0', gad_7: '0',
        dep_ist: 'oui',
        bio_dernier_bilan: 'plus3', bio_jeune: 'oui',
        att_motif: 'J’ai une tache dans le dos qui a changé de couleur cet été.',
        att_inquietude: 'Ma mère a eu un mélanome.',
        att_declaration: 'oui'
      }
    }
  ];
}

/* =====================================================================
   INITIALISATION
   ===================================================================== */
function initialiser() {
  const sauvegarde = Store.lire();
  if (sauvegarde && Array.isArray(sauvegarde.dossiers) && sauvegarde.dossiers.length) {
    Etat = sauvegarde;
  } else {
    Etat.dossiers = patientsFictifs();
    sauver();
  }
}

/* =====================================================================
   VISIBILITÉ STRUCTURELLE
   Seuls critères admis : sexe, âge minimum, âge maximum.
   Toute autre condition serait un branchement clinique — interdit.
   ===================================================================== */
function questionVisible(q, dossier) {
  if (!q.showIf) return true;
  const c = q.showIf;
  const cles = Object.keys(c);
  for (const k of cles) {
    if (k !== 'sexe' && k !== 'ageMin' && k !== 'ageMax') {
      console.error('Condition non structurelle détectée sur ' + q.id + ' : ' + k);
      return true;
    }
  }
  if (c.sexe && dossier.reponses.sexe !== c.sexe) return false;
  const age = ageStructurel(dossier);
  if (c.ageMin != null && (age == null || age < c.ageMin)) return false;
  if (c.ageMax != null && (age == null || age > c.ageMax)) return false;
  return true;
}

/* =====================================================================
   RENDU — utilitaires
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const app = () => $('#app');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function libelleReponse(q, valeur) {
  if (valeur == null || valeur === '' || (Array.isArray(valeur) && !valeur.length)) return null;
  if (q.options) {
    if (Array.isArray(valeur)) {
      return valeur.map(v => {
        const o = q.options.find(x => x.v === v);
        return o ? o.l : v;
      }).join(' · ');
    }
    const o = q.options.find(x => x.v === valeur);
    if (!o) return String(valeur);
    /* Pour les échelles cotées, on restitue la valeur brute ET son libellé,
       sans jamais l'additionner à quoi que ce soit. */
    if (/^\d+$/.test(o.v)) return o.l + ' (' + o.v + ')';
    return o.l;
  }
  return String(valeur);
}

/* =====================================================================
   VUE — LISTE DES DOSSIERS
   ===================================================================== */
function vueListe() {
  const d = Etat.dossiers.slice().sort((a, b) => (b.modifie || '').localeCompare(a.modifie || ''));

  app().innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Dossiers</h1>
          <p class="sub">Environnement de test. ${d.length} dossier${d.length > 1 ? 's' : ''}.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-p" id="b-nouveau">Nouveau questionnaire</button>
          <button class="btn btn-g" id="b-export">Exporter en JSON</button>
          <button class="btn btn-d" id="b-reset">Réinitialiser les données</button>
        </div>
      </div>

      <table class="tbl">
        <thead>
          <tr><th>Dossier</th><th>Naissance</th><th>Sexe</th><th>Statut</th><th>Dernière modification</th><th></th></tr>
        </thead>
        <tbody>
        ${d.map(x => `
          <tr>
            <td>
              <strong>${esc(nomDossier(x))}</strong>
              ${x.fictif ? '<span class="pill">fictif</span>' : ''}
              <div class="mono">${esc(x.id)}</div>
            </td>
            <td>${esc(x.reponses.annee_naissance || '—')}</td>
            <td>${esc(x.reponses.sexe || '—')}</td>
            <td><span class="statut statut-${esc(x.statut)}">${x.statut === 'transmis' ? 'Transmis au médecin' : 'En cours de saisie'}</span>
              ${x.validation ? '<div class="mono">validé le ' + esc(formaterDate(x.validation.date)) + '</div>' : ''}
            </td>
            <td class="mono">${esc(formaterDate(x.modifie))}</td>
            <td class="right">
              <a class="lien" href="#/questionnaire/${esc(x.id)}">Questionnaire</a>
              <a class="lien" href="#/medecin/${esc(x.id)}">Vue médecin</a>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  $('#b-nouveau').onclick = () => {
    const n = {
      id: nouvelId(), cree: horodatage(), modifie: horodatage(),
      statut: 'brouillon', fictif: true, validation: null, reponses: {}
    };
    Etat.dossiers.push(n); sauver();
    location.hash = '#/questionnaire/' + n.id;
  };

  $('#b-export').onclick = () => {
    const blob = new Blob([Store.exporter()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export-test-prevention.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  $('#b-reset').onclick = () => {
    if (!confirm('Supprimer tous les dossiers de test et recharger les trois profils fictifs ?')) return;
    Store.vider();
    Etat = { version: '0.1', mode: MODE, dossiers: patientsFictifs() };
    sauver(); router();
  };
}

/* =====================================================================
   VUE — QUESTIONNAIRE
   ===================================================================== */
let moduleCourant = 0;

function vueQuestionnaire(id) {
  const dossier = Etat.dossiers.find(x => x.id === id);
  if (!dossier) { location.hash = '#/'; return; }

  const mods = QUESTIONNAIRE.modules;
  if (moduleCourant >= mods.length) moduleCourant = mods.length - 1;
  if (moduleCourant < 0) moduleCourant = 0;
  const m = mods[moduleCourant];

  const visibles = m.questions.filter(q => questionVisible(q, dossier));

  app().innerHTML = `
    <div class="page page-q">
      <div class="q-nav">
        <a class="lien" href="#/">← Tous les dossiers</a>
        <ol class="etapes">
          ${mods.map((x, i) => `<li class="${i === moduleCourant ? 'on' : ''}" data-i="${i}">
            <span>${i + 1}</span>${esc(x.titre)}</li>`).join('')}
        </ol>
      </div>

      <div class="q-main">
        <p class="sub">${esc(nomDossier(dossier))} · module ${moduleCourant + 1} sur ${mods.length}</p>
        <h1>${esc(m.titre)}</h1>
        ${m.intro ? `<p class="intro">${esc(m.intro)}</p>` : ''}

        <form id="form-q" novalidate>
          ${visibles.map(q => champ(q, dossier)).join('')}
        </form>

        <div class="q-actions">
          <button class="btn btn-g" id="b-prec" ${moduleCourant === 0 ? 'disabled' : ''}>Précédent</button>
          ${moduleCourant < mods.length - 1
            ? '<button class="btn btn-p" id="b-suiv">Suivant</button>'
            : '<button class="btn btn-p" id="b-fin">Transmettre au médecin</button>'}
          <span class="save-note" id="save-note"></span>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.etapes li').forEach(li => {
    li.onclick = () => { collecter(dossier); moduleCourant = parseInt(li.dataset.i, 10); vueQuestionnaire(id); };
  });

  const prec = $('#b-prec'); if (prec) prec.onclick = () => { collecter(dossier); moduleCourant--; vueQuestionnaire(id); };
  const suiv = $('#b-suiv'); if (suiv) suiv.onclick = () => { collecter(dossier); moduleCourant++; vueQuestionnaire(id); };
  const fin = $('#b-fin');
  if (fin) fin.onclick = () => {
    collecter(dossier);
    dossier.statut = 'transmis'; dossier.modifie = horodatage(); sauver();
    location.hash = '#/medecin/' + dossier.id;
  };

  $('#form-q').addEventListener('change', () => {
    collecter(dossier);
    const n = $('#save-note'); n.textContent = 'Enregistré';
    setTimeout(() => { n.textContent = ''; }, 1400);
  });
}

function champ(q, dossier) {
  const v = dossier.reponses[q.id];
  const aide = q.aide ? `<p class="aide">${esc(q.aide)}</p>` : '';
  const lic = q.licence ? `<p class="licence"><strong>Licence à obtenir.</strong> ${esc(q.licence)}</p>` : '';
  const inst = q.instrument ? `<span class="inst">${esc(q.instrument)}</span>` : '';

  if (q.type === 'separateur') {
    return `<div class="sep"><h2>${esc(q.label)}</h2>${aide}${lic}</div>`;
  }

  let controle = '';
  if (q.type === 'text' || q.type === 'number') {
    controle = `<input type="${q.type}" id="q-${q.id}" name="${q.id}"
      value="${esc(v == null ? '' : v)}"
      ${q.min != null ? 'min="' + q.min + '"' : ''} ${q.max != null ? 'max="' + q.max + '"' : ''}>`;
  } else if (q.type === 'textarea') {
    controle = `<textarea id="q-${q.id}" name="${q.id}" rows="3">${esc(v == null ? '' : v)}</textarea>`;
  } else if (q.type === 'radio') {
    controle = `<div class="opts">` + q.options.map((o, i) => `
      <label class="opt">
        <input type="radio" name="${q.id}" value="${esc(o.v)}" ${v === o.v ? 'checked' : ''}>
        <span>${esc(o.l)}</span>
      </label>`).join('') + `</div>`;
  } else if (q.type === 'checkbox') {
    const arr = Array.isArray(v) ? v : [];
    controle = `<div class="opts">` + q.options.map(o => `
      <label class="opt">
        <input type="checkbox" name="${q.id}" value="${esc(o.v)}" ${arr.indexOf(o.v) >= 0 ? 'checked' : ''}>
        <span>${esc(o.l)}</span>
      </label>`).join('') + `</div>`;
  }

  return `<div class="champ" data-q="${esc(q.id)}">
    <label class="lbl" for="q-${esc(q.id)}">${esc(q.label)}${q.required ? ' <em>*</em>' : ''}${inst}</label>
    ${aide}${lic}${controle}
  </div>`;
}

function collecter(dossier) {
  const f = $('#form-q'); if (!f) return;
  QUESTIONNAIRE.modules[moduleCourant].questions.forEach(q => {
    if (q.type === 'separateur') return;
    if (q.type === 'checkbox') {
      const boites = f.querySelectorAll('input[name="' + q.id + '"]:checked');
      if (boites.length) dossier.reponses[q.id] = Array.from(boites).map(b => b.value);
      else if (f.querySelector('input[name="' + q.id + '"]')) delete dossier.reponses[q.id];
    } else if (q.type === 'radio') {
      const c = f.querySelector('input[name="' + q.id + '"]:checked');
      if (c) dossier.reponses[q.id] = c.value;
    } else {
      const el = f.querySelector('[name="' + q.id + '"]');
      if (el) {
        const val = el.value.trim();
        if (val === '') delete dossier.reponses[q.id];
        else dossier.reponses[q.id] = (q.type === 'number') ? Number(val) : val;
      }
    }
  });
  dossier.modifie = horodatage();
  sauver();
}

/* =====================================================================
   VUE — MÉDECIN
   Réponses brutes, groupées par thème, sans aucune mise en forme
   interprétative. Le référentiel est dans un onglet distinct.
   ===================================================================== */
let ongletMedecin = 'reponses';

function vueMedecin(id) {
  const dossier = Etat.dossiers.find(x => x.id === id);
  if (!dossier) { location.hash = '#/'; return; }
  const age = ageStructurel(dossier);

  app().innerHTML = `
    <div class="page">
      <div class="q-nav-simple"><a class="lien" href="#/">← Tous les dossiers</a></div>

      <div class="page-head">
        <div>
          <h1>${esc(nomDossier(dossier))} ${dossier.fictif ? '<span class="pill">fictif</span>' : ''}</h1>
          <p class="sub">
            Né en ${esc(dossier.reponses.annee_naissance || '—')}${age != null ? ' · ' + age + ' ans' : ''}
            · sexe ${esc(dossier.reponses.sexe || '—')}
            · ${esc(dossier.reponses.profession || 'profession non renseignée')}
          </p>
          <p class="mono">${esc(dossier.id)} · questionnaire transmis le ${esc(formaterDate(dossier.modifie))}</p>
        </div>
      </div>

      <div class="onglets">
        <button data-o="reponses" class="${ongletMedecin === 'reponses' ? 'on' : ''}">Réponses du patient</button>
        <button data-o="biologie" class="${ongletMedecin === 'biologie' ? 'on' : ''}">Biologie${Biologie.compte(dossier) ? ' · ' + Biologie.compte(dossier) : ''}</button>
        <button data-o="domaines" class="${ongletMedecin === 'domaines' ? 'on' : ''}">Domaines${Avis.compte(dossier) ? ' · ' + Avis.compte(dossier) : ''}</button>
        <button data-o="scores" class="${ongletMedecin === 'scores' ? 'on' : ''}">Scores</button>
        <button data-o="depistages" class="${ongletMedecin === 'depistages' ? 'on' : ''}">Maladies à dépister</button>
        <button data-o="referentiel" class="${ongletMedecin === 'referentiel' ? 'on' : ''}">Référentiel documentaire</button>
        <button data-o="decision" class="${ongletMedecin === 'decision' ? 'on' : ''}">Décision médicale</button>
      </div>

      <div id="onglet-contenu">${
        ongletMedecin === 'reponses' ? blocReponses(dossier)
        : ongletMedecin === 'biologie' ? blocBiologie(dossier)
        : ongletMedecin === 'domaines' ? blocDomaines(dossier)
        : ongletMedecin === 'scores' ? blocScores(dossier)
        : ongletMedecin === 'depistages' ? blocDepistages()
        : ongletMedecin === 'referentiel' ? blocReferentiel()
        : blocDecision(dossier)
      }</div>
    </div>`;

  document.querySelectorAll('.onglets button').forEach(b => {
    b.onclick = () => {
      ongletMedecin = b.dataset.o;
      marqueOuverte = null; bioOuverte = null;
      vueMedecin(id);
    };
  });

  if (ongletMedecin === 'decision') brancherDecision(dossier);
  if (ongletMedecin === 'reponses') brancherMarquage(dossier);
  if (ongletMedecin === 'biologie') brancherBiologie(dossier);
  if (ongletMedecin === 'domaines') brancherDomaines(dossier);
  if (ongletMedecin === 'scores') brancherScores(dossier);
}

/* =====================================================================
   MARQUAGE PAR LE MÉDECIN
   ---------------------------------------------------------------------
   LA DISTINCTION QUI FONDE TOUT CE BLOC

   Le logiciel ne peut pas colorer une réponse selon sa valeur : ce
   serait comparer à un seuil et signaler le franchissement, donc une
   fonction de dispositif médical.

   Le médecin, lui, peut colorer ce qu'il veut. La couleur est alors
   l'expression de SA conclusion, comme un soulignement ou une note
   écrite. Ce n'est pas le logiciel qui conclut, c'est un praticien qui
   s'exprime et le logiciel qui conserve.

   DEUX RÈGLES CODÉES EN DUR, ET ELLES SONT LA FRONTIÈRE
     1. Aucune couleur par défaut. Le médecin part de rien.
     2. Aucune suggestion. L'interface ne propose jamais une couleur en
        fonction de la valeur observée. Il n'existe dans ce fichier
        aucune fonction qui prenne une valeur et renvoie une couleur.

   Toute marque est enregistrée avec son auteur et son horodatage, et
   restituée au patient avec cette attribution : une couleur sans nom
   de médecin serait indistinguable d'un signalement automatique.
   ===================================================================== */

const COULEURS_MARQUE = [
  { v: 'vert',   l: 'Vert' },
  { v: 'orange', l: 'Orange' },
  { v: 'rouge',  l: 'Rouge' }
];

let medecinCourant = '';
let marqueOuverte = null;   /* id de la question en cours d'annotation */

function marqueDe(dossier, qid) {
  return (dossier.marques || {})[qid] || null;
}

/* Enregistrement. La couleur est un paramètre obligatoire : aucune
   valeur de repli, donc aucune couleur par défaut possible. */
function poserMarque(dossier, qid, couleur, commentaire, medecin) {
  if (!couleur) throw new Error('Aucune couleur choisie : le médecin doit choisir explicitement.');
  if (!medecin) throw new Error('Aucun auteur : une marque non signée serait indistinguable d’un signalement automatique.');
  if (!dossier.marques) dossier.marques = {};
  dossier.marques[qid] = {
    couleur: couleur,
    commentaire: commentaire || '',
    medecin: medecin,
    date: horodatage()
  };
  dossier.modifie = horodatage();
  sauver();
}

function retirerMarque(dossier, qid) {
  if (dossier.marques) delete dossier.marques[qid];
  dossier.modifie = horodatage();
  sauver();
}

function blocReponses(dossier) {
  const avis = `
    <div class="avis">
      Réponses transmises telles qu’elles ont été saisies. <b>Le logiciel ne calcule rien,
      ne compare rien à un seuil et ne met en avant aucune réponse.</b> Les grilles
      d’interprétation publiées sont consultables dans l’onglet « Référentiel documentaire ».
    </div>
    <div class="avis">
      Vous pouvez annoter n’importe quelle ligne : choisissez une couleur et écrivez votre
      commentaire. Cette couleur est <b>la vôtre</b>, elle est enregistrée à votre nom et
      horodatée, et le patient la verra accompagnée de votre nom. Aucune couleur n’est
      proposée ni préremplie par le logiciel.
    </div>
    <div class="signataire">
      <label for="med-courant">Vous êtes</label>
      <input type="text" id="med-courant" placeholder="Nom du médecin"
             value="${esc(medecinCourant || (dossier.validation && dossier.validation.medecin) || '')}">
      <span class="sig-note">Nécessaire pour signer vos annotations.</span>
    </div>`;

  const blocs = QUESTIONNAIRE.modules.map(m => {
    const lignes = m.questions
      .filter(q => q.type !== 'separateur')
      .map(q => {
        const l = libelleReponse(q, dossier.reponses[q.id]);
        if (l === null) return null;
        const mq = marqueDe(dossier, q.id);
        const ouvert = marqueOuverte === q.id;

        /* La classe de couleur vient EXCLUSIVEMENT de la marque enregistrée
           par le médecin. Elle n'est jamais dérivée de la réponse. */
        const cls = mq ? ' marque-medecin m-' + esc(mq.couleur) : '';

        return `<tr class="lig${cls}">
          <th>${esc(q.label)}${q.instrument ? ' <span class="inst">' + esc(q.instrument) + '</span>' : ''}</th>
          <td>
            <div class="val-l">
              <span>${esc(l)}</span>
              <button class="b-annot" data-q="${esc(q.id)}">${mq ? 'Modifier' : 'Annoter'}</button>
            </div>
            ${mq ? `<div class="mq-vue">
              <span class="mq-pt m-${esc(mq.couleur)}"></span>
              <span class="mq-txt">${mq.commentaire ? esc(mq.commentaire) : 'Marqué sans commentaire'}</span>
              <span class="mq-sig">${esc(mq.medecin)} · ${esc(formaterDate(mq.date))}</span>
            </div>` : ''}
            ${ouvert ? bloc_annotation(q, mq) : ''}
          </td></tr>`;
      })
      .filter(Boolean);

    if (!lignes.length) return '';
    /* CE QUE LA PERSONNE A LU AVANT DE RÉPONDRE.

       Les mêmes paragraphes que dans l'espace patient, repliés. Ce n'est
       pas de la décoration : une réponse s'interprète différemment selon
       la question telle qu'elle a été posée et le contexte donné autour.
       Le médecin voit donc exactement ce que la personne avait sous les
       yeux — même texte, même photographie, même source de fichier. */
    const lu = (m.paragraphes || []).length ? `
      <details class="qlu">
        <summary>Ce que la personne a lu avant de répondre</summary>
        ${m.photo ? `<img class="qlu-img" src="../images/${esc(m.photo.dossier)}/${esc(m.photo.id)}.jpg"
             width="720" height="450" loading="lazy" decoding="async" alt="">` : ''}
        ${m.paragraphes.map(t => `<p class="qlu-p">${esc(t)}</p>`).join('')}
      </details>` : '';
    return `<section class="bloc">
      <h2>${esc(m.titre)}</h2>
      ${lu}
      <table class="kv">${lignes.join('')}</table>
    </section>`;
  }).join('');

  const nonRepondu = QUESTIONNAIRE.modules
    .map(m => m.questions.filter(q => q.type !== 'separateur' && questionVisible(q, dossier)
      && libelleReponse(q, dossier.reponses[q.id]) === null).length)
    .reduce((a, b) => a + b, 0);

  return avis + blocs + `<p class="mono" style="margin-top:22px">
    ${nonRepondu} question${nonRepondu > 1 ? 's' : ''} sans réponse.
    Le décompte porte sur la complétude du formulaire, pas sur son contenu clinique.</p>`;
}

/* Formulaire d'annotation. Les trois couleurs sont présentées dans le
   même ordre pour toutes les lignes, aucune n'est cochée au départ, et
   aucune n'est mise en avant. */
function bloc_annotation(q, mq) {
  return `<div class="mq-form" data-form="${esc(q.id)}">
    <p class="mq-k">Votre appréciation sur cette ligne</p>
    <div class="mq-choix">
      ${COULEURS_MARQUE.map(c => `
        <label class="mq-opt m-${esc(c.v)}">
          <input type="radio" name="mq-${esc(q.id)}" value="${esc(c.v)}" ${mq && mq.couleur === c.v ? 'checked' : ''}>
          <span>${esc(c.l)}</span>
        </label>`).join('')}
    </div>
    <textarea class="mq-com" rows="2" placeholder="Votre commentaire, facultatif">${mq ? esc(mq.commentaire) : ''}</textarea>
    <p class="mq-err" style="display:none"></p>
    <div class="mq-act">
      <button class="btn btn-p b-mq-save" data-q="${esc(q.id)}">Enregistrer</button>
      ${mq ? `<button class="btn btn-d b-mq-del" data-q="${esc(q.id)}">Retirer la marque</button>` : ''}
      <button class="btn btn-g b-mq-cancel">Annuler</button>
    </div>
    <p class="mq-n">Aucune couleur n’est présélectionnée et aucune n’est suggérée par le
    logiciel. Votre choix sera enregistré à votre nom et visible du patient avec cette
    attribution.</p>
  </div>`;
}

/* Câblage des annotations. Aucun de ces gestionnaires ne lit la réponse
   du patient : la couleur vient uniquement du clic du médecin. */
function brancherMarquage(dossier) {
  const champMed = $('#med-courant');
  if (champMed) champMed.addEventListener('input', () => { medecinCourant = champMed.value.trim(); });

  document.querySelectorAll('.b-annot').forEach(b => {
    b.onclick = () => {
      marqueOuverte = (marqueOuverte === b.dataset.q) ? null : b.dataset.q;
      vueMedecin(dossier.id);
    };
  });

  const annuler = document.querySelector('.b-mq-cancel');
  if (annuler) annuler.onclick = () => { marqueOuverte = null; vueMedecin(dossier.id); };

  const enreg = document.querySelector('.b-mq-save');
  if (enreg) enreg.onclick = () => {
    const qid = enreg.dataset.q;
    const form = document.querySelector('[data-form="' + qid + '"]');
    const err = form.querySelector('.mq-err');
    const choisi = form.querySelector('input[name="mq-' + qid + '"]:checked');
    const med = ($('#med-courant').value || '').trim();

    const dire = m => { err.textContent = m; err.style.display = 'block'; };
    if (!med) return dire('Indiquez votre nom : une marque non signée ne peut pas être enregistrée.');
    if (!choisi) return dire('Choisissez une couleur. Le logiciel n’en propose aucune.');

    medecinCourant = med;
    poserMarque(dossier, qid, choisi.value, form.querySelector('.mq-com').value, med);
    marqueOuverte = null;
    vueMedecin(dossier.id);
  };

  const suppr = document.querySelector('.b-mq-del');
  if (suppr) suppr.onclick = () => {
    retirerMarque(dossier, suppr.dataset.q);
    marqueOuverte = null;
    vueMedecin(dossier.id);
  };
}

/* =====================================================================
   ONGLET BIOLOGIE
   Grille des relevés : un paramètre par ligne, une date par colonne.
   Le médecin clique une valeur précise et pose sa marque. Elle remonte
   immédiatement dans le suivi du patient.

   Aucun intervalle de référence n'est affiché ni stocké, et aucune
   valeur n'est comparée à quoi que ce soit par le logiciel.
   ===================================================================== */
let bioOuverte = null;   /* clé paramètre|date en cours d'annotation */

function blocBiologie(dossier) {
  const dates = Biologie.dates();
  const familles = Biologie.familles();
  const n = Biologie.compte(dossier);

  const entete = `
    <div class="avis">
      Relevés transmis par le laboratoire, tels quels. <b>Le logiciel ne compare aucune valeur
      à un intervalle de référence</b> — ces intervalles figurent sur le compte rendu du
      laboratoire, dans l’onglet documents du patient.
    </div>
    <div class="avis">
      Cliquez une valeur pour l’annoter : vous choisissez la couleur et vous écrivez votre
      commentaire. <b>Votre marque porte sur cette valeur, à cette date.</b> Elle apparaît
      immédiatement dans le suivi du patient, avec votre nom et l’horodatage.
      ${n ? `<br><br>${n} marque${n > 1 ? 's' : ''} posée${n > 1 ? 's' : ''} sur ce dossier.` : ''}
    </div>
    <div class="signataire">
      <label for="med-bio">Vous êtes</label>
      <input type="text" id="med-bio" placeholder="Nom du médecin"
             value="${esc(medecinCourant || (dossier.validation && dossier.validation.medecin) || '')}">
      <span class="sig-note">Toute marque est signée à votre nom.</span>
    </div>`;

  const grilles = familles.map(f => `
    <section class="bloc bio">
      <h2 style="--fc:${f.couleur}">${esc(f.nom)}</h2>
      <table class="bio-t">
        <thead>
          <tr><th class="bio-p">Paramètre</th>
          ${dates.map(d => `<th>${esc(courteDateBio(d))}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${f.items.map(p => `<tr>
            <th class="bio-p">${esc(p.nom)}<span>${esc(p.unite)}</span></th>
            ${dates.map(d => {
              const v = Biologie.valeur(p.id, d);
              const m = Biologie.lire(dossier, p.id, d);
              const k = Biologie.cle(p.id, d);
              return `<td class="bio-c${m ? ' marque-medecin m-' + esc(m.couleur) : ''}">
                <button class="bio-v" data-k="${esc(k)}" title="Annoter cette valeur">
                  ${v == null ? '—' : esc(String(v).replace('.', ','))}
                  ${m ? '<i class="bio-pt"></i>' : ''}
                </button>
              </td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
      ${f.items.map(p => dates.map(d => {
        const k = Biologie.cle(p.id, d);
        if (bioOuverte !== k) return '';
        return bloc_bio_form(dossier, p, d, k);
      }).join('')).join('')}
    </section>`).join('');

  const journal = (function () {
    const toutes = [];
    Biologie.parametres().forEach(p => {
      Biologie.duParametre(dossier, p.id).forEach(m => toutes.push({ p: p, m: m }));
    });
    if (!toutes.length) return '';
    toutes.sort((a, b) => (b.m.date || '').localeCompare(a.m.date || ''));
    return `<section class="bloc">
      <h2>Mes annotations sur ce dossier</h2>
      <table class="kv">
        ${toutes.map(x => `<tr class="marque-medecin m-${esc(x.m.couleur)}">
          <th>${esc(x.p.nom)} · relevé du ${esc(formaterDate(x.m.dateValeur))}<br>
            <span class="mono">valeur ${esc(String(Biologie.valeur(x.p.id, x.m.dateValeur)).replace('.', ','))} ${esc(x.p.unite)}</span></th>
          <td>
            <div class="mq-vue" style="margin-top:0;padding-top:0;border-top:none">
              <span class="mq-pt m-${esc(x.m.couleur)}"></span>
              <span class="mq-txt">${x.m.commentaire ? esc(x.m.commentaire) : 'Marqué sans commentaire'}</span>
              <span class="mq-sig">${esc(x.m.medecin)} · ${esc(formaterDate(x.m.date))}</span>
            </div>
          </td></tr>`).join('')}
      </table>
    </section>`;
  })();

  return entete + grilles + journal;
}

function courteDateBio(iso) {
  const M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const d = new Date(iso);
  return M[d.getMonth()].replace('.', '') + ' ' + String(d.getFullYear()).slice(2);
}

function bloc_bio_form(dossier, p, dateIso, k) {
  const m = Biologie.lire(dossier, p.id, dateIso);
  const v = Biologie.valeur(p.id, dateIso);
  return `<div class="mq-form" data-bform="${esc(k)}">
    <p class="mq-k">${esc(p.nom)} — relevé du ${esc(formaterDate(dateIso))} — valeur
      ${esc(String(v).replace('.', ','))} ${esc(p.unite)}</p>
    <div class="mq-choix">
      ${Biologie.couleurs().map(c => `
        <label class="mq-opt m-${esc(c.v)}">
          <input type="radio" name="bio-${esc(k)}" value="${esc(c.v)}" ${m && m.couleur === c.v ? 'checked' : ''}>
          <span>${esc(c.l)}</span>
        </label>`).join('')}
    </div>
    <textarea class="mq-com" rows="2" placeholder="Votre commentaire, facultatif">${m ? esc(m.commentaire) : ''}</textarea>
    <p class="mq-err" style="display:none"></p>
    <div class="mq-act">
      <button class="btn btn-p b-bio-save" data-k="${esc(k)}">Enregistrer</button>
      ${m ? `<button class="btn btn-d b-bio-del" data-k="${esc(k)}">Retirer la marque</button>` : ''}
      <button class="btn btn-g b-bio-cancel">Annuler</button>
    </div>
    <p class="mq-n">Aucune couleur n’est présélectionnée. Le logiciel ne compare pas cette
    valeur à un intervalle de référence et n’en propose aucune lecture : la marque est la
    vôtre, et elle sera visible du patient avec votre nom.</p>
  </div>`;
}

/* =====================================================================
   ONGLET DOMAINES — QUALIFIER UN DOMAINE EN UN CLIC

   C'est la contrepartie de ce que le patient voit. La maquette v0
   affichait une pastille par domaine, produite par personne ; ici elle
   est produite ici, par vous, et elle porte votre nom.

   TROIS BOUTONS, PARCE QUE TROIS ÉTAIT LE BON NOMBRE DANS LA MAQUETTE
   « Dans les valeurs usuelles », « À surveiller », « À interpréter avec
   votre médecin ». Les libellés sont ceux de v0, conservés au mot : ils
   sont non alarmistes et renvoient à un échange plutôt qu'à un verdict.

   AUCUNE PRÉSÉLECTION. Aucun bouton n'est coché à l'ouverture. Un
   défaut, même prudent, serait une position prise par le logiciel — et
   il suffirait d'un clic distrait pour la transformer en avis signé.

   AUCUNE VALEUR N'EST AFFICHÉE ICI. L'écran ne montre pas les chiffres
   du domaine : il ne faut pas que ce formulaire ressemble à un endroit
   où l'on compare. Les valeurs sont dans l'onglet Biologie, avec les
   marques par relevé. Ici on qualifie un domaine, ce qui est un autre
   geste.
   ===================================================================== */
let domaineOuvertMed = null;

function blocDomaines(dossier) {
  const n = Avis.compte(dossier);
  return `
    <div class="avis-tete">
      <p class="mq-k">Qualifier un domaine</p>
      <p class="note">${n ? n + ' domaine' + (n > 1 ? 's' : '') + ' qualifié' + (n > 1 ? 's' : '')
        : 'Aucun domaine qualifié pour l’instant'} sur ${DOMAINES.liste.length}.
      Ce que vous choisissez ici s’affiche dans l’espace du patient, avec votre nom et la date.
      Un domaine que vous ne qualifiez pas reste marqué « Non commenté » : rien n’est supposé
      à votre place.</p>
      <label class="mq-med">Votre nom
        <input type="text" id="med-dom" placeholder="Dr Prénom Nom"
               value="${esc(medecinCourant || (dossier.validation && dossier.validation.medecin) || '')}">
      </label>
    </div>

    <div class="avis-liste">
      ${DOMAINES.liste.map(d => {
        const a = Avis.lire(dossier, d.id);
        const st = a ? Avis.statut(a.statut) : null;
        const ouvert = domaineOuvertMed === d.id;
        return `
        <div class="avis-l ${ouvert ? 'ouvert' : ''}" style="--dc:${d.couleur}">
          <button class="avis-x" data-dom-med="${esc(d.id)}">
            <img class="avis-img" src="../images/domaines/${esc(d.id)}.jpg"
                 width="800" height="500" loading="lazy" decoding="async" alt="">
            <span class="avis-n">${esc(d.nom)}<em>${esc(d.clair)}</em></span>
            ${a ? `<span class="avis-st m-${esc(TEINTE_AVIS_MED[a.statut])}">${esc(st.l)}</span>`
                : `<span class="avis-st avis-vide">Non commenté</span>`}
          </button>
          ${a ? `<p class="avis-sig">${a.synthese ? '« ' + esc(a.synthese) + ' » — ' : ''}${esc(a.medecin)}
                 · le ${esc(formaterDate(a.date))}</p>` : ''}
          ${ouvert ? bloc_avis_form(dossier, d, a) : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function bloc_avis_form(dossier, d, a) {
  return `<div class="mq-form" data-aform="${esc(d.id)}">
    <p class="mq-k">${esc(d.nom)} — ${esc(d.clair)}</p>
    <div class="mq-choix">
      ${Avis.statuts().map(st => `
        <label class="mq-opt m-${esc(TEINTE_AVIS_MED[st.v])}">
          <input type="radio" name="avis-${esc(d.id)}" value="${esc(st.v)}" ${a && a.statut === st.v ? 'checked' : ''}>
          <span>${esc(st.l)}</span>
        </label>`).join('')}
    </div>
    <textarea class="mq-com" rows="2"
      placeholder="Une phrase pour le patient, facultative">${a ? esc(a.synthese) : ''}</textarea>
    <p class="mq-err" style="display:none"></p>
    <div class="mq-act">
      <button class="btn btn-p b-avis-save" data-dom="${esc(d.id)}">Enregistrer</button>
      ${a ? `<button class="btn btn-d b-avis-del" data-dom="${esc(d.id)}">Retirer l’avis</button>` : ''}
      <button class="btn btn-g b-avis-cancel">Annuler</button>
    </div>
    <p class="mq-n">Aucun statut n’est présélectionné, et le logiciel ne propose rien : il ne
    lit aucune valeur de ce domaine pour vous suggérer une réponse. La phrase que vous écrivez
    est reprise telle quelle dans l’espace du patient.</p>
  </div>`;
}

/* Correspondance statut -> classe de teinte. Une seule échelle de
   couleurs dans tout le produit, celle des marques. */
const TEINTE_AVIS_MED = { usuelles: 'vert', surveiller: 'orange', interpreter: 'rouge' };

function brancherDomaines(dossier) {
  const champ = $('#med-dom');
  if (champ) champ.addEventListener('input', () => { medecinCourant = champ.value.trim(); });

  document.querySelectorAll('[data-dom-med]').forEach(b => {
    b.onclick = () => {
      domaineOuvertMed = (domaineOuvertMed === b.dataset.domMed) ? null : b.dataset.domMed;
      vueMedecin(dossier.id);
    };
  });

  const annuler = document.querySelector('.b-avis-cancel');
  if (annuler) annuler.onclick = () => { domaineOuvertMed = null; vueMedecin(dossier.id); };

  const enreg = document.querySelector('.b-avis-save');
  if (enreg) enreg.onclick = () => {
    const id = enreg.dataset.dom;
    const f = document.querySelector('[data-aform="' + id + '"]');
    const err = f.querySelector('.mq-err');
    const coche = f.querySelector('input[name="avis-' + id + '"]:checked');
    const med = ($('#med-dom').value || '').trim();
    medecinCourant = med;
    try {
      Avis.poser(dossier, id, coche ? coche.value : '',
        f.querySelector('.mq-com').value, med);
      dossier.modifie = horodatage();
      sauver();
      domaineOuvertMed = null;
      vueMedecin(dossier.id);
    } catch (e) {
      err.textContent = e.message;
      err.style.display = 'block';
    }
  };

  const suppr = document.querySelector('.b-avis-del');
  if (suppr) suppr.onclick = () => {
    Avis.retirer(dossier, suppr.dataset.dom);
    dossier.modifie = horodatage();
    sauver();
    domaineOuvertMed = null;
    vueMedecin(dossier.id);
  };
}

function brancherBiologie(dossier) {
  const champ = $('#med-bio');
  if (champ) champ.addEventListener('input', () => { medecinCourant = champ.value.trim(); });

  document.querySelectorAll('.bio-v').forEach(b => {
    b.onclick = () => {
      bioOuverte = (bioOuverte === b.dataset.k) ? null : b.dataset.k;
      vueMedecin(dossier.id);
    };
  });

  const annuler = document.querySelector('.b-bio-cancel');
  if (annuler) annuler.onclick = () => { bioOuverte = null; vueMedecin(dossier.id); };

  const enreg = document.querySelector('.b-bio-save');
  if (enreg) enreg.onclick = () => {
    const k = enreg.dataset.k;
    const parts = k.split('|');
    const f = document.querySelector('[data-bform="' + k + '"]');
    const err = f.querySelector('.mq-err');
    const choisi = f.querySelector('input[name="bio-' + k + '"]:checked');
    const med = ($('#med-bio').value || '').trim();
    medecinCourant = med;
    try {
      Biologie.poser(dossier, parts[0], parts[1],
        choisi ? choisi.value : '', f.querySelector('.mq-com').value, med);
      dossier.modifie = horodatage();
      sauver();
      bioOuverte = null;
      vueMedecin(dossier.id);
    } catch (e) {
      err.textContent = e.message;
      err.style.display = 'block';
    }
  };

  const suppr = document.querySelector('.b-bio-del');
  if (suppr) suppr.onclick = () => {
    const parts = suppr.dataset.k.split('|');
    Biologie.retirer(dossier, parts[0], parts[1]);
    dossier.modifie = horodatage();
    sauver();
    bioOuverte = null;
    vueMedecin(dossier.id);
  };
}

/* =====================================================================
   ONGLET SCORES
   Les scores viennent d'un composant marqué CE, extérieur. Cet onglet
   montre l'état du branchement, ce qu'il faudrait transmettre, et
   permet la saisie manuelle de repli avec sa provenance.
   Aucun score n'est calculé ici.
   ===================================================================== */
function blocScores(dossier) {
  const conf = Calculateur.configure();
  const branche = Calculateur.disponible();

  const entete = branche
    ? `<div class="avis">${'Composant certifié branché : <b>' + esc(conf.nom) + '</b> version ' +
        esc(conf.version) + ', classe ' + esc(conf.classe) + ', organisme notifié ' +
        esc(conf.organismeNotifie) + '. Les scores sont calculés par ce dispositif.'}</div>`
    : `<div class="avis avis-attente">
        <b>Aucun composant certifié n’est branché.</b> La plateforme ne calcule aucun score et
        n’en simule aucun — c’est volontaire. En attendant le branchement, obtenez le score au
        moyen d’un outil marqué CE, puis saisissez-le ci-dessous avec sa provenance.
        <br><br>Rappel : sans interface programmable, la ressaisie des items dans l’outil externe
        coûte plus de temps que le calcul humain qu’elle remplace. La question à poser aux
        éditeurs est « avez-vous une API », pas seulement « avez-vous un marquage CE ».
      </div>`;

  const cartes = Calculateur.instruments().map(inst => {
    const dispo = Calculateur.entreesDisponibles(dossier, inst.id);
    const s = Calculateur.lire(dossier, inst.id);
    const total = inst.entrees.length;

    return `<section class="bloc sc">
      <h2>${esc(inst.nom)}</h2>
      <div class="sc-c">
        <div class="sc-meta">
          <span class="sc-k">Source des données</span>
          <span class="sc-v">${esc(inst.source)}</span>
          <span class="sc-k">Éléments à transmettre</span>
          <span class="sc-v">${dispo.pretes.length} sur ${total} présents dans le dossier</span>
          ${dispo.manquantes.length ? `<span class="sc-k">Manquants</span>
            <span class="sc-v mono">${esc(dispo.manquantes.join(', '))}</span>` : ''}
          ${inst.note ? `<span class="sc-k">À savoir</span><span class="sc-v">${esc(inst.note)}</span>` : ''}
        </div>

        ${s ? `<div class="sc-res">
          <span class="sc-k">Score enregistré</span>
          <b class="sc-val">${esc(s.valeur)}</b>
          <span class="sc-prov">
            ${esc(s.outil)}${s.version ? ' · version ' + esc(s.version) : ''}<br>
            ${esc(s.origine)} · saisi par ${esc(s.auteur)}<br>
            ${esc(formaterDate(s.date))}
          </span>
          <button class="btn btn-d b-sc-del" data-i="${esc(inst.id)}">Retirer</button>
        </div>` : `<div class="sc-form" data-form="${esc(inst.id)}">
          <span class="sc-k">Saisir un score obtenu ailleurs</span>
          <div class="sc-champs">
            <input type="text" class="sc-val-in" placeholder="Valeur">
            <input type="text" class="sc-outil" placeholder="Outil utilisé">
            <input type="text" class="sc-ver" placeholder="Version">
          </div>
          <p class="sc-err" style="display:none"></p>
          <button class="btn btn-p b-sc-save" data-i="${esc(inst.id)}">Enregistrer</button>
        </div>`}
      </div>
    </section>`;
  }).join('');

  return entete + `
    <div class="signataire">
      <label for="med-scores">Vous êtes</label>
      <input type="text" id="med-scores" placeholder="Nom du médecin"
             value="${esc(medecinCourant || (dossier.validation && dossier.validation.medecin) || '')}">
      <span class="sig-note">Tout score enregistré est signé à votre nom.</span>
    </div>` + cartes;
}

function brancherScores(dossier) {
  const champMed = $('#med-scores');
  if (champMed) champMed.addEventListener('input', () => { medecinCourant = champMed.value.trim(); });

  document.querySelectorAll('.b-sc-save').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.i;
      const f = document.querySelector('[data-form="' + id + '"]');
      const err = f.querySelector('.sc-err');
      const med = ($('#med-scores').value || '').trim();
      medecinCourant = med;
      try {
        Calculateur.saisir(dossier, id,
          f.querySelector('.sc-val-in').value,
          f.querySelector('.sc-outil').value,
          f.querySelector('.sc-ver').value,
          med);
        dossier.modifie = horodatage();
        sauver();
        vueMedecin(dossier.id);
      } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
      }
    };
  });

  document.querySelectorAll('.b-sc-del').forEach(b => {
    b.onclick = () => {
      Calculateur.retirer(dossier, b.dataset.i);
      dossier.modifie = horodatage();
      sauver();
      vueMedecin(dossier.id);
    };
  });
}

/* RÉFÉRENTIEL DES MALADIES À DÉPISTER, côté médecin.

   Affiché intégralement, y compris la liste de ce que le parcours refuse
   de faire. Ce n'est pas de la documentation décorative : c'est ce que le
   médecin peut opposer à un patient qui demande un « bilan complet », et
   ce que la direction peut opposer à un commercial qui voudrait ajouter
   un test au catalogue.

   Aucun rapprochement avec le dossier ouvert. La fonction ne reçoit pas
   le dossier — même signature vide que côté patient, pour la même raison :
   afficher « ce patient de 52 ans relève du programme colorectal » serait
   produire une indication, donc un avis médical, donc autre chose que ce
   logiciel. */
function blocDepistages() {
  const V = DEPISTAGES.validation;
  const carte = d => `
    <article class="dep dep-${esc(d.plateau)}">
      <div class="dep-h">
        <b>${esc(d.maladie)}</b>
        <span class="dep-n">${esc(DEPISTAGES.plateauLib(d.plateau))}</span>
      </div>
      <dl class="dep-l">
        <dt>Examens</dt><dd>${esc(d.examens)}</dd>
        <dt>Plateau</dt><dd>${esc(d.equipement)}</dd>
        <dt>Population</dt><dd>${esc(d.population)}</dd>
        <dt>Rythme</dt><dd>${esc(d.rythme)}</dd>
        <dt>Preuve</dt><dd>${esc(d.preuve)}</dd>
        <dt>Prise en charge</dt><dd>${esc(d.pecTexte)}</dd>
      </dl>
      ${(d.arbitrage || []).length ? `<p class="dep-arb">
        <b>Arbitré et visé :</b> ${esc(d.arbitrage.join(' · '))} — la restriction validée
        s’applique, elle n’est plus indicative.</p>` : ''}
      ${d.redige ? `<p class="dep-p"><b>Pourquoi.</b> ${esc(d.pourquoi)}</p>
        <p class="dep-p dep-lim"><b>Limites.</b> ${esc(d.limites)}</p>
        <p class="dep-p"><b>Ce que fait le parcours.</b> ${esc(d.role)}</p>
        <p class="dep-s">${esc(d.source)}</p>`
      : `<p class="dep-nr">Texte d’explication et limites non encore rédigés pour cette
         ligne. Rien n’a été inventé : une phrase écrite au hasard sur les limites d’un
         dépistage a l’air d’une information.</p>`}
    </article>`;

  return `
    <div class="avis ${V.etat === 'valide' ? 'avis-vise' : 'avis-alerte'}">
      <b>${esc(V.libelle)}.</b> ${esc(V.detail)}
      ${V.medecin ? `<br>Visé par ${esc(V.medecin)}${V.qualite ? ', ' + esc(V.qualite) : ''}${
                      V.rpps ? ', RPPS ' + esc(V.rpps) : ''}, le ${esc(formaterDate(V.date))}.`
                  : '<br><b>Visa incomplet :</b> le nom du médecin responsable n’est pas ' +
                    'encore enregistré. Tant qu’il manque, ce référentiel ne doit pas être ' +
                    'présenté comme validé.'}
      ${V.porteeDuVisa ? `<br><span class="avis-portee"><b>Ce que le visa ne couvre pas.</b>
        ${esc(V.porteeDuVisa)}</span>` : ''}
    </div>

    <section class="bloc">
      <h2>Les ${DEPISTAGES.revue.length} lignes soumises à votre arbitrage</h2>
      <p class="aide">Lignes porteuses d’une restriction opposable de nomenclature ou d’un
      risque de surdiagnostic documenté. Elles conditionnent la composition du socle, et le
      socle conditionne le modèle économique : c’est par elles qu’il faut commencer.</p>
      <table class="kv kv-rev">
        <thead><tr><th>Examen</th><th>Palier</th><th>Base</th><th>Déclencheur retenu</th></tr></thead>
        <tbody>
          ${DEPISTAGES.revue.map(r => `<tr>
            <td><b>${esc(r.examen)}</b>
              <span class="rev-r">${esc(r.restriction)}</span></td>
            <td class="rev-c">${esc(r.palier)}</td>
            <td class="rev-c">${esc(r.base)}</td>
            <td class="rev-c">${esc(r.declencheur)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="bloc">
      <h2>Périmètre : ${DEPISTAGES.liste.length} pathologies</h2>
      <p class="aide">Reprises de la matrice de prévention. ${DEPISTAGES.liste.filter(d => d.redige).length}
      portent un texte rédigé et sourcé ;
      ${DEPISTAGES.liste.filter(d => !d.redige).length} attendent le leur. Le statut du plateau
      dit ce qui est faisable dans les centres, ce qui demande un achat et ce qui est adressé.</p>
    </section>

    ${DEPISTAGES.parAxe().map(g => `
      <section class="bloc">
        <h2>${esc(g.axe)} — ${g.liste.length}</h2>
        <div class="dep-g">${g.liste.map(carte).join('')}</div>
      </section>`).join('')}

    <section class="bloc">
      <h2>Ce que le parcours ne fait pas</h2>
      <p class="aide">Examens écartés, avec la raison de chaque refus. Ce sont ceux que
      proposent les offres de bilan premium : la liste sert à répondre à la demande d’un
      patient comme à celle d’un partenaire.</p>
      <div class="dep-g">
        ${DEPISTAGES.ecartes.map(e => `
          <article class="dep dep-ecarte">
            <div class="dep-h"><b>${esc(e.quoi)}</b><span class="dep-n">Écarté</span></div>
            <p class="dep-p">${esc(e.raison)}</p>
          </article>`).join('')}
      </div>
    </section>`;
}

function blocReferentiel() {
  return `
    <div class="avis">
      Contenu documentaire statique, identique pour tous les dossiers. Il n’est pas
      rapproché des réponses de ce patient par le logiciel. Les sommes et comparaisons
      décrites ci-dessous sont réalisées par le professionnel.
    </div>
    ${REFERENTIEL.map(r => `
      <section class="bloc">
        <h2>${esc(r.titre)}</h2>
        <ul class="ref">${r.contenu.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </section>`).join('')}`;
}

function blocDecision(dossier) {
  const v = dossier.validation || {};
  return `
    <div class="avis">
      Ce panneau constitue la pièce justificative de l’indication. Il est saisi
      librement par le médecin : aucune proposition n’est préremplie, aucune liste
      d’actes n’est suggérée par le logiciel. La validation est horodatée.
    </div>

    <section class="bloc">
      <h2>Appréciation du médecin</h2>
      <div class="champ">
        <label class="lbl" for="d-synthese">Éléments retenus à l’examen et à l’entretien</label>
        <textarea id="d-synthese" rows="5">${esc(v.synthese || '')}</textarea>
      </div>
      <div class="champ">
        <label class="lbl" for="d-actes">Actes prescrits, et justification de chacun</label>
        <p class="aide">Un acte par ligne, suivi du motif. C’est ce texte qui sera opposable en cas de contrôle.</p>
        <textarea id="d-actes" rows="6">${esc(v.actes || '')}</textarea>
      </div>
      <div class="champ">
        <label class="lbl" for="d-ecartes">Actes écartés, et motif</label>
        <p class="aide">Documenter ce qui n’a pas été retenu est aussi utile que l’inverse.</p>
        <textarea id="d-ecartes" rows="4">${esc(v.ecartes || '')}</textarea>
      </div>
      <div class="champ">
        <label class="lbl" for="d-hn">Analyses hors nomenclature proposées, le cas échéant</label>
        <p class="aide">Rappel : devis signé obligatoire avant réalisation, mentionnant l’absence de prise en charge et le montant.</p>
        <textarea id="d-hn" rows="3">${esc(v.horsNomenclature || '')}</textarea>
      </div>
      <div class="champ">
        <label class="lbl" for="d-medecin">Nom du médecin</label>
        <input type="text" id="d-medecin" value="${esc(v.medecin || '')}">
      </div>

      <div class="q-actions">
        <button class="btn btn-p" id="b-valider">Valider et horodater</button>
        <span class="save-note" id="d-note">${v.date ? 'Validé le ' + esc(formaterDate(v.date)) : ''}</span>
      </div>
    </section>

    ${v.date ? `<section class="bloc">
      <h2>Traçabilité</h2>
      <table class="kv">
        <tr><th>Questionnaire créé</th><td class="mono">${esc(formaterDate(dossier.cree))}</td></tr>
        <tr><th>Dernière modification des réponses</th><td class="mono">${esc(formaterDate(dossier.modifie))}</td></tr>
        <tr><th>Validation médicale</th><td class="mono">${esc(formaterDate(v.date))}</td></tr>
        <tr><th>Médecin</th><td>${esc(v.medecin || '—')}</td></tr>
      </table>
    </section>` : ''}`;
}

function brancherDecision(dossier) {
  $('#b-valider').onclick = () => {
    const med = $('#d-medecin').value.trim();
    if (!med) { alert('Indiquez le nom du médecin avant de valider.'); return; }
    dossier.validation = {
      synthese: $('#d-synthese').value,
      actes: $('#d-actes').value,
      ecartes: $('#d-ecartes').value,
      horsNomenclature: $('#d-hn').value,
      medecin: med,
      date: horodatage()
    };
    sauver();
    vueMedecin(dossier.id);
  };
}

/* =====================================================================
   ROUTAGE
   ===================================================================== */
function router() {
  const h = location.hash.replace(/^#/, '') || '/';
  const p = h.split('/').filter(Boolean);
  if (p[0] === 'questionnaire' && p[1]) { vueQuestionnaire(p[1]); return; }
  if (p[0] === 'medecin' && p[1]) { ongletMedecin = ongletMedecin || 'reponses'; vueMedecin(p[1]); return; }
  moduleCourant = 0;
  vueListe();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => { initialiser(); router(); });
