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
   STOCKAGE — BRANCHÉ SUR L'API
   ---------------------------------------------------------------------
   Ces fonctions avaient la même signature quand elles écrivaient dans le
   navigateur. Elles servent maintenant un cache alimenté par le serveur.
   Le reste de ce fichier n'a pas eu à changer : c'était l'intérêt de
   n'avoir qu'un seul point d'accès aux données.

   PLUS RIEN DE MÉDICAL N'EST ÉCRIT DANS LE NAVIGATEUR. Le cache vit en
   mémoire, il disparaît en fermant l'onglet. Les écritures partent vers
   le serveur, et le cache est ensuite rechargé depuis ce que le serveur
   a réellement enregistré — jamais depuis ce qu'on croit avoir envoyé.

   Les écritures sont lancées sans être attendues, parce que les écrans
   appellent ces fonctions de façon synchrone. En cas d'échec, un bandeau
   le dit : il ne faut pas qu'une personne croie ses réponses enregistrées
   alors qu'elles ne le sont pas.
   ===================================================================== */
const Db = {
  _compte: null,
  _dossiers: [],

  lireCompte() { return this._compte; },

  ecrireCompte(c) {
    /* L'identité vient du serveur. Ce qui est conservé ici est l'état de
       navigation : quel dossier est ouvert, où en est le parcours. */
    this._compte = c;
  },

  lireDossiers() {
    return { version: '0.2', mode: 'SERVEUR', dossiers: this._dossiers };
  },

  ecrireDossiers(base) {
    this._dossiers = (base && base.dossiers) || [];
    const courant = this._dossiers.find(
      (x) => this._compte && x.id === this._compte.dossierId);
    if (!courant) return;
    const lignes = Adaptateur.reponsesVersAPI(courant.reponses);
    if (!lignes.length) return;
    API.enregistrerReponses(courant.id, lignes)
      .then(() => Db.rafraichir())
      .catch((e) => signalerEchec(e));
  },

  effacerCompte() {
    this._compte = null;
    this._dossiers = [];
    API.deconnexion().finally(() => { window.location.href = '/connexion/'; });
  },

  /* Écriture attendue, contrairement à ecrireDossiers() qui lance sans
     attendre. Nécessaire avant de transmettre : on ne déclare pas un
     dossier transmis si ses dernières réponses ne sont pas parties. */
  async enregistrerMaintenant() {
    const courant = this._dossiers.find(
      (x) => this._compte && x.id === this._compte.dossierId);
    if (!courant) throw new Error('aucun dossier ouvert');
    const lignes = Adaptateur.reponsesVersAPI(courant.reponses);
    if (lignes.length) await API.enregistrerReponses(courant.id, lignes);
    await Db.rafraichir();
    return lignes.length;
  },

  /* Transmission au médecin. C'est le SERVEUR qui change le statut : le
     cache ne fait que le refléter ensuite. Auparavant ce code écrivait
     « transmis » dans le cache local et affichait « vos réponses sont
     transmises » — alors que le serveur n'en savait rien et que le
     médecin ne pouvait donc pas rendre d'avis. */
  async transmettre() {
    const id = this._compte && this._compte.dossierId;
    if (!id) throw new Error('aucun dossier ouvert');
    await Db.enregistrerMaintenant();
    await API.transmettre(id);
    await Db.rafraichir();
    const apres = this._dossiers.find((x) => x.id === id);
    /* Vérification, et non confiance : on relit le statut renvoyé par le
       serveur avant d'annoncer quoi que ce soit à la personne. */
    if (!apres || apres.statut === 'brouillon') {
      throw new Error('le serveur n’a pas confirmé la transmission');
    }
    return apres;
  },

  /* Recharge le cache depuis le serveur. */
  async rafraichir() {
    const dossiers = await API.charger();
    Db._dossiers = dossiers.map(Adaptateur.versEcran);
    return Db._dossiers;
  },
};

/* Un échec d'enregistrement ne doit pas être silencieux. */
function signalerEchec(e) {
  let bandeau = document.getElementById('echec-reseau');
  if (!bandeau) {
    bandeau = document.createElement('div');
    bandeau.id = 'echec-reseau';
    bandeau.setAttribute('role', 'alert');
    bandeau.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99;padding:12px 18px;'
      + 'background:#fdf2f2;border-top:2px solid #d64545;color:#8a2020;font:14px/1.5 inherit';
    document.body.appendChild(bandeau);
  }
  bandeau.textContent = 'Vos dernières réponses n’ont pas pu être enregistrées : '
    + (e && e.message ? e.message : 'serveur injoignable')
    + ' — ne fermez pas cette page, elles seront renvoyées au prochain enregistrement.';
}

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
  if (ETAPES.some(e => e.id === h)) return h;
  if (typeof ONGLETS_ESPACE !== 'undefined' && ONGLETS_ESPACE.some(o => o.id === h)) return h;
  return 'accueil';
}

