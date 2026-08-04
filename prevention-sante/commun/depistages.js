/* =====================================================================
   RÉFÉRENTIEL DES MALADIES À DÉPISTER

   SOIXANTE-ET-UNE PATHOLOGIES, ET UN ÉTAT DE VALIDATION QUI COMPTE
   AUTANT QUE LA LISTE.

   Origine. Ce référentiel est la reprise de la « Matrice de prévention
   Groupe Dev Santé » — onglet Pathologies cibles — croisée avec la note
   de cadrage adressée au médecin responsable de protocole. Les deux
   documents sont datés de juillet 2026.

   CE QUI EST VALIDÉ, ET CE QUI NE L'EST PAS.
   Les vingt et une lignes soumises à l'arbitrage sont visées. Le médecin
   responsable de protocole les a validées telles quelles, sans modifier
   de restriction ni de périodicité. Ces vingt et une restrictions ne
   sont donc plus des propositions : elles sont opposables. Un examen qui
   sort de sa restriction n'est plus une préférence discutable, c'est un
   écart au protocole.

   Le visa porte sur ces vingt et une lignes, et sur rien d'autre. Il ne
   vaut pas validation des soixante-deux pathologies, ni des quarante-
   sept explications cliniques encore non rédigées, ni des cotations, ni
   des items de questionnaire à créer pour les actes dont l'indication
   n'est pas tracée. Laisser un visa sur vingt et une lignes se lire
   comme « le référentiel est validé » serait exactement le faux que ce
   champ existe pour empêcher — d'où la distinction écrite dans le champ
   « validation », affichée à l'écran des deux côtés, et contrôlée.

   Cet état n'est donc pas une note de bas de page : c'est une propriété
   du référentiel. Elle a changé le 4 août 2026 ; elle est datée et porte
   un nom, parce qu'une validation anonyme ne vaut rien.

   POURQUOI CERTAINES ENTRÉES SONT PLUS COURTES QUE D'AUTRES
   Quatorze entrées portent un texte rédigé : pourquoi on cherche cette
   maladie, ce que le dépistage ne fait pas, ce que le parcours fait, et
   la source. Quarante-sept n'en ont pas encore, et le champ « redige »
   le dit. Je n'ai pas inventé quarante-sept explications cliniques sans
   source : une phrase écrite au hasard sur les limites d'un dépistage
   est plus dangereuse qu'une absence de phrase, parce qu'elle a l'air
   d'une information. Le vérificateur compte les deux populations et
   n'exige les limites que des entrées déclarées rédigées.

   CE QUE LE FICHIER NE FAIT TOUJOURS PAS
   Il ne compare aucun patient à ces critères. Aucune fonction ne reçoit
   de dossier, d'âge ni de réponse : les tranches d'âge sont des
   paramètres de programme et des cibles de dimensionnement, pas des
   règles d'éligibilité appliquées à quelqu'un.

   ACCENTS. La matrice a été saisie sans accents. Sa reprise est passée
   par une table de réaccentuation mot à mot, avec échec de la génération
   si un mot manquait — plutôt que par des remplacements approximatifs
   qui auraient laissé des fautes difficiles à voir.

   État vérifié le 31 juillet 2026. Sources : matrice interne, note de
   cadrage interne, Institut national du cancer, Assurance maladie, HAS.
   ===================================================================== */

