/* =====================================================================
   DOMAINES DE SANTÉ — L'ORGANISATION VUE PAR LA PERSONNE

   Reprise de la maquette v0.app, et c'est un progrès réel sur ce qui
   existait. Le suivi était organisé par FAMILLE D'ANALYSES — Numération,
   Métabolique, Rénal, Hépatique — c'est-à-dire par la logique du
   laboratoire. Une personne ne pense pas « famille hépatique », elle
   pense « mon foie ». Les seize domaines ci-dessous sont cette
   organisation-là.

   CE QUI NE CHANGE PAS. Les six familles biologiques restent dans
   plateforme/biologie.js et continuent de faire autorité pour classer une
   analyse. Les domaines se superposent, ils ne remplacent rien : un
   paramètre appartient à une famille (technique) et à un domaine
   (compréhensible). Rien n'est retiré, une lecture est ajoutée.

   POURQUOI HUIT DOMAINES N'ONT AUCUN PARAMÈTRE BIOLOGIQUE
   Respiration, Sommeil, Vision, Audition, Peau, Dépistage, Inflammation,
   Santé osseuse existent dans le questionnaire ou le parcours sans
   donner de chiffre de laboratoire. Ils sont affichés quand même, en
   attente : un domaine absent de l'écran est un domaine dont la personne
   ignore qu'il a été abordé.

   LES ILLUSTRATIONS DE v0 NE SONT PAS REPRISES
   Le zip contient seize images générées, 7,4 Mo, sans auteur ni licence
   documentés. La discipline de commun/visuels.js exige un auteur
   identifié pour toute image publiée. Les cartes utilisent donc un aplat
   de la couleur du domaine et son pictogramme — la structure de carte
   porte l'esthétique, pas la photographie. À rouvrir si la licence des
   images est établie.

   LES COULEURS DE DOMAINE NE SONT PAS DES COULEURS D'ÉTAT
   Chaque domaine a sa teinte, reprise de v0. Elle identifie le domaine,
   exactement comme la teinte de famille identifiait la famille. Elle ne
   dit jamais si quelque chose va bien ou mal. Les seules teintes
   évaluatives restent celles des avis du médecin, dans commun/avis.js.
   Le vérificateur contrôle qu'aucune couleur de domaine ne reprend une
   couleur d'état.
   ===================================================================== */

var DOMAINES = {

  /* Les trois teintes réservées aux avis du médecin. Interdites ici. */
  reservees: ['#0f766e', '#b45309', '#a52222'],

  liste: [
    { id: 'cardiovasculaire', nom: 'Cardiovasculaire', couleur: '#e8503a',
      clair: 'Votre cœur et vos artères', icone: 'i-heart',
      parametres: ['chol', 'hdl', 'tg', 'pas'] },

    { id: 'metabolisme', nom: 'Métabolisme', couleur: '#f08a2c',
      clair: 'La façon dont votre corps gère le sucre et l’énergie', icone: 'i-activity',
      parametres: ['gly'] },

    { id: 'hematologie', nom: 'Hématologie', couleur: '#d8455f',
      clair: 'Votre sang et vos réserves en fer', icone: 'i-flask',
      parametres: ['hb', 'ferr'] },

    { id: 'foie', nom: 'Foie', couleur: '#2f9d63',
      clair: 'Votre foie, le filtre de l’organisme', icone: 'i-shield',
      parametres: ['alat'] },

    { id: 'rein', nom: 'Rein', couleur: '#2f92d6',
      clair: 'Vos reins, qui filtrent le sang', icone: 'i-flask',
      parametres: ['creat'] },

    { id: 'thyroide', nom: 'Thyroïde', couleur: '#12a594',
      clair: 'La glande qui règle votre énergie', icone: 'i-sun',
      parametres: ['tsh'] },

    { id: 'nutrition', nom: 'Nutrition', couleur: '#eaa11f',
      clair: 'Vos vitamines et votre alimentation', icone: 'i-sun',
      parametres: ['vitd'] },

    { id: 'condition-physique', nom: 'Condition physique', couleur: '#7a5cc4',
      clair: 'Votre poids et votre forme au fil du temps', icone: 'i-activity',
      parametres: ['poids'] },

    /* Domaines abordés au questionnaire ou en consultation, sans chiffre
       de laboratoire. Affichés en attente plutôt que masqués. */
    { id: 'respiration', nom: 'Respiration', couleur: '#2aa6b8',
      clair: 'Vos poumons et votre souffle', icone: 'i-lungs', parametres: [] },

    { id: 'sommeil', nom: 'Sommeil', couleur: '#4a70cf',
      clair: 'La qualité de votre sommeil', icone: 'i-moon', parametres: [] },

    { id: 'inflammation', nom: 'Inflammation', couleur: '#ee6a44',
      clair: 'Les signes d’inflammation dans le corps', icone: 'i-flask', parametres: [] },

    { id: 'osseuse', nom: 'Santé osseuse', couleur: '#78993a',
      clair: 'La solidité de vos os', icone: 'i-shield', parametres: [] },

    { id: 'vision', nom: 'Vision', couleur: '#3d7fc1',
      clair: 'Votre vue', icone: 'i-eye', parametres: [] },

    { id: 'audition', nom: 'Audition', couleur: '#159485',
      clair: 'Votre audition', icone: 'i-ear', parametres: [] },

    { id: 'peau', nom: 'Peau', couleur: '#e0894e',
      clair: 'Votre peau et vos grains de beauté', icone: 'i-sun', parametres: [] },

    { id: 'depistage', nom: 'Dépistage des cancers', couleur: '#d1567f',
      clair: 'Le dépistage précoce des cancers', icone: 'i-shield', parametres: [] }
  ],

  trouver: function (id) {
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].id === id) return this.liste[i];
    }
    return null;
  },

  /* Domaine auquel appartient un paramètre. Rattachement documentaire,
     défini une fois ici : aucune règle ne le déduit d'une valeur. */
  duParametre: function (paramId) {
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].parametres.indexOf(paramId) !== -1) return this.liste[i];
    }
    return null;
  }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = DOMAINES; }
