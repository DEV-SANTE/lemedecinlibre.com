# Le socle de la plateforme — comptes, base de données, droits d'accès

Première tranche du vrai logiciel. Ce n'est plus une maquette : les réponses sont écrites dans une base PostgreSQL, les comptes existent, et les droits sont vérifiés à chaque requête.

## Ce qui fonctionne aujourd'hui

Un patient se crée un compte ou en reçoit un du centre, il se connecte, remplit son questionnaire, ses réponses sont enregistrées en base. Il transmet son dossier. Le médecin de son centre se connecte, lit les réponses, écrit un avis et le signe. Le patient relit cet avis, et peut savoir qui a ouvert son dossier. La secrétaire crée les comptes et rattache les patients, sans jamais voir un résultat. L'employeur ne voit que des comptages.

**369 contrôles automatiques passent** au total, dont la plupart vérifient des refus. Lancez-les :

```bash
npm install
npm test
```

Aucune base à installer : les tests utilisent PostgreSQL compilé en WebAssembly, en mémoire. Le SQL est donc exactement celui de la production.

## Essayer tout de suite dans votre navigateur

```bash
cd serveur
npm install        # une seule fois
npm start
```

Puis ouvrez **http://localhost:3000/connexion/**

Le serveur sert à la fois le site et l'API, sur le même port. Créez un compte
patient, ou connectez-vous avec un compte de démonstration :

| Compte | Rôle | Mot de passe |
|---|---|---|
| `medecin.a@test.fr` | médecin | `mot-de-passe-de-test` |
| `secretaire.a@test.fr` | secrétaire | `mot-de-passe-de-test` |
| `drh.a@test.fr` | employeur | `mot-de-passe-de-test` |

Ces comptes n'existent que si vous lancez `npm run demo`, qui crée un centre et
les trois comptes dans la base temporaire.

### Le même parcours en ligne de commande

Puis, dans un autre terminal :

```bash
# créer un compte patient
curl -s -X POST localhost:3000/api/inscription -H 'Content-Type: application/json' \
  -d '{"courriel":"claire@exemple.fr","motDePasse":"un-mot-de-passe-long","nom":"Martin","prenom":"Claire"}'

# se connecter (le cookie de session est conservé dans cookies.txt)
curl -s -c cookies.txt -X POST localhost:3000/api/connexion -H 'Content-Type: application/json' \
  -d '{"courriel":"claire@exemple.fr","motDePasse":"un-mot-de-passe-long"}'

# ouvrir un dossier et enregistrer une réponse
curl -s -b cookies.txt -X POST localhost:3000/api/dossiers
curl -s -b cookies.txt -X PUT localhost:3000/api/dossiers/1/reponses -H 'Content-Type: application/json' \
  -d '{"reponses":[{"module":"socle","questionId":"socle_1","valeur":"oui"}]}'
```

Avec `npm start`, la base est **en mémoire** : tout disparaît à l'arrêt. C'est voulu, pour éviter qu'une donnée réelle soit saisie par accident dans un environnement de développement.

### Vérifier que tout fonctionne

```bash
npm run verifier   # les trois séries d'un coup
```

| Commande | Ce qu'elle vérifie |
|---|---|
| `npm test` | 202 contrôles : cloisonnement des rôles, second facteur, limitation, mot de passe oublié |
| `npm run parcours` | 39 contrôles : du navigateur à la base, et ce qui ne doit pas sortir |
| `npm run pages` | 52 contrôles : les pages s'exécutent vraiment dans un moteur DOM |
| `npm run enchainement` | 54 contrôles : la chaîne complète, et aucune fonction d'API sans écran |
| `npm run rls` | 22 contrôles : les politiques PostgreSQL, interrogées en SQL direct |

Et depuis le dossier du site, `node plateforme/verifier.js` passe 549 contrôles sur
la discipline du produit — dont, désormais, l'absence totale de données de santé
dans le navigateur.

## Mise en production chez AZNETWORK

```bash
# 1. créer la base et charger le schéma
createdb prevention
psql prevention < schema.sql

# 2. démarrer l'API en lui donnant l'adresse de la base
DATABASE_URL="postgres://utilisateur:secret@localhost/prevention" PORT=3000 npm start
```

