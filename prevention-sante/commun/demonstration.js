/* =====================================================================
   JEU DE DÉMONSTRATION — TOUT EST INVENTÉ

   Ce fichier existe pour une seule raison : montrer les écrans remplis
   pendant une présentation. Aucune de ces personnes n'existe, aucun de
   ces résultats n'a été mesuré chez quelqu'un, aucun de ces médecins
   n'exerce.

   POURQUOI UN FICHIER À PART, ET UN SEUL.
   La consigne du projet est qu'aucune donnée de patient réelle ne sera
   saisie avant le passage sur un hébergement certifié HDS. Rassembler
   tout le contenu inventé dans un fichier unique rend cette consigne
   vérifiable et le nettoyage trivial : le jour du basculement, on
   supprime ce fichier et la ligne qui le charge. Si des exemples étaient
   éparpillés dans le code d'affichage, personne ne pourrait affirmer
   qu'il n'en reste pas.

   CE QUI EST INVENTÉ, ET CE QUI NE L'EST PAS.
   Les valeurs, les noms, les dates et les phrases de médecin sont
   inventés. En revanche les grandeurs, les unités, les formulations de
   compte rendu et les classifications employées (ACR, EU-TIRADS) sont
   celles d'un vrai compte rendu : un exemple crédible sert à discuter la
   maquette, un exemple approximatif fait perdre du temps à tout le monde.

   LA RÈGLE QUI NE CHANGE PAS ICI.
   Aucune de ces phrases n'est produite par le logiciel. Chaque
   qualification — « dans les valeurs usuelles », « à surveiller », « à
   interpréter » — porte le nom du praticien qui l'a écrite et sa date,
   parce que c'est ce que le produit fera en vrai. Un exemple qui
   afficherait un statut sans auteur donnerait à voir un logiciel qui
   interprète, c'est-à-dire exactement ce que celui-ci ne fait pas. Le
   vérificateur contrôle que chaque avis de ce fichier est signé.

   CE QU'ON NE TROUVERA PAS NON PLUS DANS LES EXEMPLES.
   Pas d'objectif chiffré, pas de fourchette « normale » posée à côté
   d'une mesure d'objet connecté, pas de commentaire du type « bonne
   récupération » ou « aucune anomalie détectée ». La maquette d'origine
   en contenait pour chacune de ses huit mesures : c'est la seule partie
   de son contenu qui n'a pas été reprise.
   ===================================================================== */