function rendreProgression() {
  const cur = etapeCourante();
  /* Dans « Mon espace », le parcours d'entrée est terminé : toutes les
     étapes sont affichées comme franchies. */
  const dansEspace = typeof ONGLETS_ESPACE !== 'undefined' && ONGLETS_ESPACE.some(o => o.id === cur);
  const i = dansEspace ? ETAPES.length : ETAPES.findIndex(e => e.id === cur);
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

      ${banniereSection(m)}
      <h1>${esc(m.titre)}</h1>
      ${m.intro ? `<p class="qintro">${esc(m.intro)}</p>` : ''}
      ${(m.paragraphes || []).map(t => `<p class="qpara">${esc(t)}</p>`).join('')}

      <form id="fq" novalidate>${qs.map(q => champ(q, d)).join('')}</form>

      <div class="acts">
        <button class="btn b-g" id="b-prec" ${etapeQ === 0 ? 'disabled' : ''}>${ic('i-back')} Précédent</button>
        <button class="btn b-p" id="b-suiv">${etapeQ < mods.length - 1 ? 'Continuer' : 'Terminer'} ${ic('i-arrow')}</button>
        <span class="note" id="note"></span>
      </div>
    </div>`;

  $('#b-prec').onclick = () => { collecter(d); etapeQ--; vueQuestionnaire(); window.scrollTo(0, 0); };
  $('#b-suiv').onclick = async () => {
    collecter(d);

    /* Pas encore la fin : on avance simplement. */
    if (etapeQ < mods.length - 1) {
      etapeQ++;
      vueQuestionnaire();
      window.scrollTo(0, 0);
      return;
    }

    /* Dernière étape : la transmission est une action, pas un changement
       d'affichage. On attend la confirmation du serveur avant de dire
       quoi que ce soit — et si elle n'arrive pas, on le dit aussi. */
    const bouton = $('#b-suiv');
    const texteInitial = bouton.innerHTML;
    bouton.disabled = true;
    bouton.textContent = 'Transmission en cours…';
    try {
      await Db.transmettre();
      etapeQ = mods.length;
      vueFin();
      window.scrollTo(0, 0);
    } catch (e) {
      bouton.disabled = false;
      bouton.innerHTML = texteInitial;
      let zone = document.getElementById('echec-transmission');
      if (!zone) {
        zone = document.createElement('div');
        zone.id = 'echec-transmission';
        zone.setAttribute('role', 'alert');
        zone.style.cssText = 'margin-top:16px;padding:12px 14px;border-radius:9px;'
          + 'background:#fdf2f2;border:1px solid #f5c6c6;color:#8a2020;font-size:13.5px;line-height:1.55';
        bouton.parentNode.appendChild(zone);
      }
      zone.textContent = 'Vos réponses n’ont pas pu être transmises : '
        + (e && e.message ? e.message : 'serveur injoignable')
        + '. Elles sont conservées, rien n’est perdu. Réessayez dans un instant.';
    }
  };
  $('#fq').addEventListener('change', () => {
    collecter(d);
    const n = $('#note'); n.textContent = 'Enregistré';
    setTimeout(() => { n.textContent = ''; }, 1400);
  });
}

/* BANDEAU DE SECTION.

   La photographie et les paragraphes viennent du questionnaire, donc du
   même fichier que les questions : une section qu'on ajoute arrive avec
   son texte et son image, ou sans, mais jamais avec ceux d'une autre.

   Rien ici ne consulte les réponses déjà données. La fonction ne reçoit
   que le module, pas le dossier — c'est volontaire, et c'est ce qui rend
   impossible un paragraphe qui s'adapterait à ce que la personne a
   répondu. */
function banniereSection(m) {
  if (!m.photo) return '';
  const src = '../images/' + m.photo.dossier + '/' + m.photo.id + '.jpg';
  return '<img class="qphoto" src="' + src + '" width="720" height="450" ' +
         'loading="lazy" decoding="async" alt="">';
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
  /* Le titre reflète le statut que le serveur a renvoyé. Si la
     transmission n'a pas abouti, cet écran ne doit pas prétendre le
     contraire : c'est exactement ce qu'il faisait avant. */
  const transmis = !!d && d.statut !== 'brouillon';
  app().innerHTML = `
    <div class="card">
      <div class="qbar"><i style="width:100%"></i></div>
      <p class="eyebrow" style="margin-top:22px">${transmis ? 'Transmis' : 'Enregistré'}</p>
      <h1>${transmis ? 'Merci, vos réponses sont transmises.'
                     : 'Vos réponses sont enregistrées, mais pas encore transmises.'}</h1>
      <p class="lede">
        ${transmis
          ? 'Le médecin qui vous recevra en prendra connaissance avant votre visite. Il examinera '
            + 'vos réponses, vous interrogera, et décidera avec vous de ce qui est utile.'
          : 'Rien n’est perdu : tout ce que vous avez écrit est conservé. La transmission au '
            + 'médecin n’a pas abouti — revenez sur la dernière étape du questionnaire pour '
            + 'réessayer.'}
      </p>

      <div class="avis">
        ${ic('i-info')}
        <span>Aucune conclusion n’a été tirée de vos réponses par la plateforme. Rien n’a été
        calculé, rien n’a été signalé. Ce que vous avez écrit est transmis tel quel.</span>
      </div>

      <div class="avis">
        ${ic('i-calendar')}
        <span>Prochaine étape : prendre rendez-vous dans le centre de votre choix. Vous
        choisirez également librement le laboratoire qui réalisera vos analyses.</span>
      </div>

      <p class="hint" style="margin-top:20px">Référence de votre dossier :
      <b>${esc(d ? d.id : '—')}</b></p>

      <div class="acts">
        <a class="btn b-p" href="#/rendezvous">Prendre rendez-vous ${ic('i-arrow')}</a>
        <button class="btn b-g" id="b-rev">Revoir mes réponses</button>
        <a class="btn b-g" href="../plateforme/#/medecin/${esc(d ? d.id : '')}">Voir ce que le médecin reçoit</a>
      </div>
    </div>`;

  $('#b-rev').onclick = () => { etapeQ = 0; vueQuestionnaire(); window.scrollTo(0, 0); };
}

/* =====================================================================
   MON ESPACE — modules M4, M5, M6, M7 (voir modules.js)
   ===================================================================== */
const ONGLETS_ESPACE = [
  { id: 'rendezvous', n: 'Mon rendez-vous', f: 'rendezvous' },
  { id: 'devis',      n: 'Mes devis',       f: 'devis' },
  { id: 'documents',  n: 'Mes documents',   f: 'documents' },
  { id: 'factures',   n: 'Mes factures',    f: 'factures' },
  /* « Qui a vu mon dossier » n'est pas une fonctionnalité de confort :
     c'est le droit d'accès aux traces, et il n'a de valeur que s'il est
     visible sans avoir à le demander. */
  { id: 'acces',      n: 'Qui a vu mon dossier', f: 'acces' },
  { id: 'droits',     n: 'Mes données et mes droits', f: 'droits' }
];

/* =====================================================================
   MES DONNÉES ET MES DROITS
   ---------------------------------------------------------------------
   Trois choses au même endroit : l'état du consentement, la copie des
   données, et l'effacement.

   Elles sont réunies parce qu'elles se répondent. Retirer son
   consentement et demander l'effacement sont deux gestes différents, et
   les présenter séparément laisserait croire que le premier supprime —
   ce qui ferait perdre ses données à quelqu'un qui voulait seulement
   suspendre. L'écran le dit explicitement.

   L'effacement est présenté avec sa vraie portée, y compris ce qu'il ne
   peut pas faire : un dossier médical est soumis à des obligations de
   conservation. Annoncer une suppression totale serait plus simple, et
   faux.
   ===================================================================== */
async function vueDroits() {
  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Vos droits</p>
      <h1>Mes données et mes droits</h1>
      <p class="lede">Vous pouvez à tout moment obtenir une copie de vos données, retirer
      votre consentement, ou demander l’effacement de votre compte.</p>
      <div id="d-consent"><p class="hint">Chargement…</p></div>

      <h2 style="font-size:16px;margin-top:30px">Obtenir une copie de mes données</h2>
      <p style="font-size:13.5px;color:var(--ink-3)">Un fichier contenant vos réponses, vos
      résultats, les avis du médecin, l’historique de vos corrections et la liste des accès
      à votre dossier. Aucune interprétation n’y est ajoutée.</p>
      <div class="acts"><button class="btn b-p" id="b-export">Télécharger mes données</button></div>
      <div id="d-export"></div>

      <h2 style="font-size:16px;margin-top:30px">Effacer mon compte</h2>
      <div class="avis" style="background:#fdf2f2;border-color:#f5c6c6">
        <span><b>Ce que cela fait, et ce que cela ne fait pas.</b> Votre compte, votre mot de
        passe et votre identité sont supprimés : vous ne pourrez plus vous connecter.
        En revanche, vos données médicales sont conservées sous une forme dissociée de votre
        identité, parce qu’un dossier médical est soumis à des obligations légales de
        conservation. Pour aller plus loin, adressez-vous au centre.</span>
      </div>
      <div class="acts"><button class="btn b-d" id="b-effacer">Effacer mon compte</button></div>
      <div id="d-effacer"></div>
    </div>`;

  /* --- consentement */
  try {
    const c = await API.monConsentement();
    const zone = document.getElementById('d-consent');
    if (c.donne && c.aJour) {
      zone.innerHTML = '<div class="avis" style="background:var(--fait-l);border-color:var(--fait-ln)">'
        + '<span><b>Consentement donné</b> le ' + esc(jolieDateHeure(c.donneLe))
        + ' (version ' + esc(c.version) + ').</span></div>'
        + '<div class="acts"><button class="btn b-g" id="b-retirer">Retirer mon consentement</button></div>'
        + '<p class="hint">Retirer votre consentement arrête tout nouvel enregistrement. '
        + 'Cela ne supprime pas vos données existantes : c’est l’effacement, plus bas, '
        + 'qui s’en charge.</p><div id="d-retrait"></div>';
      document.getElementById('b-retirer').onclick = async () => {
        if (!window.confirm('Retirer votre consentement ? Vos données ne seront pas supprimées.')) return;
        try {
          const r = await API.retirerConsentement();
          document.getElementById('d-retrait').innerHTML =
            '<div class="avis"><span>' + esc(r.note) + '</span></div>';
        } catch (e) {
          document.getElementById('d-retrait').innerHTML =
            '<p class="hint">Retrait impossible : ' + esc(e.message) + '</p>';
        }
      };
    } else if (c.donne && !c.aJour) {
      zone.innerHTML = '<div class="avis" style="background:var(--amber-bg);border-color:var(--amber-line)">'
        + '<span><b>Le texte a changé depuis votre accord.</b> Vous avez consenti à la '
        + 'version ' + esc(c.version) + ' ; la version en cours est '
        + esc(c.versionEnCours) + '. Relisez-la et confirmez.</span></div>'
        + (c.texte ? '<pre class="hint" style="white-space:pre-line;max-height:200px;'
            + 'overflow:auto;background:var(--bg);padding:13px;border-radius:9px">'
            + esc(c.texte) + '</pre>' : '')
        + '<div class="acts"><button class="btn b-p" id="b-reconsentir">Je consens à cette version</button></div>';
      document.getElementById('b-reconsentir').onclick = async () => {
        /* Passe par le client d'API comme tout le reste : aucune page
           n'appelle fetch() directement, sinon la règle ne vaut rien. */
        try {
          await API.donnerConsentement();
          vueDroits();
        } catch (e) {
          document.getElementById('d-consent').insertAdjacentHTML('beforeend',
            '<p class="hint">Enregistrement impossible : ' + esc(e.message) + '</p>');
        }
      };
    } else {
      zone.innerHTML = '<div class="avis" style="background:#fdf2f2;border-color:#f5c6c6">'
        + '<span><b>Aucun consentement en cours'
        + (c.retireLe ? ', retiré le ' + esc(jolieDateHeure(c.retireLe)) : '')
        + '.</b> Aucune nouvelle donnée n’est enregistrée.</span></div>';
    }
  } catch (e) {
    document.getElementById('d-consent').innerHTML =
      '<p class="hint">État du consentement indisponible : ' + esc(e.message) + '</p>';
  }

  /* --- export : un fichier téléchargé, pas un affichage. Ces données ne
         doivent pas rester à l'écran d'un poste partagé. */
  document.getElementById('b-export').onclick = async () => {
    const b = document.getElementById('b-export');
    b.disabled = true;
    try {
      const d = await API.mesDonnees();
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-prevention-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      document.getElementById('d-export').innerHTML =
        '<p class="hint">Fichier téléchargé. Il contient des données de santé : '
        + 'rangez-le comme tel.</p>';
    } catch (e) {
      document.getElementById('d-export').innerHTML =
        '<p class="hint">Export impossible : ' + esc(e.message) + '</p>';
    }
    b.disabled = false;
  };

  /* --- effacement : double confirmation, dont une saisie explicite. */
  document.getElementById('b-effacer').onclick = async () => {
    if (!window.confirm('Effacer votre compte ? Vous ne pourrez plus vous connecter.')) return;
    const saisi = window.prompt('Pour confirmer, écrivez EFFACER en majuscules :');
    if (saisi !== 'EFFACER') {
      document.getElementById('d-effacer').innerHTML =
        '<p class="hint">Confirmation incorrecte, rien n’a été supprimé.</p>';
      return;
    }
    try {
      const r = await API.effacerMonCompte();
      document.body.innerHTML = '<div style="max-width:62ch;margin:70px auto;padding:0 20px;'
        + 'font:15px/1.65 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#16324f">'
        + '<h1 style="font-size:21px">Votre compte est supprimé</h1><p>' + esc(r.portee)
        + '.</p><p>' + esc(r.note) + '</p></div>';
    } catch (e) {
      document.getElementById('d-effacer').innerHTML =
        '<p class="hint">Effacement impossible : ' + esc(e.message) + '</p>';
    }
  };
}