Dès que `DATABASE_URL` est défini, le serveur bascule sur PostgreSQL et le cookie de session passe en `Secure` — il n'est plus transmis qu'en HTTPS.

Une seule dépendance en production : `pg`, le pilote PostgreSQL. Pas de framework, pas de bibliothèque d'authentification. Le serveur utilise `http` et `crypto`, tous deux intégrés à Node.

## Les fichiers, par ordre d'importance

| Fichier | Ce qu'il contient |
|---|---|
| `src/droits.js` | **À relire en premier.** Tout le cloisonnement des quatre rôles, et lui seul. |
| `schema.sql` | Les tables, et les raisons de leur découpage. |
| `src/api.js` | Les 14 routes. Aucune ne décide d'un droit : elles demandent à `droits.js`. |
| `src/serveur.js` | HTTP, sessions, cookies. |
| `src/mdp.js` | Mots de passe (scrypt). |
| `src/journal.js` | Journal des accès. |
| `src/limites.js` | Limitation des tentatives de connexion. |
| `src/totp.js` | Second facteur, conforme au RFC 6238. |
| `src/secours.js` | Codes de secours du second facteur. |
| `src/entretien.js` | Purge des données dont la durée est écoulée. |
| `src/messagerie.js` | Envoi de courriels, trois transports, aucune donnée de santé. |
| `src/chiffre.js` | Chiffrement de colonnes (AES-256-GCM), clé hors base. |
| `src/consentement.js` | Le texte du consentement, sa version, son empreinte. |
| `src/migration.js` | Versionnage du schéma. |
| `src/trace.js` | Journaux JSON, sans aucune donnée de santé. |
| `rls.sql` | Politiques PostgreSQL : la seconde barrière. |
| `migrations/` | Les migrations, numérotées et empreintées. |
| `test/test.js` | Les 202 contrôles. |

## Consentement, et les deux droits qui manquaient

**Le consentement est explicite ou le compte n'existe pas.** L'inscription refuse toute
valeur autre que `true`, et rien n'est écrit en base sans lui — un contrôle le vérifie.

Ce qui est enregistré n'est pas une case cochée mais **l'empreinte du texte accepté**,
avec sa version. Si le texte évolue, on saura qu'une personne a consenti à l'ancienne
rédaction : c'est précisément ce qu'un contrôle demanderait, et qu'une colonne booléenne
ne dirait pas. Le texte vient du serveur, pas de la page — impossible qu'ils divergent.

**Copie des données** (article 20) : réponses, corrections, résultats, avis, accès au
dossier, historique des consentements. Téléchargé en fichier plutôt qu'affiché, parce
que ces données ne doivent pas rester à l'écran d'un poste partagé.

**Effacement** (article 17) : le compte, le mot de passe, le second facteur, les
sessions et l'identité sont supprimés. Les données médicales sont **conservées sous
forme dissociée**, parce qu'un dossier médical est soumis à des obligations de
conservation qui priment. La portée réelle est annoncée à la personne, et tracée. Cet
arbitrage doit être validé par un juriste — annoncer une suppression totale serait plus
simple, et faux.

Deux contraintes du schéma ont dû céder pour rendre ce droit applicable :
`patient.compte_id` est devenu nullable, et `journal_acces.compte_id` passe en
`ON DELETE SET NULL` — la trace subsiste, elle perd son lien vers l'identité. Sans cela,
l'effacement échouait sur une clé étrangère, ou aurait détruit le journal.

## Migrations, traces, clé

**Migrations numérotées**, appliquées au démarrage, avec l'empreinte de chaque fichier
en base. Une migration modifiée après avoir été appliquée fait **échouer** le
démarrage : sans ce contrôle, deux serveurs pourraient tourner sur des schémas
différents en croyant être à la même version — panne silencieuse, la pire espèce.

**Traces en JSON par ligne**, et `trace.nettoyer()` retire les champs sensibles avant
écriture : valeurs, textes d'avis, mots de passe, numéros, codes. Les journaux
techniques sont copiés, agrégés et lus par des gens qui n'ont rien à voir avec le soin.

**Rotation de la clé** de chiffrement, avec ce qui compte davantage écrit dans le
fichier : la clé doit vivre dans un coffre, avec une copie de recouvrement sous scellé,
et **ne jamais figurer dans la sauvegarde de la base**. Une sauvegarde contenant les
données et leur clé n'est pas chiffrée, elle est seulement compliquée.

