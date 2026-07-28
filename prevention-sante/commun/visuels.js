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

  /* Hôtes autorisés à servir une image. Toute autre origine fait échouer
     la vérification. Liste volontairement minimale. */
  hotes: ['images.unsplash.com'],

  /* La seule page autorisée à charger une image distante. */
  pagePublique: 'index.html',

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
