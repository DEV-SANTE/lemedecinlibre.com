/* =====================================================================
   LEXIQUE — EXPLIQUER CHAQUE MESURE ET CHAQUE ACTE
   Destiné à des personnes qui ne sont pas professionnelles de santé.

   LA RÈGLE QUI TIENT TOUT LE FICHIER
   Chaque texte est attaché à UNE MESURE ou à UN ACTE, jamais à la valeur
   d'une personne. Le texte affiché pour « Glycémie à jeun » est le même
   pour tout le monde, quelle que soit la valeur mesurée. Personne ne lit
   ici quelque chose de particulier sur son propre cas.

   Ce n'est pas une précaution de façade, c'est la frontière entre un
   contenu éducatif et un dispositif médical. Un texte qui change selon
   la valeur — même un seul, même prudent — devient une interprétation
   destinée à une personne identifiée, produite par le logiciel. C'est
   exactement ce que la version 1 ne fait pas.

   TROIS INTERDITS, VÉRIFIÉS AUTOMATIQUEMENT
   1. Aucun seuil chiffré dans une unité biologique. Écrire un chiffre
      suivi de « g/L » fournirait au lecteur de quoi se juger lui-même,
      ce qui reviendrait à déplacer l'interprétation sans l'assumer.
      Les intervalles de référence figurent sur le compte rendu du
      laboratoire, qui les publie avec ses propres méthodes de mesure.
   2. Aucune affirmation sur le lecteur : ni « votre taux », ni « vous
      avez », ni « votre risque ». Le « vous » n'est employé que pour
      décrire ce qui se passe pendant un acte, ou ce qu'il faut faire
      avant.
   3. Aucun texte choisi en fonction d'une valeur. Le code d'affichage
      ne connaît que l'identifiant du paramètre.

   CE QUE CHAQUE ENTRÉE CONTIENT
     resume   — une phrase, pour la vignette
     quoi     — de quoi il s'agit, en langage courant
     pourquoi — la raison de la mesure
     comment  — comment elle est obtenue, et ce qu'il faut faire avant
     varie    — ce qui la déplace sans que rien n'aille mal
     limites  — ce que cette mesure ne dit pas
     unite    — ce que veut dire l'unité écrite sur le compte rendu

   « varie » et « limites » ne sont pas des rubriques de modestie. Ce
   sont les deux qui évitent les conclusions hâtives, et donc les deux
   qui manquent presque toujours ailleurs.

   RELECTURE MÉDICALE : ces textes sont rédigés comme un brouillon. Ils
   doivent être relus et signés par un médecin référent avant toute mise
   en service, et cette relecture doit être tracée.
   ===================================================================== */

