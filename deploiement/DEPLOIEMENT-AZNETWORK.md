# Déploiement « Prévention Santé » — note technique pour AZNETWORK

**Client** Groupe Dev Santé · **Version 2 — 11 août 2026** · **Environnement** serveur HDS AZNETWORK

> **Cette note remplace celle du 6 août.** La première décrivait un site
> statique sans base de données : c'était exact de la maquette. La plateforme
> comporte désormais un serveur applicatif et une base PostgreSQL, et elle
> traitera de vraies données de santé. Déployer la version 1 installerait la
> maquette en croyant installer la plateforme.

---

## 1. Ce qu'il y a à déployer

Trois composants, sur une seule machine :

| Composant | Nature |
|---|---|
| **Site** | 12 pages statiques, HTML/CSS/JS, ~1,9 Mo. Servi par nginx. |
| **Serveur applicatif** | Node.js ≥ 20, une seule dépendance (`pg`). Écoute en local sur le port 3000, relayé par nginx sur `/api/`. |
| **Base** | PostgreSQL ≥ 14. Accès local uniquement, jamais exposée. |

Le serveur applicatif n'écoute **pas** en HTTPS : nginx termine TLS et relaie en clair sur la boucle locale. Le service ne doit donc pas être joignable de l'extérieur.

### Ce que la plateforme traitera

**Des données de santé réelles**, dès l'ouverture du pilote : réponses à un questionnaire de prévention, résultats de laboratoire, avis médicaux, numéros de sécurité sociale. C'est pourquoi nous sommes chez vous.

Deux points qui vous concernent directement :

**Le numéro de sécurité sociale est chiffré par l'application** (AES-256-GCM), en plus de votre chiffrement de disque. La clé vit dans `/etc/prevention-sante.env` et **jamais dans la base**. Nous vous demandons de ne pas inclure ce fichier dans les sauvegardes de la base : une sauvegarde contenant les données et leur clé n'est pas chiffrée, elle est seulement compliquée.

**Les politiques de sécurité au niveau des lignes (RLS) sont actives.** L'application doit se connecter avec le rôle `prevention_appli`, jamais avec le propriétaire des tables : le propriétaire contourne ces politiques. Notre script de déploiement avertit s'il détecte le compte `postgres` dans la configuration.

### L'accès reste restreint pendant le pilote

Les pages restent derrière un mot de passe nginx, et le site n'est pas indexable. L'API en est exemptée — elle a sa propre authentification, et un double mot de passe rendrait les comptes patients inutilisables. Le retrait de cette protection sera une décision explicite, pas un oubli de configuration.

### Sortie réseau à connaître

La seule page publique (`/index.html`, page employeurs) charge **7 photographies depuis `images.unsplash.com`**. C'est la seule requête sortante de tout le site. Toutes les autres images — 19 fichiers, illustrations de domaines et de modules — sont déjà hébergées localement dans `images/`. Nous prévoyons de rapatrier ces fichiers en hébergement propre ; la ligne correspondante de la politique de sécurité du contenu devra alors être retirée, et le site n'aura plus aucune sortie réseau. Si votre politique l'exige, nous pouvons faire ce rapatriement avant le déploiement — dites-le nous.

---

## 2. Les fichiers fournis

| Fichier | Rôle |
|---|---|
| `deployer.sh` | Déploiement et mises à jour : site, serveur, dépendances, migrations, redémarrage. Idempotent. |
| `nginx-prevention-sante.conf` | Bloc `server` complet : fichiers statiques **et** relais `/api/`. |
| `prevention-sante.service` | Unité systemd, durcie. Aucun secret dedans. |
| `prevention-sante.env.exemple` | Modèle de configuration et de secrets. À copier en `/etc/prevention-sante.env`. |
| `robots.txt` | À déposer à la racine web. Interdit l'indexation. |

Le code source est public : `https://github.com/DEV-SANTE/lemedecinlibre.com`, dossier `prevention-sante/`, branche `main`. Le serveur va le chercher lui-même — **aucun transfert de fichiers n'est nécessaire**.

---

## 3. Procédure

### 3.1 Prérequis

`git`, `rsync`, **Node.js ≥ 20**, **npm**, **PostgreSQL ≥ 14**, et un accès sortant HTTPS vers `github.com` et le registre npm. Si la politique du serveur interdit ces accès sortants, dites-le nous : nous fournirons une archive avec les dépendances incluses.

