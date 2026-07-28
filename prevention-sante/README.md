# /prevention-sante — page B2B

Page vitrine autonome destinée aux DRH, CSE, mutuelles et courtiers.
`index.html` porte son CSS et son JavaScript en ligne. Aucun cookie, aucun
script tiers, aucune police distante. Seule sortie réseau : cinq
photographies, déclarées dans `commun/visuels.js` — voir la section
*Photographies*.

---

## Publier sur GitHub Pages

Depuis la racine du dépôt qui sert `lemedecinlibre.com` :

```bash
mkdir -p prevention-sante
cp /chemin/vers/index.html prevention-sante/index.html

git add prevention-sante/
git commit -m "Ajout de la page prévention santé (B2B)"
git push origin main
```

La page sera servie sur `https://lemedecinlibre.com/prevention-sante/`.

Si GitHub Pages n'est pas encore activé : **Settings → Pages**, source
`Deploy from a branch`, branche `main`, dossier `/ (root)`. Le domaine
personnalisé se configure dans le champ *Custom domain* de la même page,
avec un fichier `CNAME` à la racine contenant `lemedecinlibre.com`.

---

## Modifier le nom de marque

Le nom apparaît en cinq endroits d'`index.html`. Un seul remplacement suffit :

```bash
sed -i '' 's/Le Médecin Libre/NOUVELLE MARQUE/g' prevention-sante/index.html
```

L'adresse `contact@lemedecinlibre.com` apparaît deux fois (lien courriel dans
la section Contact, et script d'envoi du formulaire) — à remplacer séparément.

---

## À compléter avant mise en ligne

Repérables dans le fichier par la classe `todo` (surlignée en orange) :

- [ ] Numéro de téléphone dans la section Contact
- [ ] Mentions légales de l'éditeur : dénomination, forme sociale, capital,
      RCS, siège, représentant légal
- [ ] Nom et adresse de l'hébergeur
- [ ] Contact du délégué à la protection des données
- [ ] Pages `mentions-legales/`, `confidentialite/`, `cgv/` — liées dans le
      pied de page, à créer

---

## Photographies

Cinq photographies, déclarées une seule fois dans `commun/visuels.js`, affichées
uniquement dans `index.html`. Elles sont les seules ressources du projet
chargées depuis un autre domaine.

### Ce que ça coûte, et où la limite est posée

Aucun cookie n'est déposé et aucun code tiers n'est exécuté : une image n'est
qu'un fichier. Mais l'hôte reçoit l'adresse IP du visiteur. Sur une page
destinée aux employeurs, c'est sans conséquence. Sur une page qui affiche un
dossier médical, la requête révélerait à un tiers qu'une personne consulte des
données de santé — ce qui est précisément l'information à protéger.

D'où la règle, contrôlée par `plateforme/verifier.js` et non laissée à la
vigilance : **image distante sur la page publique uniquement**. L'espace
patient, le suivi, la vue médecin, le portail entreprise et le contrôle interne
ne chargent rien. Aucun script, aucune police et aucune feuille de style
distante n'est admis nulle part, page publique comprise.

### Bascule vers un hébergement propre

La licence Unsplash autorise le téléchargement, la modification et la
rediffusion, y compris commerciale, sans attribution obligatoire. Héberger les
fichiers soi-même supprime la fuite d'adresse IP. À faire au moment du passage
sur l'hébergement HDS :

```bash
mkdir -p prevention-sante/images
# Télécharger les cinq fichiers depuis les références du catalogue
# (unsplash.com/photos/<reference>), les renommer <id>.jpg, puis :
sed -i '' -E 's#https://images\.unsplash\.com/(photo-[0-9a-z-]+)\?[^" ]*#images/\1.jpg#g' \
  prevention-sante/index.html
```

Il faut alors retirer les attributs `srcset` et `sizes` — ou produire les
largeurs correspondantes — et mettre à jour `hotes` dans `commun/visuels.js`.
Le vérificateur signalera toute incohérence.

### Sujets : la règle et la raison

**Aucun visage de médecin, aucun visage de patient.** Un praticien souriant
présenté comme faisant partie de l'offre est une représentation du service :
elle relève de l'article R.4127-19-1 CSP, qui interdit à la communication
d'être trompeuse. Un modèle photographié en studio n'exerce pas dans le réseau.
Des lieux, du matériel et un chemin ne représentent rien d'autre qu'eux-mêmes.

**Remplacer les images de banque par des prises de vue propres — avec une
réserve.** Photographier les centres de santé du groupe est possible : un
médecin peut communiquer sur son lieu d'exercice. Photographier le plateau
technique du laboratoire ne l'est pas sur cette page : une image identifiable
du plateau, sur une page qui vend un parcours, constitue une promotion en
faveur d'un laboratoire de biologie médicale au sens de L.6222-8 CSP. La
photographie de microscope actuelle est neutre précisément parce qu'elle
n'identifie aucun laboratoire — c'est ce qu'il faut conserver.

