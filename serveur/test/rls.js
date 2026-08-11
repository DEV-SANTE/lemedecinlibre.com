/* =====================================================================
   ROW LEVEL SECURITY — LA BASE REFUSE-T-ELLE VRAIMENT ?
   ---------------------------------------------------------------------
   Ces contrôles ne passent pas par l'API. Ils interrogent la base
   DIRECTEMENT, sous le rôle applicatif, avec des requêtes qu'un
   développeur pressé pourrait écrire en oubliant droits.js.

   C'est tout l'intérêt : si les politiques tiennent ici, elles tiendront
   aussi le jour où quelqu'un ajoutera un écran d'administration ou un
   script d'export sans passer par la couche de droits.
   ===================================================================== */
'use strict';
const db = require('../src/db');
const mdp = require('../src/mdp');

let reussis = 0, echoues = 0;
const echecs = [];
const ok = (n, c, d) => { if (c) { reussis++; console.log('  \x1b[32mok\x1b[0m   ' + n); }
  else { echoues++; echecs.push(n); console.log('  \x1b[31mÉCHEC\x1b[0m ' + n + (d ? '\n         → ' + d : '')); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

/* Se présenter à la base, comme le fera le serveur avant chaque requête. */
async function seDeclarer({ compteId = 0, role = 'aucun', centreId = 0 }) {
  await db.requete(`SET app.compte_id = '${compteId}'`);
  await db.requete(`SET app.role = '${role}'`);
  await db.requete(`SET app.centre_id = '${centreId}'`);
}

async function principal() {
  await db.ouvrir({});
  await db.creerSchema();
  section('1. Les politiques s’appliquent sans erreur');
  try {
    await db.appliquerRls();
    ok('rls.sql s’exécute entièrement', true);
  } catch (e) {
    ok('rls.sql s’exécute entièrement', false, e.message);
    console.log('\n' + '─'.repeat(62));
    console.log('\x1b[31mImpossible de continuer : les politiques n’ont pas été posées.\x1b[0m');
    process.exit(1);
  }
  const nb = await db.une(`SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public'`);
  ok('douze politiques sont en place (' + nb.n + ')', nb.n === 12, 'trouvées : ' + nb.n);
  const tables = await db.requete(
    `SELECT relname FROM pg_class WHERE relrowsecurity = TRUE ORDER BY relname`);
  ok('RLS activé sur les huit tables sensibles', tables.rows.length === 8,
    tables.rows.map((r) => r.relname).join(', '));

  /* Jeu de données, posé en superutilisateur — donc sans contrainte. */
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1,'A'), (2,'B')`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(
    `INSERT INTO compte (id, courriel, mdp_hash, role, centre_id, nom_affiche) VALUES
      (10,'p1@t.fr',$1,'patient',NULL,'P1'),
      (11,'p2@t.fr',$1,'patient',NULL,'P2'),
      (20,'medA@t.fr',$1,'medecin',1,'Dr A'),
      (21,'medB@t.fr',$1,'medecin',2,'Dr B'),
      (30,'secA@t.fr',$1,'secretaire',1,'Sec A')`, [h]);
  await db.requete(
    `INSERT INTO patient (id, compte_id, nom, prenom, centre_id) VALUES
      (100,10,'UN','Patient',1), (101,11,'DEUX','Patient',2)`);
  await db.requete(
    `INSERT INTO dossier (id, patient_id, statut) VALUES (1000,100,'transmis'), (1001,101,'transmis')`);
  await db.requete(
    `INSERT INTO reponse (dossier_id, module, question_id, valeur) VALUES
      (1000,'socle','q1','réponse du patient un'), (1001,'socle','q1','réponse du patient deux')`);
  await db.requete(
    `INSERT INTO avis (dossier_id, domaine, statut, texte, auteur_id) VALUES
      (1000,'cardio','a surveiller','avis sur le patient un',20)`);
  await db.requete(
    `INSERT INTO resultat_biologie (patient_id, parametre, date_valeur, valeur) VALUES
      (100,'hb','2026-08-01',13.6)`);
  await db.requete(
    `INSERT INTO marque_bio (patient_id, parametre, date_valeur, couleur, commentaire, auteur_id)
     VALUES (100,'hb','2026-08-01','orange','à revoir',20)`);

  section('2. Le superutilisateur contourne les politiques — c’est le piège à connaître');
  let r = await db.requete(`SELECT count(*)::int AS n FROM reponse`);
  ok('en superutilisateur, tout est visible (' + r.rows[0].n + ' réponses)',
    r.rows[0].n === 2,
    'C’est normal, et c’est pourquoi l’application NE DOIT PAS se connecter ainsi.');

  /* On bascule sur le rôle applicatif : à partir d'ici les politiques
     s'appliquent vraiment. */
  await db.requete(`SET ROLE prevention_appli`);

  section('3. Sans se présenter, la base ne montre rien');
  await seDeclarer({});
  r = await db.requete(`SELECT count(*)::int AS n FROM patient`);
  ok('aucun patient visible', r.rows[0].n === 0, r.rows[0].n + ' visible(s)');
  r = await db.requete(`SELECT count(*)::int AS n FROM reponse`);
  ok('aucune réponse visible', r.rows[0].n === 0, r.rows[0].n + ' visible(s)');
  r = await db.requete(`SELECT count(*)::int AS n FROM dossier`);
  ok('aucun dossier visible', r.rows[0].n === 0, r.rows[0].n + ' visible(s)');

  section('4. Un patient ne voit que son dossier — sans passer par l’API');
  await seDeclarer({ compteId: 10, role: 'patient' });
  r = await db.requete(`SELECT nom FROM patient`);
  ok('il ne voit que sa propre fiche', r.rows.length === 1 && r.rows[0].nom === 'UN',
    JSON.stringify(r.rows));
  r = await db.requete(`SELECT valeur FROM reponse`);
  ok('il ne voit que ses propres réponses',
    r.rows.length === 1 && /patient un/.test(r.rows[0].valeur), JSON.stringify(r.rows));
  /* La requête la plus naïve possible, celle qu'on écrit sans réfléchir. */
  r = await db.requete(`SELECT * FROM reponse WHERE dossier_id = 1001`);
  ok('même en visant explicitement le dossier d’un autre, il n’obtient rien',
    r.rows.length === 0, r.rows.length + ' ligne(s)');
  r = await db.requete(`SELECT texte FROM avis`);
  ok('il voit l’avis écrit sur son dossier', r.rows.length === 1);

  section('5. Un médecin ne voit que son centre');
  await seDeclarer({ compteId: 20, role: 'medecin', centreId: 1 });
  r = await db.requete(`SELECT nom FROM patient`);
  ok('le médecin du centre 1 voit le patient du centre 1', r.rows.length === 1
    && r.rows[0].nom === 'UN', JSON.stringify(r.rows));
  await seDeclarer({ compteId: 21, role: 'medecin', centreId: 2 });
  r = await db.requete(`SELECT valeur FROM reponse WHERE dossier_id = 1000`);
  ok('le médecin du centre 2 n’obtient rien du dossier du centre 1',
    r.rows.length === 0, r.rows.length + ' ligne(s)');

  section('6. Le secret médical, tenu par la base elle-même');
  await seDeclarer({ compteId: 30, role: 'secretaire', centreId: 1 });
  r = await db.requete(`SELECT nom FROM patient`);
  ok('la secrétaire voit l’identité administrative', r.rows.length === 1);
  r = await db.requete(`SELECT valeur FROM reponse`);
  ok('mais AUCUNE réponse au questionnaire, même en SQL direct',
    r.rows.length === 0, r.rows.length + ' ligne(s) — la politique n’a pas tenu');
  r = await db.requete(`SELECT texte FROM avis`);
  ok('et AUCUN avis de médecin', r.rows.length === 0, r.rows.length + ' ligne(s)');
  r = await db.requete(`SELECT valeur FROM resultat_biologie`);
  ok('elle voit les résultats de laboratoire, conformément à l’arbitrage',
    r.rows.length === 1, r.rows.length + ' ligne(s)');
  r = await db.requete(`SELECT couleur FROM marque_bio`);
  ok('mais pas les marques du médecin, qui sont une appréciation',
    r.rows.length === 0, r.rows.length + ' ligne(s)');

  section('7. Un rôle inconnu, ou un employeur, n’obtient rien');
  await seDeclarer({ compteId: 40, role: 'employeur', centreId: 1 });
  r = await db.requete(`SELECT count(*)::int AS n FROM patient`);
  ok('un employeur ne voit aucun patient', r.rows[0].n === 0, r.rows[0].n + '');
  r = await db.requete(`SELECT count(*)::int AS n FROM reponse`);
  ok('ni aucune réponse', r.rows[0].n === 0, r.rows[0].n + '');
  await seDeclarer({ compteId: 999, role: 'inventé', centreId: 1 });
  r = await db.requete(`SELECT count(*)::int AS n FROM patient`);
  ok('un rôle inventé ne donne aucun accès', r.rows[0].n === 0, r.rows[0].n + '');

  section('8. Le journal des accès ne se lit pas chez les autres');
  await db.requete(`RESET ROLE`);
  await db.requete(
    `INSERT INTO journal_acces (compte_id, role, action, cible_type, cible_id, autorise)
     VALUES (20,'medecin','lecture_dossier','dossier',1000,TRUE),
            (21,'medecin','lecture_dossier','dossier',1001,TRUE)`);
  await db.requete(`SET ROLE prevention_appli`);
  await seDeclarer({ compteId: 10, role: 'patient' });
  r = await db.requete(`SELECT cible_id FROM journal_acces`);
  ok('le patient un voit les accès à SON dossier uniquement',
    r.rows.length === 1 && Number(r.rows[0].cible_id) === 1000, JSON.stringify(r.rows));

  console.log('\n' + '─'.repeat(62));
  console.log(echoues ? `\x1b[31m${echoues} échec(s) sur ${reussis + echoues}.\x1b[0m`
                      : `\x1b[32m${reussis} contrôles, aucun échec.\x1b[0m`);
  echecs.forEach((e) => console.log('  - ' + e));
  await db.fermer();
  process.exit(echoues ? 1 : 0);
}
principal().catch((e) => { console.error(e); process.exit(1); });