### 3.2 Premier déploiement

Cinq gestes manuels, une seule fois. Ils ne sont pas dans le script : un script qui crée une base ou génère une clé de chiffrement à chaque passage détruirait les données au deuxième lancement.

```bash
# 1. Utilisateur système et base
sudo useradd --system --home /opt/prevention-sante --shell /usr/sbin/nologin prevention
sudo -u postgres createdb prevention
sudo -u postgres createuser prevention_appli --pwprompt   # notez ce mot de passe

# 2. Secrets. La clé de chiffrement est générée UNE SEULE FOIS.
#    Si elle est perdue, les numéros de sécurité sociale sont
#    définitivement illisibles — par nous comme par vous.
sudo cp prevention-sante.env.exemple /etc/prevention-sante.env
cd /opt/prevention-sante/serveur 2>/dev/null || true
sudo nano /etc/prevention-sante.env      # renseigner DATABASE_URL et CLE_CHIFFREMENT
sudo chown root:prevention /etc/prevention-sante.env
sudo chmod 640 /etc/prevention-sante.env

# 3. Service
sudo cp prevention-sante.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable prevention-sante

# 4. Déploiement : site, serveur, dépendances, migrations, démarrage
sudo ./deployer.sh

# 5. nginx
sudo htpasswd -c /etc/nginx/.htpasswd-prevention devsante
sudo cp nginx-prevention-sante.conf /etc/nginx/sites-available/prevention-sante.conf
sudo ln -s /etc/nginx/sites-available/prevention-sante.conf /etc/nginx/sites-enabled/
sudo cp robots.txt /var/www/prevention-sante/robots.txt
sudo nginx -t && sudo systemctl reload nginx
```

Pour générer la clé de chiffrement : `cd /opt/prevention-sante/serveur && npm run cle`.

Le script **refuse de continuer** si `/etc/prevention-sante.env` est absent, si `CLE_CHIFFREMENT` est vide ou si `DATABASE_URL` est vide. C'est voulu : mieux vaut ne pas démarrer que démarrer sans chiffrement.

Le script accepte des variables d'environnement si votre arborescence diffère :

```bash
sudo RACINE_WEB=/srv/www/prevention TRAVAIL=/opt/depots/prevention ./deployer.sh
```

Et une simulation qui n'écrit rien :

```bash
sudo DRY_RUN=1 ./deployer.sh
```

### 3.3 Mises à jour ultérieures

```bash
sudo ./deployer.sh
```

Le script récupère la dernière version, met à jour le site et le serveur, **applique les migrations de base qui manquent**, puis redémarre le service et vérifie qu'il répond.

Les migrations sont numérotées et leur passage est inscrit en base avec l'empreinte du fichier. Une migration déjà appliquée puis modifiée fait **échouer** le déploiement plutôt que de laisser deux serveurs tourner sur des schémas différents en croyant être à la même version.

Pour ne toucher qu'aux pages, sans redémarrer le service : `sudo SANS_SERVICE=1 ./deployer.sh`.

---

## 4. Trois choses à adapter avant mise en service

Elles sont marquées `⚠` dans le fichier de configuration :

1. **`server_name`** — le nom d'hôte retenu, aux deux endroits.
2. **`ssl_certificate` et `ssl_certificate_key`** — les chemins de votre certificat. Si vous préférez Let's Encrypt, le bloc HTTP laisse déjà passer `/.well-known/acme-challenge/`.
3. **La restriction par IP** — commentée. Si vous préférez filtrer par adresse plutôt que par mot de passe, décommentez `allow`/`deny` et renseignez les plages du groupe.

**Compatibilité nginx** : la directive `http2 on;` demande nginx 1.25.1 ou plus récent. Sur une version antérieure, remplacez-la par `listen 443 ssl http2;` sur les deux lignes `listen`.

---

## 5. Choix de configuration, et pourquoi

Ces points ne sont pas des préférences esthétiques ; merci de les conserver.

**Deux fichiers ne doivent pas être servis.** `plateforme/verifier.js` est notre outil de contrôle interne : il n'est chargé par aucune page et décrirait publiquement toute notre logique de vérification. `README.md` contient des notes internes et notre analyse juridique. Le script les exclut à la copie, et la configuration nginx les refuse en seconde barrière — volontairement deux fois.