Prises de vue utiles, sans personne identifiable et sans enseigne visible :
salle de consultation vide, table d'examen, poste de prélèvement, salle
d'attente, façade en contre-plongée serrée, matériel posé sur un plan de
travail. Autorisation écrite du praticien et du centre dans tous les cas.

---

## Ce qui ne doit JAMAIS être ajouté sur GitHub Pages

GitHub Pages est un hébergement statique, non certifié HDS, hors Union
européenne. Il ne peut accueillir aucune donnée de santé.

| Interdit ici | Où cela doit vivre |
|---|---|
| Questionnaire patient (M2) | Hébergement HDS |
| Comptes et authentification (M1) | Hébergement HDS |
| Espace patient, résultats, historique (M4) | Hébergement HDS |
| Devis et consentements (M6) | Hébergement HDS |
| Toute question de santé dans un formulaire | Hébergement HDS |

Le formulaire de contact actuel ouvre le client de messagerie de
l'utilisateur : aucune donnée n'est stockée ni transmise à un tiers. Si un
service de collecte est branché plus tard, il doit être hébergé dans l'Union
européenne et le traitement inscrit au registre.

---

## Discipline de contenu — à respecter à chaque modification

Ces règles sont la raison pour laquelle les textes sont formulés ainsi. Une
réécriture « plus vendeuse » casse la conformité.

### Interdictions absolues

- [ ] **Ne jamais nommer un laboratoire de biologie médicale**, ni logo, ni
      « nos plateaux », ni « notre laboratoire ». L'article L.6222-8 CSP
      interdit toute publicité ou promotion, directe ou indirecte, en faveur
      d'un laboratoire. L'interdiction suit le bénéficiaire, pas l'annonceur :
      le fait que la page soit publiée par la plateforme ne protège pas.
- [ ] **Ne jamais nommer un centre de santé ni un praticien.** Les
      photographies de banque actuelles n'identifient aucun établissement ;
      c'est ce qui les rend admissibles. Voir la section *Photographies* pour
      la règle applicable à des prises de vue propres.
- [ ] **Ne jamais mettre la biologie en vedette.** L'objet annoncé est un
      parcours de prévention médicale. Un titre du type « 120 biomarqueurs »
      ou « bilan sanguin complet » transforme la page en promotion de biologie.
- [ ] **Ne jamais présenter un acte remboursable comme « inclus »** dans
      l'abonnement. Interdit : « parcours à 150 € comprenant spirométrie et
      ECG ». C'est l'indu le plus facile à caractériser.
- [ ] **Aucun témoignage de tiers** — patient, collaborateur, influenceur.
      Prohibé par l'article R.4127-19-1 CSP.
- [ ] **Aucune comparaison** avec un autre praticien, établissement ou
      concurrent nommé. Donc pas de « trois fois moins cher que… ».
      Même article.
- [ ] **Aucune donnée de santé** demandée dans un formulaire.
- [ ] **Aucun prix grand public** affiché sur cette page B2B, pour éviter tout
      rattachement d'un tarif à une liste d'actes.

### Obligations à maintenir

- [ ] Le libre choix du centre et du laboratoire affiché et présenté comme
      effectif.
- [ ] Le référencement décrit comme non exclusif et ouvert.
- [ ] Les trois flux de facturation décrits et séparés.
- [ ] La mention que le montant de l'abonnement ne varie pas selon le nombre
      d'actes réalisés.
- [ ] La mention que les actes indiqués sont pris en charge dans les
      conditions habituelles de l'Assurance maladie.
- [ ] La mention qu'aucune donnée de santé nominative n'est transmise à
      l'employeur.
- [ ] La mention que le questionnaire ne calcule rien et ne conclut rien.

### Base juridique

- Article L.6222-8 CSP — interdiction de la publicité en faveur d'un
  laboratoire de biologie médicale ; sanction au titre de L.6241-1.
- Article R.4127-19-1 CSP, issu du décret n° 2020-1662 du 22 décembre 2020 —
  liberté de communication du médecin vers le public, sous conditions :
  loyauté, honnêteté, pas de témoignages de tiers, pas de comparaison,
  respect de la dignité de la profession, absence de tromperie.

---

## Statut

Textes rédigés comme **brouillon soumis à relecture** par le cabinet
spécialisé en droit de la biologie médicale, avant mise en ligne. C'est cette
page précisément qui doit figurer dans le dossier remis au cabinet.