## Deux barrières, pas une

Le cloisonnement vit dans `src/droits.js`, vérifié par une centaine de contrôles. Mais
c'est du code : une requête écrite plus tard, dans un écran d'administration ou un
script d'export, peut oublier d'y passer. PostgreSQL, lui, n'oublie pas.

`rls.sql` pose douze politiques sur huit tables. Elles sont **prouvées** par
`npm run rls`, qui interroge la base en SQL direct sous le rôle applicatif — donc avec
les requêtes naïves qu'un développeur pressé écrirait. Le contrôle le plus parlant : un
`SELECT * FROM reponse` lancé sous une identité de secrétaire ne renvoie **rien**.

Deux avertissements, à connaître avant l'audit :

**Le propriétaire des tables et tout superutilisateur contournent les politiques.**
L'application doit se connecter avec le rôle `prevention_appli`, jamais avec le
propriétaire. C'est le premier point que vérifiera un auditeur.

**Le serveur doit se présenter à la base** à chaque requête — `app.compte_id`,
`app.role`, `app.centre_id`. C'est fait par `db.avecContexte()`, appelé pour chaque
requête HTTP. Sans cela les politiques seraient posées mais jamais utilisées : une
protection écrite et inopérante, pire qu'aucune.

En développement, PGlite tourne en superutilisateur : les politiques y sont donc
contournées, et c'est pourquoi elles ont leur propre série de tests plutôt que d'être
supposées actives.

## Numéro de sécurité sociale

Il n'était volontairement pas dans le schéma initial : l'ajouter en clair aurait été
pire que de l'omettre. Il y est maintenant, chiffré en AES-256-GCM, avec une clé qui
vit dans `CLE_CHIFFREMENT` et non dans la base — une clé rangée à côté des données
qu'elle protège ne protège rien.

**Aucun repli en clair.** Si la clé est absente, l'enregistrement échoue et le numéro
n'est pas écrit. Un repli silencieux serait la pire issue, puisqu'il passerait inaperçu
jusqu'au jour de la fuite. Un contrôle le vérifie : sans clé, la base reste vide.

Une empreinte HMAC salée par la même clé permet de **rechercher** un patient par son
numéro sans déchiffrer toute la table — le chiffrement GCM donne un résultat différent
à chaque appel, ce qui le rend sûr mais impossible à interroger.

À la relecture, seuls **les quatre derniers chiffres** sont renvoyés : vérifier une
saisie n'exige pas de réafficher le numéro entier, et un écran de secrétariat reste
sous les yeux de tout le monde.

## Courriels : ce qu'ils ne contiennent jamais

Aucune donnée de santé. Ni réponse, ni résultat, ni avis, ni même le fait qu'un
dossier existe. Un courriel voyage en clair sur des serveurs qui ne nous appartiennent
pas et reste des années dans une boîte de réception : c'est le dernier endroit où
mettre une information de santé.

Ce n'est pas une consigne mais un contrôle : `messagerie.verifierContenu()` refuse
tout message contenant un mot qui trahirait un contenu médical, et l'envoi échoue.

## Entretien des données

`src/entretien.js` supprime les sessions expirées, les jetons utilisés, les tentatives
de connexion de plus de trente jours et le journal des accès de plus de trois ans. Il
démarre avec le serveur et repasse toutes les vingt-quatre heures.

Chaque passage est **tracé** dans la table `entretien`. Sans cette trace, on ne peut
pas savoir si la purge tourne — et une purge qu'on croit active mais qui ne tourne pas
est un manquement invisible, donc le pire. Un contrôle croisé vérifie en outre que la
durée annoncée dans la page « Données personnelles » est celle qu'applique le code.

## Le seuil de publication, aligné des deux côtés

La page entreprise applique `SEUIL_PUBLICATION = 11` et son commentaire affirmait que
sous ce seuil « la valeur n'est jamais calculée ni transmise ». C'était faux : la vue
`vue_employeur` publiait à partir de cinq. Le chiffre quittait donc le serveur et
n'était masqué qu'à l'affichage — or un masquage côté navigateur n'est pas une
protection, il suffit de regarder la réponse de l'API.

Les deux seuils sont désormais le même nombre, **onze**, et un contrôle croisé lit les
deux fichiers : changer l'un sans l'autre fait échouer la série.

