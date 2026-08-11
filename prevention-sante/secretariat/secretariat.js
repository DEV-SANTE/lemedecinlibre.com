/* =====================================================================
   ESPACE SECRÉTARIAT
   ---------------------------------------------------------------------
   Quatre écrans : les patients à rattacher, les patients du centre, la
   création d'un compte, et la saisie des résultats de laboratoire.

   CE QUE CET ÉCRAN NE MONTRE JAMAIS
   Aucune réponse au questionnaire, aucun avis de médecin, aucune marque de
   couleur. Ce n'est pas une omission d'affichage : le serveur ne les
   envoie pas à un compte secrétaire, et quatre contrôles automatiques le
   vérifient. Si ce fichier essayait de les afficher, il n'aurait rien à
   afficher.

   Ce qu'il montre : l'identité administrative, l'état d'avancement des
   dossiers, et les valeurs de laboratoire — celles que le secrétariat
   saisit lui-même depuis les comptes-rendus. Voir la note d'arbitrage dans
   serveur/src/droits.js, fonction peutLireResultats.
   ===================================================================== */
'use strict';

const $ = (s) => document.querySelector(s);
const app = () => $('#app');
const esc = (v) => String(v === null || v === undefined ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

let COMPTE = null;
let vue = 'attente';

function jolieDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric' });
}

function pastille(statut) {
  if (!statut) return '<span class="pastille p-brouillon">aucun dossier</span>';
  const libelles = { brouillon: 'en cours de remplissage', transmis: 'transmis au médecin',
                     relu: 'relu et visé' };
  return '<span class="pastille p-' + esc(statut) + '">' + esc(libelles[statut] || statut) + '</span>';
}

function message(id, texte, type) {
  const e = document.getElementById(id);
  if (!e) return;
  e.textContent = texte;
  e.className = 'msg ' + (type || '');
}

/* Le mur du secret médical, écrit sur chaque écran qui liste des patients.
   Une secrétaire doit savoir ce qu'elle ne voit pas, sinon elle croit que
   le dossier est vide. */
const MUR = `<div class="mur"><b>Ce que vous ne voyez pas, et pourquoi.</b>
  Les réponses au questionnaire, les avis du médecin et ses annotations ne vous sont pas
  transmis : ils relèvent du secret médical, et votre travail n’en a pas besoin. Ce n’est pas
  un défaut d’affichage — le serveur ne les envoie pas à un compte secrétariat. Les valeurs
  de laboratoire, elles, vous sont accessibles puisque c’est vous qui les saisissez.</div>`;

/* ------------------------------------------------------- à rattacher */
async function vueAttente() {
  app().innerHTML = '<h1>Patients à rattacher</h1>'
    + '<p class="sous">Ces personnes se sont inscrites elles-mêmes. Tant qu’elles ne sont pas '
    + 'rattachées au centre, <b>aucun médecin ne voit leur dossier</b> — c’est ce rattachement '
    + 'qui ouvre l’accès, et il vous appartient. Vérifiez l’identité avant de rattacher.</p>'
    + '<div id="liste">Chargement…</div>' + MUR;
  try {
    const r = await API.patientsEnAttente();
    if (!r.patients.length) {
      $('#liste').innerHTML = '<div class="vide">Aucune inscription en attente.</div>';
      return;
    }
    $('#liste').innerHTML = '<table><thead><tr><th>Nom</th><th>Prénom</th>'
      + '<th>Naissance</th><th>Adresse</th><th>Inscrit le</th><th></th></tr></thead><tbody>'
      + r.patients.map((p) => `<tr>
          <td><b>${esc(p.nom)}</b></td><td>${esc(p.prenom)}</td>
          <td>${jolieDate(p.naissance)}</td><td>${esc(p.courriel)}</td>
          <td>${jolieDate(p.cree_le)}</td>
          <td><button class="btn btn-p" data-rattacher="${esc(p.id)}">Rattacher</button></td>
        </tr>`).join('') + '</tbody></table><div class="msg" id="m-att"></div>';

    document.querySelectorAll('[data-rattacher]').forEach((b) => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          await API.rattacher(b.dataset.rattacher);
          await vueAttente();
        } catch (e) {
          b.disabled = false;
          message('m-att', 'Rattachement impossible : ' + (e.message || 'serveur injoignable'), 'erreur');
        }
      };
    });
  } catch (e) {
    $('#liste').innerHTML = '<div class="vide">Liste indisponible : ' + esc(e.message) + '</div>';
  }
}

