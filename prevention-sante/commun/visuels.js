/* =====================================================================
   CATALOGUE DES PHOTOGRAPHIES
   Source unique de vérité. Toute photographie affichée sur le site doit
   être déclarée ici, et toute déclaration doit être affichée quelque
   part : le vérificateur compare les deux listes dans les deux sens. Une
   image ajoutée directement dans le HTML sans passer par ce fichier fait
   échouer la vérification, ce qui garantit qu'aucun visuel ne peut être
   publié sans auteur identifié ni page d'emploi documentée.

   POURQUOI CES SUJETS. Aucun visage de médecin, aucun visage de patient.
   Un praticien souriant présenté comme faisant partie de l'offre est une
   représentation du service : elle tombe sous l'article R.4127-19-1 du
   code de la santé publique, qui interdit à la communication d'être
   trompeuse. Des lieux vides et du matériel ne représentent rien d'autre
   qu'eux-mêmes, et rien de ce qu'ils montrent n'est promis.

   POURQUOI UN HÔTE EXTERNE, ET CE QUE ÇA COÛTE. Ces cinq fichiers sont
   les seules ressources du projet chargées depuis un autre domaine.
   Aucun cookie n'est déposé, mais l'hôte reçoit l'adresse IP du
   visiteur. Sur une page destinée aux employeurs, c'est acceptable. Sur
   une page qui affiche un dossier médical, ça ne l'est pas : la requête
   révélerait à un tiers qu'une personne consulte des données de santé.
   D'où la règle, contrôlée automatiquement : PAGE PUBLIQUE UNIQUEMENT.

   BASCULE VERS UN HÉBERGEMENT PROPRE. La licence Unsplash autorise le
   téléchargement, la modification et la rediffusion, y compris à titre
   commercial, sans attribution obligatoire — elle interdit seulement de
   reconstituer un service concurrent de banque d'images. Rien n'empêche
   donc d'héberger ces fichiers soi-même, ce qui supprime la fuite
   d'adresse IP. Procédure dans le README, à faire au moment du passage
   sur l'hébergement HDS.
   ===================================================================== */

