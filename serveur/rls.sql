-- =====================================================================
--  ROW LEVEL SECURITY — LA SECONDE BARRIÈRE
--  À appliquer APRÈS schema.sql.
--
--  POURQUOI UNE SECONDE BARRIÈRE
--  Le cloisonnement des rôles vit aujourd'hui dans src/droits.js, et il
--  est vérifié par une centaine de contrôles. Mais il reste du code : une
--  requête écrite plus tard, dans un écran d'administration ou un script
--  d'export, peut oublier de passer par lui. PostgreSQL, lui, n'oublie
--  pas. Les politiques ci-dessous filtrent les lignes quoi qu'il arrive,
--  même si l'application se trompe.
--
--  COMMENT ÇA MARCHE
--  Le serveur ouvre chaque requête en annonçant qui il est :
--      SET LOCAL app.compte_id = '42';
--      SET LOCAL app.role      = 'medecin';
--      SET LOCAL app.centre_id = '1';
--  Les politiques comparent ces valeurs aux lignes. « LOCAL » limite
--  l'effet à la transaction en cours : aucune fuite d'une requête à la
--  suivante, même si la connexion est réutilisée.
--
--  DEUX AVERTISSEMENTS
--  1. Le propriétaire des tables et tout superutilisateur CONTOURNENT les
--     politiques. L'application doit donc se connecter avec le rôle
--     « prevention_appli » créé ci-dessous, jamais avec le propriétaire.
--     C'est le point que vérifiera un audit.
--  2. RLS ne remplace pas droits.js. Il rattrape les oublis ; il ne dit
--     pas de messages d'erreur compréhensibles, et il ne distingue pas
--     « interdit » de « inexistant ». Les deux couches sont utiles.
-- =====================================================================

-- Rôle applicatif, sans droit de contourner les politiques.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'prevention_appli') THEN
    CREATE ROLE prevention_appli NOLOGIN;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prevention_appli;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prevention_appli;

-- Lecture des réglages de session, avec des valeurs sûres par défaut :
-- si le serveur oublie de se présenter, aucune ligne ne passe.
CREATE OR REPLACE FUNCTION app_compte_id() RETURNS INTEGER
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.compte_id', true), ''), '0')::INTEGER $$;

CREATE OR REPLACE FUNCTION app_role() RETURNS TEXT
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.role', true), ''), 'aucun') $$;

CREATE OR REPLACE FUNCTION app_centre_id() RETURNS INTEGER
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.centre_id', true), ''), '0')::INTEGER $$;

-- ------------------------------------------------------------- patient
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_lecture ON patient FOR SELECT USING (
  -- le patient lui-même
  compte_id = app_compte_id()
  -- ou un soignant du même centre
  OR (app_role() IN ('medecin', 'secretaire') AND centre_id = app_centre_id())
  -- ou un soignant qui consulte les inscriptions non encore rattachées
  OR (app_role() IN ('medecin', 'secretaire') AND centre_id IS NULL)
);

CREATE POLICY patient_ecriture ON patient FOR UPDATE USING (
  app_role() IN ('medecin', 'secretaire')
  AND (centre_id = app_centre_id() OR centre_id IS NULL)
);

CREATE POLICY patient_creation ON patient FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------- dossier
ALTER TABLE dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY dossier_acces ON dossier USING (
  EXISTS (
    SELECT 1 FROM patient p WHERE p.id = dossier.patient_id AND (
      p.compte_id = app_compte_id()
      OR (app_role() IN ('medecin', 'secretaire') AND p.centre_id = app_centre_id())
    )
  )
);

-- ------------------------------------------------------------ réponses
-- Le secrétariat est exclu ici, et non seulement dans le code : c'est le
-- secret médical, il mérite d'être tenu par la base elle-même.
ALTER TABLE reponse ENABLE ROW LEVEL SECURITY;

CREATE POLICY reponse_acces ON reponse USING (
  EXISTS (
    SELECT 1 FROM dossier d JOIN patient p ON p.id = d.patient_id
     WHERE d.id = reponse.dossier_id AND (
       p.compte_id = app_compte_id()
       OR (app_role() = 'medecin' AND p.centre_id = app_centre_id())
     )
  )
);

-- ---------------------------------------------------------------- avis
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;

CREATE POLICY avis_acces ON avis USING (
  EXISTS (
    SELECT 1 FROM dossier d JOIN patient p ON p.id = d.patient_id
     WHERE d.id = avis.dossier_id AND (
       p.compte_id = app_compte_id()
       OR (app_role() = 'medecin' AND p.centre_id = app_centre_id())
     )
  )
);

-- -------------------------------------------------- résultats et marques
-- Les résultats suivent l'arbitrage documenté dans droits.js : le
-- secrétariat les voit, puisqu'il les saisit.
ALTER TABLE resultat_biologie ENABLE ROW LEVEL SECURITY;

CREATE POLICY resultat_acces ON resultat_biologie USING (
  EXISTS (
    SELECT 1 FROM patient p WHERE p.id = resultat_biologie.patient_id AND (
      p.compte_id = app_compte_id()
      OR (app_role() IN ('medecin', 'secretaire') AND p.centre_id = app_centre_id())
    )
  )
);

-- Les marques, en revanche, sont une appréciation : médecin et patient.
ALTER TABLE marque_bio ENABLE ROW LEVEL SECURITY;

CREATE POLICY marque_acces ON marque_bio USING (
  EXISTS (
    SELECT 1 FROM patient p WHERE p.id = marque_bio.patient_id AND (
      p.compte_id = app_compte_id()
      OR (app_role() = 'medecin' AND p.centre_id = app_centre_id())
    )
  )
);

-- ------------------------------------------------------ journal d'accès
-- Chacun ne voit que les traces qui le concernent : celles de ses propres
-- actions, et celles portant sur son propre dossier.
ALTER TABLE journal_acces ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_lecture ON journal_acces FOR SELECT USING (
  compte_id = app_compte_id()
  OR (cible_type = 'dossier' AND EXISTS (
        SELECT 1 FROM dossier d JOIN patient p ON p.id = d.patient_id
         WHERE d.id = journal_acces.cible_id AND p.compte_id = app_compte_id()))
);

-- L'écriture du journal reste toujours possible : un accès refusé doit
-- pouvoir être tracé même quand aucune ligne n'est lisible.
CREATE POLICY journal_ecriture ON journal_acces FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------- sessions
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_propre ON session USING (compte_id = app_compte_id());
CREATE POLICY session_creation ON session FOR INSERT WITH CHECK (true);
