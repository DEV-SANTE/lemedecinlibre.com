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
        <button data-o="referentiel" class="${ongletMedecin === 'referentiel' ? 'on' : ''}">Référentiel documentaire</button>
        <button data-o="decision" class="${ongletMedecin === 'decision' ? 'on' : ''}">Décision médicale</button>
      </div>

      <div id="onglet-contenu">${
        ongletMedecin === 'reponses' ? blocReponses(dossier)
        : ongletMedecin === 'referentiel' ? blocReferentiel()
        : blocDecision(dossier)
      }</div>
    </div>`;

  document.querySelectorAll('.onglets button').forEach(b => {
    b.onclick = () => { ongletMedecin = b.dataset.o; vueMedecin(id); };
  });

  if (ongletMedecin === 'decision') brancherDecision(dossier);
}

function blocReponses(dossier) {
  const avis = `
    <div class="avis">
      Réponses transmises telles qu’elles ont été saisies. Aucun score n’est calculé,
      aucune valeur n’est comparée à un seuil, aucune réponse n’est mise en avant.
      Les grilles d’interprétation publiées sont consultables dans l’onglet
      « Référentiel documentaire ».
    </div>`;

  const blocs = QUESTIONNAIRE.modules.map(m => {
    const lignes = m.questions
      .filter(q => q.type !== 'separateur')
      .map(q => {
        const l = libelleReponse(q, dossier.reponses[q.id]);
        if (l === null) return null;
        return `<tr><th>${esc(q.label)}${q.instrument ? ' <span class="inst">' + esc(q.instrument) + '</span>' : ''}</th>
                    <td>${esc(l)}</td></tr>`;
      })
      .filter(Boolean);

    if (!lignes.length) return '';
    return `<section class="bloc">
      <h2>${esc(m.titre)}</h2>
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
