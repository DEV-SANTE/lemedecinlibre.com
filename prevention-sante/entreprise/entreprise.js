/* =====================================================================
   M9 — PORTAIL ENTREPRISE
   Version 0.1 — données fictives.

   LE POINT DE VIGILANCE RGPD MAJEUR DU PROJET
   L'employeur ne doit jamais accéder à une donnée de santé nominative.
   Mais l'anonymat ne se décrète pas : sur un petit effectif, un
   pourcentage suffit à réidentifier. « 33 % des participants fument »
   sur trois participants désigne une personne.

   TROIS GARDES CODÉES ICI

   1. SEUIL D'EFFECTIF (k-anonymat)
      Aucun chiffre n'est publié si l'effectif du sous-groupe est
      inférieur à SEUIL_PUBLICATION. La fonction publier() renvoie une
      mention de suppression au lieu de la valeur. Ce n'est pas une
      option d'affichage : la valeur n'est jamais calculée ni transmise.

   2. AUCUNE DONNÉE INDIVIDUELLE EN ENTRÉE
      Ce module ne reçoit que des compteurs déjà agrégés. Il n'a accès
      à aucune liste de personnes, aucun identifiant, aucune réponse.
      À la migration, l'API entreprise devra renvoyer des agrégats
      calculés côté serveur, jamais des dossiers.

   3. AUCUN CROISEMENT
      Les découpages ne sont pas combinables. Croiser site et tranche
      d'âge, ou service et thème de santé, réduit les effectifs jusqu'à
      la réidentification. Le portail expose des découpages simples,
      chacun contrôlé par le seuil, jamais deux à la fois.
   ===================================================================== */

'use strict';

/* Onze est le plus petit seuil couramment retenu pour publier un
   pourcentage sans permettre de remonter à une personne. À confirmer
   avec le délégué à la protection des données avant mise en service. */
const SEUIL_PUBLICATION = 11;

/* =====================================================================
   DONNÉES FICTIVES — déjà agrégées
   Deux entreprises, volontairement de tailles très différentes, pour
   montrer le seuil à l'œuvre.
   ===================================================================== */
const ENTREPRISES = [
  {
    id: 'grande',
    nom: 'Entreprise Alpha (fictive)',
    effectif: 420,
    accord: 'Accord signé en février 2026 · 420 salariés couverts',
    participants: 186,
    invites: 420,
    /* Répartition logistique — ne relève pas de la donnée de santé */
    parSite: [
      { libelle: 'Site en gare', n: 71 },
      { libelle: 'Centre en ville', n: 84 },
      { libelle: 'Partenaire indépendant', n: 31 }
    ],
    parCreneau: [
      { libelle: 'Avant 9h', n: 78 },
      { libelle: 'Pause déjeuner', n: 44 },
      { libelle: 'Après 18h', n: 52 },
      { libelle: 'Samedi', n: 12 }
    ],
    /* Agrégats de prévention, à gros grain */
    themes: [
      { libelle: 'Au moins un examen complémentaire réalisé', n: 97 },
      { libelle: 'Orientation vers un suivi ou un spécialiste', n: 41 },
      { libelle: 'Mise à jour d’une vaccination', n: 58 },
      { libelle: 'Accompagnement au sevrage tabagique proposé', n: 23 },
      { libelle: 'Dépistage organisé réalisé ou programmé', n: 62 }
    ],
    /* Économie et engagement */
    resteAChargeMoyen: 3.1,
    renouvellement: { echus: 0, renouveles: 0 },
    satisfaction: { repondants: 141, tresSatisfaits: 96, satisfaits: 33 }
  },
  {
    id: 'petite',
    nom: 'Entreprise Bêta (fictive)',
    effectif: 14,
    accord: 'Accord signé en juin 2026 · 14 salariés couverts',
    participants: 6,
    invites: 14,
    parSite: [
      { libelle: 'Centre en ville', n: 4 },
      { libelle: 'Partenaire indépendant', n: 2 }
    ],
    parCreneau: [
      { libelle: 'Avant 9h', n: 3 },
      { libelle: 'Pause déjeuner', n: 2 },
      { libelle: 'Après 18h', n: 1 }
    ],
    themes: [
      { libelle: 'Au moins un examen complémentaire réalisé', n: 4 },
      { libelle: 'Orientation vers un suivi ou un spécialiste', n: 2 },
      { libelle: 'Mise à jour d’une vaccination', n: 3 },
      { libelle: 'Accompagnement au sevrage tabagique proposé', n: 1 },
      { libelle: 'Dépistage organisé réalisé ou programmé', n: 2 }
    ],
    resteAChargeMoyen: 2.4,
    renouvellement: { echus: 0, renouveles: 0 },
    satisfaction: { repondants: 5, tresSatisfaits: 4, satisfaits: 1 }
  }
];

/* =====================================================================
   GARDE 1 — PUBLICATION SOUS SEUIL
   ===================================================================== */
function publier(numerateur, denominateur, format) {
  if (denominateur == null || denominateur < SEUIL_PUBLICATION) {
    return { publie: false, effectif: denominateur };
  }
  if (format === 'part') {
    return { publie: true, texte: Math.round((numerateur / denominateur) * 100) + ' %' };
  }
  if (format === 'euro') {
    return { publie: true, texte: numerateur.toFixed(2).replace('.', ',') + ' €' };
  }
  return { publie: true, texte: String(numerateur) };
}

function rendu(p) {
  if (p.publie) return '<b>' + p.texte + '</b>';
  return '<span class="masque">Non publié — effectif de ' +
    (p.effectif == null ? '0' : p.effectif) + ' personne' +
    ((p.effectif || 0) > 1 ? 's' : '') + ', inférieur au seuil de ' +
    SEUIL_PUBLICATION + '</span>';
}

