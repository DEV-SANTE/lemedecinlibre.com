/* =====================================================================
   JEU DE DÉMONSTRATION
   Crée un centre et trois comptes de test dans la base en mémoire, puis
   démarre le serveur. Uniquement pour le développement : refuse de
   s'exécuter si une vraie base est configurée.
   ===================================================================== */
'use strict';
const path = require('node:path');
const db = require('./db');
const mdp = require('./mdp');
const { demarrer } = require('./serveur');

/* Clé de chiffrement de développement, si aucune n'est fournie : sinon la
   saisie d'un numéro de sécurité sociale échouerait — à raison — et on
   croirait à un bug. */
if (!process.env.CLE_CHIFFREMENT) {
  process.env.CLE_CHIFFREMENT = require('./chiffre').genererCle();
  console.log('Clé de chiffrement de développement générée (elle change à chaque démarrage,');
  console.log('donc un numéro enregistré ne sera plus lisible au prochain lancement).');
}

if (process.env.DATABASE_URL) {
  console.error('Refusé : DATABASE_URL est défini. Ce jeu de démonstration ne doit');
  console.error('jamais être injecté dans une base réelle.');
  process.exit(1);
}

(async () => {
  const site = path.join(__dirname, '..', '..', 'prevention-sante');
  await demarrer({ port: Number(process.env.PORT) || 3000, site });
  await db.requete(`INSERT INTO centre (id, nom) VALUES (1, 'Centre pilote')`);
  const h = mdp.hacher('mot-de-passe-de-test');
  await db.requete(
    `INSERT INTO compte (courriel, mdp_hash, role, centre_id, nom_affiche, rpps) VALUES
      ('medecin.a@test.fr',    $1, 'medecin',    1, 'Dr Nassreddine Knani', '10110958559'),
      ('secretaire.a@test.fr', $1, 'secretaire', 1, 'Secrétaire du centre', NULL),
      ('drh.a@test.fr',        $1, 'employeur',  1, 'Responsable RH',       NULL)`, [h]);
  /* Un patient de démonstration avec de vraies lignes en base : sans
     cela, la page de biologie retomberait sur son catalogue d'exemples et
     on ne saurait pas si le branchement fonctionne. */
  const hp = mdp.hacher('un-mot-de-passe-long');
  const cp = await db.une(
    `INSERT INTO compte (courriel, mdp_hash, role, nom_affiche)
     VALUES ('patient.demo@test.fr', $1, 'patient', 'Claire DÉMO') RETURNING id`, [hp]);
  const pat = await db.une(
    `INSERT INTO patient (compte_id, nom, prenom, naissance, sexe, centre_id, rattache_le)
     VALUES ($1, 'DÉMO', 'Claire', '1980-04-12', 'F', 1, now()) RETURNING id`, [cp.id]);
  const dos = await db.une(
    `INSERT INTO dossier (patient_id, statut, transmis_le) VALUES ($1,'transmis',now()) RETURNING id`,
    [pat.id]);

  const DATES = ['2022-04-12', '2023-05-03', '2024-05-21', '2025-06-14', '2026-07-20'];
  const SERIES = {
    hb:    [14.1, 13.8, 13.6, 13.4, 13.6],   ferr:  [58, 47, 42, 31, 24],
    gly:   [0.88, 0.91, 0.94, 0.98, 1.02],   chol:  [1.94, 2.02, 2.11, 2.18, 2.14],
    hdl:   [0.58, 0.56, 0.54, 0.52, 0.55],   tg:    [0.92, 1.05, 1.18, 1.34, 1.21],
    creat: [71, 73, 74, 76, 75],             tsh:   [1.8, 2.1, 2.4, 2.2, 2.6],
    vitd:  [42, 38, 51, 44, 47],             alat:  [22, 24, 27, 31, 28],
    pas:   [118, 121, 124, 128, 126],        poids: [71.5, 73.2, 75.8, 77.1, 76.4],
  };
  const UNITES = { hb: 'g/dL', ferr: 'µg/L', gly: 'g/L', chol: 'g/L', hdl: 'g/L', tg: 'g/L',
    creat: 'µmol/L', tsh: 'mUI/L', vitd: 'nmol/L', alat: 'UI/L', pas: 'mmHg', poids: 'kg' };
  let n = 0;
  for (const [param, serie] of Object.entries(SERIES)) {
    for (let i = 0; i < DATES.length; i++) {
      await db.requete(
        `INSERT INTO resultat_biologie (patient_id, parametre, date_valeur, valeur, unite, source)
         VALUES ($1,$2,$3,$4,$5,'jeu de démonstration')`,
        [pat.id, param, DATES[i], serie[i], UNITES[param]]);
      n++;
    }
  }
  /* Deux marques posées comme le ferait un médecin : couleur choisie,
     commentaire, auteur identifié, horodatage. */
  const med = await db.une(`SELECT id FROM compte WHERE courriel = 'medecin.a@test.fr'`);
  await db.requete(
    `INSERT INTO marque_bio (patient_id, parametre, date_valeur, couleur, commentaire, auteur_id)
     VALUES ($1,'ferr','2026-07-20','orange',
             'Baisse régulière depuis 2022. Bilan martial complémentaire prescrit, nous en reparlons.',$2),
            ($1,'gly','2026-07-20','orange',
             'À surveiller. Nous avons parlé d’activité physique et d’alimentation.',$2)`,
    [pat.id, med.id]);

  /* Second facteur pré-activé pour les soignants, avec un secret connu :
     sans cela il faudrait configurer une application d'authentification
     avant de pouvoir seulement regarder l'écran médecin. Le code à saisir
     est affiché ci-dessous et change toutes les trente secondes. */
  const totp = require('./totp');
  const secret = totp.nouveauSecret();
  await db.requete(`UPDATE compte SET totp_secret = $1, totp_actif = TRUE
                     WHERE role IN ('medecin','secretaire')`, [secret]);

  console.log('\nComptes de démonstration (mot de passe : mot-de-passe-de-test)');
  console.log('  medecin.a@test.fr · secretaire.a@test.fr · drh.a@test.fr');
  console.log('Patient de démonstration : patient.demo@test.fr / un-mot-de-passe-long');
  console.log('  dossier ' + dos.id + ' — ' + n + ' valeurs de biologie et 2 marques en base');
  /* Codes de secours pour les comptes soignants de démonstration. */
  const secours = require('./secours');
  const soignants = await db.requete(
    `SELECT id, courriel FROM compte WHERE role IN ('medecin','secretaire')`);
  const codesDemo = {};
  for (const c of soignants.rows) codesDemo[c.courriel] = await secours.generer(c.id);

  console.log('\nSecond facteur des comptes soignants : clé ' + secret);
  console.log('Codes de secours (utilisables à la place du code) :');
  for (const [mail, liste] of Object.entries(codesDemo)) {
    console.log('  ' + mail + ' → ' + liste.slice(0, 2).join('  ') + '  (+' + (liste.length - 2) + ' autres)');
  }
  const afficherCode = () => {
    const c = totp.codePour(secret, totp.pasCourant());
    const reste = 30 - Math.floor((Date.now() / 1000) % 30);
    console.log('  code à saisir : ' + c + '  (valable encore ' + reste + ' s)');
  };
  afficherCode();
  setInterval(afficherCode, 30000);
})().catch((e) => { console.error(e); process.exit(1); });
