/* =====================================================================
   ESPACE PATIENT — parcours d'inscription, formule, paiement,
   puis questionnaire.
   Version 0.1 — environnement de test.

   MÊME CONTRAINTE QUE LA VUE MÉDECIN
   Aucun score, aucun seuil, aucune coloration, aucune proposition
   d'acte. Le questionnaire recueille, il ne conclut pas.

   PAIEMENT — décision de conception assumée
   Aucun champ de carte bancaire n'est rendu, même en test. Un
   environnement statique, non PCI-DSS, ne doit jamais afficher de
   formulaire de carte : le risque n'est pas la page de test, c'est
   qu'elle soit recopiée en production. L'emplacement du prestataire
   de paiement est matérialisé par un cadre vide et documenté.

   STOCKAGE PARTAGÉ
   Ce module écrit dans la même clé que la vue médecin, afin qu'un
   dossier rempli ici apparaisse immédiatement côté praticien. À la
   migration HDS, les deux applications appelleront la même API.
   ===================================================================== */

'use strict';

const CLE_DOSSIERS = 'pv-sante-test-v1';   /* partagé avec la vue médecin */
const CLE_COMPTE   = 'pv-sante-compte-v1';

const PRIX_ANNUEL = 129;   /* provisoire — voir mention dans l'écran formule */

/* =====================================================================
   STOCKAGE — quatre points à remplacer à la migration HDS
   ===================================================================== */
const Db = {
  lireCompte() {
    try { const b = localStorage.getItem(CLE_COMPTE); return b ? JSON.parse(b) : null; }
    catch (e) { return null; }
  },
  ecrireCompte(c) {
    try { localStorage.setItem(CLE_COMPTE, JSON.stringify(c)); } catch (e) {}
  },
  lireDossiers() {
    try {
      const b = localStorage.getItem(CLE_DOSSIERS);
      return b ? JSON.parse(b) : { version: '0.1', mode: 'TEST', dossiers: [] };
    } catch (e) { return { version: '0.1', mode: 'TEST', dossiers: [] }; }
  },
  ecrireDossiers(d) {
    try { localStorage.setItem(CLE_DOSSIERS, JSON.stringify(d)); } catch (e) {}
  },
  effacerCompte() {
    try { localStorage.removeItem(CLE_COMPTE); } catch (e) {}
  }
};

/* ===================================================================== */
let compte = null;
let etapeQ = 0;

const $ = s => document.querySelector(s);
const app = () => $('#app');
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const maintenant = () => new Date().toISOString();

