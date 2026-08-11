/* =====================================================================
   TESTS — LE CLOISONNEMENT DOIT ÊTRE PROUVÉ, PAS AFFIRMÉ
   ---------------------------------------------------------------------
   Ces tests ne vérifient pas que l'application « marche ». Ils vérifient
   qu'elle REFUSE ce qu'elle doit refuser. Un test qui échoue ici est un
   accès indu à des données de santé, pas un défaut d'affichage.

   Chaque test part d'une base neuve et passe par le vrai serveur HTTP.
   ===================================================================== */
'use strict';
const http = require('node:http');
const db = require('../src/db');
const { creerServeur } = require('../src/serveur');
const mdp = require('../src/mdp');
const totp = require('../src/totp');

/* Secret de test, connu, pour pouvoir calculer un code valable. En
   production chaque compte a le sien, généré aléatoirement. */
const SECRET_TEST = totp.nouveauSecret();

/* Un soignant se connecte en deux temps : mot de passe, puis code. Ce
   helper existe parce que TOUS les tests de rôle soignant doivent
   franchir le second facteur — c'est justement ce qu'on veut vérifier. */
async function connexionSoignant(appel, courriel, motDePasse) {
  const r1 = await appel('POST', '/api/connexion', { courriel, motDePasse });
  if (r1.statut !== 200) return r1;
  const code = totp.codePour(SECRET_TEST, totp.pasCourant());
  const r2 = await appel('POST', '/api/totp/verifier', { code });
  return r2.statut === 200 ? r1 : r2;
}

let serveur, port, reussis = 0, echoues = 0;
const echecs = [];

function verifier(nom, condition, detail) {
  if (condition) { reussis++; console.log('  \x1b[32mok\x1b[0m   ' + nom); }
  else { echoues++; echecs.push({ nom, detail }); console.log('  \x1b[31mÉCHEC\x1b[0m ' + nom
        + (detail ? '\n         → ' + detail : '')); }
}
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

/* Client HTTP minimal qui conserve le cookie de session, comme un navigateur. */
function client() {
  let cookie = null;
  return async function appel(methode, chemin, corps) {
    return new Promise((resolve, reject) => {
      const donnees = corps ? JSON.stringify(corps) : null;
      const req = http.request({ host: '127.0.0.1', port, path: chemin, method: methode,
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}),
                   ...(donnees ? { 'Content-Length': Buffer.byteLength(donnees) } : {}) } },
        (res) => {
          const sc = res.headers['set-cookie'];
          if (sc) cookie = sc[0].split(';')[0];
          let d = '';
          res.on('data', (c) => d += c);
          res.on('end', () => {
            let corpsRep = {};
            try { corpsRep = JSON.parse(d || '{}'); } catch (e) {}
            resolve({ statut: res.statusCode, corps: corpsRep });
          });
        });
      req.on('error', reject);
      if (donnees) req.write(donnees);
      req.end();
    });
  };
}

