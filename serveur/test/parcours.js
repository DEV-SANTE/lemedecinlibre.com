/* =====================================================================
   TEST DE BOUT EN BOUT
   Le serveur sert-il le site ET l'API sur le même domaine, et le parcours
   complet fonctionne-t-il ? On vérifie aussi ce qui ne doit PAS sortir.
   ===================================================================== */
'use strict';
const path = require('node:path');
const db = require('../src/db');
const mdp = require('../src/mdp');
const totp = require('../src/totp');
const SECRET_TEST = totp.nouveauSecret();

/* Les soignants passent un second facteur : c'est le parcours réel, donc
   c'est celui que ce test doit suivre. */
async function connexionSoignant(nav, courriel, motDePasse) {
  const r = await nav('POST', '/api/connexion', { courriel, motDePasse });
  if (r.statut !== 200) return r;
  await db.requete(`UPDATE compte SET totp_dernier_pas = NULL WHERE lower(courriel) = lower($1)`,
    [courriel]);
  const v = await nav('POST', '/api/totp/verifier',
    { code: totp.codePour(SECRET_TEST, totp.pasCourant()) });
  return v.statut === 200 ? r : v;
}
const { creerServeur } = require('../src/serveur');

const SITE = path.join(__dirname, '..', '..', 'prevention-sante');
let base, reussis = 0, echoues = 0;
const echecs = [];
function ok(nom, cond, detail) {
  if (cond) { reussis++; console.log('  \x1b[32mok\x1b[0m   ' + nom); }
  else { echoues++; echecs.push(nom); console.log('  \x1b[31mÉCHEC\x1b[0m ' + nom
    + (detail ? '\n         → ' + detail : '')); }
}
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

/* Un « navigateur » minimal : il garde le cookie, comme un vrai. */
function navigateur() {
  let cookie = null;
  return async function (methode, chemin, corps) {
    const o = { method: methode, headers: {}, redirect: 'manual' };
    if (cookie) o.headers.Cookie = cookie;
    if (corps !== undefined) {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(corps);
    }
    const r = await fetch(base + chemin, o);
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    if (sc.length) cookie = sc[0].split(';')[0];
    const brut = await r.text();
    let json = null;
    try { json = JSON.parse(brut); } catch (e) {}
    return { statut: r.status, entetes: r.headers, texte: brut, corps: json };
  };
}