/* ---------------------------------------------------- patients du centre */
async function vuePatients() {
  app().innerHTML = '<h1>Patients du centre</h1>'
    + '<p class="sous">Identité et avancement des dossiers. Le contenu des dossiers ne '
    + 'figure pas ici.</p><div id="liste">Chargement…</div>' + MUR;
  try {
    const r = await API.listerPatients();
    if (!r.patients.length) {
      $('#liste').innerHTML = '<div class="vide">Aucun patient rattaché à ce centre.</div>';
      return;
    }
    $('#liste').innerHTML = '<table><thead><tr><th>Nom</th><th>Prénom</th>'
      + '<th>Naissance</th><th>Dossiers</th><th>État du dernier</th>'
      + '<th>N° de sécurité sociale</th></tr></thead><tbody>'
      + r.patients.map((p) => `<tr>
          <td><b>${esc(p.nom)}</b></td><td>${esc(p.prenom)}</td>
          <td>${jolieDate(p.naissance)}</td>
          <td>${esc(p.dossiers)}</td><td>${pastille(p.dernier_statut)}</td>
          <td><span data-nir="${esc(p.id)}" class="hint">…</span>
              <button class="btn" data-nir-saisir="${esc(p.id)}"
                      style="margin-left:7px;padding:4px 9px;font-size:12px">Saisir</button></td>
        </tr>`).join('') + '</tbody></table><div class="msg" id="m-nir"></div>';

    /* Le numéro n'est jamais affiché en entier : quatre chiffres suffisent
       à vérifier une saisie, et un écran de secrétariat reste sous les yeux
       de tout le monde. */
    document.querySelectorAll('[data-nir]').forEach(async (cellule) => {
      try {
        const n = await API.lireNir(cellule.dataset.nir);
        cellule.textContent = n.renseigne ? '•••••••••••' + n.quatreDerniers : 'non renseigné';
      } catch (e) { cellule.textContent = 'indisponible'; }
    });

    document.querySelectorAll('[data-nir-saisir]').forEach((b) => {
      b.onclick = async () => {
        const saisi = window.prompt('Numéro de sécurité sociale (15 chiffres, clé comprise) :');
        if (!saisi) return;
        b.disabled = true;
        try {
          await API.enregistrerNir(b.dataset.nirSaisir, saisi);
          message('m-nir', 'Numéro chiffré et enregistré. Il ne sera plus affiché en entier.', 'ok');
          await vuePatients();
        } catch (e) {
          b.disabled = false;
          message('m-nir', e.message || 'Enregistrement impossible.', 'erreur');
        }
      };
    });
  } catch (e) {
    $('#liste').innerHTML = '<div class="vide">Liste indisponible : ' + esc(e.message) + '</div>';
  }
}

