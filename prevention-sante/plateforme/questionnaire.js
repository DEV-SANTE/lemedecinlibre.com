/* =====================================================================
   LISIBILITÉ DU QUESTIONNAIRE (30 juillet 2026)

   Chaque section porte deux ajouts destinés à la personne qui répond, et
   à personne d'autre :

     photo       — la photographie du domaine concerné, prise dans le
                   catalogue local (droits détenus). Elle donne un repère
                   visuel : on sait de quoi va parler la page avant de
                   lire la première question.
     paragraphes — deux paragraphes en langage courant, qui disent
                   pourquoi ces questions sont posées et ce qu'on fera
                   des réponses.

   Ces textes sont les MÊMES POUR TOUT LE MONDE et ne dépendent d'aucune
   réponse déjà donnée : ils décrivent la section, jamais la personne. Un
   paragraphe qui changerait selon une réponse serait une interprétation
   déguisée, et le vérificateur le refuse.

   Deux sections n'ont volontairement pas de photographie : « Moral et
   anxiété » et « Vos attentes ». Illustrer la souffrance psychique, c'est
   la mettre en scène ; et une page qui demande à quelqu'un ce qu'il
   attend n'a pas besoin d'une image pour être claire.
   ===================================================================== */

/* =====================================================================
   QUESTIONNAIRE DE PRÉVENTION — DÉFINITION
   Version 0.1 — données de test uniquement

   CONTRAINTE CARDINALE (dossier de reprise, section 3.2)
   Ce fichier ne contient QUE des définitions de questions et des
   contenus documentaires statiques. Il ne contient aucune formule,
   aucun seuil appliqué à une réponse, aucune règle produisant une
   information propre à un patient donné.

   Les branchements autorisés sont STRUCTURELS uniquement :
     showIf: { sexe: 'F' }        -> autorisé (structurel)
     showIf: { ageMin: 50 }       -> autorisé (structurel)
     showIf: { score: '>= 11' }   -> INTERDIT, ne jamais introduire

   PROPRIÉTÉ INTELLECTUELLE DES INSTRUMENTS
   Plusieurs instruments sont protégés et leur libellé officiel exige
   une licence pour un usage commercial. Les items ci-dessous recueillent
   la donnée sous-jacente dans une formulation neutre, et NON le libellé
   validé. Les champs `licence` signalent ce qui doit être remplacé par
   le libellé officiel une fois la licence obtenue.
     - Epworth (ESS)  : licence requise (usage commercial)
     - STOP-BANG      : licence requise (usage commercial)
     - HHIE-S         : vérifier les conditions de reproduction
     - PHQ-2 / PHQ-9  : libre, aucune autorisation requise
     - GAD-7          : libre, aucune autorisation requise
     - AUDIT-C        : OMS, libre
     - mMRC           : descriptif, libre
     - Fitzpatrick    : classification descriptive, libre
   ===================================================================== */

const OUI_NON = [
  { v: 'oui', l: 'Oui' },
  { v: 'non', l: 'Non' },
  { v: 'ne_sais_pas', l: 'Je ne sais pas' }
];

const FREQ_0_3 = [
  { v: '0', l: 'Jamais' },
  { v: '1', l: 'Rarement' },
  { v: '2', l: 'Souvent' },
  { v: '3', l: 'Très souvent' }
];

/* PHQ / GAD : échelle de fréquence sur deux semaines (domaine public) */
const FREQ_PHQ = [
  { v: '0', l: 'Jamais' },
  { v: '1', l: 'Plusieurs jours' },
  { v: '2', l: 'Plus de la moitié des jours' },
  { v: '3', l: 'Presque tous les jours' }
];

