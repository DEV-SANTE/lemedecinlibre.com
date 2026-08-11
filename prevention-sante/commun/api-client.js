/* =====================================================================
   CLIENT DE L'API
   ---------------------------------------------------------------------
   Le seul endroit du site qui parle au serveur. Aucune page n'appelle
   fetch() directement.

   POURQUOI UN CACHE EN MÉMOIRE
   Tout le code d'affichage existant lit les données de façon synchrone
   (« donne-moi les dossiers, maintenant »), alors qu'un appel réseau est
   asynchrone. Plutôt que de réécrire les sept pages, on charge une fois
   au démarrage dans un cache, et les fonctions de lecture servent ce
   cache. Les écritures partent vers le serveur et mettent le cache à
   jour. Le comportement visible ne change pas ; la source des données,
   oui.

   CE QUI N'EST PLUS STOCKÉ DANS LE NAVIGATEUR
   Plus aucune réponse de santé. Le navigateur ne conserve que le cookie
   de session, qu'il ne peut d'ailleurs pas lire (httpOnly). Si l'onglet
   se ferme, rien ne reste sur la machine.
   ===================================================================== */
'use strict';

var API = (function () {

  var cache = { compte: null, dossiers: [], charge: false };

  /* --------------------------------------------------------- transport */
  async function appel(methode, chemin, corps) {
    var options = {
      method: methode,
      headers: { 'Content-Type': 'application/json' },
      /* same-origin : le cookie de session part avec la requête parce que
         les pages et l'API sont servies par le même serveur. */
      credentials: 'same-origin',
      cache: 'no-store',
    };
    if (corps !== undefined) options.body = JSON.stringify(corps);

    var reponse;
    try {
      reponse = await fetch(chemin, options);
    } catch (e) {
      /* Panne réseau : on le dit, on n'invente pas de données. */
      throw new ErreurAPI(0, 'Le serveur est injoignable. Vos dernières saisies ne sont pas enregistrées.');
    }
    var donnees = {};
    try { donnees = await reponse.json(); } catch (e) {}
    if (!reponse.ok) throw new ErreurAPI(reponse.status, donnees.erreur || 'erreur inconnue');
    return donnees;
  }

  /* Une vraie sous-classe d'Error : sinon le message se perd dans les
     contextes qui attendent une Error (rejets non gérés, journaux). */
  class ErreurAPI extends Error {
    constructor(statut, message) {
      super(message);
      this.name = 'ErreurAPI';
      this.statut = statut;
    }
  }

  /* ------------------------------------------------------- comptes */
  async function inscription(donnees) { return appel('POST', '/api/inscription', donnees); }
  async function texteConsentement() { return appel('GET', '/api/consentement'); }
  async function monConsentement() { return appel('GET', '/api/mon-consentement'); }
  async function donnerConsentement() {
    return appel('POST', '/api/mon-consentement', { consentement: true });
  }
  async function retirerConsentement() { return appel('DELETE', '/api/mon-consentement'); }
  async function mesDonnees() { return appel('GET', '/api/mes-donnees'); }
  async function effacerMonCompte() {
    return appel('DELETE', '/api/mon-compte', { confirmation: 'EFFACER' });
  }

  async function connexion(courriel, motDePasse) {
    var r = await appel('POST', '/api/connexion', { courriel: courriel, motDePasse: motDePasse });
    cache.compte = r; cache.charge = false;
    return r;
  }

  async function deconnexion() {
    try { await appel('POST', '/api/deconnexion'); } finally {
      cache = { compte: null, dossiers: [], charge: false };
    }
  }

  async function moi() {
    try {
      cache.compte = await appel('GET', '/api/moi');
      return cache.compte;
    } catch (e) {
      if (e.statut === 401) { cache.compte = null; return null; }
      throw e;
    }
  }

  /* ------------------------------------------------- second facteur */
  async function totpPreparer() { return appel('POST', '/api/totp/preparer'); }
  async function totpActiver(code) { return appel('POST', '/api/totp/activer', { code: code }); }
  async function codesSecoursRestants() { return appel('GET', '/api/totp/secours'); }
  async function regenererCodesSecours() { return appel('POST', '/api/totp/secours'); }

  async function totpVerifier(code) {
    var r = await appel('POST', '/api/totp/verifier', { code: code });
    cache.compte = { role: r.role, nom: r.nom, centreId: r.centreId };
    return r;
  }
  async function motDePasseOublie(courriel) {
    return appel('POST', '/api/mot-de-passe/oublie', { courriel: courriel });
  }
  async function reinitialiser(jeton, nouveauMotDePasse) {
    return appel('POST', '/api/mot-de-passe/reinitialiser',
      { jeton: jeton, nouveauMotDePasse: nouveauMotDePasse });
  }

  /* ------------------------------------------------------- dossiers */
  async function charger() {
    var liste = await appel('GET', '/api/dossiers');
    var complets = [];
    for (var i = 0; i < liste.dossiers.length; i++) {
      complets.push(await appel('GET', '/api/dossiers/' + liste.dossiers[i].id));
    }
    cache.dossiers = complets;
    cache.charge = true;
    return complets;
  }

  async function creerDossier() {
    var r = await appel('POST', '/api/dossiers');
    await charger();
    return r.dossierId;
  }

  /* Les réponses sont envoyées au serveur, puis le cache est rafraîchi
     depuis ce que le serveur a réellement enregistré — jamais depuis ce
     qu'on croit avoir envoyé. */
  async function enregistrerReponses(dossierId, reponses) {
    var r = await appel('PUT', '/api/dossiers/' + dossierId + '/reponses', { reponses: reponses });
    await charger();
    return r.enregistrees;
  }

  async function transmettre(dossierId) {
    var r = await appel('POST', '/api/dossiers/' + dossierId + '/transmettre');
    await charger();
    return r;
  }

  async function poserMarque(dossierId, marque) {
    var r = await appel('POST', '/api/dossiers/' + dossierId + '/marques', marque);
    await charger();
    return r;
  }

  async function signerAvis(dossierId, avis) {
    var r = await appel('POST', '/api/dossiers/' + dossierId + '/avis', avis);
    await charger();
    return r;
  }

  async function journalDuDossier(dossierId) {
    return appel('GET', '/api/dossiers/' + dossierId + '/journal');
  }

  /* ------------------------------------------------- rendez-vous */
  async function creneauxLibres() { return appel('GET', '/api/creneaux'); }
  async function demanderRendezvous(creneauId) {
    return appel('POST', '/api/rendezvous', { creneauId: creneauId });
  }
  async function mesRendezvous() { return appel('GET', '/api/rendezvous'); }
  async function annulerRendezvous(id) {
    return appel('POST', '/api/rendezvous/' + id + '/annuler');
  }
  async function confirmerRendezvous(id) {
    return appel('POST', '/api/rendezvous/' + id + '/confirmer');
  }
  async function publierCreneaux(creneaux) {
    return appel('POST', '/api/creneaux', { creneaux: creneaux });
  }

  /* --------------------------------------------------- documents */
  async function mesDocuments() { return appel('GET', '/api/documents'); }
  async function referencerDocument(donnees) { return appel('POST', '/api/documents', donnees); }

  /* --------------------------------------------------- centre, comptages */
  async function creerPatient(donnees) { return appel('POST', '/api/patients', donnees); }
  async function patientsEnAttente() { return appel('GET', '/api/patients/en-attente'); }
  async function enregistrerNir(patientId, nir) {
    return appel('PUT', '/api/patients/' + patientId + '/nir', { nir: nir });
  }
  async function lireNir(patientId) { return appel('GET', '/api/patients/' + patientId + '/nir'); }
  async function listerPatients() { return appel('GET', '/api/patients'); }
  async function saisirResultats(dossierId, resultats) {
    return appel('PUT', '/api/dossiers/' + dossierId + '/resultats', { resultats: resultats });
  }
  async function rattacher(patientId) { return appel('POST', '/api/patients/' + patientId + '/rattacher'); }
  async function statistiques() { return appel('GET', '/api/statistiques'); }
  async function pilotage() { return appel('GET', '/api/pilotage'); }

  /* ------------------------------------------------- lecture synchrone
     Ce que les pages existantes appellent. Sert le cache, ne va pas au
     réseau : il faut avoir appelé charger() avant. */
  function dossiers()      { return cache.dossiers; }
  function compte()        { return cache.compte; }
  function estCharge()     { return cache.charge; }
  function dossier(id)     {
    for (var i = 0; i < cache.dossiers.length; i++) {
      if (String(cache.dossiers[i].id) === String(id)) return cache.dossiers[i];
    }
    return null;
  }

  /* Redirige vers la connexion si la session n'est pas valable. À appeler
     au chargement de chaque page protégée. */
  async function exigerSession(roles) {
    var c;
    try {
      c = await moi();
    } catch (e) {
      /* Panne réseau : on ne redirige pas vers la connexion, ce serait
         mentir sur la cause. On laisse l'appelant afficher l'erreur. */
      throw e;
    }
    if (!c) { window.location.href = '/connexion/?retour=' + encodeURIComponent(window.location.pathname); return null; }
    /* Session ouverte mais second facteur non franchi : l'écran de
       vérification prend la main. Sans cela, la page afficherait des
       erreurs 403 sans expliquer ce qu'il faut faire. */
    if (c.secondFacteur === 'attendu' || c.secondFacteur === 'a-configurer') {
      window.location.href = '/connexion/?etape=' + c.secondFacteur
        + '&retour=' + encodeURIComponent(window.location.pathname);
      return null;
    }
    if (roles && roles.indexOf(c.role) === -1) {
      document.body.innerHTML = '<p style="font:15px system-ui;padding:40px;max-width:60ch">'
        + 'Cette page ne correspond pas à votre rôle (' + c.role + '). '
        + '<a href="/connexion/">Revenir à la connexion</a>.</p>';
      return null;
    }
    return c;
  }

  return {
    inscription: inscription, connexion: connexion, deconnexion: deconnexion, moi: moi,
    charger: charger, creerDossier: creerDossier, enregistrerReponses: enregistrerReponses,
    transmettre: transmettre, signerAvis: signerAvis, journalDuDossier: journalDuDossier,
    creerPatient: creerPatient, rattacher: rattacher, statistiques: statistiques,
    dossiers: dossiers, dossier: dossier, compte: compte, estCharge: estCharge,
    exigerSession: exigerSession, ErreurAPI: ErreurAPI,
    totpPreparer: totpPreparer, totpActiver: totpActiver, totpVerifier: totpVerifier,
    codesSecoursRestants: codesSecoursRestants, regenererCodesSecours: regenererCodesSecours,
    motDePasseOublie: motDePasseOublie, reinitialiser: reinitialiser,
    poserMarque: poserMarque, patientsEnAttente: patientsEnAttente,
    listerPatients: listerPatients, saisirResultats: saisirResultats,
    enregistrerNir: enregistrerNir, lireNir: lireNir, pilotage: pilotage,
    texteConsentement: texteConsentement, monConsentement: monConsentement,
    donnerConsentement: donnerConsentement,
    retirerConsentement: retirerConsentement, mesDonnees: mesDonnees,
    effacerMonCompte: effacerMonCompte,
    creneauxLibres: creneauxLibres, demanderRendezvous: demanderRendezvous,
    mesRendezvous: mesRendezvous, annulerRendezvous: annulerRendezvous,
    confirmerRendezvous: confirmerRendezvous, publierCreneaux: publierCreneaux,
    mesDocuments: mesDocuments, referencerDocument: referencerDocument,
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