/* ------------------------------------------------------ nouveau patient */
function vueNouveau() {
  app().innerHTML = `
    <h1>Créer un compte patient</h1>
    <p class="sous">Le compte est rattaché à votre centre dès sa création. Transmettez le mot
    de passe à la personne par un moyen sûr, et invitez-la à le changer à sa première
    connexion.</p>
    <form class="carte" id="f-nouveau">
      <div class="deux">
        <div><label for="n-prenom">Prénom</label><input id="n-prenom" required></div>
        <div><label for="n-nom">Nom</label><input id="n-nom" required></div>
      </div>
      <label for="n-courriel">Adresse électronique</label>
      <input id="n-courriel" type="email" required>
      <div class="deux">
        <div><label for="n-naissance">Date de naissance</label>
             <input id="n-naissance" type="date"></div>
        <div><label for="n-sexe">Sexe</label>
             <select id="n-sexe">
               <option value="non renseigne">Non renseigné</option>
               <option value="F">Féminin</option>
               <option value="M">Masculin</option>
               <option value="autre">Autre</option>
             </select></div>
      </div>
      <label for="n-mdp">Mot de passe provisoire</label>
      <input id="n-mdp" type="text" required minlength="12" value="">
      <p class="aide">Douze caractères au minimum. Il s’affiche en clair pour que vous puissiez
      le dicter, puis il n’est plus jamais lisible : seule son empreinte est conservée.</p>
      <p style="margin-top:18px"><button class="btn btn-p" type="submit">Créer le compte</button></p>
      <div class="msg" id="m-nouveau"></div>
    </form>`;

  /* Proposition de mot de passe : quatre mots tirés au hasard. Plus facile
     à dicter au téléphone qu'une suite de symboles, et plus solide. */
  const MOTS = ['ardoise', 'bruyere', 'cascade', 'dolomie', 'estuaire', 'foudre', 'givre',
                'houle', 'jonquille', 'lagune', 'menhir', 'nuage', 'orage', 'prairie',
                'quartz', 'ruisseau', 'silex', 'tourbe', 'vallon', 'zenith'];
  const tirage = [];
  const alea = new Uint32Array(4);
  (window.crypto || window.msCrypto).getRandomValues(alea);
  for (let i = 0; i < 4; i++) tirage.push(MOTS[alea[i] % MOTS.length]);
  $('#n-mdp').value = tirage.join('-');

  $('#f-nouveau').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('#f-nouveau button');
    b.disabled = true;
    message('m-nouveau', '', '');
    try {
      const r = await API.creerPatient({
        prenom: $('#n-prenom').value.trim(), nom: $('#n-nom').value.trim(),
        courriel: $('#n-courriel').value.trim(),
        naissance: $('#n-naissance').value || null,
        sexe: $('#n-sexe').value,
        motDePasse: $('#n-mdp').value,
      });
      message('m-nouveau', 'Compte créé et rattaché au centre (patient n° ' + r.patientId
        + '). Communiquez le mot de passe provisoire à la personne.', 'ok');
      $('#f-nouveau').reset();
    } catch (err) {
      message('m-nouveau', err.message || 'Création impossible.', 'erreur');
    }
    b.disabled = false;
  };
}

/* --------------------------------------------------- saisie de résultats */
async function vueResultats() {
  app().innerHTML = '<h1>Saisir des résultats de laboratoire</h1>'
    + '<p class="sous">Choisissez le patient, la date du prélèvement, puis reportez les valeurs '
    + 'du compte-rendu. Les valeurs sont enregistrées telles quelles : aucune n’est comparée à '
    + 'une norme, et le logiciel ne signale rien. C’est le médecin qui les interprète.</p>'
    + '<div id="zone">Chargement…</div>';
  try {
    const r = await API.listerPatients();
    const avecDossier = r.patients.filter((p) => p.dernier_dossier);
    if (!avecDossier.length) {
      $('#zone').innerHTML = '<div class="vide">Aucun patient n’a de dossier ouvert. '
        + 'Un dossier est créé lorsque la personne commence son questionnaire.</div>';
      return;
    }
    $('#zone').innerHTML = `
      <form class="carte" id="f-res" style="max-width:640px">
        <label for="r-patient">Patient</label>
        <select id="r-patient">
          ${avecDossier.map((p) => `<option value="${esc(p.dernier_dossier)}">`
            + `${esc(p.nom)} ${esc(p.prenom)} — dossier ${esc(p.dernier_dossier)}</option>`).join('')}
        </select>
        <label for="r-date">Date du prélèvement</label>
        <input id="r-date" type="date" required>
        <div id="params"></div>
        <p class="aide">Laissez vide ce qui ne figure pas sur le compte-rendu : une valeur
        absente reste absente, elle n’est pas estimée.</p>
        <p style="margin-top:18px"><button class="btn btn-p" type="submit">Enregistrer</button></p>
        <div class="msg" id="m-res"></div>
      </form>`;

    /* La liste des paramètres vient de biologie.js, qui fait autorité —
       elle n'est pas recopiée ici. */
    const params = (typeof Biologie !== 'undefined' && Biologie.parametres)
      ? Biologie.parametres()
      : [{ id: 'hb', nom: 'Hémoglobine', unite: 'g/dL' }];
    $('#params').innerHTML = '<label style="margin-top:16px">Valeurs</label>'
      + '<div class="deux">' + params.map((p) => `<div>
          <label for="p-${esc(p.id)}" style="font-weight:400;color:var(--ink-3)">
            ${esc(p.nom)} <span style="color:var(--ink-4)">(${esc(p.unite)})</span></label>
          <input id="p-${esc(p.id)}" data-param="${esc(p.id)}" data-unite="${esc(p.unite)}"
                 inputmode="decimal"></div>`).join('') + '</div>';

    $('#f-res').onsubmit = async (e) => {
      e.preventDefault();
      const b = $('#f-res button');
      const date = $('#r-date').value;
      if (!date) { message('m-res', 'Indiquez la date du prélèvement.', 'erreur'); return; }
      const resultats = [];
      document.querySelectorAll('[data-param]').forEach((champ) => {
        const v = champ.value.trim().replace(',', '.');
        if (v === '') return;
        resultats.push({ parametre: champ.dataset.param, dateValeur: date,
                         valeur: v, unite: champ.dataset.unite, source: 'saisie secrétariat' });
      });
      if (!resultats.length) { message('m-res', 'Aucune valeur saisie.', 'erreur'); return; }
      b.disabled = true;
      try {
        const r2 = await API.saisirResultats($('#r-patient').value, resultats);
        message('m-res', r2.enregistres + ' valeur(s) enregistrée(s) pour le '
          + jolieDate(date) + '.', 'ok');
        document.querySelectorAll('[data-param]').forEach((c) => { c.value = ''; });
      } catch (err) {
        message('m-res', err.message || 'Enregistrement impossible.', 'erreur');
      }
      b.disabled = false;
    };
  } catch (e) {
    $('#zone').innerHTML = '<div class="vide">Écran indisponible : ' + esc(e.message) + '</div>';
  }
}

