/* =====================================================================
   BIOLOGIE — SOURCE PARTAGÉE ET MARQUAGE PAR VALEUR DATÉE
   Version 0.1 — données fictives.

   Ce fichier est chargé par la vue médecin ET par le suivi patient.
   Une seule source de vérité : ce que le médecin annote est exactement
   ce que le patient voit.

   ---------------------------------------------------------------------
   CE QUE CE FICHIER NE CONTIENT PAS, ET C'EST DÉLIBÉRÉ

   Aucun intervalle de référence. Aucune borne de normalité. Aucun seuil.
   Aucune arithmétique sur une valeur.

   La raison est la même que partout ailleurs : stocker un intervalle et
   comparer une valeur à cet intervalle, c'est signaler un franchissement
   de seuil, donc une fonction de dispositif médical — même si c'est un
   médecin qui a fourni l'intervalle. Son intervention serait ponctuelle
   et la comparaison deviendrait continue : le résultat de l'année
   suivante serait signalé sans que personne ne le regarde.

   Les intervalles de référence appartiennent au compte rendu du
   laboratoire. Ce module transporte des valeurs et des annotations.

   ---------------------------------------------------------------------
   CE QU'IL PERMET

   Un médecin choisit une valeur précise, à une date précise, et pose
   une marque : couleur, commentaire, son nom, l'horodatage. C'est SA
   conclusion, exprimée. Le logiciel la conserve et la restitue.

   Trois garanties codées : la couleur est obligatoire, l'auteur est
   obligatoire, et une marque incomplète n'est jamais restituée.
   ===================================================================== */

'use strict';

const BIO_DATES = ['2022-04-12', '2023-05-03', '2024-05-21', '2025-06-14', '2026-07-20'];

/* Rampe pétrole → violet. Teintes catégorielles : elles désignent une
   famille d'analyses, jamais un état de santé. Aucune n'a de dominante
   rouge ou verte, précisément pour qu'aucune ne puisse se lire comme
   « bon » ou « mauvais ». */
const BIO_FAMILLES = [
  { nom: 'Numération',       c: '#0f5f6b' },
  { nom: 'Métabolique',      c: '#1a6f8c' },
  { nom: 'Rénal',            c: '#2a5f9c' },
  { nom: 'Hormonal',         c: '#41529b' },
  { nom: 'Hépatique',        c: '#57488f' },
  { nom: 'Mesuré sur place', c: '#6b4382' }
];

const BIO_PARAMETRES = [
  { id: 'hb',    nom: 'Hémoglobine',         unite: 'g/dL',   groupe: 'Numération',       valeurs: [14.1, 13.8, 13.6, 13.4, 13.6] },
  { id: 'ferr',  nom: 'Ferritine',           unite: 'µg/L',   groupe: 'Numération',       valeurs: [58, 47, 42, 31, 24] },
  { id: 'gly',   nom: 'Glycémie à jeun',     unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.88, 0.91, 0.94, 0.98, 1.02] },
  { id: 'chol',  nom: 'Cholestérol total',   unite: 'g/L',    groupe: 'Métabolique',      valeurs: [1.94, 2.02, 2.11, 2.18, 2.14] },
  { id: 'hdl',   nom: 'HDL',                 unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.58, 0.56, 0.54, 0.52, 0.55] },
  { id: 'tg',    nom: 'Triglycérides',       unite: 'g/L',    groupe: 'Métabolique',      valeurs: [0.92, 1.05, 1.18, 1.34, 1.21] },
  { id: 'creat', nom: 'Créatinine',          unite: 'µmol/L', groupe: 'Rénal',            valeurs: [71, 73, 74, 76, 75] },
  { id: 'tsh',   nom: 'TSH',                 unite: 'mUI/L',  groupe: 'Hormonal',         valeurs: [1.8, 2.1, 2.4, 2.2, 2.6] },
  { id: 'vitd',  nom: 'Vitamine D',          unite: 'nmol/L', groupe: 'Hormonal',         valeurs: [42, 38, 51, 44, 47] },
  { id: 'alat',  nom: 'ALAT',                unite: 'UI/L',   groupe: 'Hépatique',        valeurs: [22, 24, 27, 31, 28] },
  { id: 'pas',   nom: 'Pression systolique', unite: 'mmHg',   groupe: 'Mesuré sur place', valeurs: [118, 121, 124, 128, 126] },
  { id: 'poids', nom: 'Poids',               unite: 'kg',     groupe: 'Mesuré sur place', valeurs: [71.5, 73.2, 75.8, 77.1, 76.4] }
];

