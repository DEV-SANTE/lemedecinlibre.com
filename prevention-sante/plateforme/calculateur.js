/* =====================================================================
   COUCHE D'INTÉGRATION D'UN COMPOSANT CERTIFIÉ
   Version 0.1 — aucun composant branché.

   POURQUOI CE FICHIER EXISTE

   La plateforme ne calcule pas. Elle ne calculera jamais. Les scores
   validés — somnolence, risque d'apnées, PHQ-9, GAD-7, SCORE2, FIB-4 —
   sont calculés par un DISPOSITIF MARQUÉ CE, extérieur, dont le
   fabricant porte la responsabilité réglementaire du calcul.

   Ce fichier est le point d'intégration unique vers ce composant. Il
   envoie les réponses brutes, il reçoit un score. Il ne fait rien
   d'autre.

   ---------------------------------------------------------------------
   LA RÈGLE LA PLUS IMPORTANTE DE TOUT LE PROJET, ET ELLE EST ICI

   Tant qu'aucun composant n'est branché, ce module ÉCHOUE. Il ne
   simule pas.

   La tentation, en développement, est d'écrire un calcul provisoire
   « juste pour voir l'écran ». C'est exactement ainsi qu'un calcul
   arrive en production : personne ne retire jamais le provisoire. Un
   bouchon qui échoue est visible et bloquant ; un bouchon qui calcule
   est invisible et devient permanent.

   Il n'y a donc, dans ce fichier, aucune opération arithmétique sur
   une réponse de patient. Le test de non-régression le vérifie.

   ---------------------------------------------------------------------
   CE QUI RESTE À FAIRE POUR BRANCHER UN COMPOSANT

   1. Choisir un éditeur dont le produit porte un marquage CE au titre
      du règlement (UE) 2017/745, et qui expose une interface
      programmable. Sans API, le composant est inutilisable : la
      ressaisie manuelle des items coûte plus de temps que le calcul
      humain qu'elle prétend remplacer.

   2. Exiger avant tout engagement : déclaration UE de conformité,
      classe, numéro de l'organisme notifié, identifiant UDI-DI, et
      notice d'utilisation. Un éditeur réellement certifié les fournit
      en quelques jours.

   3. Renseigner COMPOSANT ci-dessous et implémenter appelerComposant().

   4. Vérifier auprès du consultant en affaires réglementaires que
      l'intégration par interface, sans modification de la destination
      du composant, conserve bien votre statut d'intégrateur et ne vous
      rend pas fabricant d'un système au sens de l'article 22.
   ===================================================================== */

'use strict';

/* =====================================================================
   CONFIGURATION DU COMPOSANT
   Un seul endroit à renseigner dans tout le projet.
   ===================================================================== */
const COMPOSANT = {
  actif: false,                 /* passer à true une fois branché */
  nom: '',                      /* dénomination commerciale */
  fabricant: '',
  version: '',                  /* version certifiée, à journaliser */
  classe: '',                   /* IIa attendu */
  organismeNotifie: '',         /* numéro à quatre chiffres */
  udiDi: '',
  endpoint: ''                  /* hébergé dans l'Union européenne */
};

/* =====================================================================
   INSTRUMENTS DÉLÉGUÉS AU COMPOSANT
   Pour chacun : ce qu'il faut lui transmettre, et d'où cela vient.
   Aucun barème, aucune pondération, aucun seuil ne figure ici — ils
   appartiennent au composant certifié.
   ===================================================================== */
const INSTRUMENTS = [
  { id: 'somnolence', nom: 'Échelle de somnolence diurne', source: 'questionnaire',
    entrees: ['ess_1', 'ess_2', 'ess_3', 'ess_4', 'ess_5', 'ess_6', 'ess_7', 'ess_8'],
    note: 'Instrument sous licence — le composant certifié doit détenir les droits.' },

  { id: 'apnees', nom: 'Risque d’apnées du sommeil', source: 'questionnaire et mesures',
    entrees: ['som_ronflement', 'som_fatigue_jour', 'som_apnees_constatees',
              'cv_hta_connue', 'taille', 'poids', 'annee_naissance', 'som_tour_cou', 'sexe'],
    note: 'Instrument sous licence. Corpulence et âge dérivés par le composant, pas ici.' },

  { id: 'phq9', nom: 'PHQ-9 — dépression', source: 'questionnaire',
    entrees: ['phq_1', 'phq_2', 'phq_3', 'phq_4', 'phq_5', 'phq_6', 'phq_7', 'phq_8', 'phq_9'],
    note: 'Domaine public. Le neuvième item impose une évaluation directe, indépendamment du total.' },

  { id: 'gad7', nom: 'GAD-7 — anxiété', source: 'questionnaire',
    entrees: ['gad_1', 'gad_2', 'gad_3', 'gad_4', 'gad_5', 'gad_6', 'gad_7'],
    note: 'Domaine public.' },

  { id: 'auditc', nom: 'AUDIT-C — consommation d’alcool', source: 'questionnaire',
    entrees: ['auditc_1', 'auditc_2', 'auditc_3'], note: 'OMS, libre.' },

  { id: 'gene_auditive', nom: 'Gêne auditive', source: 'questionnaire',
    entrees: ['hhie_1', 'hhie_2', 'hhie_3', 'hhie_4', 'hhie_5',
              'hhie_6', 'hhie_7', 'hhie_8', 'hhie_9', 'hhie_10'],
    note: 'Conditions de reproduction à vérifier — le composant doit les couvrir.' },

  { id: 'score2', nom: 'SCORE2 — risque cardiovasculaire à 10 ans', source: 'questionnaire et biologie',
    entrees: ['annee_naissance', 'sexe', 'tabac_statut', 'ta_syst', 'cholesterol_non_hdl'],
    note: 'Le cholestérol non-HDL provient du compte rendu de biologie, pas du questionnaire.' },

  { id: 'fib4', nom: 'FIB-4 — fibrose hépatique', source: 'biologie',
    entrees: ['annee_naissance', 'asat', 'alat', 'plaquettes'],
    note: 'Entièrement issu de la biologie. Aucune saisie patient.' }
];

