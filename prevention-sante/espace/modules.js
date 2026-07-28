/* =====================================================================
   ESPACE PATIENT — MODULES M4, M5, M6, M7
   M5 rendez-vous · M6 devis hors nomenclature · M4 historisation
   M7 séparation de facturation
   Version 0.1 — environnement de test.

   TROIS RÈGLES CODÉES EN DUR DANS CE FICHIER

   1. LIBRE CHOIX EFFECTIF (M5)
      Ni le centre ni le laboratoire ne sont présélectionnés. La liste
      est triée par ordre alphabétique, jamais par appartenance ni par
      un score de pertinence. Elle contient des laboratoires hors
      groupe. Les critères objectifs de chaque partenaire sont affichés
      pour que le choix soit informé, et aucun libellé ne recommande
      un partenaire plutôt qu'un autre.

   2. DEVIS AVANT TOUT ACTE HORS NOMENCLATURE (M6)
      Mention explicite de l'absence de prise en charge et du montant
      exact. Le refus est aussi accessible que l'acceptation, au même
      niveau visuel : un refus difficile fausserait l'indicateur de
      renoncement et vicierait le consentement.

   3. AUCUNE FACTURE MIXTE (M7)
      La fonction emettreFacture() refuse structurellement de produire
      une facture contenant des lignes de flux différents. Ce n'est pas
      une règle d'interface, c'est une garde dans le code.
      Le récapitulatif de parcours reste possible : il est explicitement
      non contractuel et ne vaut pas facture.
   ===================================================================== */

'use strict';

/* =====================================================================
   DONNÉES DE TEST — partenaires
   Noms fictifs. En production, cette liste vient de la base de
   référencement, avec les mêmes critères objectifs affichés.
   ===================================================================== */
const CENTRES_TEST = [
  { id: 'C-A', nom: 'Centre de santé A (fictif)', ville: 'Paris 12e', gare: false,
    horaires: '7h30 – 20h00, samedi matin', groupe: true,
    plateau: ['Consultation', 'Prélèvements', 'Exploration respiratoire', 'Exploration cardiaque'],
    delai: '48 h' },
  { id: 'C-B', nom: 'Centre de santé B (fictif)', ville: 'Paris — quartier de gare', gare: true,
    horaires: '6h45 – 21h00, samedi', groupe: true,
    plateau: ['Consultation', 'Prélèvements', 'Exploration respiratoire', 'Exploration cardiaque', 'Dermatoscopie'],
    delai: '24 h' },
  { id: 'C-C', nom: 'Centre de santé C (fictif, hors groupe)', ville: 'Banlieue est', gare: false,
    horaires: '8h30 – 18h30', groupe: false,
    plateau: ['Consultation', 'Prélèvements'],
    delai: '5 jours' },
  { id: 'C-D', nom: 'Centre de santé D (fictif, hors groupe)', ville: 'Banlieue ouest', gare: false,
    horaires: '8h00 – 19h00, samedi matin', groupe: false,
    plateau: ['Consultation', 'Prélèvements', 'Exploration cardiaque'],
    delai: '72 h' }
];

const LABOS_TEST = [
  { id: 'L-1', nom: 'Laboratoire 1 (fictif)', groupe: true,
    accreditation: 'Accréditation en cours de vérification',
    coImplante: true, resultat: 'Le jour même pour le socle',
    horaires: '7h00 – 19h00' },
  { id: 'L-2', nom: 'Laboratoire 2 (fictif, hors groupe)', groupe: false,
    accreditation: 'Accréditation en cours de vérification',
    coImplante: false, resultat: 'Sous 24 à 48 h',
    horaires: '7h30 – 18h00' },
  { id: 'L-3', nom: 'Laboratoire 3 (fictif, hors groupe)', groupe: false,
    accreditation: 'Accréditation en cours de vérification',
    coImplante: false, resultat: 'Sous 24 h',
    horaires: '7h00 – 20h00, samedi' }
];

/* Tri neutre, imposé : ordre alphabétique du libellé.
   Aucun tri par appartenance au groupe, aucun tri par « pertinence ». */
