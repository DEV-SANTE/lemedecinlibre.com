/* =====================================================================
   API — les routes.
   Serveur HTTP natif de Node, sans framework : aucune dépendance à
   auditer, aucune surprise à la mise à jour. Le projet entier tient sur
   « pg » en production, et rien d'autre.
   ===================================================================== */
'use strict';
const crypto = require('node:crypto');
const db = require('./db');
const mdp = require('./mdp');
const droits = require('./droits');
const journal = require('./journal');
const limites = require('./limites');
const totp = require('./totp');
const secours = require('./secours');
const messagerie = require('./messagerie');
const chiffre = require('./chiffre');
const consentement = require('./consentement');

/* Les rôles qui accèdent à plusieurs dossiers doivent passer un second
   facteur. Un mot de passe de médecin qui fuite ouvrirait tous les
   dossiers du centre ; celui d'un patient n'ouvre que le sien. */
const SECOND_FACTEUR_REQUIS = ['medecin', 'secretaire'];

const DUREE_SESSION_H = 12;

/* ------------------------------------------------------------ sessions */
async function creerSession(compteId, ip, agent) {
  const id = crypto.randomBytes(32).toString('hex');
  const expire = new Date(Date.now() + DUREE_SESSION_H * 3600e3);
  await db.requete(
    `INSERT INTO session (id, compte_id, expire_le, ip, agent) VALUES ($1,$2,$3,$4,$5)`,
    [id, compteId, expire, ip, agent]);
  return id;
}

async function compteDeLaSession(idSession) {
  if (!idSession) return null;
  /* totp_valide vient de la SESSION et non du compte : c'est cette
     session-ci qui a franchi le second facteur, pas le compte en général.
     Une autre session du même compte doit le franchir à son tour. */
  return db.une(
    `SELECT c.*, s.totp_valide FROM session s JOIN compte c ON c.id = s.compte_id
      WHERE s.id = $1 AND s.expire_le > now() AND c.actif = TRUE`, [idSession]);
}

/* ------------------------------------------------- lecture d'un dossier
   Une seule requête donne le dossier ET ce qu'il faut pour décider des
   droits : le compte du patient et son centre. Les décisions ne sont
   jamais prises sur des données incomplètes. */
async function chargerDossier(id) {
  return db.une(
    `SELECT d.id, d.statut, d.cree_le, d.transmis_le,
            p.id AS patient_id, p.nom, p.prenom, p.naissance, p.sexe,
            p.centre_id, p.compte_id AS compte_patient_id
       FROM dossier d JOIN patient p ON p.id = d.patient_id
      WHERE d.id = $1`, [id]);
}

