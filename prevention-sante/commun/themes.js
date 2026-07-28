/* =====================================================================
   THÈMES DU TABLEAU DE BORD DE SUIVI
   Cinq apparences pour un seul contenu. Servent à arbitrer une direction
   graphique en la voyant, plutôt qu'en la décrivant.

   CE QUI CHANGE, CE QUI NE CHANGE JAMAIS
   Un thème change des couleurs, des tailles, des espacements, une
   densité. Il ne change aucun texte, aucun chiffre, aucune donnée, et il
   ne fait apparaître ni disparaître aucune information. Basculer d'un
   thème à l'autre ne modifie donc rien de ce que la personne apprend :
   c'est la condition pour que le choix reste purement esthétique.

   POURQUOI LES TEINTES SONT ICI ET PAS DANS biologie.js
   biologie.js est la source médicale : la liste des familles d'analyses
   y est définie une fois pour toutes, et c'est elle qui fait autorité.
   La teinte associée à une famille est en revanche de la présentation.
   Elle vit donc ici, dans un seul fichier, pour la même raison que la
   liste vit là-bas dans un seul fichier : pour qu'on ne puisse pas la
   redéfinir dans un coin.

   LA RÈGLE QUE LES CINQ THÈMES RESPECTENT
   La couleur d'une courbe désigne une FAMILLE D'ANALYSES. Elle ne dit
   jamais si un résultat est bon ou mauvais. Les seules couleurs
   évaluatives de la page sont les marques posées par le médecin, et
   elles sont reconnaissables autrement que par leur teinte : elles
   portent une initiale, un nom de médecin et une date.

   Conséquence sur les palettes : dans chaque thème, les six familles
   reçoivent six teintes distinctes, et aucune ne reprend exactement une
   couleur de marque. Un thème peut être vif ; il ne peut pas être
   ambigu. Le vérificateur contrôle les deux points.
   ===================================================================== */

var THEMES = {

  /* Les six familles, dans l'ordre de biologie.js. Toute palette doit
     couvrir exactement ces clés — ni plus, ni moins. */
  familles: ['Numération', 'Métabolique', 'Rénal', 'Hormonal', 'Hépatique',
             'Mesuré sur place'],

  /* Les trois teintes réservées aux marques du médecin. Interdites aux
     palettes de familles : une famille qui les reprendrait rendrait la
     distinction impossible à l'œil. */
  reservees: ['#0f766e', '#b45309', '#a52222'],

  liste: [
    {
      id: 'sobre',
      nom: 'Sobre',
      resume: 'La version actuelle',
      desc: 'Fond clair, palette bleutée, densité élevée. Fait sérieux, se lit vite ' +
            'quand on est habitué, demande un peu d’effort la première fois.',
      /* Palette d'origine : dégradé du bleu-vert au violet. Six teintes
         voisines, volontairement peu contrastées entre elles, pour que
         la couleur classe sans attirer l'œil. */
      palette: {
        'Numération': '#0f5f6b',
        'Métabolique': '#1a6f8c',
        'Rénal': '#2a5f9c',
        'Hormonal': '#41529b',
        'Hépatique': '#57488f',
        'Mesuré sur place': '#6b4382'
      }
    },

    {
      id: 'vitamine',
      nom: 'Vitaminé',
      resume: 'Couleurs franches',
      desc: 'Palette large et saturée, cartes contrastées, grands arrondis, fond crème. ' +
            'L’esprit d’une application grand public. Les six familles se distinguent ' +
            'd’un coup d’œil, ce qui est son vrai avantage sur le thème sobre.',
      /* Cyan → rose, en évitant le rouge, l'orange et le vert : ce sont
         les trois familles de teintes des marques du médecin. */
      palette: {
        'Numération': '#0891b2',
        'Métabolique': '#0284c7',
        'Rénal': '#4338ca',
        'Hormonal': '#9333ea',
        'Hépatique': '#c026d3',
        'Mesuré sur place': '#db2777'
      }
    },

    {
      id: 'epure',
      nom: 'Épuré',
      resume: 'Gros texte, une colonne',
      desc: 'Texte nettement plus grand, une seule colonne, beaucoup d’air, teintes ' +
            'assourdies. Pensé pour une lecture lente, sur téléphone, ou pour quelqu’un ' +
            'qui n’a pas envie de déchiffrer une interface. La page est plus longue : ' +
            'c’est le prix de la respiration.',
      palette: {
        'Numération': '#3f6b74',
        'Métabolique': '#3a5f80',
        'Rénal': '#44547f',
        'Hormonal': '#4f4a78',
        'Hépatique': '#5b466e',
        'Mesuré sur place': '#5f4560'
      }
    },

    {
      id: 'nuit',
      nom: 'Cockpit',
      resume: 'Fond sombre',
      desc: 'Fond sombre, courbes lumineuses, chiffres en gros. Très confortable le soir ' +
            'et sur écran lumineux. Réserve : un fond sombre donne un aspect technique, ' +
            'qui va bien à un pilote et moins bien à quelqu’un d’inquiet.',
      palette: {
        'Numération': '#22d3ee',
        'Métabolique': '#38bdf8',
        'Rénal': '#60a5fa',
        'Hormonal': '#818cf8',
        'Hépatique': '#c084fc',
        'Mesuré sur place': '#e879f9'
      }
    },

    {
      id: 'editorial',
      nom: 'Éditorial',
      resume: 'Le texte d’abord',
      desc: 'Titres en serif, colonnes de lecture étroites, graphiques discrets, fond ' +
            'papier. Met les explications au premier plan et les chiffres au second. ' +
            'À choisir si le but est qu’on comprenne, plutôt qu’on surveille.',
      palette: {
        'Numération': '#1f5b63',
        'Métabolique': '#28536b',
        'Rénal': '#2f4b6e',
        'Hormonal': '#3d4468',
        'Hépatique': '#4a3d5f',
        'Mesuré sur place': '#553a54'
      }
    }
  ],

  /* Thème affiché au chargement. */
  defaut: 'sobre',

  trouver: function (id) {
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].id === id) return this.liste[i];
    }
    return this.liste[0];
  },

  /* Teinte d'une famille dans un thème. Ne reçoit qu'un nom de famille :
     aucune valeur mesurée n'entre ici, donc aucune teinte ne peut
     dépendre d'un résultat. */
  teinte: function (idTheme, nomFamille) {
    var t = this.trouver(idTheme);
    return t.palette[nomFamille] || null;
  }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = THEMES; }
