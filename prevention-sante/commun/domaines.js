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

   LE NOM D'UN DOMAINE EST CELUI DE SA SPÉCIALITÉ

   Le menu disait « Dermatologie » et la page d'à côté « Peau ». Le menu
   disait « Ophtalmologie » et la page « Vision ». Deux mots pour la même
   chose, à deux endroits de la même interface : la personne se demande
   si elle a cliqué au bon endroit.

   Chaque domaine porte donc désormais UN seul nom, celui de sa
   spécialité — c'est celui qu'elle verra sur son ordonnance, sur son
   compte rendu et sur la plaque du praticien. Et parce qu'un nom de
   spécialité ne dit rien à qui n'est pas soignant, il est suivi de deux
   textes :

     clair    — une ligne qui nomme les organes concernés, sans jargon ;
     explique — deux ou trois phrases sur ce que la spécialité regarde
                dans un bilan de prévention, et pourquoi.

   Ces textes décrivent la spécialité, jamais la personne. Aucun ne
   change selon un résultat : c'est la même règle que pour le lexique, et
   le vérificateur la contrôle ici aussi.

   Le nom du menu latéral n'est plus écrit à la main dans suivi.js : il
   est lu ici. Deux libellés ne peuvent donc plus diverger.
   ===================================================================== */