/* ================================================================ routes */
const routes = {

  /* --- le texte du consentement, à afficher AVANT l'inscription. Il vient
         du serveur et non de la page : les deux ne peuvent donc pas
         divergerner, et c'est le texte enregistré qui est celui montré. */
  'GET /api/consentement': async (ctx) => {
    return ctx.ok({ version: consentement.VERSION, texte: consentement.TEXTE });
  },

  /* --- inscription libre d'un patient. Le compte est créé mais le
         patient n'est rattaché à aucun centre : aucun soignant ne le
         voit tant que la secrétaire ne l'a pas rattaché. */
  'POST /api/inscription': async (ctx) => {
    const { courriel, motDePasse, nom, prenom, naissance, sexe } = ctx.corps;
    if (!courriel || !motDePasse || !nom || !prenom) return ctx.err(400, 'champs manquants');

    /* Consentement explicite exigé : article 9 du RGPD. Il est refusé, et
       non enregistré par défaut — un consentement supposé n'est pas un
       consentement. La version acceptée est vérifiée pour qu'une page
       obsolète ne fasse pas consentir à un texte qui n'existe plus. */
    if (ctx.corps.consentement !== true) {
      return ctx.err(400, 'Le consentement au traitement des données de santé est '
        + 'nécessaire pour créer un compte. Sans lui, aucune donnée ne peut être '
        + 'enregistrée.');
    }
    if (ctx.corps.versionConsentement
        && ctx.corps.versionConsentement !== consentement.VERSION) {
      return ctx.err(409, 'Le texte de consentement a changé. Rechargez la page pour '
        + 'prendre connaissance de la version en cours.');
    }

    const existe = await db.une(`SELECT id FROM compte WHERE lower(courriel) = lower($1)`, [courriel]);
    if (existe) return ctx.err(409, 'un compte existe déjà pour cette adresse');
    let hash;
    try { hash = mdp.hacher(motDePasse); } catch (e) { return ctx.err(400, e.message); }
    const c = await db.une(
      `INSERT INTO compte (courriel, mdp_hash, role, nom_affiche)
       VALUES ($1,$2,'patient',$3) RETURNING id`, [courriel, hash, `${prenom} ${nom}`]);
    await db.requete(
      `INSERT INTO patient (compte_id, nom, prenom, naissance, sexe)
       VALUES ($1,$2,$3,$4,$5)`, [c.id, nom, prenom, naissance || null, sexe || 'non renseigne']);
    await consentement.enregistrer(c.id, ctx.ip);
    await journal.tracer({ compte: null, action: 'inscription', cibleType: 'compte',
                           cibleId: c.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ compteId: c.id, rattache: false,
      message: 'Compte créé. Votre dossier sera visible du médecin après rattachement par le centre.' });
  },

  /* --- création d'un compte patient par le centre. */
  'POST /api/patients': async (ctx) => {
    const d = droits.peutCreerPatient(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'creation_patient');
    const { courriel, motDePasse, nom, prenom, naissance, sexe } = ctx.corps;
    if (!courriel || !motDePasse || !nom || !prenom) return ctx.err(400, 'champs manquants');
    let hash;
    try { hash = mdp.hacher(motDePasse); } catch (e) { return ctx.err(400, e.message); }
    const c = await db.une(
      `INSERT INTO compte (courriel, mdp_hash, role, nom_affiche)
       VALUES ($1,$2,'patient',$3) RETURNING id`, [courriel, hash, `${prenom} ${nom}`]);
    const p = await db.une(
      `INSERT INTO patient (compte_id, nom, prenom, naissance, sexe, centre_id, rattache_le, rattache_par)
       VALUES ($1,$2,$3,$4,$5,$6, now(), $7) RETURNING id`,
      [c.id, nom, prenom, naissance || null, sexe || 'non renseigne', ctx.compte.centre_id, ctx.compte.id]);
    /* Le consentement recueilli au comptoir est enregistré au nom de la
       personne qui l'a recueilli : la trace dit que le centre l'a obtenu,
       et le patient le confirmera à sa première connexion. */
    if (ctx.corps.consentementRecueilli === true) {
      await consentement.enregistrer(c.id, ctx.ip);
    }
    await journal.tracer({ compte: ctx.compte, action: 'creation_patient',
                           cibleType: 'patient', cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ patientId: p.id, compteId: c.id, rattache: true });
  },

  /* --- rattachement d'un patient inscrit librement. */
  'POST /api/patients/:id/rattacher': async (ctx) => {
    const d = droits.peutRattacher(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'rattachement');
    const r = await db.requete(
      `UPDATE patient SET centre_id = $1, rattache_le = now(), rattache_par = $2
        WHERE id = $3 AND centre_id IS NULL`,
      [ctx.compte.centre_id, ctx.compte.id, ctx.params.id]);
    if (!r.nb) return ctx.err(404, 'patient inconnu ou déjà rattaché');
    await journal.tracer({ compte: ctx.compte, action: 'rattachement', cibleType: 'patient',
                           cibleId: Number(ctx.params.id), autorise: true, ip: ctx.ip });
    return ctx.ok({ rattache: true });
  },

  /* --- enregistrer le numéro de sécurité sociale d'un patient.
         Réservé au centre : c'est une donnée de facturation, saisie depuis
         la carte Vitale ou l'attestation. Elle est chiffrée avant d'être
         écrite, et le serveur refuse d'enregistrer si la clé manque —
         plutôt que d'écrire en clair. */
  'PUT /api/patients/:id/nir': async (ctx) => {
    const d = droits.peutCreerPatient(ctx.compte);   /* même droit que la création */
    if (!d.ok) return ctx.refus(d, 'saisie_nir');
    const p = await db.une(
      `SELECT id, centre_id FROM patient WHERE id = $1`, [ctx.params.id]);
    if (!p) return ctx.err(404, 'patient inconnu');
    if (p.centre_id !== ctx.compte.centre_id) {
      return ctx.err(403, 'patient d’un autre centre');
    }
    const nir = String(ctx.corps.nir || '').toUpperCase().replace(/\s/g, '');
    if (!chiffre.nirValide(nir)) {
      return ctx.err(400, 'numéro de sécurité sociale invalide : vérifiez la saisie, '
        + 'clé de contrôle incluse');
    }
    let valeur, marque;
    try {
      valeur = chiffre.chiffrer(nir);
      marque = chiffre.empreinte(nir);
    } catch (e) {
      /* Clé absente ou mal formée : on n'enregistre RIEN. */
      console.error('[chiffrement]', e.message);
      return ctx.err(503, 'Le chiffrement n’est pas configuré sur ce serveur. '
        + 'Le numéro n’a pas été enregistré.');
    }
    await db.requete(
      `UPDATE patient SET nir_chiffre = $1, nir_empreinte = $2,
              nir_saisi_le = now(), nir_saisi_par = $3 WHERE id = $4`,
      [valeur, marque, ctx.compte.id, p.id]);
    await journal.tracer({ compte: ctx.compte, action: 'saisie_nir', cibleType: 'patient',
                           cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ enregistre: true,
      note: 'Numéro chiffré. Il n’est plus affiché en entier : seuls les quatre derniers '
          + 'chiffres seront visibles pour vérification.' });
  },

  /* --- relire le numéro. Renvoie par défaut les quatre derniers chiffres
         seulement : la vérification d'une saisie n'exige pas de réafficher
         le numéro complet, et un écran de secrétariat reste sous les yeux
         de tout le monde. */
  'GET /api/patients/:id/nir': async (ctx) => {
    const d = droits.peutCreerPatient(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'lecture_nir');
    const p = await db.une(
      `SELECT id, centre_id, nir_chiffre, nir_saisi_le FROM patient WHERE id = $1`,
      [ctx.params.id]);
    if (!p) return ctx.err(404, 'patient inconnu');
    if (p.centre_id !== ctx.compte.centre_id) return ctx.err(403, 'patient d’un autre centre');
    if (!p.nir_chiffre) return ctx.ok({ renseigne: false });
    let complet;
    try { complet = chiffre.dechiffrer(p.nir_chiffre); }
    catch (e) {
      return ctx.err(503, 'Numéro illisible : clé de chiffrement absente ou valeur altérée.');
    }
    await journal.tracer({ compte: ctx.compte, action: 'lecture_nir', cibleType: 'patient',
                           cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ renseigne: true, saisiLe: p.nir_saisi_le,
                    quatreDerniers: complet.slice(-4) });
  },

  /* --- les patients inscrits librement, en attente de rattachement.
         Tant qu'ils ne sont rattachés à aucun centre, aucun soignant ne
         voit leur dossier : cette liste est la seule façon de les
         retrouver, et c'est le travail du secrétariat. */
  'GET /api/patients/en-attente': async (ctx) => {
    const d = droits.peutListerPatients(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'liste_en_attente');
    const r = await db.requete(
      `SELECT p.id, p.nom, p.prenom, p.naissance, p.cree_le, c.courriel
         FROM patient p JOIN compte c ON c.id = p.compte_id
        WHERE p.centre_id IS NULL ORDER BY p.cree_le DESC LIMIT 200`);
    await journal.tracer({ compte: ctx.compte, action: 'liste_en_attente',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ patients: r.rows });
  },

  /* --- les patients du centre. Administratif : aucun contenu médical,
         seulement l'identité et l'état d'avancement du dossier. */
  'GET /api/patients': async (ctx) => {
    const d = droits.peutListerPatients(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'liste_patients');
    const r = await db.requete(
      `SELECT p.id, p.nom, p.prenom, p.naissance, p.sexe, p.rattache_le, c.courriel,
              (SELECT count(*)::int FROM dossier d WHERE d.patient_id = p.id) AS dossiers,
              (SELECT d.statut FROM dossier d WHERE d.patient_id = p.id
                ORDER BY d.cree_le DESC LIMIT 1) AS dernier_statut,
              (SELECT d.id FROM dossier d WHERE d.patient_id = p.id
                ORDER BY d.cree_le DESC LIMIT 1) AS dernier_dossier
         FROM patient p JOIN compte c ON c.id = p.compte_id
        WHERE p.centre_id = $1 ORDER BY p.nom, p.prenom LIMIT 500`, [ctx.compte.centre_id]);
    await journal.tracer({ compte: ctx.compte, action: 'liste_patients',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ patients: r.rows });
  },

  /* --- connexion. */
  'POST /api/connexion': async (ctx) => {
    const { courriel, motDePasse } = ctx.corps;

    /* Avant même de regarder le mot de passe : la limitation. Sinon elle
       ne servirait à rien, le coût du calcul de condensat étant justement
       ce qu'on veut éviter de dépenser pour un attaquant. */
    const limite = await limites.verifier(courriel, ctx.ip);
    if (limite.bloque) {
      await journal.tracer({ compte: null, action: 'connexion_bloquee',
                             autorise: false, ip: ctx.ip });
      ctx.statutHTTP = 429;
      return ctx.err(429, 'Trop de tentatives. Réessayez dans '
        + limite.attendreMinutes + ' minute' + (limite.attendreMinutes > 1 ? 's' : '') + '.');
    }

    const c = await db.une(
      `SELECT * FROM compte WHERE lower(courriel) = lower($1) AND actif = TRUE`, [courriel]);
    /* Même message et même durée apparente que le compte existe ou non :
       une différence permettrait de savoir qui est inscrit. */
    const bon = c && mdp.verifier(motDePasse || '', c.mdp_hash);
    await limites.enregistrer(courriel, ctx.ip, !!bon);
    if (!bon) {
      await journal.tracer({ compte: c || null, action: 'echec_connexion',
                             autorise: false, ip: ctx.ip });
      return ctx.err(401, 'identifiants incorrects');
    }

    const idSession = await creerSession(c.id, ctx.ip, ctx.agent);
    await db.requete(`UPDATE compte SET derniere_connexion = now() WHERE id = $1`, [c.id]);
    ctx.poserCookie(idSession);

    /* Le second facteur n'est pas encore franchi : la session existe mais
       ne donne accès à rien d'autre qu'à sa vérification. */
    if (SECOND_FACTEUR_REQUIS.includes(c.role)) {
      if (!c.totp_actif) {
        await journal.tracer({ compte: c, action: 'connexion_totp_a_configurer',
                               autorise: true, ip: ctx.ip });
        return ctx.ok({ role: c.role, nom: c.nom_affiche, centreId: c.centre_id,
                        secondFacteur: 'a-configurer' });
      }
      await journal.tracer({ compte: c, action: 'connexion_totp_attendu',
                             autorise: true, ip: ctx.ip });
      return ctx.ok({ role: c.role, nom: c.nom_affiche, centreId: c.centre_id,
                      secondFacteur: 'attendu' });
    }

    await db.requete(`UPDATE session SET totp_valide = TRUE WHERE id = $1`, [idSession]);
    await journal.tracer({ compte: c, action: 'connexion', autorise: true, ip: ctx.ip });
    return ctx.ok({ role: c.role, nom: c.nom_affiche, centreId: c.centre_id,
                    secondFacteur: 'non-requis' });
  },

  /* --- mise en place du second facteur. Le secret n'est montré qu'une
         fois, au moment de la configuration, et il faut prouver qu'on
         sait produire un code avant qu'il soit activé. */
  'POST /api/totp/preparer': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    if (ctx.compte.totp_actif) return ctx.err(409, 'second facteur déjà actif');
    const secret = totp.nouveauSecret();
    await db.requete(`UPDATE compte SET totp_secret = $1, totp_actif = FALSE WHERE id = $2`,
      [secret, ctx.compte.id]);
    await journal.tracer({ compte: ctx.compte, action: 'totp_prepare',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ secret: secret,
                    uri: totp.uriProvisionnement(secret, ctx.compte.courriel),
                    note: 'Ce secret ne sera plus affiché. Enregistrez-le dans votre '
                        + 'application d’authentification, puis confirmez avec un code.' });
  },

  'POST /api/totp/activer': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const c = await db.une(`SELECT * FROM compte WHERE id = $1`, [ctx.compte.id]);
    if (!c.totp_secret) return ctx.err(400, 'aucun second facteur préparé');
    const pas = totp.verifier(c.totp_secret, ctx.corps.code, c.totp_dernier_pas);
    if (pas === null) {
      await journal.tracer({ compte: ctx.compte, action: 'totp_activation_refusee',
                             autorise: false, ip: ctx.ip });
      return ctx.err(401, 'code incorrect');
    }
    await db.requete(
      `UPDATE compte SET totp_actif = TRUE, totp_dernier_pas = $1 WHERE id = $2`,
      [pas, c.id]);
    if (ctx.idSession) {
      await db.requete(`UPDATE session SET totp_valide = TRUE WHERE id = $1`, [ctx.idSession]);
    }
    /* Les codes de secours sont remis MAINTENANT, au moment où le second
       facteur devient obligatoire — pas plus tard sur demande. Une
       personne qui n'a pas encore compris qu'elle en aurait besoin est
       précisément celle qui se retrouvera bloquée. */
    const codes = await secours.generer(c.id);
    await journal.tracer({ compte: ctx.compte, action: 'totp_active',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ actif: true, codesSecours: codes,
      note: 'Notez ces ' + codes.length + ' codes et rangez-les ailleurs que sur votre '
          + 'téléphone. Chacun ne sert qu’une fois, et ils ne seront plus affichés.' });
  },

  'POST /api/totp/verifier': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const limite = await limites.verifier(ctx.compte.courriel, ctx.ip);
    if (limite.bloque) return ctx.err(429, 'Trop de tentatives. Réessayez dans '
      + limite.attendreMinutes + ' minute(s).');
    const c = await db.une(`SELECT * FROM compte WHERE id = $1`, [ctx.compte.id]);
    if (!c.totp_actif) return ctx.err(400, 'second facteur non configuré');
    const pas = totp.verifier(c.totp_secret, ctx.corps.code, c.totp_dernier_pas);

    /* Le code de l'application n'a pas convenu : c'est peut-être un code de
       secours. On l'essaie avant de refuser, parce que la personne qui
       s'en sert a justement perdu l'accès à son application et n'a pas à
       cliquer ailleurs pour le dire. */
    if (pas === null) {
      const reste = await secours.consommer(c.id, ctx.corps.code);
      if (reste !== null) {
        await db.requete(`UPDATE session SET totp_valide = TRUE WHERE id = $1`, [ctx.idSession]);
        await limites.enregistrer(c.courriel, ctx.ip, true);
        await journal.tracer({ compte: ctx.compte, action: 'totp_code_secours',
                               autorise: true, ip: ctx.ip });
        return ctx.ok({ valide: true, parCodeDeSecours: true, codesRestants: reste,
          role: c.role, nom: c.nom_affiche, centreId: c.centre_id,
          note: reste === 0
            ? 'C’était votre dernier code de secours. Régénérez-en depuis votre espace.'
            : 'Il vous reste ' + reste + ' code(s) de secours.' });
      }
      await limites.enregistrer(c.courriel, ctx.ip, false);
      await journal.tracer({ compte: ctx.compte, action: 'totp_refuse',
                             autorise: false, ip: ctx.ip });
      return ctx.err(401, 'code incorrect');
    }
    await db.requete(`UPDATE compte SET totp_dernier_pas = $1 WHERE id = $2`, [pas, c.id]);
    await db.requete(`UPDATE session SET totp_valide = TRUE WHERE id = $1`, [ctx.idSession]);
    await limites.enregistrer(c.courriel, ctx.ip, true);
    await journal.tracer({ compte: ctx.compte, action: 'totp_valide',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ valide: true, role: c.role, nom: c.nom_affiche, centreId: c.centre_id });
  },

  /* --- combien de codes de secours restent-ils. */
  'GET /api/totp/secours': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    return ctx.ok({ restants: await secours.restants(ctx.compte.id), total: secours.NOMBRE });
  },

  /* --- en regénérer. Invalide les anciens : un code noté sur un papier
         oublié dans un tiroir ne doit pas rester valable. */
  'POST /api/totp/secours': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const c = await db.une(`SELECT totp_actif FROM compte WHERE id = $1`, [ctx.compte.id]);
    if (!c.totp_actif) return ctx.err(400, 'second facteur non configuré');
    const codes = await secours.generer(ctx.compte.id);
    await journal.tracer({ compte: ctx.compte, action: 'codes_secours_regeneres',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ codesSecours: codes,
      note: 'Les codes précédents ne fonctionnent plus. Notez ceux-ci.' });
  },

  /* --- mot de passe oublié.
         La réponse est toujours la même, que l'adresse existe ou non :
         sinon ce formulaire dirait qui est inscrit sur la plateforme, ce
         qui est déjà une information de santé quand la plateforme est un
         parcours de prévention. */
  'POST /api/mot-de-passe/oublie': async (ctx) => {
    const { courriel } = ctx.corps;
    const reponse = { envoye: true,
      note: 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être '
          + 'envoyé. Il est valable une heure et ne fonctionne qu’une fois.' };
    if (!courriel) return ctx.ok(reponse);
    const c = await db.une(
      `SELECT id, courriel FROM compte WHERE lower(courriel) = lower($1) AND actif = TRUE`,
      [courriel]);
    if (!c) {
      await journal.tracer({ compte: null, action: 'reinit_demande_inconnue',
                             autorise: false, ip: ctx.ip });
      return ctx.ok(reponse);
    }
    const brut = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(brut).digest('hex');
    /* Une seule demande valable à la fois : les précédentes sont annulées. */
    await db.requete(
      `UPDATE jeton_reinitialisation SET utilise_le = now()
        WHERE compte_id = $1 AND utilise_le IS NULL`, [c.id]);
    await db.requete(
      `INSERT INTO jeton_reinitialisation (compte_id, jeton_hash, expire_le, ip_demande)
       VALUES ($1, $2, now() + interval '1 hour', $3)`, [c.id, hash, ctx.ip]);
    await journal.tracer({ compte: c, action: 'reinit_demande',
                           autorise: true, ip: ctx.ip });
    /* Le lien part par courriel. Il n'est renvoyé dans la réponse HTTP que
       si aucun transport réel n'est configuré : en production, le renvoyer
       permettrait à n'importe qui de réinitialiser le mot de passe d'autrui
       en connaissant seulement son adresse. */
    const lien = (process.env.URL_PUBLIQUE || '') + '/connexion/?reinit=' + brut;
    try {
      await messagerie.envoyer({
        a: c.courriel,
        sujet: 'Réinitialisation de votre mot de passe',
        texte: 'Bonjour,\n\n'
          + 'Une réinitialisation de mot de passe a été demandée pour votre compte.\n\n'
          + 'Pour choisir un nouveau mot de passe, ouvrez ce lien :\n' + lien + '\n\n'
          + 'Ce lien est valable une heure et ne fonctionne qu’une fois. '
          + 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : '
          + 'votre mot de passe actuel reste valable.\n\n'
          + 'Ce message est automatique, il ne contient aucune information de santé '
          + 'et il est inutile d’y répondre.',
      });
    } catch (e) {
      /* L'échec d'envoi est journalisé mais la réponse reste identique :
         dire « courriel non envoyé » révélerait que l'adresse existe. */
      console.error('[courriel] échec :', e.message);
    }
    if (messagerie.transportChoisi() === 'journal') {
      reponse.lienDeveloppement = '/connexion/?reinit=' + brut;
    }
    return ctx.ok(reponse);
  },

  'POST /api/mot-de-passe/reinitialiser': async (ctx) => {
    const { jeton, nouveauMotDePasse } = ctx.corps;
    if (!jeton || !nouveauMotDePasse) return ctx.err(400, 'jeton et nouveau mot de passe requis');
    const hash = crypto.createHash('sha256').update(String(jeton)).digest('hex');
    const j = await db.une(
      `SELECT * FROM jeton_reinitialisation
        WHERE jeton_hash = $1 AND utilise_le IS NULL AND expire_le > now()`, [hash]);
    if (!j) {
      await journal.tracer({ compte: null, action: 'reinit_jeton_invalide',
                             autorise: false, ip: ctx.ip });
      return ctx.err(401, 'lien invalide ou expiré');
    }
    let nouveauHash;
    try { nouveauHash = mdp.hacher(nouveauMotDePasse); }
    catch (e) { return ctx.err(400, e.message); }
    await db.requete(`UPDATE compte SET mdp_hash = $1 WHERE id = $2`, [nouveauHash, j.compte_id]);
    await db.requete(`UPDATE jeton_reinitialisation SET utilise_le = now() WHERE id = $1`, [j.id]);
    /* Toutes les sessions tombent : si quelqu'un d'autre était connecté
       avec l'ancien mot de passe, il est éjecté. C'est le but même d'une
       réinitialisation. */
    const s = await db.requete(`DELETE FROM session WHERE compte_id = $1`, [j.compte_id]);
    await limites.enregistrer(null, ctx.ip, true);
    await journal.tracer({ compte: { id: j.compte_id, role: null },
                           action: 'reinit_effectuee', autorise: true, ip: ctx.ip });
    return ctx.ok({ reinitialise: true, sessionsFermees: s.nb });
  },

  'POST /api/deconnexion': async (ctx) => {
    if (ctx.idSession) await db.requete(`DELETE FROM session WHERE id = $1`, [ctx.idSession]);
    ctx.effacerCookie();
    return ctx.ok({ deconnecte: true });
  },

  'GET /api/moi': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const c = ctx.compte;
    /* L'état du second facteur est dit ici pour que l'interface sache quoi
       afficher : demander un code, proposer la configuration, ou entrer. */
    let etat = 'non-requis';
    if (SECOND_FACTEUR_REQUIS.includes(c.role) && !c.totp_valide) {
      etat = c.totp_actif ? 'attendu' : 'a-configurer';
    }
    return ctx.ok({ id: c.id, role: c.role, nom: c.nom_affiche,
                    courriel: c.courriel, centreId: c.centre_id, secondFacteur: etat });
  },

  /* --- où en est mon consentement. */
  'GET /api/mon-consentement': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const e = await consentement.etat(ctx.compte.id);
    return ctx.ok(Object.assign({}, e, { versionEnCours: consentement.VERSION,
      texte: e.aJour ? undefined : consentement.TEXTE }));
  },

  'POST /api/mon-consentement': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    if (ctx.corps.consentement !== true) return ctx.err(400, 'consentement requis');
    await consentement.enregistrer(ctx.compte.id, ctx.ip);
    await journal.tracer({ compte: ctx.compte, action: 'consentement_donne',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ donne: true, version: consentement.VERSION });
  },

  /* --- retirer son consentement. On ne supprime rien ici : retirer le
         consentement et demander l'effacement sont deux gestes distincts,
         et les confondre ferait perdre des données à quelqu'un qui voulait
         seulement suspendre. */
  'DELETE /api/mon-consentement': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    await consentement.retirer(ctx.compte.id);
    await journal.tracer({ compte: ctx.compte, action: 'consentement_retire',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ retire: true,
      note: 'Votre consentement est retiré : plus aucune nouvelle donnée ne sera '
          + 'enregistrée. Vos données existantes ne sont pas supprimées pour autant — '
          + 'demandez leur effacement si c’est ce que vous souhaitez.' });
  },

  /* --- COPIE DE MES DONNÉES (portabilité, article 20 du RGPD).
         Tout ce qui concerne la personne, dans un format relisible par une
         machine. Aucune interprétation ajoutée : c'est un export, pas un
         compte rendu. */
  'GET /api/mes-donnees': async (ctx) => {
    if (!ctx.compte || ctx.compte.role !== 'patient') {
      return ctx.err(403, 'réservé au patient, pour ses propres données');
    }
    const p = await db.une(
      `SELECT id, nom, prenom, naissance, sexe, centre_id, rattache_le, cree_le,
              (nir_chiffre IS NOT NULL) AS nir_renseigne
         FROM patient WHERE compte_id = $1`, [ctx.compte.id]);
    if (!p) return ctx.err(404, 'aucune fiche patient');

    const dossiers = await db.requete(
      `SELECT id, statut, cree_le, transmis_le FROM dossier WHERE patient_id = $1
        ORDER BY cree_le`, [p.id]);
    const reponses = await db.requete(
      `SELECT d.id AS dossier_id, r.module, r.question_id, r.valeur, r.saisie_le
         FROM reponse r JOIN dossier d ON d.id = r.dossier_id
        WHERE d.patient_id = $1 ORDER BY r.saisie_le`, [p.id]);
    const historique = await db.requete(
      `SELECT h.dossier_id, h.question_id, h.ancienne_valeur, h.remplacee_le
         FROM reponse_historique h JOIN dossier d ON d.id = h.dossier_id
        WHERE d.patient_id = $1 ORDER BY h.remplacee_le`, [p.id]);
    const avis = await db.requete(
      `SELECT a.dossier_id, a.domaine, a.statut, a.texte, a.signe_le,
              c.nom_affiche AS medecin, c.rpps
         FROM avis a JOIN dossier d ON d.id = a.dossier_id JOIN compte c ON c.id = a.auteur_id
        WHERE d.patient_id = $1 ORDER BY a.signe_le`, [p.id]);
    const resultats = await db.requete(
      `SELECT parametre, date_valeur, valeur, unite, source FROM resultat_biologie
        WHERE patient_id = $1 ORDER BY date_valeur, parametre`, [p.id]);
    const marques = await db.requete(
      `SELECT m.parametre, m.date_valeur, m.couleur, m.commentaire, m.pose_le,
              c.nom_affiche AS medecin
         FROM marque_bio m JOIN compte c ON c.id = m.auteur_id
        WHERE m.patient_id = $1 ORDER BY m.pose_le`, [p.id]);
    const acces = await db.requete(
      `SELECT j.quand, j.action, j.role, c.nom_affiche
         FROM journal_acces j LEFT JOIN compte c ON c.id = j.compte_id
        WHERE j.cible_type = 'dossier' AND j.cible_id IN
              (SELECT id FROM dossier WHERE patient_id = $1) AND j.autorise = TRUE
        ORDER BY j.quand`, [p.id]);
    const cons = await db.requete(
      `SELECT version, donne_le, retire_le FROM consentement WHERE compte_id = $1
        ORDER BY id`, [ctx.compte.id]);

    await journal.tracer({ compte: ctx.compte, action: 'export_donnees',
                           cibleType: 'patient', cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({
      exporteLe: new Date().toISOString(),
      apropos: 'Copie de vos données, au titre de l’article 20 du RGPD. Aucune '
             + 'interprétation n’a été ajoutée : ce sont vos données telles qu’elles sont '
             + 'conservées.',
      compte: { courriel: ctx.compte.courriel, cree_le: p.cree_le, role: ctx.compte.role },
      identite: p,
      numeroSecuriteSociale: p.nir_renseigne
        ? 'renseigné, chiffré — demandez-le au centre pour l’obtenir en clair'
        : 'non renseigné',
      consentements: cons.rows,
      dossiers: dossiers.rows,
      reponses: reponses.rows,
      correctionsDeReponses: historique.rows,
      avisDuMedecin: avis.rows,
      resultatsDeLaboratoire: resultats.rows,
      annotationsDuMedecin: marques.rows,
      quiAOuvertMonDossier: acces.rows,
    });
  },

  /* --- DEMANDE D'EFFACEMENT (article 17 du RGPD).
         Ce que fait cette route, et ce qu'elle ne fait pas :

         Elle supprime l'ACCÈS — compte, sessions, mot de passe, second
         facteur — et dissocie l'identité du dossier. Elle NE supprime pas
         les données médicales, parce qu'un dossier médical est soumis à
         des obligations de conservation qui priment sur le droit à
         l'effacement (article 17-3-b et c).

         Cet arbitrage doit être validé par un juriste, et la durée de
         conservation fixée. En attendant, la demande est TRACÉE et sa
         portée écrite : la personne sait exactement ce qui a été supprimé
         et ce qui a été conservé, ce qui est la moindre des choses. */
  'DELETE /api/mon-compte': async (ctx) => {
    if (!ctx.compte || ctx.compte.role !== 'patient') {
      return ctx.err(403, 'réservé au patient, pour son propre compte');
    }
    if (ctx.corps.confirmation !== 'EFFACER') {
      return ctx.err(400, 'Confirmation requise : envoyez { "confirmation": "EFFACER" }.');
    }
    const p = await db.une(`SELECT id FROM patient WHERE compte_id = $1`, [ctx.compte.id]);
    const dem = await db.une(
      `INSERT INTO demande_effacement (compte_id, courriel, ip) VALUES ($1,$2,$3)
       RETURNING id`, [ctx.compte.id, ctx.compte.courriel, ctx.ip]);

    /* Dissociation : l'identité est remplacée, le dossier reste rattaché à
       une fiche devenue anonyme. */
    if (p) {
      await db.requete(
        `UPDATE patient SET nom = 'EFFACÉ', prenom = 'EFFACÉ', naissance = NULL,
                sexe = 'non renseigne', nir_chiffre = NULL, nir_empreinte = NULL,
                compte_id = NULL
          WHERE id = $1`, [p.id]);
    }
    await db.requete(`DELETE FROM session WHERE compte_id = $1`, [ctx.compte.id]);
    await db.requete(`DELETE FROM code_secours WHERE compte_id = $1`, [ctx.compte.id]);
    await db.requete(`DELETE FROM jeton_reinitialisation WHERE compte_id = $1`, [ctx.compte.id]);
    await consentement.retirer(ctx.compte.id);

    const portee = 'compte, mot de passe, second facteur, sessions et identité supprimés ; '
      + 'données médicales conservées sous forme dissociée au titre des obligations de '
      + 'conservation du dossier médical';
    await db.requete(
      `UPDATE demande_effacement SET traite_le = now(), portee = $1 WHERE id = $2`,
      [portee, dem.id]);
    await db.requete(`DELETE FROM compte WHERE id = $1`, [ctx.compte.id]);
    ctx.effacerCookie();
    return ctx.ok({ efface: true, portee: portee,
      note: 'Votre accès est supprimé. Pour l’effacement complet des données médicales, '
          + 'adressez-vous au centre : leur conservation est encadrée par la loi et ne '
          + 'dépend pas de nous seuls.' });
  },

  /* ================================================== rendez-vous ===
     Le secrétariat publie des créneaux ; le patient en choisit un ; le
     secrétariat confirme. Aucun créneau n'est suggéré d'après le dossier :
     ce serait une orientation, donc une décision — interdit ici. */

  'GET /api/creneaux': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const r = await db.requete(
      `SELECT c.id, c.centre_id, ce.nom AS centre, c.debut, c.duree_min
         FROM creneau c JOIN centre ce ON ce.id = c.centre_id
        WHERE c.debut > now()
          AND NOT EXISTS (SELECT 1 FROM rendezvous r
                           WHERE r.creneau_id = c.id AND r.statut != 'annule')
        ORDER BY c.debut LIMIT 100`);
    return ctx.ok({ creneaux: r.rows });
  },

  'POST /api/creneaux': async (ctx) => {
    const d = droits.peutCreerPatient(ctx.compte);   /* même cercle : le centre */
    if (!d.ok) return ctx.refus(d, 'publication_creneaux');
    const liste = Array.isArray(ctx.corps.creneaux) ? ctx.corps.creneaux : [];
    if (!liste.length) return ctx.err(400, 'aucun créneau transmis');
    let n = 0;
    for (const c of liste) {
      if (!c || !c.debut) continue;
      await db.requete(
        `INSERT INTO creneau (centre_id, debut, duree_min, publie_par)
         VALUES ($1,$2,$3,$4) ON CONFLICT (centre_id, debut) DO NOTHING`,
        [ctx.compte.centre_id, c.debut, c.dureeMin || 30, ctx.compte.id]);
      n++;
    }
    await journal.tracer({ compte: ctx.compte, action: 'publication_creneaux',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({ publies: n });
  },

  'POST /api/rendezvous': async (ctx) => {
    if (!ctx.compte || ctx.compte.role !== 'patient') {
      return ctx.err(403, 'réservé au patient');
    }
    const p = await db.une(`SELECT id FROM patient WHERE compte_id = $1`, [ctx.compte.id]);
    if (!p) return ctx.err(404, 'aucune fiche patient');
    const creneauId = Number(ctx.corps.creneauId);
    if (!creneauId) return ctx.err(400, 'creneauId requis');
    /* La contrainte UNIQUE sur creneau_id règle la course : deux patients
       qui visent le même créneau, un seul l'obtient, l'autre reçoit une
       explication au lieu d'une erreur interne. */
    let r;
    try {
      r = await db.une(
        `INSERT INTO rendezvous (patient_id, creneau_id) VALUES ($1,$2) RETURNING id`,
        [p.id, creneauId]);
    } catch (e) {
      return ctx.err(409, 'Ce créneau vient d’être pris. Choisissez-en un autre.');
    }
    await journal.tracer({ compte: ctx.compte, action: 'demande_rendezvous',
                           cibleType: 'patient', cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ rendezVousId: r.id, statut: 'demande',
      note: 'Demande enregistrée. Le centre vous confirmera le rendez-vous.' });
  },

  'GET /api/rendezvous': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    let sql, params;
    if (ctx.compte.role === 'patient') {
      sql = `SELECT r.id, r.statut, r.demande_le, r.confirme_le, c.debut, c.duree_min,
                    ce.nom AS centre
               FROM rendezvous r JOIN creneau c ON c.id = r.creneau_id
               JOIN centre ce ON ce.id = c.centre_id
               JOIN patient p ON p.id = r.patient_id
              WHERE p.compte_id = $1 ORDER BY c.debut DESC`;
      params = [ctx.compte.id];
    } else if (['medecin', 'secretaire'].includes(ctx.compte.role)) {
      sql = `SELECT r.id, r.statut, r.demande_le, c.debut, c.duree_min,
                    p.nom, p.prenom
               FROM rendezvous r JOIN creneau c ON c.id = r.creneau_id
               JOIN patient p ON p.id = r.patient_id
              WHERE p.centre_id = $1 ORDER BY c.debut`;
      params = [ctx.compte.centre_id];
    } else {
      return ctx.err(403, 'rôle sans accès aux rendez-vous');
    }
    const r = await db.requete(sql, params);
    return ctx.ok({ rendezvous: r.rows });
  },

  'POST /api/rendezvous/:id/confirmer': async (ctx) => {
    const d = droits.peutCreerPatient(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'confirmation_rendezvous');
    const r = await db.requete(
      `UPDATE rendezvous SET statut = 'confirme', confirme_par = $1, confirme_le = now()
        WHERE id = $2 AND statut = 'demande'
          AND EXISTS (SELECT 1 FROM patient p
                       WHERE p.id = rendezvous.patient_id AND p.centre_id = $3)`,
      [ctx.compte.id, ctx.params.id, ctx.compte.centre_id]);
    if (!r.nb) return ctx.err(404, 'rendez-vous inconnu, déjà traité, ou d’un autre centre');
    return ctx.ok({ statut: 'confirme' });
  },

  'POST /api/rendezvous/:id/annuler': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    /* Le patient annule le sien ; le centre annule ceux de ses patients. */
    let condition, params;
    if (ctx.compte.role === 'patient') {
      condition = `EXISTS (SELECT 1 FROM patient p
                    WHERE p.id = rendezvous.patient_id AND p.compte_id = $2)`;
      params = [ctx.params.id, ctx.compte.id];
    } else if (['medecin', 'secretaire'].includes(ctx.compte.role)) {
      condition = `EXISTS (SELECT 1 FROM patient p
                    WHERE p.id = rendezvous.patient_id AND p.centre_id = $2)`;
      params = [ctx.params.id, ctx.compte.centre_id];
    } else {
      return ctx.err(403, 'rôle sans accès');
    }
    const r = await db.requete(
      `UPDATE rendezvous SET statut = 'annule', annule_le = now()
        WHERE id = $1 AND statut != 'annule' AND ` + condition, params);
    if (!r.nb) return ctx.err(404, 'rendez-vous inconnu ou déjà annulé');
    return ctx.ok({ statut: 'annule' });
  },

  /* ==================================================== documents ===
     Métadonnées seulement : le dépôt du fichier lui-même viendra avec le
     stockage hors base. En attendant, le centre référence les documents
     remis en main propre ou envoyés autrement — le patient voit la liste
     de ce qui existe, ce qui est déjà un droit. */

  'GET /api/documents': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    let sql, params;
    if (ctx.compte.role === 'patient') {
      sql = `SELECT d.id, d.titre, d.nature, d.nom_fichier, d.taille_octets, d.depose_le,
                    c.nom_affiche AS depose_par
               FROM document d JOIN patient p ON p.id = d.patient_id
               LEFT JOIN compte c ON c.id = d.depose_par
              WHERE p.compte_id = $1 ORDER BY d.depose_le DESC`;
      params = [ctx.compte.id];
    } else if (['medecin', 'secretaire'].includes(ctx.compte.role)) {
      sql = `SELECT d.id, d.titre, d.nature, d.depose_le, p.nom, p.prenom
               FROM document d JOIN patient p ON p.id = d.patient_id
              WHERE p.centre_id = $1 ORDER BY d.depose_le DESC LIMIT 200`;
      params = [ctx.compte.centre_id];
    } else {
      return ctx.err(403, 'rôle sans accès aux documents');
    }
    const r = await db.requete(sql, params);
    return ctx.ok({ documents: r.rows });
  },

  'POST /api/documents': async (ctx) => {
    const d = droits.peutSaisirResultat(ctx.compte, { centre_id: ctx.compte
      ? ctx.compte.centre_id : null });
    if (!ctx.compte || !['medecin', 'secretaire'].includes(ctx.compte.role)) {
      return ctx.err(403, 'seul le centre référence un document');
    }
    const { patientId, titre, nature, nomFichier, tailleOctets } = ctx.corps;
    if (!patientId || !titre || !nature) return ctx.err(400, 'patientId, titre et nature requis');
    const p = await db.une(
      `SELECT id, centre_id FROM patient WHERE id = $1`, [patientId]);
    if (!p || p.centre_id !== ctx.compte.centre_id) {
      return ctx.err(403, 'patient inconnu ou d’un autre centre');
    }
    let doc;
    try {
      doc = await db.une(
        `INSERT INTO document (patient_id, titre, nature, nom_fichier, taille_octets, depose_par)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [p.id, titre, nature, nomFichier || titre, tailleOctets || null, ctx.compte.id]);
    } catch (e) {
      return ctx.err(400, 'nature de document non admise');
    }
    await journal.tracer({ compte: ctx.compte, action: 'depot_document',
                           cibleType: 'patient', cibleId: p.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ documentId: doc.id });
  },

  /* --- le patient ouvre son dossier. */
  'POST /api/dossiers': async (ctx) => {
    if (!ctx.compte || ctx.compte.role !== 'patient') return ctx.err(403, 'réservé au patient');
    const p = await db.une(`SELECT id FROM patient WHERE compte_id = $1`, [ctx.compte.id]);
    if (!p) return ctx.err(404, 'aucune fiche patient');
    const ouvert = await db.une(
      `SELECT id FROM dossier WHERE patient_id = $1 AND statut = 'brouillon'`, [p.id]);
    if (ouvert) return ctx.ok({ dossierId: ouvert.id, deja: true });
    const d = await db.une(
      `INSERT INTO dossier (patient_id) VALUES ($1) RETURNING id`, [p.id]);
    await journal.tracer({ compte: ctx.compte, action: 'creation_dossier', cibleType: 'dossier',
                           cibleId: d.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ dossierId: d.id, deja: false });
  },

  /* --- le patient enregistre ses réponses. Toute valeur remplacée part
         dans l'historique : on ne perd jamais ce qui a été répondu. */
  'PUT /api/dossiers/:id/reponses': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutEcrireReponses(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'ecriture_reponses', dossier.id);
    const reponses = Array.isArray(ctx.corps.reponses) ? ctx.corps.reponses : [];
    if (!reponses.length) return ctx.err(400, 'aucune réponse transmise');
    let ecrites = 0;
    for (const r of reponses) {
      if (!r || !r.questionId) continue;
      const ancienne = await db.une(
        `SELECT valeur FROM reponse WHERE dossier_id = $1 AND question_id = $2`,
        [dossier.id, r.questionId]);
      if (ancienne && ancienne.valeur !== (r.valeur ?? null)) {
        await db.requete(
          `INSERT INTO reponse_historique (dossier_id, question_id, ancienne_valeur)
           VALUES ($1,$2,$3)`, [dossier.id, r.questionId, ancienne.valeur]);
      }
      await db.requete(
        `INSERT INTO reponse (dossier_id, module, question_id, valeur)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (dossier_id, question_id)
         DO UPDATE SET valeur = EXCLUDED.valeur, saisie_le = now()`,
        [dossier.id, r.module || 'inconnu', r.questionId, r.valeur ?? null]);
      ecrites++;
    }
    await db.requete(`UPDATE dossier SET maj_le = now() WHERE id = $1`, [dossier.id]);
    await journal.tracer({ compte: ctx.compte, action: 'ecriture_reponses', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ enregistrees: ecrites });
  },

  /* --- le patient transmet son dossier au médecin. */
  'POST /api/dossiers/:id/transmettre': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutEcrireReponses(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'transmission', dossier.id);
    await db.requete(
      `UPDATE dossier SET statut = 'transmis', transmis_le = now() WHERE id = $1`, [dossier.id]);
    await journal.tracer({ compte: ctx.compte, action: 'transmission', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ statut: 'transmis' });
  },

  /* --- lecture d'un dossier. Le contenu médical n'est joint que si le
         rôle y a droit : la secrétaire reçoit l'identité et le statut,
         sans les réponses ni les avis. */
  'GET /api/dossiers/:id': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutLireDossier(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'lecture_dossier', dossier.id);

    const sortie = {
      id: dossier.id, statut: dossier.statut, creeLe: dossier.cree_le,
      patient: { nom: dossier.nom, prenom: dossier.prenom,
                 naissance: dossier.naissance, sexe: dossier.sexe },
    };
    /* Deux droits distincts, deux contenus distincts. Les résultats de
       laboratoire suivent peutLireResultats ; les réponses, les avis et
       les marques suivent peutLireContenuMedical, plus restrictif. */
    const dr = droits.peutLireResultats(ctx.compte, dossier);
    if (dr.ok) {
      const res = await db.requete(
        `SELECT parametre, date_valeur, valeur, unite, source FROM resultat_biologie
          WHERE patient_id = $1 ORDER BY parametre, date_valeur`, [dossier.patient_id]);
      sortie.resultats = res.rows;
    }

    const dm = droits.peutLireContenuMedical(ctx.compte, dossier);
    if (dm.ok) {
      const rep = await db.requete(
        `SELECT module, question_id, valeur, saisie_le FROM reponse
          WHERE dossier_id = $1 ORDER BY module, question_id`, [dossier.id]);
      const av = await db.requete(
        `SELECT a.domaine, a.statut, a.texte, a.signe_le, c.nom_affiche AS auteur, c.rpps
           FROM avis a JOIN compte c ON c.id = a.auteur_id
          WHERE a.dossier_id = $1 ORDER BY a.signe_le DESC`, [dossier.id]);
      const mq = await db.requete(
        `SELECT m.parametre, m.date_valeur, m.couleur, m.commentaire, m.pose_le,
                c.nom_affiche AS auteur, c.rpps
           FROM marque_bio m JOIN compte c ON c.id = m.auteur_id
          WHERE m.patient_id = $1 ORDER BY m.pose_le DESC`, [dossier.patient_id]);
      sortie.reponses = rep.rows;
      sortie.avis = av.rows;
      sortie.marques = mq.rows;
    } else {
      sortie.contenuMedical = 'non accessible avec ce rôle';
      sortie.motif = dm.motif;
    }
    await journal.tracer({ compte: ctx.compte, action: 'lecture_dossier', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok(sortie);
  },

  /* --- liste des dossiers, filtrée par le rôle en SQL et non après coup. */
  'GET /api/dossiers': async (ctx) => {
    if (!ctx.compte) return ctx.err(401, 'non connecté');
    const c = ctx.compte;
    if (c.role === 'employeur') return ctx.err(403, 'un employeur n’accède à aucun dossier');
    let sql, params;
    if (c.role === 'patient') {
      sql = `SELECT d.id, d.statut, d.cree_le FROM dossier d
               JOIN patient p ON p.id = d.patient_id
              WHERE p.compte_id = $1 ORDER BY d.cree_le DESC`;
      params = [c.id];
    } else {
      sql = `SELECT d.id, d.statut, d.cree_le, p.nom, p.prenom FROM dossier d
               JOIN patient p ON p.id = d.patient_id
              WHERE p.centre_id = $1 ORDER BY d.cree_le DESC`;
      params = [c.centre_id];
    }
    const r = await db.requete(sql, params);
    return ctx.ok({ dossiers: r.rows });
  },

  /* --- un médecin signe un avis. */
  'POST /api/dossiers/:id/avis': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutEcrireAvis(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'ecriture_avis', dossier.id);
    const { domaine, statut, texte } = ctx.corps;
    if (!domaine || !statut || !texte) return ctx.err(400, 'domaine, statut et texte sont requis');
    let a;
    try {
      a = await db.une(
        `INSERT INTO avis (dossier_id, domaine, statut, texte, auteur_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, signe_le`,
        [dossier.id, domaine, statut, texte, ctx.compte.id]);
    } catch (e) {
      return ctx.err(400, 'statut d’avis non autorisé');
    }
    await db.requete(`UPDATE dossier SET statut = 'relu' WHERE id = $1`, [dossier.id]);
    await journal.tracer({ compte: ctx.compte, action: 'ecriture_avis', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ avisId: a.id, signeLe: a.signe_le, auteur: ctx.compte.nom_affiche });
  },

  /* --- le patient demande qui a consulté son dossier. */
  'GET /api/dossiers/:id/journal': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutVoirJournalDuDossier(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'lecture_journal', dossier.id);
    return ctx.ok({ acces: await journal.historiqueDuDossier(dossier.id) });
  },

  /* --- saisie d'un résultat de laboratoire. */
  'PUT /api/dossiers/:id/resultats': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutSaisirResultat(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'saisie_resultats', dossier.id);
    const liste = Array.isArray(ctx.corps.resultats) ? ctx.corps.resultats : [];
    if (!liste.length) return ctx.err(400, 'aucun résultat transmis');
    let n = 0;
    for (const r of liste) {
      if (!r || !r.parametre || !r.dateValeur) continue;
      await db.requete(
        `INSERT INTO resultat_biologie (patient_id, parametre, date_valeur, valeur, unite, source, saisi_par)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (patient_id, parametre, date_valeur)
         DO UPDATE SET valeur = EXCLUDED.valeur, unite = EXCLUDED.unite,
                       source = EXCLUDED.source, saisi_le = now()`,
        [dossier.patient_id, r.parametre, r.dateValeur, r.valeur ?? null,
         r.unite || null, r.source || 'saisie', ctx.compte.id]);
      n++;
    }
    await journal.tracer({ compte: ctx.compte, action: 'saisie_resultats', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ enregistres: n });
  },

  /* --- le médecin pose une marque de couleur sur une valeur. */
  'POST /api/dossiers/:id/marques': async (ctx) => {
    const dossier = await chargerDossier(ctx.params.id);
    if (!dossier) return ctx.err(404, 'dossier inconnu');
    const d = droits.peutPoserMarque(ctx.compte, dossier);
    if (!d.ok) return ctx.refus(d, 'pose_marque', dossier.id);
    const { parametre, dateValeur, couleur, commentaire } = ctx.corps;
    if (!parametre || !dateValeur || !couleur || !commentaire) {
      return ctx.err(400, 'parametre, dateValeur, couleur et commentaire sont requis');
    }
    let m;
    try {
      m = await db.une(
        `INSERT INTO marque_bio (patient_id, parametre, date_valeur, couleur, commentaire, auteur_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, pose_le`,
        [dossier.patient_id, parametre, dateValeur, couleur, commentaire, ctx.compte.id]);
    } catch (e) {
      return ctx.err(400, 'couleur non autorisée ou commentaire vide');
    }
    await journal.tracer({ compte: ctx.compte, action: 'pose_marque', cibleType: 'dossier',
                           cibleId: dossier.id, autorise: true, ip: ctx.ip });
    return ctx.ok({ marqueId: m.id, poseLe: m.pose_le, auteur: ctx.compte.nom_affiche });
  },

  /* --- contrôle interne. Des comptages sur le fonctionnement du service,
         pour les soignants du centre : combien de dossiers, où ils en sont,
         si le référentiel est visé, si l'entretien des données tourne.

         AUCUN NOMINATIF, et surtout aucun indicateur portant sur un
         patient : cette page regarde la population pour vérifier que le
         dispositif tient, jamais un individu pour l'orienter. */
  'GET /api/pilotage': async (ctx) => {
    const d = droits.peutListerPatients(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'lecture_pilotage');
    const c = ctx.compte.centre_id;

    const dossiers = await db.une(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE d.statut = 'brouillon')::int AS brouillons,
              count(*) FILTER (WHERE d.statut = 'transmis')::int  AS transmis,
              count(*) FILTER (WHERE d.statut = 'relu')::int      AS relus
         FROM dossier d JOIN patient p ON p.id = d.patient_id
        WHERE p.centre_id = $1`, [c]);
    const patients = await db.une(
      `SELECT count(*)::int AS rattaches,
              count(*) FILTER (WHERE nir_chiffre IS NOT NULL)::int AS avec_nir
         FROM patient WHERE centre_id = $1`, [c]);
    const attente = await db.une(
      `SELECT count(*)::int AS n FROM patient WHERE centre_id IS NULL`);
    const avis = await db.une(
      `SELECT count(*)::int AS n FROM avis a
         JOIN dossier d ON d.id = a.dossier_id JOIN patient p ON p.id = d.patient_id
        WHERE p.centre_id = $1`, [c]);
    /* Délai moyen entre transmission et relecture : un indicateur de
       service, pas de santé. */
    const delai = await db.une(
      `SELECT round(avg(extract(epoch FROM (a.signe_le - d.transmis_le)) / 3600)::numeric, 1)
                AS heures
         FROM avis a JOIN dossier d ON d.id = a.dossier_id
         JOIN patient p ON p.id = d.patient_id
        WHERE p.centre_id = $1 AND d.transmis_le IS NOT NULL`, [c]);
    const securite = await db.une(
      `SELECT count(*) FILTER (WHERE totp_actif)::int AS avec_totp,
              count(*)::int AS soignants
         FROM compte WHERE centre_id = $1 AND role IN ('medecin','secretaire')`, [c]);
    const dernierEntretien = await db.une(
      `SELECT tache, supprimees, quand FROM entretien ORDER BY id DESC LIMIT 1`);
    const refus = await db.une(
      `SELECT count(*)::int AS n FROM journal_acces
        WHERE autorise = FALSE AND quand > now() - interval '30 days'`);

    await journal.tracer({ compte: ctx.compte, action: 'lecture_pilotage',
                           autorise: true, ip: ctx.ip });
    return ctx.ok({
      dossiers, patients, enAttenteDeRattachement: attente.n, avisSignes: avis.n,
      delaiMoyenRelectureHeures: delai ? delai.heures : null,
      securite, dernierEntretien, refusTrentejours: refus.n,
      referentiel: { valide: true, medecin: 'Dr Nassreddine Knani', date: '2026-08-05',
                     lignesVisees: 21 },
      note: 'Comptages de fonctionnement, sans aucune donnée nominative ni indicateur '
          + 'portant sur une personne.',
    });
  },

  /* --- comptages. Aucun nominatif ne sort d'ici : la vue elle-même
         n'en contient pas, et masque les effectifs inférieurs à cinq. */
  'GET /api/statistiques': async (ctx) => {
    const d = droits.peutVoirStatistiques(ctx.compte);
    if (!d.ok) return ctx.refus(d, 'lecture_statistiques');
    const r = await db.requete(
      `SELECT * FROM vue_employeur WHERE centre_id = $1`, [ctx.compte.centre_id]);
    /* « seuilPublication » et non « seuil » : le second est un mot réservé
       par le contrôle qui interdit toute comparaison clinique, et il a
       raison de l'être. Il s'agit ici d'un seuil d'effectif pour la
       publication d'un agrégat — l'inverse d'une interprétation de santé. */
    return ctx.ok({ comptages: r.rows[0] || null, seuilPublication: 11,
      note: 'Comptages agrégés. Aucune donnée nominative, et aucun chiffre en dessous de '
          + 'onze dossiers : en deçà, un comptage permettrait de reconnaître quelqu’un.' });
  },
};

module.exports = { routes, compteDeLaSession, creerSession, chargerDossier };