const QUESTIONNAIRE = {
  version: '0.1',
  statut: 'TEST — patients fictifs uniquement',

  modules: [

    /* ============================================================ */
    {
      id: 'identite',
      titre: 'Identité',
      photo: { id: 'consultation', dossier: 'modules' },
      paragraphes: [
        'Cette première page ne sert qu’à savoir qui vous êtes et à retrouver votre dossier le jour de la visite. Aucune de ces informations n’est utilisée pour autre chose.',
        'Sur cet environnement de test, n’inscrivez qu’une identité inventée. Rien de ce que vous saisissez ici n’est hébergé chez un hébergeur certifié pour les données de santé.'
      ],
      intro: 'Dossier de test. N’utilisez que des identités fictives : aucune donnée réelle ne doit être saisie sur cet environnement.',
      questions: [
        { id: 'nom', type: 'text', label: 'Nom (fictif)', required: true },
        { id: 'prenom', type: 'text', label: 'Prénom (fictif)', required: true },
        { id: 'annee_naissance', type: 'number', label: 'Année de naissance', min: 1900, max: 2026, required: true },
        { id: 'sexe', type: 'radio', label: 'Sexe', required: true,
          options: [{ v: 'F', l: 'Féminin' }, { v: 'M', l: 'Masculin' }, { v: 'autre', l: 'Autre / non précisé' }] },
        { id: 'profession', type: 'text', label: 'Profession' }
      ]
    },

    /* ============================================================ */
    {
      id: 'socle',
      titre: 'Socle',
      photo: { id: 'condition-physique', dossier: 'domaines' },
      paragraphes: [
        'Ces questions sont posées à tout le monde, quel que soit l’âge et quel que soit le motif de la visite. Elles donnent au médecin le contexte sans lequel aucun résultat ne se lit : votre poids, votre tension, ce que vous consommez, ce que vous faites bouger, et ce qui existe dans votre famille.',
        'Répondez au mieux, sans chercher la précision au gramme. Un ordre de grandeur juste vaut mieux qu’un chiffre exact inventé, et le médecin reprendra tout cela avec vous.'
      ],
      intro: 'Ces informations sont recueillies pour tous. Elles sont transmises telles quelles au médecin.',
      questions: [
        { id: 'taille', type: 'number', label: 'Taille (cm)', min: 100, max: 250,
          aide: 'La taille et le poids sont transmis bruts. Aucun indice n’est calculé par la plateforme.' },
        { id: 'poids', type: 'number', label: 'Poids (kg)', min: 25, max: 300 },

        { id: 'ta_syst', type: 'number', label: 'Tension artérielle — systolique (mmHg)', min: 60, max: 260,
          aide: 'Mesurée sur place par le professionnel de santé.' },
        { id: 'ta_diast', type: 'number', label: 'Tension artérielle — diastolique (mmHg)', min: 30, max: 160 },

        { id: 'tabac_statut', type: 'radio', label: 'Tabac', required: true,
          options: [
            { v: 'jamais', l: 'Je n’ai jamais fumé' },
            { v: 'ancien', l: 'J’ai fumé, j’ai arrêté' },
            { v: 'actuel', l: 'Je fume actuellement' }
          ] },
        { id: 'tabac_cig_jour', type: 'number', label: 'Nombre de cigarettes par jour', min: 0, max: 100,
          aide: 'Recueilli brut. Le calcul des paquets-années est réalisé par le médecin, pas par la plateforme.' },
        { id: 'tabac_annees', type: 'number', label: 'Pendant combien d’années au total ?', min: 0, max: 80 },
        { id: 'tabac_arret_annee', type: 'number', label: 'Si arrêt : année d’arrêt', min: 1940, max: 2026 },
        { id: 'autres_produits', type: 'checkbox', label: 'Autres consommations',
          options: [
            { v: 'cannabis', l: 'Cannabis' },
            { v: 'vape', l: 'Cigarette électronique' },
            { v: 'chicha', l: 'Chicha' },
            { v: 'autres', l: 'Autres substances' }
          ] },

        /* AUDIT-C — OMS, libre de reproduction */
        { id: 'auditc_1', type: 'radio', label: 'À quelle fréquence consommez-vous de l’alcool ?', instrument: 'AUDIT-C',
          options: [
            { v: '0', l: 'Jamais' },
            { v: '1', l: 'Une fois par mois ou moins' },
            { v: '2', l: 'Deux à quatre fois par mois' },
            { v: '3', l: 'Deux à trois fois par semaine' },
            { v: '4', l: 'Quatre fois par semaine ou plus' }
          ] },
        { id: 'auditc_2', type: 'radio', label: 'Les jours où vous buvez, combien de verres consommez-vous ?', instrument: 'AUDIT-C',
          options: [
            { v: '0', l: '1 ou 2' }, { v: '1', l: '3 ou 4' }, { v: '2', l: '5 ou 6' },
            { v: '3', l: '7 à 9' }, { v: '4', l: '10 ou plus' }
          ] },
        { id: 'auditc_3', type: 'radio', label: 'À quelle fréquence consommez-vous six verres ou plus en une même occasion ?', instrument: 'AUDIT-C',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' },
            { v: '2', l: 'Une fois par mois' }, { v: '3', l: 'Une fois par semaine' },
            { v: '4', l: 'Tous les jours ou presque' }
          ] },

        { id: 'activite_min', type: 'number', label: 'Activité physique — minutes par semaine', min: 0, max: 2000,
          aide: 'Marche rapide, sport, vélo, tout ce qui essouffle un peu.' },
        { id: 'sedentarite', type: 'radio', label: 'Temps passé assis par jour',
          options: [
            { v: 'moins4', l: 'Moins de 4 heures' }, { v: '4a8', l: 'De 4 à 8 heures' },
            { v: 'plus8', l: 'Plus de 8 heures' }
          ] },

        { id: 'atcd_perso', type: 'checkbox', label: 'Antécédents personnels',
          options: [
            { v: 'hta', l: 'Hypertension artérielle' },
            { v: 'diabete', l: 'Diabète' },
            { v: 'cholesterol', l: 'Cholestérol élevé' },
            { v: 'infarctus', l: 'Infarctus ou angine de poitrine' },
            { v: 'avc', l: 'Accident vasculaire cérébral' },
            { v: 'cancer', l: 'Cancer' },
            { v: 'asthme', l: 'Asthme' },
            { v: 'bpco', l: 'Bronchite chronique ou BPCO' },
            { v: 'apnees', l: 'Apnées du sommeil' },
            { v: 'thyroide', l: 'Maladie de la thyroïde' },
            { v: 'rein', l: 'Maladie rénale' },
            { v: 'foie', l: 'Maladie du foie' },
            { v: 'depression', l: 'Dépression ou anxiété traitée' },
            { v: 'chirurgie', l: 'Intervention chirurgicale' }
          ] },
        { id: 'atcd_perso_precisions', type: 'textarea', label: 'Précisions sur vos antécédents' },

        { id: 'atcd_fam', type: 'checkbox', label: 'Antécédents familiaux',
          aide: 'Parents, frères et sœurs, enfants.',
          options: [
            { v: 'idm_precoce', l: 'Infarctus ou AVC avant 55 ans chez un homme, ou avant 65 ans chez une femme' },
            { v: 'mort_subite', l: 'Mort subite avant 50 ans' },
            { v: 'cardiomyopathie', l: 'Maladie du muscle cardiaque' },
            { v: 'diabete', l: 'Diabète' },
            { v: 'cancer_colon', l: 'Cancer du côlon ou du rectum' },
            { v: 'cancer_sein', l: 'Cancer du sein' },
            { v: 'cancer_prostate', l: 'Cancer de la prostate' },
            { v: 'melanome', l: 'Mélanome' },
            { v: 'glaucome', l: 'Glaucome' }
          ] },

        { id: 'traitements', type: 'textarea', label: 'Traitements en cours',
          aide: 'Nom et dose si vous les connaissez. Y compris contraception, compléments et automédication.' },
        { id: 'allergies', type: 'textarea', label: 'Allergies connues' },

        { id: 'expo_pro', type: 'checkbox', label: 'Expositions professionnelles, actuelles ou passées',
          options: [
            { v: 'amiante', l: 'Amiante' },
            { v: 'poussieres', l: 'Poussières, farines, bois, silice' },
            { v: 'solvants', l: 'Solvants, peintures, colles' },
            { v: 'bruit', l: 'Bruit important' },
            { v: 'soleil', l: 'Travail en extérieur, exposition au soleil' },
            { v: 'nuit', l: 'Travail de nuit ou en horaires décalés' },
            { v: 'ecrans', l: 'Travail sur écran de façon prolongée' }
          ] },
        { id: 'expo_pro_precisions', type: 'textarea', label: 'Précisions sur ces expositions (métier, durée)' },

        { id: 'vaccins', type: 'checkbox', label: 'Vaccinations que vous pensez à jour',
          options: [
            { v: 'dtp', l: 'Diphtérie, tétanos, poliomyélite' },
            { v: 'grippe', l: 'Grippe saisonnière' },
            { v: 'covid', l: 'Covid-19' },
            { v: 'hpv', l: 'Papillomavirus' },
            { v: 'pneumocoque', l: 'Pneumocoque' },
            { v: 'zona', l: 'Zona' },
            { v: 'hepatiteb', l: 'Hépatite B' }
          ] },
        { id: 'carnet_vaccinal', type: 'radio', label: 'Pourrez-vous apporter votre carnet de vaccination ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'respiratoire',
      titre: 'Respiration',
      photo: { id: 'respiration', dossier: 'domaines' },
      paragraphes: [
        'Le souffle se dégrade lentement, sur des années, et on s’y adapte sans s’en apercevoir : on prend l’ascenseur, on marche moins vite, on porte moins. C’est pour cela qu’on pose la question au lieu d’attendre qu’elle soit posée.',
        'Les cinq premières questions sont celles d’un questionnaire de repérage publié, reproduites mot pour mot. Elles ne donnent aucun score ici : elles sont transmises telles quelles au médecin, qui décidera avec vous si une mesure du souffle est utile.'
      ],
      intro: 'Les cinq premières questions reproduisent mot pour mot un questionnaire publié de repérage. Les suivantes complètent le tableau clinique.',
      questions: [
        /* ------------------------------------------------------------
           REPÉRAGE BPCO — LES CINQ QUESTIONS PUBLIÉES, MOT POUR MOT

           Instrument diffusé par la HAS, repris de GOLD. Sa valeur tient
           entièrement à sa formulation : « Toussez-vous souvent ? » et
           « Toussez-vous depuis plus de trois mois ? » ne sont pas la
           même question, et la seconde ne peut pas servir de réponse à
           la première. Un instrument reformulé n'est plus l'instrument.

           TROIS REDONDANCES ASSUMÉES. L'âge et le statut tabagique sont
           déjà recueillis au module Socle, et l'essoufflement est
           abordé plus bas. On les repose quand même : les cinq réponses
           doivent venir de l'instrument tel qu'il est administré, pas
           d'un assemblage de réponses empruntées ailleurs. Le coût est
           d'une trentaine de secondes pour la personne.

           AUCUN DÉCOMPTE ICI. Le repère publié — deux « oui » constituent
           un signal d'alerte — est du contenu documentaire : il figure
           au Référentiel, à l'écran du médecin, qui compte lui-même. La
           plateforme n'additionne rien, ne signale rien, ne met rien en
           avant. Compter cinq cases est l'affaire de quelques secondes ;
           les faire compter par le logiciel ferait de cette page un
           dispositif médical.
        ------------------------------------------------------------ */
        { id: 'bpco5_toux', type: 'radio', label: 'Toussez-vous souvent ?',
          options: OUI_NON, instrument: 'Repérage BPCO — 5 questions',
          aide: 'Questionnaire publié de repérage. Répondez spontanément, sans chercher à interpréter.' },
        { id: 'bpco5_expecto', type: 'radio', label: 'Avez-vous fréquemment une toux grasse ou qui ramène des crachats ?',
          options: OUI_NON, instrument: 'Repérage BPCO — 5 questions' },
        { id: 'bpco5_essouffle', type: 'radio', label: 'Êtes-vous plus facilement essoufflé que les personnes de votre âge ?',
          options: OUI_NON, instrument: 'Repérage BPCO — 5 questions' },
        { id: 'bpco5_age40', type: 'radio', label: 'Avez-vous plus de 40 ans ?',
          options: OUI_NON, instrument: 'Repérage BPCO — 5 questions',
          aide: 'Votre année de naissance est déjà connue. Cette question fait partie du questionnaire publié : la retirer changerait l’instrument.' },
        { id: 'bpco5_tabac', type: 'radio', label: 'Avez-vous fumé ou fumez-vous ?',
          options: OUI_NON, instrument: 'Repérage BPCO — 5 questions' },

        /* Questions complémentaires, hors instrument. */
        { id: 'resp_toux', type: 'radio', label: 'Toussez-vous depuis plus de trois mois ?', options: OUI_NON },
        { id: 'resp_expecto', type: 'radio', label: 'Crachez-vous régulièrement, notamment le matin ?', options: OUI_NON },
        { id: 'resp_sifflements', type: 'radio', label: 'Avez-vous des sifflements dans la poitrine ?', options: OUI_NON },
        { id: 'resp_infections', type: 'radio', label: 'Avez-vous eu plusieurs bronchites ou pneumonies ces dernières années ?', options: OUI_NON },
        { id: 'resp_reveil_nuit', type: 'radio', label: 'Êtes-vous réveillé la nuit par une gêne respiratoire ou une toux ?', options: OUI_NON },

        /* mMRC — échelle descriptive, libre */
        { id: 'mmrc', type: 'radio', label: 'Comment décrivez-vous votre essoufflement au quotidien ?',
          instrument: 'mMRC',
          options: [
            { v: '0', l: 'Je ne suis essoufflé qu’en cas d’effort intense' },
            { v: '1', l: 'Je suis essoufflé en marchant vite ou en montant une côte légère' },
            { v: '2', l: 'Je marche moins vite que les personnes de mon âge, ou je dois m’arrêter en marchant à mon rythme' },
            { v: '3', l: 'Je dois m’arrêter après une centaine de mètres ou après quelques minutes de marche' },
            { v: '4', l: 'Je suis essoufflé en m’habillant, ou je ne peux pas quitter mon domicile' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'sommeil',
      titre: 'Sommeil',
      photo: { id: 'sommeil', dossier: 'domaines' },
      paragraphes: [
        'Un sommeil trop court ou trop haché finit par se voir ailleurs : la tension, le poids, l’humeur, la vigilance au volant. Ces questions cherchent moins la performance que la gêne réelle dans la journée.',
        'Si vous ne savez pas répondre parce que vous dormez seul et que personne ne vous a jamais dit si vous ronflez, dites-le simplement au médecin. C’est une information en soi.'
      ],
      intro: 'Ces questions portent sur votre sommeil et sur la somnolence en journée.',
      questions: [
        { id: 'som_ronflement', type: 'radio', label: 'Ronflez-vous fortement, au point d’être entendu à travers une porte ?', options: OUI_NON, instrument: 'STOP-BANG' },
        { id: 'som_apnees_constatees', type: 'radio', label: 'Votre entourage a-t-il observé des pauses respiratoires pendant votre sommeil ?', options: OUI_NON, instrument: 'STOP-BANG' },
        { id: 'som_fatigue_jour', type: 'radio', label: 'Vous sentez-vous fatigué ou peu reposé au réveil, de façon habituelle ?', options: OUI_NON, instrument: 'STOP-BANG' },
        { id: 'som_tour_cou', type: 'number', label: 'Tour de cou (cm), si vous le connaissez', min: 25, max: 70, instrument: 'STOP-BANG' },
        { id: 'som_volant', type: 'radio', label: 'Vous êtes-vous déjà endormi ou senti au bord de l’endormissement en conduisant ?', options: OUI_NON },
        { id: 'som_conducteur_pro', type: 'radio', label: 'Conduisez-vous dans le cadre de votre travail ?', options: OUI_NON },
        { id: 'som_duree', type: 'number', label: 'Nombre d’heures de sommeil par nuit, en moyenne', min: 0, max: 16 },
        { id: 'som_endormissement', type: 'radio', label: 'Avez-vous des difficultés à vous endormir ou des réveils prolongés ?', options: OUI_NON },

        /* Échelle de somnolence — structure à 8 situations, cotation 0 à 3.
           Libellés neutres. Le libellé officiel de l'échelle d'Epworth
           doit être substitué après obtention de la licence. */
        { id: 'ess_sep', type: 'separateur',
          label: 'Somnolence en journée',
          aide: 'Indiquez votre probabilité de somnoler dans chacune de ces situations, même si vous ne les avez pas vécues récemment.',
          licence: 'Structure inspirée d’une échelle de somnolence à 8 items cotés de 0 à 3. Libellés provisoires : substituer le libellé officiel sous licence avant tout usage clinique ou commercial.' },
        { id: 'ess_1', type: 'radio', label: 'Assis en train de lire', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_2', type: 'radio', label: 'En regardant la télévision', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_3', type: 'radio', label: 'Assis sans activité dans un lieu public', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_4', type: 'radio', label: 'Comme passager d’un véhicule, pendant une heure sans arrêt', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_5', type: 'radio', label: 'Allongé l’après-midi pour se reposer', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_6', type: 'radio', label: 'Assis en train de parler avec quelqu’un', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_7', type: 'radio', label: 'Assis tranquillement après un repas sans alcool', options: FREQ_0_3, instrument: 'Somnolence' },
        { id: 'ess_8', type: 'radio', label: 'Au volant, immobilisé quelques minutes dans la circulation', options: FREQ_0_3, instrument: 'Somnolence' }
      ]
    },

    /* ============================================================ */
    {
      id: 'cutane',
      titre: 'Peau',
      photo: { id: 'peau', dossier: 'domaines' },
      paragraphes: [
        'La peau est le seul organe qu’on peut examiner entièrement à l’œil nu. Ce qui compte n’est pas le nombre de grains de beauté, mais le fait qu’un seul d’entre eux ait changé.',
        'Les coups de soleil de l’enfance comptent encore aujourd’hui : c’est pour cela qu’on vous demande de remonter loin, même si cela paraît sans rapport.'
      ],
      intro: 'La lecture des images et l’examen de la peau sont réalisés par un dermatologue. Aucune analyse automatique n’est faite.',
      questions: [
        { id: 'cut_lesion_nouvelle', type: 'radio', label: 'Avez-vous remarqué une tache ou un grain de beauté nouveau, ou qui a changé, au cours des douze derniers mois ?', options: OUI_NON },
        { id: 'cut_abcde', type: 'checkbox', label: 'Si oui, avez-vous constaté un ou plusieurs de ces changements ?',
          options: [
            { v: 'asymetrie', l: 'Forme devenue asymétrique' },
            { v: 'bords', l: 'Bords irréguliers ou mal délimités' },
            { v: 'couleur', l: 'Plusieurs couleurs, ou une couleur qui a changé' },
            { v: 'diametre', l: 'Taille supérieure à 6 mm, ou qui augmente' },
            { v: 'evolution', l: 'Évolution récente : épaississement, saignement, démangeaison, croûte' }
          ] },
        { id: 'cut_vilain_canard', type: 'radio', label: 'Avez-vous une tache qui ne ressemble pas aux autres ?', options: OUI_NON },
        { id: 'cut_atcd_perso', type: 'radio', label: 'Avez-vous déjà eu un mélanome ou un cancer de la peau ?', options: OUI_NON },
        { id: 'cut_atcd_fam', type: 'radio', label: 'Un parent, frère, sœur ou enfant a-t-il eu un mélanome ?', options: OUI_NON },

        /* Fitzpatrick — classification descriptive */
        { id: 'cut_phototype', type: 'radio', label: 'Comment votre peau réagit-elle au soleil ?', instrument: 'Phototype',
          options: [
            { v: 'I', l: 'Je brûle toujours, je ne bronze jamais' },
            { v: 'II', l: 'Je brûle facilement, je bronze peu et difficilement' },
            { v: 'III', l: 'Je brûle modérément, je bronze progressivement' },
            { v: 'IV', l: 'Je brûle peu, je bronze facilement' },
            { v: 'V', l: 'Je brûle rarement, je bronze beaucoup' },
            { v: 'VI', l: 'Je ne brûle jamais, peau naturellement très pigmentée' }
          ] },
        { id: 'cut_coups_soleil', type: 'radio', label: 'Avez-vous eu des coups de soleil avec cloques pendant l’enfance ou l’adolescence ?', options: OUI_NON },
        { id: 'cut_nb_naevi', type: 'radio', label: 'Combien de grains de beauté avez-vous, approximativement ?',
          options: [
            { v: 'moins20', l: 'Moins de 20' },
            { v: '20a50', l: 'Entre 20 et 50' },
            { v: 'plus50', l: 'Plus de 50' },
            { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },
        { id: 'cut_naevi_atypiques', type: 'radio', label: 'Un médecin vous a-t-il déjà dit que certains de vos grains de beauté étaient atypiques ?', options: OUI_NON },
        { id: 'cut_immunodep', type: 'radio', label: 'Êtes-vous immunodéprimé, ou avez-vous eu une transplantation ?', options: OUI_NON },
        { id: 'cut_uv', type: 'radio', label: 'Avez-vous utilisé des cabines de bronzage ?', options: OUI_NON },
        { id: 'cut_expo_pro', type: 'radio', label: 'Travaillez-vous ou avez-vous travaillé en extérieur de façon prolongée ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'cardio',
      titre: 'Cœur et vaisseaux',
      photo: { id: 'cardiovasculaire', dossier: 'domaines' },
      paragraphes: [
        'Le risque cardiovasculaire ne se lit jamais sur un seul chiffre. Il se construit avec l’âge, la tension, le tabac, les graisses du sang et ce qui est arrivé à vos parents — et c’est pour cela qu’aucune de ces questions ne suffit à elle seule.',
        'Les antécédents familiaux qui pèsent sont ceux qui sont arrivés tôt : un accident cardiaque avant cinquante-cinq ans chez un homme de la famille, avant soixante-cinq chez une femme. Une grand-mère qui a fait un infarctus à quatre-vingt-douze ans ne dit rien de vous.'
      ],
      questions: [
        { id: 'cv_hta_connue', type: 'radio', label: 'Une hypertension artérielle vous a-t-elle déjà été annoncée ?', options: OUI_NON },
        { id: 'cv_diabete', type: 'radio', label: 'Un diabète vous a-t-il déjà été annoncé ?', options: OUI_NON },
        { id: 'cv_bilan_lipidique_date', type: 'text', label: 'Date de votre dernier bilan de cholestérol, si vous la connaissez',
          aide: 'Format libre. Exemple : mars 2025.' },
        { id: 'cv_bilan_lipidique_valeurs', type: 'textarea', label: 'Valeurs de ce bilan, si vous les avez',
          aide: 'Recopiez les chiffres tels quels. Le médecin les interprétera.' },
        { id: 'cv_douleur_thoracique', type: 'radio', label: 'Avez-vous des douleurs ou une oppression dans la poitrine, notamment à l’effort ?', options: OUI_NON },
        { id: 'cv_palpitations', type: 'radio', label: 'Avez-vous des palpitations ou des irrégularités du rythme cardiaque ?', options: OUI_NON },
        { id: 'cv_syncope', type: 'radio', label: 'Avez-vous déjà perdu connaissance, ou eu l’impression d’être au bord du malaise ?', options: OUI_NON },
        { id: 'cv_oedemes', type: 'radio', label: 'Avez-vous des gonflements des chevilles en fin de journée ?', options: OUI_NON },
        { id: 'cv_claudication', type: 'radio', label: 'Ressentez-vous une douleur dans les mollets à la marche, qui cède à l’arrêt ?', options: OUI_NON },
        { id: 'cv_sport_intense', type: 'radio', label: 'Reprenez-vous ou envisagez-vous une activité sportive intense ?', options: OUI_NON },
        { id: 'cv_traitement_risque', type: 'radio', label: 'Prenez-vous un traitement pour le cœur, le rythme cardiaque, ou un traitement psychiatrique ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'vision',
      titre: 'Vision',
      photo: { id: 'vision', dossier: 'domaines' },
      paragraphes: [
        'La vue baisse par les deux yeux à la fois, et le cerveau compense l’un par l’autre : on peut perdre beaucoup d’un côté sans le remarquer. Fermer un œil puis l’autre suffit souvent à s’en apercevoir.',
        'La pression à l’intérieur de l’œil est un sujet distinct de la netteté de la vision : elle peut abîmer le nerf optique sans que la vue centrale change, et longtemps.'
      ],
      questions: [
        { id: 'vis_dernier_examen', type: 'radio', label: 'À quand remonte votre dernier examen des yeux ?',
          options: [
            { v: 'moins1', l: 'Moins d’un an' }, { v: '1a2', l: 'Entre un et deux ans' },
            { v: '2a5', l: 'Entre deux et cinq ans' }, { v: 'plus5', l: 'Plus de cinq ans' },
            { v: 'jamais', l: 'Jamais' }
          ] },
        { id: 'vis_correction', type: 'radio', label: 'Portez-vous des lunettes ou des lentilles ?', options: OUI_NON },
        { id: 'vis_gene_pres', type: 'radio', label: 'Avez-vous du mal à lire de près ?', options: OUI_NON },
        { id: 'vis_gene_loin', type: 'radio', label: 'Avez-vous du mal à voir de loin, ou à conduire la nuit ?', options: OUI_NON },
        { id: 'vis_myopie_forte', type: 'radio', label: 'Avez-vous une myopie importante ?', options: OUI_NON },
        { id: 'vis_cephalees', type: 'radio', label: 'Avez-vous des maux de tête après un effort visuel prolongé ?', options: OUI_NON },
        { id: 'vis_secheresse', type: 'radio', label: 'Avez-vous les yeux secs, irrités ou larmoyants de façon habituelle ?', options: OUI_NON },
        { id: 'vis_eclairs', type: 'radio', label: 'Voyez-vous des éclairs, des mouches volantes récentes ou une ombre dans le champ de vision ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'audition',
      titre: 'Audition',
      photo: { id: 'audition', dossier: 'domaines' },
      paragraphes: [
        'La perte d’audition s’installe si progressivement que ce sont presque toujours les proches qui la remarquent d’abord — le volume de la télévision, les répétitions dans les conversations.',
        'L’exposition au bruit, professionnelle ou de loisir, laisse des traces qui ne se réparent pas. La signaler ne sert pas à juger : elle explique un audiogramme.'
      ],
      intro: 'Ces questions portent sur la gêne ressentie au quotidien.',
      questions: [
        { id: 'aud_expo_pro', type: 'radio', label: 'Êtes-vous ou avez-vous été exposé à un bruit important au travail ?', options: OUI_NON },
        { id: 'aud_expo_loisir', type: 'radio', label: 'Êtes-vous exposé à un bruit important pendant vos loisirs ?', options: OUI_NON },
        { id: 'aud_acouphenes', type: 'radio', label: 'Entendez-vous des sifflements ou des bourdonnements ?', options: OUI_NON },
        { id: 'aud_repetition', type: 'radio', label: 'Votre entourage vous demande-t-il de répéter, ou vous fait-il remarquer que vous entendez mal ?', options: OUI_NON },
        { id: 'aud_volume', type: 'radio', label: 'Montez-vous le volume de la télévision plus qu’avant ?', options: OUI_NON },

        { id: 'hhie_sep', type: 'separateur',
          label: 'Gêne fonctionnelle',
          aide: 'Pour chaque situation, indiquez la gêne que vous ressentez.',
          licence: 'Structure à 10 items de gêne fonctionnelle auditive. Libellés provisoires : vérifier les conditions de reproduction du questionnaire officiel avant usage clinique ou commercial.' },
        { id: 'hhie_1', type: 'radio', label: 'Difficulté à suivre une conversation dans un lieu bruyant', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_2', type: 'radio', label: 'Difficulté à suivre une conversation à plusieurs', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_3', type: 'radio', label: 'Difficulté à entendre au téléphone', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_4', type: 'radio', label: 'Difficulté à entendre lorsque l’on vous parle à voix basse', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_5', type: 'radio', label: 'Gêne pour entendre la télévision ou la radio', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_6', type: 'radio', label: 'Difficulté à localiser l’origine d’un son', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_7', type: 'radio', label: 'Sentiment de gêne ou d’embarras lié à l’audition', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_8', type: 'radio', label: 'Tendance à éviter certaines situations sociales à cause de l’audition', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_9', type: 'radio', label: 'Difficulté à entendre au cinéma, au théâtre ou en réunion', options: FREQ_0_3, instrument: 'Gêne auditive' },
        { id: 'hhie_10', type: 'radio', label: 'Sentiment que l’audition limite votre vie personnelle ou professionnelle', options: FREQ_0_3, instrument: 'Gêne auditive' }
      ]
    },

    /* ============================================================ */
    {
      id: 'mental',
      titre: 'Moral et anxiété',
      paragraphes: [
        'Ces questions sont les plus difficiles à poser par écrit, et probablement les plus utiles. Elles n’évaluent pas votre caractère : elles décrivent les deux dernières semaines, telles qu’elles ont été.',
        'Vous pouvez ne pas répondre. Vous pouvez aussi répondre et demander à n’en parler qu’oralement : dites-le au médecin, il le respectera. Si quelque chose est difficile maintenant, dites-le-lui sans attendre la fin du questionnaire.'
      ],
      intro: 'Ces questions sont posées à tout le monde, dans le même ordre et en totalité. Une consultation médicale dédiée est prévue quelle que soit la réponse. Si vous ne souhaitez pas répondre, laissez vide et parlez-en au médecin.',
      questions: [
        /* PHQ-9 — domaine public, aucune autorisation requise.
           Les neuf items sont posés SANS filtre : un filtre conditionné
           au résultat des deux premiers serait un calcul. */
        { id: 'phq_sep', type: 'separateur', label: 'Au cours des deux dernières semaines, à quelle fréquence avez-vous été gêné par les problèmes suivants ?', instrument: 'PHQ-9' },
        { id: 'phq_1', type: 'radio', label: 'Peu d’intérêt ou de plaisir à faire les choses', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_2', type: 'radio', label: 'Être triste, déprimé ou désespéré', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_3', type: 'radio', label: 'Difficultés à s’endormir, sommeil interrompu, ou trop dormir', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_4', type: 'radio', label: 'Se sentir fatigué ou manquer d’énergie', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_5', type: 'radio', label: 'Peu d’appétit ou manger trop', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_6', type: 'radio', label: 'Mauvaise opinion de soi-même, sentiment d’être un échec ou d’avoir déçu', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_7', type: 'radio', label: 'Difficultés à se concentrer', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_8', type: 'radio', label: 'Parler ou bouger plus lentement que d’habitude, ou au contraire être agité', options: FREQ_PHQ, instrument: 'PHQ-9' },
        { id: 'phq_9', type: 'radio', label: 'Penser qu’il vaudrait mieux mourir, ou envisager de se faire du mal', options: FREQ_PHQ, instrument: 'PHQ-9',
          alerte_circuit: true,
          aide: 'Si cette question vous préoccupe, parlez-en au médecin dès le début de la consultation. Vous pouvez aussi appeler le 3114, numéro national de prévention du suicide, à tout moment et gratuitement.' },

        /* GAD-7 — domaine public */
        { id: 'gad_sep', type: 'separateur', label: 'Toujours au cours des deux dernières semaines', instrument: 'GAD-7' },
        { id: 'gad_1', type: 'radio', label: 'Se sentir nerveux, anxieux ou tendu', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_2', type: 'radio', label: 'Ne pas pouvoir arrêter de s’inquiéter ou contrôler ses inquiétudes', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_3', type: 'radio', label: 'S’inquiéter excessivement à propos de tout et de rien', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_4', type: 'radio', label: 'Avoir de la difficulté à se détendre', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_5', type: 'radio', label: 'Être si agité qu’il est difficile de rester tranquille', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_6', type: 'radio', label: 'Devenir facilement contrarié ou irritable', options: FREQ_PHQ, instrument: 'GAD-7' },
        { id: 'gad_7', type: 'radio', label: 'Avoir peur que quelque chose de terrible puisse arriver', options: FREQ_PHQ, instrument: 'GAD-7' },

        { id: 'mental_suivi', type: 'radio', label: 'Êtes-vous actuellement suivi ou traité pour un motif psychologique ?', options: OUI_NON },
        { id: 'mental_travail', type: 'radio', label: 'Votre travail est-il une source importante de tension en ce moment ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'depistages',
      titre: 'Dépistages',
      photo: { id: 'depistage', dossier: 'domaines' },
      paragraphes: [
        'Le dépistage consiste à chercher quelque chose chez quelqu’un qui n’a aucun symptôme. Il n’est organisé que pour quelques cancers, ceux pour lesquels trouver plus tôt change réellement la suite.',
        'Ces questions servent à savoir où vous en êtes, pas à vous rappeler à l’ordre. Un dépistage n’est pas une obligation : c’est une décision qui vous appartient, et elle se prend en connaissant aussi ses inconvénients.'
      ],
      intro: 'Ces questions dépendent uniquement de votre âge et de votre sexe.',
      questions: [
        { id: 'dep_colorectal', type: 'radio', label: 'Avez-vous réalisé un test de dépistage du cancer colorectal ?',
          showIf: { ageMin: 50, ageMax: 74 },
          options: [
            { v: 'moins2', l: 'Oui, il y a moins de deux ans' },
            { v: 'plus2', l: 'Oui, il y a plus de deux ans' },
            { v: 'jamais', l: 'Jamais' },
            { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },
        { id: 'dep_mammo', type: 'radio', label: 'Avez-vous réalisé une mammographie de dépistage ?',
          showIf: { sexe: 'F', ageMin: 50, ageMax: 74 },
          options: [
            { v: 'moins2', l: 'Oui, il y a moins de deux ans' },
            { v: 'plus2', l: 'Oui, il y a plus de deux ans' },
            { v: 'jamais', l: 'Jamais' },
            { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },
        { id: 'dep_col_uterus', type: 'radio', label: 'À quand remonte votre dernier frottis ou test HPV ?',
          showIf: { sexe: 'F', ageMin: 25, ageMax: 65 },
          options: [
            { v: 'moins3', l: 'Moins de trois ans' },
            { v: '3a5', l: 'Entre trois et cinq ans' },
            { v: 'plus5', l: 'Plus de cinq ans' },
            { v: 'jamais', l: 'Jamais' },
            { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },
        { id: 'dep_prostate_discussion', type: 'radio', label: 'Avez-vous déjà discuté du dépistage de la prostate avec un médecin ?',
          showIf: { sexe: 'M', ageMin: 50 }, options: OUI_NON,
          aide: 'Il n’existe pas de dépistage organisé de la prostate. La décision se prend avec le médecin, après information.' },
        { id: 'dep_aaa', type: 'radio', label: 'Avez-vous déjà eu une échographie de l’aorte abdominale ?',
          showIf: { sexe: 'M', ageMin: 65, ageMax: 75 }, options: OUI_NON },
        { id: 'dep_ist', type: 'radio', label: 'Souhaitez-vous aborder un dépistage des infections sexuellement transmissibles ?',
          options: OUI_NON },
        { id: 'dep_ist_dernier', type: 'text', label: 'Date de votre dernier dépistage, si vous la connaissez' }
      ]
    },

    /* ============================================================ */
    {
      id: 'biologie',
      titre: 'Analyses et préparation',
      photo: { id: 'hematologie', dossier: 'domaines' },
      paragraphes: [
        'La prise de sang n’est pas décidée à l’avance : ce sont vos réponses et l’examen du médecin qui déterminent ce qui sera demandé. Ces questions préparent ce moment.',
        'À jeun ou non, cela dépend des analyses : ce sera écrit sur votre ordonnance. Être à jeun sans que ce soit demandé n’améliore rien, ne pas l’être quand c’est demandé oblige à revenir.'
      ],
      questions: [
        { id: 'bio_dernier_bilan', type: 'radio', label: 'À quand remonte votre dernière prise de sang ?',
          options: [
            { v: 'moins6', l: 'Moins de six mois' }, { v: '6a12', l: 'De six à douze mois' },
            { v: '1a3', l: 'De un à trois ans' }, { v: 'plus3', l: 'Plus de trois ans' },
            { v: 'jamais', l: 'Jamais ou je ne sais pas' }
          ] },
        { id: 'bio_resultats_connus', type: 'textarea', label: 'Résultats dont vous vous souvenez ou que vous pourrez apporter',
          aide: 'Recopiez les valeurs telles quelles. Aucune interprétation n’est faite par la plateforme.' },
        { id: 'bio_apporter', type: 'radio', label: 'Pourrez-vous apporter vos derniers résultats ?', options: OUI_NON },
        { id: 'bio_jeune', type: 'radio', label: 'Pouvez-vous venir à jeun si le médecin l’estime nécessaire ?', options: OUI_NON },
        { id: 'bio_anticoagulant', type: 'radio', label: 'Prenez-vous un traitement anticoagulant ou antiagrégant ?', options: OUI_NON },
        { id: 'bio_grossesse', type: 'radio', label: 'Êtes-vous enceinte, ou est-ce possible ?', showIf: { sexe: 'F' }, options: OUI_NON },
        { id: 'bio_malaise_prise_sang', type: 'radio', label: 'Faites-vous des malaises lors des prises de sang ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'attentes',
      titre: 'Vos attentes',
      paragraphes: [
        'Cette dernière page est celle qui est le plus souvent lue en consultation, parce qu’elle dit ce que vous, vous attendez de cette visite.',
        'Écrivez-y ce qui vous inquiète, même si cela vous paraît anodin ou hors sujet. Une phrase de votre main vaut mieux que trois questions bien posées.'
      ],
      questions: [
        { id: 'att_motif', type: 'textarea', label: 'Qu’attendez-vous de cette visite ?' },
        { id: 'att_inquietude', type: 'textarea', label: 'Y a-t-il quelque chose qui vous inquiète en particulier ?' },
        { id: 'att_question', type: 'textarea', label: 'Une question que vous souhaitez absolument poser au médecin ?' },
        { id: 'att_declaration', type: 'radio', required: true,
          label: 'Je confirme que ces réponses sont, à ma connaissance, exactes et complètes.',
          options: [{ v: 'oui', l: 'Je confirme' }] }
      ]
    }
  ]
};

/* =====================================================================
   RÉFÉRENTIEL DOCUMENTAIRE
   Contenu STATIQUE, identique pour tous les dossiers, non contextualisé.
   Il n'est jamais rapproché des réponses d'un patient par le logiciel.
   Le médecin le consulte s'il le souhaite.

   Point à faire trancher par le consultant en affaires réglementaires
   (dossier de reprise, section 14) : l'affichage de ce référentiel dans
   la même interface que les réponses. Il est volontairement isolé dans
   un onglet distinct pour pouvoir être détaché sans refonte.
   ===================================================================== */

const REFERENTIEL = [
  {
    titre: 'Essoufflement — échelle mMRC',
    contenu: [
      'Grade 0 : essoufflement pour un effort intense uniquement.',
      'Grade 1 : essoufflement en marchant vite ou en montant une pente légère.',
      'Grade 2 : marche plus lente que les personnes du même âge, ou arrêts nécessaires.',
      'Grade 3 : arrêt après environ 100 mètres ou quelques minutes de marche.',
      'Grade 4 : essoufflement à l’habillage, ou impossibilité de sortir du domicile.'
    ]
  },
  {
    titre: 'Repérage de la BPCO — questionnaire publié en cinq questions',
    contenu: [
      'Les cinq questions, telles que diffusées : toux fréquente ; toux grasse ou ramenant des crachats ; essoufflement plus marqué que les personnes du même âge ; plus de 40 ans ; tabagisme actuel ou passé.',
      'Repère publié : deux réponses « oui » constituent un signal d’alerte, qui doit conduire à une mesure du souffle.',
      'Le décompte n’est pas fait par la plateforme. Les cinq réponses sont affichées telles quelles ; c’est vous qui les comptez et qui décidez.',
      'Ce questionnaire ne fait pas de diagnostic et ne remplace pas la spirométrie. Il sert à choisir à qui la proposer.',
      'À l’inverse, deux « oui » n’obligent à rien : la décision reste la vôtre, au vu de l’ensemble de la consultation.'
    ]
  },
  {
    titre: 'Souffle — la séquence en deux temps',
    contenu: [
      'Premier temps, sur place : spirométrie avec test de réversibilité. C’est l’examen de première intention, et le seul qui permette de poser un trouble ventilatoire obstructif.',
      'Second temps, sur indication du résultat : exploration fonctionnelle respiratoire complète — volumes statiques, transfert du CO — réalisée par le pneumologue.',
      'L’EFR complète n’est pas déclenchée par le questionnaire. Aucune donnée déclarative ne la justifie : c’est le résultat de la spirométrie, ou le tableau clinique, qui l’indiquent.',
      'Repère publié pour la spirométrie : au moins dix paquets-années ou une exposition professionnelle documentée, associés à au moins un symptôme respiratoire.',
      'Chez le fumeur totalement asymptomatique, le dépistage spirométrique systématique n’est pas recommandé.',
      'Le calcul des paquets-années n’est pas réalisé par la plateforme : les cigarettes par jour et le nombre d’années sont transmis bruts.'
    ]
  },
  {
    titre: 'Spirométrie — lecture du résultat',
    contenu: [
      'Le diagnostic repose sur un trouble ventilatoire obstructif non réversible après bronchodilatateur.',
      'Le repère fixe VEMS/CVF publié sous-diagnostique avant 50 ans et surdiagnostique chez les sujets plus âgés. La limite inférieure de la normale est l’alternative retenue par la HAS.',
      'Un tracé mal réalisé ne donne pas un résultat approximatif : il donne un résultat faux, qui sera cru. Il est refait.',
      'La plateforme ne calcule ni le rapport VEMS/CVF, ni le pourcentage de la valeur prédite. Ces valeurs figurent sur le compte rendu de l’appareil, qui est lui-même un dispositif marqué CE.'
    ]
  },
  {
    titre: 'Somnolence diurne — grille d’interprétation publiée',
    contenu: [
      'Somme des huit items, de 0 à 24.',
      'De 0 à 10 : somnolence diurne considérée comme normale.',
      'De 11 à 14 : somnolence légère.',
      'De 15 à 17 : somnolence modérée.',
      'De 18 à 24 : somnolence sévère.',
      'La somme n’est pas calculée par la plateforme. Le total est établi par le professionnel.'
    ]
  },
  {
    titre: 'Risque d’apnées du sommeil — grille publiée',
    contenu: [
      'Huit critères binaires : ronflement, fatigue, apnées observées, hypertension, corpulence, âge, tour de cou, sexe.',
      'De 0 à 2 critères : risque faible.',
      'De 3 à 4 critères : risque intermédiaire.',
      'De 5 à 8 critères : risque élevé.',
      'Orientation directe à envisager en cas de risque élevé associé à une comorbidité cardiovasculaire, une somnolence au volant, une insuffisance cardiaque ou une profession de conducteur.'
    ]
  },
  {
    titre: 'Consommation d’alcool — AUDIT-C',
    contenu: [
      'Somme des trois items, de 0 à 12.',
      'Seuil publié de repérage : 4 ou plus chez l’homme, 3 ou plus chez la femme.'
    ]
  },
  {
    titre: 'Dépression — PHQ-9, grille publiée',
    contenu: [
      'Somme des neuf items, de 0 à 27.',
      'De 0 à 4 : absence ou symptômes minimes.',
      'De 5 à 9 : symptômes légers.',
      'De 10 à 14 : symptômes modérés.',
      'De 15 à 19 : symptômes modérément sévères.',
      'De 20 à 27 : symptômes sévères.',
      'Le neuvième item relatif aux idées de mort impose une évaluation directe, indépendamment du total.'
    ]
  },
  {
    titre: 'Anxiété — GAD-7, grille publiée',
    contenu: [
      'Somme des sept items, de 0 à 21.',
      'De 0 à 4 : minime. De 5 à 9 : léger. De 10 à 14 : modéré. De 15 à 21 : sévère.'
    ]
  },
  {
    titre: 'Gêne auditive — grille publiée',
    contenu: [
      'Dix items cotés 0, 2 ou 4 dans la version originale, de 0 à 40.',
      'Un score supérieur à 8 constitue le repère publié pour une évaluation audiométrique.',
      'Le périmètre d’intervention de l’audioprothésiste suppose une prescription médicale préalable. Module à ouvrir après validation.'
    ]
  },
  {
    titre: 'Risque cardiovasculaire — SCORE2 et SCORE2-OP',
    contenu: [
      'Éléments nécessaires au calcul : âge, sexe, statut tabagique, pression artérielle systolique, cholestérol non-HDL.',
      'Le calcul est réalisé par le médecin à partir des tables publiées. La plateforme ne le réalise pas.',
      'Repère impératif : ne pas déclencher un électrocardiogramme sur le seul critère de l’âge. Chez l’adulte asymptomatique à bas risque, l’électrocardiogramme de dépistage fait l’objet d’une recommandation défavorable.'
    ]
  },
  {
    titre: 'Peau — critères ABCDE et phototype',
    contenu: [
      'A : asymétrie. B : bords irréguliers. C : couleur inhomogène. D : diamètre supérieur à 6 mm. E : évolution.',
      'Signe du vilain petit canard : lésion différente des autres.',
      'Phototypes I et II : sensibilité solaire élevée.',
      'Règle non négociable : la lecture est faite par un dermatologue. Aucun algorithme ne conclut.',
      'En cas de suspicion, rendez-vous dermatologique ou biopsie sous quinze jours, avec traçabilité du délai.'
    ]
  },
  {
    titre: 'Dépistages organisés — cadre national',
    contenu: [
      'Test immunologique colorectal : 50 à 74 ans, tous les deux ans.',
      'Mammographie : femmes de 50 à 74 ans, tous les deux ans.',
      'Cytologie cervicale : femmes de 25 à 29 ans, selon le programme.',
      'Test HPV : femmes de 30 à 65 ans, selon le programme.',
      'Prostate : pas de dépistage organisé, décision médicale partagée.',
      'Anévrisme de l’aorte abdominale : recommandé par l’USPSTF chez l’homme de 65 à 75 ans fumeur ou ancien fumeur, statut à vérifier en France.'
    ]
  },
  {
    titre: 'Nomenclature — rappel',
    contenu: [
      'L’existence d’un code ne rend pas l’acte remboursable : une indication médicale individuelle est requise.',
      'Certains examens ont des indications restreintes ou ne sont pas renouvelables à court intervalle.',
      'Toute analyse hors nomenclature suppose un devis signé mentionnant l’absence de prise en charge et le montant.'
    ]
  }
];

/* Exposé pour app.js */
window.QUESTIONNAIRE = QUESTIONNAIRE;
window.REFERENTIEL = REFERENTIEL;