**Les pages HTML ne sont pas mises en cache**, les fichiers versionnés le sont sept jours. Les pages appellent leurs scripts avec un jeton de version (`?v=29`) ; une page HTML en cache servirait d'anciens scripts avec de nouvelles données.

**Pas de `try_files` vers `index.html`.** Le site n'est pas une application à route unique. Une 404 doit rester une 404 : masquer les 404 cacherait un déploiement incomplet.

**`'unsafe-inline'` dans la politique de sécurité du contenu** est nécessaire, et c'est un compromis assumé : les sept pages portent leur CSS et leur JavaScript en ligne, par conception — c'est ce qui permet de n'avoir aucune dépendance et aucun script tiers. À durcir avec des nonces quand le socle applicatif sera construit. Nous préférons vous le signaler plutôt que vous laisser le découvrir à l'audit.

---

## 6. Vérification après déploiement

Le script effectue déjà ces contrôles et s'arrête en erreur si l'un échoue. À confirmer de votre côté :

- [ ] `systemctl is-active prevention-sante` renvoie `active`.
- [ ] `curl -so /dev/null -w '%{http_code}' localhost:3000/api/moi` renvoie **401** — l'API tourne et exige une session.
- [ ] `journalctl -u prevention-sante -n 20` montre des lignes JSON, **sans aucune donnée de santé**.
- [ ] Le service n'est **pas** joignable de l'extérieur sur le port 3000.
- [ ] `https://<hôte>/` demande le mot de passe, mais `https://<hôte>/api/moi` répond 401 sans le demander.
- [ ] Les 12 pages répondent, dont `/secretariat/`, `/mentions-legales/`, `/confidentialite/`, `/conditions/`.
- [ ] `https://<hôte>/plateforme/verifier.js` renvoie **404**.
- [ ] `https://<hôte>/README.md` renvoie **404**.
- [ ] L'en-tête `X-Robots-Tag: noindex` est présent.
- [ ] HTTP redirige vers HTTPS.
- [ ] `/var/www/prevention-sante/.version` contient la révision déployée.

En une commande :

```bash
curl -sI -u devsante https://<hôte>/ | grep -Ei 'HTTP/|x-robots|strict-transport'
curl -so /dev/null -w '%{http_code}\n' -u devsante https://<hôte>/plateforme/verifier.js
```

---

## 7. Ce que nous attendons en retour

Pour avancer sur le socle applicatif — la vraie plateforme — nous avons besoin de :

1. **Le périmètre contractuel exact** : quelles activités HDS sont couvertes pour nous, nommément.
2. **La matrice de responsabilités** : jusqu'où va l'infogérance (système, base de données, correctifs, supervision) et où commence notre responsabilité applicative.
3. **Le RTO et le RPO** engagés, **la procédure de restauration**, et la date d'un **test de restauration réel** auquel nous assisterons.
4. **La journalisation des accès** : ce que vous produisez, où c'est conservé, pendant combien de temps, et comment nous y accédons.
5. **Les services managés disponibles** : base de données managée, sauvegardes, supervision, secrets. Cela déterminera l'architecture, et nous ne voulons rien coder avant cette réponse.
6. **La confirmation écrite** qu'aucune donnée, sauvegarde secondaire ni intervention de support ne sort de l'Espace économique européen.
7. **L'accord de sous-traitance de l'article 28 du RGPD**, annexé au contrat.
8. **Confirmation écrite que `/etc/prevention-sante.env` est exclu des sauvegardes de la base** — il contient la clé de chiffrement.

---

## 8. Contact

Groupe Dev Santé — Mendel Mergui — contact@dev-sante.fr

Médecin responsable de protocole : Dr Nassreddine Knani, médecin généraliste, RPPS 10110958559.

---

*Le script `deployer.sh` a été testé en simulation et en exécution réelle : clone, copie, exclusions, idempotence, et refus de démarrer sans secrets. La configuration nginx a été validée syntaxiquement, relais `/api/` compris. L'unité systemd n'a pas pu être testée dans notre environnement — elle ne comporte pas de démon systemd. Rien de tout cela n'a été exécuté sur votre infrastructure : les chemins, le nom d'hôte et le paquet Node restent à confirmer par vos équipes.*

*Le socle applicatif est couvert par 202 contrôles automatiques côté serveur et 565 côté produit, exécutables par `npm run verifier`. Ils ne remplacent pas un audit de sécurité indépendant, que nous demandons par ailleurs.*