function triNeutre(liste) {
  return liste.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

const CRENEAUX_TEST = [
  'Lundi 8h15', 'Lundi 12h30', 'Lundi 18h45',
  'Mardi 7h30', 'Mardi 13h00', 'Mardi 19h15',
  'Mercredi 8h00', 'Mercredi 17h30',
  'Jeudi 7h45', 'Jeudi 12h15', 'Jeudi 18h30',
  'Vendredi 8h30', 'Vendredi 13h15'
];

/* =====================================================================
   M6 — Devis de test proposés par le médecin
   En production, le médecin les crée depuis la vue praticien.
   ===================================================================== */
function devisTest() {
  return [{
    id: 'DEV-TEST-01',
    date: new Date().toISOString(),
    intitule: 'Couche cardiométabolique avancée',
    lignes: [
      { libelle: 'Apolipoprotéine B', montant: 22 },
      { libelle: 'Lipoprotéine (a)', montant: 26 },
      { libelle: 'Protéine C réactive ultrasensible', montant: 14 },
      { libelle: 'Insuline à jeun', montant: 18 },
      { libelle: 'Cystatine C', montant: 20 }
    ],
    motifMedical: 'Antécédent familial d’infarctus précoce. Ces analyses ne sont pas inscrites à la nomenclature et ne sont donc pas prises en charge.',
    facturePar: 'Le laboratoire que vous aurez choisi',
    statut: 'propose',
    signature: null
  }];
}

/* =====================================================================
   M4 — Documents de test
   Affichage brut : aucune annotation, aucune couleur, aucun signalement.
   ===================================================================== */
function documentsTest() {
  return [
    { id: 'DOC-1', date: '2026-07-20T09:12:00.000Z', type: 'Compte rendu',
      titre: 'Compte rendu de consultation de prévention', auteur: 'Médecin (fictif)', taille: '2 pages' },
    { id: 'DOC-2', date: '2026-07-20T11:40:00.000Z', type: 'Résultats',
      titre: 'Résultats d’analyses — socle', auteur: 'Laboratoire (fictif)', taille: '1 page' },
    { id: 'DOC-3', date: '2025-06-14T10:05:00.000Z', type: 'Résultats',
      titre: 'Résultats d’analyses — socle (année précédente)', auteur: 'Laboratoire (fictif)', taille: '1 page' }
  ];
}

/* Historique d'un paramètre : valeurs brutes dans le temps.
   Aucune borne de normalité n'est affichée, aucune valeur n'est
   qualifiée. La courbe ne porte aucune zone colorée. */
function historiqueTest() {
  return [
    { parametre: 'Hémoglobine (g/dL)', valeurs: [
      { date: '2024-05-11', v: 13.8 }, { date: '2025-06-14', v: 13.4 }, { date: '2026-07-20', v: 13.6 }] },
    { parametre: 'Glycémie à jeun (g/L)', valeurs: [
      { date: '2024-05-11', v: 0.92 }, { date: '2025-06-14', v: 0.98 }, { date: '2026-07-20', v: 1.02 }] },
    { parametre: 'Ferritine (µg/L)', valeurs: [
      { date: '2024-05-11', v: 42 }, { date: '2025-06-14', v: 31 }, { date: '2026-07-20', v: 24 }] }
  ];
}

/* =====================================================================
   M7 — MOTEUR DE FACTURATION
   Trois flux, trois émetteurs, jamais mélangés.
   ===================================================================== */
const FLUX = {
  ABONNEMENT: { code: 'abonnement', emetteur: 'La plateforme',
    payeur: 'Vous, ou votre employeur', libelle: 'Abonnement — coordination du parcours' },
  ACTES: { code: 'actes', emetteur: 'Le centre de santé',
    payeur: 'Assurance maladie et complémentaire, en tiers payant', libelle: 'Actes médicaux pris en charge' },
  HN: { code: 'hors_nomenclature', emetteur: 'Le laboratoire',
    payeur: 'Vous', libelle: 'Analyses hors nomenclature' }
};

/* GARDE STRUCTURELLE.
   Toute tentative d'émettre une facture contenant des lignes de flux
   différents lève une erreur. La règle ne dépend pas de l'interface. */
function emettreFacture(codeFlux, lignes) {
  const flux = Object.keys(FLUX).map(k => FLUX[k]).find(f => f.code === codeFlux);
  if (!flux) throw new Error('Flux de facturation inconnu : ' + codeFlux);

  const fluxRencontres = {};
  lignes.forEach(l => { fluxRencontres[l.flux] = true; });
  const distincts = Object.keys(fluxRencontres);

  if (distincts.length > 1) {
    throw new Error('Facture mixte refusée : lignes de flux ' + distincts.join(' et ') +
      '. Une facture ne peut porter qu’un seul flux.');
  }
  if (distincts.length === 1 && distincts[0] !== codeFlux) {
    throw new Error('Facture refusée : lignes de flux ' + distincts[0] +
      ' dans une facture de flux ' + codeFlux + '.');
  }

  let total = 0;
  lignes.forEach(l => { total += Number(l.montant) || 0; });

  return {
    id: 'F-' + codeFlux.toUpperCase().slice(0, 4) + '-' + Date.now().toString(36).toUpperCase(),
    flux: codeFlux, emetteur: flux.emetteur, payeur: flux.payeur,
    lignes: lignes, total: total, date: new Date().toISOString(),
    contractuel: true
  };
}

/* Récapitulatif de parcours : autorisé, mais explicitement non
   contractuel et sans total consolidé, pour ne pas ressembler à une
   facture unique. */
function recapitulatifParcours(factures) {
  return {
    contractuel: false,
    mention: 'Document d’information non contractuel. Il ne vaut pas facture et ne peut servir de justificatif de paiement. Chaque flux fait l’objet d’une facture distincte émise par son émetteur.',
    blocs: factures.map(f => ({
      flux: f.flux, emetteur: f.emetteur, payeur: f.payeur,
      total: f.total, reference: f.id
    }))
  };
}

/* =====================================================================
   VUES
   ===================================================================== */
const Modules = {};

/* ---------------------------------------------------------------------
   M5 — RENDEZ-VOUS
------------------------------------------------------------------------ */
Modules.rendezvous = function (ctx) {
  const c = ctx.compte;
  const rdv = c.rdv || {};
  const centres = triNeutre(CENTRES_TEST);
  const labos = triNeutre(LABOS_TEST);

  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mon parcours</p>
      <h1>Prendre rendez-vous</h1>
      <p class="lede">Vous choisissez librement le centre où vous serez reçu et le
      laboratoire qui réalisera vos analyses. Aucun n’est présélectionné.</p>

      <div class="avis">
        ${ctx.ic('i-info')}
        <span>La liste est présentée par ordre alphabétique. Elle comprend des partenaires
        qui n’appartiennent pas au même groupe que la plateforme, signalés comme tels. Vous
        pouvez changer d’avis à tout moment avant votre visite.</span>
      </div>

      <h2 style="margin-top:34px">1. Le centre où vous serez reçu</h2>
      <div class="pay" style="margin-top:16px">
        ${centres.map(x => `
          <label class="payopt">
            <input type="radio" name="centre" value="${ctx.esc(x.id)}" ${rdv.centre === x.id ? 'checked' : ''}>
            <span style="flex:1">
              <b>${ctx.esc(x.nom)}</b>
              <span>${ctx.esc(x.ville)}${x.gare ? ' · à proximité d’une gare' : ''}
              ${x.groupe ? '' : ' · <em style="font-style:normal;color:var(--pri-d);font-weight:620">partenaire indépendant</em>'}</span>
              <span style="display:block;margin-top:8px;font-size:13.4px;color:var(--ink-4)">
                Horaires ${ctx.esc(x.horaires)} · restitution sous ${ctx.esc(x.delai)}<br>
                Sur place : ${x.plateau.map(p => ctx.esc(p)).join(' · ')}
              </span>
            </span>
          </label>`).join('')}
      </div>

      <h2 style="margin-top:34px">2. Le laboratoire qui réalisera vos analyses</h2>
      <p class="hint" style="margin-bottom:16px;max-width:62ch">Ce choix vous appartient
      entièrement et n’a aucune incidence sur le prix de votre abonnement ni sur votre prise
      en charge.</p>
      <div class="pay">
        ${labos.map(x => `
          <label class="payopt">
            <input type="radio" name="labo" value="${ctx.esc(x.id)}" ${rdv.labo === x.id ? 'checked' : ''}>
            <span style="flex:1">
              <b>${ctx.esc(x.nom)}</b>
              <span>${x.groupe ? '' : '<em style="font-style:normal;color:var(--pri-d);font-weight:620">partenaire indépendant</em> · '}${ctx.esc(x.resultat)}</span>
              <span style="display:block;margin-top:8px;font-size:13.4px;color:var(--ink-4)">
                ${x.coImplante ? 'Prélèvement possible dans le centre de consultation' : 'Prélèvement dans un site du laboratoire'}
                · horaires ${ctx.esc(x.horaires)}<br>${ctx.esc(x.accreditation)}
              </span>
            </span>
          </label>`).join('')}
      </div>

      <h2 style="margin-top:34px">3. Le créneau</h2>
      <div class="pay" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));display:grid;gap:10px;margin-top:16px">
        ${CRENEAUX_TEST.map(x => `
          <label class="payopt" style="padding:13px 15px">
            <input type="radio" name="creneau" value="${ctx.esc(x)}" ${rdv.creneau === x ? 'checked' : ''}>
            <span><b style="font-size:14.6px">${ctx.esc(x)}</b></span>
          </label>`).join('')}
      </div>

      <div class="avis" style="margin-top:30px">
        ${ctx.ic('i-calendar')}
        <span><b>Préparation.</b> Venez à jeun si le médecin l’a indiqué. Apportez votre
        carte Vitale, votre attestation de complémentaire, votre carnet de vaccination et
        vos derniers résultats d’analyses si vous les avez.</span>
      </div>

      <p class="err" id="err-rdv" style="display:none"></p>

      <div class="acts">
        <button class="btn b-p" id="b-rdv">Confirmer mon rendez-vous</button>
        <span class="note" id="note-rdv">${rdv.creneau ? 'Rendez-vous enregistré : ' + ctx.esc(rdv.creneau) : ''}</span>
      </div>
    </div>`);

  document.getElementById('b-rdv').onclick = () => {
    const g = n => (document.querySelector('input[name="' + n + '"]:checked') || {}).value || null;
    const e = document.getElementById('err-rdv');
    const centre = g('centre'), labo = g('labo'), creneau = g('creneau');
    if (!centre) { e.textContent = 'Choisissez le centre où vous souhaitez être reçu.'; e.style.display = 'block'; return; }
    if (!labo) { e.textContent = 'Choisissez le laboratoire qui réalisera vos analyses.'; e.style.display = 'block'; return; }
    if (!creneau) { e.textContent = 'Choisissez un créneau.'; e.style.display = 'block'; return; }
    e.style.display = 'none';
    c.rdv = { centre: centre, labo: labo, creneau: creneau, date: new Date().toISOString() };
    ctx.sauverCompte();
    Modules.rendezvous(ctx);
  };
};

/* ---------------------------------------------------------------------
   M6 — DEVIS HORS NOMENCLATURE
------------------------------------------------------------------------ */
Modules.devis = function (ctx) {
  const c = ctx.compte;
  if (!c.devis) { c.devis = devisTest(); ctx.sauverCompte(); }

  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mes devis</p>
      <h1>Analyses non prises en charge</h1>
      <p class="lede">Ces analyses ne sont pas inscrites à la nomenclature. Elles ne sont
      donc pas remboursées, ni par l’Assurance maladie ni par votre complémentaire. Elles
      sont facultatives.</p>

      <div class="avis warn">
        ${ctx.ic('i-warn')}
        <span>Aucune de ces analyses ne sera réalisée sans votre signature. Refuser
        n’a aucune conséquence sur le reste de votre parcours, ni sur votre abonnement.</span>
      </div>

      ${c.devis.map(d => bloc_devis(ctx, d)).join('')}
    </div>`);

  c.devis.forEach(d => {
    const acc = document.getElementById('acc-' + d.id);
    const ref = document.getElementById('ref-' + d.id);
    if (acc) acc.onclick = () => {
      const nom = (document.getElementById('sig-' + d.id).value || '').trim();
      const coche = document.getElementById('chk-' + d.id).checked;
      const e = document.getElementById('err-' + d.id);
      if (!coche) { e.textContent = 'Cochez la case attestant que vous avez pris connaissance de l’absence de prise en charge et du montant.'; e.style.display = 'block'; return; }
      if (nom.length < 3) { e.textContent = 'Saisissez vos nom et prénom pour signer.'; e.style.display = 'block'; return; }
      d.statut = 'accepte';
      d.signature = { nom: nom, date: new Date().toISOString(), montant: totalDevis(d) };
      ctx.sauverCompte(); Modules.devis(ctx);
    };
    if (ref) ref.onclick = () => {
      if (!confirm('Confirmer le refus de ce devis ? Aucune de ces analyses ne sera réalisée.')) return;
      d.statut = 'refuse';
      d.signature = { refus: true, date: new Date().toISOString() };
      ctx.sauverCompte(); Modules.devis(ctx);
    };
  });
};

