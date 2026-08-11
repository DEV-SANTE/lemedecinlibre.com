/* =====================================================================
   M10 — TABLEAU DE BORD DE CONTRÔLE INTERNE
   Version 0.1 — cohorte fictive.

   POURQUOI CE FICHIER CALCULE, ALORS QUE LE RESTE NE CALCULE PAS

   La contrainte de la version 1 interdit de produire une information
   propre à UN PATIENT DONNÉ à des fins de décision médicale. Elle
   n'interdit pas les statistiques agrégées et anonymisées, que le
   dossier de reprise autorise explicitement.

   Ce fichier calcule donc, mais uniquement des taux de population.
   Deux règles s'y appliquent :
     - aucune donnée nominative n'est lue ni affichée ;
     - aucun résultat n'est renvoyé vers le dossier d'un patient, ni
       vers l'interface du médecin pendant la consultation.

   Le tableau de bord regarde la population pour vérifier que
   l'indication tient. Il ne regarde jamais un individu pour l'orienter.

   CONSÉQUENCE DE LA V1 SUR LE PREMIER INDICATEUR
   L'indicateur « part des actes prescrits parmi les actes suggérés »
   suppose que quelque chose ait été suggéré. En version 1, rien ne
   l'est. Il est donc calculé RÉTROSPECTIVEMENT et EN AGRÉGÉ : on
   applique après coup les critères publiés du référentiel à la cohorte,
   hors de toute consultation, et on compare au réel. Le résultat sert
   au pilotage, jamais au patient.
   ===================================================================== */

'use strict';

/* =====================================================================
   COHORTE FICTIVE
   Générée de façon déterministe pour que les chiffres soient stables
   d'une ouverture à l'autre. Aucune personne réelle, aucun nom.
   ===================================================================== */
let graine = 20260728;
function alea() {
  graine = (graine * 1103515245 + 12345) % 2147483648;
  return graine / 2147483648;
}
function tirage(p) { return alea() < p; }
function entre(a, b) { return a + Math.floor(alea() * (b - a + 1)); }

const MOIS = ['Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'];

function construireCohorte() {
  const visites = [];
  MOIS.forEach((mois, im) => {
    const n = 28 + im * 9;                       /* montée en charge */
    for (let i = 0; i < n; i++) {
      const age = entre(24, 72);
      const fumeur = tirage(0.26);
      const paquetsAnneesEleve = fumeur && tirage(0.55);
      const symptomeResp = fumeur ? tirage(0.5) : tirage(0.09);
      const facteurRisqueCv = age > 50 ? tirage(0.5) : tirage(0.16);
      const symptomeCv = tirage(0.12);
      const ronflement = tirage(0.28);
      const somnolence = ronflement ? tirage(0.5) : tirage(0.07);
      const lesionCutanee = tirage(0.11);

      /* Critères publiés appliqués rétrospectivement, en agrégé. */
      const critereSpiro = paquetsAnneesEleve && symptomeResp;
      const critereSommeil = somnolence || (ronflement && tirage(0.35));
      const critereEcg = facteurRisqueCv || symptomeCv;
      const critereDermato = lesionCutanee;

      /* Réel : le médecin suit la plupart du temps, s'en écarte parfois
         dans les deux sens. C'est cet écart qu'il faut mesurer. */
      const spiro = critereSpiro ? tirage(0.86) : tirage(0.05);
      const spiroTvo = spiro && tirage(0.21);

      /* ------------------------------------------------------------
         EXPLORATION FONCTIONNELLE COMPLÈTE — le plateau de pneumologie

         C'est l'indicateur le plus important de cette page, parce qu'il
         surveille un risque qu'aucun contrôle technique ne peut couvrir :
         une capacité installée finit toujours par trouver des
         indications. Le plateau existe et sert au pneumologue en soins
         courants ; la question est de savoir si le parcours de
         prévention commence à l'alimenter.

         Trois origines, qu'il faut absolument distinguer :
           — après une spirométrie anormale : l'indication vient du
             résultat, c'est la séquence voulue ;
           — sur indication clinique documentée sans spirométrie anormale
             — suspicion de trouble restrictif, suivi d'une exposition
             professionnelle : parfaitement légitime, mais elle doit être
             tracée pour être distinguée du reste ;
           — sans l'une ni l'autre : c'est la dérive, et c'est cela qu'on
             mesure.

         Viser 100 % d'explorations précédées d'une spirométrie anormale
         serait une erreur : ça pousserait à ne plus tracer les
         indications cliniques légitimes, donc à les rendre invisibles.
         D'où deux indicateurs plutôt qu'un.
      ------------------------------------------------------------ */
      const efrApresTvo = spiroTvo && tirage(0.62);
      const contexteResp = symptomeResp || paquetsAnneesEleve;
      const efrAutre = !efrApresTvo && contexteResp && tirage(0.09);
      const efrIndicTracee = efrAutre && tirage(0.58);
      const efr = efrApresTvo || efrAutre;
      const sommeil = critereSommeil ? tirage(0.82) : tirage(0.04);
      const ecg = critereEcg ? tirage(0.88) : tirage(0.04);
      const dermato = critereDermato ? tirage(0.93) : tirage(0.03);

      visites.push({
        mois: mois,
        /* résultats des examens réalisés */
        spiro: spiro, spiroTvo: spiroTvo,
        efr: efr, efrApresTvo: efrApresTvo, efrIndicTracee: efrIndicTracee,
        efrSansJustif: efr && !efrApresTvo && !efrIndicTracee,
        sommeil: sommeil, sommeilSaos: sommeil && tirage(0.34),
        ecg: ecg, ecgSansFdr: ecg && !critereEcg,
        dermato: dermato, dermatoSuspect: dermato && tirage(0.08),
        dermatoDelaiJours: dermato ? entre(3, 17) : null,
        /* critères rétrospectifs */
        critereSpiro: critereSpiro, critereSommeil: critereSommeil,
        critereEcg: critereEcg, critereDermato: critereDermato,
        /* devis hors nomenclature */
        devisPropose: tirage(0.34),
        devisRefuse: false,
        /* économie */
        resteACharge: [0, 0, 0, 2, 4, 6, 8][entre(0, 6)],
        canal: ['B2B', 'B2B', 'B2B', 'Gare', 'Salle d’attente', 'Galerie', 'Payant'][entre(0, 6)]
      });
    }
  });
  visites.forEach(v => { if (v.devisPropose) v.devisRefuse = tirage(0.31); });
  return visites;
}