## Un arbitrage à faire relire par le médecin

La secrétaire **voit les résultats de laboratoire**, contrairement aux réponses du
questionnaire et aux avis. Deux raisons.

D'abord la cohérence : c'est elle qui intègre les comptes-rendus du laboratoire, et
saisir une valeur sans la voir est impossible — un droit d'écriture sans lecture
serait une fiction. Ensuite le droit : le secrétariat médical fait partie de
l'équipe de soins et relève du secret partagé de l'article L.1110-4 du code de la
santé publique, pour ce qui est nécessaire à sa mission.

Ce qui lui reste fermé est ce qui n'est pas nécessaire à sa mission : les réponses
au questionnaire, qui sont un récit intime, et les avis comme les marques du
médecin, qui sont une interprétation.

**Si le Dr Knani préfère réserver cela au seul médecin**, il suffit de retirer
`'secretaire'` des deux listes de `peutLireResultats` et `peutSaisirResultat` dans
`src/droits.js` — l'écran de saisie disparaît alors de l'espace secrétariat. La
décision lui appartient, elle est documentée à l'endroit du code où elle s'applique.

## Les garde-fous d'accès

**Second facteur obligatoire pour les médecins et les secrétaires.** Pas pour les patients : un mot de passe de médecin qui fuite ouvrirait tous les dossiers du centre, celui d'un patient n'ouvre que le sien. La proportionnalité joue dans ce sens.

C'est du TOTP standard (RFC 6238), écrit avec le module `crypto` de Node, sans dépendance — l'algorithme tient en quarante lignes. **Les cinq vecteurs de test officiels du RFC passent**, donc n'importe quelle application d'authentification fonctionne.

Le point qui compte : tant que le code n'est pas validé, **la session n'ouvre aucune porte**. Un mot de passe volé donne une session qui ne sait rien faire d'autre que réclamer un code. Cinq contrôles automatiques le vérifient, dont trois tentatives d'accès refusées.

**Huit codes de secours** sont remis au moment de l'activation, et non plus tard sur
demande : une personne qui n'a pas encore compris qu'elle en aurait besoin est
précisément celle qui se retrouvera bloquée. L'écran ne laisse pas entrer avant
qu'elle ait confirmé les avoir notés. Chacun ne sert qu'une fois, seul le condensat
est stocké, et en regénérer invalide les anciens — un code noté sur un papier oublié
dans un tiroir ne doit pas rester valable indéfiniment.

Sans eux, un médecin qui perd son téléphone exigeait une intervention dans la base.
Autrement dit : un incident banal imposait un accès administrateur à une base de
données de santé.

Un code ne sert **qu'une fois** : le dernier pas utilisé est mémorisé, donc un code intercepté ne peut pas être rejoué. Conséquence d'usage : un soignant qui se reconnecte dans la même minute doit attendre le code suivant. C'est le comportement de toutes les applications d'authentification.

**Limitation des tentatives**, sur deux compteurs. Par compte, contre l'acharnement sur une adresse connue ; par adresse IP, contre l'essai d'un même mot de passe courant sur beaucoup de comptes — qu'un compteur par compte ne verrait jamais. Le verrouillage est progressif (1, 5, 15 puis 60 minutes) et **jamais définitif** : un blocage permanent transformerait la protection en moyen de nuire, puisqu'il suffirait d'échouer exprès pour priver quelqu'un de son compte. Aucun mot de passe essayé n'est conservé : un journal contenant des mots de passe voisins des vrais est une cible, pas une protection.

**Mot de passe oublié.** Le jeton n'est pas stocké, seul son condensat l'est : une fuite de cette table ne permet pas de prendre la main sur un compte. Valable une heure, usage unique, et la réinitialisation **ferme toutes les sessions du compte** — si un tiers était connecté, il est éjecté. La réponse est identique que l'adresse existe ou non : sinon ce formulaire dirait qui est inscrit sur la plateforme, ce qui est déjà une information de santé quand la plateforme est un parcours de prévention.

Aucun service d'envoi de courriel n'est branché : en développement le lien est affiché, en production il devra être envoyé et **ne plus être renvoyé dans la réponse**.

## Les décisions techniques, et pourquoi