function totalDevis(d) {
  let t = 0; d.lignes.forEach(l => { t += Number(l.montant) || 0; }); return t;
}

function bloc_devis(ctx, d) {
  const total = totalDevis(d);

  if (d.statut === 'accepte') {
    return `<div class="card" style="box-shadow:none;margin-top:24px">
      <h2>${ctx.esc(d.intitule)}</h2>
      <p class="hint" style="margin-top:10px">Devis accepté le
      ${ctx.esc(new Date(d.signature.date).toLocaleString('fr-FR'))} par
      <b>${ctx.esc(d.signature.nom)}</b> · montant ${total} €.</p>
      <div class="avis" style="margin-top:16px">${ctx.ic('i-check')}
      <span>Le laboratoire vous facturera directement ce montant, sur une facture distincte
      de votre abonnement et distincte des actes pris en charge.</span></div>
    </div>`;
  }
  if (d.statut === 'refuse') {
    return `<div class="card" style="box-shadow:none;margin-top:24px">
      <h2>${ctx.esc(d.intitule)}</h2>
      <p class="hint" style="margin-top:10px">Devis refusé le
      ${ctx.esc(new Date(d.signature.date).toLocaleString('fr-FR'))}. Aucune de ces analyses
      ne sera réalisée. Votre parcours se poursuit normalement.</p>
    </div>`;
  }

  return `<div class="card" style="box-shadow:none;margin-top:24px">
    <h2>${ctx.esc(d.intitule)}</h2>
    <p class="hint" style="margin-top:10px">Proposé par le médecin. Motif indiqué :
    ${ctx.esc(d.motifMedical)}</p>

    <table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:15.3px">
      ${d.lignes.map(l => `<tr style="border-bottom:1px solid var(--line-2)">
        <td style="padding:11px 0">${ctx.esc(l.libelle)}</td>
        <td style="padding:11px 0;text-align:right;font-weight:620">${l.montant} €</td></tr>`).join('')}
      <tr><td style="padding:14px 0;font-weight:700">Montant total à votre charge</td>
          <td style="padding:14px 0;text-align:right;font-weight:760;font-size:19px">${total} €</td></tr>
    </table>

    <div class="avis warn" style="margin-top:6px">
      ${ctx.ic('i-warn')}
      <span><b>Aucune prise en charge.</b> Ce montant de <b>${total} €</b> n’est remboursé
      ni par l’Assurance maladie, ni par votre complémentaire santé. Il sera facturé par
      ${ctx.esc(d.facturePar)}, séparément de votre abonnement.</span>
    </div>

    <label class="consent" style="margin-top:20px">
      <input type="checkbox" id="chk-${ctx.esc(d.id)}">
      <span><b>J’ai pris connaissance de l’absence de prise en charge et du montant de ${total} €.</b>
      <span>Je comprends que ces analyses sont facultatives et que je peux les refuser.</span></span>
    </label>

    <div class="field" style="margin-top:16px">
      <label for="sig-${ctx.esc(d.id)}">Signature — vos nom et prénom</label>
      <input type="text" id="sig-${ctx.esc(d.id)}" placeholder="Nom et prénom">
    </div>

    <p class="err" id="err-${ctx.esc(d.id)}" style="display:none"></p>

    <div class="acts">
      <button class="btn b-p" id="acc-${ctx.esc(d.id)}">Accepter et signer</button>
      <button class="btn b-g" id="ref-${ctx.esc(d.id)}">Refuser ce devis</button>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------------
   M4 — DOCUMENTS ET HISTORIQUE
   Affichage brut. Aucune borne de normalité, aucune couleur, aucune
   qualification d'une valeur.
------------------------------------------------------------------------ */
Modules.documents = function (ctx) {
  const docs = documentsTest();
  const hist = historiqueTest();

  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mes documents</p>
      <h1>Mon historique</h1>
      <p class="lede">Vos comptes rendus et résultats, conservés d’une année sur l’autre.
      Vous seul y avez accès, avec le médecin qui vous suit.</p>

      <div class="avis">
        ${ctx.ic('i-info')}
        <span>Les valeurs sont affichées telles qu’elles ont été transmises par le
        laboratoire. Aucune n’est commentée, colorée ni signalée par la plateforme : les
        bornes d’interprétation figurent sur le compte rendu du laboratoire et relèvent du
        médecin.</span>
      </div>

      <h2 style="margin-top:34px">Documents</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:15.2px">
        ${docs.map(d => `<tr style="border-bottom:1px solid var(--line-2)">
          <td style="padding:14px 0">
            <b>${ctx.esc(d.titre)}</b>
            <span style="display:block;font-size:13.4px;color:var(--ink-4);margin-top:3px">
              ${ctx.esc(d.type)} · ${ctx.esc(d.auteur)} · ${ctx.esc(d.taille)}</span>
          </td>
          <td style="padding:14px 0;text-align:right;white-space:nowrap;color:var(--ink-3);font-size:13.6px">
            ${ctx.esc(new Date(d.date).toLocaleDateString('fr-FR'))}
          </td></tr>`).join('')}
      </table>
      <p class="hint" style="margin-top:14px">Le téléchargement des documents sera activé
      sur l’hébergement certifié HDS.</p>

      <h2 style="margin-top:38px">Évolution dans le temps</h2>
      <p class="hint" style="margin-bottom:18px">Trois relevés de test. Les points sont
      reliés pour montrer la chronologie, sans aucune zone de référence.</p>

      ${hist.map(h => bloc_courbe(ctx, h)).join('')}
    </div>`);
};

