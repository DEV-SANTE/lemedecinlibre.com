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
Modules.rendezvous = async function (ctx) {
  /* ===================================================================
     BRANCHÉ SUR LE SERVEUR — les créneaux affichés existent en base,
     publiés par le secrétariat. Les centres et créneaux de test qui
     vivaient ici ont été retirés : un écran qui propose des rendez-vous
     imaginaires est pire qu'un écran vide, parce qu'on peut les choisir.

     Ce que l'écran ne fait toujours pas : suggérer. Les créneaux sont
     listés par date, tous les centres confondus, sans tri « adapté à
     votre profil » — un tri déduit du dossier serait une orientation.
     =================================================================== */
  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mon parcours</p>
      <h1>Prendre rendez-vous</h1>
      <p class="lede">Vous choisissez librement votre créneau et le centre où vous serez
      reçu. Aucun n’est présélectionné, aucun ne vous est recommandé.</p>
      <div id="rdv-miens"><p class="hint">Chargement…</p></div>
      <h2 style="margin-top:30px">Créneaux disponibles</h2>
      <div id="rdv-libres"><p class="hint">Chargement…</p></div>
    </div>`);

  const jolie = (iso) => new Date(iso).toLocaleString('fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const rafraichir = async () => {
    /* Mes rendez-vous d'abord : c'est ce qu'on vient vérifier le plus. */
    try {
      const miens = await API.mesRendezvous();
      const zone = document.getElementById('rdv-miens');
      if (!miens.rendezvous.length) {
        zone.innerHTML = '';
      } else {
        const libelles = { demande: 'demandé — en attente de confirmation du centre',
                           confirme: 'confirmé', annule: 'annulé' };
        zone.innerHTML = '<h2 style="margin-top:26px">Mes rendez-vous</h2>'
          + miens.rendezvous.map((r) => `
            <div class="avis" style="${r.statut === 'confirme'
              ? 'background:var(--fait-l);border-color:var(--fait-ln)' : ''}">
              <span><b>${ctx.esc(jolie(r.debut))}</b> · ${ctx.esc(r.centre)} ·
              ${ctx.esc(libelles[r.statut] || r.statut)}
              ${r.statut !== 'annule' ? `<button class="btn" data-annuler="${ctx.esc(r.id)}"
                style="margin-left:12px;padding:4px 10px;font-size:12.5px">Annuler</button>` : ''}
              </span>
            </div>`).join('');
        zone.querySelectorAll('[data-annuler]').forEach((b) => {
          b.onclick = async () => {
            if (!window.confirm('Annuler ce rendez-vous ?')) return;
            try { await API.annulerRendezvous(b.dataset.annuler); rafraichir(); }
            catch (e) { window.alert('Annulation impossible : ' + (e.message || '')); }
          };
        });
      }
    } catch (e) {
      document.getElementById('rdv-miens').innerHTML =
        '<p class="hint">Rendez-vous indisponibles : ' + ctx.esc(e.message || '') + '</p>';
    }

    /* Les créneaux libres, par date. */
    try {
      const libres = await API.creneauxLibres();
      const zone = document.getElementById('rdv-libres');
      if (!libres.creneaux.length) {
        zone.innerHTML = '<p class="hint">Aucun créneau publié pour le moment. Le '
          + 'secrétariat du centre les met en ligne au fil de l’eau — revenez un peu '
          + 'plus tard, ou contactez le centre directement.</p>';
        return;
      }
      zone.innerHTML = libres.creneaux.map((c) => `
        <label class="payopt" style="margin-top:9px">
          <input type="radio" name="creneau" value="${ctx.esc(c.id)}">
          <span style="flex:1"><b>${ctx.esc(jolie(c.debut))}</b>
            <span>${ctx.esc(c.centre)} · ${ctx.esc(c.duree_min)} minutes</span></span>
        </label>`).join('')
        + '<div class="acts" style="margin-top:18px">'
        + '<button class="btn b-p" id="rdv-demander">Demander ce rendez-vous</button></div>'
        + '<div id="rdv-msg"></div>';

      document.getElementById('rdv-demander').onclick = async () => {
        const choisi = zone.querySelector('input[name="creneau"]:checked');
        const msg = document.getElementById('rdv-msg');
        if (!choisi) { msg.innerHTML = '<p class="hint">Choisissez un créneau.</p>'; return; }
        try {
          const r = await API.demanderRendezvous(choisi.value);
          msg.innerHTML = '<div class="avis"><span>' + ctx.esc(r.note) + '</span></div>';
          rafraichir();
        } catch (e) {
          msg.innerHTML = '<p class="hint">' + ctx.esc(e.message || 'Demande impossible.') + '</p>';
          if (e.statut === 409) rafraichir();   /* créneau pris entre-temps */
        }
      };
    } catch (e) {
      document.getElementById('rdv-libres').innerHTML =
        '<p class="hint">Créneaux indisponibles : ' + ctx.esc(e.message || '') + '</p>';
    }
  };
  rafraichir();
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
Modules.documents = async function (ctx) {
  /* Branché sur le serveur : la liste vient de la table document, remplie
     par le centre. Les documents de test ont été retirés. Le fichier
     lui-même n'est pas encore téléchargeable — le stockage hors base
     viendra avec le dépôt de fichiers ; en attendant l'écran liste ce qui
     existe et le dit, plutôt que d'offrir un bouton qui ne fait rien. */
  ctx.render(`
    <div class="card">
      <p class="eyebrow">Mon parcours</p>
      <h1>Mes documents</h1>
      <p class="lede">Les documents que le centre vous a remis : comptes-rendus,
      attestations, résultats.</p>
      <div id="docs-liste"><p class="hint">Chargement…</p></div>
    </div>`);
  try {
    const r = await API.mesDocuments();
    const zone = document.getElementById('docs-liste');
    if (!r.documents.length) {
      zone.innerHTML = '<p class="hint">Aucun document pour le moment. Ils apparaîtront '
        + 'ici quand le centre en déposera.</p>';
      return;
    }
    const natures = { 'compte-rendu': 'Compte-rendu', attestation: 'Attestation',
                      resultat: 'Résultat', autre: 'Document' };
    zone.innerHTML = '<table class="cv" style="margin-top:14px"><thead><tr>'
      + '<th>Document</th><th>Nature</th><th>Déposé le</th><th>Par</th></tr></thead><tbody>'
      + r.documents.map((d) => `<tr>
          <td><b>${ctx.esc(d.titre)}</b></td>
          <td>${ctx.esc(natures[d.nature] || d.nature)}</td>
          <td class="cv-d">${ctx.esc(new Date(d.depose_le).toLocaleDateString('fr-FR'))}</td>
          <td>${ctx.esc(d.depose_par || '—')}</td>
        </tr>`).join('') + '</tbody></table>'
      + '<p class="hint" style="margin-top:14px">Le téléchargement en ligne arrive dans une '
      + 'prochaine version : pour l’instant, ces documents vous sont remis par le centre.</p>';
  } catch (e) {
    document.getElementById('docs-liste').innerHTML =
      '<p class="hint">Documents indisponibles : ' + ctx.esc(e.message || '') + '</p>';
  }
};

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
