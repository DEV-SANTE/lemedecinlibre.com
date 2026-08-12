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

   Les branchements autorisés sont de deux familles, et de deux seulement :

   STRUCTURELS — le profil, jamais les réponses :
     showIf: { sexe: 'F' }        -> autorisé (structurel)
     showIf: { ageMin: 50 }       -> autorisé (structurel)

   PORTES D'APPLICABILITÉ (décision du 11 août 2026) — une question
   disparaît quand un STATUT DÉCLARÉ la rend sans objet. Égalité stricte
   avec une constante, sur une seule réponse de fait ; alternatives
   séparées par « | » ; « contient » pour une case cochée :
     showIf: { reponse: 'tabac_statut', vaut: 'actuel|ancien' }  -> autorisé
     showIf: { reponse: 'tms_zones', contient: 'lombaires' }     -> autorisé
   Une porte ne produit aucune information : « jamais fumé » rend les
   questions sur les cigarettes inapplicables, elle ne dit rien du risque.
   Un instrument déclenché est posé EN ENTIER — une porte ouvre ou ferme
   un bloc, jamais un item au milieu d'une échelle. Et une porte ne
   s'appuie jamais sur un item coté d'un instrument (le vérificateur
   contrôle les trois points).

   RESTE INTERDIT, sans exception :
     showIf: { score: '>= 11' }   -> INTERDIT : seuil = calcul
   Aucun seuil, aucune somme, aucune combinaison de réponses. C'est la
   raison pour laquelle PHQ-9, GAD-7 et le repérage BPCO sont posés en
   entier à tout le monde : les filtrer exigerait de compter.

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
        { id: 'profession', type: 'text', label: 'Profession' },

        /* CHOIX DU PARCOURS — porte de section. Le bilan d'inscription
           couvre le socle ; le bilan complet ouvre les dix sections
           complémentaires (marquées d'un showIf de module). Le choix est
           un statut déclaré : il ne dit rien de la santé de la personne. */
        { id: 'parcours', type: 'radio', porte: true, required: true,
          label: 'Quel bilan souhaitez-vous remplir aujourd’hui ?',
          aide: 'Le bilan d’inscription couvre l’essentiel : votre histoire, vos consommations, le cœur, le métabolisme, l’alimentation, l’activité physique, la peau, le moral et les dépistages. Le bilan complet y ajoute le souffle, le sommeil, la thyroïde, la vue, l’audition, les os et articulations, les douleurs et la santé pelvienne. Vous pourrez passer au bilan complet à tout moment : revenez à cette première page et changez votre choix.',
          options: [
            { v: 'essentiel', l: 'Le bilan d’inscription — l’essentiel, environ 20 minutes' },
            { v: 'complet', l: 'Le bilan complet — toutes les sections, environ 40 minutes' }
          ] }
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
          showIf: { reponse: 'tabac_statut', vaut: 'actuel|ancien' },
          aide: 'Recueilli brut. Le calcul des paquets-années est réalisé par le médecin, pas par la plateforme.' },
        { id: 'tabac_annees', type: 'number', label: 'Pendant combien d’années au total ?', min: 0, max: 80,
          showIf: { reponse: 'tabac_statut', vaut: 'actuel|ancien' } },
        { id: 'tabac_arret_annee', type: 'number', label: 'Année d’arrêt', min: 1940, max: 2026,
          showIf: { reponse: 'tabac_statut', vaut: 'ancien' } },
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
        /* « Jamais » à la première question rend les deux suivantes sans
           objet : porte d'applicabilité, conforme à la passation publiée
           de l'instrument (les items suivants valent zéro). */
        { id: 'auditc_2', type: 'radio', label: 'Les jours où vous buvez, combien de verres consommez-vous ?', instrument: 'AUDIT-C',
          showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' },
          options: [
            { v: '0', l: '1 ou 2' }, { v: '1', l: '3 ou 4' }, { v: '2', l: '5 ou 6' },
            { v: '3', l: '7 à 9' }, { v: '4', l: '10 ou plus' }
          ] },
        { id: 'auditc_3', type: 'radio', label: 'À quelle fréquence consommez-vous six verres ou plus en une même occasion ?', instrument: 'AUDIT-C',
          showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' },
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
            { v: 'aaa', l: 'Anévrisme de l’aorte abdominale' },
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
      id: 'consommations',
      titre: 'Tabac, alcool et autres consommations',
      paragraphes: [
        'Le tabac, l’alcool et le cannabis sont abordés ensemble parce qu’ils se ressemblent sur un point : la quantité consommée dit rarement à elle seule s’il existe une dépendance, et c’est la dépendance qui rend l’arrêt difficile.',
        'Ces questions ne servent pas à juger, mais à proposer, si vous le souhaitez, une aide adaptée. Répondez pour ces douze derniers mois. Rien n’est compté par la plateforme : vos réponses sont transmises telles quelles au médecin.'
      ],
      intro: 'Le statut tabagique et la consommation d’alcool sont déjà abordés au Socle. Cette section les précise ; répondez aux blocs qui vous concernent.',
      questions: [
        /* Dépendance nicotinique — structure à 6 items publiée.
           À remplir par les personnes qui fument : aucun filtre n'est
           appliqué (un filtre conditionné à une réponse serait un calcul),
           d'où la consigne écrite. Reproduction habituellement libre ;
           à confirmer avant usage commercial. */
        { id: 'fager_sep', type: 'separateur', label: 'Votre tabagisme',
          showIf: { reponse: 'tabac_statut', vaut: 'actuel' },
          aide: 'Ces questions s’affichent parce que vous avez indiqué fumer actuellement.',
          licence: 'Structure à 6 items d’un test de dépendance à la nicotine. Reproduction habituellement libre ; vérifier les conditions avant usage commercial.' },
        { id: 'fager_delai', type: 'radio', label: 'Combien de temps après le réveil fumez-vous votre première cigarette ?', instrument: 'Dépendance nicotinique',
          showIf: { reponse: 'tabac_statut', vaut: 'actuel' },
          options: [
            { v: '3', l: 'Dans les 5 minutes' }, { v: '2', l: 'Entre 6 et 30 minutes' },
            { v: '1', l: 'Entre 31 et 60 minutes' }, { v: '0', l: 'Après 60 minutes' }
          ] },
        { id: 'fager_interdit', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'Trouvez-vous difficile de ne pas fumer dans les endroits où c’est interdit ?', options: OUI_NON, instrument: 'Dépendance nicotinique' },
        { id: 'fager_renonce', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'À quelle cigarette renonceriez-vous le plus difficilement ?', instrument: 'Dépendance nicotinique',
          options: [
            { v: '1', l: 'La première du matin' }, { v: '0', l: 'Une autre' }
          ] },
        { id: 'fager_nb', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'Combien de cigarettes fumez-vous par jour ?', instrument: 'Dépendance nicotinique',
          options: [
            { v: '0', l: '10 ou moins' }, { v: '1', l: '11 à 20' },
            { v: '2', l: '21 à 30' }, { v: '3', l: '31 ou plus' }
          ] },
        { id: 'fager_matin', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'Fumez-vous davantage dans les premières heures après le réveil que le reste de la journée ?', options: OUI_NON, instrument: 'Dépendance nicotinique' },
        { id: 'fager_malade', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'Fumez-vous même lorsque vous êtes malade et alité une grande partie de la journée ?', options: OUI_NON, instrument: 'Dépendance nicotinique' },
        { id: 'tabac_arret_envie', showIf: { reponse: 'tabac_statut', vaut: 'actuel' }, type: 'radio', label: 'Souhaiteriez-vous être aidé pour arrêter de fumer ?', options: OUI_NON },

        /* Cannabis — structure à 6 items sur douze mois (INPES, libre). */
        { id: 'cast_sep', type: 'separateur', label: 'Cannabis' },
        { id: 'cast_conso', type: 'radio', label: 'Avez-vous consommé du cannabis au cours des douze derniers mois ?', options: OUI_NON },
        { id: 'cast_avant_midi', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Avez-vous fumé du cannabis avant midi ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },
        { id: 'cast_seul', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Avez-vous fumé du cannabis lorsque vous étiez seul ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },
        { id: 'cast_memoire', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Avez-vous eu des problèmes de mémoire en fumant du cannabis ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },
        { id: 'cast_reduire_proches', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Des proches vous ont-ils dit que vous devriez réduire votre consommation ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },
        { id: 'cast_tente_reduire', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Avez-vous essayé de réduire ou d’arrêter sans y parvenir ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },
        { id: 'cast_problemes', showIf: { reponse: 'cast_conso', vaut: 'oui' }, type: 'radio', label: 'Avez-vous eu des problèmes à cause du cannabis : dispute, accident, difficultés au travail ou aux études ?', instrument: 'Cannabis',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Rarement' }, { v: '2', l: 'De temps en temps' },
            { v: '3', l: 'Assez souvent' }, { v: '4', l: 'Très souvent' }
          ] },

        /* Complément AUDIT — items 4 à 10 (OMS, libre). Les trois premiers
           (AUDIT-C) sont déjà posés au Socle. */
        { id: 'audit_sep', type: 'separateur', label: 'Alcool — questions complémentaires', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' },
          aide: 'Ces questions complètent les trois premières, posées au Socle. Elles portent sur les douze derniers mois.' },
        { id: 'audit_4', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Avez-vous été incapable de vous arrêter de boire après avoir commencé ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' }, { v: '2', l: 'Une fois par mois' },
            { v: '3', l: 'Une fois par semaine' }, { v: '4', l: 'Tous les jours ou presque' }
          ] },
        { id: 'audit_5', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'La boisson vous a-t-elle empêché de faire ce que l’on attendait normalement de vous ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' }, { v: '2', l: 'Une fois par mois' },
            { v: '3', l: 'Une fois par semaine' }, { v: '4', l: 'Tous les jours ou presque' }
          ] },
        { id: 'audit_6', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Avez-vous eu besoin d’un premier verre le matin pour vous remettre après avoir beaucoup bu la veille ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' }, { v: '2', l: 'Une fois par mois' },
            { v: '3', l: 'Une fois par semaine' }, { v: '4', l: 'Tous les jours ou presque' }
          ] },
        { id: 'audit_7', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Avez-vous eu un sentiment de culpabilité ou de remords après avoir bu ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' }, { v: '2', l: 'Une fois par mois' },
            { v: '3', l: 'Une fois par semaine' }, { v: '4', l: 'Tous les jours ou presque' }
          ] },
        { id: 'audit_8', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Avez-vous été incapable de vous souvenir de la veille parce que vous aviez bu ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Moins d’une fois par mois' }, { v: '2', l: 'Une fois par mois' },
            { v: '3', l: 'Une fois par semaine' }, { v: '4', l: 'Tous les jours ou presque' }
          ] },
        { id: 'audit_9', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Vous êtes-vous blessé, ou avez-vous blessé quelqu’un, parce que vous aviez bu ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Non' }, { v: '2', l: 'Oui, mais pas cette année' }, { v: '4', l: 'Oui, cette année' }
          ] },
        { id: 'audit_10', type: 'radio', showIf: { reponse: 'auditc_1', vaut: '1|2|3|4' }, label: 'Un proche, un médecin ou un professionnel s’est-il inquiété de votre consommation, ou vous a-t-il suggéré de la réduire ?', instrument: 'AUDIT',
          options: [
            { v: '0', l: 'Non' }, { v: '2', l: 'Oui, mais pas cette année' }, { v: '4', l: 'Oui, cette année' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'respiratoire',
      showIf: { reponse: 'parcours', vaut: 'complet' },
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
          ] },

        /* Terrain allergique — items simples orientant des tests cutanés.
           Recueil seul ; le médecin décide de l'exploration. */
        { id: 'allergie_sep', type: 'separateur', label: 'Allergies',
          acte: 'Pour le médecin — un terrain allergique symptomatique oriente vers des tests cutanés (prick-tests, FGRB003). Aucun déclenchement automatique.',
          aide: 'Répondez pour ce que vous vivez habituellement, y compris de façon saisonnière.' },
        { id: 'allergie_rhinite', type: 'radio', label: 'Avez-vous souvent le nez qui coule, bouché, ou des éternuements en salves, hors rhume ?', options: OUI_NON, instrument: 'Allergie' },
        { id: 'allergie_yeux', type: 'radio', label: 'Avez-vous les yeux qui piquent, rougissent ou larmoient par périodes ?', options: OUI_NON, instrument: 'Allergie' },
        { id: 'allergie_asthme', type: 'radio', label: 'Avez-vous des sifflements, une oppression ou une toux la nuit, à l’effort ou au contact d’animaux ?', options: OUI_NON, instrument: 'Allergie' },
        { id: 'allergie_peau', type: 'radio', label: 'Avez-vous de l’eczéma ou des plaques qui démangent de façon récurrente ?', options: OUI_NON, instrument: 'Allergie' },
        { id: 'allergie_facteurs', type: 'checkbox', label: 'Vos symptômes sont-ils liés à un environnement particulier ?',
          options: [
            { v: 'pollens', l: 'Les pollens, le printemps' }, { v: 'acariens', l: 'La poussière, les acariens' },
            { v: 'animaux', l: 'Les animaux' }, { v: 'moisissures', l: 'L’humidité, les moisissures' },
            { v: 'travail', l: 'Le lieu de travail' }
          ] },
        { id: 'allergie_famille', type: 'radio', label: 'Y a-t-il des allergies, de l’asthme ou de l’eczéma dans votre famille proche ?', options: OUI_NON, instrument: 'Allergie' }
      ]
    },

    /* ============================================================ */
    {
      id: 'sommeil',
      showIf: { reponse: 'parcours', vaut: 'complet' },
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
        { id: 'som_endormissement', porte: true, photo: { id: 'sommeil', dossier: 'domaines' }, type: 'radio', label: 'Avez-vous des difficultés à vous endormir ou des réveils prolongés ?', options: OUI_NON ,
          aide: 'Par exemple : mettre plus d’une demi-heure à vous endormir plusieurs fois par semaine, vous réveiller la nuit sans parvenir à vous rendormir, ou trop tôt le matin. Si oui, sept questions préciseront ces difficultés ; si non, elles ne vous seront pas posées.' },

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
        { id: 'ess_8', type: 'radio', label: 'Au volant, immobilisé quelques minutes dans la circulation', options: FREQ_0_3, instrument: 'Somnolence' },

        /* Sévérité de l'insomnie — structure à 7 items cotés de 0 à 4.
           Libellés neutres : substituer le libellé officiel de l'index de
           sévérité de l'insomnie après obtention de la licence. */
        { id: 'isi_sep', type: 'separateur', label: 'Difficultés de sommeil, ces deux dernières semaines', showIf: { reponse: 'som_endormissement', vaut: 'oui' },
          licence: 'Structure à 7 items d’un index de sévérité de l’insomnie coté de 0 à 4. Libellés provisoires : substituer le libellé officiel sous licence avant usage clinique ou commercial.' },
        { id: 'isi_1', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Difficulté à vous endormir', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Légère' }, { v: '2', l: 'Moyenne' },
            { v: '3', l: 'Importante' }, { v: '4', l: 'Très importante' }
          ] },
        { id: 'isi_2', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Difficulté à rester endormi', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Légère' }, { v: '2', l: 'Moyenne' },
            { v: '3', l: 'Importante' }, { v: '4', l: 'Très importante' }
          ] },
        { id: 'isi_3', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Réveil trop tôt le matin', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Légère' }, { v: '2', l: 'Moyenne' },
            { v: '3', l: 'Importante' }, { v: '4', l: 'Très importante' }
          ] },
        { id: 'isi_4', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Degré de satisfaction à l’égard de votre sommeil actuel', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Très satisfait' }, { v: '1', l: 'Satisfait' }, { v: '2', l: 'Neutre' },
            { v: '3', l: 'Insatisfait' }, { v: '4', l: 'Très insatisfait' }
          ] },
        { id: 'isi_5', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Gêne de ces difficultés dans votre vie quotidienne', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Pas du tout' }, { v: '1', l: 'Un peu' }, { v: '2', l: 'Moyennement' },
            { v: '3', l: 'Beaucoup' }, { v: '4', l: 'Énormément' }
          ] },
        { id: 'isi_6', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Ces difficultés sont-elles perceptibles par votre entourage ?', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Pas du tout' }, { v: '1', l: 'Un peu' }, { v: '2', l: 'Moyennement' },
            { v: '3', l: 'Beaucoup' }, { v: '4', l: 'Énormément' }
          ] },
        { id: 'isi_7', type: 'radio', showIf: { reponse: 'som_endormissement', vaut: 'oui' }, label: 'Inquiétude ou contrariété que vous causent ces difficultés de sommeil', instrument: 'Insomnie',
          options: [
            { v: '0', l: 'Pas du tout' }, { v: '1', l: 'Un peu' }, { v: '2', l: 'Moyennement' },
            { v: '3', l: 'Beaucoup' }, { v: '4', l: 'Énormément' }
          ] }
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
        { id: 'cut_lesion_nouvelle', porte: true, photo: { id: 'peau', dossier: 'domaines' }, type: 'radio', label: 'Avez-vous remarqué une tache ou un grain de beauté nouveau, ou qui a changé, au cours des douze derniers mois ?', options: OUI_NON ,
          aide: 'Un grain de beauté ou une tache apparu récemment, ou qui a changé de taille, de forme ou de couleur, ou qui s’est mis à gratter ou à saigner. Si oui, une question précisera ce que vous avez observé.' },
        { id: 'cut_abcde', type: 'checkbox', showIf: { reponse: 'cut_lesion_nouvelle', vaut: 'oui' }, label: 'Si oui, avez-vous constaté un ou plusieurs de ces changements ?',
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
          acte: 'Pour le médecin — risque cardiovasculaire (SCORE2), antécédents familiaux, ou plus de 40 ans jamais dosé : oriente vers un bilan lipidique (EAL, ensemble indissociable). Aucun déclenchement automatique.',
          aide: 'Format libre. Exemple : mars 2025.' },
        { id: 'cv_bilan_lipidique_valeurs', type: 'textarea', label: 'Valeurs de ce bilan, si vous les avez',
          aide: 'Recopiez les chiffres tels quels. Le médecin les interprétera.' },
        { id: 'cv_douleur_thoracique', type: 'radio', label: 'Avez-vous des douleurs ou une oppression dans la poitrine, notamment à l’effort ?', options: OUI_NON },
        { id: 'cv_palpitations', type: 'radio', label: 'Avez-vous des palpitations ou des irrégularités du rythme cardiaque ?', options: OUI_NON },
        { id: 'cv_syncope', type: 'radio', label: 'Avez-vous déjà perdu connaissance, ou eu l’impression d’être au bord du malaise ?', options: OUI_NON },
        { id: 'cv_oedemes', type: 'radio', label: 'Avez-vous des gonflements des chevilles en fin de journée ?', options: OUI_NON },
        { id: 'cv_claudication', type: 'radio', label: 'Ressentez-vous une douleur dans les mollets à la marche, qui cède à l’arrêt ?', options: OUI_NON },
        { id: 'cv_sport_intense', type: 'radio', label: 'Reprenez-vous ou envisagez-vous une activité sportive intense ?', options: OUI_NON },
        { id: 'cv_traitement_risque', type: 'radio', label: 'Prenez-vous un traitement pour le cœur, le rythme cardiaque, ou un traitement psychiatrique ?', options: OUI_NON },

        /* Claudication à la marche — questionnaire publié d'Édimbourg,
           6 items, libre. Recueil seul ; aucun algorithme appliqué ici. */
        { id: 'edin_sep', type: 'separateur', label: 'Douleur des jambes à la marche',
          acte: 'Pour le médecin — oriente vers un écho-doppler des artères des membres inférieurs (EDQM001). Repère publié : algorithme d’Édimbourg positif. Aucun déclenchement automatique.',
          aide: 'Répondez en pensant à votre marche habituelle.' },
        { id: 'edin_douleur', porte: true, photo: { id: 'condition-physique', dossier: 'domaines' }, type: 'radio', label: 'Ressentez-vous une douleur ou une gêne dans une jambe en marchant ?', options: OUI_NON, instrument: 'Claudication' ,
          aide: 'On parle d’une crampe, d’un serrement ou d’une lourdeur — le plus souvent dans le mollet — qui apparaît en marchant et s’estompe quand on s’arrête. Ce n’est pas la douleur d’une articulation comme le genou ou la hanche. Si oui, cinq questions la préciseront ; si non, elles ne vous seront pas posées.' },
        { id: 'edin_repos', type: 'radio', showIf: { reponse: 'edin_douleur', vaut: 'oui' }, label: 'Cette douleur apparaît-elle parfois lorsque vous êtes assis ou debout, sans bouger ?', options: OUI_NON, instrument: 'Claudication' },
        { id: 'edin_cote', type: 'radio', showIf: { reponse: 'edin_douleur', vaut: 'oui' }, label: 'La ressentez-vous en montant une côte ou en marchant vite ?', options: OUI_NON, instrument: 'Claudication' },
        { id: 'edin_plat', type: 'radio', showIf: { reponse: 'edin_douleur', vaut: 'oui' }, label: 'La ressentez-vous aussi en marchant à allure normale sur terrain plat ?', options: OUI_NON, instrument: 'Claudication' },
        { id: 'edin_arret', type: 'radio', showIf: { reponse: 'edin_douleur', vaut: 'oui' }, label: 'Que devient la douleur si vous vous arrêtez de marcher ?', instrument: 'Claudication',
          options: [
            { v: 'disparait', l: 'Elle disparaît, généralement en 10 minutes ou moins' },
            { v: 'persiste', l: 'Elle persiste plus longtemps' }
          ] },
        { id: 'edin_siege', type: 'radio', showIf: { reponse: 'edin_douleur', vaut: 'oui' }, label: 'Où se situe surtout cette douleur ?', instrument: 'Claudication',
          options: [
            { v: 'mollet', l: 'Le ou les mollets' },
            { v: 'cuisse_fesse', l: 'La cuisse ou la fesse' },
            { v: 'autre', l: 'Une autre localisation' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'metabolisme',
      titre: 'Diabète et métabolisme',
      photo: { id: 'metabolisme', dossier: 'domaines' },
      paragraphes: [
        'Le diabète de type 2 s’installe en silence, souvent plusieurs années avant d’être découvert. C’est pourquoi on ne se contente pas d’attendre des symptômes : on regarde les éléments qui, réunis, augmentent le risque — le tour de taille, ce qui a déjà été mesuré, ce qui existe dans la famille.',
        'Aucun risque n’est calculé ici. Vos réponses sont transmises telles quelles au médecin, qui décidera avec vous si une simple prise de sang est utile. Répondez de mémoire : un ordre de grandeur suffit.'
      ],
      intro: 'Ces questions complètent le poids et les antécédents déjà recueillis au Socle.',
      questions: [
        /* Le tour de taille prolonge le poids du Socle : il dit où se
           répartit la graisse, ce que le poids seul ne dit pas. Recueilli
           brut, comme tout le reste — aucun indice n’est formé ici. */
        { id: 'met_tour_taille', type: 'number', label: 'Tour de taille (cm), mesuré au niveau du nombril', min: 50, max: 200,
          aide: 'À mesurer debout, sans serrer, en fin d’expiration. Transmis brut : la plateforme n’en tire aucun indice.' },
        { id: 'met_glycemie_signalee', type: 'radio', label: 'Un médecin vous a-t-il déjà dit que votre glycémie, le sucre dans le sang, était trop élevée ?', options: OUI_NON },
        { id: 'met_valeurs_connues', type: 'textarea', label: 'Dernière glycémie à jeun ou hémoglobine glyquée connue, si vous l’avez',
          aide: 'Recopiez la valeur telle quelle. Aucune interprétation n’est faite par la plateforme.' },
        { id: 'met_symptomes', type: 'checkbox', label: 'Depuis quelque temps, ressentez-vous un ou plusieurs de ces signes ?',
          options: [
            { v: 'soif', l: 'Une soif inhabituelle' },
            { v: 'urines', l: 'Des urines plus fréquentes ou plus abondantes' },
            { v: 'fatigue', l: 'Une fatigue persistante' },
            { v: 'amaigrissement', l: 'Un amaigrissement sans raison' },
            { v: 'vision', l: 'Une vision qui se trouble par moments' },
            { v: 'cicatrisation', l: 'Des plaies qui cicatrisent lentement, ou des infections à répétition' }
          ] },
        { id: 'met_diabete_grossesse', type: 'radio', label: 'Avez-vous eu du diabète pendant une grossesse, ou mis au monde un enfant de plus de 4 kg ?',
          showIf: { sexe: 'F' }, options: OUI_NON },
        { id: 'met_traitement', type: 'radio', label: 'Prenez-vous un traitement pour le diabète, ou pour faire baisser le sucre ?', options: OUI_NON },
        { id: 'met_hypoglycemie', type: 'radio', label: 'Avez-vous des malaises avec sueurs, tremblements ou fringales, qui cèdent en mangeant ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'thyroide',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Thyroïde',
      photo: { id: 'thyroide', dossier: 'domaines' },
      paragraphes: [
        'La thyroïde règle beaucoup de choses en toile de fond : l’énergie, le poids, l’humeur, le rythme du cœur, la température du corps. Quand elle fonctionne mal, les signes sont discrets et faciles à mettre sur le compte de la fatigue ordinaire.',
        'Ces questions sont volontairement resserrées. Un simple symptôme isolé ne veut rien dire ; c’est l’association d’un terrain et de plusieurs signes qui compte, et c’est le médecin qui en décide. Rien n’est calculé ici.'
      ],
      intro: 'Ces questions ne conduisent à un dosage que si le médecin le juge utile, au vu du terrain et de plusieurs signes réunis.',
      questions: [
        { id: 'thy_sep', type: 'separateur', label: 'Terrain et signes',
          acte: 'Pour le médecin — oriente vers un dosage de TSH en première intention (T3/T4 seulement en cascade si TSH perturbée). Repère : terrain à risque associé à plusieurs signes. Aucun déclenchement automatique ; une écho thyroïdienne (KCQM001) ne se justifie jamais sur ce questionnaire seul.' },
        { id: 'thy_atcd_perso', type: 'radio', label: 'Une maladie de la thyroïde vous a-t-elle déjà été annoncée, ou prenez-vous un traitement pour la thyroïde ?', options: OUI_NON },
        { id: 'thy_atcd_fam', type: 'radio', label: 'Une maladie de la thyroïde existe-t-elle dans votre famille proche ?', options: OUI_NON },
        { id: 'thy_postpartum', type: 'radio', label: 'Avez-vous accouché au cours des douze derniers mois ?', showIf: { sexe: 'F' }, options: OUI_NON },
        { id: 'thy_symptomes', type: 'checkbox', label: 'Depuis quelque temps, ressentez-vous plusieurs de ces signes ?',
          aide: 'Ne cochez que ce qui a changé récemment et dure. Un seul signe isolé est fréquent et sans gravité.',
          options: [
            { v: 'fatigue', l: 'Une fatigue inhabituelle' },
            { v: 'poids', l: 'Une variation de poids sans changement d’alimentation' },
            { v: 'temperature', l: 'Une frilosité, ou au contraire une intolérance à la chaleur' },
            { v: 'coeur', l: 'Des palpitations ou un cœur qui s’emballe' },
            { v: 'transit', l: 'Une constipation, ou au contraire un transit accéléré' },
            { v: 'humeur', l: 'De la nervosité, de l’irritabilité, ou un moral en baisse' },
            { v: 'cheveux_peau', l: 'Des cheveux qui tombent, une peau très sèche' },
            { v: 'sommeil', l: 'Des troubles du sommeil ou de la concentration' }
          ] },
        { id: 'thy_gene_cou', type: 'radio', label: 'Avez-vous remarqué une gêne, une grosseur ou un gonflement à la base du cou ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'nutrition',
      titre: 'Nutrition',
      photo: { id: 'nutrition', dossier: 'domaines' },
      paragraphes: [
        'On ne cherche pas à noter votre alimentation, ni à vous dire quoi manger. On veut comprendre vos habitudes réelles — ce que vous mangez une semaine ordinaire — parce qu’elles pèsent sur presque tout le reste : le poids, la tension, le sucre, le cœur.',
        'Il n’y a pas de bonne case à cocher. Répondez pour une semaine typique, sans idéaliser. Ces réponses sont transmises au médecin ; la plateforme n’en tire aucun score ni aucun conseil automatique.'
      ],
      questions: [
        { id: 'nut_fruits_legumes', type: 'radio', label: 'Combien de portions de fruits et légumes mangez-vous par jour, en moyenne ?',
          options: [
            { v: '0a1', l: '0 à 1' }, { v: '2a3', l: '2 à 3' },
            { v: '4a5', l: '4 à 5' }, { v: 'plus5', l: 'Plus de 5' }
          ] },
        { id: 'nut_boissons_sucrees', type: 'radio', label: 'À quelle fréquence buvez-vous des boissons sucrées : sodas, jus, boissons énergisantes ?',
          options: [
            { v: 'rare', l: 'Jamais ou rarement' }, { v: 'hebdo', l: 'Une à deux fois par semaine' },
            { v: 'quotidien', l: 'Presque tous les jours' }, { v: 'pluriquotidien', l: 'Plusieurs fois par jour' }
          ] },
        { id: 'nut_ultra_transforme', type: 'radio', label: 'À quelle fréquence mangez-vous des plats préparés, de la restauration rapide ou des produits industriels ?',
          options: [
            { v: 'rare', l: 'Jamais ou rarement' }, { v: 'hebdo', l: 'Une à deux fois par semaine' },
            { v: 'souvent', l: 'Plusieurs fois par semaine' }, { v: 'quotidien', l: 'Presque tous les jours' }
          ] },
        { id: 'nut_poisson', type: 'radio', label: 'Combien de fois par semaine mangez-vous du poisson ?',
          options: [
            { v: 'jamais', l: 'Jamais' }, { v: 'une', l: 'Une fois' }, { v: 'deuxplus', l: 'Deux fois ou plus' }
          ] },
        { id: 'nut_viande_charcuterie', type: 'radio', label: 'Combien de fois par semaine mangez-vous de la viande rouge ou de la charcuterie ?',
          options: [
            { v: 'rare', l: 'Rarement' }, { v: '1a3', l: '1 à 3 fois' }, { v: '4plus', l: '4 fois ou plus' }
          ] },
        { id: 'nut_sel_ajoute', type: 'radio', label: 'Ajoutez-vous du sel à table avant d’avoir goûté le plat ?', options: OUI_NON },
        { id: 'nut_petit_dej', type: 'radio', label: 'Prenez-vous un petit-déjeuner ?',
          options: [
            { v: 'toujours', l: 'Tous les jours' }, { v: 'parfois', l: 'Parfois' }, { v: 'jamais', l: 'Jamais' }
          ] },
        { id: 'nut_grignotage', type: 'radio', label: 'Grignotez-vous entre les repas ?',
          options: [
            { v: 'rare', l: 'Rarement' }, { v: 'parfois', l: 'Parfois' }, { v: 'souvent', l: 'Souvent' }
          ] },
        { id: 'nut_regime', type: 'checkbox', label: 'Suivez-vous un régime ou une alimentation particulière ?',
          options: [
            { v: 'vegetarien', l: 'Végétarien ou végétalien' },
            { v: 'sans_gluten', l: 'Sans gluten' },
            { v: 'sans_lactose', l: 'Sans lactose' },
            { v: 'prescrit', l: 'Un régime prescrit par un médecin' },
            { v: 'autre', l: 'Autre' }
          ] },
        { id: 'nut_eau', type: 'radio', label: 'Combien buvez-vous d’eau par jour, environ ?',
          options: [
            { v: 'moins05', l: 'Moins d’un demi-litre' }, { v: 'un', l: 'Environ un litre' },
            { v: 'plus15', l: 'Un litre et demi ou plus' }
          ] },
        { id: 'nut_poids_evolution', type: 'radio', label: 'Votre poids a-t-il changé de façon notable ces six derniers mois ?',
          options: [
            { v: 'stable', l: 'Stable' }, { v: 'perte', l: 'J’ai perdu du poids' },
            { v: 'prise', l: 'J’ai pris du poids' }, { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },

        /* Repérage des troubles du comportement alimentaire — cinq
           questions publiées (SCOFF), libres de reproduction. */
        { id: 'scoff_sep', type: 'separateur', label: 'Votre rapport à l’alimentation',
          aide: 'Ces cinq questions sont posées à tout le monde. Répondez simplement par oui ou par non.' },
        { id: 'scoff_1', type: 'radio', label: 'Vous faites-vous vomir parce que vous vous sentez mal d’avoir trop mangé ?', options: OUI_NON, instrument: 'SCOFF' },
        { id: 'scoff_2', type: 'radio', label: 'Craignez-vous d’avoir perdu le contrôle des quantités que vous mangez ?', options: OUI_NON, instrument: 'SCOFF' },
        { id: 'scoff_3', type: 'radio', label: 'Avez-vous récemment perdu plus de 6 kg en moins de trois mois ?', options: OUI_NON, instrument: 'SCOFF' },
        { id: 'scoff_4', type: 'radio', label: 'Pensez-vous que vous êtes trop gros alors que d’autres vous trouvent trop mince ?', options: OUI_NON, instrument: 'SCOFF' },
        { id: 'scoff_5', type: 'radio', label: 'Diriez-vous que la nourriture occupe une place dominante dans votre vie ?', options: OUI_NON, instrument: 'SCOFF' }
      ]
    },

    /* ============================================================ */
    {
      id: 'activite',
      titre: 'Activité physique',
      photo: { id: 'condition-physique', dossier: 'domaines' },
      paragraphes: [
        'Bouger protège de presque tout : le cœur, le diabète, les os, le moral, le sommeil. Ces questions précisent ce que le Socle a seulement effleuré — non pour juger une performance, mais pour situer votre activité d’une semaine ordinaire.',
        'Le renforcement musculaire compte autant que l’endurance, et il est souvent oublié. Répondez pour une semaine habituelle. Comme ailleurs, rien n’est calculé ici : vos réponses vont au médecin.'
      ],
      intro: 'Ces questions précisent l’activité déjà abordée au Socle. Les minutes que vous y avez indiquées ne sont pas recomptées ici.',
      questions: [
        { id: 'act_jours_modere', type: 'radio', label: 'Combien de jours par semaine faites-vous une activité modérée d’au moins 30 minutes : marche rapide, vélo tranquille, jardinage ?',
          options: [
            { v: '0', l: 'Aucun' }, { v: '1a2', l: '1 à 2 jours' },
            { v: '3a4', l: '3 à 4 jours' }, { v: '5plus', l: '5 jours ou plus' }
          ] },
        { id: 'act_jours_intense', type: 'radio', label: 'Combien de jours par semaine faites-vous une activité intense qui vous essouffle nettement : course, sport, montée soutenue ?',
          options: [
            { v: '0', l: 'Aucun' }, { v: '1', l: '1 jour' },
            { v: '2', l: '2 jours' }, { v: '3plus', l: '3 jours ou plus' }
          ] },
        { id: 'act_renforcement', type: 'radio', label: 'Combien de fois par semaine renforcez-vous vos muscles : musculation, gymnastique, port de charges ?',
          options: [
            { v: 'jamais', l: 'Jamais' }, { v: 'une', l: 'Une fois' }, { v: 'deuxplus', l: 'Deux fois ou plus' }
          ] },
        { id: 'act_deplacements', type: 'radio', label: 'Vous déplacez-vous à pied ou à vélo pour vos trajets quotidiens ?',
          options: [
            { v: 'jamais', l: 'Jamais ou presque' }, { v: 'quelques', l: 'Quelques trajets' },
            { v: 'plupart', l: 'La plupart de mes trajets' }
          ] },
        { id: 'act_ecran_loisir', type: 'radio', label: 'Combien de temps passez-vous devant un écran pour vos loisirs, par jour ?',
          options: [
            { v: 'moins1', l: 'Moins d’une heure' }, { v: '1a3', l: '1 à 3 heures' }, { v: 'plus3', l: 'Plus de 3 heures' }
          ] },
        { id: 'act_escaliers', type: 'radio', label: 'Pouvez-vous monter deux étages à pied sans vous arrêter ?', options: OUI_NON },
        { id: 'act_evolution', type: 'radio', label: 'Votre niveau d’activité a-t-il changé cette dernière année ?',
          options: [
            { v: 'stable', l: 'Stable' }, { v: 'baisse', l: 'En baisse' }, { v: 'hausse', l: 'En hausse' }
          ] },
        { id: 'act_freins', type: 'checkbox', label: 'Qu’est-ce qui vous empêche de bouger davantage ?',
          options: [
            { v: 'temps', l: 'Le manque de temps' },
            { v: 'douleurs', l: 'Des douleurs' },
            { v: 'souffle', l: 'L’essoufflement ou la fatigue' },
            { v: 'motivation', l: 'Le manque d’envie ou de motivation' },
            { v: 'acces', l: 'Pas d’accès à un lieu adapté' },
            { v: 'rien', l: 'Rien de particulier' }
          ] },
        { id: 'act_accompagnement', type: 'radio', label: 'Souhaiteriez-vous être accompagné pour reprendre une activité physique ?', options: OUI_NON },

        /* Profil d'activité et de sédentarité — structure inspirée d'un
           questionnaire français publié (Ricci et Gagnon), libre. Recueil
           du profil ; aucun score n'est établi ici. */
        { id: 'ricci_sep', type: 'separateur', label: 'Votre profil sur une semaine ordinaire',
          aide: 'Pour chaque situation, indiquez la fréquence qui correspond le mieux à une semaine habituelle.' },
        { id: 'ricci_loisir', type: 'radio', label: 'Pratiquez-vous une activité physique de loisir ou un sport ?', instrument: 'Profil d’activité',
          options: [
            { v: '1', l: 'Jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Parfois' },
            { v: '4', l: 'Souvent' }, { v: '5', l: 'Très souvent' }
          ] },
        { id: 'ricci_intensite', type: 'radio', label: 'Quand vous bougez, à quelle intensité le faites-vous le plus souvent ?', instrument: 'Profil d’activité',
          options: [
            { v: '1', l: 'Faible : je ne suis pas essoufflé' },
            { v: '3', l: 'Modérée : je suis un peu essoufflé' },
            { v: '5', l: 'Élevée : je transpire et suis nettement essoufflé' }
          ] },
        { id: 'ricci_charges', type: 'radio', label: 'Portez-vous des charges lourdes, au travail ou à la maison ?', instrument: 'Profil d’activité',
          options: [
            { v: '1', l: 'Jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Parfois' },
            { v: '4', l: 'Souvent' }, { v: '5', l: 'Très souvent' }
          ] },
        { id: 'ricci_escaliers', type: 'radio', label: 'Prenez-vous les escaliers plutôt que l’ascenseur ou l’escalator ?', instrument: 'Profil d’activité',
          options: [
            { v: '1', l: 'Jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Parfois' },
            { v: '4', l: 'Souvent' }, { v: '5', l: 'Très souvent' }
          ] },
        { id: 'ricci_club', type: 'radio', label: 'Pratiquez-vous une activité encadrée : club, salle, cours ?', instrument: 'Profil d’activité',
          options: [
            { v: '1', l: 'Jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Parfois' },
            { v: '4', l: 'Souvent' }, { v: '5', l: 'Très souvent' }
          ] },
        { id: 'ricci_tele', type: 'radio', label: 'En dehors du travail, passez-vous de longues heures assis ou allongé : télévision, canapé, lecture ?', instrument: 'Profil d’activité',
          options: [
            { v: '5', l: 'Jamais' }, { v: '4', l: 'Rarement' }, { v: '3', l: 'Parfois' },
            { v: '2', l: 'Souvent' }, { v: '1', l: 'Très souvent' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'osseuse',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Os et articulations',
      photo: { id: 'osseuse', dossier: 'domaines' },
      paragraphes: [
        'L’os se fragilise sans douleur : on ne s’en aperçoit souvent qu’à la première fracture, celle qui survient pour un choc qui n’aurait rien dû casser. Ces questions cherchent les éléments qui, réunis, fragilisent l’os — un antécédent de fracture, certains traitements, l’histoire familiale.',
        'On y ajoute les chutes et la gêne des articulations, parce que prévenir une fracture, c’est aussi éviter de tomber. Rien n’est calculé ici : vos réponses sont transmises au médecin, qui verra avec vous si une mesure de la densité osseuse est justifiée.'
      ],
      questions: [
        { id: 'os_fracture_adulte', type: 'radio', label: 'Après 50 ans, avez-vous eu une fracture à la suite d’un choc léger, comme une chute de votre hauteur ?', options: OUI_NON },
        { id: 'os_fracture_hanche_parent', type: 'radio', label: 'L’un de vos parents a-t-il eu une fracture de la hanche ?', options: OUI_NON },
        { id: 'os_corticoides', type: 'radio', label: 'Prenez-vous, ou avez-vous pris longtemps, un traitement à base de cortisone : les corticoïdes ?', options: OUI_NON },
        { id: 'os_polyarthrite', type: 'radio', label: 'Une polyarthrite rhumatoïde vous a-t-elle été diagnostiquée ?', options: OUI_NON },
        { id: 'os_menopause', type: 'radio', label: 'À quel âge la ménopause est-elle survenue ?',
          showIf: { sexe: 'F' },
          options: [
            { v: 'non', l: 'Pas encore ménopausée' },
            { v: 'avant45', l: 'Avant 45 ans' },
            { v: '45plus', l: 'À 45 ans ou plus' },
            { v: 'ne_sais_pas', l: 'Je ne sais pas' }
          ] },
        { id: 'os_perte_taille', type: 'radio', label: 'Avez-vous l’impression d’avoir perdu plusieurs centimètres de taille avec les années ?', options: OUI_NON },
        { id: 'os_chutes', type: 'radio', label: 'Combien de fois êtes-vous tombé au cours des douze derniers mois ?',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Une fois' }, { v: '2plus', l: 'Deux fois ou plus' }
          ] },
        { id: 'os_peur_chute', type: 'radio', label: 'La peur de tomber vous fait-elle éviter certaines activités ?', options: OUI_NON },
        { id: 'os_equilibre', type: 'radio', label: 'Avez-vous des troubles de l’équilibre, ou besoin de vous appuyer pour vous lever d’une chaise ?', options: OUI_NON },
        { id: 'os_douleurs', type: 'checkbox', label: 'Avez-vous des douleurs articulaires régulières ? À quels endroits ?',
          options: [
            { v: 'mains', l: 'Mains ou poignets' },
            { v: 'epaules', l: 'Épaules' },
            { v: 'hanches', l: 'Hanches' },
            { v: 'genoux', l: 'Genoux' },
            { v: 'dos', l: 'Dos ou colonne' },
            { v: 'pieds', l: 'Pieds ou chevilles' }
          ] },
        { id: 'os_raideur_matinale', type: 'radio', label: 'Avez-vous une raideur des articulations le matin, qui met du temps à se dissiper ?', options: OUI_NON },
        { id: 'os_gene_quotidien', type: 'radio', label: 'Ces douleurs limitent-elles vos gestes du quotidien : marcher, monter, porter ?', options: OUI_NON },
        { id: 'os_laitages_soleil', type: 'radio', label: 'Consommez-vous des produits laitiers et vous exposez-vous un peu au soleil ?',
          options: [
            { v: 'regulier', l: 'Régulièrement' }, { v: 'rare', l: 'Rarement' }, { v: 'jamais', l: 'Presque jamais' }
          ] },

        /* Force et fonction musculaire — questionnaire publié à 5 items
           (SARC-F), libre. Structurellement réservé aux 65 ans et plus. */
        { id: 'sarcf_sep', type: 'separateur', label: 'Force et mobilité', showIf: { ageMin: 65 },
          acte: 'Pour le médecin — oriente vers un bilan fonctionnel : test de marche de 6 minutes (EQQP003), force de préhension et test du lever de chaise. Repère publié : total de 4 ou plus. Aucun déclenchement automatique.',
          aide: 'Indiquez, pour chaque geste, le niveau de difficulté que vous ressentez.' },
        { id: 'sarcf_force', type: 'radio', label: 'Difficulté à soulever et porter une charge d’environ 4 à 5 kilos', showIf: { ageMin: 65 }, instrument: 'SARC-F',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Quelque difficulté' }, { v: '2', l: 'Beaucoup, ou incapable' }
          ] },
        { id: 'sarcf_marche', type: 'radio', label: 'Difficulté à traverser une pièce à pied', showIf: { ageMin: 65 }, instrument: 'SARC-F',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Quelque difficulté' }, { v: '2', l: 'Beaucoup, ou incapable sans aide' }
          ] },
        { id: 'sarcf_lever', type: 'radio', label: 'Difficulté à vous lever d’une chaise ou d’un lit', showIf: { ageMin: 65 }, instrument: 'SARC-F',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Quelque difficulté' }, { v: '2', l: 'Beaucoup, ou incapable sans aide' }
          ] },
        { id: 'sarcf_escaliers', type: 'radio', label: 'Difficulté à monter un étage de dix marches', showIf: { ageMin: 65 }, instrument: 'SARC-F',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'Quelque difficulté' }, { v: '2', l: 'Beaucoup, ou incapable' }
          ] },
        { id: 'sarcf_chutes', type: 'radio', label: 'Combien de fois êtes-vous tombé au cours de la dernière année ?', showIf: { ageMin: 65 }, instrument: 'SARC-F',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: 'De 1 à 3 fois' }, { v: '2', l: '4 fois ou plus' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'tms',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Troubles musculo-squelettiques',
      paragraphes: [
        'Les troubles musculo-squelettiques — tendinites, lombalgies, douleurs de nuque ou de poignet — sont la première cause de gêne liée au travail. Ils s’installent par gestes répétés, postures maintenues et port de charges, et se prennent d’autant mieux qu’on s’y attaque tôt.',
        'Ces questions repèrent où se situe la gêne, depuis quand, et si le travail y contribue. Elles préparent l’examen ; rien n’y est calculé, et c’est le médecin qui décide de la suite.'
      ],
      questions: [
        /* Repérage par régions — structure de type questionnaire nordique
           (Kuorinka), libre. Recueil des zones et du retentissement. */
        { id: 'tms_sep', type: 'separateur', label: 'Où avez-vous mal, ces douze derniers mois ?',
          acte: 'Pour le médecin — un point d’appel documenté oriente vers une échographie musculo-tendineuse (PCQM001) ou, sur le rachis avec drapeaux rouges, une imagerie ciblée. Aucun déclenchement automatique.',
          aide: 'Cochez toutes les régions concernées.' },
        { id: 'tms_zones', porte: true, photo: { id: 'osseuse', dossier: 'domaines' }, type: 'checkbox', label: 'Régions douloureuses au cours des douze derniers mois', instrument: 'TMS — régions',
          aide: 'Cochez toutes les régions où vous avez eu des douleurs, des courbatures ou une gêne au cours des douze derniers mois, même passagères. Si vous cochez « bas du dos », quelques questions préciseront cette douleur.',
          options: [
            { v: 'nuque', l: 'Nuque' }, { v: 'epaules', l: 'Épaules' }, { v: 'coudes', l: 'Coudes' },
            { v: 'poignets_mains', l: 'Poignets ou mains' }, { v: 'dos_haut', l: 'Haut du dos' },
            { v: 'lombaires', l: 'Bas du dos (lombaires)' }, { v: 'hanches_cuisses', l: 'Hanches ou cuisses' },
            { v: 'genoux', l: 'Genoux' }, { v: 'chevilles_pieds', l: 'Chevilles ou pieds' }
          ] },
        { id: 'tms_7jours', type: 'radio', label: 'Avez-vous eu ces douleurs au cours des sept derniers jours ?', options: OUI_NON, instrument: 'TMS — régions' },
        { id: 'tms_gene', type: 'radio', label: 'Ces douleurs vous ont-elles empêché de travailler ou de faire vos activités habituelles ?', options: OUI_NON, instrument: 'TMS — régions' },
        { id: 'tms_travail', type: 'radio', label: 'Pensez-vous que votre travail y contribue ?', options: OUI_NON },
        { id: 'tms_expositions', type: 'checkbox', label: 'À quoi êtes-vous exposé au travail ou dans vos activités ?',
          options: [
            { v: 'repetitifs', l: 'Gestes répétés' }, { v: 'charges', l: 'Port de charges' },
            { v: 'postures', l: 'Postures contraignantes ou maintenues' }, { v: 'vibrations', l: 'Vibrations, outils vibrants' },
            { v: 'ecran', l: 'Travail prolongé sur écran' }
          ] },

        /* Lombalgie — repérage des drapeaux jaunes (chronicité), inspiré
           d'instruments publiés (Örebro / peurs-évitement), libres. */
        { id: 'tms_lomb_sep', type: 'separateur', label: 'Si votre dos vous gêne', showIf: { reponse: 'tms_zones', contient: 'lombaires' },
          aide: 'Ces questions ne concernent que le bas du dos. Passez-les si vous n’êtes pas concerné.' },
        { id: 'tms_lomb_duree', type: 'radio', showIf: { reponse: 'tms_zones', contient: 'lombaires' }, label: 'Depuis combien de temps votre dos vous gêne-t-il ?', instrument: 'Lombalgie',
          options: [
            { v: 'moins1', l: 'Moins d’un mois' }, { v: '1a3', l: 'Entre un et trois mois' }, { v: 'plus3', l: 'Plus de trois mois' }
          ] },
        { id: 'tms_lomb_peur', type: 'radio', showIf: { reponse: 'tms_zones', contient: 'lombaires' }, label: 'Pensez-vous qu’il serait dangereux pour votre dos de rester actif ou de bouger normalement ?', options: OUI_NON, instrument: 'Lombalgie' },
        { id: 'tms_lomb_travail', type: 'radio', showIf: { reponse: 'tms_zones', contient: 'lombaires' }, label: 'Cette douleur vous a-t-elle conduit à réduire ou à arrêter votre travail ?', options: OUI_NON, instrument: 'Lombalgie' },

        /* Canal carpien — structure d'un questionnaire publié (Boston /
           BCTQ), statut de licence à confirmer. Libellés neutres ; les
           signes cliniques simples suffisent au repérage. */
        { id: 'carpien_sep', type: 'separateur', label: 'Si vos mains vous réveillent la nuit',
          acte: 'Pour le médecin — paresthésies nocturnes typiques des trois premiers doigts : oriente vers un électromyogramme (AHQB032). Aucun déclenchement automatique.',
          licence: 'Structure inspirée d’un questionnaire publié du canal carpien. Statut de licence à confirmer : les libellés cliniques neutres ci-dessous suffisent au repérage.' },
        { id: 'carpien_nuit', porte: true, type: 'radio', label: 'Êtes-vous réveillé la nuit par des fourmillements ou un engourdissement de la main ?', options: OUI_NON, instrument: 'Canal carpien' ,
          aide: 'La main « s’endort » : picotements, fourmis, doigts engourdis, au point de devoir secouer la main pour que cela passe. C’est le signe le plus courant du canal carpien. Si oui, trois questions préciseront ces signes ; si non, elles ne vous seront pas posées.' },
        { id: 'carpien_doigts', type: 'radio', showIf: { reponse: 'carpien_nuit', vaut: 'oui' }, label: 'Ces fourmillements touchent-ils surtout le pouce, l’index et le majeur ?', options: OUI_NON, instrument: 'Canal carpien' },
        { id: 'carpien_secouer', type: 'radio', showIf: { reponse: 'carpien_nuit', vaut: 'oui' }, label: 'Sont-ils soulagés lorsque vous secouez la main ?', options: OUI_NON, instrument: 'Canal carpien' },
        { id: 'carpien_objets', type: 'radio', showIf: { reponse: 'carpien_nuit', vaut: 'oui' }, label: 'Vous arrive-t-il de manquer de force ou de laisser tomber des objets ?', options: OUI_NON, instrument: 'Canal carpien' }
      ]
    },

    /* ============================================================ */
    {
      id: 'douleur',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Douleur',
      paragraphes: [
        'La douleur qui dure n’est pas un simple prolongement de la douleur aiguë : elle a ses propres mécanismes, et certaines douleurs, dites neuropathiques, viennent d’une atteinte des nerfs plutôt que d’une lésion visible.',
        'Les décrire précisément — brûlure, décharge, fourmillement — oriente le traitement, car ces douleurs-là ne répondent pas aux antalgiques habituels. Ces réponses sont transmises au médecin, sans aucun calcul.'
      ],
      questions: [
        { id: 'doul_presence', porte: true, photo: { id: 'inflammation', dossier: 'domaines' }, type: 'radio', label: 'Avez-vous une douleur qui dure depuis plus de trois mois ?', options: OUI_NON ,
          aide: 'Une douleur qui dure ou revient depuis plus de trois mois, quelle qu’elle soit : dos, articulations, maux de tête répétés, douleurs de nerf… Si oui, quelques questions préciseront comment elle se manifeste ; si non, cette partie ne vous sera pas posée.' },
        { id: 'doul_localisation', type: 'textarea', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'Où se situe cette douleur ?' },
        { id: 'doul_intensite', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'En moyenne, comment évalueriez-vous son intensité ?',
          options: [
            { v: 'faible', l: 'Faible' }, { v: 'moderee', l: 'Modérée' },
            { v: 'forte', l: 'Forte' }, { v: 'tres_forte', l: 'Très forte' }
          ] },

        /* Douleur neuropathique — questionnaire d'interrogatoire publié
           (DN4, volet déclaratif à 7 items). Reproduction publiée ; usage
           commercial à vérifier. La partie examen se fait en consultation. */
        { id: 'dn4_sep', type: 'separateur', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'Si vous avez cette douleur, comment se manifeste-t-elle ?',
          aide: 'Répondez par oui ou par non pour chaque sensation, en pensant à la zone douloureuse.',
          licence: 'Volet déclaratif d’un questionnaire de douleur neuropathique à 7 items. Reproduction publiée ; conditions d’usage commercial à vérifier.' },
        { id: 'dn4_brulure', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'La douleur ressemble-t-elle à une brûlure ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_froid', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'Ressemble-t-elle à une sensation de froid douloureux ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_decharge', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'Ressemble-t-elle à des décharges électriques ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_fourmillement', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'S’accompagne-t-elle de fourmillements ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_picotement', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'S’accompagne-t-elle de picotements ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_engourdissement', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'S’accompagne-t-elle d’un engourdissement ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'dn4_demangeaison', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'S’accompagne-t-elle de démangeaisons ?', options: OUI_NON, instrument: 'Douleur neuropathique' },
        { id: 'doul_retentissement', type: 'radio', showIf: { reponse: 'doul_presence', vaut: 'oui' }, label: 'Cette douleur perturbe-t-elle votre sommeil, votre humeur ou vos activités ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'pelvien',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Santé sexuelle et pelvienne',
      paragraphes: [
        'Ce sont des sujets qu’on aborde rarement spontanément, alors qu’ils pèsent sur la qualité de vie et signalent parfois un problème plus général — le cœur, la prostate, le diabète, ou le périnée après une grossesse.',
        'Vous pouvez ne pas répondre, ou demander à n’en parler qu’oralement. Ces questions sont transmises au médecin ; elles ne donnent lieu à aucun calcul ni à aucune conclusion automatique.'
      ],
      questions: [
        /* Fonction érectile — questionnaire abrégé publié à 5 items
           (IIEF-5), protégé. Libellés neutres, substituer sous licence.
           Ne concerne, structurellement, que les hommes. */
        { id: 'iief_sep', type: 'separateur', label: 'Fonction sexuelle, ces six derniers mois',
          showIf: { sexe: 'M' },
          licence: 'Structure d’un questionnaire abrégé de fonction érectile à 5 items. Libellés provisoires : substituer le libellé officiel sous licence avant usage clinique ou commercial.' },
        { id: 'iief_confiance', type: 'radio', label: 'Confiance dans votre capacité à obtenir et maintenir une érection', showIf: { sexe: 'M' }, instrument: 'Fonction érectile',
          options: [
            { v: '1', l: 'Très faible' }, { v: '2', l: 'Faible' }, { v: '3', l: 'Moyenne' },
            { v: '4', l: 'Élevée' }, { v: '5', l: 'Très élevée' }
          ] },
        { id: 'iief_rigidite', type: 'radio', label: 'Rigidité suffisante pour un rapport, quand vous en avez', showIf: { sexe: 'M' }, instrument: 'Fonction érectile',
          options: [
            { v: '1', l: 'Presque jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Une fois sur deux' },
            { v: '4', l: 'Le plus souvent' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'iief_maintien', type: 'radio', label: 'Capacité à maintenir l’érection au cours du rapport', showIf: { sexe: 'M' }, instrument: 'Fonction érectile',
          options: [
            { v: '1', l: 'Presque jamais' }, { v: '2', l: 'Rarement' }, { v: '3', l: 'Une fois sur deux' },
            { v: '4', l: 'Le plus souvent' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'iief_difficulte', type: 'radio', label: 'Difficulté à maintenir l’érection jusqu’à la fin du rapport', showIf: { sexe: 'M' }, instrument: 'Fonction érectile',
          options: [
            { v: '1', l: 'Extrêmement difficile' }, { v: '2', l: 'Très difficile' }, { v: '3', l: 'Difficile' },
            { v: '4', l: 'Un peu difficile' }, { v: '5', l: 'Pas difficile' }
          ] },
        { id: 'iief_satisfaction', type: 'radio', label: 'Satisfaction à l’égard de vos rapports', showIf: { sexe: 'M' }, instrument: 'Fonction érectile',
          options: [
            { v: '1', l: 'Très insatisfait' }, { v: '2', l: 'Insatisfait' }, { v: '3', l: 'Partagé' },
            { v: '4', l: 'Satisfait' }, { v: '5', l: 'Très satisfait' }
          ] },

        /* Incontinence urinaire — questionnaire de retentissement publié
           (ICIQ), diffusion soumise à enregistrement. Libellés neutres. */
        { id: 'iciq_sep', type: 'separateur', label: 'Fuites urinaires',
          licence: 'Structure d’un questionnaire de retentissement de l’incontinence urinaire. Diffusion soumise à enregistrement : conditions à vérifier avant usage commercial.' },
        { id: 'iciq_frequence', porte: true, photo: { id: 'rein', dossier: 'domaines' }, type: 'radio', label: 'À quelle fréquence avez-vous des fuites urinaires ?', instrument: 'Incontinence',
          aide: 'Toute perte d’urine involontaire compte, même quelques gouttes — en toussant, en riant, en portant une charge, au sport, ou sur une envie trop pressante. C’est fréquent, chez les femmes comme chez les hommes, et cela se traite. Répondez « jamais » seulement si cela ne vous arrive vraiment jamais.',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ une fois par semaine' }, { v: '2', l: 'Deux à trois fois par semaine' },
            { v: '3', l: 'Environ une fois par jour' }, { v: '4', l: 'Plusieurs fois par jour' }, { v: '5', l: 'En permanence' }
          ] },
        { id: 'iciq_quantite', type: 'radio', showIf: { reponse: 'iciq_frequence', vaut: '1|2|3|4|5' }, label: 'Quelle quantité s’échappe habituellement ?', instrument: 'Incontinence',
          options: [
            { v: '0', l: 'Aucune' }, { v: '2', l: 'Une petite quantité' },
            { v: '4', l: 'Une quantité moyenne' }, { v: '6', l: 'Une grande quantité' }
          ] },
        { id: 'iciq_retentissement', type: 'radio', showIf: { reponse: 'iciq_frequence', vaut: '1|2|3|4|5' }, label: 'Ces fuites gênent-elles votre vie quotidienne ?', instrument: 'Incontinence',
          options: [
            { v: 'pas', l: 'Pas du tout' }, { v: 'peu', l: 'Un peu' }, { v: 'moyen', l: 'Moyennement' },
            { v: 'beaucoup', l: 'Beaucoup' }, { v: 'enormement', l: 'Énormément' }
          ] },
        { id: 'iciq_circonstances', type: 'checkbox', showIf: { reponse: 'iciq_frequence', vaut: '1|2|3|4|5' }, label: 'Dans quelles circonstances ces fuites surviennent-elles ?',
          options: [
            { v: 'effort', l: 'À l’effort : toux, rire, éternuement, sport' },
            { v: 'urgence', l: 'Avant d’arriver aux toilettes, sur une envie pressante' },
            { v: 'nuit', l: 'La nuit, pendant le sommeil' },
            { v: 'sans_raison', l: 'Sans raison apparente' },
            { v: 'permanence', l: 'En permanence' }
          ] },
        { id: 'pelvien_aborder', type: 'radio', label: 'Souhaitez-vous aborder ces sujets avec le médecin ?', options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'fragilite',
      titre: 'Autonomie, mémoire et fragilité',
      paragraphes: [
        'En avançant en âge, ce qui compte n’est pas seulement la maladie, mais l’autonomie : marcher, se souvenir, se nourrir, garder le lien. Ces fragilités s’installent lentement et se corrigent d’autant mieux qu’on les repère tôt.',
        'Ces questions ne concernent, par construction, que les personnes de 70 ans et plus. Elles préparent un examen plus complet ; rien n’y est calculé, et tout est transmis au médecin.'
      ],
      intro: 'Cette section s’adresse aux personnes de 70 ans et plus.',
      questions: [
        /* Repérage de la fragilité — six questions publiées (Gérontopôle),
           libres. Structurellement réservées aux 70 ans et plus. */
        { id: 'frag_sep', type: 'separateur', label: 'Depuis quelque temps', showIf: { ageMin: 70 },
          aide: 'Répondez simplement par oui ou par non.' },
        { id: 'frag_seul', type: 'radio', label: 'Vivez-vous seul ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'Repérage fragilité' },
        { id: 'frag_poids', type: 'radio', label: 'Avez-vous perdu du poids ces trois derniers mois ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'Repérage fragilité' },
        { id: 'frag_fatigue', type: 'radio', label: 'Vous sentez-vous plus fatigué depuis quelque temps ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'Repérage fragilité' },
        { id: 'frag_deplacement', type: 'radio', label: 'Avez-vous plus de difficultés à vous déplacer depuis quelque temps ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'Repérage fragilité' },
        { id: 'frag_marche_lente', type: 'radio', label: 'Marchez-vous plus lentement qu’auparavant ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'Repérage fragilité' },

        /* Mémoire — plainte subjective. Un test bref (rappel de mots,
           dessin d'une horloge) est réalisé en consultation, pas ici. */
        { id: 'frag_memoire_sep', type: 'separateur', label: 'Mémoire', showIf: { ageMin: 70 },
          aide: 'Un test de mémoire simple pourra vous être proposé en consultation. Ces questions portent seulement sur ce que vous ressentez.' },
        { id: 'frag_memoire_plainte', type: 'radio', label: 'Vous, ou vos proches, remarquez-vous des oublis plus fréquents : rendez-vous, noms, objets ?', showIf: { ageMin: 70 }, options: OUI_NON },
        { id: 'frag_memoire_gene', type: 'radio', label: 'Ces oublis gênent-ils vos activités de tous les jours ?', showIf: { ageMin: 70 }, options: OUI_NON },

        /* État nutritionnel du sujet âgé — questionnaire abrégé publié
           (MNA-SF), marque déposée. Libellés neutres. */
        { id: 'mna_sep', type: 'separateur', label: 'Alimentation ces trois derniers mois', showIf: { ageMin: 70 },
          licence: 'Structure d’un questionnaire abrégé d’évaluation nutritionnelle du sujet âgé (marque déposée). Libellés provisoires : vérifier les conditions de reproduction avant usage commercial.' },
        { id: 'mna_appetit', type: 'radio', label: 'Votre appétit a-t-il diminué ces trois derniers mois ?', showIf: { ageMin: 70 }, instrument: 'État nutritionnel',
          options: [
            { v: '0', l: 'Nettement' }, { v: '1', l: 'Légèrement' }, { v: '2', l: 'Pas de baisse' }
          ] },
        { id: 'mna_poids', type: 'radio', label: 'Avez-vous perdu du poids récemment, sans l’avoir cherché ?', showIf: { ageMin: 70 }, instrument: 'État nutritionnel',
          options: [
            { v: '0', l: 'Plus de 3 kg' }, { v: '1', l: 'Je ne sais pas' },
            { v: '2', l: 'Entre 1 et 3 kg' }, { v: '3', l: 'Aucune perte' }
          ] },
        { id: 'mna_mobilite', type: 'radio', label: 'Comment vous déplacez-vous au quotidien ?', showIf: { ageMin: 70 }, instrument: 'État nutritionnel',
          options: [
            { v: '0', l: 'Du lit au fauteuil' }, { v: '1', l: 'Autonome à l’intérieur' }, { v: '2', l: 'Je sors de chez moi' }
          ] },
        { id: 'mna_stress', type: 'radio', label: 'Avez-vous eu une maladie aiguë ou un événement éprouvant ces trois derniers mois ?', showIf: { ageMin: 70 }, options: OUI_NON, instrument: 'État nutritionnel' },

        { id: 'frag_aides', type: 'checkbox', label: 'Bénéficiez-vous d’aides au quotidien ?', showIf: { ageMin: 70 },
          options: [
            { v: 'aucune', l: 'Aucune' },
            { v: 'domicile', l: 'Aide à domicile' },
            { v: 'repas', l: 'Portage de repas' },
            { v: 'telealarme', l: 'Téléalarme' },
            { v: 'famille', l: 'Aide de l’entourage familial' }
          ] },
        { id: 'frag_isolement', type: 'radio', label: 'Vous arrive-t-il de passer plusieurs jours de suite sans voir personne ?', showIf: { ageMin: 70 }, options: OUI_NON },
        { id: 'frag_chute_peur', type: 'radio', label: 'Sortez-vous moins de chez vous par peur de tomber ou par manque d’assurance ?', showIf: { ageMin: 70 }, options: OUI_NON }
      ]
    },

    /* ============================================================ */
    {
      id: 'vision',
      showIf: { reponse: 'parcours', vaut: 'complet' },
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
        { id: 'vis_eclairs', type: 'radio', label: 'Voyez-vous des éclairs, des mouches volantes récentes ou une ombre dans le champ de vision ?', options: OUI_NON },
        { id: 'vis_diabete_fo', type: 'radio', label: 'Si vous êtes diabétique : à quand remonte votre dernier examen du fond de l’œil ?',
          acte: 'Pour le médecin — chez le diabétique de moins de 70 ans sans examen récent, oriente vers une rétinographie de dépistage (orthoptiste + lecture à distance, BGQP140). Aucun déclenchement automatique.',
          options: [
            { v: 'moins1', l: 'Moins d’un an' }, { v: '1a2', l: 'Entre un et deux ans' },
            { v: 'plus2', l: 'Plus de deux ans' }, { v: 'non_concerne', l: 'Jamais, ou je ne suis pas diabétique' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'audition',
      showIf: { reponse: 'parcours', vaut: 'complet' },
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
        { id: 'mental_actif', porte: true, type: 'radio', label: 'Exercez-vous actuellement une activité professionnelle ?', options: OUI_NON ,
          aide: 'Salarié, indépendant, intérimaire ou en formation professionnelle. Si oui, quelques questions porteront sur votre ressenti au travail ; si non, elles ne vous seront pas posées.' },
        { id: 'mental_travail', type: 'radio', label: 'Votre travail est-il une source importante de tension en ce moment ?', options: OUI_NON,
          showIf: { reponse: 'mental_actif', vaut: 'oui' } },

        /* Épuisement professionnel — structure en trois dimensions
           (épuisement, distanciation, accomplissement). Libellés neutres :
           l'inventaire de référence est protégé et son libellé officiel
           exige une licence. À remplir par les personnes en activité. */
        { id: 'burn_sep', type: 'separateur', label: 'Votre ressenti au travail',
          showIf: { reponse: 'mental_actif', vaut: 'oui' },
          aide: 'Indiquez, pour chaque phrase, à quelle fréquence elle correspond à ce que vous ressentez au travail.',
          licence: 'Structure en trois dimensions inspirée d’un inventaire d’épuisement professionnel protégé. Libellés provisoires : substituer le libellé officiel sous licence avant usage clinique ou commercial.' },
        { id: 'burn_1', type: 'radio', showIf: { reponse: 'mental_actif', vaut: 'oui' }, label: 'Je me sens vidé émotionnellement par mon travail', instrument: 'Épuisement professionnel',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Quelques fois par an' }, { v: '2', l: 'Quelques fois par mois' },
            { v: '3', l: 'Chaque semaine' }, { v: '4', l: 'Chaque jour' }
          ] },
        { id: 'burn_2', type: 'radio', showIf: { reponse: 'mental_actif', vaut: 'oui' }, label: 'À l’idée de commencer ma journée de travail, je me sens déjà fatigué', instrument: 'Épuisement professionnel',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Quelques fois par an' }, { v: '2', l: 'Quelques fois par mois' },
            { v: '3', l: 'Chaque semaine' }, { v: '4', l: 'Chaque jour' }
          ] },
        { id: 'burn_3', type: 'radio', showIf: { reponse: 'mental_actif', vaut: 'oui' }, label: 'Je suis devenu plus distant ou indifférent envers les personnes que je côtoie au travail', instrument: 'Épuisement professionnel',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Quelques fois par an' }, { v: '2', l: 'Quelques fois par mois' },
            { v: '3', l: 'Chaque semaine' }, { v: '4', l: 'Chaque jour' }
          ] },
        { id: 'burn_4', type: 'radio', showIf: { reponse: 'mental_actif', vaut: 'oui' }, label: 'Je doute du sens ou de l’utilité de mon travail', instrument: 'Épuisement professionnel',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Quelques fois par an' }, { v: '2', l: 'Quelques fois par mois' },
            { v: '3', l: 'Chaque semaine' }, { v: '4', l: 'Chaque jour' }
          ] },
        { id: 'burn_5', type: 'radio', showIf: { reponse: 'mental_actif', vaut: 'oui' }, label: 'J’ai le sentiment d’être efficace et de faire des choses qui en valent la peine dans mon travail', instrument: 'Épuisement professionnel',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Quelques fois par an' }, { v: '2', l: 'Quelques fois par mois' },
            { v: '3', l: 'Chaque semaine' }, { v: '4', l: 'Chaque jour' }
          ] }
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

        /* Symptômes urinaires du bas appareil — questionnaire publié à 7
           items plus une question de retentissement (IPSS), libre. Ne
           concerne, structurellement, que les hommes de 50 ans et plus. */
        { id: 'ipss_sep', type: 'separateur', label: 'Vos troubles urinaires, ce dernier mois',
          showIf: { sexe: 'M', ageMin: 50 },
          aide: 'Pour chaque situation, indiquez la fréquence qui correspond le mieux à ce dernier mois.' },
        { id: 'ipss_vidange', type: 'radio', label: 'Sensation de ne pas vider complètement votre vessie', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_frequence', type: 'radio', label: 'Besoin d’uriner à nouveau moins de deux heures après avoir uriné', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_intermittence', type: 'radio', label: 'Jet qui s’arrête et reprend à plusieurs reprises', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_urgence', type: 'radio', label: 'Difficulté à retenir l’envie d’uriner', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_jet_faible', type: 'radio', label: 'Jet urinaire faible', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_poussee', type: 'radio', label: 'Besoin de pousser ou de forcer pour commencer à uriner', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Environ 1 fois sur 5' }, { v: '2', l: 'Moins d’une fois sur deux' },
            { v: '3', l: 'Environ une fois sur deux' }, { v: '4', l: 'Plus d’une fois sur deux' }, { v: '5', l: 'Presque toujours' }
          ] },
        { id: 'ipss_nycturie', type: 'radio', label: 'Nombre de fois où vous vous levez la nuit pour uriner', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Aucune' }, { v: '1', l: '1 fois' }, { v: '2', l: '2 fois' },
            { v: '3', l: '3 fois' }, { v: '4', l: '4 fois' }, { v: '5', l: '5 fois ou plus' }
          ] },
        { id: 'ipss_qdv', type: 'radio', label: 'Si vous deviez vivre le reste de votre vie avec vos troubles urinaires actuels, comment le ressentiriez-vous ?', showIf: { sexe: 'M', ageMin: 50 }, instrument: 'Symptômes urinaires',
          options: [
            { v: '0', l: 'Très satisfait' }, { v: '1', l: 'Satisfait' }, { v: '2', l: 'Plutôt satisfait' },
            { v: '3', l: 'Partagé' }, { v: '4', l: 'Plutôt ennuyé' }, { v: '5', l: 'Ennuyé' }, { v: '6', l: 'Très ennuyé' }
          ] },
        { id: 'dep_aaa', type: 'radio', label: 'Avez-vous déjà eu une échographie de l’aorte abdominale ?',
          showIf: { sexe: 'M', ageMin: 65, ageMax: 75 }, options: OUI_NON },
        { id: 'dep_ist', type: 'radio', label: 'Souhaitez-vous aborder un dépistage des infections sexuellement transmissibles ?',
          options: OUI_NON },
        { id: 'dep_ist_dernier', type: 'text', label: 'Date de votre dernier dépistage, si vous la connaissez' },

        /* Facteurs de risque IST — items sourcés sur les critères HAS /
           CeGIDD. Formulation neutre et non stigmatisante ; réponses non
           destinées à l'accueil. Recueil seul, aucune conclusion ici. */
        { id: 'ist_sep', type: 'separateur', label: 'Quelques questions confidentielles sur les risques',
          acte: 'Pour le médecin — oriente vers un panel IST (VIH, VHB/VHC, chlamydia/gonocoque, syphilis). Repère publié : au moins un critère de risque. Aucun déclenchement automatique.',
          aide: 'Ces réponses sont confidentielles et ne sont pas visibles par le personnel d’accueil. Vous pouvez n’en parler qu’oralement avec le médecin.' },
        { id: 'ist_facteurs', type: 'checkbox', label: 'Au cours des douze derniers mois, l’une de ces situations vous concerne-t-elle ?',
          options: [
            { v: 'nouveau_partenaire', l: 'Un nouveau partenaire' },
            { v: 'plusieurs_partenaires', l: 'Plusieurs partenaires' },
            { v: 'partenaire_multi', l: 'Un partenaire qui a d’autres partenaires' },
            { v: 'sans_protection', l: 'Des rapports sans préservatif avec un nouveau partenaire' },
            { v: 'atcd_ist', l: 'Une infection sexuellement transmissible' },
            { v: 'partenaire_ist', l: 'Un partenaire ayant eu une infection sexuellement transmissible' }
          ] },
        { id: 'ist_terrain', type: 'checkbox', label: 'D’autres éléments, à cocher seulement s’ils s’appliquent',
          options: [
            { v: 'hsh', l: 'Homme ayant des rapports avec des hommes' },
            { v: 'drogues_inj', l: 'Usage de drogues par injection, par vous ou un partenaire' },
            { v: 'zone_prevalence', l: 'Vous ou un partenaire originaire d’une région de forte prévalence' },
            { v: 'travail_sexe', l: 'Rapports tarifés, pour vous ou un partenaire' },
            { v: 'jamais_depiste', l: 'Vous n’avez jamais été dépisté' }
          ] },
        { id: 'ist_symptomes', type: 'radio', label: 'Avez-vous actuellement des signes qui vous inquiètent : brûlures, écoulements, lésions, démangeaisons ?', options: OUI_NON }
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
        { id: 'bio_malaise_prise_sang', type: 'radio', label: 'Faites-vous des malaises lors des prises de sang ?', options: OUI_NON },

        /* Recherches ciblées sur terrain — items courts, orientant des
           analyses précises. Recueil seul ; le médecin prescrit. */
        { id: 'bio_cible_sep', type: 'separateur', label: 'Quelques recherches ciblées',
          acte: 'Pour le médecin — hémochromatose : ferritine + coefficient de saturation de la transferrine. Carence en fer : NFS + ferritine. Vitamine B12 sur terrain. Aucun déclenchement automatique.' },
        { id: 'bio_fer_famille', type: 'radio', label: 'Une hémochromatose, ou une surcharge en fer, existe-t-elle dans votre famille proche ?', options: OUI_NON, instrument: 'Fer' },
        { id: 'bio_fer_signes', type: 'checkbox', label: 'Ressentez-vous, sans explication, un ou plusieurs de ces signes durables ?',
          options: [
            { v: 'fatigue', l: 'Une fatigue chronique' },
            { v: 'articulations', l: 'Des douleurs articulaires, surtout aux mains' },
            { v: 'teint', l: 'Un teint qui a bruni sans exposition au soleil' }
          ], instrument: 'Fer' },
        { id: 'bio_martiale', type: 'checkbox', label: 'Cochez ce qui vous concerne',
          options: [
            { v: 'regles_abondantes', l: 'Des règles abondantes' },
            { v: 'regime', l: 'Un régime restrictif ou sans viande' },
            { v: 'fatigue_essoufflement', l: 'Une fatigue ou un essoufflement à l’effort' }
          ], instrument: 'Fer' },
        { id: 'bio_b12', type: 'checkbox', label: 'Êtes-vous dans l’une de ces situations ?',
          options: [
            { v: 'metformine', l: 'Traitement par metformine depuis longtemps' },
            { v: 'vegetalien', l: 'Alimentation végétalienne stricte' },
            { v: 'age', l: 'Vous avez plus de 65 ans' }
          ], instrument: 'Vitamine B12' },

        /* Reins — surtout une règle sur données (diabète, HTA, antécédents
           déjà au Socle), complétée ici par les médicaments néphrotoxiques. */
        { id: 'bio_rein_sep', type: 'separateur', label: 'Reins',
          acte: 'Pour le médecin — diabète, hypertension, antécédent familial rénal, ou plus de 60 ans avec médicaments néphrotoxiques : oriente vers créatinine + DFG estimé et rapport albuminurie/créatininurie (RAC). Recommandé chaque année, souvent sous-prescrit. Aucun déclenchement automatique.' },
        { id: 'bio_nephrotox', type: 'radio', label: 'Prenez-vous régulièrement, et depuis longtemps, des anti-inflammatoires ou d’autres médicaments qui sollicitent les reins ?', options: OUI_NON, instrument: 'Rein' },

        /* Tuberculose — indications de l'IGRA limitées : item de terrain
           discret, jamais un dépistage large. */
        { id: 'bio_tuberculose_sep', type: 'separateur', label: 'Tuberculose',
          acte: 'Pour le médecin — sur terrain précis uniquement (contact étroit, région de forte prévalence, avant certains traitements) : test IGRA, aux indications remboursables limitées. Aucun déclenchement automatique.' },
        { id: 'bio_tuberculose', type: 'radio', label: 'Avez-vous été en contact étroit avec une personne atteinte de tuberculose, ou vécu dans une région où elle est fréquente ?', options: OUI_NON, instrument: 'Tuberculose' }
      ]
    },

    /* ============================================================ */
    {
      id: 'perinatal',
      titre: 'Grossesse et après la naissance',
      paragraphes: [
        'La grossesse et les semaines qui suivent la naissance sont une période de grands bouleversements, du corps comme de l’esprit. Certains troubles y sont fréquents et discrets : la dépression qui suit l’accouchement touche environ une mère sur sept, et passe souvent inaperçue.',
        'Ces questions ne concernent que les femmes enceintes ou ayant accouché récemment. Vous pouvez ne pas répondre. Rien n’y est calculé, et si quelque chose est difficile maintenant, dites-le sans attendre au professionnel qui vous suit.'
      ],
      intro: 'Cette section s’adresse aux femmes enceintes ou ayant accouché au cours des derniers mois.',
      questions: [
        { id: 'peri_statut', type: 'radio', label: 'Où en êtes-vous ?', showIf: { sexe: 'F' },
          options: [
            { v: 'enceinte', l: 'Je suis enceinte' },
            { v: 'post', l: 'J’ai accouché récemment' },
            { v: 'aucun', l: 'Ni l’un ni l’autre' }
          ] },
        { id: 'peri_declaration', type: 'radio', label: 'Votre grossesse est-elle déclarée, et un entretien prénatal vous a-t-il été proposé ?', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'enceinte' }, options: OUI_NON },

        /* Diabète gestationnel — facteurs de risque publiés (CNGOF).
           Oriente une HGPO entre 24 et 28 semaines ; recueil seul. */
        { id: 'peri_dg_sep', type: 'separateur', label: 'Grossesse — facteurs de risque', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'enceinte' },
          acte: 'Pour le professionnel — oriente vers une HGPO 75 g entre 24 et 28 semaines. Aucun déclenchement automatique.' },
        { id: 'peri_dg', type: 'checkbox', label: 'L’un de ces éléments vous concerne-t-il ?', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'enceinte' }, instrument: 'Risque diabète gestationnel',
          options: [
            { v: 'atcd_dg', l: 'Un diabète lors d’une grossesse précédente' },
            { v: 'macrosomie', l: 'Un enfant né avec un poids élevé (plus de 4 kg)' },
            { v: 'corpulence', l: 'Un surpoids avant la grossesse' },
            { v: 'famille', l: 'Un diabète dans la famille proche' },
            { v: 'age', l: 'Un âge de 35 ans ou plus' },
            { v: 'sopk', l: 'Un syndrome des ovaires polykystiques' }
          ] },

        /* Dépression du post-partum — échelle publiée d'Édimbourg (EPDS),
           libre d'usage clinique, 10 items sur les 7 derniers jours.
           L'item sur les idées de se faire du mal ouvre un circuit d'alerte. */
        { id: 'epds_sep', type: 'separateur', label: 'Après la naissance — comment vous sentez-vous ?', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' },
          acte: 'Pour le professionnel — oriente l’entretien postnatal (SP12/SP14) et, si besoin, une évaluation de dépression (ALQP003). Repère publié : total de 11 ou plus, ou item d’alerte positif. Aucun déclenchement automatique.',
          aide: 'Répondez en pensant aux sept derniers jours, et non à aujourd’hui seulement.' },
        { id: 'epds_1', type: 'radio', label: 'J’ai pu rire et voir le bon côté des choses', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Autant que d’habitude' }, { v: '1', l: 'Un peu moins que d’habitude' },
            { v: '2', l: 'Beaucoup moins que d’habitude' }, { v: '3', l: 'Plus du tout' }
          ] },
        { id: 'epds_2', type: 'radio', label: 'Je me suis réjouie à l’idée de ce qui vient', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Autant que d’habitude' }, { v: '1', l: 'Plutôt moins' },
            { v: '2', l: 'Beaucoup moins' }, { v: '3', l: 'Presque pas' }
          ] },
        { id: 'epds_3', type: 'radio', label: 'Je me suis reprochée, sans raison, d’être responsable quand les choses allaient mal', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, jamais' }, { v: '1', l: 'Pas très souvent' },
            { v: '2', l: 'Oui, parfois' }, { v: '3', l: 'Oui, la plupart du temps' }
          ] },
        { id: 'epds_4', type: 'radio', label: 'Je me suis sentie inquiète ou soucieuse sans motif', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, pas du tout' }, { v: '1', l: 'Presque jamais' },
            { v: '2', l: 'Oui, parfois' }, { v: '3', l: 'Oui, très souvent' }
          ] },
        { id: 'epds_5', type: 'radio', label: 'Je me suis sentie effrayée ou paniquée sans vraiment de raison', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, pas du tout' }, { v: '1', l: 'Non, pas très souvent' },
            { v: '2', l: 'Oui, parfois' }, { v: '3', l: 'Oui, très souvent' }
          ] },
        { id: 'epds_6', type: 'radio', label: 'J’ai eu tendance à me sentir dépassée par les événements', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, je m’en suis sortie aussi bien que d’habitude' }, { v: '1', l: 'Non, la plupart du temps je m’en suis bien sortie' },
            { v: '2', l: 'Oui, parfois je n’ai pas réussi à faire face' }, { v: '3', l: 'Oui, la plupart du temps' }
          ] },
        { id: 'epds_7', type: 'radio', label: 'Je me suis sentie si malheureuse que j’ai eu du mal à dormir', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, pas du tout' }, { v: '1', l: 'Pas très souvent' },
            { v: '2', l: 'Oui, parfois' }, { v: '3', l: 'Oui, la plupart du temps' }
          ] },
        { id: 'epds_8', type: 'radio', label: 'Je me suis sentie triste ou peu heureuse', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, pas du tout' }, { v: '1', l: 'Pas très souvent' },
            { v: '2', l: 'Oui, assez souvent' }, { v: '3', l: 'Oui, la plupart du temps' }
          ] },
        { id: 'epds_9', type: 'radio', label: 'Je me suis sentie si malheureuse que j’ai pleuré', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          options: [
            { v: '0', l: 'Non, jamais' }, { v: '1', l: 'Seulement de temps en temps' },
            { v: '2', l: 'Oui, assez souvent' }, { v: '3', l: 'Oui, la plupart du temps' }
          ] },
        { id: 'epds_10', type: 'radio', label: 'Il m’est arrivé de penser à me faire du mal', showIf: { sexe: 'F', reponse: 'peri_statut', vaut: 'post' }, instrument: 'EPDS',
          alerte_circuit: true,
          aide: 'Si cette question vous préoccupe, parlez-en dès maintenant au professionnel qui vous suit. Vous pouvez aussi appeler le 3114, numéro national de prévention du suicide, à tout moment et gratuitement.',
          options: [
            { v: '0', l: 'Jamais' }, { v: '1', l: 'Presque jamais' },
            { v: '2', l: 'Parfois' }, { v: '3', l: 'Oui, assez souvent' }
          ] }
      ]
    },

    /* ============================================================ */
    {
      id: 'enfant',
      showIf: { reponse: 'parcours', vaut: 'complet' },
      titre: 'Santé de l’enfant',
      paragraphes: [
        'Chez l’enfant, l’essentiel du dépistage tient à quelques repères de développement, de vision et d’audition. Ce sont souvent les parents qui remarquent les premiers un décalage, et plus il est repéré tôt, plus l’accompagnement est simple et efficace.',
        'Cette section se remplit par un parent, pour un enfant, et s’appuie sur les repères du carnet de santé. Rien n’y est calculé ; les réponses préparent l’examen du médecin, qui reste seul juge de la suite.'
      ],
      intro: 'Section remplie par un parent, pour un enfant. Passez-la si elle ne vous concerne pas.',
      questions: [
        { id: 'enf_concerne', type: 'radio', label: 'Remplissez-vous cette section pour un enfant ?', options: OUI_NON },
        { id: 'enf_age', type: 'number', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Âge de l’enfant (en années)', min: 0, max: 17 },

        /* Repérage des troubles du neuro-développement — s'appuie sur les
           livrets officiels de repérage et le carnet de santé. */
        { id: 'tnd_sep', type: 'separateur', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Développement',
          acte: 'Pour le médecin — un signe d’alerte oriente vers une consultation de repérage TND (CTE), puis une consultation d’évaluation (CCE) et la plateforme de coordination. Aucun déclenchement automatique.',
          aide: 'Cochez ce qui vous inquiète, en vous fiant à votre ressenti de parent.' },
        { id: 'tnd_signes', type: 'checkbox', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Remarquez-vous un décalage ou une inquiétude dans l’un de ces domaines ?', instrument: 'Repérage TND',
          options: [
            { v: 'langage', l: 'Le langage ou la communication' },
            { v: 'social', l: 'Les interactions avec les autres, le regard, le jeu' },
            { v: 'motricite', l: 'La motricité, l’équilibre, la coordination' },
            { v: 'comportement', l: 'Le comportement, l’attention, les réactions aux sons ou aux lumières' },
            { v: 'apprentissages', l: 'Les apprentissages (lecture, écriture, calcul)' }
          ] },
        { id: 'tnd_certificats', type: 'radio', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Les examens obligatoires de l’enfant sont-ils à jour (carnet de santé) ?', options: OUI_NON },

        /* Vision de l'enfant — signes d'appel (carnet de santé). */
        { id: 'enf_vision_sep', type: 'separateur', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Vision',
          acte: 'Pour le médecin — un signe d’appel oriente vers un bilan orthoptique de dépistage. Aucun déclenchement automatique.' },
        { id: 'enf_vision', type: 'checkbox', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Avez-vous remarqué l’un de ces signes ?', instrument: 'Vision enfant',
          options: [
            { v: 'strabisme', l: 'Un œil qui dévie, un strabisme' },
            { v: 'approche', l: 'Il approche beaucoup les objets ou le livre de ses yeux' },
            { v: 'plisse', l: 'Il plisse les yeux ou penche la tête pour regarder' },
            { v: 'cogne', l: 'Il se cogne ou tombe souvent' },
            { v: 'jamais_depiste', l: 'Il n’a jamais eu de dépistage visuel' }
          ] },

        /* Audition de l'enfant — signes d'appel, lien parcours TND. */
        { id: 'enf_audition_sep', type: 'separateur', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Audition',
          acte: 'Pour le médecin — un doute avant 3 ans oriente vers un dépistage auditif pédiatrique (CDRP002) ; chez l’enfant plus grand, une audiométrie avec tympanométrie (CDQP002). Aucun déclenchement automatique.' },
        { id: 'enf_audition', type: 'checkbox', showIf: { reponse: 'enf_concerne', vaut: 'oui' }, label: 'Avez-vous remarqué l’un de ces signes ?', instrument: 'Audition enfant',
          options: [
            { v: 'sons', l: 'Il ne réagit pas toujours aux sons ou aux appels' },
            { v: 'langage', l: 'Un retard ou une régression du langage' },
            { v: 'otites', l: 'Des otites à répétition' },
            { v: 'volume', l: 'Il monte le son, se fait souvent répéter' }
          ] }
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
    titre: 'Risque de diabète — questionnaire de risque publié',
    contenu: [
      'Éléments réunis par les questionnaires de risque publiés : âge, corpulence, tour de taille, activité physique, consommation de fruits et légumes, traitement pour la tension, antécédent de glycémie élevée, antécédent familial de diabète.',
      'Ces éléments sont recueillis en clair, répartis dans plusieurs sections, et transmis tels quels.',
      'La plateforme n’additionne rien et ne classe personne. Le repérage et la décision d’une prise de sang appartiennent au médecin.',
      'La confirmation passe par une glycémie à jeun ou une hémoglobine glyquée : un questionnaire ne remplace pas la mesure.'
    ]
  },
  {
    titre: 'Alimentation — repères nutritionnels publiés',
    contenu: [
      'Repères de fréquence issus des recommandations publiques : au moins cinq fruits et légumes par jour, des féculents complets et des légumineuses, du poisson deux fois par semaine.',
      'Repères de limitation : boissons sucrées, sel, charcuterie et produits ultra-transformés.',
      'Ces repères sont les mêmes pour tous : ils décrivent une recommandation générale, jamais votre alimentation.',
      'Aucun score alimentaire n’est établi par la plateforme.'
    ]
  },
  {
    titre: 'Activité physique — recommandations publiées',
    contenu: [
      'Repère publié pour l’adulte : de 150 à 300 minutes d’activité modérée par semaine, ou de 75 à 150 minutes d’activité intense, réparties sur plusieurs jours.',
      'Deux séances de renforcement musculaire par semaine sont recommandées en complément.',
      'Réduire le temps passé assis, et le fractionner, compte indépendamment de l’activité pratiquée.',
      'Les minutes déclarées sont transmises brutes. La plateforme ne les additionne pas et ne conclut pas.'
    ]
  },
  {
    titre: 'Fragilité osseuse et chutes — facteurs et cadre',
    contenu: [
      'Facteurs de fragilité réunis par les outils publiés : âge, sexe, antécédent personnel de fracture, fracture de la hanche chez un parent, tabac, alcool, corticothérapie prolongée, polyarthrite rhumatoïde, ménopause précoce.',
      'La mesure de la densité osseuse, l’ostéodensitométrie, est l’examen de confirmation ; ses indications de prise en charge sont définies par la nomenclature.',
      'La plateforme ne calcule aucun risque de fracture. Les facteurs sont transmis en clair au médecin.',
      'Prévenir une fracture, c’est aussi prévenir la chute : antécédent de chute, trouble de l’équilibre et peur de tomber sont recueillis à cette fin.'
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
    titre: 'Dépendance nicotinique — grille publiée',
    contenu: [
      'Somme des six items, de 0 à 10.',
      'De 0 à 2 : dépendance très faible. 3 à 4 : faible. 5 : moyenne. 6 à 7 : forte. 8 à 10 : très forte.',
      'Le délai entre le réveil et la première cigarette est l’item le plus prédictif.',
      'La somme n’est pas calculée par la plateforme : les six réponses sont transmises telles quelles.'
    ]
  },
  {
    titre: 'Consommation d’alcool — AUDIT complet',
    contenu: [
      'Dix items, de 0 à 40. Les trois premiers, recueillis au Socle, forment l’AUDIT-C.',
      'Repère de repérage publié : 8 ou plus évoque un usage à risque ; des adaptations existent selon le sexe et l’âge.',
      'La plateforme n’additionne rien. Le total et son interprétation appartiennent au médecin.'
    ]
  },
  {
    titre: 'Cannabis — questionnaire publié en six questions',
    contenu: [
      'Six items cotés de 0 à 4, portant sur les douze derniers mois.',
      'Des repères publiés distinguent un usage à risque d’un usage problématique.',
      'La plateforme ne fait aucune somme : les six réponses sont transmises telles quelles.'
    ]
  },
  {
    titre: 'Insomnie — index de sévérité, grille publiée',
    contenu: [
      'Sept items cotés de 0 à 4, de 0 à 28.',
      'De 0 à 7 : absence d’insomnie. 8 à 14 : légère. 15 à 21 : modérée. 22 à 28 : sévère.',
      'La somme n’est pas calculée par la plateforme.'
    ]
  },
  {
    titre: 'Troubles du comportement alimentaire — cinq questions publiées',
    contenu: [
      'Cinq questions en oui / non.',
      'Repère publié : deux réponses « oui » ou plus justifient un entretien approfondi.',
      'Le décompte n’est pas fait par la plateforme ; les cinq réponses sont affichées telles quelles.'
    ]
  },
  {
    titre: 'Activité physique — profil et sédentarité',
    contenu: [
      'Le profil recueilli décrit l’activité au travail, dans les loisirs et les déplacements, ainsi que le temps sédentaire.',
      'Les questionnaires publiés distinguent des profils inactif, actif et très actif ; le temps assis prolongé est un facteur à part entière.',
      'Aucun profil n’est calculé par la plateforme : les réponses sont transmises brutes.'
    ]
  },
  {
    titre: 'Symptômes urinaires — score international, grille publiée',
    contenu: [
      'Sept items cotés de 0 à 5, de 0 à 35, complétés d’une question de retentissement séparée.',
      'De 0 à 7 : symptômes légers. 8 à 19 : modérés. 20 à 35 : sévères.',
      'La somme n’est pas calculée par la plateforme. La question de qualité de vie ne s’additionne pas aux sept autres.'
    ]
  },
  {
    titre: 'Douleur neuropathique — questionnaire publié',
    contenu: [
      'Dix éléments : sept d’interrogatoire, recueillis ici, et trois d’examen, réalisés en consultation.',
      'Repère publié : quatre éléments positifs sur dix orientent vers une douleur neuropathique.',
      'La plateforme ne compte rien, et l’examen clinique ne peut pas être remplacé par le questionnaire.'
    ]
  },
  {
    titre: 'Fonction érectile — questionnaire abrégé, grille publiée',
    contenu: [
      'Cinq items cotés de 1 à 5, de 5 à 25.',
      'Un total inférieur ou égal à 21 évoque une difficulté ; la sévérité se lit par tranches.',
      'La plateforme ne calcule pas ce total. Une difficulté érectile peut être le premier signe d’une atteinte vasculaire.'
    ]
  },
  {
    titre: 'Incontinence urinaire — questionnaire de retentissement publié',
    contenu: [
      'Le questionnaire combine la fréquence, la quantité et la gêne ressentie.',
      'Toute fuite retentissant sur la vie quotidienne justifie une évaluation, sans seuil chiffré impératif.',
      'La plateforme n’établit aucun score. Les circonstances distinguent une fuite d’effort d’une fuite par urgence.'
    ]
  },
  {
    titre: 'Épuisement professionnel — cadre',
    contenu: [
      'L’épuisement professionnel se lit en trois dimensions distinctes : l’épuisement, la distanciation, et le sentiment d’accomplissement.',
      'Il ne se résume pas à un score unique : chaque dimension s’interprète séparément, et le contexte de travail est déterminant.',
      'La plateforme ne calcule rien. L’inventaire de référence est protégé ; son libellé officiel suppose une licence.'
    ]
  },
  {
    titre: 'Repérage de la fragilité — six questions publiées',
    contenu: [
      'Six questions en oui / non, destinées aux personnes âgées autonomes.',
      'Une seule réponse évoquant une perte récente d’autonomie invite à une évaluation de la fragilité.',
      'La plateforme ne conclut pas : les six réponses sont transmises au médecin.'
    ]
  },
  {
    titre: 'État nutritionnel du sujet âgé — questionnaire abrégé publié',
    contenu: [
      'Questionnaire abrégé de dépistage, de 0 à 14.',
      'De 12 à 14 : état nutritionnel normal. 8 à 11 : risque de dénutrition. 0 à 7 : dénutrition.',
      'La somme n’est pas calculée par la plateforme. Le libellé de référence est une marque déposée.'
    ]
  },
  {
    titre: 'Claudication — questionnaire d’Édimbourg, cadre',
    contenu: [
      'Six questions publiées, libres, orientant vers une artériopathie des membres inférieurs.',
      'Un profil positif — douleur du mollet à la marche, disparaissant à l’arrêt en dix minutes ou moins — oriente vers un écho-doppler des artères des membres inférieurs (EDQM001).',
      'La plateforme n’applique pas l’algorithme : les six réponses sont transmises telles quelles au médecin.'
    ]
  },
  {
    titre: 'Force musculaire — SARC-F, grille publiée',
    contenu: [
      'Cinq items cotés de 0 à 2, de 0 à 10.',
      'Repère publié : un total de 4 ou plus évoque une sarcopénie et justifie un bilan fonctionnel.',
      'La somme n’est pas calculée par la plateforme. Le bilan associe test de marche de 6 minutes (EQQP003, seul acte coté), force de préhension et test du lever de chaise.'
    ]
  },
  {
    titre: 'Risque IST — critères d’orientation',
    contenu: [
      'Facteurs sourcés sur les recommandations publiques : partenaires multiples ou nouveaux, rapports non protégés, antécédent d’infection sexuellement transmissible, usage de drogues injectables, terrain de forte prévalence, absence de dépistage antérieur.',
      'La présence d’au moins un facteur oriente vers un panel complet (VIH, VHB/VHC, chlamydia/gonocoque, syphilis).',
      'Deux circuits sans ordonnance existent : dépistage du VIH en laboratoire, et dispositif dédié pour les moins de 26 ans.',
      'La plateforme ne conclut rien et n’affiche aucun résultat : les réponses, confidentielles, sont transmises au médecin.'
    ]
  },
  {
    titre: 'Thyroïde — règle de prescription restrictive',
    contenu: [
      'La TSH seule est l’examen de première intention ; T3 et T4 ne se dosent qu’en cascade, si la TSH est perturbée.',
      'Le dosage se justifie sur un terrain à risque — femme, âge avancé, antécédents familiaux, post-partum — associé à plusieurs signes cliniques, non sur un symptôme isolé.',
      'Un dépistage large et non ciblé génère un afflux de dosages sans bénéfice : la construction restrictive est volontaire.',
      'La plateforme ne prescrit rien. Une échographie thyroïdienne (KCQM001) ne se justifie jamais sur ce questionnaire seul, mais sur une TSH perturbée ou un nodule palpé.'
    ]
  },
  {
    titre: 'Recherches ciblées — fer et vitamine B12',
    contenu: [
      'Hémochromatose : antécédent familial ou signes évocateurs orientent vers ferritine et coefficient de saturation de la transferrine ; c’est le dépistage génétique courant le plus rentable.',
      'Carence martiale : règles abondantes, régime restrictif ou fatigue orientent vers NFS et ferritine.',
      'Vitamine B12 : traitement prolongé par metformine, alimentation végétalienne stricte ou âge avancé.',
      'La plateforme ne prescrit rien : les éléments sont transmis au médecin, qui choisit les analyses.'
    ]
  },
  {
    titre: 'Troubles musculo-squelettiques — cadre',
    contenu: [
      'Le repérage par régions, de type questionnaire nordique, situe les zones douloureuses et leur retentissement ; un point d’appel clinique documenté oriente vers une échographie musculo-tendineuse (PCQM001).',
      'Sur le rachis, seuls les drapeaux rouges justifient une imagerie ; la peur de bouger et la chronicité sont des drapeaux jaunes, à repérer tôt.',
      'Canal carpien : des paresthésies nocturnes des trois premiers doigts, soulagées en secouant la main, orientent vers un électromyogramme (AHQB032).',
      'La plateforme ne calcule aucun score. Le questionnaire de référence du canal carpien est de statut de licence à confirmer.'
    ]
  },
  {
    titre: 'Terrain allergique — cadre',
    contenu: [
      'Un terrain allergique symptomatique — rhinite, conjonctivite, asthme, eczéma — oriente vers des tests cutanés (prick-tests, FGRB003), et non l’inverse.',
      'Le lien entre les symptômes et un environnement précis oriente le choix des allergènes testés.',
      'La plateforme ne conclut pas : le médecin décide de l’exploration, réalisée dans un environnement permettant de traiter une réaction sévère.'
    ]
  },
  {
    titre: 'Dépression du post-partum — EPDS, grille publiée',
    contenu: [
      'Dix items cotés de 0 à 3, de 0 à 30, portant sur les sept derniers jours.',
      'Repère publié : un total de 11 ou plus oriente vers une évaluation ; le seuil peut être adapté selon le contexte.',
      'L’item relatif aux idées de se faire du mal impose une évaluation directe, quel que soit le total, et ouvre un circuit d’alerte immédiat.',
      'La somme n’est pas calculée par la plateforme. L’entretien postnatal (SP12/SP14) est le cadre de restitution.'
    ]
  },
  {
    titre: 'Diabète gestationnel — facteurs de risque publiés',
    contenu: [
      'Facteurs retenus (CNGOF) : antécédent de diabète gestationnel, enfant de poids élevé, surpoids, antécédent familial de diabète, âge de 35 ans ou plus, syndrome des ovaires polykystiques.',
      'La présence d’un facteur oriente vers une HGPO 75 g entre 24 et 28 semaines.',
      'La plateforme ne conclut pas : les facteurs sont transmis à la sage-femme ou au médecin.'
    ]
  },
  {
    titre: 'Repérage du neuro-développement — cadre',
    contenu: [
      'Le repérage s’appuie sur les livrets officiels par tranche d’âge et sur les repères du carnet de santé.',
      'Un signe d’alerte oriente vers une consultation de repérage (CTE), puis une consultation d’évaluation (CCE) et la plateforme de coordination.',
      'Le formulaire complet, archivé, est la première protection en cas de contrôle : un dossier laconique est le motif de rejet le plus fréquent.',
      'La plateforme ne conclut pas ; elle transmet les observations du parent au médecin.'
    ]
  },
  {
    titre: 'Vision et audition de l’enfant — cadre',
    contenu: [
      'Vision : un signe d’appel — strabisme, objets approchés, tête penchée, chutes fréquentes — oriente vers un bilan orthoptique de dépistage.',
      'Audition : avant 3 ans, un doute oriente vers un dépistage auditif pédiatrique (CDRP002) ; plus tard, une audiométrie avec tympanométrie (CDQP002), notamment sur otites répétées.',
      'Ces dépistages se coordonnent avec le parcours de repérage du neuro-développement.',
      'La plateforme ne conclut pas : les observations du parent sont transmises au médecin.'
    ]
  },
  {
    titre: 'Biologie — conditions d’indication (le vrai enjeu)',
    contenu: [
      'En biologie, le risque n’est pas le tarif mais la condition d’indication : chaque code porte la sienne.',
      'Diabète : l’acte de dépistage couvert est la glycémie à jeun. L’hémoglobine glyquée est historiquement réservée au SUIVI de l’équilibre — vérifier l’extension au diagnostic avant de la prescrire en dépistage.',
      'Bilan lipidique (EAL) : ensemble indissociable, fréquence de renouvellement encadrée.',
      'Rein : créatinine + DFG estimé (incompatible avec la clairance mesurée), et rapport albuminurie/créatininurie — recommandé chaque année chez le diabétique et l’hypertendu.',
      'Thyroïde : TSH seule en première intention ; T3 et T4 uniquement en cascade si la TSH est perturbée.',
      'La plateforme ne prescrit rien : elle transmet le point d’appel, le médecin choisit l’analyse et en porte l’indication.'
    ]
  },
  {
    titre: 'Biologie — pièges à ne jamais prescrire en dépistage',
    contenu: [
      'Vitamine D : remboursement limité à quelques indications strictes ; le dosage de dépistage n’est pas couvert. C’est le piège le plus fréquent.',
      'PSA : remboursé sur prescription, mais aucun dépistage organisé — décision partagée et tracée, jamais déclenchée par un questionnaire.',
      'Lp(a) : recommandée une fois dans la vie par les sociétés savantes, mais non couverte en France.',
      'Homocystéine : radiée de la nomenclature. Bilans « micronutrition » : hors nomenclature.',
      'Test IGRA (tuberculose) : indications remboursables limitées, à cadrer précisément avant tout circuit.'
    ]
  },
  {
    titre: 'Circuits biologiques sans ordonnance',
    contenu: [
      'Deux circuits permettent un dépistage sans passage préalable par une ordonnance.',
      'Dépistage du VIH : réalisable dans tout laboratoire, sans ordonnance, pris en charge à 100 %.',
      'Dispositif dédié aux moins de 26 ans : dépistage d’infections sexuellement transmissibles sans ordonnance, pris en charge à 100 % dans cette tranche d’âge.',
      'Ces circuits sont les plus simples et les plus protecteurs juridiquement ; le questionnaire informe, il ne se substitue pas au consentement.'
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