/* =====================================================================
   QUI A CONSULTÉ MON DOSSIER
   ---------------------------------------------------------------------
   Le journal des accès, tel que le serveur le tient. Chaque ouverture du
   dossier par un soignant y figure, avec la date et le nom.

   Deux choix explicites. D'abord la liste n'est pas filtrée ni résumée :
   on montre tout ce que le serveur renvoie, dans l'ordre, parce qu'un
   journal trié par ce que le logiciel juge intéressant n'est plus un
   journal. Ensuite aucune couleur, aucune alerte : un accès n'est ni
   normal ni suspect, c'est un fait daté, et c'est à la personne d'en
   juger — au besoin en le demandant à son médecin.
   ===================================================================== */
async function vueAcces() {
  const d = dossierCourant();
  app().innerHTML = `
    <div class="card">
      <p class="eyebrow">Vos droits</p>
      <h1>Qui a consulté mon dossier</h1>
      <p class="lede">Chaque fois qu’un soignant ouvre votre dossier, la plateforme
      l’enregistre. Voici ces traces, telles qu’elles sont conservées. Vous pouvez demander
      des explications sur n’importe laquelle d’entre elles.</p>
      <div id="acces-liste"><p class="hint">Chargement…</p></div>
    </div>`;

  if (!d) {
    document.getElementById('acces-liste').innerHTML =
      '<p class="hint">Aucun dossier ouvert pour le moment.</p>';
    return;
  }
  try {
    const r = await API.journalDuDossier(d.id);
    const zone = document.getElementById('acces-liste');
    if (!r.acces.length) {
      zone.innerHTML = '<p class="hint">Personne n’a encore ouvert votre dossier.</p>';
      return;
    }
    const libelles = {
      lecture_dossier: 'a ouvert votre dossier',
      ecriture_avis: 'a écrit un avis',
      pose_marque: 'a annoté une valeur',
      saisie_resultats: 'a saisi des résultats de laboratoire',
      ecriture_reponses: 'vous avez enregistré vos réponses',
      transmission: 'vous avez transmis votre dossier',
      creation_dossier: 'votre dossier a été ouvert',
    };
    const roles = { medecin: 'médecin', secretaire: 'secrétariat', patient: 'vous' };
    zone.innerHTML = '<table class="cv" style="margin-top:18px">'
      + '<thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th></tr></thead><tbody>'
      + r.acces.map((a) => `<tr>
          <td class="cv-d">${esc(jolieDateHeure(a.quand))}</td>
          <td>${esc(a.nom_affiche || 'vous')}${a.role
              ? ' <span class="hint">(' + esc(roles[a.role] || a.role) + ')</span>' : ''}</td>
          <td>${esc(libelles[a.action] || a.action)}</td>
        </tr>`).join('') + '</tbody></table>'
      + '<p class="hint" style="margin-top:14px">Ces traces sont conservées pour votre '
      + 'protection : elles permettent de savoir qui a eu accès à quoi. Elles ne contiennent '
      + 'aucune donnée de santé.</p>';
  } catch (e) {
    document.getElementById('acces-liste').innerHTML =
      '<p class="hint">Journal indisponible : ' + esc(e.message || 'serveur injoignable') + '.</p>';
  }
}

