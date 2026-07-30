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

  /* La seule page autorisée à charger une image DISTANTE. */
  pagePublique: 'index.html',

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
      compte: 'inal_03',
      reference: 'illOl9R0AEY',
      sujet: 'Une salle d’attente lumineuse, sièges alignés le long d’une baie vitrée.',
      emploi: 'Bande photographique sous le hero.',
      rang: 1,
      /* Seule image visible sans défiler : chargement immédiat, pas
         différé, sinon elle apparaît après le premier écran. */
      differe: false
    },
    {
      id: 'photo-1766299892549-b56b257d1ddd',
      auteur: 'Brian Wangenheim',
      compte: 'brianwangenheim',
      reference: 'K7Qh7RFtUuo',
      sujet: 'Des instruments de diagnostic fixés au mur d’une salle de consultation.',
      emploi: 'Triptyque « Déroulement », premier volet : la consultation.',
      rang: 2,
      differe: true
    },
    {
      id: 'photo-1579154341184-22069e4614d2',
      auteur: 'National Cancer Institute',
      compte: 'nci',
      reference: 'egT3xtDu9DQ',
      sujet: 'Des tubes de prélèvement en verre alignés sur un support.',
      emploi: 'Triptyque « Déroulement », deuxième volet : le prélèvement.',
      rang: 3,
      differe: true
    },
    {
      id: 'photo-1707651020138-b2ac647cb885',
      auteur: 'Vadim Bogulov',
      compte: 'franku84',
      reference: 'PRaSe_XWX38',
      sujet: 'Un automate d’analyse de laboratoire, façade blanche et écran de contrôle.',
      emploi: 'Triptyque « Déroulement », troisième volet : l’analyse.',
      rang: 4,
      differe: true
    },
    {
      id: 'photo-1740933084056-078fac872bff',
      auteur: 'Colin White',
      compte: 'ctw71',
      reference: 'PvNXRpRfbwo',
      sujet: 'Une salle de réunion vide, table longue et grandes fenêtres.',
      emploi: 'Section « Pour les employeurs », sous la carte du réseau.',
      rang: 5,
      differe: true
    }
  ]
};

/* Lisible aussi bien par le navigateur que par le vérificateur. */
if (typeof module !== 'undefined' && module.exports) { module.exports = VISUELS; }