/* --------------------------------------------------- agenda du centre
   Le secrétariat publie les créneaux — c'est la seule source de ceux que
   les patients voient — puis confirme ou annule les demandes. */
async function vueAgenda() {
  app().innerHTML = `
    <h1>Créneaux et rendez-vous</h1>
    <p class="sous">Les créneaux que vous publiez ici sont ceux que les patients peuvent
    demander. Une demande ne devient un rendez-vous qu’après votre confirmation.</p>
    <div class="carte" style="max-width:640px">
      <label for="a-date">Publier des créneaux — jour</label>
      <input id="a-date" type="date">
      <div class="deux">
        <div><label for="a-de">De</label><input id="a-de" type="time" value="09:00"></div>
        <div><label for="a-a">À</label><input id="a-a" type="time" value="12:00"></div>
      </div>
      <label for="a-duree">Durée de chaque créneau (minutes)</label>
      <input id="a-duree" inputmode="numeric" value="30">
      <p style="margin-top:16px"><button class="btn btn-p" id="a-publier">Publier</button></p>
      <div class="msg" id="a-msg"></div>
    </div>
    <h1 style="margin-top:34px;font-size:17px">Demandes et rendez-vous</h1>
    <div id="a-liste">Chargement…</div>`;

  $('#a-publier').onclick = async () => {
    const date = $('#a-date').value, de = $('#a-de').value, a = $('#a-a').value;
    const duree = parseInt($('#a-duree').value, 10) || 30;
    if (!date || !de || !a) { message('a-msg', 'Renseignez le jour et la plage.', 'erreur'); return; }
    const debut = new Date(date + 'T' + de);
    const fin = new Date(date + 'T' + a);
    const creneaux = [];
    for (let t = debut; t < fin; t = new Date(t.getTime() + duree * 60000)) {
      creneaux.push({ debut: t.toISOString(), dureeMin: duree });
    }
    if (!creneaux.length) { message('a-msg', 'La plage est vide.', 'erreur'); return; }
    try {
      const r = await API.publierCreneaux(creneaux);
      message('a-msg', r.publies + ' créneau(x) publié(s).', 'ok');
      chargerRdv();
    } catch (e) { message('a-msg', e.message || 'Publication impossible.', 'erreur'); }
  };

  const chargerRdv = async () => {
    try {
      const r = await API.mesRendezvous();
      const zone = $('#a-liste');
      if (!r.rendezvous.length) {
        zone.innerHTML = '<div class="vide">Aucune demande pour le moment.</div>';
        return;
      }
      const lib = { demande: 'à confirmer', confirme: 'confirmé', annule: 'annulé' };
      zone.innerHTML = '<table><thead><tr><th>Quand</th><th>Patient</th><th>État</th><th></th>'
        + '</tr></thead><tbody>'
        + r.rendezvous.map((x) => `<tr>
            <td>${esc(new Date(x.debut).toLocaleString('fr-FR'))}</td>
            <td><b>${esc(x.nom)}</b> ${esc(x.prenom)}</td>
            <td>${esc(lib[x.statut] || x.statut)}</td>
            <td>${x.statut === 'demande'
              ? `<button class="btn btn-p" data-conf="${esc(x.id)}"
                   style="padding:5px 11px;font-size:12.5px">Confirmer</button>` : ''}
                ${x.statut !== 'annule'
              ? `<button class="btn" data-ann="${esc(x.id)}"
                   style="padding:5px 11px;font-size:12.5px;margin-left:6px">Annuler</button>` : ''}</td>
          </tr>`).join('') + '</tbody></table>';
      zone.querySelectorAll('[data-conf]').forEach((b) => {
        b.onclick = async () => { await API.confirmerRendezvous(b.dataset.conf); chargerRdv(); };
      });
      zone.querySelectorAll('[data-ann]').forEach((b) => {
        b.onclick = async () => {
          if (window.confirm('Annuler ce rendez-vous ?')) {
            await API.annulerRendezvous(b.dataset.ann); chargerRdv();
          }
        };
      });
    } catch (e) {
      $('#a-liste').innerHTML = '<div class="vide">Indisponible : ' + esc(e.message) + '</div>';
    }
  };
  chargerRdv();
}

