/* =====================================================================
   AVIS DU MÉDECIN PAR DOMAINE

   CE FICHIER EST LA RÉPONSE À LA MAQUETTE v0.
   La maquette affichait, sur chaque domaine, une pastille « Dans les
   valeurs usuelles » ou « À surveiller » et une phrase de synthèse. Le
   rendu est excellent et il est conservé tel quel. Ce qui change est
   l'origine : dans la maquette, le statut était un attribut de la
   donnée, produit par personne. Ici, c'est un acte du médecin — il
   clique, il écrit, ça porte son nom et la date.

   La différence ne se voit pas à l'écran. C'est précisément pour cela
   qu'elle doit être verrouillée dans le code : rien, visuellement,
   n'empêcherait de rebrancher ces pastilles sur un calcul.

   TROIS CONDITIONS, SANS VALEUR DE REPLI
     - un statut choisi explicitement ; aucun défaut n'est prévu ;
     - un auteur nommé ; une pastille anonyme serait indistinguable
       d'un signalement automatique ;
     - une date.
   Un avis incomplet n'est pas restitué. Il n'est pas affiché en gris,
   il n'est pas affiché du tout : un demi-avis serait lu comme un avis.

   DEUX NIVEAUX, UNE SEULE ÉCHELLE DE TEINTES
   Une MARQUE (commun/biologie.js) porte sur une valeur à une date
   précise. Un AVIS porte sur un domaine entier, à un moment donné.
   Les deux emploient les trois mêmes teintes, parce que multiplier les
   échelles serait le meilleur moyen de n'en faire comprendre aucune.

   CE QUE CE FICHIER NE CONTIENT PAS
   Aucune valeur mesurée, aucun intervalle de référence, aucune règle.
   Les fonctions ne reçoivent qu'un identifiant de domaine et ce que le
   médecin a saisi : il n'y a rien ici avec quoi comparer quoi que ce
   soit.
   ===================================================================== */

var AVIS_STATUTS = [
  /* Libellés repris mot pour mot de la maquette v0 : ils sont bien
     écrits, non alarmistes, et renvoient au médecin plutôt qu'à un
     verdict. « À interpréter avec votre médecin » vaut mieux que
     « anormal », qui n'apprend rien et inquiète. */
  { v: 'usuelles',    l: 'Dans les valeurs usuelles',        teinte: '#0f766e' },
  { v: 'surveiller',  l: 'À surveiller',                     teinte: '#b45309' },
  { v: 'interpreter', l: 'À interpréter avec votre médecin', teinte: '#a52222' }
];

var Avis = {

  statuts: function () { return AVIS_STATUTS.slice(); },

  statut: function (v) {
    for (var i = 0; i < AVIS_STATUTS.length; i++) {
      if (AVIS_STATUTS[i].v === v) return AVIS_STATUTS[i];
    }
    return null;
  },

  /* ------------------------------------------------------------------
     POSE D'UN AVIS
     Statut et auteur obligatoires, sans valeur de repli : il est donc
     techniquement impossible d'obtenir un avis par défaut ou anonyme.
     La synthèse est facultative — un médecin peut vouloir qualifier un
     domaine sans commenter — mais jamais l'auteur.
  ------------------------------------------------------------------- */
  poser: function (dossier, domaineId, statut, synthese, medecin) {
    if (!domaineId) throw new Error('Aucun domaine visé.');
    if (!statut) throw new Error('Aucun statut choisi : le médecin doit choisir explicitement.');
    if (!this.statut(statut)) throw new Error('Statut non admis : ' + statut);
    if (!medecin) throw new Error('Aucun auteur : un avis non signé serait indistinguable d’un signalement automatique.');

    if (!dossier.avisDomaines) dossier.avisDomaines = {};
    dossier.avisDomaines[domaineId] = {
      domaine: domaineId,
      statut: statut,
      synthese: (synthese || '').trim(),
      medecin: medecin,
      date: new Date().toISOString().slice(0, 10)
    };
    return dossier.avisDomaines[domaineId];
  },

  retirer: function (dossier, domaineId) {
    if (dossier.avisDomaines) delete dossier.avisDomaines[domaineId];
  },

  /* Lecture. Le contrôle de complétude est ici, en un seul endroit :
     tout affichage passe par cette fonction. */
  lire: function (dossier, domaineId) {
    if (!dossier || !dossier.avisDomaines) return null;
    var a = dossier.avisDomaines[domaineId];
    if (!a) return null;
    if (!a.statut || !a.medecin || !a.date) return null;
    if (!this.statut(a.statut)) return null;
    return a;
  },

  compte: function (dossier) {
    if (!dossier || !dossier.avisDomaines) return 0;
    var n = 0, self = this;
    Object.keys(dossier.avisDomaines).forEach(function (k) {
      if (self.lire(dossier, k)) n++;
    });
    return n;
  }
};

if (typeof window !== 'undefined') {
  window.AVIS_STATUTS = AVIS_STATUTS;
  window.Avis = Avis;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AVIS_STATUTS: AVIS_STATUTS, Avis: Avis };
}
