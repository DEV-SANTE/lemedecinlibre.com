/* =====================================================================
   RÉFÉRENTIEL DES MALADIES À DÉPISTER

   Ce que ce fichier est. La liste des maladies que le parcours cherche,
   avec pour chacune : le test, la population, la périodicité, le statut
   du dispositif en France, et le niveau de preuve. Et — c'est la moitié
   du fichier — la liste de ce que le parcours REFUSE de chercher, avec
   la raison de chaque refus.

   Pourquoi les deux listes ensemble. Un catalogue de dépistages sans son
   revers se lit comme un menu : plus il y a de lignes, mieux ce serait.
   C'est l'inverse. Chaque dépistage ajouté produit des faux positifs, des
   examens en cascade et du surdiagnostic ; certains sont malgré tout
   bénéfiques, d'autres non, et la différence n'est pas une question
   d'opinion mais de démonstration. Les deux listes doivent donc vivre au
   même endroit, pour qu'on ne puisse pas ajouter à la première sans lire
   la seconde.

   TROIS NIVEAUX, ET ILS NE SE CONFONDENT PAS
     'organise'    — programme national : invitation par l'Assurance
                     maladie, cahier des charges, prise en charge à 100 %.
                     Trois en France, et un quatrième en préparation.
     'individuel'  — recommandé au cas par cas, sur décision médicale
                     partagée. Pas d'invitation, pas de population cible
                     automatique.
     'ecarte'      — non retenu, avec la raison écrite.

   CE QUE CE FICHIER NE FAIT PAS
   Il ne compare aucun patient à ces critères. Aucune fonction ici ne
   reçoit un dossier, un âge ou une réponse : les tranches d'âge sont des
   paramètres de programme, pas des règles d'éligibilité appliquées à
   quelqu'un. Dire « le programme concerne les 50-74 ans » est une
   information publique ; écrire « vous avez 52 ans, vous devez faire ce
   test » est un avis médical individualisé, et cela appartient au
   médecin en consultation. Le vérificateur contrôle ce point.

   SOURCES ET DATE. État vérifié le 31 juillet 2026 auprès de l'Institut
   national du cancer, de l'Assurance maladie et de la HAS. Les
   références sont dans le champ « source » de chaque entrée. À revoir à
   chaque publication de recommandation : un référentiel de dépistage qui
   n'est pas daté ne vaut rien, parce que rien n'indique s'il est périmé.

   À RELIRE PAR UN MÉDECIN RÉFÉRENT avant mise en service. Les seuils, les
   âges et les périodicités sont reproduits d'après les sources publiques ;
   leur application à un patient reste un acte médical.
   ===================================================================== */