function bloc_courbe(ctx, h) {
  const vals = h.valeurs;
  const nums = vals.map(v => v.v);
  /* Cadrage purement graphique : min et max servent à placer les points
     dans le dessin. Aucune comparaison à une borne clinique. */
  let mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
  if (mn === mx) { mn = mn - 1; mx = mx + 1; }
  const marge = (mx - mn) * 0.25;
  mn -= marge; mx += marge;

  const L = 520, H = 96, pad = 14;
  const pts = vals.map((v, i) => {
    const x = pad + (i * (L - 2 * pad)) / Math.max(1, vals.length - 1);
    const y = H - pad - ((v.v - mn) / (mx - mn)) * (H - 2 * pad);
    return { x: x, y: y, v: v };
  });

  return `<div style="border:1px solid var(--line);border-radius:var(--r);padding:20px 22px;margin-bottom:14px">
    <b style="font-size:15.5px">${ctx.esc(h.parametre)}</b>
    <svg viewBox="0 0 ${L} ${H}" style="width:100%;height:auto;display:block;margin-top:12px"
         role="img" aria-label="Évolution chronologique de ${ctx.esc(h.parametre)}">
      <polyline points="${pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}"
                fill="none" stroke="#0f5f6b" stroke-width="2" stroke-linecap="round"/>
      ${pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#0f5f6b"/>`).join('')}
    </svg>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;color:var(--ink-3)">
      ${vals.map(v => `<span>${ctx.esc(new Date(v.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }))}
        · <b style="color:var(--ink)">${v.v}</b></span>`).join('')}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------------
   M7 — FACTURATION