/* -------------------------------------------------------- documents
   Référencement des documents remis : le fichier lui-même n'est pas
   encore déposé en ligne, la liste dit au patient ce qui existe. */
async function vueDocuments() {
  app().innerHTML = `
    <h1>Documents</h1>
    <p class="sous">Référencez ici les documents remis à un patient : il en voit la liste
    dans son espace. Le dépôt du fichier lui-même arrivera dans une prochaine version.</p>
    <div class="carte" style="max-width:640px" id="d-carte">Chargement…</div>
    <div id="d-liste" style="margin-top:24px"></div>`;
  try {
    const r = await API.listerPatients();
    if (!r.patients.length) {
      $('#d-carte').innerHTML = '<div class="vide">Aucun patient rattaché.</div>';
      return;
    }
    $('#d-carte').innerHTML = `
      <label for="d-patient">Patient</label>
      <select id="d-patient">${r.patients.map((p) =>
        `<option value="${esc(p.id)}">${esc(p.nom)} ${esc(p.prenom)}</option>`).join('')}</select>
      <label for="d-titre">Titre du document</label>
      <input id="d-titre" placeholder="Compte-rendu de consultation du…">
      <label for="d-nature">Nature</label>
      <select id="d-nature">
        <option value="compte-rendu">Compte-rendu</option>
        <option value="attestation">Attestation</option>
        <option value="resultat">Résultat</option>
        <option value="autre">Autre</option>
      </select>
      <p style="margin-top:16px"><button class="btn btn-p" id="d-ref">Référencer</button></p>
      <div class="msg" id="d-msg"></div>`;
    $('#d-ref').onclick = async () => {
      const titre = $('#d-titre').value.trim();
      if (!titre) { message('d-msg', 'Le titre est requis.', 'erreur'); return; }
      try {
        await API.referencerDocument({ patientId: $('#d-patient').value,
          titre: titre, nature: $('#d-nature').value });
        message('d-msg', 'Document référencé : le patient le voit dans son espace.', 'ok');
        $('#d-titre').value = '';
        chargerDocs();
      } catch (e) { message('d-msg', e.message || 'Référencement impossible.', 'erreur'); }
    };
    const chargerDocs = async () => {
      const docs = await API.mesDocuments();
      $('#d-liste').innerHTML = docs.documents.length
        ? '<table><thead><tr><th>Titre</th><th>Nature</th><th>Patient</th><th>Déposé le</th>'
          + '</tr></thead><tbody>'
          + docs.documents.map((d) => `<tr><td><b>${esc(d.titre)}</b></td>
              <td>${esc(d.nature)}</td><td>${esc(d.nom)} ${esc(d.prenom)}</td>
              <td>${esc(new Date(d.depose_le).toLocaleDateString('fr-FR'))}</td></tr>`).join('')
          + '</tbody></table>'
        : '';
    };
    chargerDocs();
  } catch (e) {
    $('#d-carte').innerHTML = '<div class="vide">Indisponible : ' + esc(e.message) + '</div>';
  }
}