/* =====================================================================
   API DU MODULE
   ===================================================================== */
const Calculateur = {

  configure() { return COMPOSANT; },

  disponible() { return COMPOSANT.actif === true && COMPOSANT.endpoint !== ''; },

  instruments() { return INSTRUMENTS.slice(); },

  instrument(id) { return INSTRUMENTS.find(i => i.id === id) || null; },

  /* Les entrées présentes dans le dossier, et celles qui manquent.
     On regarde uniquement la PRÉSENCE d'une donnée, jamais sa valeur. */
  entreesDisponibles(dossier, id) {
    const inst = this.instrument(id);
    if (!inst) return { pretes: [], manquantes: [] };
    const pretes = [], manquantes = [];
    inst.entrees.forEach(cle => {
      const v = dossier.reponses ? dossier.reponses[cle] : undefined;
      const presente = v !== undefined && v !== null && v !== '' &&
                       !(Array.isArray(v) && v.length === 0);
      (presente ? pretes : manquantes).push(cle);
    });
    return { pretes: pretes, manquantes: manquantes };
  },

  /* ------------------------------------------------------------------
     DEMANDE DE CALCUL
     Renvoie une promesse. Tant qu'aucun composant n'est branché, elle
     se résout en indisponibilité — jamais en score calculé localement.
  ------------------------------------------------------------------- */
  demander(dossier, id) {
    const inst = this.instrument(id);
    if (!inst) {
      return Promise.resolve({ disponible: false, motif: 'Instrument inconnu : ' + id });
    }
    if (!this.disponible()) {
      return Promise.resolve({
        disponible: false,
        motif: 'Aucun composant certifié n’est configuré. La plateforme ne calcule pas ' +
               'et ne simule aucun résultat. Le score doit être obtenu au moyen d’un ' +
               'dispositif marqué CE, puis saisi avec sa provenance.'
      });
    }
    return appelerComposant(inst, this.charge(dossier, inst));
  },

  /* Charge utile : les réponses brutes, telles quelles. */
  charge(dossier, inst) {
    const c = {};
    inst.entrees.forEach(cle => { c[cle] = dossier.reponses ? dossier.reponses[cle] : null; });
    return c;
  },

  /* ------------------------------------------------------------------
     SAISIE MANUELLE DE REPLI
     Utilisable tant qu'aucun composant n'est branché. La provenance est
     obligatoire : un score sans outil identifié ni auteur ne pourrait
     pas être distingué d'un calcul de la plateforme.
  ------------------------------------------------------------------- */
  saisir(dossier, id, valeur, outil, version, auteur) {
    if (!this.instrument(id)) throw new Error('Instrument inconnu : ' + id);
    if (valeur === '' || valeur === null || valeur === undefined) {
      throw new Error('Aucune valeur saisie.');
    }
    if (!outil) throw new Error('Outil non renseigné : la provenance du score est obligatoire.');
    if (!auteur) throw new Error('Auteur non renseigné : un score non signé ne peut pas être enregistré.');

    if (!dossier.scores) dossier.scores = {};
    dossier.scores[id] = {
      valeur: String(valeur).trim(),
      outil: String(outil).trim(),
      version: version ? String(version).trim() : '',
      auteur: String(auteur).trim(),
      origine: 'saisie manuelle',
      date: new Date().toISOString()
    };
    return dossier.scores[id];
  },

  retirer(dossier, id) {
    if (dossier.scores) delete dossier.scores[id];
  },

  /* Un score sans provenance complète n'est pas restitué. */
  lire(dossier, id) {
    const s = (dossier.scores || {})[id];
    if (!s) return null;
    if (!s.outil || !s.auteur || !s.date) return null;
    return s;
  }
};

/* =====================================================================
   APPEL DU COMPOSANT — À IMPLÉMENTER À LA CONNEXION

   Forme attendue, à adapter au contrat d'interface de l'éditeur :

     return fetch(COMPOSANT.endpoint + '/' + inst.id, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': '…' },
       body: JSON.stringify({ instrument: inst.id, entrees: charge })
     })
     .then(r => r.json())
     .then(r => ({
       disponible: true,
       valeur: r.score,
       provenance: {
         outil: COMPOSANT.nom, version: COMPOSANT.version,
         classe: COMPOSANT.classe, organismeNotifie: COMPOSANT.organismeNotifie,
         udiDi: COMPOSANT.udiDi, origine: 'composant certifié',
         date: new Date().toISOString()
       }
     }));

   Trois exigences à respecter dans cette implémentation :
     - journaliser l'appel, la version du composant et l'horodatage ;
     - en cas d'échec réseau, renvoyer une indisponibilité, jamais une
       valeur de repli calculée ici ;
     - ne jamais transformer la valeur renvoyée par le composant.
   ===================================================================== */
function appelerComposant(inst, charge) {
  return Promise.resolve({
    disponible: false,
    motif: 'Interface non implémentée. Renseigner COMPOSANT puis écrire appelerComposant().'
  });
}

window.Calculateur = Calculateur;