var LEXIQUE = {

  /* ==================================================================
     COMMENT LIRE LA PAGE — affiché en tête du tableau de bord
  ================================================================== */
  intro: {
    titre: 'Comment lire cette page',
    paragraphes: [
      'Cette page rassemble ce qui a été mesuré chez vous au fil des visites, ' +
      'dans l\'ordre où ça a été mesuré. Elle affiche les chiffres tels que le ' +
      'laboratoire les a transmis, sans les retoucher, sans les résumer et sans ' +
      'les trier.',

      'Elle ne vous dit pas si un chiffre est bon ou mauvais. Ce n\'est pas un ' +
      'oubli. Un même chiffre peut être parfaitement banal chez une personne et ' +
      'mériter un examen chez une autre, selon son âge, son histoire, ses ' +
      'traitements, et ce qu\'elle ressent. Cette lecture-là demande un médecin, ' +
      'et elle se fait avec lui.',

      'En revanche, tout ce qui peut être expliqué à l\'avance l\'est. Sous chaque ' +
      'mesure, vous trouverez de quoi il s\'agit, pourquoi elle est faite, comment ' +
      'elle est obtenue, ce qui la fait bouger sans que rien n\'aille mal, et ce ' +
      'qu\'elle ne dit pas. Ces explications sont les mêmes pour tout le monde : ' +
      'elles décrivent la mesure, et non ce qui a été mesuré chez vous.',

      'Une chose à savoir avant de regarder les courbes : deux prélèvements faits ' +
      'le même jour, dans le même laboratoire, ne donnent jamais exactement le même ' +
      'chiffre. Une petite variation d\'un relevé au suivant est donc attendue et ' +
      'ne veut rien dire en soi. C\'est la direction sur plusieurs années, mise en ' +
      'regard de votre situation, qui intéresse le médecin.'
    ]
  },

  /* ==================================================================
     LES DOUZE MESURES
     Une entrée par identifiant de commun/biologie.js. Le vérificateur
     refuse qu'un paramètre existe sans explication, et qu'une
     explication existe sans paramètre.
  ================================================================== */
  parametres: {

    hb: {
      resume: 'Transporte l’oxygène dans le sang.',
      quoi: 'L’hémoglobine est la protéine contenue dans les globules rouges. C’est elle ' +
            'qui capte l’oxygène dans les poumons et le distribue à tous les organes. C’est ' +
            'aussi elle qui donne au sang sa couleur rouge.',
      pourquoi: 'C’est la mesure de référence pour repérer une anémie, c’est-à-dire une ' +
            'capacité de transport de l’oxygène réduite. L’anémie se traduit souvent par de ' +
            'la fatigue, un essoufflement à l’effort, une pâleur — des signes assez communs ' +
            'pour être mis sur le compte d’autre chose, ce qui explique qu’on la mesure.',
      comment: 'Une prise de sang ordinaire, dans le cadre d’une numération. Il n’est pas ' +
            'nécessaire d’être à jeun pour cette mesure précise.',
      varie: 'Le fait de vivre en altitude l’augmente durablement. Le tabac aussi. Une ' +
            'déshydratation la fait paraître plus haute, une hydratation abondante plus ' +
            'basse, sans que la quantité réelle change. Un don du sang récent, une grossesse, ' +
            'les règles la déplacent également.',
      limites: 'Elle ne dit jamais pourquoi. Un manque de fer, un saignement, une maladie ' +
            'chronique, une carence en vitamine B12 peuvent conduire à des chiffres très ' +
            'proches. C’est la raison pour laquelle elle est lue avec la ferritine et le ' +
            'reste de la numération, et pas seule.',
      unite: 'g/dL se lit « grammes par décilitre » : la masse d’hémoglobine contenue dans ' +
            'un dixième de litre de sang.'
    },

    ferr: {
      resume: 'Reflète les réserves de fer.',
      quoi: 'La ferritine est la protéine dans laquelle le corps stocke le fer, un peu comme ' +
            'un garde-manger. Son taux dans le sang donne une idée de l’état de ce stock.',
      pourquoi: 'Parce que les réserves s’épuisent avant que l’hémoglobine ne baisse. Un stock ' +
            'qui diminue se voit donc plus tôt sur la ferritine que sur la numération, ce qui ' +
            'laisse le temps de chercher la cause avant l’apparition d’une anémie.',
      comment: 'Prise de sang, sans nécessité d’être à jeun.',
      varie: 'C’est son principal piège : la ferritine monte aussi lors d’une inflammation ou ' +
            'd’une infection, même banale, indépendamment du fer. Un rhume la semaine du ' +
            'prélèvement peut suffire. Elle augmente aussi avec la consommation d’alcool et ' +
            'certaines maladies du foie.',
      limites: 'Prise isolément, elle peut donner une image trompeuse dans les deux sens : ' +
            'rassurante alors que le fer manque, inquiétante alors que tout va bien. Le médecin ' +
            'la lit donc avec d’autres marqueurs, et avec ce que la personne raconte.',
      unite: 'µg/L se lit « microgrammes par litre ». Un microgramme est un millionième de ' +
            'gramme : les quantités en jeu sont minuscules.'
    },

    gly: {
      resume: 'Le sucre présent dans le sang après une nuit sans manger.',
      quoi: 'Le glucose est le carburant principal des cellules. Il circule dans le sang, et ' +
            'une hormone, l’insuline, lui ouvre la porte des cellules. Quand ce mécanisme se ' +
            'dérègle, le glucose reste dans le sang au lieu d’y entrer.',
      pourquoi: 'C’est l’examen de repérage du diabète et de ce qui le précède souvent de ' +
            'plusieurs années. Le diabète de type 2 s’installe sans se faire sentir : c’est ' +
            'précisément le genre de situation pour laquelle une mesure a du sens même quand ' +
            'on se sent bien.',
      comment: 'Prise de sang après une nuit sans manger — un jeûne d’au moins huit heures, ' +
            'en général le matin. L’eau est autorisée et même conseillée. Le café, le thé ' +
            'sucré, un bonbon, un jus, une cigarette avant le prélèvement modifient le ' +
            'résultat : mieux vaut décaler le rendez-vous que fausser la mesure.',
      varie: 'Une nuit très courte, un stress important, une infection en cours, une ' +
            'corticothérapie la déplacent. Un jeûne insuffisant ou au contraire beaucoup plus ' +
            'long que prévu la déplacent aussi.',
      limites: 'Une mesure unique ne permet pas de poser un diagnostic de diabète. Quand elle ' +
            'attire l’attention, elle est confirmée, et souvent complétée par une autre analyse ' +
            'qui reflète les mois précédents plutôt qu’un matin donné.',
      unite: 'g/L se lit « grammes par litre ». Certains laboratoires et la plupart des pays ' +
            'voisins expriment la même chose en mmol/L : les chiffres n’ont alors rien à voir, ' +
            'alors que la réalité mesurée est identique. C’est une raison de conserver les ' +
            'comptes rendus d’origine.'
    },

    chol: {
      resume: 'La somme des transporteurs de cholestérol.',
      quoi: 'Le cholestérol est une graisse indispensable : le corps s’en sert pour construire ' +
            'la paroi de ses cellules et fabriquer certaines hormones et la vitamine D. Le foie ' +
            'en produit la plus grande part, l’alimentation en apporte le reste. Comme il ne se ' +
            'dissout pas dans le sang, il voyage dans des transporteurs.',
      pourquoi: 'Le cholestérol total additionne tous ces transporteurs. Il donne un ordre de ' +
            'grandeur simple à obtenir, utile comme point de départ.',
      comment: 'Prise de sang, en général à jeun — non pas pour le cholestérol lui-même, qui ' +
            'bouge peu selon le repas, mais parce qu’on le mesure le plus souvent en même temps ' +
            'que les triglycérides, qui y sont très sensibles.',
      varie: 'Une maladie aiguë, une grossesse, une thyroïde peu active, certains médicaments ' +
            'le déplacent. Il baisse aussi transitoirement après un épisode infectieux.',
      limites: 'C’est une addition de choses qui ne vont pas dans le même sens. Certains ' +
            'transporteurs déposent le cholestérol dans la paroi des artères, un autre l’en ' +
            'retire. Deux personnes ayant le même total peuvent être dans des situations très ' +
            'différentes. Le total ne s’interprète donc pas seul : il se lit avec le HDL et les ' +
            'triglycérides, et surtout avec l’âge, la tension, le tabac et les antécédents ' +
            'familiaux — que seule une consultation permet de rassembler.',
      unite: 'g/L, comme la glycémie : grammes par litre de sang.'
    },

    hdl: {
      resume: 'Le transporteur qui ramène le cholestérol vers le foie.',
      quoi: 'Le HDL est le transporteur qui circule en sens inverse des autres : il récupère le ' +
            'cholestérol déposé dans la paroi des artères et le rapporte au foie, qui l’élimine. ' +
            'C’est ce qui lui a valu le surnom de « bon cholestérol » — un raccourci commode, ' +
            'mais qui laisse croire qu’il existerait deux cholestérols différents, ce qui est ' +
            'faux : c’est le même cholestérol, dans des véhicules différents.',
      pourquoi: 'Parce qu’il se lit à l’envers du cholestérol total, et qu’il est donc ' +
            'indispensable pour donner un sens à ce total.',
      comment: 'Même prise de sang que le cholestérol total, sur le même tube.',
      varie: 'L’activité physique régulière et l’arrêt du tabac le déplacent dans un sens, la ' +
            'sédentarité dans l’autre. La génétique y joue un rôle important, ce qui explique ' +
            'des différences durables entre personnes ayant le même mode de vie. L’alcool le ' +
            'déplace aussi — ce qui n’en fait pas une recommandation.',
      limites: 'Ce n’est pas un score de bonne conduite, et le déplacer artificiellement par ' +
            'un médicament n’a pas montré les bénéfices qu’on en attendait. Il s’interprète ' +
            'dans un ensemble, pas comme une note.',
      unite: 'g/L, grammes par litre.'
    },

    tg: {
      resume: 'La forme sous laquelle les graisses circulent et se stockent.',
      quoi: 'Les triglycérides sont la forme de stockage et de transport des graisses. Ils ' +
            'proviennent en partie de l’alimentation, et en partie du foie, qui en fabrique à ' +
            'partir des sucres et de l’alcool.',
      pourquoi: 'Ils renseignent sur la façon dont le corps gère à la fois les graisses et les ' +
            'sucres, et complètent la lecture du cholestérol.',
      comment: 'C’est la mesure la plus sensible aux conditions de prélèvement de toute cette ' +
            'liste. Un jeûne d’au moins douze heures est demandé, et il faut être franc sur ce ' +
            'point : un repas copieux ou de l’alcool la veille au soir suffisent à déplacer ' +
            'nettement le résultat.',
      varie: 'Les jours qui précèdent comptent, pas seulement le matin du prélèvement. Un ' +
            'repas de fête, un week-end alcoolisé, une période de stress, une grossesse, ' +
            'certains traitements les déplacent.',
      limites: 'Une valeur unique reflète autant les derniers repas que le métabolisme. Quand ' +
            'elle attire l’attention, elle est en général contrôlée après quelques semaines ' +
            'dans des conditions maîtrisées, plutôt que commentée immédiatement.',
      unite: 'g/L, grammes par litre.'
    },

    creat: {
      resume: 'Un déchet musculaire éliminé par les reins.',
      quoi: 'La créatinine est un déchet produit en permanence par les muscles au cours de leur ' +
            'fonctionnement. Les reins la filtrent et l’évacuent dans les urines.',
      pourquoi: 'Puisque la production est régulière, la quantité restant dans le sang dépend ' +
            'surtout de la capacité des reins à l’évacuer. C’est donc une mesure indirecte du ' +
            'travail des reins — indirecte, mais simple et fiable, ce qui en fait la mesure la ' +
            'plus utilisée pour cela.',
      comment: 'Prise de sang. Il est utile d’être normalement hydraté, et d’éviter un effort ' +
            'physique intense ou un repas très riche en viande la veille.',
      varie: 'Elle dépend de la masse musculaire : à reins identiques, une personne très ' +
            'musclée en produit naturellement davantage qu’une personne mince, et une personne ' +
            'âgée moins qu’une personne jeune. La déshydratation, un effort intense récent, ' +
            'certains médicaments et certains compléments la déplacent.',
      limites: 'Le chiffre brut est peu parlant seul, justement parce qu’il dépend des muscles. ' +
            'C’est pourquoi le laboratoire calcule en général une estimation de la filtration ' +
            'rénale, qui tient compte de l’âge et du sexe. Ce calcul figure sur le compte rendu ' +
            'du laboratoire ; il n’est pas refait ici, et cette page n’en produit aucun.',
      unite: 'µmol/L se lit « micromoles par litre ». La mole compte des molécules plutôt ' +
            'qu’un poids. Certains laboratoires utilisent mg/L : les chiffres diffèrent alors ' +
            'complètement pour la même réalité.'
    },

    tsh: {
      resume: 'L’ordre envoyé à la thyroïde, pas sa réponse.',
      quoi: 'La TSH n’est pas fabriquée par la thyroïde. Elle est produite par l’hypophyse, une ' +
            'petite glande située sous le cerveau, et c’est elle qui commande à la thyroïde de ' +
            'travailler. Autrement dit, la TSH est l’ordre donné, pas le travail effectué.',
      pourquoi: 'Ce détour est ce qui la rend utile. L’hypophyse surveille en continu le ' +
            'résultat : si la thyroïde produit peu, elle insiste et la TSH monte ; si la ' +
            'thyroïde produit beaucoup, elle réduit l’ordre et la TSH descend. La TSH réagit ' +
            'donc avant que les hormones thyroïdiennes elles-mêmes ne sortent de leur ' +
            'intervalle habituel, ce qui en fait l’examen de première intention pour explorer ' +
            'la thyroïde.',
      comment: 'Prise de sang, sans jeûne nécessaire. Le prélèvement est de préférence fait le ' +
            'matin, la TSH suivant un rythme au cours de la journée.',
      varie: 'Elle bouge selon l’heure du prélèvement, la saison, une maladie en cours, la ' +
            'grossesse, certains médicaments, et la biotine des compléments capillaires — qui ' +
            'perturbe la mesure elle-même et doit être signalée au laboratoire.',
      limites: 'Elle évolue lentement : deux mesures rapprochées apportent peu. Et comme elle ' +
            'renseigne sur une commande et non sur une production, une valeur inhabituelle ' +
            'conduit à mesurer les hormones thyroïdiennes, pas à conclure.',
      unite: 'mUI/L se lit « milli-unités internationales par litre ». Il s’agit d’une mesure ' +
            'd’activité biologique, pas d’un poids.'
    },

    vitd: {
      resume: 'Fabriquée par la peau au soleil, très dépendante de la saison.',
      quoi: 'Malgré son nom, la vitamine D fonctionne comme une hormone. Elle est fabriquée par ' +
            'la peau sous l’effet du rayonnement solaire ; l’alimentation n’en apporte qu’une ' +
            'petite part, surtout par les poissons gras. Elle intervient dans la fixation du ' +
            'calcium sur les os, dans le fonctionnement des muscles et dans la réponse ' +
            'immunitaire.',
      pourquoi: 'Elle est mesurée dans certaines situations précises — pas systématiquement, ' +
            'et c’est le médecin qui juge de son intérêt pour une personne donnée.',
      comment: 'Prise de sang, sans jeûne nécessaire.',
      varie: 'C’est le paramètre le plus saisonnier de la liste : basse en fin d’hiver, haute ' +
            'en fin d’été, chez presque tout le monde. La couleur de peau, l’usage de crème ' +
            'solaire, la latitude, le travail en intérieur, le port de vêtements couvrants et ' +
            'le poids la déplacent également.',
      limites: 'Comparer deux prélèvements faits à des saisons différentes revient largement à ' +
            'comparer deux saisons. Pour lire une évolution, il faut des prélèvements faits au ' +
            'même moment de l’année — c’est une des rares courbes de cette page qui demande ' +
            'cette précaution de lecture.',
      unite: 'nmol/L se lit « nanomoles par litre ». Beaucoup de laboratoires utilisent ng/mL : ' +
            'le chiffre est alors environ deux fois et demie plus petit pour une réalité ' +
            'identique. Vérifier l’unité avant de comparer deux comptes rendus évite un ' +
            'contresens.'
    },

    alat: {
      resume: 'Une enzyme du foie qui passe dans le sang quand des cellules sont abîmées.',
      quoi: 'L’ALAT est une enzyme présente surtout à l’intérieur des cellules du foie. Quand ' +
            'certaines de ces cellules sont abîmées, leur contenu se répand et l’enzyme se ' +
            'retrouve dans le sang. En mesurer dans le sang, c’est donc constater indirectement ' +
            'que des cellules du foie souffrent.',
      pourquoi: 'Le foie est un organe silencieux : il peut être en difficulté longtemps sans ' +
            'provoquer de symptôme. Cette mesure est l’un des rares moyens simples d’en avoir ' +
            'un aperçu.',
      comment: 'Prise de sang. Il est utile d’éviter un effort physique intense la veille, et ' +
            'de signaler tous les médicaments et compléments pris, y compris ceux achetés sans ' +
            'ordonnance et les plantes.',
      varie: 'L’alcool, de nombreux médicaments courants dont le paracétamol à forte dose, ' +
            'l’accumulation de graisse dans le foie, une infection virale, un effort physique ' +
            'inhabituel et intense la déplacent. Une séance de sport la veille peut suffire.',
      limites: 'Elle ne dit ni la cause ni la gravité. Elle indique qu’il se passe quelque ' +
            'chose, pas quoi. Elle ne se lit jamais seule : le médecin la met en regard des ' +
            'autres marqueurs du foie, des traitements en cours et des habitudes.',
      unite: 'UI/L se lit « unités internationales par litre ». C’est une mesure d’activité de ' +
            'l’enzyme, pas d’une quantité de matière — et chaque laboratoire la rapporte à sa ' +
            'propre technique, ce qui interdit de comparer deux laboratoires sans précaution.'
    },

    pas: {
      resume: 'Le premier des deux chiffres de la tension, au moment où le cœur pousse.',
      quoi: 'La tension artérielle se dit toujours avec deux chiffres. La pression systolique ' +
            'est le premier, le plus élevé : la pression dans les artères au moment où le cœur ' +
            'se contracte et pousse le sang. Le second, la diastolique, correspond au repos ' +
            'entre deux battements. C’est la systolique qui est suivie ici.',
      pourquoi: 'La pression artérielle est l’un des éléments les mieux documentés de toute la ' +
            'prévention, et l’un des rares qui ne se ressent pas : une tension durablement ' +
            'élevée ne provoque en général aucune sensation particulière. Elle ne peut donc ' +
            'être connue que si elle est mesurée.',
      comment: 'Les conditions comptent autant que l’appareil. Cinq minutes assis au calme, ' +
            'dos appuyé, pieds au sol, bras posé à hauteur du cœur, brassard adapté à la taille ' +
            'du bras, sans parler pendant la mesure, et sans café ni cigarette dans la ' +
            'demi-heure qui précède. Une mesure prise juste après avoir couru pour ne pas ' +
            'arriver en retard ne décrit pas la tension habituelle.',
      varie: 'Elle change en permanence : elle est plus basse la nuit, plus haute au réveil, ' +
            'sensible au stress, à la douleur, au fait de parler, à une vessie pleine, au froid, ' +
            'au sel des jours précédents. La seule présence d’un soignant suffit à l’élever ' +
            'chez certaines personnes — c’est un phénomène connu et décrit.',
      limites: 'Une mesure unique ne caractérise pas une tension. C’est pour cette raison que ' +
            'le médecin la reprend au cours de la consultation, sur les deux bras, et propose ' +
            'parfois une série de mesures à domicile sur plusieurs jours, qui décrit beaucoup ' +
            'mieux la réalité qu’un chiffre relevé en visite.',
      unite: 'mmHg se lit « millimètres de mercure ». C’est l’héritage du premier appareil de ' +
            'mesure, qui faisait monter une colonne de mercure : l’unité désigne la hauteur ' +
            'atteinte par cette colonne.'
    },

    poids: {
      resume: 'Suivi pour sa trajectoire, pas pour le chiffre d’un jour.',
      quoi: 'Le poids mesuré sur place, avec le pèse-personne du centre, au moment de la visite.',
      pourquoi: 'Parce que la direction prise sur plusieurs années porte souvent plus ' +
            'd’information qu’une valeur isolée. Une évolution progressive, dans un sens ou dans ' +
            'l’autre, est une donnée que la personne elle-même remarque rarement, et qui ' +
            'oriente la conversation en consultation.',
      comment: 'Idéalement au même moment de la journée, dans une tenue comparable, et sur le ' +
            'même appareil d’une visite à l’autre.',
      varie: 'Beaucoup, et en une seule journée : l’heure, les vêtements, les repas, ' +
            'l’hydratation, le transit et le cycle menstruel font varier le chiffre de plus ' +
            'd’un kilogramme. Deux pèse-personnes différents ajoutent leur propre écart. Une ' +
            'variation entre deux visites doit donc être lue avec cette marge en tête.',
      limites: 'Le poids ne distingue ni le muscle, ni l’eau, ni la graisse. Une personne qui ' +
            'se met au sport peut voir son poids stable et sa composition corporelle changer ' +
            'complètement. Seul, il ne décrit pas un état de santé.',
      unite: 'kg, kilogrammes.'
    }
  },

  /* ==================================================================
     LES ACTES
     Ce qui se passe concrètement, combien de temps, ce que ça fait, et
     ce qui est attendu après. C'est ce que les gens demandent d'abord,
     et c'est ce qui manque presque toujours.
  ================================================================== */
  actes: {

    visite: {
      titre: 'La visite de prévention',
      quoi: 'Un rendez-vous dédié, distinct d’une consultation pour un problème en cours. Le ' +
            'motif de la venue n’est pas une plainte, c’est le fait de faire un point.',
      deroulement: 'Le questionnaire rempli à l’avance est repris avec vous. Le médecin ' +
            'interroge, examine, mesure ce qui se mesure sur place, puis décide de ce qui est ' +
            'utile dans votre situation. Rien n’est prévu d’avance sous forme de forfait.',
      duree: 'Comptez une heure sur place, variable selon ce qui est réalisé.',
      apres: 'Ce qui a été décidé figure sur une ordonnance et dans le compte rendu. Les ' +
            'résultats sont revus avec vous, et non simplement envoyés.',
      pasCeQue: 'Ce n’est pas une visite d’aptitude au travail, et ce n’est pas un examen de ' +
            'médecine du travail. Cela ne remplace pas votre médecin traitant, qui reste votre ' +
            'interlocuteur habituel et à qui les éléments peuvent être transmis si vous le ' +
            'souhaitez.'
    },

    consultation: {
      titre: 'La consultation',
      quoi: 'L’entretien et l’examen avec le médecin. C’est le seul moment du parcours où ' +
            'quelqu’un décide quelque chose.',
      deroulement: 'Antécédents personnels et familiaux, traitements en cours, habitudes de ' +
            'vie, expositions professionnelles, ce que vous ressentez. Puis un examen physique : ' +
            'tension, cœur et poumons à l’écoute, palpation, selon les cas examen de la peau, ' +
            'de la bouche, des pieds, des ganglions.',
      duree: 'De trente à quarante-cinq minutes selon la situation.',
      apres: 'Le médecin explique ce qu’il retient, ce qu’il propose et pourquoi. Vous pouvez ' +
            'refuser tout ou partie de ce qui est proposé, et ce refus n’a aucune conséquence ' +
            'sur la suite du parcours.',
      pasCeQue: 'Ce n’est pas un passage administratif avant les analyses. C’est l’inverse : ce ' +
            'sont les analyses qui découlent de la consultation.'
    },

    prelevement: {
      titre: 'La prise de sang',
      quoi: 'Un prélèvement de sang veineux, en général au pli du coude, réparti dans plusieurs ' +
            'tubes.',
      deroulement: 'Un garrot est posé quelques instants, la peau est désinfectée, l’aiguille ' +
            'reste en place le temps de remplir les tubes. Les bouchons ont des couleurs ' +
            'différentes parce que chaque analyse exige un tube particulier : certains ' +
            'contiennent un produit qui empêche le sang de coaguler, d’autres au contraire le ' +
            'laissent coaguler. C’est pour cette raison qu’un nombre de tubes qui paraît élevé ' +
            'ne signifie pas une grande quantité de sang.',
      duree: 'Deux à trois minutes. La quantité prélevée est sans conséquence pour l’organisme.',
      apres: 'Comprimez quelques minutes sans plier le bras, et évitez de porter lourd dans ' +
            'l’heure qui suit. Un bleu peut apparaître : il est banal et disparaît en quelques ' +
            'jours. Un malaise pendant le prélèvement est fréquent et sans gravité — dites-le ' +
            'avant, on vous allongera.',
      pasCeQue: 'À jeun ou non : cela dépend des analyses demandées, et c’est écrit sur ' +
            'l’ordonnance. Être à jeun quand ce n’est pas demandé n’améliore rien ; ne pas ' +
            'l’être quand c’est demandé rend certains résultats inexploitables et oblige à ' +
            'revenir.'
    },

    respiratoire: {
      titre: 'L’exploration de la fonction respiratoire',
      quoi: 'Une mesure du souffle, appelée spirométrie. Aucune piqûre, aucun produit, aucun ' +
            'rayon.',
      deroulement: 'Un embout jetable dans la bouche, une pince sur le nez. On vous demande ' +
            'd’inspirer à fond puis de souffler le plus fort et le plus longtemps possible, ' +
            'jusqu’au bout. L’exercice est répété plusieurs fois, car il dépend de la façon dont ' +
            'il est réalisé : c’est un examen qui demande votre coopération, pas seulement un ' +
            'appareil.',
      duree: 'Quinze à vingt minutes en comptant les répétitions et les explications.',
      apres: 'Rien de particulier. L’exercice essouffle et peut donner une légère sensation de ' +
            'tête qui tourne pendant quelques secondes.',
      pasCeQue: 'Ce n’est pas une radiographie et cela ne montre pas l’image des poumons. Cela ' +
            'mesure des volumes d’air et des vitesses. Si l’examen est mal réalisé, il est ' +
            'refait : un mauvais souffle donne un résultat qui ne veut rien dire, ce qui est ' +
            'pire qu’une absence de mesure.'
    },

    vaccin: {
      titre: 'La vaccination',
      quoi: 'Une injection, le plus souvent dans le muscle du haut du bras.',
      deroulement: 'Le médecin vérifie d’abord ce qui a déjà été fait et ce qui est indiqué ' +
            'dans votre situation, puis l’injection est réalisée sur place. La traçabilité est ' +
            'enregistrée.',
      duree: 'Quelques secondes pour l’injection.',
      apres: 'Un bras douloureux au point d’injection pendant un à deux jours, parfois une ' +
            'fatigue, un peu de fièvre ou des courbatures : ce sont des réactions attendues, ' +
            'signe que le corps répond, et non des effets indésirables. Elles passent seules. ' +
            'Une réaction qui dure au-delà de quelques jours, une réaction étendue ou un ' +
            'malaise doivent en revanche être signalés.',
      pasCeQue: 'Aucun vaccin n’est administré sans que vous en soyez informé et d’accord. Rien ' +
            'n’est ajouté à votre insu au motif que vous étiez déjà sur place.'
    },

    questionnaire: {
      titre: 'Le questionnaire',
      quoi: 'Un ensemble de questions rempli avant la visite, sur téléphone ou ordinateur.',
      deroulement: 'Antécédents, habitudes de vie, expositions professionnelles, symptômes, ' +
            'statut vaccinal, et plusieurs séries de questions standardisées sur le sommeil, ' +
            'l’humeur, l’audition ou la consommation d’alcool.',
      duree: 'De quinze à trente minutes, en plusieurs fois si vous le souhaitez.',
      apres: 'Vos réponses s’affichent telles quelles devant le médecin pendant la ' +
            'consultation, et servent de point de départ à l’entretien.',
      pasCeQue: 'Le questionnaire ne calcule rien. Il n’additionne aucun score, ne compare ' +
            'aucune réponse à un seuil, ne met en avant aucune réponse et ne propose aucun ' +
            'examen. Il recueille et transmet. Si vous voyez apparaître un jour un score ' +
            'automatique dans cet espace, c’est que cette règle a changé — et elle ne changera ' +
            'qu’avec une certification.'
    },

    examen: {
      titre: 'Un examen complémentaire',
      quoi: 'Un examen qui n’était pas prévu à l’avance et que le médecin a retenu après vous ' +
            'avoir vu et interrogé.',
      deroulement: 'Il vous est expliqué avant d’être réalisé : ce qu’il cherche, comment il se ' +
            'déroule, ce qu’il implique s’il montre quelque chose. Il peut être réalisé sur place ' +
            'si le centre en a la capacité, ou ailleurs.',
      duree: 'Variable selon l’examen.',
      apres: 'Le résultat est repris avec le médecin, jamais transmis seul sans explication.',
      pasCeQue: 'Ce n’est pas un supplément vendu. Rien n’est facturé au-delà de ce que vous ' +
            'avez accepté, et un examen pris en charge par l’Assurance maladie l’est dans les ' +
            'conditions habituelles.'
    },

    document: {
      titre: 'Le compte rendu',
      quoi: 'Le document d’origine, tel que le laboratoire ou le praticien l’a produit.',
      deroulement: 'Il est conservé sans être retouché ni résumé.',
      duree: '—',
      apres: 'Vous pouvez le transmettre à qui vous voulez, à commencer par votre médecin ' +
            'traitant.',
      pasCeQue: 'C’est le compte rendu du laboratoire, et non cette page, qui porte les ' +
            'intervalles de référence. Cette distinction n’est pas un détail : chaque ' +
            'laboratoire publie ses propres intervalles, adaptés à ses appareils et à ses ' +
            'méthodes. Les reprendre ici, détachés de leur laboratoire d’origine, produirait ' +
            'des comparaisons fausses.'
    }
  },

  /* ==================================================================
     VACCINATIONS ET DÉPISTAGES
     Les clés correspondent aux libellés du tableau de couverture.
     Un dépistage s'adresse à des personnes qui n'ont aucun symptôme :
     c'est ce qui le distingue d'un examen de diagnostic, et ce qui
     explique qu'il ait ses propres limites.
  ================================================================== */
  depistages: {

    'Diphtérie, tétanos, poliomyélite': {
      quoi: 'Trois maladies graves et devenues rares grâce à la vaccination : la diphtérie ' +
            'atteint la gorge et le cœur, le tétanos provoque des contractures musculaires à ' +
            'partir d’une plaie souillée, la poliomyélite peut paralyser.',
      pourquoi: 'La protection s’atténue avec le temps, d’où des rappels espacés à l’âge ' +
            'adulte. Le tétanos mérite une mention particulière : la bactérie vit dans la terre, ' +
            'on ne l’attrape pas d’une autre personne, et être le seul non protégé de son ' +
            'entourage n’offre donc aucun abri.',
      comment: 'Une injection dans le bras, souvent combinée à la coqueluche.',
      limites: 'Aucun vaccin ne protège la vie entière sans rappel. La date du dernier rappel ' +
            'est l’information utile, et c’est pourquoi elle est conservée ici.'
    },

    'Grippe saisonnière': {
      quoi: 'Une infection respiratoire saisonnière, banale chez la plupart des gens, mais qui ' +
            'peut être sévère à certains âges et en présence de certaines maladies.',
      pourquoi: 'Le vaccin est refait chaque année pour deux raisons distinctes : les virus qui ' +
            'circulent changent d’une saison à l’autre, et la protection obtenue ne dure que ' +
            'quelques mois.',
      comment: 'Une injection, pendant la campagne d’automne.',
      limites: 'La protection n’est jamais totale et varie d’une saison à l’autre selon la ' +
            'correspondance entre le vaccin et les virus effectivement en circulation. Être ' +
            'vacciné et attraper la grippe n’est donc pas contradictoire.'
    },

    'Covid-19': {
      quoi: 'Une infection respiratoire dont la sévérité dépend fortement de l’âge et des ' +
            'maladies associées.',
      pourquoi: 'Les recommandations évoluent avec la situation épidémique et distinguent les ' +
            'personnes selon leur âge et leur état de santé. Elles ne sont pas les mêmes pour ' +
            'tout le monde, et elles changent.',
      comment: 'Une injection.',
      limites: 'C’est un domaine où l’information vieillit vite. Ce qui est enregistré ici est ' +
            'une date ; ce qui est recommandé aujourd’hui se vérifie avec un professionnel.'
    },

    'Dépistage du cancer colorectal': {
      quoi: 'Un test à faire chez soi, qui recherche des traces de sang invisibles à l’œil nu ' +
            'dans les selles. Le prélèvement se fait avec un dispositif fourni, puis est envoyé ' +
            'par la poste.',
      pourquoi: 'Ce cancer met souvent des années à se développer, à partir de petites lésions ' +
            'qui saignent parfois un peu avant de donner le moindre symptôme. C’est ce délai qui ' +
            'rend le dépistage utile : retirer une lésion évite le cancer, et pas seulement le ' +
            'traite.',
      comment: 'Le programme national le propose tous les deux ans dans une tranche d’âge ' +
            'définie. Le test est simple, rapide, et sans douleur.',
      limites: 'Un test positif ne signifie pas un cancer. Il signifie qu’il y avait du sang, ' +
            'ce qui a de nombreuses causes bénignes, dont les hémorroïdes. Il conduit à une ' +
            'coloscopie, qui seule permet de regarder. À l’inverse, un test négatif ne garantit ' +
            'rien pour les deux années suivantes : un symptôme qui apparaît entre deux tests ' +
            'doit être signalé sans attendre le prochain courrier.'
    },

    'Frottis ou test HPV': {
      quoi: 'Un prélèvement de cellules au niveau du col de l’utérus, réalisé lors d’un examen ' +
            'gynécologique. Selon l’âge, le laboratoire cherche des cellules anormales ' +
            '(frottis) ou la présence du virus HPV.',
      pourquoi: 'Presque tous ces cancers sont liés à une infection persistante par le virus ' +
            'HPV, et la transformation prend de nombreuses années. Le dépistage cherche donc des ' +
            'anomalies bien avant qu’un cancer n’existe, à un stade où un traitement local ' +
            'suffit.',
      comment: 'Le prélèvement prend quelques instants. Il est inconfortable plus que douloureux.',
      limites: 'Un résultat anormal est fréquent et ne veut pas dire cancer : la plupart des ' +
            'infections HPV disparaissent seules. Il conduit à une surveillance ou à un examen ' +
            'complémentaire, dont le rythme est défini par le programme.'
    },

    'Mammographie': {
      quoi: 'Une radiographie des seins. Chaque sein est comprimé entre deux plaques pendant ' +
            'quelques secondes, le temps du cliché.',
      pourquoi: 'Elle permet de repérer des lésions trop petites pour être senties à la ' +
            'palpation.',
      comment: 'Le programme national la propose tous les deux ans dans une tranche d’âge ' +
            'définie, avec une seconde lecture systématique par un autre radiologue.',
      limites: 'La compression est désagréable, brièvement. Deux limites méritent d’être ' +
            'connues avant de décider : un cliché peut conduire à des examens complémentaires ' +
            'qui se révéleront inutiles, et le dépistage peut détecter des lésions qui ' +
            'n’auraient jamais causé de trouble — ce qu’on appelle le surdiagnostic. Ces limites ' +
            'sont réelles, documentées, et font partie de la décision : elles ne se discutent ' +
            'pas avec une page web mais avec un médecin.'
    }
  },

  /* ==================================================================
     GLOSSAIRE
     Les mots qui reviennent partout et que personne n'explique.
  ================================================================== */
  glossaire: [
    { terme: 'À jeun',
      def: 'Ne rien avoir mangé ni bu d’autre que de l’eau depuis un nombre d’heures indiqué ' +
           'sur l’ordonnance. L’eau est autorisée et recommandée. Le café noir, le thé, le ' +
           'chewing-gum et la cigarette rompent le jeûne pour certaines analyses. Le jeûne ' +
           'n’est utile que pour une partie des analyses : ce n’est pas une règle générale.' },

    { terme: 'Intervalle de référence',
      def: 'La fourchette dans laquelle se situent la plupart des résultats d’un groupe de ' +
           'personnes en bonne santé, telle que la publie le laboratoire. Ce n’est pas une ' +
           'frontière entre sain et malade : par construction, une part des personnes en bonne ' +
           'santé se trouve en dehors, et une personne malade peut se trouver dedans. Chaque ' +
           'laboratoire publie ses propres intervalles, adaptés à ses appareils. C’est pour ' +
           'cela qu’ils figurent sur le compte rendu et pas sur cette page.' },

    { terme: 'Dépistage',
      def: 'Chercher quelque chose chez une personne qui n’a aucun symptôme. Le pari est qu’en ' +
           'trouvant plus tôt, on soigne mieux. Ce pari n’est pas gagné pour toutes les ' +
           'maladies, ce qui explique que le dépistage ne soit organisé que pour quelques-unes.' },

    { terme: 'Diagnostic',
      def: 'Chercher la cause d’un symptôme déjà présent. La démarche est inverse de celle du ' +
           'dépistage, et un examen de dépistage ne pose jamais un diagnostic à lui seul.' },

    { terme: 'Faux positif',
      def: 'Un test qui signale quelque chose alors qu’il n’y a rien. Aucun test n’en est ' +
           'exempt. C’est le coût principal du dépistage : de l’inquiétude et des examens ' +
           'complémentaires pour des personnes qui n’avaient rien.' },

    { terme: 'Faux négatif',
      def: 'Un test rassurant alors qu’il y avait quelque chose. C’est pourquoi un résultat ' +
           'négatif ne dispense jamais de signaler un symptôme qui apparaît ensuite.' },

    { terme: 'Surdiagnostic',
      def: 'Découvrir une anomalie réelle qui n’aurait jamais causé de trouble au cours de la ' +
           'vie de la personne. Elle est alors traitée sans bénéfice, avec les inconvénients du ' +
           'traitement. C’est un effet indésirable propre au dépistage, et c’est l’argument le ' +
           'plus sérieux contre le fait d’en faire toujours plus.' },

    { terme: 'Variabilité de la mesure',
      def: 'Deux prélèvements faits le même jour, dans le même laboratoire, ne donnent pas ' +
           'exactement le même chiffre. L’appareil, le tube, le transport et le moment y ' +
           'contribuent. Une petite différence entre deux relevés est donc attendue et ne ' +
           'signifie rien par elle-même.' },

    { terme: 'Tendance',
      def: 'La direction prise par une série de mesures sur plusieurs années. Elle est souvent ' +
           'plus parlante qu’un chiffre isolé, à condition que les mesures aient été faites ' +
           'dans des conditions comparables — même saison, même laboratoire, mêmes consignes.' },

    { terme: 'Unité',
      def: 'Le « par litre », « par décilitre » ou « millimoles » qui suit le chiffre. Deux ' +
           'laboratoires peuvent exprimer la même réalité dans des unités différentes, avec ' +
           'des chiffres sans rapport. Comparer deux résultats sans vérifier l’unité est la ' +
           'source d’erreur la plus banale.' },

    { terme: 'Prévention primaire',
      def: 'Agir avant qu’une maladie n’apparaisse : vaccination, arrêt du tabac, activité ' +
           'physique.' },

    { terme: 'Prévention secondaire',
      def: 'Repérer une maladie déjà installée mais encore silencieuse, pour la prendre en ' +
           'charge plus tôt. C’est le domaine du dépistage.' },

    { terme: 'Ordonnance',
      def: 'Le document par lequel le médecin prescrit un examen ou un traitement. Sans ' +
           'ordonnance, un examen n’est pas pris en charge par l’Assurance maladie. Elle ' +
           'précise aussi les conditions à respecter, comme le jeûne.' },

    { terme: 'Acte hors nomenclature',
      def: 'Un examen qui n’est pas inscrit sur la liste des actes remboursables. Il reste ' +
           'entièrement à votre charge, son prix doit vous être annoncé par écrit avant sa ' +
           'réalisation, et vous êtes libre de le refuser.' },

    { terme: 'Secret médical',
      def: 'L’obligation, sanctionnée pénalement, de ne rien révéler de ce qui est appris dans ' +
           'le cadre du soin. Elle s’applique au médecin comme à tout le personnel. Elle ' +
           'signifie ici qu’aucune donnée nominative ne parvient à un employeur, à un assureur ' +
           'ou à un tiers commercial.' },

    { terme: 'Hébergement de données de santé',
      def: 'Les données de santé ne peuvent être conservées que chez un hébergeur certifié ' +
           'pour cela. Cette page fonctionne aujourd’hui avec des données fictives sur un ' +
           'hébergement ordinaire ; aucune donnée réelle n’y sera saisie avant le passage sur ' +
           'un hébergement certifié.' },

    { terme: 'Dispositif médical',
      def: 'Un logiciel qui interprète des données pour éclairer une décision médicale — par ' +
           'exemple en comparant un résultat à une valeur limite et en signalant l’écart — est ' +
           'un dispositif médical réglementé, qui doit être certifié avant d’être utilisé. ' +
           'C’est la raison précise pour laquelle cette page affiche et n’interprète pas.' }
  ]
};

/* Lisible par le navigateur comme par le vérificateur. */
if (typeof module !== 'undefined' && module.exports) { module.exports = LEXIQUE; }