**Sessions en base, pas de jeton signé.** Un jeton JWT reste valide jusqu'à son expiration, même si vous voulez couper l'accès immédiatement. En santé, pouvoir révoquer un accès sur le champ compte plus que d'économiser une requête.

**scrypt plutôt qu'une bibliothèque.** Argon2id est légèrement préférable en théorie, mais c'est un module natif à compiler : une dépendance de plus à auditer et un risque d'échec d'installation sur votre serveur. scrypt est intégré à Node et recommandé par l'OWASP.

**Une réponse par ligne, jamais un bloc JSON.** On peut ainsi savoir qui a répondu quoi et quand, et une correction conserve l'ancienne valeur dans `reponse_historique` — rien n'est jamais écrasé.

**Un dossier transmis est figé.** Le patient ne peut plus le modifier, et un médecin ne peut pas signer d'avis sur un brouillon : il porterait sur des réponses susceptibles de changer juste après.

**Aucune interprétation côté serveur.** Quatre contrôles automatiques cherchent dans le code un calcul de score, une comparaison à un seuil, un classement de risque ou une suggestion d'acte. C'est ce qui maintient la plateforme hors du champ du dispositif médical, conformément à votre décision : la décision appartient au médecin.

## Une leçon sur les tests, gardée ici volontairement

Les trois premières séries passaient toutes, et le parcours était pourtant coupé :
le patient terminait son questionnaire, l'écran annonçait « vos réponses sont
transmises », mais rien n'appelait la transmission. Le dossier restait en
brouillon, donc le médecin ne pouvait pas rendre d'avis — et personne ne le
voyait, puisque l'API et les pages étaient testées séparément, jamais enchaînées.

D'où `npm run enchainement`, qui suit la chaîne entière et vérifie surtout que ce
qui est **affiché** correspond à ce que la base contient. Un écran qui annonce une
action non effectuée est plus dangereux qu'une erreur visible.

Le premier contrôle que j'ai écrit pour ça était lui-même trop faible : il
cherchait `API.transmettre(` n'importe où dans le fichier, alors qu'une fonction
peut exister sans que rien ne l'appelle. Il fallait isoler le gestionnaire du
bouton et vérifier qu'il y mène. Vérifié en réintroduisant le bug : six contrôles
tombent.

## Ce qui manque encore, et qu'il faut savoir

Ce socle est solide sur le cloisonnement. Il n'est pas complet :

- **Aucun chiffrement applicatif des données au repos.** Le chiffrement du disque relève d'AZNETWORK ; le chiffrement colonne par colonne, notamment pour un futur numéro de sécurité sociale, reste à faire.
- **L'envoi de courriels attend un serveur SMTP.** Le module existe et parle SMTP sans dépendance ; il faut renseigner `COURRIEL_SMTP`, `COURRIEL_UTILISATEUR` et `COURRIEL_MOTDEPASSE`. Tant qu'aucun transport réel n'est configuré, le lien de réinitialisation est affiché à l'écran — et le code ne le renvoie dans la réponse HTTP que dans ce cas précis.
- **Le parcours d'abonnement et de paiement** de l'espace patient n'est pas branché : on entre directement dans le questionnaire. Il suppose de choisir un prestataire de paiement, ce qui est une décision et non un développement.
- **Les devis et les factures** de l'espace patient restent des maquettes : ils attendent le choix d'un prestataire de paiement, qui est une décision et non un développement. Ce sont les deux derniers écrans non branchés, et ils le disent.
- **Le téléchargement des documents** : la table et la liste existent, le dépôt du fichier lui-même (stockage hors racine web, servi avec session) est la prochaine brique.
- **Un audit externe.** Je peux écrire ce code ; personne ne devrait mettre en production du code de sécurité sans qu'un autre regard l'ait relu, le mien compris. C'est le dernier point technique, et il ne peut pas venir de moi.
- **Le cloisonnement est applicatif**, vérifié par les tests. Le durcir au niveau de PostgreSQL lui-même (Row Level Security) ajouterait une seconde barrière indépendante du code.
- **Aucun audit externe.** Je peux écrire ce code ; personne ne devrait mettre en production du code de sécurité sans qu'un autre regard l'ait relu, le mien compris.

Rien de tout cela n'empêche de continuer à construire avec des patients fictifs. Tout cela doit être réglé avant le premier patient réel.
