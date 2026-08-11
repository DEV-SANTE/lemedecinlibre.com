/* =====================================================================
   ENCHAÎNEMENT DES ÉCRANS
   ---------------------------------------------------------------------
   POURQUOI CETTE SÉRIE EXISTE

   Les trois autres séries testaient l'API d'un côté et les pages de
   l'autre. Chacune passait, et pourtant le parcours était coupé : le
   patient terminait son questionnaire, l'écran annonçait « vos réponses
   sont transmises », mais rien n'appelait la transmission. Le dossier
   restait en brouillon, donc le médecin ne pouvait pas rendre d'avis.

   Aucun contrôle ne voyait le trou parce qu'aucun ne suivait la chaîne
   entière. Celui-ci la suit, et vérifie surtout que ce qui est AFFICHÉ
   correspond à ce que la base contient — un écran qui annonce une action
   non effectuée est pire qu'une erreur visible.
   ===================================================================== */
'use strict';
process.on('unhandledRejection', () => {});
const path = require('node:path');
const fs = require('node:fs');
const db = require('../src/db');
const mdp = require('../src/mdp');
const totp = require('../src/totp');
const { creerServeur } = require('../src/serveur');

const SITE = path.join(__dirname, '..', '..', 'prevention-sante');
const SECRET = totp.nouveauSecret();
let base, reussis = 0, echoues = 0;
const echecs = [];
const ok = (n, c, d) => { if (c) { reussis++; console.log('  \x1b[32mok\x1b[0m   ' + n); }
  else { echoues++; echecs.push(n); console.log('  \x1b[31mÉCHEC\x1b[0m ' + n + (d ? '\n         → ' + d : '')); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

function nav() {
  let cookie = null;
  return async (methode, chemin, corps) => {
    const o = { method: methode, headers: {} };
    if (cookie) o.headers.Cookie = cookie;
    if (corps !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(corps); }
    const r = await fetch(base + chemin, o);
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    if (sc.length) cookie = sc[0].split(';')[0];
    const t = await r.text();
    let j = null; try { j = JSON.parse(t); } catch (e) {}
    return { statut: r.status, corps: j, texte: t };
  };
}

async function principal() {
  await db.ouvrir({}); await db.creerSchema();
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1,'Centre pilote')`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(`INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps)
    VALUES ('m@test.fr',$1,'medecin',1,'Dr A','10000000001'),
           ('s@test.fr',$1,'secretaire',1,'Sec A',NULL)`, [h]);
  await db.requete(`UPDATE compte SET totp_secret=$1, totp_actif=TRUE
                     WHERE role IN ('medecin','secretaire')`, [SECRET]);
  const serveur = creerServeur({ securise: false, site: SITE });
  await new Promise((r) => serveur.listen(0, r));
  base = 'http://127.0.0.1:' + serveur.address().port;

  const soignant = async (n, mail) => {
    await n('POST', '/api/connexion', { courriel: mail, motDePasse: 'mot-de-passe-de-test' });
    await db.requete(`UPDATE compte SET totp_dernier_pas=NULL WHERE lower(courriel)=lower($1)`, [mail]);
    return n('POST', '/api/totp/verifier', { code: totp.codePour(SECRET, totp.pasCourant()) });
  };

  section('1. Le code des écrans appelle bien chaque étape du parcours');
  /* Contrôle statique : chaque action indispensable doit être déclenchée
     par un écran. C'est ce contrôle qui manquait. */
  const ecrans = {
    'espace/patient.js': ['API.creerDossier', 'API.enregistrerReponses', 'API.transmettre',
                          'API.journalDuDossier', 'API.mesDonnees', 'API.effacerMonCompte',
                          'API.monConsentement', 'API.retirerConsentement'],
    'plateforme/app.js': ['API.signerAvis', 'API.poserMarque'],
    'connexion/index.html': ['API.connexion', 'API.inscription', 'API.totpVerifier',
                             'API.motDePasseOublie', 'API.reinitialiser', 'API.totpActiver',
                             'API.texteConsentement'],
    'secretariat/secretariat.js': ['API.patientsEnAttente', 'API.rattacher', 'API.creerPatient',
                                   'API.listerPatients', 'API.saisirResultats',
                                   'API.enregistrerNir', 'API.lireNir',
                                   'API.codesSecoursRestants', 'API.regenererCodesSecours',
                                   'API.publierCreneaux', 'API.confirmerRendezvous',
                                   'API.referencerDocument'],
    'espace/modules.js': ['API.creneauxLibres', 'API.demanderRendezvous', 'API.mesRendezvous',
                          'API.annulerRendezvous', 'API.mesDocuments'],
    'entreprise/entreprise.js': ['API.statistiques'],
    'pilotage/pilotage.js': ['API.pilotage'],
  };
  for (const [f, appels] of Object.entries(ecrans)) {
    const src = fs.readFileSync(path.join(SITE, f), 'utf8');
    for (const a of appels) {
      ok(`${f} déclenche ${a}()`, src.includes(a + '('),
        'aucun écran n’appelle cette action : le parcours serait coupé');
    }
  }

  section('2. Le bouton de fin déclenche vraiment la transmission');
  /* Contrôle plus fin que le précédent : il ne suffit pas que le fichier
     contienne l'appel quelque part — une fonction peut exister sans que
     rien ne l'appelle. On isole le gestionnaire du dernier bouton et on
     vérifie qu'il mène à la transmission. C'est exactement ce que mon
     premier contrôle laissait passer. */
  const srcP = fs.readFileSync(path.join(SITE, 'espace', 'patient.js'), 'utf8');
  const debut = srcP.indexOf("$('#b-suiv').onclick");
  const suite = srcP.indexOf("$('#fq').addEventListener", debut);
  const handler = debut >= 0 && suite > debut ? srcP.slice(debut, suite) : '';
  ok('le gestionnaire du bouton de fin a été trouvé', handler.length > 0);
  ok('il appelle la transmission', /transmettre\s*\(/.test(handler),
    'le bouton « Terminer » doit transmettre, pas seulement changer d’écran');
  ok('il attend la réponse du serveur', /await/.test(handler),
    'sans attente, l’écran de fin s’affiche avant que le serveur ait répondu');
  ok('il n’écrit pas le statut lui-même',
    !/statut\s*=\s*'transmis'/.test(handler),
    'le statut vient du serveur, jamais du navigateur');
  ok('il prévoit l’échec', /catch/.test(handler),
    'une transmission peut échouer : la personne doit l’apprendre');

  section('3. L’écran de fin ne peut pas annoncer une transmission non faite');
  const src = srcP;
  ok('le titre de l’écran de fin dépend du statut réel',
    /transmis\s*\?/.test(src) && /statut !== 'brouillon'/.test(src),
    'le texte doit être conditionné au statut renvoyé par le serveur');
  ok('la transmission est confirmée par le serveur avant l’affichage',
    /n’a pas confirmé la transmission/.test(src));
  ok('un échec de transmission est montré à la personne',
    /echec-transmission/.test(src));
  ok('le statut n’est plus écrit à la main dans le cache',
    !/d\.statut = 'transmis'/.test(src),
    'le serveur seul décide du statut');

  section('4. Chaque fonction de l’API a un écran qui l’appelle');
  /* Ce contrôle ferme la porte pour de bon : toute fonction ajoutée au
     client d'API sans écran correspondant fera échouer la série. C'est ce
     qui a manqué pour la transmission, et ce qui manquait encore pour le
     journal d'accès, les listes du secrétariat et les comptages. */
  const clientSrc = fs.readFileSync(path.join(SITE, 'commun', 'api-client.js'), 'utf8');
  /* On isole le bloc « return { … } » final, puis on relève chaque paire
     « nom: nom ». La première version de ce contrôle cherchait un motif
     avec une indentation fixe et n'attrapait que dix noms sur vingt-quatre :
     il déclarait « aucune orpheline » en n'ayant presque rien regardé.
     Un contrôle qui passe sans vérifier est plus nuisible qu'un contrôle
     absent, puisqu'il rassure. */
  const bloc = clientSrc.slice(clientSrc.lastIndexOf('return {'));
  const exposees = [...bloc.matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:\s*\1\b/g)]
    .map((m) => m[1]);
  /* Fonctions de service, appelées par le client lui-même ou par tous les
     écrans : elles n'ont pas d'écran propre. */
  const service = ['moi', 'charger', 'dossiers', 'dossier', 'compte', 'estCharge',
                   'exigerSession', 'ErreurAPI', 'deconnexion'];
  let sansEcran = [];
  const toutLeSite = Object.keys(ecrans)
    .map((f) => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n');
  for (const f of exposees) {
    if (service.includes(f)) continue;
    if (!toutLeSite.includes('API.' + f + '(')) sansEcran.push(f);
  }
  ok('aucune fonction du client d’API n’est orpheline', sansEcran.length === 0,
    'sans écran : ' + sansEcran.join(', '));
  ok('la liste des fonctions exposées a bien été lue', exposees.length >= 20,
    exposees.length + ' fonctions trouvées — le contrôle ne vaut que s’il les voit toutes');
  ok('elle comprend les fonctions ajoutées le plus récemment',
    ['saisirResultats', 'listerPatients', 'journalDuDossier', 'statistiques', 'poserMarque']
      .every((f) => exposees.includes(f)),
    'manquantes : ' + ['saisirResultats', 'listerPatients', 'journalDuDossier',
      'statistiques', 'poserMarque'].filter((f) => !exposees.includes(f)).join(', '));

  section('5. Le parcours complet, de bout en bout');
  const pat = nav();
  await pat('POST', '/api/inscription', { courriel: 'claire@test.fr',
    motDePasse: 'un-mot-de-passe-long', nom: 'Martin', prenom: 'Claire' , consentement: true});
  await pat('POST', '/api/connexion', { courriel: 'claire@test.fr', motDePasse: 'un-mot-de-passe-long' });
  let r = await pat('POST', '/api/dossiers');
  const id = r.corps.dossierId;
  await pat('PUT', `/api/dossiers/${id}/reponses`,
    { reponses: [{ module: 'socle', questionId: 'q1', valeur: 'oui' }] });

  const sec = nav(); await soignant(sec, 's@test.fr');
  const fiche = await db.une(`SELECT id FROM patient WHERE nom='Martin'`);
  await sec('POST', `/api/patients/${fiche.id}/rattacher`);

  const med = nav(); await soignant(med, 'm@test.fr');
  r = await med('POST', `/api/dossiers/${id}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'avis sur brouillon' });
  ok('sans transmission, le médecin ne peut PAS rendre d’avis', r.statut === 403,
    'statut ' + r.statut);

  r = await pat('POST', `/api/dossiers/${id}/transmettre`);
  ok('le patient transmet', r.statut === 200);
  const enBase = await db.une(`SELECT statut FROM dossier WHERE id=$1`, [id]);
  ok('et la base porte bien « transmis »', enBase.statut === 'transmis', enBase.statut);

  r = await med('POST', `/api/dossiers/${id}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'À revoir dans six mois.' });
  ok('après transmission, l’avis est accepté', r.statut === 200, JSON.stringify(r.corps));

  r = await pat('GET', `/api/dossiers/${id}`);
  ok('le patient relit l’avis du médecin', r.corps.avis && r.corps.avis.length === 1);
  ok('la boucle est fermée : questionnaire → transmission → avis → lecture',
    enBase.statut === 'transmis' && r.corps.avis.length === 1);

  console.log('\n' + '─'.repeat(62));
  console.log(echoues ? `\x1b[31m${echoues} échec(s) sur ${reussis + echoues}.\x1b[0m`
                      : `\x1b[32m${reussis} contrôles, aucun échec.\x1b[0m`);
  echecs.forEach((e) => console.log('  - ' + e));
  serveur.close(); await db.fermer();
  process.exit(echoues ? 1 : 0);
}
principal().catch((e) => { console.error(e); process.exit(1); });
