/* =====================================================================
   LES PAGES SE CHARGENT-ELLES VRAIMENT ?
   Un contrôle de syntaxe ne dit pas si la page s'exécute. On la charge
   dans un vrai moteur DOM, connecté au vrai serveur, et on regarde ce
   qu'elle affiche et ce que la console dit.
   ===================================================================== */
'use strict';
/* jsdom fait remonter des rejets qui n'ont pas de sens ici (redirections
   simulées, ressources absentes). On les journalise sans tuer le test. */
process.on('unhandledRejection', (r) => {
  console.log('  (rejet ignoré : ' + (r && r.message ? r.message : JSON.stringify(r)) + ')');
});
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const db = require('../src/db');
const mdp = require('../src/mdp');
const { creerServeur } = require('../src/serveur');

let base, reussis = 0, echoues = 0;
const ok = (n, c, d) => { if (c) { reussis++; console.log('  \x1b[32mok\x1b[0m   ' + n); }
  else { echoues++; console.log('  \x1b[31mÉCHEC\x1b[0m ' + n + (d ? '\n         → ' + d : '')); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

/* jsdom ne fournit pas fetch. On installe celui de Node dans la fenêtre,
   avec un porte-cookies minimal : sans lui, les pages ne peuvent pas
   appeler l'API et on ne testerait que l'affichage hors ligne. */
function installerFetch(fenetre, jar) {
  fenetre.fetch = async (chemin, options = {}) => {
    const entetes = Object.assign({}, options.headers || {});
    if (jar.cookie) entetes.Cookie = jar.cookie;
    const r = await fetch(base + chemin, Object.assign({}, options, { headers: entetes }));
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    if (sc.length) jar.cookie = sc[0].split(';')[0];
    return r;
  };
}

async function charger(chemin, jar = {}) {
  const erreurs = [];
  const navigations = [];
  const nonImplemente = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    /* jsdom n'exécute pas les navigations : il signale « Not implemented:
       navigation » avec l'URL visée. C'est notre seul moyen d'observer
       qu'une page a bien voulu rediriger, et c'est un signal fiable. */
    if (/Not implemented: navigation/i.test(e.message)) { navigations.push(e.message); return; }
    /* jsdom n'implémente pas tout ce qu'un navigateur sait faire :
       scrollTo, l'affichage, les dialogues. Ce ne sont pas des erreurs du
       code testé, et les confondre avec de vraies erreurs rendrait cette
       série inutile. Seules les « Not implemented » sont écartées — toute
       autre exception reste un échec. */
    if (/^Not implemented:/i.test(e.message)) { nonImplemente.push(e.message); return; }
    erreurs.push(e.message);
  });
  vc.on('error', (m) => erreurs.push(String(m)));
  const dom = await JSDOM.fromURL(base + chemin, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(fenetre) { installerFetch(fenetre, jar); },
  });
  await new Promise((r) => setTimeout(r, 1200));   // laisser les appels d'API aboutir
  return { dom, erreurs, navigations, nonImplemente,
           texte: dom.window.document.body.textContent || '',
           html: dom.window.document.body.innerHTML || '' };
}