------------------------------------------------------------------------ */
Modules.factures = function (ctx) {
  const c = ctx.compte;
  const factures = [];
  let erreurDemo = null;

  /* Flux 1 — abonnement, émis par la plateforme */
  if (c.abonnement) {
    factures.push(emettreFacture('abonnement', [
      { libelle: 'Abonnement annuel — coordination du parcours', montant: c.abonnement.montant, flux: 'abonnement' }
    ]));
  }

  /* Flux 2 — actes, émis par le centre de santé. Reste à charge nul en
     tiers payant : les montants sont ceux pris en charge. */
  factures.push(emettreFacture('actes', [
    { libelle: 'Consultation de prévention', montant: 30, flux: 'actes' },
    { libelle: 'Analyses inscrites à la nomenclature', montant: 48, flux: 'actes' }
  ]));

  /* Flux 3 — hors nomenclature, seulement si un devis a été signé */
  const signe = (c.devis || []).filter(d => d.statut === 'accepte');
  signe.forEach(d => {
    factures.push(emettreFacture('hors_nomenclature',
      d.lignes.map(l => ({ libelle: l.libelle, montant: l.montant, flux: 'hors_nomenclature' }))));
  });

  /* Démonstration de la garde : on tente volontairement une facture
     mixte, elle doit être refusée par le moteur. */
  try {
    emettreFacture('abonnement', [
      { libelle: 'Abonnement annuel', montant: 129, flux: 'abonnement' },
      { libelle: 'Consultation de prévention', montant: 30, flux: 'actes' }
    ]);
  } catch (err) { erreurDemo = err.message; }

  const recap = recapitulatifParcours(factures);

  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mes factures</p>
      <h1>Ce que vous payez, et à qui</h1>
      <p class="lede">Chaque flux fait l’objet d’une facture distincte, émise par son
      émetteur. Aucune facture ne peut mélanger deux flux.</p>

      ${factures.map(f => `
        <div style="border:1px solid var(--line);border-radius:var(--r-l);padding:24px;margin-top:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
            <div>
              <b style="font-size:16.5px">${ctx.esc(libelleFlux(f.flux))}</b>
              <span style="display:block;font-size:13.6px;color:var(--ink-4);margin-top:4px">
                Émise par ${ctx.esc(f.emetteur)} · réf. ${ctx.esc(f.id)}</span>
            </div>
            <div style="text-align:right">
              <b style="font-size:21px">${f.total} €</b>
              <span style="display:block;font-size:13px;color:var(--ink-3)">${ctx.esc(f.payeur)}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:15px">
            ${f.lignes.map(l => `<tr style="border-top:1px solid var(--line-2)">
              <td style="padding:10px 0;color:var(--ink-2)">${ctx.esc(l.libelle)}</td>
              <td style="padding:10px 0;text-align:right">${l.montant} €</td></tr>`).join('')}
          </table>
          ${f.flux === 'actes' ? `<p class="hint" style="margin-top:14px">Pris en charge en
          tiers payant : vous n’avancez pas ces montants. Une participation forfaitaire
          légale peut rester à votre charge sur les actes de biologie.</p>` : ''}
        </div>`).join('')}

      <h2 style="margin-top:38px">Récapitulatif de parcours</h2>
      <div class="avis">
        ${ctx.ic('i-info')}
        <span>${ctx.esc(recap.mention)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:15.2px">
        ${recap.blocs.map(b => `<tr style="border-bottom:1px solid var(--line-2)">
          <td style="padding:12px 0">${ctx.esc(libelleFlux(b.flux))}</td>
          <td style="padding:12px 0;color:var(--ink-3);font-size:13.8px">${ctx.esc(b.emetteur)}</td>
          <td style="padding:12px 0;text-align:right;font-weight:620">${b.total} €</td></tr>`).join('')}
      </table>
      <p class="hint" style="margin-top:12px">Aucun total consolidé n’est affiché :
      additionner les trois flux dans un seul montant reviendrait à présenter une facture
      unique.</p>

      <h2 style="margin-top:38px">Garde technique</h2>
      <div class="avis warn">
        ${ctx.ic('i-lock')}
        <span><b>Test exécuté à l’instant.</b> Une facture mêlant l’abonnement et un acte
        pris en charge a été volontairement demandée au moteur. Réponse du moteur :
        <br><code style="font-size:13px;display:inline-block;margin-top:8px">${ctx.esc(erreurDemo || 'aucune erreur — la garde ne fonctionne pas')}</code></span>
      </div>
    </div>`);
};

function libelleFlux(code) {
  const f = Object.keys(FLUX).map(k => FLUX[k]).find(x => x.code === code);
  return f ? f.libelle : code;
}

/* Exposé */
window.Modules = Modules;
window.FacturationTest = { emettreFacture: emettreFacture, recapitulatifParcours: recapitulatifParcours };
