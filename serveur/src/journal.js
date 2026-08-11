/* =====================================================================
   JOURNAL DES ACCÈS
   ---------------------------------------------------------------------
   Écrit à chaque tentative d'accès à un dossier, qu'elle aboutisse ou
   non. Les refus sont aussi intéressants que les réussites : c'est ce
   qui permet de voir une tentative répétée.

   Ce journal ne contient AUCUNE donnée de santé — ni réponse, ni avis,
   ni nom. Seulement : qui, quel rôle, quelle action, sur quel objet,
   quand, et si c'était autorisé.
   ===================================================================== */
'use strict';
const db = require('./db');

async function tracer({ compte, action, cibleType = null, cibleId = null, autorise, ip = null }) {
  await db.requete(
    `INSERT INTO journal_acces (compte_id, role, action, cible_type, cible_id, autorise, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [compte ? compte.id : null, compte ? compte.role : null, action, cibleType, cibleId,
     !!autorise, ip]);
}

/* Ce qu'un patient a le droit de savoir : qui a ouvert son dossier. */
async function historiqueDuDossier(dossierId) {
  const r = await db.requete(
    `SELECT j.quand, j.action, j.role, c.nom_affiche
       FROM journal_acces j LEFT JOIN compte c ON c.id = j.compte_id
      WHERE j.cible_type = 'dossier' AND j.cible_id = $1 AND j.autorise = TRUE
      ORDER BY j.quand DESC`, [dossierId]);
  return r.rows;
}

module.exports = { tracer, historiqueDuDossier };