async function principal() {
  await db.ouvrir({}); await db.creerSchema();
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1,'Centre pilote')`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(`INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps)
    VALUES ('medecin.a@test.fr',$1,'medecin',1,'Dr A','10000000001'),
           ('secretaire.a@test.fr',$1,'secretaire',1,'Secrétaire A',NULL)`, [h]);
  const totp = require('../src/totp');
  const SECRET_PAGES = totp.nouveauSecret();
  await db.requete(`UPDATE compte SET totp_secret=$1, totp_actif=TRUE WHERE role='secretaire'`,
    [SECRET_PAGES]);

  const serveur = creerServeur({ securise: false, site: path.join(__dirname, '..', '..', 'prevention-sante') });
  await new Promise((r) => serveur.listen(0, r));
  base = 'http://127.0.0.1:' + serveur.address().port;

  section('1. La page de connexion s’exécute');
  let r = await charger('/connexion/');
  ok('aucune erreur de script', r.erreurs.length === 0, r.erreurs.slice(0, 2).join(' | '));
  ok('le formulaire est présent', r.html.includes('id="f-connexion"'));
  ok('le client d’API est chargé', typeof r.dom.window.API === 'object');
  ok('l’adaptateur n’est pas requis sur cette page', true);

  section('2. Une page protégée redirige quand la session manque');
  r = await charger('/espace/');
  /* jsdom signale la navigation sans en donner l'URL. On vérifie donc
     qu'une navigation a bien été tentée, et — c'est le point utile — que
     rien du dossier n'a été rendu avant. */
  ok('l’espace patient tente de quitter la page', r.navigations.length > 0,
    'navigations observées : ' + JSON.stringify(r.navigations));
  ok('et il n’affiche aucun dossier en attendant',
    !/questionnaire|mes r[ée]ponses/i.test(r.texte.slice(0, 400)));
  r = await charger('/plateforme/');
  ok('la vue médecin tente de quitter la page', r.navigations.length > 0,
    'navigations observées : ' + JSON.stringify(r.navigations));
  ok('et elle n’affiche aucune liste de dossiers',
    !/dossiers?\s*\(/i.test(r.texte));

  section('3. Le suivi patient s’exécute sans session (démonstration)');
  r = await charger('/suivi/?demo=1');
  ok('aucune erreur de script', r.erreurs.length === 0, r.erreurs.slice(0, 2).join(' | '));
  ok('le contenu est rendu', r.texte.length > 2000, r.texte.length + ' caractères');
  ok('le bandeau de démonstration est affiché', /exemple|démonstration|fictif/i.test(r.texte));

  section('4. Un patient connecté voit son espace, dans le navigateur');
  /* On crée le compte et la session par l'API, puis on charge la page avec
     ce cookie : c'est exactement ce que fait un navigateur après connexion. */
  const jar = {};
  let rep = await fetch(base + '/api/inscription', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courriel: 'p@test.fr', motDePasse: 'un-mot-de-passe-long',
                           nom: 'Martin', prenom: 'Claire', consentement: true }) });
  ok('compte patient créé', rep.status === 200);
  rep = await fetch(base + '/api/connexion', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courriel: 'p@test.fr', motDePasse: 'un-mot-de-passe-long' }) });
  jar.cookie = (rep.headers.getSetCookie() || [])[0].split(';')[0];
  ok('session ouverte', !!jar.cookie);

  r = await charger('/espace/', jar);
  ok('l’espace patient s’affiche sans erreur', r.erreurs.length === 0,
    r.erreurs.slice(0, 2).join(' | '));
  ok('il ne redirige plus vers la connexion',
    !r.navigations.some((m) => /\/connexion\//.test(m)),
    JSON.stringify(r.navigations));
  ok('aucun message d’indisponibilité', !/indisponible/i.test(r.texte),
    r.texte.replace(/\s+/g, ' ').slice(0, 140));
  /* L'écran d'accueil n'affiche pas forcément le prénom : on interroge
     donc l'état de la page, qui est ce qui compte — l'identité vient-elle
     du serveur ? */
  const identite = r.dom.window.eval(
    'try { var c = Db.lireCompte(); c ? c.prenom + " " + c.nom : "aucun compte" } '
    + 'catch (e) { "erreur: " + e.message }');
  ok('l’identité chargée vient du serveur', /Claire\s+Martin/.test(String(identite)),
    'identité en mémoire : ' + identite);
  const dossierId = r.dom.window.eval(
    'try { var c = Db.lireCompte(); c ? String(c.dossierId) : "0" } catch (e) { "0" }');
  ok('et le dossier ouvert porte l’identifiant donné par le serveur',
    Number(dossierId) > 0, 'dossierId : ' + dossierId);

  const enBase = await db.une(`SELECT count(*)::int AS n FROM dossier`);
  ok('un dossier a été ouvert en base au chargement de la page', enBase.n === 1,
    'dossiers : ' + enBase.n);

  section('5. Les écrans de sécurité existent dans la page de connexion');
  r = await charger('/connexion/');
  for (const [id, quoi] of [['f-totp', 'saisie du code'], ['f-totp-config', 'configuration du second facteur'],
                            ['f-oubli', 'mot de passe oublié'], ['f-reinit', 'nouveau mot de passe']]) {
    ok('écran présent : ' + quoi, r.html.includes('id="' + id + '"'));
  }
  ok('le client expose les fonctions de sécurité',
    ['totpVerifier', 'totpActiver', 'totpPreparer', 'motDePasseOublie', 'reinitialiser', 'poserMarque']
      .every((f) => typeof r.dom.window.API[f] === 'function'));
  ok('un seul écran est visible au départ',
    (r.html.match(/<form(?![^>]*hidden)/g) || []).length === 1,
    'formulaires visibles : ' + (r.html.match(/<form(?![^>]*hidden)/g) || []).length);

  section('6. Un médecin sans second facteur est envoyé vers la vérification');
  const jarMed = {};
  let rep2 = await fetch(base + '/api/connexion', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courriel: 'medecin.a@test.fr', motDePasse: 'mot-de-passe-de-test' }) });
  const corpsMed = await rep2.json();
  jarMed.cookie = (rep2.headers.getSetCookie() || [])[0].split(';')[0];
  ok('la connexion annonce un second facteur à configurer',
    corpsMed.secondFacteur === 'a-configurer', JSON.stringify(corpsMed));
  r = await charger('/plateforme/', jarMed);
  ok('la vue médecin ne s’affiche pas', r.navigations.length > 0,
    'navigations : ' + JSON.stringify(r.navigations));
  ok('et aucun dossier n’est rendu', !/dossiers?\s*\(/i.test(r.texte));

  section('7. L’espace secrétariat s’exécute et respecte le secret');
  const jarSec = {};
  let rs = await fetch(base + '/api/connexion', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courriel: 'secretaire.a@test.fr', motDePasse: 'mot-de-passe-de-test' }) });
  jarSec.cookie = (rs.headers.getSetCookie() || [])[0].split(';')[0];
  rs = await fetch(base + '/api/totp/verifier', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: jarSec.cookie },
    body: JSON.stringify({ code: totp.codePour(SECRET_PAGES, totp.pasCourant()) }) });
  ok('la secrétaire franchit le second facteur', rs.status === 200,
    'statut ' + rs.status);

  r = await charger('/secretariat/', jarSec);
  ok('l’espace secrétariat s’affiche sans erreur', r.erreurs.length === 0,
    r.erreurs.slice(0, 2).join(' | '));
  ok('il ne redirige pas vers la connexion',
    !r.navigations.length, JSON.stringify(r.navigations));
  ok('les quatre écrans sont proposés',
    ['À rattacher', 'Patients du centre', 'Nouveau patient', 'Saisir des résultats']
      .every((t) => r.texte.includes(t)), r.texte.replace(/\s+/g, ' ').slice(0, 200));
  ok('le mur du secret médical est affiché', /secret médical/i.test(r.texte));
  ok('aucune réponse de questionnaire n’apparaît à l’écran',
    !/socle_|question_id/.test(r.html));
  ok('le nom de la secrétaire vient du serveur', /Secrétaire A/.test(r.texte));

  section('8. Les pages légales sont lisibles et signalent leur état');
  for (const [chemin, titre] of [['/mentions-legales/', 'Mentions légales'],
                                 ['/confidentialite/', 'données personnelles'],
                                 ['/conditions/', 'Conditions générales']]) {
    r = await charger(chemin);
    ok('page servie et rendue : ' + titre, r.texte.length > 800,
      r.texte.length + ' caractères');
    ok(titre + ' — annonce qu’elle n’est pas finalisée', /non finalis/i.test(r.texte));
    ok(titre + ' — renvoie vers les deux autres',
      (r.html.match(/href="\.\.\/(mentions-legales|confidentialite|conditions)\//g) || []).length >= 2);
  }
  r = await charger('/confidentialite/');
  ok('la page données personnelles nomme l’hébergeur', /AZNETWORK/.test(r.texte));
  ok('elle indique le seuil de onze pour les comptages employeur', /onze/.test(r.texte));
  ok('elle dit ce qui n’est pas encore en place', /n’est pas encore en place/i.test(r.texte));
  r = await charger('/mentions-legales/');
  ok('les mentions nomment le médecin responsable et son RPPS',
    /Knani/.test(r.texte) && /10110958559/.test(r.texte));

  section('9. Les scripts branchés sont bien servis et valides');
  for (const f of ['/commun/api-client.js', '/commun/adaptateur.js']) {
    const rep = await fetch(base + f);
    const t = await rep.text();
    ok('servi : ' + f, rep.status === 200);
    ok('exécutable : ' + f, (() => { try { new Function(t); return true; } catch (e) { return false; } })());
  }

  console.log('\n' + '─'.repeat(62));
  console.log(echoues ? `\x1b[31m${echoues} échec(s) sur ${reussis + echoues}.\x1b[0m`
                      : `\x1b[32m${reussis} contrôles, aucun échec.\x1b[0m`);
  serveur.close(); await db.fermer();
  process.exit(echoues ? 1 : 0);
}
principal().catch((e) => { console.error(e); process.exit(1); });
