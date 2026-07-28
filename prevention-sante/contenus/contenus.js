/* =====================================================================
   M8 — BIBLIOTHÈQUE DE CONTENU ÉDUCATIF
   Version 0.1.

   RÈGLE UNIQUE, ET ELLE EST STRICTE
   Ces contenus sont GÉNÉRIQUES et NON INDIVIDUALISÉS. Ils sont
   identiques pour tout le monde, dans le même ordre, quelles que
   soient les réponses au questionnaire.

   La tentation évidente serait de mettre en avant les fiches
   « pertinentes pour vous » à partir du questionnaire. Ce serait :
     - produire une information propre à un patient donné, c'est-à-dire
       exactement ce que la version 1 s'interdit ;
     - réutiliser des données de soin pour une autre finalité que celle
       déclarée, donc un détournement de finalité.

   Conséquence codée : ce fichier n'accède à aucune réponse, à aucun
   dossier et à aucun compte. Il ne lit rien. Le test de non-régression
   vérifie qu'aucune référence à `reponses`, `dossier` ou `compte` n'y
   apparaît.

   Les contenus sont volontairement descriptifs et prudents. Ils ne
   remplacent pas une consultation et ne délivrent aucun avis
   individuel. Ils restent à relire par un médecin référent avant mise
   en service.
   ===================================================================== */

'use strict';