/* =====================================================================
   RENDU
   ===================================================================== */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

let choisie = ENTREPRISES[0].id;

function barre(items, total) {
  const max = Math.max.apply(null, items.map(i => i.n)) || 1;
  return items.map(i => {
    const p = publier(i.n, total, 'part');
    return `<div class="ligne">
      <span class="lib">${esc(i.libelle)}</span>
      <span class="jauge"><i style="width:${p.publie ? Math.round((i.n / max) * 100) : 0}%"></i></span>
      <span class="val">${rendu(p)}</span>
    </div>`;
  }).join('');
}

function rendre() {
  const e = ENTREPRISES.find(x => x.id === choisie);
  const part = publier(e.participants, e.invites, 'part');
  const sat = publier(e.satisfaction.tresSatisfaits + e.satisfaction.satisfaits,
    e.satisfaction.repondants, 'part');
  const rac = publier(e.resteAChargeMoyen, e.participants, 'euro');
  const sousSeuil = e.participants < SEUIL_PUBLICATION;

  document.getElementById('app').innerHTML = `
    <div class="head">
      <div>
        <h1>${esc(e.nom)}</h1>
        <p class="sub">${esc(e.accord)}</p>
      </div>
      <div class="switch">
        ${ENTREPRISES.map(x => `<button data-e="${esc(x.id)}" class="${x.id === choisie ? 'on' : ''}">
          ${esc(x.nom.replace(' (fictive)', ''))} · ${x.effectif} salariés</button>`).join('')}
      </div>
    </div>

    ${sousSeuil ? `<div class="avis bloque">
      <b>La quasi-totalité de ce rapport est masquée.</b> ${e.participants} personnes ont
      participé, en dessous du seuil de ${SEUIL_PUBLICATION}. Publier des pourcentages sur un
      effectif aussi faible permettrait de remonter à une personne identifiable. Le rapport
      redeviendra lisible à mesure que la participation augmente. Cette limite n’est pas
      paramétrable et ne peut pas être levée sur demande.
    </div>` : `<div class="avis">
      <b>Restitution agrégée et anonymisée.</b> Aucun chiffre de ce rapport ne porte sur une
      personne identifiable. Tout indicateur calculé sur moins de ${SEUIL_PUBLICATION}
      personnes est automatiquement supprimé, et les découpages ne sont jamais combinables
      entre eux.
    </div>`}

    <div class="cartes">
      <div class="carte">
        <span class="k">Participation</span>
        <div class="v">${rendu(part)}</div>
        <p class="d">${e.participants} participants sur ${e.invites} salariés couverts.</p>
      </div>
      <div class="carte">
        <span class="k">Satisfaction</span>
        <div class="v">${rendu(sat)}</div>
        <p class="d">Part de réponses satisfaites ou très satisfaites${sat.publie ? ', sur ' + e.satisfaction.repondants + ' réponses' : ''}.</p>
      </div>
      <div class="carte">
        <span class="k">Reste à charge moyen</span>
        <div class="v">${rendu(rac)}</div>
        <p class="d">Par participant, hors abonnement. Les actes indiqués sont pris en charge
        dans les conditions habituelles de l’Assurance maladie.</p>
      </div>
      <div class="carte">
        <span class="k">Renouvellement à 12 mois</span>
        <div class="v"><span class="masque">Pas encore mesurable — aucun abonnement n’a atteint douze mois</span></div>
        <p class="d">Sera publié dès que l’effectif arrivé à échéance atteindra le seuil.</p>
      </div>
    </div>

    <h2 class="h-sec">Où vos collaborateurs se sont rendus</h2>
    <p class="sub2">Information d’organisation. Elle ne relève pas de la donnée de santé.</p>
    <div class="bloc">${barre(e.parSite, e.participants)}</div>

    <h2 class="h-sec">Quand ils y sont allés</h2>
    <p class="sub2">Utile pour calibrer la communication interne et les créneaux à privilégier.</p>
    <div class="bloc">${barre(e.parCreneau, e.participants)}</div>

    <h2 class="h-sec">Grands thèmes du parcours</h2>
    <p class="sub2">Agrégats à gros grain, sans aucun détail clinique et sans découpage par
    service, par site ni par tranche d’âge — ces croisements réduiraient les effectifs
    jusqu’à permettre une réidentification.</p>
    <div class="bloc">${barre(e.themes, e.participants)}</div>

    <h2 class="h-sec">Ce que vous ne verrez jamais</h2>
    <ul class="jamais">
      <li>Le nom des collaborateurs ayant participé, ou n’ayant pas participé.</li>
      <li>Un résultat d’analyse, un diagnostic, un motif de consultation.</li>
      <li>Une orientation vers un spécialiste, un arrêt de travail, un traitement.</li>
      <li>Un croisement entre un thème de santé et un service, un site ou une tranche d’âge.</li>
      <li>Un chiffre portant sur moins de ${SEUIL_PUBLICATION} personnes.</li>
      <li>Une exportation nominative, quelle que soit la demande et son motif.</li>
    </ul>
    <p class="sub2" style="margin-top:16px">Ces limites sont techniques, pas contractuelles :
    la plateforme ne dispose pas de fonction permettant de les lever. C’est ce qui rend la
    participation possible — un collaborateur qui doute de la confidentialité ne vient pas.</p>`;

  document.querySelectorAll('.switch button').forEach(b => {
    b.onclick = () => { choisie = b.dataset.e; rendre(); window.scrollTo(0, 0); };
  });
}

window.addEventListener('DOMContentLoaded', rendre);