const COHORTE = construireCohorte();

/* Abonnés et renouvellement, cohorte distincte et agrégée. */
const ABONNES = { total: 412, arrivesIlYaUnAn: 138, renouveles: 79 };
const CAC = [
  { canal: 'B2B — employeurs et CSE', valeur: 41, abonnes: 214 },
  { canal: 'Gares', valeur: 63, abonnes: 74 },
  { canal: 'Salle d’attente', valeur: 12, abonnes: 68 },
  { canal: 'Galerie commerciale', valeur: 148, abonnes: 41 },
  { canal: 'Média payant', valeur: 187, abonnes: 15 }
];

/* =====================================================================
   AGRÉGATION — aucune lecture nominative
   ===================================================================== */
function compte(f) { let n = 0; COHORTE.forEach(v => { if (f(v)) n++; }); return n; }
function taux(num, den) { return den === 0 ? null : (num / den) * 100; }
function moyenne(f) {
  let s = 0, n = 0;
  COHORTE.forEach(v => { const x = f(v); if (x != null) { s += x; n++; } });
  return n === 0 ? null : s / n;
}

function indicateurs() {
  const actesSuggeresRetro = compte(v => v.critereSpiro) + compte(v => v.critereSommeil)
    + compte(v => v.critereEcg) + compte(v => v.critereDermato);
  const actesRealisesParmiSuggeres =
      compte(v => v.critereSpiro && v.spiro) + compte(v => v.critereSommeil && v.sommeil)
    + compte(v => v.critereEcg && v.ecg) + compte(v => v.critereDermato && v.dermato);

  const devisProposes = compte(v => v.devisPropose);

  return [
    {
      id: 'suivi',
      titre: 'Part des actes réalisés parmi ceux que les critères publiés désignaient',
      valeur: taux(actesRealisesParmiSuggeres, actesSuggeresRetro), unite: '%',
      seuil: 95, sens: 'max',
      revele: 'Un taux supérieur à 95 % traduit un automatisme : le médecin entérine au lieu de décider. Un écart de 10 à 25 % est le signe d’un exercice médical réel.',
      note: 'Calculé rétrospectivement et en agrégé. Aucun acte n’est suggéré au médecin pendant la consultation.'
    },
    {
      id: 'spiro',
      titre: 'Rendement de l’exploration respiratoire',
      valeur: taux(compte(v => v.spiroTvo), compte(v => v.spiro)), unite: '%',
      seuil: 10, sens: 'min',
      revele: 'Un rendement faible signifie que l’indication est trop large. C’est la meilleure défense en contrôle : si un examen sur cinq trouve quelque chose, personne ne peut reprocher l’indication.',
      base: compte(v => v.spiro) + ' examens réalisés'
    },
    {
      id: 'efr_origine',
      effectif: compte(v => v.efr), effectifMin: 20,
      titre: 'Explorations complètes précédées d’une spirométrie anormale',
      valeur: taux(compte(v => v.efrApresTvo), compte(v => v.efr)), unite: '%',
      seuil: 70, sens: 'min',
      revele: 'C’est la mesure de la séquence en deux temps. Si ce taux baisse, l’exploration complète n’est plus déclenchée par un résultat mais par la disponibilité de la cabine. Un plateau installé finit toujours par trouver des indications : c’est ce mécanisme-là qu’on surveille, pas la compétence du praticien.',
      base: compte(v => v.efr) + ' explorations complètes, dont ' + compte(v => v.efrApresTvo) + ' après une spirométrie anormale',
      note: 'Le solde n’est pas anormal en soi : une exploration peut être indiquée par la clinique sans spirométrie anormale. Encore faut-il que ce soit écrit — c’est l’objet de l’indicateur suivant.'
    },
    {
      id: 'efr_sans_justif',
      effectif: compte(v => v.efr), effectifMin: 20,
      titre: 'Explorations complètes sans justification tracée',
      valeur: taux(compte(v => v.efrSansJustif), compte(v => v.efr)), unite: '%',
      seuil: 5, sens: 'max',
      revele: 'Ni spirométrie anormale, ni indication clinique écrite au dossier. C’est la seule ligne qu’un contrôle vous opposera, et la seule qu’aucune explication rétrospective ne rattrape. Une indication légitime non tracée compte ici : du point de vue d’un contrôleur, elle n’existe pas.',
      base: compte(v => v.efrSansJustif) + ' explorations sur ' + compte(v => v.efr) + ' sans justification écrite au dossier'
    },
    {
      id: 'tvo_suite',
      effectif: compte(v => v.spiroTvo), effectifMin: 20,
      titre: 'Spirométries anormales suivies d’une exploration complète',
      valeur: taux(compte(v => v.efrApresTvo), compte(v => v.spiroTvo)), unite: '%',
      seuil: 50, sens: 'min',
      revele: 'Le risque symétrique, et on l’oublie toujours : un trouble ventilatoire repéré puis laissé sans suite. Celui-là n’est pas un risque de contrôle, c’est un risque pour la personne. Un taux bas signifie qu’on a su repérer sans savoir orienter.',
      base: compte(v => v.efrApresTvo) + ' explorations pour ' + compte(v => v.spiroTvo) + ' spirométries anormales'
    },
    {
      id: 'sommeil',
      titre: 'Rendement de l’enregistrement du sommeil',
      valeur: taux(compte(v => v.sommeilSaos), compte(v => v.sommeil)), unite: '%',
      seuil: 20, sens: 'min',
      revele: 'Un rendement inférieur à 20 % indique des critères de déclenchement mal réglés.',
      base: compte(v => v.sommeil) + ' enregistrements réalisés'
    },
    {
      id: 'ecg',
      titre: 'Explorations cardiaques chez des personnes sans facteur de risque',
      valeur: taux(compte(v => v.ecgSansFdr), compte(v => v.ecg)), unite: '%',
      seuil: 5, sens: 'max',
      revele: 'Au-delà de 5 %, dérive vers le dépistage systématique. C’est l’acte non indiqué le plus facilement requalifiable.',
      base: compte(v => v.ecg) + ' explorations réalisées'
    },
    {
      id: 'dermato',
      titre: 'Délai moyen de prise en charge d’une lésion suspecte',
      valeur: moyenne(v => (v.dermatoSuspect ? v.dermatoDelaiJours : null)), unite: 'jours',
      seuil: 15, sens: 'max',
      revele: 'Au-delà de quinze jours, le risque médico-légal devient le premier risque du parcours. Un mélanome manqué est un sinistre majeur.',
      base: compte(v => v.dermatoSuspect) + ' lésions suspectes'
    },
    {
      id: 'devis',
      titre: 'Renoncements après devis hors nomenclature',
      valeur: taux(compte(v => v.devisRefuse), devisProposes), unite: '%',
      seuil: 40, sens: 'max',
      revele: 'Au-delà de 40 %, le prix est mal calibré. Un taux très bas mériterait aussi un examen : il pourrait signaler un refus difficile à exprimer.',
      base: devisProposes + ' devis proposés'
    },
    {
      id: 'renouv',
      titre: 'Renouvellement de l’abonnement à douze mois',
      valeur: taux(ABONNES.renouveles, ABONNES.arrivesIlYaUnAn), unite: '%',
      seuil: 50, sens: 'min',
      revele: 'En dessous de 50 %, le modèle économique est en danger : la valeur de l’abonnement est concentrée sur le premier bilan.',
      base: ABONNES.arrivesIlYaUnAn + ' abonnés arrivés à échéance'
    },
    {
      id: 'rac',
      titre: 'Reste à charge moyen par personne',
      valeur: moyenne(v => v.resteACharge), unite: '€',
      seuil: null, sens: null,
      revele: 'Sans seuil d’alerte. C’est l’argument commercial et social du parcours, et l’indicateur à opposer au reproche d’un service réservé à ceux qui peuvent payer.',
      base: COHORTE.length + ' visites'
    }
  ];
}