const CONTENUS = [
  {
    theme: 'Tabac', icone: 'i-lungs',
    resume: 'Arrêter reste le geste de prévention au bénéfice le mieux établi, à tout âge.',
    fiches: [
      { titre: 'Ce que change l’arrêt, et à quelle échéance',
        texte: 'Le bénéfice de l’arrêt commence tôt et se poursuit longtemps. Le risque cardiovasculaire diminue dès les premiers mois, le risque respiratoire et le risque de cancer plus lentement, sur plusieurs années. L’âge n’annule pas le bénéfice : arrêter après cinquante ans améliore encore l’espérance de vie et la capacité respiratoire.' },
      { titre: 'Les aides qui existent',
        texte: 'Les substituts nicotiniques sont remboursables sur prescription. Un accompagnement, même bref, augmente nettement les chances de réussite par rapport à une tentative sans aide. Les rechutes sont la règle plus que l’exception : elles font partie du processus et ne signent pas un échec.' },
      { titre: 'Parler des paquets-années',
        texte: 'Le nombre de paquets-années combine la quantité fumée et la durée. Il sert au médecin à apprécier l’intérêt de certains examens respiratoires. Vous n’avez pas à le calculer : indiquez simplement combien de cigarettes par jour et pendant combien d’années.' }
    ]
  },
  {
    theme: 'Activité physique', icone: 'i-activity',
    resume: 'Le premier palier de bénéfice s’obtient bien avant les recommandations complètes.',
    fiches: [
      { titre: 'Le seuil qui compte le plus',
        texte: 'C’est le passage de l’inactivité à une activité modérée régulière qui apporte le gain le plus important. Les repères usuels évoquent environ cent cinquante minutes hebdomadaires d’activité modérée, mais tout mouvement supplémentaire compte, y compris fractionné en séquences courtes.' },
      { titre: 'La sédentarité est un sujet distinct',
        texte: 'Rester assis longtemps a un effet propre, indépendant du sport pratiqué par ailleurs. Interrompre les positions assises prolongées, même brièvement et plusieurs fois par jour, est une cible en soi.' },
      { titre: 'Reprendre après une longue interruption',
        texte: 'Une reprise progressive limite les blessures et les abandons. En cas de reprise intense, d’antécédent cardiaque personnel ou familial, ou de symptôme à l’effort, un avis médical préalable est utile.' }
    ]
  },
  {
    theme: 'Sommeil', icone: 'i-moon',
    resume: 'Le ronflement avec somnolence en journée mérite un avis, pas une résignation.',
    fiches: [
      { titre: 'Quand le ronflement devient un sujet médical',
        texte: 'Le ronflement seul est fréquent et souvent banal. Associé à des pauses respiratoires constatées par l’entourage, à une somnolence dans la journée ou à un sommeil non réparateur, il justifie une évaluation. Le syndrome d’apnées du sommeil est fréquent, sous-diagnostiqué, et se traite.' },
      { titre: 'Somnolence et conduite',
        texte: 'S’endormir ou se sentir au bord de l’endormissement au volant est un signal à mentionner sans attendre, en particulier si vous conduisez dans le cadre de votre travail. Ce n’est pas un détail d’organisation, c’est un enjeu de sécurité.' },
      { titre: 'Ce qui aide, sans traitement',
        texte: 'Horaires réguliers, chambre fraîche et sombre, limitation de l’alcool en soirée, écrans écartés avant le coucher. Ces mesures améliorent la qualité du sommeil mais ne traitent pas un trouble respiratoire du sommeil, qui relève d’une prise en charge spécifique.' }
    ]
  },
  {
    theme: 'Cœur et vaisseaux', icone: 'i-heart',
    resume: 'Le risque se construit sur plusieurs facteurs à la fois, pas sur un seul chiffre.',
    fiches: [
      { titre: 'Pourquoi un chiffre isolé ne dit pas grand-chose',
        texte: 'Le risque cardiovasculaire se calcule en combinant l’âge, le sexe, le tabac, la pression artérielle et le cholestérol. Un taux de cholestérol pris seul, sans les autres éléments, ne permet pas de conclure. C’est pourquoi le médecin les rassemble avant de décider quoi que ce soit.' },
      { titre: 'La tension se mesure plusieurs fois',
        texte: 'Une tension élevée sur une seule mesure ne suffit pas à parler d’hypertension. La confirmation passe par des mesures répétées, souvent en dehors du cabinet. À l’inverse, une tension normale un jour donné ne dispense pas d’un suivi si des facteurs de risque existent.' },
      { titre: 'Les antécédents familiaux qui comptent',
        texte: 'Un infarctus ou un accident vasculaire cérébral survenu tôt chez un parent proche — avant cinquante-cinq ans chez un homme, avant soixante-cinq ans chez une femme — modifie l’appréciation du risque. Une mort subite avant cinquante ans est également un élément à signaler.' }
    ]
  },
  {
    theme: 'Peau et soleil', icone: 'i-sun',
    resume: 'Une lésion qui change est le seul signal qui doit toujours être montré.',
    fiches: [
      { titre: 'Ce qui doit être montré à un médecin',
        texte: 'Une tache nouvelle, ou qui change de forme, de couleur, de taille, qui démange, saigne ou s’épaissit. Une lésion qui ne ressemble pas aux autres. Le critère décisif est le changement, davantage que l’aspect à un instant donné.' },
      { titre: 'Les expositions passées comptent encore',
        texte: 'Les coups de soleil sévères de l’enfance et de l’adolescence, ainsi que l’exposition professionnelle cumulée, pèsent durablement sur le risque. Une peau qui bronze difficilement et brûle facilement appelle une vigilance particulière.' },
      { titre: 'Aucun algorithme ne conclut',
        texte: 'Les photographies et l’examen de la peau sont lus par un dermatologue. Aucun logiciel, ici ou ailleurs, ne remplace cette lecture. Les applications de reconnaissance d’images ne sont pas fiables pour écarter un mélanome.' }
    ]
  },
  {
    theme: 'Dépistages organisés', icone: 'i-shield',
    resume: 'Trois programmes nationaux, gratuits, et pourtant largement sous-utilisés.',
    fiches: [
      { titre: 'Ce que couvrent les programmes nationaux',
        texte: 'Le dépistage du cancer colorectal concerne les personnes de cinquante à soixante-quatorze ans, tous les deux ans, par un test à faire chez soi. Le dépistage du cancer du sein concerne les femmes de cinquante à soixante-quatorze ans, tous les deux ans. Le dépistage du cancer du col de l’utérus s’adresse aux femmes de vingt-cinq à soixante-cinq ans, selon des modalités qui évoluent avec l’âge.' },
      { titre: 'La prostate n’a pas de dépistage organisé',
        texte: 'Il n’existe pas de programme national de dépistage du cancer de la prostate. Le dosage du PSA relève d’une décision partagée avec le médecin, après information sur ses bénéfices et ses limites, notamment le risque de détecter des cancers qui n’auraient jamais évolué.' },
      { titre: 'Un test négatif n’est pas un permis d’oublier',
        texte: 'Les dépistages sont périodiques parce qu’un résultat rassurant ne vaut que pour le moment où il est fait. Le respect de la périodicité compte davantage que la réalisation d’un test isolé.' }
    ]
  },
  {
    theme: 'Vaccinations', icone: 'i-syringe',
    resume: 'À l’âge adulte, la couverture vaccinale se dégrade surtout par oubli.',
    fiches: [
      { titre: 'Les rappels de l’adulte',
        texte: 'Le rappel diphtérie-tétanos-poliomyélite suit un calendrier espacé à l’âge adulte, ce qui le rend facile à oublier. Le carnet de vaccination, papier ou numérique, est le seul moyen fiable de savoir où vous en êtes.' },
      { titre: 'Les vaccinations selon la situation',
        texte: 'Certaines vaccinations dépendent de l’âge, d’une exposition professionnelle, d’un voyage, d’une grossesse ou d’un état de santé particulier. Elles se discutent au cas par cas avec le médecin.' },
      { titre: 'Apporter son carnet change tout',
        texte: 'Sans carnet, une vaccination est souvent refaite par précaution ou reportée. Le retrouver avant la visite est le geste le plus simple pour éviter l’un et l’autre.' }
    ]
  },
  {
    theme: 'Moral et anxiété', icone: 'i-brain',
    resume: 'Repérer sans organiser la suite ne sert à rien : la suite fait partie du repérage.',
    fiches: [
      { titre: 'Pourquoi ces questions sont posées à tout le monde',
        texte: 'Les troubles anxieux et dépressifs sont fréquents et souvent non repérés. Les questions sont posées à tous, dans le même ordre, sans présélection. Vous n’êtes pas obligé de répondre : vous pouvez laisser vide et en parler directement au médecin.' },
      { titre: 'Ce qui se passe ensuite',
        texte: 'Le repérage n’aboutit jamais à un simple résultat remis en main propre. Une consultation médicale dédiée est prévue, et une orientation est identifiée en aval. Repérer sans prévoir la prise en charge serait une faute.' },
      { titre: 'Si la situation est urgente',
        texte: 'Si vous avez des pensées de mort ou l’idée de vous faire du mal, n’attendez pas la visite. Le 3114 est le numéro national de prévention du suicide, gratuit, joignable à toute heure. Vous pouvez aussi en parler dès le début de la consultation.' }
    ]
  },
  {
    theme: 'Alcool', icone: 'i-flask',
    resume: 'Les repères ont été revus à la baisse, et beaucoup de gens l’ignorent.',
    fiches: [
      { titre: 'Les repères actuels',
        texte: 'Les repères de consommation à moindre risque en France sont de dix verres standard par semaine au maximum, pas plus de deux par jour, et des jours sans consommation. Ces repères sont plus bas que ceux diffusés il y a quinze ans.' },
      { titre: 'Ce qu’un verre standard représente',
        texte: 'Un verre standard correspond à environ dix grammes d’alcool pur, quelle que soit la boisson. Les contenants servis à domicile sont fréquemment plus généreux que le verre standard, ce qui conduit à sous-estimer sa propre consommation.' },
      { titre: 'Parler de sa consommation',
        texte: 'Les questions posées sur l’alcool ne visent pas à juger mais à situer un niveau de risque. Une consommation régulière modérée peut justifier un bilan hépatique ; une consommation plus élevée, un accompagnement.' }
    ]
  },
  {
    theme: 'Vision et audition', icone: 'i-eye',
    resume: 'Deux fonctions qui se dégradent lentement, donc sans qu’on s’en aperçoive.',
    fiches: [
      { titre: 'La vision après quarante-cinq ans',
        texte: 'La gêne de lecture de près est banale et corrigeable. Le contrôle régulier a un autre objet : rechercher un glaucome ou une atteinte de la rétine, qui évoluent longtemps sans symptôme. Un antécédent familial de glaucome ou un diabète renforcent l’intérêt de ce contrôle.' },
      { titre: 'Les signaux visuels à ne pas attendre',
        texte: 'Des éclairs lumineux, des mouches volantes récentes et nombreuses, ou une ombre dans le champ de vision appellent un avis rapide, sans attendre un rendez-vous de routine.' },
      { titre: 'L’audition et le bruit',
        texte: 'La perte auditive liée au bruit s’installe progressivement et ne se récupère pas. Faire répéter, monter le volume, peiner à suivre une conversation dans un lieu bruyant sont des signes précoces. L’exposition de loisir compte autant que l’exposition professionnelle.' }
    ]
  }
];