function nouvelId() {
  return 'D' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function ic(nom, cls) {
  return '<svg class="ico ' + (cls || '') + '"><use href="#' + nom + '"/></svg>';
}

/* =====================================================================
   ÉTAPES
   ===================================================================== */
const ETAPES = [
  { id: 'accueil',       n: 'Découvrir' },
  { id: 'inscription',   n: 'Créer mon compte' },
  { id: 'formule',       n: 'Choisir ma formule' },
  { id: 'paiement',      n: 'Régler' },
  { id: 'questionnaire', n: 'Questionnaire' }
];

function etapeCourante() {
  const h = (location.hash.replace(/^#\/?/, '') || 'accueil').split('/')[0];
  return ETAPES.some(e => e.id === h) ? h : 'accueil';
}

function rendreProgression() {
  const cur = etapeCourante();
  const i = ETAPES.findIndex(e => e.id === cur);
  $('#prog').innerHTML = '<ol>' + ETAPES.map((e, k) => {
    const cls = k === i ? 'on' : (k < i ? 'done' : '');
    return '<li class="' + cls + '"><i>' + (k < i ? '✓' : (k + 1)) + '</i><span>' + esc(e.n) + '</span></li>';
  }).join('') + '</ol>';
}

function rendreEntete() {
  const el = $('#who');
  if (compte && compte.email) {
    el.innerHTML = 'Connecté · <b>' + esc(compte.email) + '</b>' +
      '<button class="out" id="b-out">Se déconnecter</button>';
    $('#b-out').onclick = () => {
      if (!confirm('Se déconnecter et effacer le compte de test ?')) return;
      Db.effacerCompte(); compte = null; location.hash = '#/accueil'; router();
    };
  } else {
    el.textContent = '';
  }
}

/* =====================================================================
   1. ACCUEIL
   ===================================================================== */
function vueAccueil() {
  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Votre parcours de prévention</p>
      <h1>Un bilan qui ne vous laisse pas seul avec le résultat.</h1>
      <p class="lede">
        Vous remplissez un questionnaire avant votre visite. Un médecin le lit, vous examine,
        et décide de ce qui est utile pour vous. Les examens indiqués sont réalisés sur place
        quand c’est possible, et il vous les explique.
      </p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px">
        <div>
          <div style="width:42px;height:42px;border-radius:12px;background:var(--pri-l);
               color:var(--pri-d);display:grid;place-items:center;margin-bottom:14px">${ic('i-clipboard')}</div>
          <h3>Avant la visite</h3>
          <p style="font-size:14.8px;color:var(--ink-2);margin-top:7px">
            Une quinzaine de minutes de questions, depuis votre téléphone, à votre rythme.
            Vous pouvez interrompre et reprendre.</p>
        </div>
        <div>
          <div style="width:42px;height:42px;border-radius:12px;background:var(--pri-l);
               color:var(--pri-d);display:grid;place-items:center;margin-bottom:14px">${ic('i-stetho')}</div>
          <h3>Pendant la visite</h3>
          <p style="font-size:14.8px;color:var(--ink-2);margin-top:7px">
            Le médecin a déjà lu vos réponses. Il examine, interroge, et détermine ce qui est
            réellement utile dans votre situation.</p>
        </div>
        <div>
          <div style="width:42px;height:42px;border-radius:12px;background:var(--pri-l);
               color:var(--pri-d);display:grid;place-items:center;margin-bottom:14px">${ic('i-calendar')}</div>
          <h3>Après</h3>
          <p style="font-size:14.8px;color:var(--ink-2);margin-top:7px">
            Restitution en consultation, conduite à tenir, et votre historique conservé
            d’une année sur l’autre.</p>
        </div>
      </div>

      <div class="avis">
        ${ic('i-info')}
        <span>Le questionnaire ne calcule rien et ne conclut rien. Il transmet vos réponses
        telles quelles au médecin, qui reste seul à décider.</span>
      </div>

      <div class="acts">
        <button class="btn b-p" id="b-go">Créer mon compte ${ic('i-arrow')}</button>
        <span class="note">Aucun engagement à cette étape.</span>
      </div>
    </div>`;

  $('#b-go').onclick = () => { location.hash = '#/inscription'; };
}

/* =====================================================================
   2. INSCRIPTION
   Consentements distincts par finalité, jamais groupés en une case.
   ===================================================================== */
function vueInscription() {
  const c = compte || {};
  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Étape 1</p>
      <h1>Créer mon compte</h1>
      <p class="lede">Vos identifiants servent à retrouver votre questionnaire et votre
      historique. Ne saisissez pas de véritable mot de passe : cet environnement est un test.</p>

      <div style="margin-top:32px">
        <div class="field">
          <label for="i-prenom">Prénom</label>
          <input id="i-prenom" type="text" autocomplete="given-name" value="${esc(c.prenom || '')}">
        </div>
        <div class="field">
          <label for="i-nom">Nom</label>
          <input id="i-nom" type="text" autocomplete="family-name" value="${esc(c.nom || '')}">
        </div>
        <div class="field">
          <label for="i-email">Adresse électronique</label>
          <input id="i-email" type="email" autocomplete="email" value="${esc(c.email || '')}">
          <p class="hint">Utilisez une adresse fictive, par exemple test@exemple.fr</p>
        </div>
        <div class="field">
          <label for="i-mdp">Mot de passe</label>
          <input id="i-mdp" type="password" autocomplete="new-password">
          <p class="hint">Huit caractères minimum. Aucun mot de passe réel ne doit être
          utilisé ici : rien n’est chiffré sur cet environnement de test.</p>
        </div>
        <div class="field">
          <label for="i-tel">Téléphone <span style="font-weight:500;color:var(--ink-4)">— facultatif</span></label>
          <input id="i-tel" type="text" autocomplete="tel" value="${esc(c.tel || '')}">
        </div>
      </div>

      <h2 style="margin-top:34px;margin-bottom:8px">Vos consentements</h2>
      <p class="hint" style="margin-bottom:18px;max-width:62ch">
        Chaque finalité est présentée séparément et se refuse indépendamment. Refuser une
        finalité facultative ne vous prive d’aucune partie du service.</p>

      <label class="consent">
        <input type="checkbox" id="c-cgv">
        <span><b>Conditions générales et politique de confidentialité <em>obligatoire</em></b>
        <span>J’accepte les conditions générales et j’ai pris connaissance de la manière dont
        mes données sont traitées.</span></span>
      </label>

      <label class="consent">
        <input type="checkbox" id="c-soin">
        <span><b>Transmission de mes réponses au médecin <em>obligatoire</em></b>
        <span>J’accepte que les réponses de mon questionnaire soient transmises au médecin qui
        me recevra, pour la seule finalité de ma prise en charge.</span></span>
      </label>

      <label class="consent">
        <input type="checkbox" id="c-info">
        <span><b>Informations sur mon parcours <em>facultatif</em></b>
        <span>J’accepte de recevoir par courriel les rappels de rendez-vous et les
        informations relatives à mon parcours.</span></span>
      </label>

      <label class="consent">
        <input type="checkbox" id="c-actu">
        <span><b>Contenus de prévention <em>facultatif</em></b>
        <span>J’accepte de recevoir des contenus généraux de prévention. Ces envois ne
        tiennent aucun compte de mes données de santé.</span></span>
      </label>

      <div class="avis">
        ${ic('i-lock')}
        <span>Vos données de santé ne sont jamais transmises à votre employeur, ni à un
        assureur, ni à aucun tiers commercial. Elles ne servent à aucune prospection.</span>
      </div>

      <p class="err" id="err" style="display:none"></p>

      <div class="acts">
        <button class="btn b-g" id="b-prec">${ic('i-back')} Retour</button>
        <button class="btn b-p" id="b-suiv">Continuer ${ic('i-arrow')}</button>
      </div>
    </div>`;

  $('#b-prec').onclick = () => { location.hash = '#/accueil'; };
  $('#b-suiv').onclick = () => {
    const email = $('#i-email').value.trim();
    const mdp = $('#i-mdp').value;
    const e = $('#err');
    const dire = m => { e.textContent = m; e.style.display = 'block'; };

    if (!$('#i-prenom').value.trim() || !$('#i-nom').value.trim()) return dire('Indiquez votre nom et votre prénom.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return dire('L’adresse électronique n’est pas valide.');
    if (mdp.length < 8) return dire('Le mot de passe doit comporter au moins huit caractères.');
    if (!$('#c-cgv').checked) return dire('L’acceptation des conditions générales est nécessaire pour continuer.');
    if (!$('#c-soin').checked) return dire('La transmission de vos réponses au médecin est nécessaire au service.');

    compte = {
      prenom: $('#i-prenom').value.trim(),
      nom: $('#i-nom').value.trim(),
      email: email,
      tel: $('#i-tel').value.trim(),
      /* Le mot de passe n'est pas conservé, même en test. */
      consentements: {
        cgv:  { donne: true, date: maintenant() },
        soin: { donne: true, date: maintenant() },
        info: { donne: $('#c-info').checked, date: maintenant() },
        actu: { donne: $('#c-actu').checked, date: maintenant() }
      },
      cree: maintenant(),
      abonnement: null,
      dossierId: null
    };
    Db.ecrireCompte(compte);
    location.hash = '#/formule';
  };
}

/* =====================================================================
   3. FORMULE
   ===================================================================== */
function vueFormule() {
  if (!compte) { location.hash = '#/inscription'; return; }

  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Étape 2</p>
      <h1>Votre formule</h1>
      <p class="lede">Une seule formule, un seul prix. Ce que vous payez ne dépend pas du
      nombre d’examens que le médecin jugera utiles.</p>

      <div class="offre" style="margin-top:32px">
        <div>
          <div class="inclus">
            <h3>Ce que comprend l’abonnement</h3>
            <ul>
              <li>${ic('i-check')}<span>Le questionnaire et sa transmission au médecin</span></li>
              <li>${ic('i-check')}<span>La coordination de votre parcours et la prise de rendez-vous</span></li>
              <li>${ic('i-check')}<span>La restitution et la conservation de vos documents</span></li>
              <li>${ic('i-check')}<span>Votre historique d’une année sur l’autre</span></li>
              <li>${ic('i-check')}<span>Les rappels et la préparation de votre visite</span></li>
            </ul>
          </div>

          <div class="exclus">
            <h3>Ce que l’abonnement ne comprend pas</h3>
            <ul>
              <li>${ic('i-x')}<span><b>Aucun acte médical.</b> Consultations, examens et analyses
              inscrites à la nomenclature sont facturés par le centre de santé et pris en charge
              dans les conditions habituelles de l’Assurance maladie et de votre complémentaire.</span></li>
              <li>${ic('i-x')}<span><b>Aucune analyse hors nomenclature.</b> Si le médecin en propose,
              elles sont facultatives, facturées par le laboratoire, et font l’objet d’un devis
              signé mentionnant le montant et l’absence de prise en charge.</span></li>
            </ul>
          </div>

          <div class="avis">
            ${ic('i-info')}
            <span>Vous recevrez deux factures distinctes : l’abonnement d’un côté, les actes
            de l’autre. C’est une exigence réglementaire et non un choix de présentation.</span>
          </div>
        </div>

        <div class="prix">
          <div class="n">${PRIX_ANNUEL} €</div>
          <div class="p">par an, pour une personne</div>
          <ul>
            <li>${ic('i-check')}<span>Prix fixe, indépendant du nombre d’examens</span></li>
            <li>${ic('i-check')}<span>Sans engagement au-delà de l’année</span></li>
            <li>${ic('i-check')}<span>Rétractation possible sous quatorze jours</span></li>
            <li>${ic('i-check')}<span>Libre choix du centre et du laboratoire</span></li>
          </ul>
          <p class="prov">Tarif provisoire affiché à titre de test. Le tarif définitif et les
          conditions générales seront arrêtés avant la mise en service.</p>
        </div>
      </div>

      <div class="avis warn">
        ${ic('i-warn')}
        <span><b>Droit de rétractation.</b> S’agissant d’une vente à distance, vous disposez
        de quatorze jours à compter de la souscription pour vous rétracter, sans motif et sans
        frais. Si vous demandez à commencer immédiatement, ce droit demeure, au prorata du
        service déjà fourni.</span>
      </div>

      <div class="acts">
        <button class="btn b-g" id="b-prec">${ic('i-back')} Retour</button>
        <button class="btn b-p" id="b-suiv">Continuer vers le paiement ${ic('i-arrow')}</button>
      </div>
    </div>`;

  $('#b-prec').onclick = () => { location.hash = '#/inscription'; };
  $('#b-suiv').onclick = () => { location.hash = '#/paiement'; };
}

/* =====================================================================
   4. PAIEMENT — simulé, sans aucun champ de carte
   ===================================================================== */
function vuePaiement() {
  if (!compte) { location.hash = '#/inscription'; return; }

  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Étape 3</p>
      <h1>Régler mon abonnement</h1>
      <p class="lede">Récapitulatif : abonnement annuel, ${PRIX_ANNUEL} € pour
      ${esc(compte.prenom)} ${esc(compte.nom)}. Aucun acte médical n’est compris dans ce montant.</p>

      <div class="pay">
        <label class="payopt">
          <input type="radio" name="moyen" value="cb" checked>
          <span><b>Carte bancaire</b><span>Paiement annuel en une fois.</span></span>
        </label>
        <label class="payopt">
          <input type="radio" name="moyen" value="sepa">
          <span><b>Prélèvement automatique</b><span>Mandat SEPA, paiement annuel.</span></span>
        </label>
        <label class="payopt">
          <input type="radio" name="moyen" value="employeur">
          <span><b>Pris en charge par mon employeur</b><span>Si votre entreprise a signé un
          accord, vous n’avez rien à régler. Un code vous a été communiqué.</span></span>
        </label>
      </div>

      <div class="psp">
        ${ic('i-card')}
        <b>Emplacement des champs de paiement</b>
        <p>Aucun champ de carte bancaire n’est affiché sur cet environnement, y compris pour
        un test. Les coordonnées bancaires ne doivent jamais transiter par une page hébergée
        hors d’un environnement conforme PCI-DSS. En production, ce cadre accueillera les
        champs hébergés du prestataire de paiement, isolés dans son propre contexte
        sécurisé.</p>
      </div>

      <div class="avis warn">
        ${ic('i-warn')}
        <span>Environnement de test : aucun paiement ne sera effectué et aucun moyen de
        paiement ne vous sera demandé. Le bouton ci-dessous simule uniquement la suite du
        parcours.</span>
      </div>

      <div class="acts">
        <button class="btn b-g" id="b-prec">${ic('i-back')} Retour</button>
        <button class="btn b-p" id="b-suiv">Simuler le paiement et continuer ${ic('i-arrow')}</button>
      </div>
    </div>`;

  $('#b-prec').onclick = () => { location.hash = '#/formule'; };
  $('#b-suiv').onclick = () => {
    const moyen = (document.querySelector('input[name="moyen"]:checked') || {}).value || 'cb';
    compte.abonnement = {
      formule: 'annuel', montant: PRIX_ANNUEL, moyen: moyen,
      simule: true, date: maintenant(),
      finRetractation: new Date(Date.now() + 14 * 864e5).toISOString()
    };

    /* Création du dossier, visible immédiatement côté médecin. */
    const base = Db.lireDossiers();
    const d = {
      id: nouvelId(), cree: maintenant(), modifie: maintenant(),
      statut: 'brouillon', fictif: true, validation: null,
      reponses: { nom: compte.nom, prenom: compte.prenom }
    };
    base.dossiers = base.dossiers || [];
    base.dossiers.push(d);
    Db.ecrireDossiers(base);

    compte.dossierId = d.id;
    Db.ecrireCompte(compte);
    etapeQ = 0;
    location.hash = '#/questionnaire';
  };
}

/* =====================================================================
   5. QUESTIONNAIRE — vue patient
   ===================================================================== */
function dossierCourant() {
  const base = Db.lireDossiers();
  return (base.dossiers || []).find(x => x.id === (compte && compte.dossierId)) || null;
}

function enregistrerDossier(d) {
  const base = Db.lireDossiers();
  const i = (base.dossiers || []).findIndex(x => x.id === d.id);
  d.modifie = maintenant();
  if (i >= 0) base.dossiers[i] = d; else base.dossiers.push(d);
  Db.ecrireDossiers(base);
}

/* Âge : seule valeur dérivée, à usage strictement structurel. */
function ageStructurel(d) {
  const a = parseInt(d.reponses.annee_naissance, 10);
  if (!a || isNaN(a)) return null;
  return new Date().getFullYear() - a;
}

function visible(q, d) {
  if (!q.showIf) return true;
  const c = q.showIf;
  if (c.sexe && d.reponses.sexe !== c.sexe) return false;
  const age = ageStructurel(d);
  if (c.ageMin != null && (age == null || age < c.ageMin)) return false;
  if (c.ageMax != null && (age == null || age > c.ageMax)) return false;
  return true;
}

function vueQuestionnaire() {
  if (!compte) { location.hash = '#/inscription'; return; }
  const d = dossierCourant();
  if (!d) { location.hash = '#/paiement'; return; }

  const mods = QUESTIONNAIRE.modules;
  if (etapeQ >= mods.length) return vueFin();
  const m = mods[etapeQ];
  const qs = m.questions.filter(q => visible(q, d));
  const pct = Math.round((etapeQ / mods.length) * 100);

  app().innerHTML = `
    <div class="card">
      <div class="qbar"><i style="width:${pct}%"></i></div>
      <p class="qmeta">Section ${etapeQ + 1} sur ${mods.length} · vous pouvez interrompre
      et reprendre plus tard, vos réponses sont conservées.</p>

      <h1>${esc(m.titre)}</h1>
      ${m.intro ? `<p class="qintro">${esc(m.intro)}</p>` : ''}

      <form id="fq" novalidate>${qs.map(q => champ(q, d)).join('')}</form>

      <div class="acts">
        <button class="btn b-g" id="b-prec" ${etapeQ === 0 ? 'disabled' : ''}>${ic('i-back')} Précédent</button>
        <button class="btn b-p" id="b-suiv">${etapeQ < mods.length - 1 ? 'Continuer' : 'Terminer'} ${ic('i-arrow')}</button>
        <span class="note" id="note"></span>
      </div>
    </div>`;

  $('#b-prec').onclick = () => { collecter(d); etapeQ--; vueQuestionnaire(); window.scrollTo(0, 0); };
  $('#b-suiv').onclick = () => {
    collecter(d);
    etapeQ++;
    if (etapeQ >= mods.length) {
      d.statut = 'transmis'; enregistrerDossier(d); vueFin();
    } else { vueQuestionnaire(); }
    window.scrollTo(0, 0);
  };
  $('#fq').addEventListener('change', () => {
    collecter(d);
    const n = $('#note'); n.textContent = 'Enregistré';
    setTimeout(() => { n.textContent = ''; }, 1400);
  });
}

function champ(q, d) {
  const v = d.reponses[q.id];
  const aide = q.aide ? `<p class="aide">${esc(q.aide)}</p>` : '';
  const lic = q.licence ? `<p class="licence"><b>Licence à obtenir.</b> ${esc(q.licence)}</p>` : '';
  const inst = q.instrument ? `<span class="inst">${esc(q.instrument)}</span>` : '';

  if (q.type === 'separateur') return `<div class="sep"><h2>${esc(q.label)}</h2>${aide}${lic}</div>`;

  let ctrl = '';
  if (q.type === 'text' || q.type === 'number') {
    ctrl = `<input type="${q.type}" id="q-${q.id}" name="${q.id}" value="${esc(v == null ? '' : v)}"
      ${q.min != null ? 'min="' + q.min + '"' : ''} ${q.max != null ? 'max="' + q.max + '"' : ''}>`;
  } else if (q.type === 'textarea') {
    ctrl = `<textarea id="q-${q.id}" name="${q.id}" rows="3">${esc(v == null ? '' : v)}</textarea>`;
  } else if (q.type === 'radio') {
    ctrl = '<div class="opts">' + q.options.map(o =>
      `<label class="opt"><input type="radio" name="${q.id}" value="${esc(o.v)}" ${v === o.v ? 'checked' : ''}>
       <span>${esc(o.l)}</span></label>`).join('') + '</div>';
  } else if (q.type === 'checkbox') {
    const arr = Array.isArray(v) ? v : [];
    ctrl = '<div class="opts">' + q.options.map(o =>
      `<label class="opt"><input type="checkbox" name="${q.id}" value="${esc(o.v)}" ${arr.indexOf(o.v) >= 0 ? 'checked' : ''}>
       <span>${esc(o.l)}</span></label>`).join('') + '</div>';
  }

  return `<div class="champ">
    <label class="lbl" for="q-${esc(q.id)}">${esc(q.label)}${q.required ? ' <em>*</em>' : ''}${inst}</label>
    ${aide}${lic}${ctrl}</div>`;
}

function collecter(d) {
  const f = $('#fq'); if (!f) return;
  QUESTIONNAIRE.modules[Math.min(etapeQ, QUESTIONNAIRE.modules.length - 1)].questions.forEach(q => {
    if (q.type === 'separateur') return;
    if (q.type === 'checkbox') {
      const b = f.querySelectorAll('input[name="' + q.id + '"]:checked');
      if (b.length) d.reponses[q.id] = Array.from(b).map(x => x.value);
      else if (f.querySelector('input[name="' + q.id + '"]')) delete d.reponses[q.id];
    } else if (q.type === 'radio') {
      const c = f.querySelector('input[name="' + q.id + '"]:checked');
      if (c) d.reponses[q.id] = c.value;
    } else {
      const el = f.querySelector('[name="' + q.id + '"]');
      if (el) {
        const val = el.value.trim();
        if (val === '') delete d.reponses[q.id];
        else d.reponses[q.id] = (q.type === 'number') ? Number(val) : val;
      }
    }
  });
  enregistrerDossier(d);
}

function vueFin() {
  const d = dossierCourant();
  app().innerHTML = `
    <div class="card">
      <div class="qbar"><i style="width:100%"></i></div>
      <p class="eyebrow" style="margin-top:22px">Terminé</p>
      <h1>Merci, vos réponses sont transmises.</h1>
      <p class="lede">
        Le médecin qui vous recevra en prendra connaissance avant votre visite. Il examinera
        vos réponses, vous interrogera, et décidera avec vous de ce qui est utile.
      </p>

      <div class="avis">
        ${ic('i-info')}
        <span>Aucune conclusion n’a été tirée de vos réponses par la plateforme. Rien n’a été
        calculé, rien n’a été signalé. Ce que vous avez écrit est transmis tel quel.</span>
      </div>

      <div class="avis">
        ${ic('i-calendar')}
        <span>Prochaine étape : prendre rendez-vous dans le centre de votre choix. La liste
        des centres partenaires et le choix du laboratoire vous seront présentés à cette
        étape. <span class="todo">[Module de rendez-vous à construire]</span></span>
      </div>

      <p class="hint" style="margin-top:20px">Référence de votre dossier :
      <b>${esc(d ? d.id : '—')}</b></p>

      <div class="acts">
        <button class="btn b-g" id="b-rev">Revoir et corriger mes réponses</button>
        <a class="btn b-g" href="../plateforme/#/medecin/${esc(d ? d.id : '')}">Voir ce que le médecin reçoit</a>
      </div>
    </div>`;

  $('#b-rev').onclick = () => { etapeQ = 0; vueQuestionnaire(); window.scrollTo(0, 0); };
}

/* =====================================================================
   ROUTAGE
   ===================================================================== */
function router() {
  compte = Db.lireCompte();
  rendreProgression();
  rendreEntete();
  switch (etapeCourante()) {
    case 'inscription':   return vueInscription();
    case 'formule':       return vueFormule();
    case 'paiement':      return vuePaiement();
    case 'questionnaire': return vueQuestionnaire();
    default:              return vueAccueil();
  }
}

window.addEventListener('hashchange', () => { router(); window.scrollTo(0, 0); });
window.addEventListener('DOMContentLoaded', router);