/* GARDE D'EFFECTIF.
   Un pourcentage calculé sur une poignée d'actes ne mesure rien : deux
   dossiers de plus ou de moins le déplacent de vingt points. Déclencher
   une alerte là-dessus, c'est piloter du bruit — et le pire usage d'un
   tableau de bord est de faire changer une pratique pour une variation
   qui n'existe pas.

   Sous l'effectif minimal, l'indicateur affiche ses effectifs bruts et
   se déclare hors seuil. C'est le même raisonnement que le seuil de onze
   du portail entreprise, appliqué cette fois à la validité statistique
   et non à la réidentification. */
function statut(ind) {
  if (ind.valeur == null || ind.seuil == null) return 'neutre';
  if (ind.effectifMin != null && (ind.effectif || 0) < ind.effectifMin) return 'attente';
  if (ind.sens === 'max') return ind.valeur > ind.seuil ? 'alerte' : 'ok';
  return ind.valeur < ind.seuil ? 'alerte' : 'ok';
}

function fmt(v, u) {
  if (v == null) return '—';
  if (u === '%') return v.toFixed(1).replace('.', ',') + ' %';
  if (u === '€') return v.toFixed(2).replace('.', ',') + ' €';
  if (u === 'jours') return v.toFixed(1).replace('.', ',') + ' j';
  return String(v);
}