var DEPISTAGES = {

  dateRevue: '2026-07-31',

  /* ==================================================================
     ÉTAT DE VALIDATION MÉDICALE

     Les vingt et une lignes sont visées. « medecin », « rpps » et « date »
     portent le visa : ce sont eux que l'écran affiche, et le vérificateur
     refuse l'état « valide » s'ils sont vides — une validation sans nom ni
     date ne serait pas une validation.

     Le RPPS est écrit parce qu'un visa doit pouvoir être vérifié par un
     tiers sans nous le demander : le répertoire de l'annuaire santé est
     public, et un homonyme ne suffirait pas à identifier un signataire.

     « porteeDuVisa » dit ce que le visa ne couvre pas. Ce champ est là
     pour empêcher la lecture extensive : vingt et une lignes visées ne
     font pas soixante-deux pathologies validées.
     ================================================================== */
  validation: {
    etat: 'valide',
    libelle: 'Vingt et une lignes visées par le médecin responsable de protocole',
    detail: 'Les vingt et une lignes soumises à l’arbitrage ont été validées telles ' +
            'quelles, sans modification des restrictions ni des périodicités. Ces ' +
            'restrictions sont désormais opposables : un examen prescrit hors de sa ' +
            'restriction est un écart au protocole, pas une préférence.',
    porteeDuVisa: 'Le visa porte sur les vingt et une lignes d’arbitrage. Il ne vaut pas ' +
            'validation des soixante-deux pathologies du périmètre, ni des quarante-sept ' +
            'explications cliniques encore non rédigées, ni des cotations, ni des items de ' +
            'questionnaire restant à créer pour les actes dont l’indication n’est pas tracée.',
    medecin: 'Dr Nassreddine Knani',
    qualite: 'médecin généraliste',
    rpps: '10110958559',
    date: '2026-08-04',
    lignesArbitrees: 21,
    sansModification: true
  },

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

  /* Statut du plateau technique des centres, repris de la matrice. C'est
     l'information que ni un patient ni un employeur ne trouve ailleurs :
     ce qui est faisable sur place, ce qui demande un achat, ce qui est
     adressé. */
  plateaux: [
    { v: 'complet',     l: 'Réalisable sur place' },
    { v: 'orientation', l: 'Repérage et orientation seulement' },
    { v: 'ajout',       l: 'Demande un achat d’équipement' },
    { v: 'partiel',     l: 'Partiellement adressé à l’extérieur' }
  ],

  prises: [
    { v: 'mbp', l: 'Mon Bilan Prévention' },
    { v: 'am',  l: 'Assurance maladie, sur indication tracée' },
    { v: 'hn',  l: 'Hors nomenclature' }
  ],

  liste: [
    /* ------------------------------------------------------------------
       AJOUT HORS MATRICE — LE CANCER DU POUMON

       La matrice compte soixante-et-une pathologies et n'inclut pas le
       cancer du poumon. C'est vraisemblablement un oubli, et il est
       lourd : c'est le cancer qui tue le plus en France, un programme
       pilote national vient de démarrer, et la ligne « TDM thoracique
       faible dose » figure déjà parmi les vingt et une lignes soumises à
       arbitrage — donc le sujet est bien présent dans le dossier, mais
       sans pathologie pour le porter.

       Cette entrée est donc marquée « ajout » et non « matrice » : le
       médecin responsable doit savoir qu'elle ne vient pas du document
       qu'on lui soumet, mais d'une relecture. La note de cadrage demande
       explicitement « les examens que vous estimez manquants au regard
       des recommandations en vigueur » : en voici un.
    ------------------------------------------------------------------ */
    { id: 'cancer-du-poumon', maladie: 'Cancer du poumon',
      origine: 'ajout',
      niveau: 'pilote',
      axe: 'Oncologie', domaine: 'respiration',
      enjeu: 'Premier cancer en mortalité ; découvert tard car longtemps indolore',
      examens: 'Repérage de l’exposition au tabac, paquets-années, TDM thoracique faible dose',
      equipement: 'TDM externe — hors périmètre du plateau',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : le scanner est adressé',
      population: 'Personnes de 50 à 74 ans, fumeuses ou ayant arrêté depuis moins de ' +
                  'quinze ans, environ vingt paquets-années',
      rythme: 'Deux scanners à un an d’intervalle, puis tous les deux ans',
      preuve: 'Établi chez les personnes à risque du fait du tabac — réduction de mortalité',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: true,
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
      role: 'Repérage de l’exposition au questionnaire, calcul des paquets-années par le ' +
            'médecin en consultation, et orientation vers le programme pilote dans les ' +
            'régions où il est ouvert. Le parcours ne réalise pas ces scanners.',
      source: 'HAS 2022 — avis favorable à un programme pilote ; Institut national du ' +
              'cancer — programme pilote IMPULSION, premières inclusions en mai 2026, ' +
              '20 000 participants, scanners pris en charge à 100 %.',
      arbitrage: ['TDM thoracique faible dose'] },
    { origine: 'matrice', id: 'diabete-de-type-2', maladie: 'Diabète de type 2',
      niveau: 'individuel',
      axe: 'Métabolique', domaine: 'metabolisme',
      enjeu: '~1 personne sur 10 après 45 ans ; 20-25% de cas non diagnostiqués',
      examens: 'Glycémie à jeun, HbA1c, FINDRISC',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous > 35 ans, plus tôt si IMC/antécédents', rythme: 'Annuelle',
      preuve: 'Établi (HAS) - retard de complications micro et macrovasculaires',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
      pourquoi:
        'Le diabète de type 2 évolue des années sans symptôme, et les complications ' +
        'commencent avant le diagnostic. C’est une des rares maladies où le dépistage change ' +
        'la prise en charge de façon simple et immédiate.',
      limites:
        'Une glycémie isolée ne suffit pas à poser un diagnostic : elle varie, et un chiffre ' +
        'limite se contrôle. Le diagnostic appartient au médecin.',
      role: 'Glycémie à jeun prescrite selon les facteurs de risque relevés en consultation.',
      source: 'Recommandations françaises de dépistage ciblé du diabète de type 2.',
      arbitrage: ['Glycémie veineuse à jeun', 'HbA1c'] },
    { origine: 'matrice', id: 'prediabete', maladie: 'Prédiabète',
      niveau: 'individuel',
      axe: 'Métabolique', domaine: 'metabolisme',
      enjeu: '20-25% de la population adulte',
      examens: 'HbA1c, HGPO, FINDRISC',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous > 35 ans', rythme: 'Annuelle',
      preuve: 'Établi - conversion évitable dans ~50% des cas',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: ['HbA1c'] },
    { origine: 'matrice', id: 'hypertension-arterielle', maladie: 'Hypertension artérielle',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '~30% des adultes, 1 sur 2 non contrôlé',
      examens: 'PA de cabinet, automesure, MAPA',
      equipement: 'Holter tensionnel',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous', rythme: 'Annuelle',
      preuve: 'Établi - premier facteur de risque d’AVC',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'artérielle.',
      arbitrage: [] },
    { origine: 'matrice', id: 'dyslipidemie-et-lp-a-elevee', maladie: 'Dyslipidémie et Lp(a) élevée',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '~30% des adultes ; Lp(a) élevée chez 1 sur 5',
      examens: 'Bilan lipidique, ApoB, Lp(a), SCORE2',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous ; Lp(a) une fois dans la vie', rythme: 'Annuelle',
      preuve: 'Établi - réduction des événements CV',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: ['Lipoprotéine(a)'] },
    { origine: 'matrice', id: 'hypercholesterolemie-familiale', maladie: 'Hypercholestérolémie familiale',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '1/250, très largement sous-diagnostiquée',
      examens: 'LDL, score DLCN, génotypage',
      equipement: 'Laboratoire + sous-traitance',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'LDL > 1,90 g/L ou antécédents précoces', rythme: 'Une fois',
      preuve: 'Établi - dépistage en cascade familial',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'fibrillation-atriale', maladie: 'Fibrillation atriale',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '2-4% après 65 ans, souvent paroxystique et silencieuse',
      examens: 'ECG, Holter ECG',
      equipement: 'ECG + Holter',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 65 ans, palpitations, HTA', rythme: 'Annuelle',
      preuve: 'Établi - prévention de l’AVC par anticoagulation',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'insuffisance-cardiaque', maladie: 'Insuffisance cardiaque',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '2-3% de la population, 10% après 75 ans',
      examens: 'NT-proBNP, échocardiographie',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Dyspnée, HTA, diabète, > 65 ans', rythme: 'Sur alerte',
      preuve: 'Établi - pronostic transformé par un traitement précoce',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'valvulopathies-retrecissement-aortique', maladie: 'Valvulopathies (rétrécissement aortique, IM)',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: 'RA serré chez 2-3% après 75 ans',
      examens: 'Auscultation, échocardiographie-doppler',
      equipement: 'Échographe cardiaque',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Souffle, > 65 ans', rythme: 'Sur alerte',
      preuve: 'Établi - fenêtre d’intervention avant dysfonction VG',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'atherome-carotidien-infraclinique', maladie: 'Athérome carotidien infraclinique',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: 'Plaque présente chez > 30% après 55 ans',
      examens: 'Écho-doppler carotidien, EMI',
      equipement: 'Échographe vasculaire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 50 ans avec facteurs de risque', rythme: 'Triennale',
      preuve: 'Reclassement du risque CV ; bénéfice sur la décision thérapeutique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: ['Écho-doppler carotidien'] },
    { origine: 'matrice', id: 'arteriopathie-obliterante-des-membres-', maladie: 'Artériopathie oblitérante des membres inférieurs',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '~10% après 65 ans, asymptomatique dans 2 cas sur 3',
      examens: 'IPS, écho-doppler artériel',
      equipement: 'Doppler + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Diabète, tabac, > 60 ans', rythme: 'Triennale si à risque',
      preuve: 'Établi - marqueur de risque CV majeur',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'anevrisme-de-l-aorte-abdominale', maladie: 'Anévrisme de l’aorte abdominale',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '4-8% des hommes fumeurs de 65-75 ans',
      examens: 'Échographie abdominale',
      equipement: 'Échographe abdominal',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Homme 65-75 ans fumeur', rythme: 'Une fois',
      preuve: 'Établi - dépistage unique validé par essais randomisés',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'coronaropathie', maladie: 'Coronaropathie',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: 'Première cause de mortalité CV',
      examens: 'SCORE2, ECG, ECG d’effort, coroscanner',
      equipement: 'ECG d’effort (ajout) puis adressage',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Douleur d’effort, risque intermédiaire-élevé', rythme: 'Sur alerte',
      preuve: 'Établi chez le symptomatique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'thrombose-veineuse-profonde', maladie: 'Thrombose veineuse profonde',
      niveau: 'individuel',
      axe: 'Cardiovasculaire', domaine: 'cardiovasculaire',
      enjeu: '1-2/1000/an',
      examens: 'D-dimères, écho-doppler veineux',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Symptômes, post-op, immobilisation', rythme: 'Sur alerte',
      preuve: 'Établi - prévention de l’embolie pulmonaire',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'bpco', maladie: 'BPCO',
      niveau: 'individuel',
      axe: 'Respiratoire', domaine: 'respiration',
      enjeu: '7-10% des adultes ; 2 cas sur 3 non diagnostiqués',
      examens: 'Spirométrie avec réversibilité, DLCO',
      equipement: 'Spiromètre + EFR',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Fumeurs, > 40 ans, dyspnée', rythme: 'Annuelle',
      preuve: 'Établi - sevrage et réhabilitation modifient la pente du VEMS',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'l’adulte asymptomatique.',
      arbitrage: [] },
    { origine: 'matrice', id: 'asthme', maladie: 'Asthme',
      niveau: 'individuel',
      axe: 'Respiratoire', domaine: 'respiration',
      enjeu: '6-7% des adultes',
      examens: 'Spirométrie, réversibilité, FeNO',
      equipement: 'Spiromètre (+ FeNO)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Toux, sifflements, atopie', rythme: 'Sur symptômes',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'syndrome-d-apnees-obstructives-du-somm', maladie: 'Syndrome d’apnées obstructives du sommeil',
      niveau: 'individuel',
      axe: 'Respiratoire', domaine: 'respiration',
      enjeu: '~10-15% des adultes, 80% non diagnostiqués',
      examens: 'STOP-BANG, Epworth, polygraphie ventilatoire',
      equipement: 'Polygraphe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Ronflement, somnolence, HTA résistante, IMC élevé', rythme: 'Sur alerte',
      preuve: 'Établi - bénéfice CV, cognitif et accidentologique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: true,
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
      source: 'Recommandations françaises sur le syndrome d’apnées obstructives du sommeil.',
      arbitrage: [] },
    { origine: 'matrice', id: 'pneumopathie-interstitielle-diffuse', maladie: 'Pneumopathie interstitielle diffuse',
      niveau: 'individuel',
      axe: 'Respiratoire', domaine: 'respiration',
      enjeu: 'Rare mais pronostic dépendant du délai',
      examens: 'EFR, DLCO, radiographie puis TDM',
      equipement: 'EFR + radiologie, TDM externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Dyspnée, crépitants, sclérodermie', rythme: 'Sur alerte',
      preuve: 'Établi pour la FPI',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'tuberculose-latente-ou-active', maladie: 'Tuberculose latente ou active',
      niveau: 'individuel',
      axe: 'Respiratoire', domaine: 'respiration',
      enjeu: 'Enjeu avant biothérapie et chez les migrants',
      examens: 'IGRA, radiographie du thorax, PCR',
      equipement: 'Laboratoire + radiologie',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Contage, migrant, immunodépression', rythme: 'Sur indication',
      preuve: 'Établi - traitement de l’infection tuberculeuse latente',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-du-sein', maladie: 'Cancer du sein',
      niveau: 'organise',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: '1 femme sur 8 ; premier cancer féminin',
      examens: 'Mammographie + tomosynthèse, IA, échographie, microbiopsie',
      equipement: 'Mammographe + échographe (+ biopsie)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau, microbiopsie comprise',
      population: 'Femme 50-74 ans, 40-49 selon risque', rythme: 'Bisannuelle',
      preuve: 'Établi - programme national organisé',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              '1ᵉʳ janvier 2024.',
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-colorectal', maladie: 'Cancer colorectal',
      niveau: 'organise',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: '2e cancer en mortalité ; participation nationale < 35%',
      examens: 'FIT puis coloscopie',
      equipement: 'Laboratoire, coloscopie externe',
      plateau: 'complet', plateauTexte: 'Dépistage réalisable sur le plateau ; la suite est adressée',
      population: '50-74 ans', rythme: 'Bisannuelle',
      preuve: 'Établi - réduction de mortalité démontrée',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              '16 janvier 2024 relatif aux programmes de dépistages organisés des cancers.',
      arbitrage: [] },
    { origine: 'matrice', id: 'lesions-precancereuses-du-col-et-cance', maladie: 'Lésions précancéreuses du col et cancer du col',
      niveau: 'organise',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: '~3000 cas/an, évitable',
      examens: 'Test HPV-HR, cytologie réflexe',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Femme 25-65 ans', rythme: 'Triennale puis quinquennale',
      preuve: 'Établi - programme national organisé',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'auto-prélèvement vaginal, performance quasi équivalente ; ameli.fr.',
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-de-la-prostate', maladie: 'Cancer de la prostate',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Premier cancer masculin',
      examens: 'PSA, ratio libre/total, IRM puis biopsies',
      equipement: 'Laboratoire ; IRM et biopsies externes',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Homme 50-70 ans, décision partagée', rythme: 'Annuelle à bisannuelle',
      preuve: 'Débattu - dépistage individuel après information',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'partagée, pas de dépistage organisé ».',
      arbitrage: ['PSA total'] },
    { origine: 'matrice', id: 'melanome-et-carcinomes-cutanes', maladie: 'Mélanome et carcinomes cutanés',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: '~15 000 mélanomes/an ; pronostic dépendant de l’épaisseur',
      examens: 'Dermatoscopie, cartographie, télé-expertise, biopsie',
      equipement: 'Dermatoscope (+ petite chirurgie)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau, biopsie comprise',
      population: 'Phototype clair, > 50 nævi, antécédents', rythme: 'Annuelle',
      preuve: 'Établi chez les sujets à risque',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'impérative ».',
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-thyroidien', maladie: 'Cancer thyroïdien',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Enjeu de surdiagnostic à maîtriser',
      examens: 'Échographie EU-TIRADS, cytoponction',
      equipement: 'Échographe (+ cytoponction)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau, cytoponction comprise',
      population: 'Nodule palpable uniquement - pas de dépistage systématique', rythme: 'Sur alerte',
      preuve: 'Nuance - risque de surdiagnostic',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: ['Échographie thyroïdienne (EU-TIRADS)', 'Cytoponction thyroïdienne échoguidée'] },
    { origine: 'matrice', id: 'carcinome-hepatocellulaire', maladie: 'Carcinome hépatocellulaire',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Sur cirrhose : 3-5%/an',
      examens: 'Échographie hépatique + AFP',
      equipement: 'Échographe + laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Cirrhose, hépatite B ou C chronique', rythme: 'Semestrielle',
      preuve: 'Établi chez le cirrhotique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-du-rein', maladie: 'Cancer du rein',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Souvent découverte fortuite',
      examens: 'Échographie rénale puis TDM',
      equipement: 'Échographe ; TDM externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Hématurie, HTA, découverte fortuite', rythme: 'Sur alerte',
      preuve: 'Non recommandé en dépistage systématique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-de-la-vessie-urothelial', maladie: 'Cancer de la vessie (urothélial)',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Lien fort avec le tabac et les expositions professionnelles',
      examens: 'BU, cytologie urinaire, échographie, cystoscopie',
      equipement: 'Laboratoire + échographe ; cystoscopie externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Hématurie, tabagisme, exposition professionnelle', rythme: 'Sur alerte',
      preuve: 'Ciblé sur les expositions professionnelles',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'cancer-de-l-ovaire', maladie: 'Cancer de l’ovaire',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Diagnostic tardif dans 70% des cas',
      examens: 'Échographie endovaginale, CA-125, score ROMA',
      equipement: 'Échographe + laboratoire',
      plateau: 'orientation', plateauTexte: 'Le plateau permet de repérer et d’orienter, pas de conclure',
      population: 'Symptômes, antécédents familiaux, BRCA', rythme: 'Sur alerte',
      preuve: 'Non recommandé en population générale ; ciblé si BRCA',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: ['CA-125', 'HE4 et score ROMA'] },
    { origine: 'matrice', id: 'myelome-et-gammapathies-monoclonales', maladie: 'Myélome et gammapathies monoclonales',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'MGUS chez 3% après 50 ans',
      examens: 'NFS, VS, EPS, chaînes légères, calcémie, créatinine',
      equipement: 'Laboratoire',
      plateau: 'orientation', plateauTexte: 'Le plateau permet de repérer et d’orienter, pas de conclure',
      population: 'Anémie, douleurs osseuses, MRC, > 60 ans', rythme: 'Sur alerte',
      preuve: 'Établi pour le myélome symptomatique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'leucemies-et-syndromes-myeloproliferat', maladie: 'Leucémies et syndromes myéloprolifératifs',
      niveau: 'individuel',
      axe: 'Oncologie', domaine: 'depistage',
      enjeu: 'Découverte souvent sur NFS de routine',
      examens: 'NFS, frottis, JAK2',
      equipement: 'Laboratoire (+ sous-traitance)',
      plateau: 'orientation', plateauTexte: 'Le plateau permet de repérer et d’orienter, pas de conclure',
      population: 'Anomalie de la NFS', rythme: 'Sur alerte',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'masld-mash-et-fibrose-hepatique', maladie: 'MASLD / MASH et fibrose hépatique',
      niveau: 'individuel',
      axe: 'Hépato', domaine: 'foie',
      enjeu: '~25% des adultes ; 1 sur 5 avec fibrose significative',
      examens: 'ALAT, FIB-4, échographie, élastographie',
      equipement: 'Laboratoire + échographe (+ élastographie)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau, élastographie comprise',
      population: 'Syndrome métabolique, diabète, IMC élevé', rythme: 'Annuelle',
      preuve: 'Établi - fibrose réversible aux stades précoces',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: ['Échographie abdominale'] },
    { origine: 'matrice', id: 'hepatites-b-et-c-chroniques', maladie: 'Hépatites B et C chroniques',
      niveau: 'individuel',
      axe: 'Hépato', domaine: 'foie',
      enjeu: 'VHC quasi éradicable ; VHB sous-diagnostiquée',
      examens: 'Ag HBs, anti-HBc, anti-HBs, anti-VHC, charge virale',
      equipement: 'Laboratoire (+ PCR sous-traitée)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous une fois dans la vie', rythme: 'Une fois',
      preuve: 'Établi - VHC guérissable, VHB contrôlable',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'hemochromatose-genetique', maladie: 'Hémochromatose génétique',
      niveau: 'individuel',
      axe: 'Hépato/Métabolique', domaine: 'foie',
      enjeu: '1/300 en Europe du Nord',
      examens: 'CST, ferritine, génotypage HFE',
      equipement: 'Laboratoire (+ sous-traitance)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'CST élevé confirmé', rythme: 'Une fois',
      preuve: 'Établi - espérance de vie normale si traitée avant cirrhose',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'maladie-coeliaque', maladie: 'Maladie cœliaque',
      niveau: 'individuel',
      axe: 'Digestif', domaine: 'metabolisme',
      enjeu: '~1% de la population, 80% non diagnostiqués',
      examens: 'Anti-tTG IgA, IgA totales, biopsie duodénale',
      equipement: 'Laboratoire ; endoscopie externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Anémie ferriprive, diarrhée, DT1, antécédents familiaux', rythme: 'Sur alerte',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'infection-a-h-pylori-et-ulcere', maladie: 'Infection à H. pylori et ulcère',
      niveau: 'individuel',
      axe: 'Digestif', domaine: 'metabolisme',
      enjeu: '20-30% de la population adulte',
      examens: 'Test respiratoire à l’urée, antigène fécal',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Dyspepsie, antécédents familial de cancer gastrique', rythme: 'Sur symptômes',
      preuve: 'Établi - éradication et prévention du cancer gastrique',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'mici-crohn-rectocolite', maladie: 'MICI (Crohn, rectocolite)',
      niveau: 'individuel',
      axe: 'Digestif', domaine: 'metabolisme',
      enjeu: '~0,3% de la population',
      examens: 'Calprotectine fécale, CRP, coloscopie',
      equipement: 'Laboratoire ; endoscopie externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Diarrhée chronique, douleurs, rectorragies', rythme: 'Sur symptômes',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'maladie-renale-chronique', maladie: 'Maladie rénale chronique',
      niveau: 'individuel',
      axe: 'Rénal', domaine: 'rein',
      enjeu: '~10% des adultes ; 50% ignorent leur atteinte',
      examens: 'Créatinine + DFG, RAC, BU, échographie',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous ; obligatoire si diabète ou HTA', rythme: 'Annuelle',
      preuve: 'Établi - ralentissement de la progression',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'lithiase-urinaire', maladie: 'Lithiase urinaire',
      niveau: 'individuel',
      axe: 'Rénal', domaine: 'rein',
      enjeu: '~10% de prévalence vie entière',
      examens: 'Échographie, bilan métabolique urinaire',
      equipement: 'Échographe + laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Colique néphrétique, récidive', rythme: 'Sur symptômes',
      preuve: 'Établi - prévention des récidives',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'dysthyroidies-et-thyroidite-auto-immun', maladie: 'Dysthyroïdies et thyroïdite auto-immune',
      niveau: 'individuel',
      axe: 'Endocrinien', domaine: 'thyroide',
      enjeu: 'Hypothyroïdie chez 3-5% des femmes',
      examens: 'TSH, T4L, anti-TPO, échographie',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous ; prioritaire femme > 50 ans', rythme: 'Annuelle',
      preuve: 'Établi pour l’hypothyroïdie patente',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'hyperparathyroidie-primaire', maladie: 'Hyperparathyroïdie primaire',
      niveau: 'individuel',
      axe: 'Endocrinien', domaine: 'thyroide',
      enjeu: 'Souvent révélée par une calcémie de routine',
      examens: 'Calcémie, PTH, 25-OH-D, DXA',
      equipement: 'Laboratoire (+ DXA)',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Hypercalcémie, ostéoporose, lithiase', rythme: 'Sur alerte',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'osteoporose', maladie: 'Ostéoporose',
      niveau: 'individuel',
      axe: 'Rhumatologie', domaine: 'osseuse',
      enjeu: '~40% des femmes après 50 ans feront une fracture',
      examens: 'FRAX, DXA, radiographie du rachis, bilan phosphocalcique',
      equipement: 'DXA (ajout) + radiologie + laboratoire',
      plateau: 'ajout', plateauTexte: 'Demande une acquisition d’équipement limitée',
      population: 'Femme ménopausée, corticothérapie, fracture, IMC bas', rythme: 'Une fois puis 3-5 ans',
      preuve: 'Établi - réduction du risque fracturaire',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: true,
      pourquoi:
        'La perte de solidité osseuse ne provoque aucun symptôme avant la fracture. C’est ' +
        'exactement la situation où l’on parle en prévention plutôt qu’en réaction.',
      limites:
        'La mesure de densité seule ne suffit pas à décider : c’est l’évaluation globale du ' +
        'risque de fracture qui conditionne l’indication.',
      role: 'Recueil des facteurs de risque au questionnaire. L’indication de ' +
            'l’ostéodensitométrie appartient au médecin.',
      source: 'Recommandations françaises ; catalogue interne — FRAX conditionne ' +
              'l’indication de la DEXA.',
      arbitrage: ['Densitométrie osseuse (DXA)'] },
    { origine: 'matrice', id: 'sarcopenie-et-fragilite', maladie: 'Sarcopénie et fragilité',
      niveau: 'individuel',
      axe: 'Gériatrie', domaine: 'condition-physique',
      enjeu: '10-20% après 70 ans',
      examens: 'Force de préhension, lever de chaise, impédancemétrie, DXA',
      equipement: 'Dynamomètre (ajout) + impédancemètre',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau, dynamomètre compris',
      population: '> 60-65 ans', rythme: 'Annuelle',
      preuve: 'Établi - réversibilité par exercice et protéines',
      pec: 'hn', pecTexte: 'Hors nomenclature : à la charge de l’abonnement ou du patient',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'polyarthrite-rhumatoide', maladie: 'Polyarthrite rhumatoïde',
      niveau: 'individuel',
      axe: 'Rhumatologie', domaine: 'osseuse',
      enjeu: '~0,3-0,5% de la population',
      examens: 'Anti-CCP, FR, CRP, échographie articulaire',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Polyarthralgies inflammatoires', rythme: 'Sur symptômes',
      preuve: 'Établi - fenêtre d’opportunité thérapeutique de 3 mois',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'spondyloarthrite-axiale', maladie: 'Spondyloarthrite axiale',
      niveau: 'individuel',
      axe: 'Rhumatologie', domaine: 'osseuse',
      enjeu: '~0,3% ; retard diagnostique moyen de 7 ans',
      examens: 'HLA-B27, CRP, radiographie, IRM',
      equipement: 'Laboratoire + radiologie ; IRM externe',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Rachialgie inflammatoire du sujet jeune, uvéite', rythme: 'Sur symptômes',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'goutte-et-hyperuricemie', maladie: 'Goutte et hyperuricémie',
      niveau: 'individuel',
      axe: 'Rhumatologie', domaine: 'osseuse',
      enjeu: '~2% de la population',
      examens: 'Uricémie, échographie articulaire',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Arthrite, hyperuricémie', rythme: 'Annuelle',
      preuve: 'Établi',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'glaucome-chronique', maladie: 'Glaucome chronique',
      niveau: 'individuel',
      axe: 'Ophtalmologie', domaine: 'vision',
      enjeu: '1-2% après 40 ans ; 50% non diagnostiqués',
      examens: 'PIO, pachymétrie, OCT papillaire, champ visuel',
      equipement: 'Plateau ophtalmologique',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 40 ans, antécédents familiaux, myopie forte', rythme: 'Bisannuelle',
      preuve: 'Établi - perte visuelle évitable et irréversible',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
      pourquoi:
        'La perte de champ visuel du glaucome est indolore et commence en périphérie : la ' +
        'vision centrale reste bonne jusqu’à un stade avancé, et ce qui est perdu ne revient ' +
        'pas. C’est un des cas où dépister tôt change réellement la suite.',
      limites:
        'Une pression élevée n’est pas un glaucome, et un glaucome peut exister à pression ' +
        'normale. Le diagnostic appartient à l’ophtalmologiste.',
      role: 'Mesure de la pression dans le cadre du protocole orthoptiste-ophtalmologiste du ' +
            'centre, quand ce plateau est disponible.',
      source: 'Recommandations françaises en ophtalmologie.',
      arbitrage: [] },
    { origine: 'matrice', id: 'dmla', maladie: 'DMLA',
      niveau: 'individuel',
      axe: 'Ophtalmologie', domaine: 'vision',
      enjeu: '~8% après 50 ans, 25% après 75 ans',
      examens: 'Acuité, rétinophotographie, OCT maculaire',
      equipement: 'Plateau ophtalmologique',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 50 ans', rythme: 'Bisannuelle',
      preuve: 'Établi - anti-VEGF précoce dans la forme exsudative',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'retinopathie-diabetique', maladie: 'Rétinopathie diabétique',
      niveau: 'individuel',
      axe: 'Ophtalmologie', domaine: 'vision',
      enjeu: '~30% des diabétiques',
      examens: 'Rétinophotographie, OCT, fond d’œil',
      equipement: 'Rétinographe + OCT',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tout diabétique', rythme: 'Annuelle',
      preuve: 'Établi - laser et anti-VEGF préservent la vision',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'cataracte', maladie: 'Cataracte',
      niveau: 'individuel',
      axe: 'Ophtalmologie', domaine: 'vision',
      enjeu: 'Première cause de chirurgie en France',
      examens: 'Acuité, lampe à fente, biométrie',
      equipement: 'Plateau ophtalmologique',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 60 ans', rythme: 'Bisannuelle',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'presbyacousie-et-surdites', maladie: 'Presbyacousie et surdités',
      niveau: 'individuel',
      axe: 'ORL', domaine: 'audition',
      enjeu: 'Plus de 60% après 75 ans ; appareillage tardif',
      examens: 'Otoscopie, audiométrie tonale et vocale, tympanométrie',
      equipement: 'Plateau audiologie',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: '> 50 ans, exposition au bruit', rythme: 'Bisannuelle',
      preuve: 'Établi - lien avec le déclin cognitif et l’isolement',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'd’audiométrie.',
      arbitrage: [] },
    { origine: 'matrice', id: 'vih', maladie: 'VIH',
      niveau: 'individuel',
      axe: 'Infectieux', domaine: 'inflammation',
      enjeu: '~24 000 personnes ignorent leur séropositivité en France',
      examens: 'Sérologie combinée 4e génération',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous une fois dans la vie', rythme: 'Une fois puis selon exposition',
      preuve: 'Établi - TasP, espérance de vie normale',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
      pourquoi:
        'Ces trois infections peuvent rester silencieuses des années, elles se traitent, et ' +
        'le traitement change le pronostic et la transmission. Le rapport bénéfice-coût du ' +
        'dépistage est parmi les mieux établis.',
      limites:
        'Un résultat positif demande un test de confirmation avant toute annonce. ' +
        'L’annonce est un acte médical, jamais un envoi de résultat.',
      role: 'Sérologies prescrites en consultation, résultats rendus par le médecin.',
      source: 'Recommandations françaises de dépistage du VIH et des hépatites virales.',
      arbitrage: [] },
    { origine: 'matrice', id: 'ist-bacteriennes-syphilis-chlamydia-go', maladie: 'IST bactériennes (syphilis, chlamydia, gonocoque)',
      niveau: 'individuel',
      axe: 'Infectieux', domaine: 'inflammation',
      enjeu: 'Incidence en forte hausse',
      examens: 'TPHA-VDRL, PCR multiplex multi-sites',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Sexuellement actif, prioritaire < 25 ans et HSH', rythme: 'Annuelle si exposition',
      preuve: 'Établi - traitement et prévention de la transmission',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'anemie-et-carences-fer-b12-folates', maladie: 'Anémie et carences (fer, B12, folates)',
      niveau: 'individuel',
      axe: 'Hématologie', domaine: 'hematologie',
      enjeu: 'Carence martiale chez 20-25% des femmes en âge de procréer',
      examens: 'NFS, ferritine, CST, B12, folates',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous', rythme: 'Annuelle',
      preuve: 'Établi - correction simple, gain fonctionnel net',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: ['Vitamine B12', 'Folates (B9)'] },
    { origine: 'matrice', id: 'carence-en-vitamine-d', maladie: 'Carence en vitamine D',
      niveau: 'individuel',
      axe: 'Métabolique', domaine: 'metabolisme',
      enjeu: 'Insuffisance chez la majorité de la population l’hiver',
      examens: '25-OH-vitamine D',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous', rythme: 'Annuelle',
      preuve: 'Nuance - bénéfice osseux établi, extra-osseux débattu',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: ['25-OH-vitamine D'] },
    { origine: 'matrice', id: 'troubles-depressifs-et-anxieux', maladie: 'Troubles dépressifs et anxieux',
      niveau: 'individuel',
      axe: 'Santé mentale', domaine: 'sommeil',
      enjeu: '~10% de prévalence annuelle',
      examens: 'PHQ-9, GAD-7, entretien',
      equipement: 'Questionnaires validés',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous', rythme: 'Annuelle',
      preuve: 'Établi - dépistage utile si parcours de soins organisé',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: true,
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
              'avant déploiement.',
      arbitrage: [] },
    { origine: 'matrice', id: 'mesusage-de-l-alcool-et-dependance-tab', maladie: 'Mésusage de l’alcool et dépendance tabagique',
      niveau: 'individuel',
      axe: 'Addictologie', domaine: 'respiration',
      enjeu: 'Alcool : 10% des adultes en mésusage ; tabac : 25%',
      examens: 'AUDIT-C, Fagerstrom, GGT, VGM',
      equipement: 'Questionnaires + laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Tous', rythme: 'Annuelle',
      preuve: 'Établi - intervention brève efficace',
      pec: 'mbp', pecTexte: 'Adossable à Mon Bilan Prévention',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'troubles-cognitifs-debutants', maladie: 'Troubles cognitifs débutants',
      niveau: 'individuel',
      axe: 'Neurologie', domaine: 'sommeil',
      enjeu: '~8% après 65 ans',
      examens: 'MMSE/MoCA, TSH, B12, bilan biologique d’élimination',
      equipement: 'Tests + laboratoire',
      plateau: 'orientation', plateauTexte: 'Le plateau permet de repérer et d’orienter, pas de conclure',
      population: 'Plainte mnésique, > 75 ans', rythme: 'Sur plainte',
      preuve: 'Nuance - dépistage systématique non recommandé',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'hypogonadisme-masculin', maladie: 'Hypogonadisme masculin',
      niveau: 'individuel',
      axe: 'Endocrinien', domaine: 'thyroide',
      enjeu: 'Symptomatique chez 2-6% des hommes',
      examens: 'Testostérone totale et libre, SHBG, LH/FSH',
      equipement: 'Laboratoire',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Asthénie, dysfonction érectile, IMC élevé', rythme: 'Sur symptômes',
      preuve: 'Établi si symptomatique et biologiquement confirmé',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'sopk', maladie: 'SOPK',
      niveau: 'individuel',
      axe: 'Gynéco-endocrinien', domaine: 'thyroide',
      enjeu: '8-13% des femmes en âge de procréer',
      examens: 'Testostérone, SHBG, AMH, LH/FSH, échographie pelvienne',
      equipement: 'Laboratoire + échographe',
      plateau: 'complet', plateauTexte: 'Réalisable sur le plateau des centres',
      population: 'Troubles du cycle, hirsutisme, infertilité', rythme: 'Sur symptômes',
      preuve: 'Établi - prévention du diabète et de l’infertilité',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'infertilite-bilan-initial-du-couple', maladie: 'Infertilité (bilan initial du couple)',
      niveau: 'individuel',
      axe: 'Gynéco-endocrinien', domaine: 'thyroide',
      enjeu: '1 couple sur 6',
      examens: 'AMH, FSH, LH, TSH, échographie, spermogramme',
      equipement: 'Laboratoire + échographe ; spermogramme selon plateau',
      plateau: 'partiel', plateauTexte: 'Partiellement réalisable : une partie est adressée à l’extérieur',
      population: 'Absence de grossesse après 12 mois', rythme: 'Sur demande',
      preuve: 'Établi',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] },
    { origine: 'matrice', id: 'predisposition-hereditaire-au-cancer-b', maladie: 'Prédisposition héréditaire au cancer (BRCA, Lynch)',
      niveau: 'individuel',
      axe: 'Oncogénétique', domaine: 'depistage',
      enjeu: 'BRCA : 1/400 ; Lynch : 1/300',
      examens: 'Score d’Eisinger, critères d’Amsterdam, panel génétique',
      equipement: 'Laboratoire + oncogénétique',
      plateau: 'orientation', plateauTexte: 'Le plateau permet de repérer et d’orienter, pas de conclure',
      population: 'Antécédents familiaux évocateurs', rythme: 'Une fois',
      preuve: 'Établi - surveillance renforcée et chirurgie préventive',
      pec: 'am', pecTexte: 'Remboursable sur indication médicale individuelle et tracée',
      redige: false,
      arbitrage: [] }
  ],

  /* ==================================================================
     LES VINGT ET UNE LIGNES SOUMISES À ARBITRAGE

     Reprises telles quelles de l'onglet Revue médicale. Ce sont les
     lignes porteuses d'une restriction opposable ou d'un risque de
     surdiagnostic documenté. Cinq familles, d'après la note de cadrage :
     restriction opposable de nomenclature, dépistage non recommandé ou
     surdiagnostic, marqueurs sans indication en dépistage, indications
     conditionnées dont le critère reste à fixer, cadre spécialisé
     obligatoire.

     Elles sont affichées côté médecin, avec leur restriction, parce que
     c'est exactement ce qu'il doit avoir sous les yeux avant de se
     prononcer.
     ================================================================== */
  revue: [
    { idCatalogue: 17, examen: 'Vitamine B12', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle', declencheur: 'Tous (prioritaire >50 ans, végétariens, metformine, IPP)',
      restriction: 'Indication conditionnée : anémie ou macrocytose, symptômes neurologiques, régime végétarien ou végétalien, metformine, IPP au long cours, chirurgie bariatrique, sujet âge.' },
    { idCatalogue: 18, examen: 'Folates (B9)', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle', declencheur: 'Tous',
      restriction: 'Indication conditionnée : anémie ou macrocytose, alcool, dénutrition, projet de grossesse, malabsorption.' },
    { idCatalogue: 27, examen: 'Glycémie veineuse à jeun', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle', declencheur: 'Tous',
      restriction: 'Indication conditionnée par les critères de risque de diabète. Pas de dosage annuel systématique en population générale.' },
    { idCatalogue: 28, examen: 'HbA1c', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle', declencheur: 'Tous',
      restriction: 'Indication conditionnée : âge, IMC, antécédents familiaux, score FINDRISC, antécédents de diabète gestationnel. Pas de dosage annuel systématique chez l’adulte jeune sans facteur de risque.' },
    { idCatalogue: 54, examen: 'Lipoprotéine(a) - Lp(a)', palier: 'Socle', base: 'C',
      periodicite: 'Une fois dans la vie', declencheur: 'Tous (dosage unique)',
      restriction: 'Vérifier l’inscription et les conditions de prise en charge dans la TNB en vigueur. A défaut, acte hors nomenclature à facturer à l’abonnement avec mention NR.' },
    { idCatalogue: 69, examen: 'TSH', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle', declencheur: 'Tous',
      restriction: 'Pas de dépistage systématique de la dysthyroïdie chez l’adulte asymptomatique. Indication à documenter (symptômes, goitre, antécédents familiaux, traitement à risque, femme de plus de 50 ans selon le protocole retenu).' },
    { idCatalogue: 79, examen: 'Test de freinage minute à la dexaméthasone', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur alerte', declencheur: 'Suspicion de Cushing',
      restriction: 'Test dynamique : nécessite un protocole écrit et une interprétation spécialisée. Pas un acte de dépistage.' },
    { idCatalogue: 83, examen: '25-OH-vitamine D', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur indication uniquement', declencheur: 'Une des six indications limitatives de la NABM : suspicion de rachitisme ou d’ostéomalacie, chutes répétées du sujet âge, suivi de transplanté rénal au-delà de trois mois, chirurgie bariatrique, respect du RCP d’un médicament l’imposant',
      restriction: 'RESTRICTION OPPOSABLE. Décision UNCAM du 25 novembre 2021 : prise en charge limitée à six indications retenues par la HAS, reprises dans la NABM comme condition limitative. Hors indication, la mention NR est obligatoire sur l’ordonnance et l’acte reste à la charge du patient. En l’absence de mention, le laboratoire est exposé. Ne peut donc pas figurer au socle annuel systématique.' },
    { idCatalogue: 133, examen: 'Sérologie Lyme (ELISA puis Western Blot)', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur symptômes', declencheur: 'Piqûre de tique, arthrite, atteinte neuro',
      restriction: 'Indications encadrées par la HAS. Sérologie non indiquée en l’absence de manifestation clinique compatible.' },
    { idCatalogue: 153, examen: 'PSA total', palier: 'Socle', base: 'B',
      periodicite: 'Annuelle ou bisannuelle', declencheur: 'Homme 50-70 ans après décision partagée (45 si antécédents familiaux/origine afro-caribéenne)',
      restriction: 'Pas de dépistage organisé en France et pas de recommandation de dépistage systématique par la HAS. La décision partagée doit être tracée dans le dossier. Le maintien au socle est un choix à assumer explicitement, avec information préalable sur le risque de surdiagnostic.' },
    { idCatalogue: 155, examen: 'CA-125', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur alerte', declencheur: 'Masse ovarienne à l’échographie, antécédents familiaux',
      restriction: 'Non indiqué en dépistage en population générale. Réservé à l’exploration d’une anomalie constatée à l’imagerie ou à la surveillance d’un risque génétique documenté.' },
    { idCatalogue: 156, examen: 'HE4 et score ROMA', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur alerte', declencheur: 'Masse ovarienne',
      restriction: 'Non indiqué en dépistage. Réservé à la stratification d’une masse ovarienne déjà identifiée.' },
    { idCatalogue: 162, examen: 'Panel BRCA1/BRCA2 (cadre oncogénétique)', palier: 'Ciblé', base: 'B',
      periodicite: 'Une fois', declencheur: 'Score d’Eisinger >= 3, consultation d’oncogénétique préalable',
      restriction: 'Prescription réservée au cadre oncogénétique, après consultation dédiée et consentement écrit. Ne peut pas être proposé comme option d’abonnement.' },
    { idCatalogue: 163, examen: 'Panel MMR / syndrome de Lynch (cadre oncogénétique)', palier: 'Ciblé', base: 'B',
      periodicite: 'Une fois', declencheur: 'Critères d’Amsterdam/Bethesda, consultation d’oncogénétique',
      restriction: 'Prescription réservée au cadre oncogénétique, après consultation dédiée et consentement écrit.' },
    { idCatalogue: 193, examen: 'Écho-doppler carotidien : EMI et plaques', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur indication', declencheur: 'Souffle cervical, AOMI ou anévrisme connu, risque CV élevé à très élevé, antécédents d’AVC ou d’AIT',
      restriction: 'Aucun dépistage systématique recommandé en population générale. L’indication doit être individuelle et tracée.' },
    { idCatalogue: 208, examen: 'Échographie thyroïdienne (score EU-TIRADS)', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur alerte', declencheur: 'Nodule palpable, dysthyroïdie, antécédents d’irradiation',
      restriction: 'Pas de dépistage systématique du nodule thyroïdien : risque de surdiagnostic documenté. Indication limitée au nodule palpable, à la dysthyroïdie ou aux antécédents d’irradiation cervicale.' },
    { idCatalogue: 209, examen: 'Cytoponction thyroïdienne échoguidée (Bethesda)', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur alerte', declencheur: 'EU-TIRADS 4-5 ou nodule > 20 mm',
      restriction: 'Vigilance surdiagnostic. A réserver aux nodules EU-TIRADS 4 ou 5, jamais en dépistage.' },
    { idCatalogue: 210, examen: 'Échographie abdominale : foie, stéatose, contours', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur indication', declencheur: 'Anomalie du bilan hépatique, FIB-4 supérieur à 1,3, syndrome métabolique, consommation d’alcool à risque',
      restriction: 'Pas de dépistage systématique. L’indication doit découler d’une anomalie biologique ou d’un facteur de risque documenté.' },
    { idCatalogue: 221, examen: 'Densitométrie osseuse (DXA) : T-score rachis et hanche', palier: 'Ciblé', base: 'B',
      periodicite: 'Sur indication, puis tous les 3 à 5 ans', declencheur: 'Fracture de fragilité, corticothérapie prolongée, ménopause avec facteur de risque, IMC bas, hyperparathyroïdie, FRAX au-delà du seuil d’intervention',
      restriction: 'Prise en charge subordonnée à des indications listées. Vérifier la liste en vigueur avant toute inscription au socle. Un examen réalisé hors indication n’est pas remboursable.' },
    { idCatalogue: 282, examen: 'TDM thoracique faible dose (dépistage)', palier: 'Hors abonnement', base: 'B',
      periodicite: 'Annuelle si éligible', declencheur: 'Fumeur 50-74 ans, >= 20 paquets-années (cadre expérimental en France)',
      restriction: 'Le dépistage du cancer bronchique par TDM faible dose n’est pas un programme organisé en France. Vérifier l’état du cadre expérimental avant toute inclusion dans une offre.' },
    { idCatalogue: 288, examen: 'IRM corps entier de dépistage', palier: 'Premium', base: 'C',
      periodicite: 'Selon protocole à définir', declencheur: 'Périmètre à arbitrer - faisabilité réglementaire en cours d’étude',
      restriction: 'Aucun cadre de prise en charge. Taux d’incidentalomes élevé. La faisabilité réglementaire, le protocole de gestion des incidentalomes et l’information préalable du patient doivent être établis avant toute offre.' }
  ],

  /* ==================================================================
     CE QUE LE PARCOURS NE FAIT PAS, ET POURQUOI
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

  plateauLib: function (v) {
    for (var i = 0; i < this.plateaux.length; i++) {
      if (this.plateaux[i].v === v) return this.plateaux[i].l;
    }
    return v;
  },

  /* Pathologies d'un axe médical, pour l'affichage groupé. */
  parAxe: function () {
    var g = {}, o = [];
    for (var i = 0; i < this.liste.length; i++) {
      var a = this.liste[i].axe;
      if (!g[a]) { g[a] = []; o.push(a); }
      g[a].push(this.liste[i]);
    }
    return o.map(function (a) { return { axe: a, liste: g[a] }; });
  },

  duDomaine: function (domaineId) {
    var out = [];
    for (var i = 0; i < this.liste.length; i++) {
      if (this.liste[i].domaine === domaineId) out.push(this.liste[i]);
    }
    return out;
  },

  /* Les entrées dont un examen a fait l'objet de l'arbitrage du 4 août
     2026. Le champ « arbitrage » listait ce qui était en attente ; il
     liste maintenant ce qui est visé, d'où le renommage du helper. */
  arbitres: function () {
    var out = [];
    for (var i = 0; i < this.liste.length; i++) {
      if ((this.liste[i].arbitrage || []).length) out.push(this.liste[i]);
    }
    return out;
  }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = DEPISTAGES; }
