-- =====================================================================
--  PRÉVENTION SANTÉ — SCHÉMA DE LA BASE DE DONNÉES
--  PostgreSQL 14 ou supérieur.
--
--  PRINCIPES QUI ONT GUIDÉ CE SCHÉMA
--
--  1. Une réponse par ligne, jamais un bloc JSON opaque.
--     On peut ainsi retrouver qui a répondu quoi, quand, et conserver
--     l'historique d'une correction sans écraser la valeur précédente.
--
--  2. Le secret médical est dans la structure, pas dans le code.
--     Les résultats (reponse, avis) sont séparés de l'identité
--     administrative (patient) et des comptes. La secrétaire travaille
--     sur les secondes et n'a rien à faire dans les premières.
--
--  3. Tout accès à un dossier est journalisé.
--     Table journal_acces, écrite à chaque lecture. C'est une exigence
--     de l'hébergement de données de santé, et la seule façon de
--     répondre à « qui a consulté mon dossier ? ».
--
--  4. Aucune interprétation en base.
--     Aucune vue ne calcule un score, ne compare à un seuil, ne classe
--     un patient. Un avis n'existe que si un médecin l'a écrit et signé.
-- =====================================================================

-- ------------------------------------------------------------- centres
CREATE TABLE centre (
  id          SERIAL PRIMARY KEY,
  nom         TEXT NOT NULL,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------- comptes
-- Un compte = une personne qui se connecte. Le rôle détermine ce
-- qu'elle voit ; il n'est jamais déduit d'autre chose.
CREATE TABLE compte (
  id            SERIAL PRIMARY KEY,
  courriel      TEXT NOT NULL UNIQUE,
  mdp_hash      TEXT NOT NULL,          -- scrypt, jamais le mot de passe
  role          TEXT NOT NULL CHECK (role IN ('patient','medecin','secretaire','employeur')),
  centre_id     INTEGER REFERENCES centre(id),
  nom_affiche   TEXT NOT NULL,
  rpps          TEXT,                    -- médecins uniquement
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
  derniere_connexion TIMESTAMPTZ,
  -- Un soignant appartient toujours à un centre ; un patient peut ne pas
  -- encore être rattaché (inscription libre en attente de validation).
  CONSTRAINT soignant_a_un_centre
    CHECK (role = 'patient' OR centre_id IS NOT NULL)
);
CREATE INDEX idx_compte_courriel ON compte(lower(courriel));

-- ------------------------------------------------------------ patients
-- Identité administrative. Séparée des résultats médicaux.
-- Le numéro de sécurité sociale n'est PAS ici : il devra être ajouté
-- avec un chiffrement applicatif dédié, ce qui est un chantier en soi.
CREATE TABLE patient (
  id            SERIAL PRIMARY KEY,
  /* Nullable, et ON DELETE SET NULL : après un effacement de compte, la
     fiche subsiste sans identité et sans propriétaire, le temps de la
     conservation légale du dossier médical. Une contrainte NOT NULL
     rendait cette dissociation impossible — et donc le droit à
     l'effacement inapplicable sans détruire le dossier. */
  compte_id     INTEGER UNIQUE REFERENCES compte(id) ON DELETE SET NULL,
  nom           TEXT NOT NULL,
  prenom        TEXT NOT NULL,
  naissance     DATE,
  sexe          TEXT CHECK (sexe IN ('F','M','autre','non renseigne')),
  centre_id     INTEGER REFERENCES centre(id),
  rattache_le   TIMESTAMPTZ,
  rattache_par  INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  cree_le       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_centre ON patient(centre_id);

-- ------------------------------------------------------------ dossiers
CREATE TABLE dossier (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER NOT NULL REFERENCES patient(id),
  statut      TEXT NOT NULL DEFAULT 'brouillon'
              CHECK (statut IN ('brouillon','transmis','relu')),
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  transmis_le TIMESTAMPTZ,
  maj_le      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dossier_patient ON dossier(patient_id);

-- ------------------------------------------------------------ réponses
-- Une ligne par question répondue. La valeur est du texte : c'est ce
-- que la personne a répondu, pas une donnée interprétée.
CREATE TABLE reponse (
  id           BIGSERIAL PRIMARY KEY,
  dossier_id   INTEGER NOT NULL REFERENCES dossier(id) ON DELETE CASCADE,
  module       TEXT NOT NULL,
  question_id  TEXT NOT NULL,
  valeur       TEXT,
  saisie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dossier_id, question_id)
);
CREATE INDEX idx_reponse_dossier ON reponse(dossier_id);

-- Historique des corrections : on ne perd jamais une valeur précédente.
CREATE TABLE reponse_historique (
  id            BIGSERIAL PRIMARY KEY,
  dossier_id    INTEGER NOT NULL,
  question_id   TEXT NOT NULL,
  ancienne_valeur TEXT,
  remplacee_le  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- avis
-- Un avis n'existe que signé, par un médecin identifié, à une date.
-- Le statut est choisi par le médecin : rien ne le propose.
CREATE TABLE avis (
  id           SERIAL PRIMARY KEY,
  dossier_id   INTEGER NOT NULL REFERENCES dossier(id) ON DELETE CASCADE,
  domaine      TEXT NOT NULL,
  statut       TEXT NOT NULL CHECK (statut IN
                 ('dans les valeurs usuelles','a surveiller','a interpreter avec votre medecin')),
  texte        TEXT NOT NULL,
  auteur_id    INTEGER NOT NULL REFERENCES compte(id),
  signe_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_avis_dossier ON avis(dossier_id);

-- ------------------------------------------------------------ sessions
-- Sessions en base et non en jeton signé : une session peut être
-- révoquée immédiatement. En santé, pouvoir couper un accès tout de
-- suite compte plus que d'économiser une requête.
CREATE TABLE session (
  id         TEXT PRIMARY KEY,          -- aléatoire, 256 bits
  compte_id  INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
  cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expire_le  TIMESTAMPTZ NOT NULL,
  ip         TEXT,
  agent      TEXT
);
CREATE INDEX idx_session_compte ON session(compte_id);

-- ------------------------------------------------------- journal d'accès
-- Écrit à chaque lecture ou écriture portant sur un dossier.
-- Ne contient aucune donnée de santé : qui, quoi, quand, sur quel objet.
CREATE TABLE journal_acces (
  id          BIGSERIAL PRIMARY KEY,
  /* ON DELETE SET NULL : quand un compte est effacé, la trace SUBSISTE
     mais perd son lien vers l'identité. C'est la seule issue à une
     tension réelle — le journal doit être conservé, comme preuve pour la
     personne concernée et comme exigence de l'hébergement de données de
     santé, alors que le compte doit pouvoir disparaître. On garde donc
     quoi et quand, on perd qui. Sans cela, un effacement échouait sur la
     contrainte de clé étrangère, ou bien aurait détruit le journal. */
  compte_id   INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  role        TEXT,
  action      TEXT NOT NULL,            -- lecture, ecriture, connexion, echec
  cible_type  TEXT,                     -- dossier, patient, compte
  cible_id    INTEGER,
  autorise    BOOLEAN NOT NULL,
  ip          TEXT,
  quand       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_journal_quand ON journal_acces(quand);
CREATE INDEX idx_journal_cible ON journal_acces(cible_type, cible_id);

-- --------------------------------------------- vue pour l'employeur
-- Ce que le DRH peut voir : des comptages, par centre, et rien d'autre.
-- Aucun nom, aucune date de naissance, aucun identifiant de patient.
--
-- SEUIL DE ONZE, ET NON DE CINQ.
-- La page entreprise applique SEUIL_PUBLICATION = 11 et son commentaire
-- affirme que sous ce seuil « la valeur n'est jamais calculée ni
-- transmise ». C'était faux : cette vue publiait à partir de cinq, donc
-- le chiffre quittait le serveur et n'était masqué qu'à l'affichage. Un
-- masquage côté navigateur n'est pas une protection — il suffit de
-- regarder la réponse de l'API.
--
-- Les deux seuils sont désormais alignés sur le plus strict, et le
-- contrôle croisé est dans les tests. Changer l'un sans l'autre fera
-- échouer la série.
CREATE VIEW vue_employeur AS
SELECT p.centre_id,
       count(DISTINCT d.id)                                        AS bilans_total,
       count(DISTINCT d.id) FILTER (WHERE d.statut = 'transmis')    AS bilans_transmis,
       count(DISTINCT d.id) FILTER (WHERE d.statut = 'relu')        AS bilans_relus
FROM dossier d
JOIN patient p ON p.id = d.patient_id
GROUP BY p.centre_id
HAVING count(DISTINCT d.id) >= 11;

-- =====================================================================
--  RÉSULTATS DE BIOLOGIE ET MARQUES DU MÉDECIN
--  Ajoutés après le premier branchement de l'interface : les écrans
--  affichaient des valeurs de laboratoire et des marques de couleur qui
--  n'avaient aucune table pour les recevoir. Sans ces deux tables, le
--  branchement aurait été à moitié faux — les questionnaires en base et
--  la biologie encore en démonstration.
-- =====================================================================

-- Une valeur mesurée, à une date. Rien d'interprété : ni normale, ni
-- anormale, ni écart. Ce n'est qu'un nombre et son unité.
CREATE TABLE resultat_biologie (
  id           BIGSERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  parametre    TEXT NOT NULL,           -- identifiant du paramètre (ferr, gly, tsh…)
  date_valeur  DATE NOT NULL,
  valeur       NUMERIC,
  unite        TEXT,
  source       TEXT,                    -- laboratoire, saisie manuelle, import
  saisi_par    INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  saisi_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, parametre, date_valeur)
);
CREATE INDEX idx_resultat_patient ON resultat_biologie(patient_id, parametre);

-- La marque de couleur posée sur une valeur précise.
--
-- ELLE N'EXISTE QUE PARCE QU'UN MÉDECIN L'A CHOISIE. C'est la règle du
-- projet : aucune couleur évaluative n'apparaît sans un auteur et une
-- date. Les colonnes auteur_id et pose_le sont donc NOT NULL, et la
-- contrainte de couleur limite le vocabulaire aux trois teintes déjà
-- employées côté patient. Aucune valeur par défaut : le logiciel ne
-- propose pas de couleur, il enregistre celle du médecin.
CREATE TABLE marque_bio (
  id           BIGSERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  parametre    TEXT NOT NULL,
  date_valeur  DATE NOT NULL,
  couleur      TEXT NOT NULL CHECK (couleur IN ('vert','orange','rouge')),
  commentaire  TEXT NOT NULL CHECK (length(trim(commentaire)) > 0),
  auteur_id    INTEGER NOT NULL REFERENCES compte(id),
  pose_le      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_marque_patient ON marque_bio(patient_id, parametre, date_valeur);

-- =====================================================================
--  GARDE-FOUS D'ACCÈS
--  Sans eux, rien n'empêche d'essayer des milliers de mots de passe, et
--  un mot de passe oublié condamne le compte. Trois mécanismes, trois
--  tables, aucune donnée de santé dans aucune.
-- =====================================================================

-- Tentatives de connexion. On enregistre l'échec, jamais le mot de passe
-- essayé — un journal contenant des mots de passe voisins des vrais est
-- une cible, pas une protection.
CREATE TABLE tentative_connexion (
  id         BIGSERIAL PRIMARY KEY,
  courriel   TEXT,                      -- tel que saisi, même s'il n'existe pas
  ip         TEXT,
  reussie    BOOLEAN NOT NULL,
  quand      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tentative_courriel ON tentative_connexion(lower(courriel), quand);
CREATE INDEX idx_tentative_ip ON tentative_connexion(ip, quand);

-- Jetons de réinitialisation. Le jeton n'est PAS stocké : seul son
-- condensat l'est. Une fuite de cette table ne permet donc pas de
-- prendre la main sur un compte, ce qui serait le comble pour une table
-- censée réparer un accès perdu.
CREATE TABLE jeton_reinitialisation (
  id         BIGSERIAL PRIMARY KEY,
  compte_id  INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
  jeton_hash TEXT NOT NULL UNIQUE,
  expire_le  TIMESTAMPTZ NOT NULL,
  utilise_le TIMESTAMPTZ,               -- usage unique : renseigné à la première utilisation
  cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_demande TEXT
);
CREATE INDEX idx_jeton_compte ON jeton_reinitialisation(compte_id);

-- Second facteur (TOTP). Obligatoire pour les rôles qui accèdent à
-- plusieurs dossiers : un mot de passe de médecin qui fuite ouvrirait
-- tous les dossiers du centre, là où celui d'un patient n'ouvre que le
-- sien. La contrainte de proportionnalité joue dans ce sens.
ALTER TABLE compte ADD COLUMN totp_secret TEXT;
ALTER TABLE compte ADD COLUMN totp_actif BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE compte ADD COLUMN totp_dernier_pas BIGINT;  -- empêche de rejouer un code

-- Une session sait si le second facteur a été franchi : tant qu'il ne
-- l'est pas, elle ne donne accès à rien d'autre qu'à la vérification.
ALTER TABLE session ADD COLUMN totp_valide BOOLEAN NOT NULL DEFAULT FALSE;

-- =====================================================================
--  CODES DE SECOURS, ET ENTRETIEN
-- =====================================================================

-- Codes de secours du second facteur.
--
-- POURQUOI ILS SONT INDISPENSABLES
-- Sans eux, un médecin qui perd son téléphone ne peut plus se connecter,
-- et il faut intervenir dans la base pour le débloquer. Cela signifie
-- qu'un incident banal exige un accès administrateur à une base de
-- données de santé — c'est le contraire de ce qu'on veut.
--
-- Comme pour les jetons de réinitialisation, seul le condensat est
-- stocké : une fuite de cette table ne permet pas de se connecter.
CREATE TABLE code_secours (
  id         BIGSERIAL PRIMARY KEY,
  compte_id  INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  utilise_le TIMESTAMPTZ,
  cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (compte_id, code_hash)
);
CREATE INDEX idx_secours_compte ON code_secours(compte_id) WHERE utilise_le IS NULL;

-- Trace des passages d'entretien : sans elle, on ne sait pas si la purge
-- tourne réellement, et une purge qu'on croit active mais qui ne tourne
-- pas est un manquement invisible.
CREATE TABLE entretien (
  id         BIGSERIAL PRIMARY KEY,
  tache      TEXT NOT NULL,
  supprimees INTEGER NOT NULL DEFAULT 0,
  quand      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
--  NUMÉRO DE SÉCURITÉ SOCIALE — CHIFFRÉ DANS LA COLONNE
--
--  Il n'était volontairement pas dans le schéma initial : l'ajouter en
--  clair aurait été pire que de l'omettre. Il arrive maintenant, chiffré
--  en AES-256-GCM par src/chiffre.js, avec une clé qui vit dans
--  l'environnement et non dans la base.
--
--  Deux colonnes, deux usages :
--    nir_chiffre   la valeur, illisible sans la clé ;
--    nir_empreinte un HMAC salé par la même clé, pour pouvoir RECHERCHER
--                  un patient par son numéro sans déchiffrer toute la
--                  table. Le chiffrement GCM donne un résultat différent
--                  à chaque appel — c'est ce qui le rend sûr, et ce qui
--                  le rend impossible à interroger directement.
--
--  Une base copiée sans la clé ne livre aucun numéro.
-- =====================================================================
ALTER TABLE patient ADD COLUMN nir_chiffre TEXT;
ALTER TABLE patient ADD COLUMN nir_empreinte TEXT;
ALTER TABLE patient ADD COLUMN nir_saisi_le TIMESTAMPTZ;
ALTER TABLE patient ADD COLUMN nir_saisi_par INTEGER REFERENCES compte(id) ON DELETE SET NULL;
CREATE INDEX idx_patient_nir ON patient(nir_empreinte) WHERE nir_empreinte IS NOT NULL;

-- =====================================================================
--  CONSENTEMENT
--
--  Les données de santé relèvent de l'article 9 du RGPD : leur traitement
--  suppose un consentement EXPLICITE, et il faut pouvoir prouver quand il
--  a été donné, sur quelle version du texte, et qu'il a été retiré si tel
--  est le cas.
--
--  On conserve donc l'empreinte du texte accepté, et non seulement une
--  case cochée. Si le texte change, on saura que cette personne a accepté
--  l'ancien — ce qu'une simple colonne booléenne ne dirait pas.
-- =====================================================================
CREATE TABLE consentement (
  id           BIGSERIAL PRIMARY KEY,
  compte_id    INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
  version      TEXT NOT NULL,
  texte_hash   TEXT NOT NULL,
  donne_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip           TEXT,
  retire_le    TIMESTAMPTZ
);
CREATE INDEX idx_consentement_compte ON consentement(compte_id);

-- Demandes d'effacement, et ce qui en a été fait.
-- Un dossier médical est soumis à des obligations de conservation qui
-- limitent le droit à l'effacement : la trace de la demande et de sa
-- réponse est donc nécessaire, y compris quand la réponse est partielle.
CREATE TABLE demande_effacement (
  id           BIGSERIAL PRIMARY KEY,
  compte_id    INTEGER,
  courriel     TEXT,
  demande_le   TIMESTAMPTZ NOT NULL DEFAULT now(),
  traite_le    TIMESTAMPTZ,
  portee       TEXT,          -- ce qui a effectivement été supprimé ou anonymisé
  ip           TEXT
);