const BIO_COULEURS = [
  { v: 'vert',   l: 'Vert' },
  { v: 'orange', l: 'Orange' },
  { v: 'rouge',  l: 'Rouge' }
];

const Biologie = {

  dates() { return BIO_DATES.slice(); },
  parametres() { return BIO_PARAMETRES.slice(); },
  couleurs() { return BIO_COULEURS.slice(); },

  parametre(id) { return BIO_PARAMETRES.find(p => p.id === id) || null; },

  famille(nom) { return BIO_FAMILLES.find(f => f.nom === nom) || BIO_FAMILLES[0]; },

  familles() {
    const g = [];
    BIO_PARAMETRES.forEach(p => {
      let f = g.find(x => x.nom === p.groupe);
      if (!f) { f = { nom: p.groupe, couleur: this.famille(p.groupe).c, items: [] }; g.push(f); }
      f.items.push(p);
    });
    return g;
  },

  /* La valeur brute, telle que transmise. Aucune transformation. */
  valeur(paramId, dateIso) {
    const p = this.parametre(paramId);
    if (!p) return null;
    const i = BIO_DATES.indexOf(dateIso);
    if (i < 0) return null;
    return p.valeurs[i];
  },

  /* Clé d'une marque : un paramètre, une date. Une marque porte sur une
     valeur précise d'un relevé précis, jamais sur un paramètre en bloc. */
  cle(paramId, dateIso) { return paramId + '|' + dateIso; },

  /* ------------------------------------------------------------------
     POSE D'UNE MARQUE
     Couleur et auteur obligatoires, sans valeur de repli : il est donc
     techniquement impossible d'obtenir une couleur par défaut ou une
     marque anonyme.
  ------------------------------------------------------------------- */
  poser(dossier, paramId, dateIso, couleur, commentaire, medecin) {
    if (!this.parametre(paramId)) throw new Error('Paramètre inconnu : ' + paramId);
    if (BIO_DATES.indexOf(dateIso) < 0) throw new Error('Date inconnue : ' + dateIso);
    if (!couleur) throw new Error('Aucune couleur choisie : le médecin doit choisir explicitement.');
    if (!BIO_COULEURS.some(c => c.v === couleur)) throw new Error('Couleur non admise : ' + couleur);
    if (!medecin) throw new Error('Aucun auteur : une marque non signée serait indistinguable d’un signalement automatique.');

    if (!dossier.marquesBio) dossier.marquesBio = {};
    dossier.marquesBio[this.cle(paramId, dateIso)] = {
      parametre: paramId,
      dateValeur: dateIso,
      couleur: couleur,
      commentaire: commentaire || '',
      medecin: medecin,
      date: new Date().toISOString()
    };
    return dossier.marquesBio[this.cle(paramId, dateIso)];
  },

  retirer(dossier, paramId, dateIso) {
    if (dossier.marquesBio) delete dossier.marquesBio[this.cle(paramId, dateIso)];
  },

  /* Une marque sans couleur, sans auteur ou sans horodatage n'est pas
     restituée. Le contrôle est ici, une seule fois, pour les deux vues. */
  lire(dossier, paramId, dateIso) {
    const m = (dossier && dossier.marquesBio) ? dossier.marquesBio[this.cle(paramId, dateIso)] : null;
    if (!m) return null;
    if (!m.couleur || !m.medecin || !m.date) return null;
    return m;
  },

  /* Toutes les marques posées sur un paramètre, du plus récent au plus
     ancien relevé. Aucun tri par couleur ni par gravité. */
  duParametre(dossier, paramId) {
    const out = [];
    BIO_DATES.slice().reverse().forEach(d => {
      const m = this.lire(dossier, paramId, d);
      if (m) out.push(m);
    });
    return out;
  },

  /* La marque la plus récente d'un paramètre, s'il en existe une. */
  derniere(dossier, paramId) {
    const l = this.duParametre(dossier, paramId);
    return l.length ? l[0] : null;
  },

  compte(dossier) {
    return dossier && dossier.marquesBio ? Object.keys(dossier.marquesBio).length : 0;
  }
};

window.BIO_DATES = BIO_DATES;
window.BIO_PARAMETRES = BIO_PARAMETRES;
window.BIO_FAMILLES = BIO_FAMILLES;
window.Biologie = Biologie;