var DEPISTAGES = {

  dateRevue: '2026-07-31',

  niveaux: [
    { v: 'organise',   l: 'Programme national organisé',
      d: 'Invitation par l’Assurance maladie, cahier des charges national, ' +
         'prise en charge à 100 % sans avance de frais.' },
    { v: 'pilote',     l: 'Programme pilote',
      d: 'Étape avant un éventuel programme national : périmètre limité, ' +
         'évaluation en cours, participation volontaire.' },
    { v: 'individuel', l: 'Décision médicale partagée',
      d: 'Pas de programme national. La décision se prend en consultation, ' +
         'au cas par cas, après information sur les bénéfices et les limites.' },
    { v: 'ecarte',     l: 'Écarté',
      d: 'Non retenu dans le parcours. La raison est écrite, et elle est ' +
         'toujours la même famille de raison : le bénéfice n’est pas démontré, ' +
         'ou le coût en faux positifs et en surdiagnostic l’emporte.' }
  ],

  /* ==================================================================
     CE QUE LE PARCOURS CHERCHE
     ================================================================== */
  liste: [

    /* ---- les trois programmes organisés ---- */
    {
      id: 'colorectal', maladie: 'Cancer colorectal', niveau: 'organise',
      test: 'Test immunologique de recherche de sang occulte dans les selles, fait à domicile',
      population: 'Femmes et hommes de 50 à 74 ans',
      rythme: 'Tous les deux ans',
      domaine: 'depistage',
      pourquoi:
        'Ce cancer se développe le plus souvent à partir d’un polype, sur plusieurs années, ' +
        'et sans aucun symptôme pendant longtemps. C’est ce délai qui rend le dépistage utile : ' +
        'on peut retirer le polype avant qu’il ne devienne un cancer.',
      limites:
        'Le test cherche du sang, pas un cancer : il peut être positif pour une hémorroïde et ' +
        'négatif alors qu’une lésion existe. Un test positif conduit à une coloscopie, qui ' +
        'confirme ou non — et dans la majorité des cas, elle ne trouve pas de cancer.',
      role: 'Remise du kit et explication en consultation. La lecture du test et la suite ' +
            'relèvent du programme et du médecin.',
      source: 'Institut national du cancer — programme de dépistage organisé ; arrêté du ' +
              '16 janvier 2024 relatif aux programmes de dépistages organisés des cancers.'
    },
    {
      id: 'sein', maladie: 'Cancer du sein', niveau: 'organise',
      test: 'Mammographie, avec double lecture des clichés',
      population: 'Femmes de 50 à 74 ans',
      rythme: 'Tous les deux ans',
      domaine: 'depistage',
      pourquoi:
        'Le dépistage permet de découvrir des tumeurs plus petites, ce qui change les ' +
        'traitements possibles. La double lecture des clichés fait partie du programme : ' +
        'un second radiologue relit ceux jugés normaux.',
      limites:
        'Deux inconvénients établis, qu’il faut connaître avant de décider. Les fausses ' +
        'alertes : des clichés qui inquiètent et conduisent à des examens complémentaires ' +
        'pour rien. Et le surdiagnostic : la découverte de lésions qui n’auraient jamais ' +
        'donné de maladie, mais qui sont traitées. Le bénéfice est réel, le coût aussi, et ' +
        'c’est pour cela que la décision reste celle de la personne.',
      role: 'Information, remise de l’invitation si elle a été perdue, et orientation vers ' +
            'un cabinet de radiologie du programme.',
      source: 'Institut national du cancer ; Assurance maladie — invitations depuis le ' +
              '1ᵉʳ janvier 2024.'
    },
    {
      id: 'col-uterus', maladie: 'Cancer du col de l’utérus', niveau: 'organise',
      test: 'De 25 à 29 ans, examen cytologique. De 30 à 65 ans, test HPV-HR — ' +
            'réalisable sur auto-prélèvement vaginal',
      population: 'Femmes de 25 à 65 ans',
      rythme: 'Cytologie tous les trois ans avant 30 ans ; test HPV tous les cinq ans ensuite',
      domaine: 'depistage',
      pourquoi:
        'C’est le cancer évitable par excellence : il est précédé de lésions qui se soignent, ' +
        'et il est causé par un virus contre lequel il existe un vaccin. Dépistage et ' +
        'vaccination agissent sur la même maladie, à deux moments différents.',
      limites:
        'Un test HPV positif est fréquent et ne signifie pas qu’il y a une lésion : le virus ' +
        'disparaît seul dans la plupart des cas. C’est la persistance qui compte, d’où la ' +
        'périodicité de cinq ans et non annuelle.',
      role: 'Prélèvement au centre, ou remise d’un kit d’auto-prélèvement. La lecture est ' +
            'faite par un laboratoire d’anatomo-cytopathologie.',
      source: 'HAS 2019-2020 — test HPV-HR en première intention après 30 ans ; HAS — ' +
              'auto-prélèvement vaginal, performance quasi équivalente ; ameli.fr.'
    },

    /* ---- le programme pilote ---- */
    {
      id: 'poumon', maladie: 'Cancer du poumon', niveau: 'pilote',
      test: 'Scanner thoracique à faible dose, double lecture par deux radiologues',
      population: 'Personnes de 50 à 74 ans, fumeuses ou ayant arrêté depuis moins de ' +
                  'quinze ans, avec une consommation cumulée importante — de l’ordre de ' +
                  'vingt paquets-années',
      rythme: 'Deux scanners à un an d’intervalle, puis tous les deux ans',
      domaine: 'respiration',
      pourquoi:
        'C’est le cancer qui tue le plus, et il est découvert tard parce qu’il ne fait pas ' +
        'mal au début. Le scanner à faible dose réduit la mortalité chez les personnes à ' +
        'risque du fait du tabac : c’est sur cette démonstration que repose le programme.',
      limites:
        'Beaucoup de nodules découverts ne sont pas des cancers, et chaque nodule pose la ' +
        'question de ce qu’on en fait — surveiller, ponctionner, opérer. C’est la raison pour ' +
        'laquelle le dépistage est réservé aux personnes réellement à risque, réalisé dans un ' +
        'cadre organisé, et systématiquement associé à une proposition d’aide à l’arrêt du ' +
        'tabac : arrêter reste de très loin le geste le plus efficace.',
      role: 'Repérage de l’exposition au tabac au questionnaire, calcul des paquets-années ' +
            'par le médecin en consultation, et orientation vers le programme pilote dans ' +
            'les régions où il est ouvert. Le parcours ne réalise pas ces scanners.',
      source: 'HAS 2022 — avis favorable à un programme pilote ; Institut national du cancer ' +
              '— programme pilote IMPULSION, premières inclusions en mai 2026, ' +
              '20 000 participants, scanners pris en charge à 100 %.'
    },

    /* ---- décision médicale partagée ---- */
    {
      id: 'prostate', maladie: 'Cancer de la prostate', niveau: 'individuel',
      test: 'Dosage du PSA, avec ou sans examen clinique',
      population: 'Aucune population cible définie par un programme national',
      rythme: 'Aucune périodicité recommandée',
      domaine: 'depistage',
      pourquoi:
        'Un homme qui souhaite être dépisté peut l’être, après une information complète. ' +
        'C’est le sens de la décision médicale partagée : le choix appartient à la personne, ' +
        'pas au dispositif.',
      limites:
        'Il n’existe pas de dépistage organisé du cancer de la prostate en France, et ce ' +
        'n’est pas un oubli. Le PSA détecte beaucoup de cancers qui n’auraient jamais causé ' +
        'de trouble, et leur traitement expose à l’incontinence et à l’impuissance. Un PSA ' +
        'élevé peut aussi n’être qu’une prostate volumineuse ou une infection. C’est ' +
        'l’exemple le plus documenté de dépistage où le bénéfice collectif reste discuté.',
      role: 'Le dosage n’est jamais proposé de façon systématique. Il est fait si l’homme le ' +
            'demande ou si le médecin le retient, après une conversation sur ces limites.',
      source: 'HAS — absence de dépistage organisé ; catalogue interne : « décision médicale ' +
              'partagée, pas de dépistage organisé ».'
    },
    {
      id: 'bpco', maladie: 'Bronchopneumopathie chronique obstructive', niveau: 'individuel',
      test: 'Questionnaire de repérage en cinq questions, puis spirométrie si le médecin ' +
            'le retient',
      population: 'Adultes exposés au tabac ou à des poussières et vapeurs professionnelles, ' +
                  'ou gênés à l’effort',
      rythme: 'Aucune périodicité systématique',
      domaine: 'respiration',
      pourquoi:
        'La maladie est très largement non diagnostiquée, parce qu’on s’adapte à la perte de ' +
        'souffle sans la remarquer. Le repérage se fait par des questions simples, avant tout ' +
        'examen.',
      limites:
        'Il n’est pas démontré qu’il soit utile de mesurer le souffle de tous les adultes sans ' +
        'symptôme : le dépistage systématique de la BPCO chez les personnes sans plainte ni ' +
        'exposition n’est pas recommandé. C’est pour cela que la spirométrie vient après les ' +
        'questions, et seulement sur décision du médecin.',
      role: 'Cinq questions au questionnaire, reproduites mot pour mot et sans décompte ' +
            'automatique. La spirométrie est réalisée sur place quand le médecin la retient.',
      source: 'HAS — repérage de la BPCO ; USPSTF — recommandation contre le dépistage chez ' +
              'l’adulte asymptomatique.'
    },
    {
      id: 'diabete', maladie: 'Diabète de type 2', niveau: 'individuel',
      test: 'Glycémie à jeun, éventuellement précédée d’un questionnaire de risque',
      population: 'Adultes avec un facteur de risque : surpoids, antécédent familial, ' +
                  'antécédent de diabète gestationnel, origine géographique, sédentarité',
      rythme: 'Espacé, à l’appréciation du médecin',
      domaine: 'metabolisme',
      pourquoi:
        'Le diabète de type 2 évolue des années sans symptôme, et les complications ' +
        'commencent avant le diagnostic. C’est une des rares maladies où le dépistage change ' +
        'la prise en charge de façon simple et immédiate.',
      limites:
        'Une glycémie isolée ne suffit pas à poser un diagnostic : elle varie, et un chiffre ' +
        'limite se contrôle. Le diagnostic appartient au médecin.',
      role: 'Glycémie à jeun prescrite selon les facteurs de risque relevés en consultation.',
      source: 'Recommandations françaises de dépistage ciblé du diabète de type 2.'
    },
    {
      id: 'hta', maladie: 'Hypertension artérielle', niveau: 'individuel',
      test: 'Mesure de la tension au centre, puis mesures à domicile sur plusieurs jours',
      population: 'Tous les adultes, à l’occasion d’un contact avec le système de soins',
      rythme: 'À chaque visite',
      domaine: 'cardiovasculaire',
      pourquoi:
        'C’est le facteur de risque cardiovasculaire le plus fréquent et le plus silencieux. ' +
        'La mesure ne coûte rien et se fait pendant la consultation.',
      limites:
        'Une tension mesurée une fois au cabinet ne suffit jamais à poser un diagnostic : ' +
        'l’effet du cabinet lui-même est bien décrit. Le diagnostic demande des mesures ' +
        'répétées, en dehors du centre.',
      role: 'Mesure à chaque visite, et remise d’un relevé à faire à domicile quand le ' +
            'médecin le demande.',
      source: 'Recommandations françaises et européennes sur la mesure de la pression ' +
              'artérielle.'
    },
    {
      id: 'melanome', maladie: 'Mélanome et cancers de la peau', niveau: 'individuel',
      test: 'Examen cutané complet, dermatoscopie, lecture par un dermatologue',
      population: 'Personnes à peau claire, à nævi nombreux, avec antécédents personnels ou ' +
                  'familiaux, ou fortes expositions solaires passées',
      rythme: 'Selon le niveau de risque, apprécié par le dermatologue',
      domaine: 'peau',
      pourquoi:
        'La peau est le seul organe qu’on examine entièrement à l’œil nu. Ce qui compte n’est ' +
        'pas le nombre de grains de beauté mais le fait qu’un seul ait changé.',
      limites:
        'Il n’existe pas de programme organisé : le dépistage systématique de toute la ' +
        'population n’a pas démontré de réduction de mortalité. L’examen a en revanche un ' +
        'intérêt reconnu chez les personnes à risque.',
      role: 'Examen cutané pendant la visite, lecture dermatologique impérative pour toute ' +
            'lésion retenue.',
      source: 'Recommandations françaises ; catalogue interne : « lecture par dermatologue ' +
              'impérative ».'
    },
    {
      id: 'vih-hepatites', maladie: 'VIH, hépatites B et C', niveau: 'individuel',
      test: 'Sérologies sanguines',
      population: 'Au moins une fois dans la vie pour le VIH chez l’adulte ; selon ' +
                  'l’exposition pour les hépatites',
      rythme: 'Selon l’exposition',
      domaine: 'hematologie',
      pourquoi:
        'Ces trois infections peuvent rester silencieuses des années, elles se traitent, et ' +
        'le traitement change le pronostic et la transmission. Le rapport bénéfice-coût du ' +
        'dépistage est parmi les mieux établis.',
      limites:
        'Un résultat positif demande un test de confirmation avant toute annonce. ' +
        'L’annonce est un acte médical, jamais un envoi de résultat.',
      role: 'Sérologies prescrites en consultation, résultats rendus par le médecin.',
      source: 'Recommandations françaises de dépistage du VIH et des hépatites virales.'
    },
    {
      id: 'apnees', maladie: 'Syndrome d’apnées du sommeil', niveau: 'individuel',
      test: 'Questionnaires de repérage, puis enregistrement du sommeil si le médecin ' +
            'le retient',
      population: 'Personnes qui ronflent avec somnolence en journée, ou dont l’entourage ' +
                  'rapporte des pauses respiratoires',
      rythme: 'Aucune périodicité systématique',
      domaine: 'sommeil',
      pourquoi:
        'Les apnées retentissent sur la tension, la vigilance au volant et la fatigue, et ' +
        'elles se traitent. Le repérage passe par des questions, y compris à l’entourage.',
      limites:
        'Les questionnaires repèrent, ils ne diagnostiquent pas : beaucoup de personnes qui ' +
        'ronflent n’ont pas d’apnées, et un score élevé n’est pas une maladie. Seul un ' +
        'enregistrement du sommeil permet de conclure, et il ne se justifie pas chez ' +
        'quelqu’un sans somnolence ni retentissement.',
      role: 'Questions au questionnaire, sans décompte automatique. Enregistrement à ' +
            'domicile sur décision du médecin.',
      source: 'Recommandations françaises sur le syndrome d’apnées obstructives du sommeil.'
    },
    {
      id: 'glaucome', maladie: 'Glaucome', niveau: 'individuel',
      test: 'Mesure de la pression intraoculaire, examen du nerf optique',
      population: 'Après 40 ans, et plus tôt en cas d’antécédent familial ou d’origine ' +
                  'africaine ou antillaise',
      rythme: 'Selon l’avis de l’ophtalmologiste',
      domaine: 'vision',
      pourquoi:
        'La perte de champ visuel du glaucome est indolore et commence en périphérie : la ' +
        'vision centrale reste bonne jusqu’à un stade avancé, et ce qui est perdu ne revient ' +
        'pas. C’est un des cas où dépister tôt change réellement la suite.',
      limites:
        'Une pression élevée n’est pas un glaucome, et un glaucome peut exister à pression ' +
        'normale. Le diagnostic appartient à l’ophtalmologiste.',
      role: 'Mesure de la pression dans le cadre du protocole orthoptiste-ophtalmologiste du ' +
            'centre, quand ce plateau est disponible.',
      source: 'Recommandations françaises en ophtalmologie.'
    },
    {
      id: 'audition', maladie: 'Perte auditive', niveau: 'individuel',
      test: 'Questionnaire de retentissement, puis audiométrie',
      population: 'Adultes exposés au bruit, et à partir de la cinquantaine',
      rythme: 'Selon la gêne et l’exposition',
      domaine: 'audition',
      pourquoi:
        'La perte est progressive, symétrique, et ce sont les proches qui la remarquent. Elle ' +
        'a des conséquences sociales et cognitives documentées, et il existe des solutions.',
      limites:
        'Un questionnaire mesure la gêne ressentie, pas l’audition : on peut s’être adapté à ' +
        'une perte réelle et se déclarer sans problème, ou se plaindre avec une audition ' +
        'normale. Seul un audiogramme objective la perte, et l’appareillage se décide sur la ' +
        'gêne autant que sur la courbe.',
      role: 'Questions au questionnaire, audiométrie sur place quand le centre en dispose.',
      source: 'Recommandations françaises ; catalogue interne — HHIE-S comme déclencheur ' +
              'd’audiométrie.'
    },
    {
      id: 'depression', maladie: 'Dépression et troubles anxieux', niveau: 'individuel',
      test: 'Questions de repérage, reprises en consultation',
      population: 'Tous les adultes, à condition qu’une filière de soins existe en aval',
      rythme: 'À chaque visite de prévention',
      domaine: 'sommeil',
      pourquoi:
        'Ces troubles sont fréquents, ils se traitent, et ils ne sont pas dits spontanément. ' +
        'Poser la question par écrit lève une partie de l’obstacle.',
      limites:
        'Repérer sans organiser la suite est inutile, voire nuisible : la condition posée dans ' +
        'ce projet est qu’une orientation existe avant tout déploiement. Un questionnaire ne ' +
        'pose aucun diagnostic.',
      role: 'Questions au questionnaire, sans score affiché, et reprise systématique en ' +
            'consultation.',
      source: 'Recommandations françaises ; condition interne — filière d’aval obligatoire ' +
              'avant déploiement.'
    },
    {
      id: 'osteoporose', maladie: 'Ostéoporose', niveau: 'individuel',
      test: 'Évaluation du risque de fracture, puis ostéodensitométrie si elle est indiquée',
      population: 'Femmes après la ménopause et personnes avec facteurs de risque de fracture',
      rythme: 'Selon le risque',
      domaine: 'osseuse',
      pourquoi:
        'La perte de solidité osseuse ne provoque aucun symptôme avant la fracture. C’est ' +
        'exactement la situation où l’on parle en prévention plutôt qu’en réaction.',
      limites:
        'La mesure de densité seule ne suffit pas à décider : c’est l’évaluation globale du ' +
        'risque de fracture qui conditionne l’indication.',
      role: 'Recueil des facteurs de risque au questionnaire. L’indication de ' +
            'l’ostéodensitométrie appartient au médecin.',
      source: 'Recommandations françaises ; catalogue interne — FRAX conditionne ' +
              'l’indication de la DEXA.'
    }
  ],

  /* ==================================================================
     CE QUE LE PARCOURS NE FAIT PAS, ET POURQUOI

     Cette liste est reprise du catalogue interne, qui les classait déjà
     « à écarter ». Elle est publiée ici parce qu'un patient et un
     employeur ont le droit de savoir ce qu'on refuse de leur vendre —
     et parce que ces examens sont précisément ceux que proposent les
     offres de bilan premium.
     ================================================================== */
  ecartes: [
    {
      id: 'multi-cancers', quoi: 'Test sanguin multi-cancers, de type Galleri',
      raison:
        'Aucune démonstration d’une réduction de mortalité. Un test qui annonce un cancer ' +
        'sans dire où il se trouve déclenche une recherche du corps entier, avec son lot ' +
        'd’examens et d’angoisse, pour un bénéfice non établi.'
    },
    {
      id: 'marqueurs-tumoraux', quoi: 'Marqueurs tumoraux en dépistage — CEA, CA 19-9, ' +
        'AFP, CA 125, CA 15-3',
      raison:
        'Ces dosages ont une place dans le suivi d’un cancer connu, pas dans le dépistage ' +
        'chez une personne sans symptôme : faible valeur prédictive et cascades de faux ' +
        'positifs. Ils figurent pourtant dans beaucoup de bilans vendus.'
    },
    {
      id: 'echo-thyroide', quoi: 'Échographie thyroïdienne systématique',
      raison:
        'Le contre-exemple le mieux documenté du surdiagnostic. Un dépistage massif par ' +
        'échographie a multiplié les diagnostics de cancer de la thyroïde en Corée du Sud, ' +
        'sans que la mortalité par ce cancer ne bouge — donc en opérant des personnes qui ' +
        'n’en avaient pas besoin. L’examen reste pertinent devant un nodule palpé ou un ' +
        'symptôme.'
    },
    {
      id: 'imagerie-corps-entier', quoi: 'Imagerie du corps entier chez une personne ' +
        'sans symptôme',
      raison:
        'Produit des découvertes fortuites dans la majorité des cas, dont presque aucune ' +
        'n’aurait causé de trouble. Chaque découverte engage une cascade d’examens, et ' +
        'certaines conduisent à des gestes invasifs.'
    },
    {
      id: 'omiques', quoi: 'Microbiote intestinal, âge épigénétique, longueur des ' +
        'télomères, protéomique, métabolomique, scores polygéniques',
      raison:
        'Domaines de recherche sans usage clinique établi en dépistage. Chers, sous-traités, ' +
        'faiblement étayés — et très présents dans les offres qui vendent un chiffre plutôt ' +
        'qu’un soin.'
    },
    {
      id: 'ecg-effort-systematique', quoi: 'Épreuve d’effort systématique chez une personne ' +
        'sans symptôme et à risque faible',
      raison:
        'Faux positifs fréquents dans cette population, conduisant à des explorations ' +
        'invasives sans bénéfice démontré. L’examen garde toute sa place devant des symptômes ' +
        'ou un risque élevé.'
    },
    {
      id: 'panels-genetiques', quoi: 'Panels génétiques héréditaires proposés hors cadre',
      raison:
        'Ce n’est pas un refus de principe mais un refus de cadre : ces analyses exigent un ' +
        'prescripteur qualifié, une consultation d’oncogénétique et un consentement encadré. ' +
        'Les proposer dans un bilan de prévention, sans ce dispositif, serait illégal et ' +
        'dangereux pour la personne comme pour sa famille.'
    }
  ],

  /* Recherche par identifiant. Ne reçoit jamais de dossier ni d'âge :
     aucune éligibilité n'est calculée ici. */
  trouver: function (id) {
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].id === id) return this.liste[i];
    }
    return null;
  },

  niveau: function (v) {
    for (var i = 0; i < this.niveaux.length; i++) {
      if (this.niveaux[i].v === v) return this.niveaux[i];
    }
    return null;
  },

  /* Maladies rattachées à un domaine de santé, pour l'affichage. Le
     rattachement est documentaire et défini à la main dans ce fichier. */
  duDomaine: function (domaineId) {
    var out = [];
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].domaine === domaineId) out.push(this.liste[i]);
    }
    return out;
  }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = DEPISTAGES; }