/* Série mensuelle d'un indicateur, pour la micro-courbe. */
function serie(id) {
  return MOIS.map(m => {
    const dansMois = f => { let n = 0; COHORTE.forEach(v => { if (v.mois === m && f(v)) n++; }); return n; };
    if (id === 'spiro')   return taux(dansMois(v => v.spiroTvo), dansMois(v => v.spiro));
    if (id === 'efr_origine')     return taux(dansMois(v => v.efrApresTvo), dansMois(v => v.efr));
    if (id === 'efr_sans_justif') return taux(dansMois(v => v.efrSansJustif), dansMois(v => v.efr));
    if (id === 'tvo_suite')       return taux(dansMois(v => v.efrApresTvo), dansMois(v => v.spiroTvo));
    if (id === 'sommeil') return taux(dansMois(v => v.sommeilSaos), dansMois(v => v.sommeil));
    if (id === 'ecg')     return taux(dansMois(v => v.ecgSansFdr), dansMois(v => v.ecg));
    if (id === 'devis')   return taux(dansMois(v => v.devisRefuse), dansMois(v => v.devisPropose));
    return null;
  });
}

/* =====================================================================
   RENDU
   ===================================================================== */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function microCourbe(vals) {
  const pts = vals.filter(v => v != null);
  if (pts.length < 2) return '';
  const mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts);
  const etendue = (mx - mn) || 1;
  const L = 150, H = 34;
  const d = vals.map((v, i) => {
    if (v == null) return null;
    const x = (i * L) / Math.max(1, vals.length - 1);
    const y = H - 3 - ((v - mn) / etendue) * (H - 6);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).filter(Boolean).join(' ');
  return `<svg viewBox="0 0 ${L} ${H}" class="spark" aria-hidden="true">
    <polyline points="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

function rendre() {
  const inds = indicateurs();
  const enAlerte = inds.filter(i => statut(i) === 'alerte');

  document.getElementById('app').innerHTML = `
    <div class="head">
      <div>
        <h1>Contrôle interne</h1>
        <p class="sub">${COHORTE.length} visites sur six mois · cohorte fictive de
        démonstration · aucune donnée nominative n’est lue par ce tableau de bord.</p>
      </div>
      <div class="bilan ${enAlerte.length ? 'ko' : 'ok'}">
        <b>${enAlerte.length}</b>
        <span>indicateur${enAlerte.length > 1 ? 's' : ''} en alerte sur ${inds.length}</span>
      </div>
    </div>

    <div class="avis">
      Ce tableau de bord n’est pas de la conformité décorative : c’est l’argument à opposer
      à la CPAM, à l’ARS et à la critique institutionnelle. Il doit être actif dès le premier
      patient. Le paradoxe à accepter : il faut mesurer, et souhaiter, que les médecins
      s’écartent des critères publiés. Un taux de suivi de 100 % détruirait l’indication de
      tout le parcours.
    </div>

    <div class="grid">
      ${inds.map(i => {
        const st = statut(i);
        const s = serie(i.id);
        return `<section class="ind ${st}">
          <div class="ind-h">
            <h2>${esc(i.titre)}</h2>
            <span class="tag tag-${st === 'attente' ? 'neutre' : st}">${
              st === 'alerte' ? 'Alerte'
              : st === 'ok' ? 'Dans la cible'
              : st === 'attente' ? 'Effectif insuffisant' : 'Sans seuil'}</span>
          </div>
          <div class="ind-v">
            <b>${esc(fmt(i.valeur, i.unite))}</b>
            ${i.seuil != null ? `<span class="seuil">seuil d’alerte :
              ${i.sens === 'max' ? 'au-delà de' : 'en dessous de'} ${i.seuil}${i.unite === '%' ? ' %' : (i.unite === 'jours' ? ' j' : '')}${
              st === 'attente' ? ' — suspendu, effectif inférieur à ' + i.effectifMin : ''}</span>` : ''}
            ${s.some(x => x != null) ? '<span class="sparkwrap">' + microCourbe(s) + '<em>6 mois</em></span>' : ''}
          </div>
          ${i.base ? `<p class="base">${esc(i.base)}</p>` : ''}
          <p class="revele">${esc(i.revele)}</p>
          ${i.note ? `<p class="note">${esc(i.note)}</p>` : ''}
        </section>`;
      }).join('')}
    </div>

    <h2 class="h-sec">Coût d’acquisition par canal</h2>
    <p class="sub" style="margin-bottom:18px">Seuil d’alerte : au-delà de 80 € par abonné, le
    canal est à couper. À 129 € par an avec 40 à 60 % de non-renouvellement en année deux, la
    valeur d’un abonné ne dépasse pas 200 à 260 €.</p>
    <table class="tbl">
      <thead><tr><th>Canal</th><th class="r">Abonnés</th><th class="r">Coût par abonné</th><th class="r">Statut</th></tr></thead>
      <tbody>
        ${CAC.slice().sort((a, b) => a.valeur - b.valeur).map(c => `
          <tr><td>${esc(c.canal)}</td>
              <td class="r">${c.abonnes}</td>
              <td class="r"><b>${c.valeur} €</b></td>
              <td class="r"><span class="tag tag-${c.valeur > 80 ? 'alerte' : 'ok'}">${c.valeur > 80 ? 'À couper' : 'À développer'}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>

    <div class="avis" style="margin-top:30px">
      <b>Le rendement diagnostique est la meilleure défense.</b> Si une exploration
      respiratoire sur cinq révèle un trouble obstructif, personne ne peut reprocher
      l’indication. Si c’est une sur cinquante, il s’agit d’un dépistage à l’aveugle. Ces
      chiffres portent sur une cohorte fictive : la seule chose qu’ils démontrent est que la
      chaîne de mesure fonctionne.
    </div>`;
}

/* =====================================================================
   COMPTAGES RÉELS DU CENTRE
   ---------------------------------------------------------------------
   La cohorte fictive ci-dessus reste : elle montre à quoi ressemblera le
   tableau de bord quand il y aura de la matière, et elle sert de
   démonstration hors connexion.

   Si un soignant est connecté, un bandeau affiche EN PLUS les comptages
   réels de son centre — nombre de dossiers, où ils en sont, délai moyen
   de relecture, état de l'entretien des données. Aucun nominatif, et
   aucun indicateur portant sur une personne : cette page regarde la
   population pour vérifier que le dispositif tient, jamais un individu
   pour l'orienter. C'est la règle posée en tête de ce fichier, et elle
   vaut aussi pour les chiffres qui viennent du serveur.
   ===================================================================== */
async function ajouterComptagesReels() {
  if (typeof API === 'undefined') return;
  let compte = null;
  try { compte = await API.moi(); } catch (e) { return; }
  if (!compte || !['medecin', 'secretaire'].includes(compte.role)) return;

  let p;
  try { p = await API.pilotage(); } catch (e) { return; }

  const d = p.dossiers || {};
  const s = p.securite || {};
  const ent = p.dernierEntretien;
  const lignes = [
    ['Dossiers', d.total, 'dont ' + (d.brouillons || 0) + ' en cours, '
      + (d.transmis || 0) + ' transmis, ' + (d.relus || 0) + ' relus'],
    ['Patients rattachés', (p.patients || {}).rattaches,
      (p.enAttenteDeRattachement || 0) + ' en attente de rattachement'],
    ['Avis signés', p.avisSignes,
      p.delaiMoyenRelectureHeures !== null
        ? 'délai moyen de relecture : ' + p.delaiMoyenRelectureHeures + ' h'
        : 'aucun délai mesurable'],
    ['Double vérification', (s.avec_totp || 0) + ' / ' + (s.soignants || 0),
      'comptes soignants protégés'],
    ['Accès refusés (30 j)', p.refusTrentejours,
      'tentatives repoussées et journalisées'],
    ['Entretien des données', ent ? 'actif' : 'jamais passé',
      ent ? 'dernier passage : ' + new Date(ent.quand).toLocaleString('fr-FR')
          : 'ATTENTION : la purge ne tourne pas'],
  ];

  const zone = document.getElementById('app') || document.body;
  const bloc = document.createElement('div');
  bloc.style.cssText = 'background:#eaf2fb;border:1px solid #c3d9f0;border-radius:12px;'
    + 'padding:17px 20px;margin-bottom:22px;color:#1a5695';
  bloc.innerHTML = '<p style="margin:0 0 12px;font-size:13.5px"><b>Votre centre — comptages '
    + 'réels.</b> ' + esc(p.note) + '</p>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + lignes.map(function (l) {
        return '<tr><td style="padding:5px 0;width:38%">' + esc(l[0])
          + '</td><td style="padding:5px 0;font-weight:700;width:14%">' + esc(l[1])
          + '</td><td style="padding:5px 0;color:#3c5f86">' + esc(l[2]) + '</td></tr>';
      }).join('') + '</table>'
    + '<p style="margin:12px 0 0;font-size:12.5px;color:#3c5f86">Référentiel : '
    + esc(p.referentiel.lignesVisees) + ' lignes visées par '
    + esc(p.referentiel.medecin) + '.</p>';
  zone.insertBefore(bloc, zone.firstChild);
}

window.addEventListener('DOMContentLoaded', async function () {
  /* Même séparation que sur la page entreprise : un soignant connecté ne
     voit que les comptages réels de son centre. La cohorte fictive reste
     la démonstration des visiteurs sans compte, annoncée comme telle. */
  if (typeof API !== 'undefined') {
    let compte = null;
    try { compte = await API.moi(); } catch (e) {}
    if (compte && ['medecin', 'secretaire'].includes(compte.role)) {
      const app = document.getElementById('app') || document.body;
      app.innerHTML = '';
      await ajouterComptagesReels();
      const rappel = document.createElement('p');
      rappel.style.cssText = 'font-size:12.5px;color:var(--ink-4);max-width:76ch;margin-top:18px';
      rappel.textContent = 'Comptages de fonctionnement du centre. Aucun indicateur ne porte '
        + 'sur une personne : cette page regarde la population pour vérifier que le '
        + 'dispositif tient, jamais un individu pour l’orienter.';
      app.appendChild(rappel);
      return;
    }
  }
  rendre();   /* démonstration : cohorte fictive, annoncée comme telle */
});
