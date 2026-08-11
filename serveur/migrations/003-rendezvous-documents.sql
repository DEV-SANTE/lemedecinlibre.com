-- =====================================================================
--  RENDEZ-VOUS ET DOCUMENTS
--  Migration 003. Les deux premiers modules de l'espace patient qui
--  étaient restés des maquettes : ils affichaient des centres de test et
--  des créneaux codés en dur, sans aucun appel au serveur.
-- =====================================================================

-- Un rendez-vous est demandé par le patient et confirmé par le centre.
-- Le logiciel ne propose aucun créneau de lui-même : le secrétariat les
-- publie, le patient en choisit un. Rien n'est déduit de son dossier —
-- proposer un créneau « adapté à votre profil » serait une orientation.
CREATE TABLE creneau (
  id          SERIAL PRIMARY KEY,
  centre_id   INTEGER NOT NULL REFERENCES centre(id),
  debut       TIMESTAMPTZ NOT NULL,
  duree_min   INTEGER NOT NULL DEFAULT 30,
  publie_par  INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (centre_id, debut)
);
CREATE INDEX idx_creneau_centre ON creneau(centre_id, debut);

CREATE TABLE rendezvous (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  creneau_id  INTEGER NOT NULL UNIQUE REFERENCES creneau(id),
  statut      TEXT NOT NULL DEFAULT 'demande'
              CHECK (statut IN ('demande','confirme','annule')),
  demande_le  TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirme_par INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  confirme_le TIMESTAMPTZ,
  annule_le   TIMESTAMPTZ
);
CREATE INDEX idx_rdv_patient ON rendezvous(patient_id);

-- Documents remis au patient : compte-rendu, attestation, résultat au
-- format PDF. Le fichier lui-même est stocké hors base ; la table porte
-- les métadonnées et le chemin.
--
-- IMPORTANT : le contenu vit dans un répertoire dédié, jamais sous la
-- racine web. Un document médical servi par nginx comme un fichier
-- statique serait lisible sans session.
CREATE TABLE document (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  titre        TEXT NOT NULL,
  nature       TEXT NOT NULL CHECK (nature IN
                 ('compte-rendu','attestation','resultat','autre')),
  nom_fichier  TEXT NOT NULL,
  taille_octets INTEGER,
  depose_par   INTEGER REFERENCES compte(id) ON DELETE SET NULL,
  depose_le    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_document_patient ON document(patient_id);

-- Politiques RLS, cohérentes avec le reste : le patient voit les siens,
-- le centre voit ceux de ses patients.
ALTER TABLE rendezvous ENABLE ROW LEVEL SECURITY;
CREATE POLICY rdv_acces ON rendezvous USING (
  EXISTS (SELECT 1 FROM patient p WHERE p.id = rendezvous.patient_id AND (
    p.compte_id = app_compte_id()
    OR (app_role() IN ('medecin','secretaire') AND p.centre_id = app_centre_id()))));
CREATE POLICY rdv_creation ON rendezvous FOR INSERT WITH CHECK (true);

ALTER TABLE creneau ENABLE ROW LEVEL SECURITY;
-- Les créneaux libres sont visibles de tout compte connecté : il faut
-- pouvoir choisir un créneau avant d'avoir un rendez-vous.
CREATE POLICY creneau_lecture ON creneau FOR SELECT USING (true);
CREATE POLICY creneau_ecriture ON creneau FOR INSERT WITH CHECK (
  app_role() IN ('medecin','secretaire') AND centre_id = app_centre_id());

ALTER TABLE document ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_acces ON document USING (
  EXISTS (SELECT 1 FROM patient p WHERE p.id = document.patient_id AND (
    p.compte_id = app_compte_id()
    OR (app_role() IN ('medecin','secretaire') AND p.centre_id = app_centre_id()))));
CREATE POLICY document_creation ON document FOR INSERT WITH CHECK (true);