async function principal() {
  await db.ouvrir({}); await db.creerSchema();
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1,'Centre pilote')`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(
    `INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps) VALUES
      ('medecin.a@test.fr',    $1,'medecin',   1,'Dr A','10000000001'),
      ('secretaire.a@test.fr', $1,'secretaire',1,'Secrétaire A',NULL)`, [h]);
  await db.requete(`UPDATE compte SET totp_secret = $1, totp_actif = TRUE
                     WHERE role IN ('medecin','secretaire')`, [SECRET_TEST]);

  const serveur = creerServeur({ securise: false, site: SITE });
  await new Promise((r) => serveur.listen(0, r));
  base = 'http://127.0.0.1:' + serveur.address().port;

  const nav = navigateur();

  section('1. Le site est servi par le même serveur que l’API');
  let r = await nav('GET', '/connexion/');
  ok('la page de connexion répond', r.statut === 200, 'statut ' + r.statut);
  ok('c’est bien du HTML', (r.entetes.get('content-type') || '').includes('text/html'));
  ok('elle contient le formulaire de connexion', r.texte.includes('id="f-connexion"'));
  ok('elle charge le client d’API', r.texte.includes('api-client.js'));
  ok('elle est marquée non indexable', r.texte.includes('noindex'));
  for (const p of ['/', '/espace/', '/suivi/', '/plateforme/', '/entreprise/', '/pilotage/', '/contenus/']) {
    const x = await nav('GET', p);
    ok('page servie : ' + p, x.statut === 200, 'statut ' + x.statut);
  }
  r = await nav('GET', '/commun/api-client.js');
  ok('le client d’API est servi', r.statut === 200 && r.texte.includes('exigerSession'));

  section('2. Ce qui ne doit pas sortir ne sort pas');
  r = await nav('GET', '/plateforme/verifier.js');
  ok('l’outil de contrôle interne est refusé', r.statut === 404, 'statut ' + r.statut);
  r = await nav('GET', '/README.md');
  ok('les notes internes sont refusées', r.statut === 404, 'statut ' + r.statut);
  r = await nav('GET', '/../../etc/passwd');
  ok('la remontée dans le système de fichiers est bloquée',
    r.statut === 403 || r.statut === 404, 'statut ' + r.statut);
  r = await nav('GET', '/api/dossiers');
  ok('l’API refuse sans session', r.statut === 401);

  section('3. Parcours du patient, du navigateur à la base');
  r = await nav('POST', '/api/inscription', { courriel: 'claire@test.fr',
    motDePasse: 'un-mot-de-passe-long', nom: 'Martin', prenom: 'Claire', naissance: '1980-04-12' , consentement: true});
  ok('inscription depuis la page', r.statut === 200, JSON.stringify(r.corps));
  r = await nav('POST', '/api/connexion', { courriel: 'claire@test.fr', motDePasse: 'un-mot-de-passe-long' });
  ok('connexion', r.statut === 200 && r.corps.role === 'patient');
  const cookieRecu = r.entetes.getSetCookie ? r.entetes.getSetCookie()[0] : '';
  ok('le cookie de session est httpOnly', /HttpOnly/i.test(cookieRecu), cookieRecu);
  ok('le cookie est SameSite=Strict', /SameSite=Strict/i.test(cookieRecu));

  r = await nav('POST', '/api/dossiers');
  const dossier = r.corps.dossierId;
  ok('le dossier est créé', r.statut === 200 && !!dossier);
  r = await nav('PUT', `/api/dossiers/${dossier}/reponses`, { reponses: [
    { module: 'socle', questionId: 'socle_age', valeur: '46' },
    { module: 'socle', questionId: 'socle_taille', valeur: '178' },
    { module: 'cardio', questionId: 'cardio_famille', valeur: 'oui' }] });
  ok('trois réponses enregistrées', r.corps.enregistrees === 3, JSON.stringify(r.corps));

  const enBase = await db.requete(`SELECT question_id, valeur FROM reponse WHERE dossier_id = $1
                                   ORDER BY question_id`, [dossier]);
  ok('les réponses sont bien EN BASE, pas dans le navigateur', enBase.rows.length === 3,
    JSON.stringify(enBase.rows));
  ok('et on retrouve la valeur exacte',
    enBase.rows.some((x) => x.question_id === 'cardio_famille' && x.valeur === 'oui'));

  r = await nav('POST', `/api/dossiers/${dossier}/transmettre`);
  ok('le patient transmet', r.statut === 200);

  section('4. Le médecin le voit vraiment');
  const navMed = navigateur();
  r = await connexionSoignant(navMed, 'medecin.a@test.fr', 'mot-de-passe-de-test');
  ok('le médecin se connecte et franchit le second facteur',
    r.statut === 200 && r.corps.role === 'medecin', JSON.stringify(r.corps));
  r = await navMed('GET', `/api/dossiers/${dossier}`);
  ok('mais ne voit pas un patient non rattaché', r.statut === 403);

  const navSec = navigateur();
  await connexionSoignant(navSec, 'secretaire.a@test.fr', 'mot-de-passe-de-test');
  const fiche = await db.une(`SELECT id FROM patient WHERE nom = 'Martin'`);
  r = await navSec('POST', `/api/patients/${fiche.id}/rattacher`);
  ok('la secrétaire rattache le patient', r.statut === 200, JSON.stringify(r.corps));

  r = await navMed('GET', `/api/dossiers/${dossier}`);
  ok('le médecin voit alors le dossier', r.statut === 200);
  ok('avec les trois réponses du patient', r.corps.reponses && r.corps.reponses.length === 3);
  r = await navMed('POST', `/api/dossiers/${dossier}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'Antécédent familial à préciser en consultation.' });
  ok('le médecin signe un avis', r.statut === 200 && r.corps.auteur === 'Dr A');

  section('5. Le patient relit, et sait qui a ouvert son dossier');
  r = await nav('GET', `/api/dossiers/${dossier}`);
  ok('le patient voit l’avis du médecin', r.corps.avis && r.corps.avis.length === 1);
  ok('l’avis porte le nom du médecin', r.corps.avis[0].auteur === 'Dr A');
  ok('et son RPPS', r.corps.avis[0].rpps === '10000000001');
  r = await nav('GET', `/api/dossiers/${dossier}/journal`);
  ok('le journal des accès est consultable par le patient', r.statut === 200);
  ok('et il nomme le médecin qui a consulté', JSON.stringify(r.corps.acces).includes('Dr A'));

  section('6. Rien de santé ne reste dans le navigateur');
  const client = require('node:fs').readFileSync(
    path.join(SITE, 'commun', 'api-client.js'), 'utf8');
  ok('le client d’API n’écrit aucune donnée dans localStorage',
    !/localStorage\s*\.\s*setItem/.test(client));
  ok('il n’y a aucune réponse en clair dans le cookie', !/socle_age/.test(cookieRecu));

  console.log('\n' + '─'.repeat(62));
  if (!echoues) {
    console.log(`\x1b[32m${reussis} contrôles, aucun échec.\x1b[0m`);
    console.log('Le parcours fonctionne du navigateur à la base de données.');
  } else {
    console.log(`\x1b[31m${echoues} échec(s) sur ${reussis + echoues}.\x1b[0m`);
    echecs.forEach((e) => console.log('  - ' + e));
  }
  serveur.close(); await db.fermer();
  process.exit(echoues ? 1 : 0);
}
principal().catch((e) => { console.error(e); process.exit(1); });