/* ------------------------------------------------------- ma sécurité
   Les codes de secours ne servent que le jour où le téléphone est perdu.
   Ce jour-là, il est trop tard pour les créer : cet écran existe pour
   qu'on puisse vérifier combien il en reste AVANT d'en avoir besoin. */
async function vueSecurite() {
  app().innerHTML = `
    <h1>Ma sécurité</h1>
    <p class="sous">Votre compte donne accès aux dossiers de plusieurs personnes. Il est
    protégé par une double vérification, et par des codes de secours utilisables si vous
    perdez votre téléphone.</p>
    <div class="carte" id="zone-sec">Chargement…</div>`;
  try {
    const r = await API.codesSecoursRestants();
    const alerte = r.restants <= 2;
    $('#zone-sec').innerHTML = `
      <p style="margin:0 0 6px"><b>Codes de secours restants : ${esc(r.restants)}</b>
      sur ${esc(r.total)}.</p>
      ${alerte ? '<p class="msg erreur" style="display:block">Il vous en reste très peu. '
        + 'Régénérez-en maintenant : le jour où vous perdrez votre téléphone, il sera trop '
        + 'tard.</p>' : '<p class="aide">Chacun ne sert qu’une fois.</p>'}
      <p style="margin-top:16px"><button class="btn btn-p" id="b-regen">Régénérer mes codes</button></p>
      <p class="aide">Les codes actuels cesseront de fonctionner, y compris ceux que vous
      auriez notés ailleurs.</p>
      <div id="nouveaux"></div>
      <div class="msg" id="m-sec"></div>`;

    $('#b-regen').onclick = async () => {
      if (!window.confirm('Régénérer vos codes ? Les anciens ne fonctionneront plus.')) return;
      const b = $('#b-regen');
      b.disabled = true;
      try {
        const res = await API.regenererCodesSecours();
        $('#nouveaux').innerHTML = '<p style="margin-top:18px"><b>Notez-les maintenant.</b> '
          + 'Ils ne seront plus affichés.</p>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">'
          + res.codesSecours.map((c) => '<span style="font-family:ui-monospace,Menlo,monospace;'
            + 'background:var(--bg);border:1px solid var(--line);border-radius:8px;'
            + 'padding:9px 11px;text-align:center">' + esc(c) + '</span>').join('')
          + '</div>';
      } catch (e) {
        b.disabled = false;
        message('m-sec', e.message || 'Régénération impossible.', 'erreur');
      }
    };
  } catch (e) {
    $('#zone-sec').innerHTML = 'Indisponible : ' + esc(e.message || 'serveur injoignable');
  }
}

/* ------------------------------------------------------------ navigation */
const VUES = { attente: vueAttente, patients: vuePatients,
               nouveau: vueNouveau, resultats: vueResultats,
               agenda: vueAgenda, documents: vueDocuments, securite: vueSecurite };

function afficher(nom) {
  vue = nom;
  document.querySelectorAll('nav button').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.vue === nom));
  });
  VUES[nom]();
  window.scrollTo(0, 0);
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    COMPTE = await API.exigerSession(['secretaire', 'medecin']);
    if (!COMPTE) return;
    $('#qui').innerHTML = esc(COMPTE.nom) + '<br>'
      + '<span style="color:var(--ink-4)">' + esc(COMPTE.role) + ' · centre '
      + esc(COMPTE.centreId) + '</span>';
    $('#b-sortir').onclick = async () => {
      await API.deconnexion();
      window.location.href = '/connexion/';
    };
    document.querySelectorAll('nav button').forEach((b) => {
      b.onclick = () => afficher(b.dataset.vue);
    });
    afficher('attente');
  } catch (e) {
    document.body.innerHTML = '<div style="max-width:60ch;margin:60px auto;padding:0 20px;'
      + 'font:15px/1.65 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#16324f">'
      + '<h1 style="font-size:21px">Secrétariat indisponible</h1><p>'
      + (e && e.message ? esc(e.message) : 'serveur injoignable')
      + '.</p><p><a href="/connexion/">Se reconnecter</a>.</p></div>';
  }
});
