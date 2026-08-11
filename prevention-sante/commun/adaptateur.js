/* =====================================================================
   ADAPTATEUR ENTRE L'API ET LES ÉCRANS
   ---------------------------------------------------------------------
   Les écrans ont été écrits avant l'API, avec leur propre forme de
   données : un objet « reponses » indexé par identifiant de question, des
   marques indexées par « paramètre|date ». L'API, elle, renvoie des
   tableaux de lignes, parce que c'est ainsi qu'une base les stocke.

   Ce fichier traduit dans les deux sens. Il existe pour une raison
   précise : sans lui, il fallait réécrire l'affichage des sept pages, et
   toute réécriture d'un affichage qui fonctionne est une occasion
   d'introduire une erreur là où il n'y en avait pas.

   L'adaptateur ne décide de rien. Il ne calcule rien, ne complète aucune
   donnée absente, n'invente aucune valeur par défaut. Ce que la base ne
   contient pas reste absent.
   ===================================================================== */
'use strict';

var Adaptateur = (function () {

  /* --- API vers écran ------------------------------------------------ */
  function versEcran(d) {
    if (!d) return null;
    var reponses = {};
    (d.reponses || []).forEach(function (r) {
      /* Les nombres reviennent en texte de la base : on rend le nombre
         quand c'en est un, parce que l'affichage compare des nombres. */
      var v = r.valeur;
      if (v !== null && v !== '' && !isNaN(v) && String(Number(v)) === String(v).trim()) {
        v = Number(v);
      }
      reponses[r.question_id] = v;
    });

    var marquesBio = {};
    (d.marques || []).forEach(function (m) {
      var date = String(m.date_valeur).slice(0, 10);
      var cle = m.parametre + '|' + date;
      /* La plus récente gagne : les marques arrivent triées par date de
         pose décroissante, donc on ne remplace pas une entrée déjà mise. */
      if (!marquesBio[cle]) {
        marquesBio[cle] = {
          parametre: m.parametre, dateValeur: date, couleur: m.couleur,
          commentaire: m.commentaire, medecin: m.auteur, date: m.pose_le,
          rpps: m.rpps || null,
        };
      }
    });

    var avis = (d.avis || []).map(function (a) {
      return { domaine: a.domaine, statut: a.statut, texte: a.texte,
               medecin: a.auteur, rpps: a.rpps || null, date: a.signe_le };
    });

    return {
      id: d.id,
      cree: d.creeLe || null,
      modifie: d.majLe || d.creeLe || null,
      statut: d.statut,
      fictif: false,
      /* « validation » au sens des écrans : le dossier a-t-il été relu et
         signé. Il ne l'est que s'il existe au moins un avis signé. */
      validation: avis.length
        ? { medecin: avis[0].medecin, date: avis[0].date, rpps: avis[0].rpps }
        : null,
      identite: d.patient || null,
      reponses: reponses,
      marquesBio: marquesBio,
      avis: avis,
      resultats: d.resultats || [],
      /* Présent uniquement si le rôle n'a pas accès au contenu médical :
         les écrans peuvent alors afficher le motif au lieu d'un vide. */
      contenuRefuse: d.contenuMedical ? (d.motif || 'accès non autorisé') : null,
    };
  }

  /* --- écran vers API ------------------------------------------------
     L'objet « reponses » redevient une liste de lignes. Le module de
     chaque question est retrouvé dans le questionnaire, s'il est chargé ;
     sinon la ligne part avec un module inconnu plutôt que d'être perdue. */
  function reponsesVersAPI(reponses) {
    var sortie = [];
    Object.keys(reponses || {}).forEach(function (qid) {
      var v = reponses[qid];
      if (v === undefined) return;
      sortie.push({
        module: moduleDeLaQuestion(qid),
        questionId: qid,
        /* Les réponses à choix multiples sont des tableaux : on les
           enregistre en texte séparé par des points-virgules, forme
           relisible et qui ne perd rien. */
        valeur: Array.isArray(v) ? v.join(' ; ') : (v === null ? null : String(v)),
      });
    });
    return sortie;
  }

  function moduleDeLaQuestion(qid) {
    if (typeof QUESTIONNAIRE === 'undefined' || !QUESTIONNAIRE.modules) return 'inconnu';
    for (var i = 0; i < QUESTIONNAIRE.modules.length; i++) {
      var m = QUESTIONNAIRE.modules[i];
      for (var j = 0; j < (m.questions || []).length; j++) {
        if (m.questions[j].id === qid) return m.id;
      }
    }
    return 'inconnu';
  }

  return { versEcran: versEcran, reponsesVersAPI: reponsesVersAPI,
           moduleDeLaQuestion: moduleDeLaQuestion };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Adaptateur; }