var VISUELS = {

  /* Hôtes autorisés à servir une image DISTANTE. Toute autre origine
     fait échouer la vérification. Liste volontairement minimale. */
  hotes: ['images.unsplash.com'],

  /* LES PAGES AUTORISÉES À CHARGER UNE IMAGE DISTANTE.

     Le critère n'est pas « la page est jolie à illustrer », c'est : cette
     page affiche-t-elle des données de santé, et faut-il un compte pour
     la lire ? Une image distante ne dépose pas de cookie, mais elle
     révèle une adresse IP à un tiers. Sur une page de dossier, cette
     seule requête indique à ce tiers qu'une personne consulte des
     données de santé. Sur une page ouverte à tous, elle indique qu'un
     visiteur a lu une page ouverte à tous.

     Deux pages remplissent le critère :
       index.html          — l'accueil, destiné aux employeurs ;
       contenus/index.html — les repères de prévention, qui écrivent
                             eux-mêmes qu'aucun compte n'est nécessaire et
                             qu'aucune donnée n'est lue pour les afficher.

     Toute autre page reste interdite aux images distantes, et le
     vérificateur le contrôle page par page. Ajouter une page à cette
     liste doit être un geste explicite, pas un oubli. */
  pagesPubliques: ['index.html', 'contenus/index.html'],

  /* ==================================================================
     IMAGES LOCALES — ET POURQUOI LA RÈGLE N'EST PAS LA MÊME

     La règle « page publique uniquement » ne portait jamais sur les
     images : elle portait sur les TIERS. Une image servie par notre
     propre domaine ne fait parler personne d'autre que nous. Aucune
     adresse IP ne part ailleurs, aucun tiers n'apprend qu'une personne
     consulte un dossier médical. Les images locales sont donc admises
     partout, y compris sur les pages de santé — c'était précisément
     l'argument en faveur de l'auto-hébergement.

     Les deux régimes coexistent et le vérificateur les distingue :
       - image distante  -> page publique uniquement, hôte en liste
         blanche, renvoi de page masqué ;
       - image locale    -> partout, déclarée ici, fichier présent,
         sous budget de poids.

     PROVENANCE. Photographies reprises de la maquette v0.app fournie
     par le donneur d'ordre — dossier public/photos, celui que la
     maquette utilise réellement pour ses cartes de domaine. Droits
     détenus par le Groupe Dev Santé, sur déclaration du 30 juillet
     2026. Cette phrase n'est pas une formalité : elle date et nomme la
     personne qui affirme détenir les droits, ce qui est le minimum si
     la question est posée un jour.

     UNE ERREUR À NE PAS REFAIRE. Le zip contient DEUX jeux d'images :
     public/domains (illustrations 3D) et public/photos (photographies).
     Seul le second est utilisé par les cartes de domaine. J'ai d'abord
     extrait le mauvais dossier, ce qui a produit des cartes illustrées
     là où la maquette montre des photographies.

     Une réserve à connaître, sans conséquence sur l'usage : le statut
     d'auteur d'une image produite par un modèle génératif n'est pas
     établi en droit français. Cela ne limite pas votre droit de les
     utiliser ; cela limiterait votre capacité à en interdire la reprise
     par un tiers.

     POIDS. Les originaux pesaient 26,8 Mo pour seize fichiers, sur une
     page qui les affiche tous. Recadrés à 720 x 450 — la carte fait
     environ 300 points de large, donc le double pour un écran dense —
     et réencodés, ils pèsent 716 Ko au total. Sur un téléphone en 4G,
     la différence n'est pas cosmétique.

     Le budget par fichier est passé de 60 à 85 Ko : une photographie
     compresse nettement moins bien qu'un aplat de couleur, et descendre
     plus bas se voit. Le chargement reste différé, donc seules les
     cartes visibles sont téléchargées.

     SUJETS, ET UNE LIMITE À TENIR. Ce sont des photographies de scènes
     de vie : un homme qui court, une femme qui dort, des légumes, un
     verre d'eau. Plusieurs montrent des personnes identifiables, et
     celle du domaine « peau » montre une soignante examinant un patient
     au dermatoscope.

     Ces images sont ici sur une page privée, derrière un compte, dans
     l'espace personnel du patient. L'article R.4127-19-1 encadre la
     communication VERS LE PUBLIC : une photographie décorative dans un
     dossier consulté par son titulaire n'en relève pas. La réserve que
     j'avais opposée aux visages sur la page employeurs ne s'applique
     donc pas ici.

     En revanche elle s'appliquerait telle quelle si l'une de ces images
     passait un jour sur index.html : une soignante en situation de soin,
     sur une page qui vend un parcours, se lit comme une représentation
     de l'équipe. C'est pour cela que le vérificateur sépare les deux
     régimes, et que ces seize fichiers sont déclarés pour les pages de
     l'espace patient.
  ================================================================== */
  dossierLocal: 'images/domaines/',
  poidsMaxKo: 85,

  /* ==================================================================
     PHOTOGRAPHIE DE FOND DU BANDEAU DE BILAN

     Déclarée à part des seize illustrations de domaine, pour une raison
     de fond : celles-là sont indexées sur un identifiant de domaine et
     doivent le couvrir en totalité, celle-ci n'est rattachée à aucun
     domaine. Les mélanger obligerait à relâcher le contrôle « chaque
     domaine a son illustration », qui est justement celui qui empêche
     une carte de s'afficher vide.

     Même provenance et mêmes droits que les autres : maquette v0.app,
     dossier public/photos, droits détenus par le Groupe Dev Santé sur
     déclaration du 30 juillet 2026.

     UN VOILE, PAS UN EFFET. Le texte du bandeau est blanc. Sur une
     photographie claire — ici un couloir très lumineux — du blanc sur
     du blanc ne se lit pas. Le voile bleu dégradé n'est donc pas une
     décoration : c'est lui qui tient le contraste, et le vérificateur
     contrôle qu'il part de la couleur pleine du thème et qu'il ne
     descend jamais en dessous d'un tiers d'opacité, même du côté où la
     photographie doit rester visible.

     TEXTE ALTERNATIF VIDE, VOLONTAIREMENT. Le sujet est décrit ici pour
     la provenance, mais l'image est publiée avec alt vide : elle
     n'apporte aucune information. Annoncer « un couloir de clinique
     lumineux » au milieu d'un récapitulatif de bilan ajouterait du bruit
     à qui écoute la page, sans rien lui apprendre.
  ================================================================== */
  dossierBandeau: 'images/bandeau/',
  poidsMaxBandeauKo: 150,

  /* ==================================================================
     PHOTOGRAPHIES DES MODULES

     Même provenance et mêmes droits que les autres : maquette v0.app,
     dossier public/photos, droits détenus par le Groupe Dev Santé sur
     déclaration du 30 juillet 2026.

     TROIS IMAGES, ET UNE ÉCARTÉE. La maquette contient aussi
     hero-editorial : un groupe de personnes souriantes en forêt. Elle
     n'est pas reprise. Ce n'est pas une image d'information, c'est une
     image de promesse — sur une page qui affiche un dossier médical,
     elle suggère un résultat au lieu de le montrer. Elle serait à sa
     place sur une page commerciale, pas ici.

     LA MONTRE ET SON ÉCRAN. La photographie de la montre montre un écran
     affichant « 114 » à côté d'un cœur. Ce nombre n'a aucun rapport avec
     les mesures affichées sur la page : c'est du décor de photographie
     produit. D'où la taille de la vignette — 68 points à l'écran, pour
     une image de 240 — à laquelle il devient illisible. Le laisser
     lisible à côté d'une fréquence cardiaque réelle aurait créé une
     confusion pour rien.
  ================================================================== */
  dossierModules: 'images/modules/',
  poidsMaxModuleKo: 85,

  modules: [
    { id: 'consultation',
      sujet: 'Deux personnes en entretien de part et d’autre d’un bureau, dans un cabinet clair.',
      emploi: 'Bandeau du module « Rendez-vous ».' },
    { id: 'montre-connectee',
      sujet: 'Une montre connectée posée sur un plan clair, bracelet bleu.',
      emploi: 'Vignette d’appareil, module « Objets connectés ».' },
    { id: 'bague-connectee',
      sujet: 'Une bague connectée en titane posée sur un plan clair.',
      emploi: 'Vignette d’appareil, module « Objets connectés ».' }
  ],

  bandeaux: [
    {
      id: 'hero-clinique',
      sujet: 'Un couloir de centre de santé très lumineux, baie vitrée sur un jardin, aucun visage.',
      emploi: 'Fond du bandeau de bilan, dans l’espace patient.',
      voile: true
    }
  ],

  locales: [
    { id: 'cardiovasculaire',   sujet: 'Un homme court sur un sentier en bord de mer au lever du jour.' },
    { id: 'metabolisme',        sujet: 'Un bol de céréales et de fruits frais sur une table claire.' },
    { id: 'hematologie',        sujet: 'Des tubes de prélèvement remplis, alignés dans un support de laboratoire.' },
    { id: 'foie',               sujet: 'Des légumes verts et de l’huile sur une planche, devant une fenêtre.' },
    { id: 'rein',               sujet: 'De l’eau versée dans un verre, en gros plan.' },
    { id: 'thyroide',           sujet: 'Une femme, main posée à la base du cou, dans une lumière douce.' },
    { id: 'nutrition',          sujet: 'Un étal de fruits et légumes colorés vus de dessus.' },
    { id: 'condition-physique', sujet: 'Une personne en tenue de sport marchant en extérieur.' },
    { id: 'respiration',        sujet: 'Une femme respire, debout dans une forêt.' },
    { id: 'sommeil',            sujet: 'Une femme dort dans une chambre claire.' },
    { id: 'inflammation',       sujet: 'Une table dressée avec des aliments frais.' },
    { id: 'osseuse',            sujet: 'Des produits laitiers et des fruits secs sur un plan de travail.' },
    { id: 'vision',             sujet: 'Un examen de la vue, gros plan sur un équipement d’optique.' },
    { id: 'audition',           sujet: 'Un gros plan sur une oreille, lumière douce.' },
    { id: 'peau',               sujet: 'Une soignante examine la peau d’un patient au dermatoscope.' },
    { id: 'depistage',          sujet: 'Un environnement de consultation, matériel posé sur un plan de travail.' }
  ],

  photos: [
    {
      id: 'photo-1746173097964-b8580922a7df',
      auteur: 'ZEIN ZAIN',
      pseudo: 'inal_03',
      reference: 'illOl9R0AEY',
      sujet: 'Une salle d’attente lumineuse, sièges alignés le long d’une baie vitrée.',
      emploi: 'Bande photographique sous le hero.',
      page: 'index.html',
      rang: 1,
      /* Seule image visible sans défiler : chargement immédiat, pas
         différé, sinon elle apparaît après le premier écran. */
      differe: false
    },
    {
      id: 'photo-1766299892549-b56b257d1ddd',
      auteur: 'Brian Wangenheim',
      pseudo: 'brianwangenheim',
      reference: 'K7Qh7RFtUuo',
      sujet: 'Des instruments de diagnostic fixés au mur d’une salle de consultation.',
      emploi: 'Triptyque « Déroulement », premier volet : la consultation.',
      page: 'index.html',
      rang: 2,
      differe: true
    },
    {
      id: 'photo-1579154341184-22069e4614d2',
      auteur: 'National Cancer Institute',
      pseudo: 'nci',
      reference: 'egT3xtDu9DQ',
      sujet: 'Des tubes de prélèvement en verre alignés sur un support.',
      emploi: 'Triptyque « Déroulement », deuxième volet : le prélèvement.',
      page: 'index.html',
      rang: 3,
      differe: true
    },
    {
      id: 'photo-1707651020138-b2ac647cb885',
      auteur: 'Vadim Bogulov',
      pseudo: 'franku84',
      reference: 'PRaSe_XWX38',
      sujet: 'Un automate d’analyse de laboratoire, façade blanche et écran de contrôle.',
      emploi: 'Triptyque « Déroulement », troisième volet : l’analyse.',
      page: 'index.html',
      rang: 4,
      differe: true
    },
    {
      id: 'photo-1740933084056-078fac872bff',
      auteur: 'Colin White',
      pseudo: 'ctw71',
      reference: 'PvNXRpRfbwo',
      sujet: 'Une salle de réunion vide, table longue et grandes fenêtres.',
      emploi: 'Section « Pour les employeurs », sous la carte du réseau.',
      page: 'index.html',
      rang: 5,
      differe: true
    },

    /* ------------------------------------------------------------------
       TROIS PHOTOGRAPHIES POUR LA PAGE « REPÈRES »

       Choisies en cherchant sur Unsplash le 30 juillet 2026, sous licence
       Unsplash : usage commercial autorisé, sans attribution obligatoire.
       Elles sont attribuées quand même, ici, parce qu'une provenance
       écrite vaut mieux qu'une provenance qu'on croit se rappeler.

       DEUX CATÉGORIES ÉCARTÉES pendant la recherche, et pour des raisons
       différentes.

       Les photographies portant la mention Unsplash+ ou signées Getty
       Images : elles ne relèvent pas de la licence Unsplash mais d'un
       abonnement payant. Elles sont servies par plus.unsplash.com, qui
       n'est pas dans la liste des hôtes autorisés — l'exclusion est donc
       mécanique et non laissée à ma vigilance.

       Les scènes de consultation, très nombreuses dans les résultats :
       un médecin en blouse face à un patient, sur une page publique du
       site qui vend un parcours, se lit comme une représentation de notre
       équipe et de notre service. C'est ce que l'article R.4127-19-1 du
       code de la santé publique encadre. Les trois retenues ne montrent
       aucune personne et aucun acte de soin : un sentier, une chambre,
       un chapeau.

       Écartés aussi : les bâtiments d'hôpitaux identifiables — plusieurs
       résultats montraient l'enseigne d'un hôpital réel. Illustrer notre
       offre avec l'établissement de quelqu'un d'autre suggérerait une
       affiliation qui n'existe pas.
    ------------------------------------------------------------------ */
    /* ------------------------------------------------------------------
       DEUX PHOTOGRAPHIES DE PLUS SUR LA PAGE DES EMPLOYEURS

       Cherchées sur Unsplash le 31 juillet 2026. Aucune personne, aucun
       acte de soin : la limite posée sur cette page reste la même, et
       elle vient de l'article R.4127-19-1 — une scène de soin, sur une
       page qui vend un parcours, se lit comme une représentation de notre
       équipe.

       Elles servent de RESPIRATION entre deux sections denses. Une page
       de dix arguments enchaînés se lit mal quel que soit le soin apporté
       au texte : la bande photographique donne un point d'arrêt à l'œil,
       et sa légende reformule l'argument de la section qui suit.
    ------------------------------------------------------------------ */
    {
      id: 'photo-1700832082200-af7deeb63d9b',
      auteur: 'Immo Wegmann',
      pseudo: 'tinkerman',
      reference: 'njrDE70M2VI',
      sujet: 'Un stéthoscope et un thermomètre posés côte à côte sur un plan clair.',
      emploi: 'Bande avant « Dix domaines explorés », page d’accueil.',
      page: 'index.html',
      rang: 9,
      differe: true
    },
    {
      id: 'photo-1580315362297-5be36f0de025',
      auteur: 'Adrien Olichon',
      pseudo: 'adrienolichon',
      reference: '_C0u-d857BY',
      sujet: 'Un bureau de bois clair contre un mur blanc, sans personne.',
      emploi: 'Bande avant « Parlons de votre effectif », page d’accueil.',
      page: 'index.html',
      rang: 10,
      differe: true
    },

    {
      id: 'photo-1621960531176-9e4894d9adf8',
      auteur: 'Tim Mossholder',
      pseudo: 'timmossholder',
      reference: '9UjEyzA6pP4',
      sujet: 'Un sentier de terre entre des arbres verts, en pleine journée.',
      emploi: 'Thème « Activité physique », page Repères.',
      page: 'contenus/index.html',
      theme: 'Activité physique',
      rang: 6,
      differe: true
    },
    {
      id: 'photo-1612152605347-f93296cb657d',
      auteur: 'Isaac Martin',
      pseudo: 'isaacmartin',
      reference: 'wH2aFGo-Rt0',
      sujet: 'Un lit fait, linge blanc, dans une chambre claire.',
      emploi: 'Thème « Sommeil », page Repères.',
      page: 'contenus/index.html',
      theme: 'Sommeil',
      rang: 7,
      differe: true
    },
    {
      id: 'photo-1707399220651-5d15865ce117',
      auteur: 'Joseph Corl',
      pseudo: 'jcorl',
      reference: 'KizzyDUdnuA',
      sujet: 'Un chapeau de paille suspendu, à l’ombre.',
      emploi: 'Thème « Peau et soleil », page Repères.',
      page: 'contenus/index.html',
      theme: 'Peau et soleil',
      rang: 8,
      differe: true
    }
  ]
};

/* Lisible aussi bien par le navigateur que par le vérificateur. */
if (typeof module !== 'undefined' && module.exports) { module.exports = VISUELS; }