var DOMAINES = {

  /* Les trois teintes réservées aux avis du médecin. Interdites ici. */
  reservees: ['#0f766e', '#b45309', '#a52222'],

  liste: [
    { id: 'cardiovasculaire', nom: 'Cardiologie', couleur: '#e8503a', icone: 'i-heart',
      clair: 'Le cœur, les artères et la tension',
      explique: 'La cardiologie s’occupe du cœur et des vaisseaux qui partent de lui. Dans un ' +
        'bilan de prévention, on regarde la tension artérielle, les graisses qui circulent ' +
        'dans le sang et, selon les cas, un tracé électrique du cœur. Aucun de ces éléments ' +
        'ne se lit seul : c’est leur combinaison avec l’âge, le tabac et les antécédents ' +
        'familiaux qui intéresse le médecin.',
      parametres: ['chol', 'hdl', 'tg', 'pas'] },

    { id: 'metabolisme', nom: 'Diabète et métabolisme', couleur: '#f08a2c', icone: 'i-activity',
      clair: 'Le sucre et l’énergie dans le sang',
      explique: 'Le métabolisme désigne la façon dont le corps transforme ce qu’il reçoit en ' +
        'énergie. On le regarde surtout à travers le sucre présent dans le sang après une ' +
        'nuit sans manger. Cette mesure varie d’un jour à l’autre, ce qui explique qu’un ' +
        'chiffre isolé ne suffise jamais à conclure quoi que ce soit.',
      parametres: ['gly'] },

    { id: 'hematologie', nom: 'Hématologie', couleur: '#d8455f', icone: 'i-flask',
      clair: 'Le sang, les globules et les réserves en fer',
      explique: 'L’hématologie est la spécialité du sang. Un bilan y regarde le transport de ' +
        'l’oxygène, assuré par l’hémoglobine, et les réserves en fer, mesurées par la ' +
        'ferritine. Ces deux mesures ne varient pas ensemble : les réserves peuvent baisser ' +
        'longtemps avant que le transport de l’oxygène ne s’en ressente.',
      parametres: ['hb', 'ferr'] },

    { id: 'foie', nom: 'Hépatologie', couleur: '#2f9d63', icone: 'i-shield',
      clair: 'Le foie et les voies biliaires',
      explique: 'L’hépatologie s’occupe du foie, l’organe qui transforme et qui filtre. Le ' +
        'foie ne fait pas mal : il travaille en silence, y compris quand il est gêné. C’est ' +
        'pour cela qu’on suit dans le sang des enzymes qui en proviennent, dont le taux ' +
        'monte quand des cellules du foie sont abîmées, pour beaucoup de raisons possibles.',
      parametres: ['alat'] },

    { id: 'rein', nom: 'Néphrologie', couleur: '#2f92d6', icone: 'i-flask',
      clair: 'Les reins et le filtrage du sang',
      explique: 'La néphrologie est la spécialité des reins. Leur travail est d’éliminer ce ' +
        'dont le corps n’a plus besoin, et de régler la quantité d’eau et de sel. On les ' +
        'suit par la créatinine, un déchet produit par les muscles que les reins évacuent. ' +
        'Sa valeur dépend donc aussi de la masse musculaire, et pas seulement des reins.',
      parametres: ['creat'] },

    { id: 'thyroide', nom: 'Thyroïde et hormones', couleur: '#12a594', icone: 'i-sun',
      clair: 'La glande qui règle le rythme du corps',
      explique: 'La thyroïde est une petite glande située à la base du cou. Elle produit des ' +
        'hormones qui règlent la vitesse à laquelle le corps fonctionne : le rythme du cœur, ' +
        'la température, le transit, l’humeur. On la surveille par la TSH, qui est l’ordre ' +
        'envoyé à la thyroïde par le cerveau, et non la réponse de la thyroïde elle-même.',
      parametres: ['tsh'] },

    { id: 'nutrition', nom: 'Nutrition', couleur: '#eaa11f', icone: 'i-sun',
      clair: 'L’alimentation, les vitamines et les minéraux',
      explique: 'La nutrition ne se résume pas à ce qu’on mange : elle concerne ce que le ' +
        'corps parvient à en tirer. Le bilan regarde notamment la vitamine D, que la peau ' +
        'fabrique au soleil et dont le taux dépend fortement de la saison et de la latitude. ' +
        'Un dosage fait en février et un dosage fait en août ne racontent pas la même chose.',
      parametres: ['vitd'] },

    { id: 'condition-physique', nom: 'Condition physique', couleur: '#7a5cc4', icone: 'i-activity',
      clair: 'Le poids, la force et l’endurance',
      explique: 'La condition physique est ce que le corps sait faire à l’effort. On la suit ' +
        'par le poids, mais surtout par sa trajectoire sur plusieurs années : le chiffre d’un ' +
        'jour dépend de l’heure, du repas et de l’hydratation. L’activité physique est, avec ' +
        'l’arrêt du tabac, ce qui a le plus d’effet démontré en prévention.',
      parametres: ['poids'] },

    /* Domaines abordés au questionnaire ou en consultation, sans chiffre
       de laboratoire. Affichés en attente plutôt que masqués. */
    { id: 'respiration', nom: 'Pneumologie', couleur: '#2aa6b8', icone: 'i-lungs',
      clair: 'Les poumons, les bronches et le souffle',
      explique: 'La pneumologie s’occupe des poumons et des bronches. Le souffle se mesure ' +
        'par une spirométrie : on inspire à fond, puis on souffle le plus fort et le plus ' +
        'longtemps possible. L’examen dépend de la façon dont il est réalisé, ce qui explique ' +
        'qu’on le répète plusieurs fois — un mauvais souffle donne un résultat sans valeur.',
      parametres: [] },

    { id: 'sommeil', nom: 'Médecine du sommeil', couleur: '#4a70cf', icone: 'i-moon',
      clair: 'La durée et la qualité du sommeil',
      explique: 'La médecine du sommeil s’intéresse autant à la durée qu’à la qualité des ' +
        'nuits. En prévention, on cherche surtout deux choses : un sommeil trop court de ' +
        'façon durable, et les ronflements avec pauses respiratoires, qui se repèrent par ' +
        'des questions simples avant tout examen. Le ressenti au réveil compte autant que ' +
        'le nombre d’heures.',
      parametres: [] },

    { id: 'inflammation', nom: 'Inflammation', couleur: '#ee6a44', icone: 'i-flask',
      clair: 'Les marqueurs d’une réaction de l’organisme',
      explique: 'L’inflammation est la réaction normale du corps à une agression : une ' +
        'infection, une blessure, parfois une maladie chronique. Certains marqueurs sanguins ' +
        'montent lorsqu’elle est en cours. Ils disent qu’il se passe quelque chose, jamais ' +
        'quoi : un rhume de la semaine passée suffit à les faire varier.',
      parametres: [] },

    { id: 'osseuse', nom: 'Os et articulations', couleur: '#78993a', icone: 'i-shield',
      clair: 'La solidité des os, le calcium, la vitamine D',
      explique: 'L’os est un tissu vivant, qui se renouvelle toute la vie. Sa solidité dépend ' +
        'du calcium, de la vitamine D et de l’activité physique en charge — marcher, porter, ' +
        'monter. La perte de solidité ne provoque aucun symptôme avant la fracture, ce qui ' +
        'est précisément la raison d’en parler en prévention.',
      parametres: [] },

    { id: 'vision', nom: 'Ophtalmologie', couleur: '#3d7fc1', icone: 'i-eye',
      clair: 'Les yeux, la vue et la pression oculaire',
      explique: 'L’ophtalmologie est la spécialité de l’œil. Un examen de prévention mesure ' +
        'la vue de loin et de près, et souvent la pression à l’intérieur de l’œil. Cette ' +
        'pression compte parce qu’une pression élevée peut abîmer le nerf optique sans que ' +
        'la personne s’en aperçoive : la vision centrale reste bonne jusqu’à un stade avancé.',
      parametres: [] },

    { id: 'audition', nom: 'ORL et audition', couleur: '#159485', icone: 'i-ear',
      clair: 'L’oreille, l’audition et l’équilibre',
      explique: 'L’ORL — oto-rhino-laryngologie — s’occupe de l’oreille, du nez et de la ' +
        'gorge. Côté audition, la perte est presque toujours progressive et symétrique : on ' +
        's’y habitue, et ce sont souvent les proches qui la remarquent d’abord. Elle se ' +
        'repère par un audiogramme, qui mesure ce qu’on entend à chaque fréquence.',
      parametres: [] },

    { id: 'peau', nom: 'Dermatologie', couleur: '#e0894e', icone: 'i-sun',
      clair: 'La peau, les grains de beauté, les ongles et les cheveux',
      explique: 'La dermatologie est la spécialité de la peau, et aussi des ongles et des ' +
        'cheveux. Dans un bilan, l’examen cherche surtout les grains de beauté qui ont changé ' +
        'de taille, de forme ou de couleur, et les lésions qui ne guérissent pas. La peau est ' +
        'le seul organe qu’on peut examiner entièrement à l’œil nu : c’est ce qui rend cet ' +
        'examen simple, rapide et utile.',
      parametres: [] },

    { id: 'depistage', nom: 'Dépistage des cancers', couleur: '#d1567f', icone: 'i-shield',
      clair: 'Les examens de repérage des programmes nationaux',
      explique: 'Le dépistage consiste à chercher quelque chose chez une personne qui n’a ' +
        'aucun symptôme. Il n’est organisé que pour quelques cancers, ceux pour lesquels ' +
        'trouver plus tôt change vraiment la suite. Il a aussi des inconvénients — fausses ' +
        'alertes, examens inutiles — qui sont écrits noir sur blanc dans ce dossier, parce ' +
        'qu’un dépistage n’est pas une obligation mais une décision qui vous appartient.',
      parametres: [] }
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