async function jeuDeDonnees() {
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1,'Centre A'), (2,'Centre B')`);
  await db.requete(`SELECT setval('centre_id_seq', 2)`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(
    `INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps) VALUES
      ('medecin.a@test.fr',    $1, 'medecin',    1, 'Dr A', '10000000001'),
      ('medecin.b@test.fr',    $1, 'medecin',    2, 'Dr B', '10000000002'),
      ('secretaire.a@test.fr', $1, 'secretaire', 1, 'Secrétaire A', NULL),
      ('drh.a@test.fr',        $1, 'employeur',  1, 'DRH A', NULL)`, [h]);
  /* Second facteur déjà en place pour les soignants : le parcours de
     configuration est testé à part, section 14. */
  await db.requete(
    `UPDATE compte SET totp_secret = $1, totp_actif = TRUE
      WHERE role IN ('medecin','secretaire')`, [SECRET_TEST]);
}

async function principal() {
  await db.ouvrir({});
  await db.creerSchema();
  await jeuDeDonnees();
  serveur = creerServeur({ securise: false });
  await new Promise((r) => serveur.listen(0, r));
  port = serveur.address().port;

  const MDP = 'mot-de-passe-de-test';

  /* ------------------------------------------------------------------ */
  section('1. Mots de passe');
  const unHash = mdp.hacher(MDP);
  verifier('le mot de passe n’est jamais stocké en clair', !unHash.includes(MDP));
  verifier('deux condensats du même mot de passe diffèrent (sel aléatoire)',
    mdp.hacher(MDP) !== mdp.hacher(MDP));
  verifier('un mot de passe de moins de douze caractères est refusé',
    (() => { try { mdp.hacher('court123'); return false; } catch (e) { return true; } })());
  const enBase = await db.une(`SELECT mdp_hash FROM compte WHERE courriel = 'medecin.a@test.fr'`);
  verifier('la base ne contient aucun mot de passe lisible', !enBase.mdp_hash.includes(MDP));

  /* ------------------------------------------------------------------ */
  section('2. Inscription et connexion');
  const patient1 = client();
  let r = await patient1('POST', '/api/inscription', { courriel: 'p1@test.fr', motDePasse: MDP,
    nom: 'Martin', prenom: 'Claire', naissance: '1980-04-12', sexe: 'F' , consentement: true});
  verifier('un patient peut s’inscrire librement', r.statut === 200, JSON.stringify(r.corps));
  verifier('à l’inscription libre, le patient n’est rattaché à aucun centre',
    r.corps.rattache === false);

  r = await patient1('POST', '/api/inscription', { courriel: 'P1@TEST.FR', motDePasse: MDP,
    nom: 'X', prenom: 'Y' , consentement: true});
  verifier('la même adresse ne peut pas servir deux fois, même casse différente',
    r.statut === 409, 'statut ' + r.statut);

  r = await patient1('POST', '/api/connexion', { courriel: 'p1@test.fr', motDePasse: 'mauvais-mot-de-passe' });
  verifier('un mauvais mot de passe est refusé', r.statut === 401);
  r = await patient1('POST', '/api/connexion', { courriel: 'inconnu@test.fr', motDePasse: MDP });
  verifier('un compte inexistant renvoie le même message qu’un mauvais mot de passe',
    r.statut === 401 && r.corps.erreur === 'identifiants incorrects');
  r = await patient1('POST', '/api/connexion', { courriel: 'p1@test.fr', motDePasse: MDP });
  verifier('la connexion réussit avec le bon mot de passe', r.statut === 200 && r.corps.role === 'patient');

  /* ------------------------------------------------------------------ */
  section('3. Sans session, rien n’est accessible');
  const anonyme = client();
  for (const [m, c] of [['GET', '/api/moi'], ['GET', '/api/dossiers'], ['GET', '/api/dossiers/1']]) {
    const x = await anonyme(m, c);
    verifier(`${m} ${c} refusé sans session`, x.statut === 401, 'statut ' + x.statut);
  }

  /* ------------------------------------------------------------------ */
  section('4. Le patient et son dossier');
  r = await patient1('POST', '/api/dossiers');
  const dossier1 = r.corps.dossierId;
  verifier('le patient ouvre son dossier', r.statut === 200 && !!dossier1);
  r = await patient1('PUT', `/api/dossiers/${dossier1}/reponses`, { reponses: [
    { module: 'socle', questionId: 'socle_1', valeur: 'oui' },
    { module: 'socle', questionId: 'socle_2', valeur: '72' },
    { module: 'cardio', questionId: 'cardio_3', valeur: 'non' }] });
  verifier('le patient enregistre ses réponses', r.statut === 200 && r.corps.enregistrees === 3,
    JSON.stringify(r.corps));
  r = await patient1('GET', `/api/dossiers/${dossier1}`);
  verifier('le patient relit ses réponses', r.statut === 200 && r.corps.reponses.length === 3);

  r = await patient1('PUT', `/api/dossiers/${dossier1}/reponses`, {
    reponses: [{ module: 'socle', questionId: 'socle_1', valeur: 'non' }] });
  const hist = await db.une(
    `SELECT ancienne_valeur FROM reponse_historique WHERE dossier_id = $1 AND question_id = 'socle_1'`,
    [dossier1]);
  verifier('une réponse corrigée conserve son ancienne valeur en historique',
    hist && hist.ancienne_valeur === 'oui');

  /* ------------------------------------------------------------------ */
  section('5. Un patient ne voit pas le dossier d’un autre');
  const patient2 = client();
  await patient2('POST', '/api/inscription', { courriel: 'p2@test.fr', motDePasse: MDP,
    nom: 'Durand', prenom: 'Paul' , consentement: true});
  await patient2('POST', '/api/connexion', { courriel: 'p2@test.fr', motDePasse: MDP });
  r = await patient2('GET', `/api/dossiers/${dossier1}`);
  verifier('le dossier d’un autre patient est refusé', r.statut === 403, 'statut ' + r.statut);
  r = await patient2('PUT', `/api/dossiers/${dossier1}/reponses`,
    { reponses: [{ module: 'socle', questionId: 'socle_1', valeur: 'piraté' }] });
  verifier('écrire dans le dossier d’un autre est refusé', r.statut === 403);
  const inchange = await db.une(
    `SELECT valeur FROM reponse WHERE dossier_id = $1 AND question_id = 'socle_1'`, [dossier1]);
  verifier('et la réponse n’a effectivement pas été modifiée', inchange.valeur === 'non');

  /* ------------------------------------------------------------------ */
  section('6. Le médecin, son centre et pas les autres');
  const medecinA = client(), medecinB = client();
  await connexionSoignant(medecinA, 'medecin.a@test.fr', MDP);
  await connexionSoignant(medecinB, 'medecin.b@test.fr', MDP);
  r = await medecinA('GET', `/api/dossiers/${dossier1}`);
  verifier('un patient non rattaché n’est visible d’aucun médecin', r.statut === 403,
    'statut ' + r.statut);

  const secretaireA = client();
  await connexionSoignant(secretaireA, 'secretaire.a@test.fr', MDP);
  const fiche = await db.une(`SELECT id FROM patient WHERE nom = 'Martin'`);
  r = await secretaireA('POST', `/api/patients/${fiche.id}/rattacher`);
  verifier('la secrétaire rattache le patient à son centre', r.statut === 200);

  r = await medecinA('GET', `/api/dossiers/${dossier1}`);
  verifier('le médecin du centre voit alors le dossier et les réponses',
    r.statut === 200 && Array.isArray(r.corps.reponses));
  r = await medecinB('GET', `/api/dossiers/${dossier1}`);
  verifier('le médecin d’un AUTRE centre est refusé', r.statut === 403, 'statut ' + r.statut);

  /* ------------------------------------------------------------------ */
  section('7. La secrétaire et le secret médical');
  r = await secretaireA('GET', `/api/dossiers/${dossier1}`);
  verifier('la secrétaire voit que le dossier existe', r.statut === 200);
  verifier('mais ne reçoit AUCUNE réponse', r.corps.reponses === undefined,
    'reponses présentes : ' + JSON.stringify(r.corps.reponses));
  verifier('ni AUCUN avis', r.corps.avis === undefined);
  verifier('et le motif du refus est explicite', typeof r.corps.motif === 'string');
  verifier('elle voit en revanche l’identité administrative', !!r.corps.patient.nom);
  r = await secretaireA('POST', `/api/dossiers/${dossier1}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'tentative' });
  verifier('la secrétaire ne peut pas écrire d’avis', r.statut === 403);
  r = await secretaireA('POST', `/api/dossiers/${dossier1}/marques`,
    { parametre: 'ferr', dateValeur: '2026-07-20', couleur: 'orange', commentaire: 'tentative' });
  verifier('ni poser une marque de couleur', r.statut === 403);

  /* --- La granularité introduite avec l'espace secrétariat : elle voit
         les résultats de laboratoire, qu'elle saisit elle-même, mais
         toujours pas les réponses ni les avis ni les marques. */
  r = await secretaireA('PUT', `/api/dossiers/${dossier1}/resultats`, { resultats: [
    { parametre: 'hb', dateValeur: '2026-07-20', valeur: '13.6', unite: 'g/dL' },
    { parametre: 'ferr', dateValeur: '2026-07-20', valeur: '24', unite: 'µg/L' }] });
  verifier('la secrétaire saisit des résultats de laboratoire', r.statut === 200
    && r.corps.enregistres === 2, JSON.stringify(r.corps));
  r = await secretaireA('GET', `/api/dossiers/${dossier1}`);
  verifier('et elle relit ces valeurs — écrire sans voir serait une fiction',
    Array.isArray(r.corps.resultats) && r.corps.resultats.length === 2,
    JSON.stringify(r.corps.resultats));
  verifier('mais toujours aucune réponse au questionnaire', r.corps.reponses === undefined);
  verifier('aucun avis', r.corps.avis === undefined);
  verifier('aucune marque du médecin', r.corps.marques === undefined);
  r = await patient2('GET', `/api/dossiers/${dossier1}`);
  verifier('un autre patient n’obtient toujours rien', r.statut === 403);

  section('7 bis. Les listes du secrétariat');
  r = await secretaireA('GET', '/api/patients');
  verifier('la secrétaire liste les patients de son centre', r.statut === 200
    && Array.isArray(r.corps.patients));
  const listeTexte = JSON.stringify(r.corps.patients);
  verifier('cette liste ne contient aucune réponse ni avis',
    !/socle_|question_id|texte|couleur/.test(listeTexte), listeTexte.slice(0, 120));
  verifier('elle contient l’état d’avancement du dossier',
    /dernier_statut/.test(listeTexte));
  r = await secretaireA('GET', '/api/patients/en-attente');
  verifier('elle voit les inscriptions en attente de rattachement', r.statut === 200);
  const drh2 = client();
  await drh2('POST', '/api/connexion', { courriel: 'drh.a@test.fr', motDePasse: MDP });
  r = await drh2('GET', '/api/patients');
  verifier('un employeur n’obtient aucune liste de patients', r.statut === 403);
  r = await drh2('GET', '/api/patients/en-attente');
  verifier('ni les inscriptions en attente', r.statut === 403);
  r = await patient1('GET', '/api/patients');
  verifier('un patient non plus', r.statut === 403);

  /* ------------------------------------------------------------------ */
  section('8. Les avis du médecin');
  r = await medecinA('POST', `/api/dossiers/${dossier1}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'sur un brouillon' });
  verifier('aucun avis ne peut être signé sur un dossier non transmis',
    r.statut === 403, 'statut ' + r.statut);
  r = await patient1('POST', `/api/dossiers/${dossier1}/transmettre`);
  verifier('le patient transmet son dossier', r.statut === 200, JSON.stringify(r.corps));
  r = await medecinA('POST', `/api/dossiers/${dossier1}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'À revoir dans six mois.' });
  verifier('le médecin signe un avis', r.statut === 200 && !!r.corps.avisId, JSON.stringify(r.corps));
  verifier('l’avis porte le nom de son auteur', r.corps.auteur === 'Dr A');
  verifier('et il est horodaté', !!r.corps.signeLe);
  r = await medecinA('POST', `/api/dossiers/${dossier1}/avis`,
    { domaine: 'cardio', statut: 'tout va bien', texte: 'statut inventé' });
  verifier('un statut d’avis hors des trois libellés est refusé', r.statut === 400,
    'statut ' + r.statut);
  r = await patient1('GET', `/api/dossiers/${dossier1}`);
  verifier('le patient lit l’avis écrit par le médecin',
    r.corps.avis && r.corps.avis.length === 1 && r.corps.avis[0].auteur === 'Dr A');

  /* ------------------------------------------------------------------ */
  section('9. L’employeur ne voit aucun nominatif');
  const drh = client();
  await drh('POST', '/api/connexion', { courriel: 'drh.a@test.fr', motDePasse: MDP });
  r = await drh('GET', '/api/dossiers');
  verifier('l’employeur n’accède à aucune liste de dossiers', r.statut === 403);
  r = await drh('GET', `/api/dossiers/${dossier1}`);
  verifier('ni à un dossier précis', r.statut === 403);
  r = await drh('GET', '/api/statistiques');
  verifier('il accède aux comptages', r.statut === 200);
  const texte = JSON.stringify(r.corps);
  verifier('et ces comptages ne contiennent aucun nom',
    !texte.includes('Martin') && !texte.includes('Claire') && !texte.includes('Durand'));
  verifier('sous le seuil, aucun comptage n’est renvoyé',
    r.corps.comptages === null, JSON.stringify(r.corps.comptages));
  verifier('le seuil annoncé par l’API est de onze', r.corps.seuilPublication === 11);

  /* Contrôle croisé : le seuil de la base et celui de la page doivent être
     le même nombre. Le masquage côté navigateur ne protège rien si le
     serveur a déjà transmis la valeur. */
  const fsSeuil = require('node:fs');
  const sqlSeuil = fsSeuil.readFileSync(__dirname + '/../schema.sql', 'utf8')
    .match(/HAVING count\(DISTINCT d\.id\) >= (\d+)/);
  const pageSeuil = fsSeuil.readFileSync(
    __dirname + '/../../prevention-sante/entreprise/entreprise.js', 'utf8')
    .match(/SEUIL_PUBLICATION\s*=\s*(\d+)/);
  verifier('le seuil de la base et celui de la page entreprise sont identiques',
    sqlSeuil && pageSeuil && sqlSeuil[1] === pageSeuil[1],
    'base : ' + (sqlSeuil && sqlSeuil[1]) + ' | page : ' + (pageSeuil && pageSeuil[1]));

  /* ------------------------------------------------------------------ */
  section('10. Journal des accès');
  const nb = await db.une(
    `SELECT count(*)::int AS n FROM journal_acces WHERE cible_type = 'dossier' AND cible_id = $1`,
    [dossier1]);
  verifier('les accès au dossier sont journalisés', nb.n > 0, 'lignes : ' + nb.n);
  const refuses = await db.une(
    `SELECT count(*)::int AS n FROM journal_acces WHERE autorise = FALSE`);
  verifier('les refus sont journalisés aussi', refuses.n > 0, 'lignes : ' + refuses.n);
  r = await patient1('GET', `/api/dossiers/${dossier1}/journal`);
  verifier('le patient peut savoir qui a ouvert son dossier',
    r.statut === 200 && r.corps.acces.length > 0);
  verifier('le journal nomme le médecin qui a consulté',
    JSON.stringify(r.corps.acces).includes('Dr A'));
  r = await medecinA('GET', `/api/dossiers/${dossier1}/journal`);
  verifier('un médecin ne consulte pas le journal d’un patient', r.statut === 403);
  const contenu = await db.requete(`SELECT * FROM journal_acces LIMIT 50`);
  const colonnes = Object.keys(contenu.rows[0]);
  verifier('le journal ne contient aucune colonne de donnée de santé',
    !colonnes.some((c) => ['valeur', 'texte', 'reponse', 'avis'].includes(c)),
    colonnes.join(', '));

  /* ------------------------------------------------------------------ */
  section('11. Dossier transmis, dossier figé');
  r = await patient1('PUT', `/api/dossiers/${dossier1}/reponses`,
    { reponses: [{ module: 'socle', questionId: 'socle_1', valeur: 'modif après envoi' }] });
  verifier('après transmission, le patient ne peut plus modifier ses réponses',
    r.statut === 403, 'statut ' + r.statut);

  /* ------------------------------------------------------------------ */
  section('12. Session révoquée');
  await patient1('POST', '/api/deconnexion');
  r = await patient1('GET', '/api/moi');
  verifier('après déconnexion, la session ne vaut plus rien', r.statut === 401);
  const s = await db.une(`SELECT id FROM session LIMIT 1`);
  if (s) {
    await db.requete(`UPDATE session SET expire_le = now() - interval '1 hour' WHERE id = $1`, [s.id]);
    const c2 = await require('../src/api').compteDeLaSession(s.id);
    verifier('une session expirée n’identifie plus personne', c2 === null);
  }

  /* ------------------------------------------------------------------ */
  section('13. Aucune interprétation côté serveur');
  const fs = require('node:fs');
  const sources = ['src/api.js', 'src/droits.js', 'src/journal.js', 'schema.sql']
    .map((f) => fs.readFileSync(__dirname + '/../' + f, 'utf8')).join('\n');
  const sansCommentaires = sources
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [nom, motif] of [
    ['aucun score calculé', /\bscore\s*=|calculerScore|totalScore/i],
    /* « seuilPublication » est explicitement admis : c'est un seuil
       d'effectif qui protège l'anonymat, pas une comparaison de valeur
       biologique. Toute autre forme de « seuil » reste interdite. */
    ['aucune comparaison à un seuil',
      /seuil(?!Publication)|threshold|> *NORMALE|anormal/i],
    ['aucun classement de risque', /risqueEleve|niveauDeRisque|gravite/i],
    ['aucune suggestion d’acte', /suggerer|recommander|proposerActe/i],
  ]) {
    verifier(nom, !motif.test(sansCommentaires));
  }

  /* ------------------------------------------------------------------ */
  section('14. Second facteur : un mot de passe volé ne suffit pas');
  const voleur = client();
  r = await voleur('POST', '/api/connexion', { courriel: 'medecin.a@test.fr', motDePasse: MDP });
  verifier('le mot de passe seul ouvre une session…', r.statut === 200);
  verifier('…mais la réponse annonce qu’un second facteur est attendu',
    r.corps.secondFacteur === 'attendu', JSON.stringify(r.corps));
  r = await voleur('GET', '/api/dossiers');
  verifier('et cette session n’accède à AUCUN dossier', r.statut === 403,
    'statut ' + r.statut + ' ' + JSON.stringify(r.corps));
  r = await voleur('GET', `/api/dossiers/${dossier1}`);
  verifier('ni à un dossier précis', r.statut === 403);
  r = await voleur('POST', `/api/dossiers/${dossier1}/avis`,
    { domaine: 'cardio', statut: 'a surveiller', texte: 'tentative' });
  verifier('ni n’écrit d’avis', r.statut === 403);
  r = await voleur('POST', '/api/totp/verifier', { code: '000000' });
  verifier('un code faux est refusé', r.statut === 401);
  /* Ce compte a déjà validé un code dans la même fenêtre de trente
     secondes (section 6). Le rejeu du même code est refusé, comme l'exige
     le RFC 6238 § 5.2 — et c'est un comportement voulu : un code
     intercepté ne doit pas pouvoir servir. On simule donc le passage à la
     fenêtre suivante en effaçant le dernier pas utilisé, plutôt que
     d'attendre trente secondes dans un test.

     Conséquence d'usage à connaître : un soignant qui se reconnecte dans
     la même minute doit attendre le code suivant. C'est le comportement
     de toutes les applications d'authentification. */
  const avantRejeu = totp.codePour(SECRET_TEST, totp.pasCourant());
  r = await voleur('POST', '/api/totp/verifier', { code: avantRejeu });
  verifier('un code déjà utilisé dans la même fenêtre est refusé (anti-rejeu)',
    r.statut === 401, 'statut ' + r.statut);

  await db.requete(
    `UPDATE compte SET totp_dernier_pas = NULL WHERE courriel = 'medecin.a@test.fr'`);
  r = await voleur('POST', '/api/totp/verifier',
    { code: totp.codePour(SECRET_TEST, totp.pasCourant()) });
  verifier('le bon code débloque la session', r.statut === 200 && r.corps.valide === true,
    JSON.stringify(r.corps));
  r = await voleur('POST', '/api/totp/verifier',
    { code: totp.codePour(SECRET_TEST, totp.pasCourant()) });
  verifier('et ce code ne peut pas resservir juste après', r.statut === 401);
  r = await voleur('GET', '/api/dossiers');
  verifier('et les dossiers deviennent accessibles', r.statut === 200);

  const patientSansTotp = client();
  await patientSansTotp('POST', '/api/inscription', { courriel: 'p3@test.fr',
    motDePasse: MDP, nom: 'Sans', prenom: 'Totp' , consentement: true});
  r = await patientSansTotp('POST', '/api/connexion', { courriel: 'p3@test.fr', motDePasse: MDP });
  verifier('un patient n’a pas de second facteur imposé',
    r.corps.secondFacteur === 'non-requis', JSON.stringify(r.corps));
  r = await patientSansTotp('GET', '/api/dossiers');
  verifier('et il accède directement à son espace', r.statut === 200);

  section('15. Limitation des tentatives');
  const brute = client();
  let bloque = false, essais = 0;
  for (let i = 0; i < 8; i++) {
    essais++;
    const x = await brute('POST', '/api/connexion',
      { courriel: 'cible@test.fr', motDePasse: 'mauvais-mot-de-passe-' + i });
    if (x.statut === 429) { bloque = true; break; }
  }
  verifier('l’acharnement sur un compte finit bloqué', bloque, essais + ' essais sans blocage');
  verifier('le blocage arrive au sixième essai au plus tard', essais <= 6, 'essais : ' + essais);
  r = await brute('POST', '/api/connexion',
    { courriel: 'cible@test.fr', motDePasse: 'mauvais' });
  verifier('le message indique une attente, sans dire si le compte existe',
    /Réessayez dans/.test(r.corps.erreur || '') && !/existe|inconnu/i.test(r.corps.erreur || ''),
    r.corps.erreur);
  const journalBloc = await db.une(
    `SELECT count(*)::int AS n FROM journal_acces WHERE action = 'connexion_bloquee'`);
  verifier('le blocage est journalisé', journalBloc.n > 0);
  const aucunMdp = await db.une(
    `SELECT count(*)::int AS n FROM tentative_connexion
      WHERE courriel LIKE '%mauvais%' OR ip LIKE '%mauvais%'`);
  verifier('aucun mot de passe essayé n’est conservé', aucunMdp.n === 0);

  section('16. Mot de passe oublié');
  const oubli = client();
  r = await oubli('POST', '/api/mot-de-passe/oublie', { courriel: 'p2@test.fr' });
  verifier('la demande aboutit', r.statut === 200 && r.corps.envoye === true);
  const lien = r.corps.lienDeveloppement;
  verifier('un lien est fourni en développement', !!lien);
  const r2 = await oubli('POST', '/api/mot-de-passe/oublie', { courriel: 'inconnu@nulle-part.fr' });
  verifier('une adresse inconnue reçoit la MÊME réponse',
    r2.statut === 200 && r2.corps.envoye === true && r2.corps.note === r.corps.note);
  const jetonEnBase = await db.une(
    `SELECT jeton_hash FROM jeton_reinitialisation ORDER BY id DESC LIMIT 1`);
  const brut = lien.split('reinit=')[1];
  verifier('le jeton n’est pas stocké en clair', jetonEnBase.jeton_hash !== brut);

  r = await oubli('POST', '/api/mot-de-passe/reinitialiser',
    { jeton: brut, nouveauMotDePasse: 'court' });
  verifier('un nouveau mot de passe trop court est refusé', r.statut === 400);
  r = await oubli('POST', '/api/mot-de-passe/reinitialiser',
    { jeton: brut, nouveauMotDePasse: 'un-nouveau-mot-de-passe' });
  verifier('la réinitialisation réussit', r.statut === 200 && r.corps.reinitialise === true,
    JSON.stringify(r.corps));
  verifier('et toutes les sessions du compte ont été fermées',
    r.corps.sessionsFermees >= 1, 'sessions fermées : ' + r.corps.sessionsFermees);
  r = await oubli('POST', '/api/mot-de-passe/reinitialiser',
    { jeton: brut, nouveauMotDePasse: 'encore-un-autre-mot-de-passe' });
  verifier('le même lien ne fonctionne pas deux fois', r.statut === 401);
  const neuf = client();
  r = await neuf('POST', '/api/connexion',
    { courriel: 'p2@test.fr', motDePasse: 'un-nouveau-mot-de-passe' });
  verifier('le nouveau mot de passe fonctionne', r.statut === 200);
  r = await neuf('POST', '/api/connexion', { courriel: 'p2@test.fr', motDePasse: MDP });
  verifier('l’ancien ne fonctionne plus', r.statut === 401);
  const expire = await db.une(
    `SELECT expire_le > now() + interval '55 minutes' AS ok FROM jeton_reinitialisation
      ORDER BY id DESC LIMIT 1`);
  verifier('un jeton dure une heure, pas davantage', expire.ok === true || expire.ok === 't');

  section('17. Codes de secours du second facteur');
  /* Un compte neuf qui active son second facteur doit repartir avec ses
     codes : c'est le moment où il en a besoin, pas plus tard sur demande. */
  const nouveauMed = client();
  const hh = mdp.hacher(MDP);
  await db.requete(
    `INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps)
     VALUES ('medecin.c@test.fr', $1, 'medecin', 1, 'Dr C', '10000000003')`, [hh]);
  r = await nouveauMed('POST', '/api/connexion',
    { courriel: 'medecin.c@test.fr', motDePasse: MDP });
  verifier('un médecin sans second facteur doit le configurer',
    r.corps.secondFacteur === 'a-configurer', JSON.stringify(r.corps));
  r = await nouveauMed('POST', '/api/totp/preparer');
  const secretC = r.corps.secret;
  verifier('la clé est remise une fois', !!secretC && r.corps.uri.includes('otpauth://'));
  r = await nouveauMed('POST', '/api/totp/activer',
    { code: totp.codePour(secretC, totp.pasCourant()) });
  verifier('l’activation réussit', r.statut === 200 && r.corps.actif === true);
  const codes = r.corps.codesSecours || [];
  verifier('huit codes de secours sont remis à l’activation', codes.length === 8,
    codes.length + ' code(s)');
  verifier('ils ne contiennent aucun caractère ambigu (0, O, 1, I, L)',
    codes.every((c) => !/[01OIL]/.test(c)), codes[0]);
  const enBaseCodes = await db.une(
    `SELECT code_hash FROM code_secours WHERE compte_id =
      (SELECT id FROM compte WHERE courriel = 'medecin.c@test.fr') LIMIT 1`);
  verifier('seul le condensat est stocké, jamais le code',
    !codes.some((c) => enBaseCodes.code_hash.includes(c.replace(/-/g, ''))));

  /* Le téléphone est perdu : le code de secours prend le relais. */
  const perdu = client();
  await perdu('POST', '/api/connexion', { courriel: 'medecin.c@test.fr', motDePasse: MDP });
  r = await perdu('GET', '/api/dossiers');
  verifier('sans second facteur, aucun accès', r.statut === 403);
  r = await perdu('POST', '/api/totp/verifier', { code: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ' });
  verifier('un faux code de secours est refusé', r.statut === 401);
  r = await perdu('POST', '/api/totp/verifier', { code: codes[0] });
  verifier('un vrai code de secours débloque la session',
    r.statut === 200 && r.corps.parCodeDeSecours === true, JSON.stringify(r.corps));
  verifier('il en reste sept', r.corps.codesRestants === 7, String(r.corps.codesRestants));
  r = await perdu('GET', '/api/dossiers');
  verifier('et les dossiers deviennent accessibles', r.statut === 200);

  const perdu2 = client();
  await perdu2('POST', '/api/connexion', { courriel: 'medecin.c@test.fr', motDePasse: MDP });
  r = await perdu2('POST', '/api/totp/verifier', { code: codes[0] });
  verifier('le même code de secours ne resservira pas', r.statut === 401);
  r = await perdu2('POST', '/api/totp/verifier', { code: codes[1].toLowerCase().replace(/-/g, '') });
  verifier('la saisie est tolérante : minuscules et sans tirets acceptés',
    r.statut === 200, JSON.stringify(r.corps));

  r = await perdu('POST', '/api/totp/secours');
  verifier('on peut regénérer ses codes', r.statut === 200
    && r.corps.codesSecours.length === 8);
  const nouveaux = r.corps.codesSecours;
  verifier('les nouveaux codes diffèrent des anciens', nouveaux[0] !== codes[0]);
  const perdu3 = client();
  await perdu3('POST', '/api/connexion', { courriel: 'medecin.c@test.fr', motDePasse: MDP });
  r = await perdu3('POST', '/api/totp/verifier', { code: codes[2] });
  verifier('un ancien code non utilisé ne fonctionne plus après régénération',
    r.statut === 401, 'statut ' + r.statut);
  r = await perdu3('POST', '/api/totp/verifier', { code: nouveaux[0] });
  verifier('un nouveau code fonctionne', r.statut === 200);

  section('18. Courriel de réinitialisation');
  const messagerie = require('../src/messagerie');
  verifier('aucun transport réel n’est configuré en test',
    messagerie.transportChoisi() === 'journal');
  verifier('un courriel contenant une donnée de santé est refusé',
    (() => { try { messagerie.verifierContenu('Votre glycémie', 'x'); return false; }
             catch (e) { return true; } })());
  verifier('un courriel de réinitialisation passe',
    (() => { try {
      messagerie.verifierContenu('Réinitialisation de votre mot de passe',
        'Ouvrez ce lien pour choisir un nouveau mot de passe.');
      return true; } catch (e) { return false; } })());
  verifier('le lien n’est renvoyé dans la réponse qu’en l’absence de transport réel',
    /transportChoisi\(\) === 'journal'/.test(
      require('node:fs').readFileSync(__dirname + '/../src/api.js', 'utf8')),
    'En production le lien ne doit jamais revenir dans la réponse HTTP.');

  section('19. Entretien et durées de conservation');
  const entretien = require('../src/entretien');
  await db.requete(
    `INSERT INTO session (id, compte_id, expire_le) VALUES ('vieille', 1, now() - interval '2 days')`);
  await db.requete(
    `INSERT INTO tentative_connexion (courriel, ip, reussie, quand)
     VALUES ('vieux@test.fr', '1.2.3.4', FALSE, now() - interval '60 days')`);
  const bilan = await entretien.passer();
  verifier('la purge supprime les sessions expirées', bilan.sessions >= 1,
    'supprimées : ' + bilan.sessions);
  verifier('elle supprime les tentatives anciennes', bilan.tentatives >= 1,
    'supprimées : ' + bilan.tentatives);
  const resteVieille = await db.une(`SELECT id FROM session WHERE id = 'vieille'`);
  verifier('la session expirée a bien disparu', resteVieille === null);
  const trace = await entretien.dernierPassage();
  verifier('chaque passage est tracé', !!trace && !!trace.quand,
    'sans trace, on ne peut pas savoir si la purge tourne');
  verifier('la purge est programmée au démarrage du serveur',
    /entretien\.programmer/.test(
      require('node:fs').readFileSync(__dirname + '/../src/serveur.js', 'utf8')),
    'une fonction de purge que rien n’appelle ne purge rien');
  /* Contrôle croisé : la durée annoncée aux personnes doit être celle
     appliquée par le code. */
  const pageDonnees = require('node:fs').readFileSync(
    __dirname + '/../../prevention-sante/confidentialite/index.html', 'utf8');
  verifier('la durée des tentatives annoncée (30 jours) est celle du code',
    entretien.DUREES_JOURS.tentatives === 30 && /30<\/b> jours|<b>30 jours<\/b>/.test(pageDonnees),
    'code : ' + entretien.DUREES_JOURS.tentatives + ' jours');

  section('20. Numéro de sécurité sociale — chiffré, ou pas enregistré');
  const chiffre = require('../src/chiffre');
  /* Un NIR valide, construit avec sa clé de contrôle. */
  const corps13 = '1800475123456';
  const nirTest = corps13 + String(97 - (Number(corps13) % 97)).padStart(2, '0');
  verifier('le contrôle de clé accepte un numéro bien formé', chiffre.nirValide(nirTest), nirTest);
  verifier('il refuse une clé fausse', !chiffre.nirValide(corps13 + '00'));
  verifier('il refuse un numéro trop court', !chiffre.nirValide('123456'));

  const fiche3 = await db.une(`SELECT id FROM patient WHERE nom = 'Martin'`);

  /* Sans clé configurée : le serveur doit REFUSER, pas écrire en clair. */
  const cleAvant = process.env.CLE_CHIFFREMENT;
  delete process.env.CLE_CHIFFREMENT;
  r = await secretaireA('PUT', `/api/patients/${fiche3.id}/nir`, { nir: nirTest });
  verifier('sans clé de chiffrement, l’enregistrement est refusé', r.statut === 503,
    'statut ' + r.statut + ' ' + JSON.stringify(r.corps));
  const rienEnBase = await db.une(
    `SELECT nir_chiffre FROM patient WHERE id = $1`, [fiche3.id]);
  verifier('et RIEN n’a été écrit — surtout pas le numéro en clair',
    rienEnBase.nir_chiffre === null, String(rienEnBase.nir_chiffre));

  process.env.CLE_CHIFFREMENT = cleAvant || chiffre.genererCle();
  r = await secretaireA('PUT', `/api/patients/${fiche3.id}/nir`, { nir: '123' });
  verifier('un numéro invalide est refusé avant tout chiffrement', r.statut === 400);
  r = await secretaireA('PUT', `/api/patients/${fiche3.id}/nir`, { nir: nirTest });
  verifier('avec la clé, le numéro est enregistré', r.statut === 200, JSON.stringify(r.corps));

  const enBaseNir = await db.une(
    `SELECT nir_chiffre, nir_empreinte FROM patient WHERE id = $1`, [fiche3.id]);
  verifier('la base ne contient pas le numéro en clair',
    !enBaseNir.nir_chiffre.includes(nirTest), enBaseNir.nir_chiffre.slice(0, 40));
  verifier('la valeur porte un préfixe de version', enBaseNir.nir_chiffre.startsWith('v1.'));
  verifier('une empreinte permet la recherche sans déchiffrer',
    enBaseNir.nir_empreinte === chiffre.empreinte(nirTest));
  verifier('l’empreinte ne contient pas le numéro',
    !enBaseNir.nir_empreinte.includes(nirTest));

  r = await secretaireA('GET', `/api/patients/${fiche3.id}/nir`);
  verifier('la relecture ne renvoie que les quatre derniers chiffres',
    r.corps.quatreDerniers === nirTest.slice(-4) && !JSON.stringify(r.corps).includes(nirTest),
    JSON.stringify(r.corps));
  r = await patient1('GET', `/api/patients/${fiche3.id}/nir`);
  /* 401 ou 403 : ce client a été déconnecté à la section 12, donc il est
     refusé pour absence de session avant même le contrôle de rôle. Les
     deux sont des refus, et c'est ce qui compte ici. */
  verifier('un patient n’accède pas au numéro par cette route',
    r.statut === 403 || r.statut === 401, 'statut ' + r.statut);
  r = await drh2('GET', `/api/patients/${fiche3.id}/nir`);
  verifier('un employeur non plus', r.statut === 403);

  /* Altération en base : le déchiffrement doit échouer, pas renvoyer
     n'importe quoi. */
  await db.requete(
    `UPDATE patient SET nir_chiffre = $1 WHERE id = $2`,
    [enBaseNir.nir_chiffre.slice(0, -8) + 'AAAAAAAA', fiche3.id]);
  r = await secretaireA('GET', `/api/patients/${fiche3.id}/nir`);
  verifier('une valeur altérée en base est détectée, pas devinée', r.statut === 503,
    'statut ' + r.statut);

  section('21. Tableau de bord de pilotage');
  r = await secretaireA('GET', '/api/pilotage');
  verifier('un soignant accède aux comptages de fonctionnement', r.statut === 200,
    JSON.stringify(r.corps).slice(0, 100));
  const pil = JSON.stringify(r.corps);
  verifier('aucun nom de patient n’y figure',
    !/Martin|Claire|Durand|DÉMO/.test(pil), pil.slice(0, 160));
  verifier('aucune réponse ni avis n’y figure',
    !/socle_|question_id|a surveiller/.test(pil));
  verifier('il indique si l’entretien des données tourne',
    'dernierEntretien' in r.corps);
  verifier('il compte les accès refusés', typeof r.corps.refusTrentejours === 'number');
  verifier('il indique la couverture du second facteur',
    r.corps.securite && typeof r.corps.securite.avec_totp === 'number');
  r = await drh2('GET', '/api/pilotage');
  verifier('un employeur n’y accède pas', r.statut === 403);

  section('22. Consentement explicite');
  const cons = require('../src/consentement');
  const sansConsentement = client();
  r = await sansConsentement('POST', '/api/inscription', { courriel: 'refus@test.fr',
    motDePasse: MDP, nom: 'Refus', prenom: 'Sans' });
  verifier('sans consentement, aucun compte n’est créé', r.statut === 400,
    'statut ' + r.statut);
  const aucunCompte = await db.une(
    `SELECT id FROM compte WHERE courriel = 'refus@test.fr'`);
  verifier('et rien n’a été écrit en base', aucunCompte === null);
  r = await sansConsentement('POST', '/api/inscription', { courriel: 'refus@test.fr',
    motDePasse: MDP, nom: 'Refus', prenom: 'Sans', consentement: 'oui' });
  verifier('une valeur autre que « true » ne vaut pas consentement', r.statut === 400);
  r = await sansConsentement('POST', '/api/inscription', { courriel: 'vieux@test.fr',
    motDePasse: MDP, nom: 'X', prenom: 'Y', consentement: true,
    versionConsentement: '2020-01-1' });
  verifier('une version périmée est refusée', r.statut === 409, 'statut ' + r.statut);

  const avecConsentement = client();
  r = await avecConsentement('POST', '/api/inscription', { courriel: 'oui@test.fr',
    motDePasse: MDP, nom: 'Accord', prenom: 'Avec', consentement: true,
    versionConsentement: cons.VERSION });
  verifier('avec consentement, le compte est créé', r.statut === 200);
  const enregistre = await db.une(
    `SELECT version, texte_hash FROM consentement WHERE compte_id = $1`, [r.corps.compteId]);
  verifier('le consentement est enregistré avec sa version', enregistre.version === cons.VERSION);
  verifier('l’empreinte du texte accepté est conservée, pas juste une case cochée',
    enregistre.texte_hash === cons.EMPREINTE);

  r = await sansConsentement('GET', '/api/consentement');
  verifier('le texte est lisible sans être connecté', r.statut === 200
    && r.corps.texte.length > 400, 'on ne consent pas à un texte qu’on ne peut pas lire');
  /* Le texte affiché doit être celui du serveur : la page ne le recopie pas. */
  const pageInscription = require('node:fs').readFileSync(
    __dirname + '/../../prevention-sante/connexion/index.html', 'utf8');
  verifier('la page charge le texte depuis le serveur au lieu de le recopier',
    /API\.texteConsentement/.test(pageInscription)
    && !pageInscription.includes('J’accepte que mes réponses'),
    'un texte recopié divergerait tôt ou tard de celui qui est enregistré');

  await avecConsentement('POST', '/api/connexion', { courriel: 'oui@test.fr', motDePasse: MDP });
  r = await avecConsentement('GET', '/api/mon-consentement');
  verifier('le patient voit l’état de son consentement',
    r.corps.donne === true && r.corps.aJour === true, JSON.stringify(r.corps));
  r = await avecConsentement('DELETE', '/api/mon-consentement');
  verifier('il peut le retirer', r.statut === 200 && r.corps.retire === true);
  verifier('et on lui dit que ses données ne sont pas supprimées pour autant',
    /ne sont pas supprimées/.test(r.corps.note || ''), r.corps.note);
  r = await avecConsentement('GET', '/api/mon-consentement');
  verifier('l’état reflète le retrait', r.corps.donne === false && !!r.corps.retireLe);

  section('23. Copie de mes données, et effacement');
  const exportable = client();
  r = await exportable('POST', '/api/inscription', { courriel: 'export@test.fr',
    motDePasse: MDP, nom: 'Export', prenom: 'Test', consentement: true });
  await exportable('POST', '/api/connexion', { courriel: 'export@test.fr', motDePasse: MDP });
  const dossierEx = (await exportable('POST', '/api/dossiers')).corps.dossierId;
  await exportable('PUT', `/api/dossiers/${dossierEx}/reponses`,
    { reponses: [{ module: 'socle', questionId: 'q_export', valeur: 'ma réponse' }] });

  r = await exportable('GET', '/api/mes-donnees');
  verifier('l’export répond', r.statut === 200);
  verifier('il contient les réponses de la personne',
    JSON.stringify(r.corps.reponses).includes('ma réponse'));
  verifier('il contient l’historique des consentements',
    Array.isArray(r.corps.consentements) && r.corps.consentements.length >= 1);
  verifier('il contient la liste des accès au dossier', 'quiAOuvertMonDossier' in r.corps);
  verifier('il ne livre pas le numéro de sécurité sociale en clair',
    typeof r.corps.numeroSecuriteSociale === 'string');
  verifier('il annonce qu’aucune interprétation n’a été ajoutée',
    /aucune\s+interprétation/i.test(r.corps.apropos || ''), r.corps.apropos);
  const exportTrace = await db.une(
    `SELECT count(*)::int AS n FROM journal_acces WHERE action = 'export_donnees'`);
  verifier('l’export est journalisé', exportTrace.n >= 1);

  r = await medecinA('GET', '/api/mes-donnees');
  verifier('un médecin n’exporte pas « ses » données par cette route', r.statut === 403);

  r = await exportable('DELETE', '/api/mon-compte', {});
  verifier('l’effacement exige une confirmation explicite', r.statut === 400,
    'statut ' + r.statut);
  r = await exportable('DELETE', '/api/mon-compte', { confirmation: 'EFFACER' });
  verifier('l’effacement réussit', r.statut === 200 && r.corps.efface === true,
    JSON.stringify(r.corps));
  verifier('sa portée réelle est annoncée, y compris ce qui est conservé',
    /conservées|conservation/.test(r.corps.portee || ''), r.corps.portee);
  const compteParti = await db.une(
    `SELECT id FROM compte WHERE courriel = 'export@test.fr'`);
  verifier('le compte a disparu', compteParti === null);
  const identiteEffacee = await db.une(
    `SELECT nom, prenom, compte_id FROM patient WHERE nom = 'EFFACÉ' LIMIT 1`);
  verifier('l’identité est effacée et dissociée du compte',
    identiteEffacee && identiteEffacee.compte_id === null, JSON.stringify(identiteEffacee));
  const donneesRestantes = await db.une(
    `SELECT count(*)::int AS n FROM reponse WHERE dossier_id = $1`, [dossierEx]);
  verifier('les données médicales sont conservées, dissociées',
    donneesRestantes.n >= 1, donneesRestantes.n + ' réponse(s)');
  const traceEffacement = await db.une(
    `SELECT portee, traite_le FROM demande_effacement ORDER BY id DESC LIMIT 1`);
  verifier('la demande et sa portée sont tracées',
    !!traceEffacement && !!traceEffacement.traite_le);
  r = await exportable('GET', '/api/moi');
  verifier('la session est tombée', r.statut === 401);

  section('24. Aucune page n’appelle fetch() directement');
  const fsPages = require('node:fs');
  ['espace/patient.js', 'plateforme/app.js', 'suivi/suivi.js',
   'secretariat/secretariat.js', 'entreprise/entreprise.js', 'pilotage/pilotage.js']
    .forEach((f) => {
      const src = fsPages.readFileSync(__dirname + '/../../prevention-sante/' + f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      verifier(f + ' — passe uniquement par le client d’API',
        !/\bfetch\s*\(/.test(src),
        'un appel direct contournerait la gestion des erreurs et du cache');
    });

  section('25. Migrations de schéma');
  const migration = require('../src/migration');
  const fichiersM = migration.fichiers();
  verifier('les migrations sont numérotées et ordonnées',
    fichiersM.length >= 2 && fichiersM[0].numero === 1,
    fichiersM.map((f) => f.nom).join(', '));
  /* La base des tests a été créée par creerSchema, pas par les migrations :
     on vérifie donc le mécanisme sur une base neuve. */
  const db2 = require('../src/db');
  verifier('chaque migration porte une empreinte',
    fichiersM.every((f) => /^[0-9a-f]{64}$/.test(f.empreinte)));
  const etatM = await migration.etat();
  verifier('l’état des migrations est lisible', Array.isArray(etatM) && etatM.length >= 2);
  verifier('une migration modifiée après application serait détectée',
    /modifieeDepuis/.test(require('node:fs').readFileSync(
      __dirname + '/../src/migration.js', 'utf8')),
    'sans ce contrôle, deux serveurs pourraient différer en croyant être identiques');
  verifier('le serveur applique les migrations au démarrage',
    /migration\.migrer/.test(require('node:fs').readFileSync(
      __dirname + '/../src/serveur.js', 'utf8')));

  section('26. Traces du serveur — aucune donnée de santé');
  const traceur = require('../src/trace');
  const nettoye = traceur.nettoyer({
    dossierId: 7, ip: '1.2.3.4',
    valeur: '13.6', texte: 'avis du médecin', motDePasse: 'secret',
    nir: '180047512345611', codesSecours: ['A', 'B'], reponses: [1, 2, 3],
    imbrique: { commentaire: 'à surveiller', role: 'medecin' },
  });
  verifier('une valeur de biologie est retirée', nettoye.valeur === '[retiré]');
  verifier('un texte d’avis est retiré', nettoye.texte === '[retiré]');
  verifier('un mot de passe est retiré', nettoye.motDePasse === '[retiré]');
  verifier('un numéro de sécurité sociale est retiré', nettoye.nir === '[retiré]');
  verifier('les codes de secours sont retirés', nettoye.codesSecours === '[retiré]');
  verifier('le nettoyage descend dans les objets imbriqués',
    nettoye.imbrique.commentaire === '[retiré]', JSON.stringify(nettoye.imbrique));
  verifier('ce qui est utile au diagnostic est conservé',
    nettoye.dossierId === 7 && nettoye.ip === '1.2.3.4' && nettoye.imbrique.role === 'medecin');
  verifier('le serveur trace ses erreurs sans console.error brut',
    !/console\.error\('\[erreur\]'/.test(require('node:fs').readFileSync(
      __dirname + '/../src/serveur.js', 'utf8')));

  section('27. Rotation de la clé de chiffrement');
  const chiffreR = require('../src/chiffre');
  const cleA = chiffreR.genererCle();
  const cleB = chiffreR.genererCle();
  process.env.CLE_CHIFFREMENT = cleA;
  const secretRot = '180047512345611';
  const chiffreAvecA = chiffreR.chiffrer(secretRot);
  const stock = [{ id: 1, valeurChiffree: chiffreAvecA }];
  const res = await chiffreR.rotation({
    ancienneCle: cleA, nouvelleCle: cleB,
    lire: async () => stock,
    ecrire: async (id, valeur, marque) => { stock[0].nouvelle = valeur; stock[0].marque = marque; },
  });
  verifier('la rotation traite les lignes', res.traitees === 1);
  process.env.CLE_CHIFFREMENT = cleB;
  verifier('la valeur est relisible avec la NOUVELLE clé',
    chiffreR.dechiffrer(stock[0].nouvelle) === secretRot);
  process.env.CLE_CHIFFREMENT = cleA;
  verifier('et plus avec l’ancienne',
    (() => { try { chiffreR.dechiffrer(stock[0].nouvelle); return false; }
             catch (e) { return true; } })());
  verifier('la rotation refuse deux clés identiques',
    await (async () => { try {
      await chiffreR.rotation({ ancienneCle: cleA, nouvelleCle: cleA,
        lire: async () => [], ecrire: async () => {} });
      return false; } catch (e) { return true; } })());
  verifier('la procédure de sauvegarde de la clé est écrite dans le code',
    /coffre à secrets|copie de recouvrement/.test(
      require('node:fs').readFileSync(__dirname + '/../src/chiffre.js', 'utf8')),
    'une clé perdue rend les données définitivement illisibles');
  process.env.CLE_CHIFFREMENT = cleAvant || chiffreR.genererCle();

  section('28. Cohérence des deux listes de rôles');
  const fs2 = require('node:fs');
  const srcApi = fs2.readFileSync(__dirname + '/../src/api.js', 'utf8');
  const srcSrv = fs2.readFileSync(__dirname + '/../src/serveur.js', 'utf8');
  const lApi = (srcApi.match(/SECOND_FACTEUR_REQUIS = \[([^\]]*)\]/) || [])[1] || '';
  const lSrv = (srcSrv.match(/ROLES_SECOND_FACTEUR = \[([^\]]*)\]/) || [])[1] || '';
  const norm = (x) => x.replace(/['\s]/g, '').split(',').filter(Boolean).sort().join(',');
  verifier('les rôles soumis au second facteur sont les mêmes des deux côtés',
    norm(lApi) === norm(lSrv) && norm(lApi).length > 0,
    'api.js : ' + norm(lApi) + ' | serveur.js : ' + norm(lSrv));

  /* ------------------------------------------------------------------ */
  console.log('\n' + '─'.repeat(62));
  if (echoues === 0) {
    console.log(`\x1b[32m${reussis} contrôles, aucun échec.\x1b[0m`);
    console.log('Le cloisonnement des rôles est vérifié.');
  } else {
    console.log(`\x1b[31m${echoues} échec(s) sur ${reussis + echoues} contrôles.\x1b[0m`);
    echecs.forEach((e) => console.log('  - ' + e.nom + (e.detail ? ' | ' + e.detail : '')));
  }
  serveur.close();
  await db.fermer();
  process.exit(echoues === 0 ? 0 : 1);
}

principal().catch((e) => { console.error(e); process.exit(1); });
