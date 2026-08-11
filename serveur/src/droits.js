/* =====================================================================
   DROITS D'ACCÈS — LE FICHIER À RELIRE EN PREMIER
   ---------------------------------------------------------------------
   Tout le cloisonnement est ici, et nulle part ailleurs. Aucune route
   ne décide par elle-même : elle demande à ce fichier.

   LES QUATRE RÔLES, ET CE QUI LES SÉPARE

     patient     son dossier, et rien d'autre. Y compris la liste de
                 qui a consulté son dossier.

     medecin     les dossiers des patients rattachés à SON centre.
                 Peut lire les réponses, écrire et signer des avis.
                 Ne voit pas les patients d'un autre centre.

     secretaire  l'identité administrative des patients de son centre :
                 créer un compte, rattacher, voir les rendez-vous.
                 NE VOIT AUCUNE RÉPONSE, AUCUN AVIS, JAMAIS. Ce n'est
                 pas une commodité d'affichage : c'est le secret médical
                 (article 226-13 du code pénal). Une secrétaire n'a pas
                 à connaître l'état de santé des patients pour faire son
                 travail, donc elle n'y a pas accès.

     employeur   aucun dossier, aucun nom, aucune date de naissance.
                 Uniquement des comptages agrégés, et seulement si
                 l'effectif dépasse cinq personnes — en dessous, un
                 comptage permettrait de reconnaître quelqu'un.

   RÈGLE GÉNÉRALE : tout ce qui n'est pas explicitement autorisé ici est
   refusé. Les fonctions renvoient un motif de refus, pour que le journal
   d'accès et le message d'erreur disent la même chose.
   ===================================================================== */
'use strict';

const REFUS = (motif) => ({ ok: false, motif });
const OK = { ok: true };

/* --- Lire un dossier : l'identité et le statut, pas encore le contenu. */
function peutLireDossier(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (!dossier) return REFUS('dossier inconnu');
  switch (compte.role) {
    case 'patient':
      return dossier.compte_patient_id === compte.id
        ? OK : REFUS('un patient ne peut lire que son propre dossier');
    case 'medecin':
      if (!dossier.centre_id) return REFUS('patient non rattaché à un centre');
      return dossier.centre_id === compte.centre_id
        ? OK : REFUS('dossier d’un autre centre');
    case 'secretaire':
      /* La secrétaire voit qu'un dossier existe et son statut — elle en a
         besoin pour organiser les rendez-vous — mais pas son contenu.
         Voir peutLireContenuMedical(). */
      if (!dossier.centre_id) return REFUS('patient non rattaché à un centre');
      return dossier.centre_id === compte.centre_id
        ? OK : REFUS('dossier d’un autre centre');
    case 'employeur':
      return REFUS('un employeur n’accède à aucun dossier');
    default:
      return REFUS('rôle inconnu');
  }
}

/* --- Lire les RÉSULTATS DE LABORATOIRE bruts.
       ARBITRAGE, à relire par le médecin responsable.

       La secrétaire y a accès, contrairement aux réponses et aux avis.
       Deux raisons. D'abord la cohérence : c'est elle qui intègre les
       comptes-rendus du laboratoire, et saisir une valeur sans la voir est
       impossible — un droit d'écriture sans lecture serait une fiction.
       Ensuite le droit : le secrétariat médical appartient à l'équipe de
       soins et relève du secret partagé de l'article L.1110-4 du code de
       la santé publique, pour ce qui est nécessaire à sa mission.

       Ce qui lui reste fermé est ce qui n'est pas nécessaire à sa mission :
       les réponses au questionnaire, qui sont un récit intime, et les avis
       comme les marques du médecin, qui sont une interprétation.

       Si le médecin responsable préfère réserver cela au seul médecin, il
       suffit de retirer 'secretaire' des deux listes ci-dessous — et
       l'écran de saisie disparaît de l'espace secrétariat. */
function peutLireResultats(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (!['medecin', 'secretaire'].includes(compte.role)) {
    return peutLireContenuMedical(compte, dossier);
  }
  return peutLireDossier(compte, dossier);
}

/* --- Lire le CONTENU médical : réponses au questionnaire, avis, marques.
       C'est ici que la secrétaire est arrêtée. */
function peutLireContenuMedical(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (compte.role === 'secretaire') {
    return REFUS('le secret médical interdit à une secrétaire l’accès aux réponses et aux avis');
  }
  if (compte.role === 'employeur') {
    return REFUS('un employeur n’accède à aucune donnée de santé');
  }
  return peutLireDossier(compte, dossier);
}