function jolieDateHeure(iso) {
  if (!iso) return '—';
  const x = new Date(iso);
  return isNaN(x) ? '—' : x.toLocaleString('fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* Contexte transmis aux modules : ils ne touchent ni au stockage ni au
   routage directement, ce qui garde la migration HDS localisée. */
function contexteModule() {
  return {
    compte: compte,
    esc: esc,
    ic: ic,
    sauverCompte: function () { Db.ecrireCompte(compte); },
    render: function (html) { app().innerHTML = barreEspace() + html; brancherBarre(); }
  };
}

function barreEspace() {
  const cur = etapeCourante();
  return '<div class="onglets-espace">' + ONGLETS_ESPACE.map(o =>
    '<button data-o="' + o.id + '" class="' + (cur === o.id ? 'on' : '') + '">' +
    esc(o.n) + '</button>').join('') +
    '<a class="revoir" href="#/questionnaire">Revoir mon questionnaire</a></div>';
}

function brancherBarre() {
  document.querySelectorAll('.onglets-espace button').forEach(b => {
    b.onclick = () => { location.hash = '#/' + b.dataset.o; };
  });
}

function vueEspace(id) {
  if (!compte) { location.hash = '#/inscription'; return; }
  const o = ONGLETS_ESPACE.find(x => x.id === id);
  if (!o || !window.Modules || !window.Modules[o.f]) { location.hash = '#/accueil'; return; }
  window.Modules[o.f](contexteModule());
}

/* =====================================================================
   ROUTAGE
   ===================================================================== */
function router() {
  compte = Db.lireCompte();
  rendreProgression();
  rendreEntete();
  const e = etapeCourante();
  if (e === 'acces') return vueAcces();
  if (e === 'droits') return vueDroits();
  if (ONGLETS_ESPACE.some(o => o.id === e)) return vueEspace(e);
  switch (e) {
    case 'inscription':   return vueInscription();
    case 'formule':       return vueFormule();
    case 'paiement':      return vuePaiement();
    case 'questionnaire': return vueQuestionnaire();
    default:              return vueAccueil();
  }
}

window.addEventListener('hashchange', () => { router(); window.scrollTo(0, 0); });

/* =====================================================================
   AMORÇAGE
   ---------------------------------------------------------------------
   Avant d'afficher quoi que ce soit : vérifier la session auprès du
   serveur, puis charger les dossiers. Aucun écran n'est rendu avant,
   pour ne pas montrer un espace vide à quelqu'un qui a bien un dossier,
   ni un dossier à quelqu'un qui n'est plus connecté.
   ===================================================================== */
window.addEventListener('DOMContentLoaded', async () => {
 try {
  const c = await API.exigerSession(['patient']);
  if (!c) return;                       // exigerSession a déjà redirigé

  await Db.rafraichir();

  /* Un patient a toujours un dossier ouvert : s'il n'en a pas encore, on
     le crée. C'est le serveur qui décide de son identifiant. */
  let ouvert = Db._dossiers.find((d) => d.statut === 'brouillon');
  if (!ouvert) {
    const id = await API.creerDossier();
    await Db.rafraichir();
    ouvert = Db._dossiers.find((d) => d.id === id) || Db._dossiers[0];
  }

  const identite = (ouvert && ouvert.identite) || {};
  Db.ecrireCompte({
    nom: identite.nom || '', prenom: identite.prenom || '',
    courriel: c.courriel || '', role: c.role,
    dossierId: ouvert ? ouvert.id : null,
    /* Le parcours d'abonnement n'est pas encore branché : on entre
       directement dans le questionnaire, ce que le serveur autorise. */
    formule: 'pilote', paye: true,
  });

  router();
 } catch (e) {
  /* Si l'amorçage échoue, la page resterait blanche sans explication.
     Mieux vaut une phrase compréhensible qu'un écran vide : la personne
     doit savoir que rien n'a été perdu et qu'il faut réessayer. */
  document.body.innerHTML = '<div style="max-width:60ch;margin:60px auto;padding:0 20px;'
    + 'font:15px/1.65 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#16324f">'
    + '<h1 style="font-size:21px">Espace momentanément indisponible</h1>'
    + '<p>Votre espace n’a pas pu être chargé : ' + (e && e.message ? e.message : 'serveur injoignable')
    + '.</p><p>Aucune de vos réponses n’a été perdue. Réessayez dans un instant, '
    + 'ou <a href="/connexion/">reconnectez-vous</a>.</p></div>';
 }
});