/* =====================================================================
   RENDU — aucune lecture d'aucune donnée, aucun filtrage
   ===================================================================== */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function rendre() {
  document.getElementById('app').innerHTML = `
    <div class="intro">
      <h1>Comprendre, sans se faire peur</h1>
      <p class="lede">Des repères généraux sur les principaux sujets de prévention. Ces
      contenus sont les mêmes pour tout le monde et dans le même ordre : ils ne sont jamais
      sélectionnés en fonction de vos réponses au questionnaire.</p>
      <div class="avis">
        Ces pages ne remplacent pas une consultation et ne constituent pas un avis médical
        personnel. Si une question vous concerne, posez-la au médecin qui vous recevra.
      </div>
    </div>

    <div class="themes">
      ${CONTENUS.map((c, i) => `
        <section class="theme">
          <div class="t-h">
            <div class="t-ic"><svg class="ico"><use href="#${esc(c.icone)}"/></svg></div>
            <div>
              <h2>${esc(c.theme)}</h2>
              <p class="t-r">${esc(c.resume)}</p>
            </div>
          </div>
          ${c.fiches.map(f => `
            <details>
              <summary>${esc(f.titre)}</summary>
              <p class="a">${esc(f.texte)}</p>
            </details>`).join('')}
        </section>`).join('')}
    </div>

    <div class="fin">
      <p><b>Pourquoi rien n’est personnalisé ici.</b> Mettre en avant les fiches
      « pertinentes pour vous » à partir de vos réponses reviendrait à produire une
      information propre à votre situation, ce que cette version de la plateforme s’interdit,
      et à réutiliser des données recueillies pour votre soin à une autre fin que celle
      annoncée. Ces contenus restent donc volontairement identiques pour tous.</p>
      <p style="margin-top:13px">Contenus à relire par un médecin référent avant mise en
      service.</p>
    </div>`;
}

window.addEventListener('DOMContentLoaded', rendre);