/* --- Écrire ses réponses : le patient, sur son dossier, tant qu'il
       n'est pas transmis. Après transmission, le dossier est figé :
       le médecin doit pouvoir se fier à ce qu'il a lu. */
function peutEcrireReponses(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (compte.role !== 'patient') return REFUS('seul le patient renseigne son questionnaire');
  if (dossier.compte_patient_id !== compte.id) return REFUS('ce dossier n’est pas le vôtre');
  if (dossier.statut !== 'brouillon') return REFUS('dossier déjà transmis, il n’est plus modifiable');
  return OK;
}

/* --- Écrire un avis : un médecin, sur un dossier de son centre.
       Un avis est signé de son auteur et horodaté : c'est la contrepartie
       du fait que rien n'est proposé par le logiciel. */
function peutEcrireAvis(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (compte.role !== 'medecin') return REFUS('seul un médecin rédige un avis');
  if (!dossier.centre_id || dossier.centre_id !== compte.centre_id) {
    return REFUS('dossier d’un autre centre');
  }
  /* Un brouillon n'est pas relisable : le patient le remplit encore, et
     un avis porterait sur des réponses susceptibles de changer juste
     après. Le dossier doit avoir été transmis. */
  if (!['transmis', 'relu'].includes(dossier.statut)) {
    return REFUS('dossier non transmis : le patient le remplit encore');
  }
  return OK;
}

/* --- Créer un compte patient depuis le centre. */
function peutCreerPatient(compte) {
  if (!compte) return REFUS('non connecté');
  return ['secretaire', 'medecin'].includes(compte.role)
    ? OK : REFUS('seul le centre crée un compte patient');
}

/* --- Rattacher un patient inscrit librement au centre. Tant qu'il n'est
       pas rattaché, aucun soignant ne voit son dossier. */
function peutRattacher(compte) {
  if (!compte) return REFUS('non connecté');
  return ['secretaire', 'medecin'].includes(compte.role)
    ? OK : REFUS('seul le centre rattache un patient');
}

/* --- Voir les comptages agrégés. */
function peutVoirStatistiques(compte) {
  if (!compte) return REFUS('non connecté');
  return ['employeur', 'medecin', 'secretaire'].includes(compte.role)
    ? OK : REFUS('rôle sans accès aux comptages');
}

/* --- Voir qui a consulté un dossier : le patient concerné, et lui seul.
       C'est son droit, pas une fonction d'administration. */
function peutVoirJournalDuDossier(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (compte.role !== 'patient') return REFUS('seul le patient consulte le journal de son dossier');
  return dossier.compte_patient_id === compte.id ? OK : REFUS('ce dossier n’est pas le vôtre');
}

/* --- Poser une marque de couleur sur une valeur de biologie.
       Même exigence qu'un avis : un médecin, son centre, et le dossier
       transmis. La couleur est une appréciation clinique ; elle ne peut
       venir que de quelqu'un qui en répond. */
function peutPoserMarque(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (compte.role !== 'medecin') return REFUS('seul un médecin pose une marque sur une valeur');
  if (!dossier.centre_id || dossier.centre_id !== compte.centre_id) {
    return REFUS('dossier d’un autre centre');
  }
  return OK;
}

/* --- Saisir un résultat de laboratoire. La secrétaire en a besoin :
       c'est de la saisie administrative, pas une appréciation. Elle ne
       pourra toujours pas lire les réponses du questionnaire ni les avis. */
function peutSaisirResultat(compte, dossier) {
  if (!compte) return REFUS('non connecté');
  if (!['medecin', 'secretaire'].includes(compte.role)) {
    return REFUS('seul le centre saisit un résultat de laboratoire');
  }
  if (!dossier.centre_id || dossier.centre_id !== compte.centre_id) {
    return REFUS('dossier d’un autre centre');
  }
  return OK;
}

/* --- Voir la liste des patients du centre. Administratif : nom, prénom,
       date de naissance, statut du dossier. Aucun contenu médical. */
function peutListerPatients(compte) {
  if (!compte) return REFUS('non connecté');
  return ['medecin', 'secretaire'].includes(compte.role)
    ? OK : REFUS('réservé au centre');
}

module.exports = {
  peutLireDossier, peutLireContenuMedical, peutLireResultats, peutEcrireReponses,
  peutEcrireAvis, peutCreerPatient, peutRattacher, peutVoirStatistiques,
  peutVoirJournalDuDossier, peutPoserMarque, peutSaisirResultat, peutListerPatients,
};