var DEMO = {

  /* ------------------------------------------------------------------
     PATIENT DE DÉMONSTRATION
     Nom volontairement banal, numéro de dossier volontairement nul.
  ------------------------------------------------------------------ */
  patient: {
    nom: 'Camille Durand',
    initiales: 'CD',
    dossier: '0000-0000',
    dernierBilan: '2026-07-20'
  },

  /* ------------------------------------------------------------------
     SIX AVIS DE MÉDECIN, SIGNÉS

     Six domaines sur seize, pour que les trois qualifications soient
     visibles à l'écran sans que la page ressemble à un tableau de
     scores. Les dix autres domaines restent « Non commenté », ce qui est
     aussi une information : le médecin ne s'est pas prononcé.

     Chaque phrase est écrite comme un médecin l'écrirait à son patient :
     elle dit ce qu'il retient et ce qu'il propose, jamais « votre valeur
     est supérieure à la limite ».
  ------------------------------------------------------------------ */
  avis: [
    { domaine: 'cardiovasculaire', statut: 'surveiller',
      medecin: 'Dr Camille Rousseau', date: '2026-07-20',
      synthese: 'Tension un peu au-dessus de ce que je souhaiterais pour vous, sur les deux ' +
                'dernières visites. Rien d’urgent : on reprend trois mesures à domicile sur ' +
                'une semaine et on en reparle en septembre.' },
    { domaine: 'metabolisme', statut: 'surveiller',
      medecin: 'Dr Camille Rousseau', date: '2026-07-20',
      synthese: 'Le profil lipidique se déplace lentement depuis 2022. Compte tenu de votre ' +
                'âge et de vos antécédents familiaux, je propose qu’on en discute avant ' +
                'd’envisager quoi que ce soit.' },
    { domaine: 'hematologie', statut: 'interpreter',
      medecin: 'Dr Camille Rousseau', date: '2026-07-20',
      synthese: 'Ferritine basse alors que l’hémoglobine est stable. Cela peut avoir plusieurs ' +
                'causes, dont certaines banales. Je veux qu’on regarde ça ensemble avant de ' +
                'conclure quoi que ce soit ou de prescrire du fer.' },
    { domaine: 'thyroide', statut: 'usuelles',
      medecin: 'Dr Camille Rousseau', date: '2026-07-20',
      synthese: 'TSH dans l’intervalle du laboratoire, sans symptôme associé. Pas d’examen ' +
                'complémentaire de mon point de vue.' },
    { domaine: 'rein', statut: 'usuelles',
      medecin: 'Dr Camille Rousseau', date: '2026-07-20',
      synthese: 'Fonction rénale stable sur quatre années. Rien à signaler.' },
    { domaine: 'respiration', statut: 'usuelles',
      medecin: 'Dr Pierre Nguyen', date: '2026-07-21',
      synthese: 'Spirométrie sans trouble ventilatoire obstructif. Devant l’absence ' +
                'd’anomalie, je ne retiens pas d’indication à des explorations ' +
                'fonctionnelles complètes.' }
  ],

  /* ------------------------------------------------------------------
     IMAGERIE

     Chaque examen porte le nom du radiologue qui a validé le compte
     rendu, sa date, et sa conclusion telle qu'il l'a écrite. Le statut
     affiché est le sien.
  ------------------------------------------------------------------ */
  imagerie: [
    { id: 'echo-abdo', type: 'Échographie abdominale', modalite: 'Échographie',
      zone: 'Abdomen : foie, vésicule, reins, rate', date: '2026-07-08',
      lieu: 'Centre d’imagerie B (fictif)', medecin: 'Dr Antoine Lefèvre',
      statut: 'usuelles', pages: 2,
      conclusion: 'Foie de taille et d’échostructure habituelles. Vésicule alithiasique. ' +
                  'Reins de morphologie normale, sans dilatation. Pas d’anomalie décelable ' +
                  'des organes explorés.' },
    { id: 'radio-thorax', type: 'Radiographie thoracique', modalite: 'Radiographie',
      zone: 'Thorax, de face', date: '2026-07-08',
      lieu: 'Centre d’imagerie B (fictif)', medecin: 'Dr Antoine Lefèvre',
      statut: 'usuelles', pages: 1,
      conclusion: 'Champs pulmonaires clairs. Silhouette cardiomédiastinale de volume normal. ' +
                  'Pas d’épanchement pleural.' },
    { id: 'mammo', type: 'Mammographie de dépistage', modalite: 'Mammographie',
      zone: 'Seins, bilatérale', date: '2026-07-08',
      lieu: 'Centre d’imagerie B (fictif)', medecin: 'Dr Sophie Martin',
      statut: 'usuelles', pages: 3,
      conclusion: 'Densité mammaire de type B. Classification ACR 1 : absence d’image ' +
                  'suspecte. Suite du suivi selon le programme national.' },
    { id: 'echo-thyroide', type: 'Échographie thyroïdienne', modalite: 'Échographie',
      zone: 'Cou : thyroïde', date: '2026-07-08',
      lieu: 'Centre d’imagerie B (fictif)', medecin: 'Dr Antoine Lefèvre',
      statut: 'surveiller', pages: 1,
      conclusion: 'Nodule du lobe droit de 6 mm, d’aspect bénin, classé EU-TIRADS 2. ' +
                  'Un contrôle à distance peut être discuté avec votre médecin ; ' +
                  'aucune ponction n’est indiquée à ce stade.' },
    { id: 'scanner-thorax', type: 'Scanner thoracique faible dose', modalite: 'Scanner',
      zone: 'Thorax', date: null,
      lieu: 'Non programmé', medecin: null, statut: null, pages: 0,
      conclusion: null,
      attente: 'Cet examen n’a pas été prescrit. Il figure ici parce qu’il fait partie des ' +
               'examens possibles dans ce parcours, et non parce qu’il vous serait ' +
               'recommandé : cette décision appartient au médecin, en consultation.' }
  ],

  /* ------------------------------------------------------------------
     EXAMENS COMPLÉMENTAIRES

     Les mesures sont données telles que l'appareil les a imprimées, avec
     leur unité. Toute lecture — y compris le rapport à une valeur
     prédite — figure dans la conclusion signée du praticien, et pas dans
     un champ calculé par la page.
  ------------------------------------------------------------------ */
  complementaires: [
    { id: 'ecg', nom: 'Électrocardiogramme de repos', code: 'DEQP003',
      date: '2026-07-20', lieu: 'Centre de santé B (fictif)',
      medecin: 'Dr Camille Rousseau', statut: 'usuelles',
      indication: 'Examen de repérage réalisé pendant la visite de prévention.',
      mesures: [
        { l: 'Rythme', v: 'Sinusal', u: '' },
        { l: 'Fréquence', v: '62', u: '/min' },
        { l: 'Intervalle PR', v: '148', u: 'ms' },
        { l: 'Durée QRS', v: '92', u: 'ms' },
        { l: 'QT corrigé', v: '402', u: 'ms' }
      ],
      conclusion: 'Tracé sinusal régulier, sans trouble de conduction ni signe de souffrance ' +
                  'myocardique. Tracé conservé pour comparaison ultérieure.' },
    { id: 'spiro', nom: 'Spirométrie', code: 'GLQP012',
      date: '2026-07-21', lieu: 'Centre de santé B (fictif)',
      medecin: 'Dr Pierre Nguyen', statut: 'usuelles',
      indication: 'Réalisée après le questionnaire de repérage respiratoire, sur décision ' +
                  'du médecin en consultation.',
      mesures: [
        { l: 'VEMS', v: '3,12', u: 'L' },
        { l: 'CVF', v: '3,95', u: 'L' },
        { l: 'VEMS / CVF', v: '0,79', u: '' },
        { l: 'DEP', v: '7,4', u: 'L/s' },
        { l: 'Manœuvres retenues', v: '3', u: 'sur 4' }
      ],
      conclusion: 'Courbes reproductibles sur trois manœuvres. VEMS à 94 % de la valeur ' +
                  'prédite pour l’âge, la taille et le sexe. Pas de trouble ventilatoire ' +
                  'obstructif. Pas d’indication retenue à des explorations fonctionnelles ' +
                  'respiratoires complètes.' },
    { id: 'holter', nom: 'Holter tensionnel sur 24 heures', code: 'DEQP007',
      date: '2026-07-22', lieu: 'Centre de santé B (fictif)',
      medecin: 'Dr Camille Rousseau', statut: 'surveiller',
      indication: 'Demandé devant des chiffres de tension variables au cabinet.',
      mesures: [
        { l: 'Moyenne sur 24 h', v: '134 / 82', u: 'mmHg' },
        { l: 'Moyenne diurne', v: '138 / 85', u: 'mmHg' },
        { l: 'Moyenne nocturne', v: '121 / 71', u: 'mmHg' },
        { l: 'Mesures exploitables', v: '68', u: 'sur 72' }
      ],
      conclusion: 'Enregistrement de bonne qualité. Moyennes légèrement au-dessus des ' +
                  'valeurs que je retiens pour vous, avec une baisse nocturne conservée. ' +
                  'À reprendre en consultation avec les mesures que vous ferez à domicile ; ' +
                  'je ne propose pas de traitement sur ce seul enregistrement.' }
  ],

  /* ------------------------------------------------------------------
     RENDEZ-VOUS
     Aucun bouton de prise de rendez-vous : le raccordement aux agendas
     des centres n'existe pas, et un bouton qui ne fait rien est pire
     qu'un bouton absent.
  ------------------------------------------------------------------ */
  rdv: {
    prochain: {
      date: '2026-09-22', heure: '07 h 30',
      motif: 'Synthèse médicale du bilan',
      qui: 'Dr Camille Rousseau',
      lieu: 'Centre de santé B (fictif)',
      adresse: '00 rue de l’Exemple, 00000 Ville',
      preparation: 'Venez à jeun si une prise de sang de contrôle est prévue — c’est indiqué ' +
                   'sur votre ordonnance. Apportez la liste de vos traitements en cours et, ' +
                   'si vous en avez relevé, vos mesures de tension à domicile.'
    },
    passes: [
      { date: '2026-07-22', motif: 'Pose du Holter tensionnel', qui: 'Équipe soignante',
        lieu: 'Centre de santé B (fictif)' },
      { date: '2026-07-21', motif: 'Spirométrie', qui: 'Dr Pierre Nguyen',
        lieu: 'Centre de santé B (fictif)' },
      { date: '2026-07-20', motif: 'Visite de prévention', qui: 'Dr Camille Rousseau',
        lieu: 'Centre de santé B (fictif)' },
      { date: '2026-07-08', motif: 'Examens d’imagerie', qui: 'Dr Antoine Lefèvre',
        lieu: 'Centre d’imagerie B (fictif)' },
      { date: '2025-06-14', motif: 'Visite de prévention', qui: 'Dr Camille Rousseau',
        lieu: 'Centre de santé A (fictif)' }
    ]
  },

  /* ------------------------------------------------------------------
     OBJETS CONNECTÉS

     Ce que la page fait : afficher ce que l'appareil a transmis, avec la
     date de la dernière synchronisation, et l'historique brut des sept
     derniers jours.

     Ce qu'elle ne fait pas, et c'est le cœur du sujet : aucun objectif,
     aucune fourchette de normalité, aucune flèche de progrès, aucune
     phrase du type « bonne récupération » ou « aucune anomalie
     détectée ». La maquette d'origine en affichait une sous chacune de
     ses huit mesures. Une montre qui écrit « zone normale pour votre
     profil » compare une valeur à un seuil et en tire une conclusion sur
     une personne : c'est la définition d'un dispositif médical.

     La moyenne des sept jours est affichée. C'est une opération sur les
     données de la personne, pas une comparaison à une norme : elle ne
     dit pas si c'est bien.
  ------------------------------------------------------------------ */
  objets: {
    appareils: [
      { id: 'montre-connectee', nom: 'Montre connectée', modele: 'Modèle fictif',
        synchro: 'il y a 12 minutes', batterie: 78,
        mesure: 'Pas, fréquence cardiaque, saturation en oxygène' },
      { id: 'bague-connectee', nom: 'Bague connectée', modele: 'Modèle fictif',
        synchro: 'il y a 34 minutes', batterie: 45,
        mesure: 'Sommeil, variabilité cardiaque, fréquence respiratoire' }
    ],
    jours: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    mesures: [
      { id: 'pas', ic: 'i-route', l: 'Pas quotidiens', u: 'pas', source: 'Montre connectée',
        serie: [7200, 8600, 10400, 6800, 11200, 9800, 9240] },
      { id: 'fc', ic: 'i-heart', l: 'Fréquence cardiaque au repos', u: 'bpm',
        source: 'Montre connectée', serie: [61, 60, 59, 60, 58, 57, 58] },
      { id: 'sommeil', ic: 'i-moon', l: 'Durée de sommeil', u: 'h',
        source: 'Bague connectée', serie: [6.2, 7.5, 6.8, 7.1, 8.0, 7.4, 7.2] },
      { id: 'vfc', ic: 'i-tube', l: 'Variabilité cardiaque', u: 'ms',
        source: 'Bague connectée', serie: [39, 42, 45, 41, 47, 50, 48] },
      { id: 'spo2', ic: 'i-lungs', l: 'Saturation en oxygène, la nuit', u: '%',
        source: 'Montre connectée', serie: [97, 96, 97, 98, 97, 96, 97] },
      { id: 'resp', ic: 'i-lungs', l: 'Fréquence respiratoire, la nuit', u: '/min',
        source: 'Bague connectée', serie: [14, 15, 14, 14, 13, 14, 14] }
    ]
  },

  /* ------------------------------------------------------------------
     MESSAGERIE

     Deux fils, dont un clos. Le champ de réponse est absent : il n'y a
     pas de service de messagerie de santé derrière, et une messagerie
     improvisée sur cet hébergement serait une fuite organisée.
  ------------------------------------------------------------------ */
  messagerie: [
    { id: 'ferritine', sujet: 'Question sur la ferritine', avec: 'Dr Camille Rousseau',
      etat: 'ouvert',
      messages: [
        { de: 'Camille Durand', moi: true, quand: '2026-07-23',
          texte: 'Bonjour Docteur, j’ai vu la mention « à interpréter » sur la ligne du fer. ' +
                 'Faut-il que je m’inquiète, ou est-ce qu’on en parle en septembre ?' },
        { de: 'Dr Camille Rousseau', moi: false, quand: '2026-07-24',
          texte: 'Bonjour, non, il n’y a pas lieu de s’inquiéter dans l’immédiat. J’ai mis ' +
                 'cette mention pour être sûr qu’on en parle, précisément parce que ce ' +
                 'résultat ne s’interprète pas seul. On le reprend le 22 septembre, ne ' +
                 'commencez rien d’ici là.' }
      ] },
    { id: 'holter', sujet: 'Pose du Holter tensionnel', avec: 'Équipe soignante',
      etat: 'clos',
      messages: [
        { de: 'Équipe soignante', moi: false, quand: '2026-07-21',
          texte: 'Bonjour, votre rendez-vous de pose est confirmé pour demain à 8 h 15. ' +
                 'Prévoyez un haut à manches larges, et gardez le brassard 24 heures.' },
        { de: 'Camille Durand', moi: true, quand: '2026-07-21',
          texte: 'C’est noté, merci.' }
      ] }
  ]
};

/* Dossier de démonstration, au format attendu par avis.js : c'est lui qui
   est utilisé quand le navigateur n'a aucun dossier enregistré, c'est-à-
   dire à chaque première ouverture — donc pendant une présentation. Si un
   dossier existe déjà dans le navigateur, il a la priorité et rien de ce
   fichier n'apparaît. */
DEMO.dossierDemo = (function () {
  var d = { id: 'demo', nom: DEMO.patient.nom, avisDomaines: {}, marquesBio: {}, demo: true };
  DEMO.avis.forEach(function (a) {
    d.avisDomaines[a.domaine] = {
      domaine: a.domaine, statut: a.statut, synthese: a.synthese,
      medecin: a.medecin, date: a.date
    };
  });
  return d;
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = DEMO; }
