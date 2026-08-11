#!/usr/bin/env bash
#
# Déploiement de la plateforme « Prévention Santé » sur le serveur AZNETWORK.
#
# Ce script est IDEMPOTENT : on peut le relancer autant de fois que nécessaire,
# il remet le site ET le serveur applicatif à l'état de la branche demandée.
#
# CE QU'IL FAIT
#   1. clone (ou met à jour) le dépôt public dans un répertoire de travail ;
#   2. recopie le dossier « prevention-sante/ » vers la racine web ;
#   3. exclut les fichiers qui ne doivent pas être servis (voir EXCLUSIONS) ;
#   4. remet les droits, puis recharge nginx après avoir testé sa configuration ;
#   5. installe le serveur applicatif Node (dossier serveur/), ses dépendances
#      (npm ci), applique les migrations de base qui manquent, puis redémarre
#      le service et vérifie que l'API répond.
#
# CE QU'IL NE FAIT PAS
#   Il ne crée NI la base, NI l'utilisateur système, NI les secrets : ces gestes
#   sont manuels et faits une seule fois (voir la note de déploiement, § 3.2).
#   Un script qui recréerait la base ou régénérerait la clé de chiffrement à
#   chaque passage détruirait les données au deuxième lancement. Le script
#   REFUSE d'ailleurs de démarrer le serveur si /etc/prevention-sante.env est
#   absent ou si CLE_CHIFFREMENT / DATABASE_URL sont vides.
#
# DONNÉES DE SANTÉ
#   La plateforme traite de vraies données de santé côté serveur (PostgreSQL).
#   Ce n'est plus la maquette 100 % statique décrite par la première version de
#   ce fichier : installer cette version-là reviendrait à déployer la maquette
#   en croyant déployer la plateforme.
#
# USAGE
#   sudo ./deployer.sh                 # déploiement ou mise à jour
#   sudo DRY_RUN=1 ./deployer.sh       # simulation, n'écrit rien
#   sudo SANS_SERVICE=1 ./deployer.sh  # ne toucher qu'aux pages du site
#
set -euo pipefail

# ------------------------------------------------------------------ réglages
DEPOT="${DEPOT:-https://github.com/DEV-SANTE/lemedecinlibre.com.git}"
BRANCHE="${BRANCHE:-main}"
SOUS_DOSSIER="${SOUS_DOSSIER:-prevention-sante}"
TRAVAIL="${TRAVAIL:-/opt/prevention-sante/depot}"     # clone de travail
RACINE_WEB="${RACINE_WEB:-/var/www/prevention-sante}" # servi par nginx
RACINE_APPLI="${RACINE_APPLI:-/opt/prevention-sante/serveur}" # serveur Node
SERVICE="${SERVICE:-prevention-sante}"
FICHIER_ENV="${FICHIER_ENV:-/etc/prevention-sante.env}"
PROPRIETAIRE="${PROPRIETAIRE:-www-data:www-data}"
PROPRIETAIRE_APPLI="${PROPRIETAIRE_APPLI:-prevention:prevention}"
DRY_RUN="${DRY_RUN:-0}"
SANS_SERVICE="${SANS_SERVICE:-0}"   # 1 = ne déployer que les fichiers du site

# Fichiers présents dans le dépôt mais qui NE DOIVENT PAS être servis.
#   verifier.js : outil de contrôle interne, chargé par aucune page ; il
#                 décrirait publiquement toute la logique de vérification.
#   README.md   : notes internes, base juridique, consignes de rédaction.
EXCLUSIONS=(
  "--exclude=plateforme/verifier.js"
  "--exclude=README.md"
  "--exclude=deploiement/"
  "--exclude=.git/"
)

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
mourir() { printf '[ERREUR] %s\n' "$*" >&2; exit 1; }

# ------------------------------------------------------------- préconditions
for outil in git rsync; do
  command -v "$outil" >/dev/null || mourir "$outil est absent. Installez-le d'abord."
done
[[ $EUID -eq 0 ]] || log "AVERTISSEMENT : lancé sans les droits root, la remise des droits échouera peut-être."

# --------------------------------------------------- dépôt : clone ou mise à jour
if [[ -d "$TRAVAIL/.git" ]]; then
  log "Mise à jour du dépôt existant dans $TRAVAIL"
  git -C "$TRAVAIL" fetch --depth 1 origin "$BRANCHE"
  git -C "$TRAVAIL" reset --hard "origin/$BRANCHE"   # écrase toute modif locale
else
  log "Premier clone de $DEPOT (branche $BRANCHE)"
  mkdir -p "$(dirname "$TRAVAIL")"
  git clone --depth 1 --branch "$BRANCHE" "$DEPOT" "$TRAVAIL"
fi

SOURCE="$TRAVAIL/$SOUS_DOSSIER"
[[ -d "$SOURCE" ]] || mourir "Le dossier $SOUS_DOSSIER est absent du dépôt."
[[ -f "$SOURCE/index.html" ]] || mourir "index.html introuvable dans $SOURCE."

REVISION="$(git -C "$TRAVAIL" rev-parse --short HEAD)"
log "Révision déployée : $REVISION"

# ------------------------------------------------------------------- recopie
mkdir -p "$RACINE_WEB"
OPTIONS_RSYNC=(-a --delete --human-readable "${EXCLUSIONS[@]}")
if [[ "$DRY_RUN" == "1" ]]; then
  log "SIMULATION — rien ne sera écrit"
  OPTIONS_RSYNC+=(--dry-run --itemize-changes)
fi
rsync "${OPTIONS_RSYNC[@]}" "$SOURCE"/ "$RACINE_WEB"/

if [[ "$DRY_RUN" == "1" ]]; then
  log "Simulation terminée."; exit 0
fi

# Trace de la version déployée, utile en cas d'incident.
printf 'revision=%s\nbranche=%s\ndeploye_le=%s\n' \
  "$REVISION" "$BRANCHE" "$(date -Is)" > "$RACINE_WEB/.version"

# --------------------------------------------------------------------- droits
chown -R "$PROPRIETAIRE" "$RACINE_WEB" 2>/dev/null || log "chown ignoré."
find "$RACINE_WEB" -type d -exec chmod 755 {} +
find "$RACINE_WEB" -type f -exec chmod 644 {} +

# ---------------------------------------------------------------------- nginx
if command -v nginx >/dev/null; then
  log "Test de la configuration nginx"
  nginx -t
  log "Rechargement de nginx"
  nginx -s reload || systemctl reload nginx
fi

# ------------------------------------------------------------- vérifications
log "Contrôles après déploiement :"
for f in index.html suivi/index.html plateforme/index.html commun/depistages.js; do
  [[ -f "$RACINE_WEB/$f" ]] && log "  present : $f" || mourir "  MANQUANT : $f"
done
if [[ -f "$RACINE_WEB/plateforme/verifier.js" ]]; then
  mourir "  verifier.js a été copié alors qu'il devait être exclu."
else
  log "  correctement exclu : plateforme/verifier.js"
fi
# =====================================================================
#  SERVEUR APPLICATIF
# =====================================================================
if [[ "$SANS_SERVICE" == "1" ]]; then
  log "SANS_SERVICE=1 : le serveur applicatif n'est pas touché."
  log "Déploiement terminé — révision $REVISION"
  exit 0
fi

SOURCE_APPLI="$TRAVAIL/serveur"
if [[ ! -d "$SOURCE_APPLI" ]]; then
  log "Le dépôt ne contient pas de dossier serveur/ : rien d'autre à faire."
  log "Déploiement terminé — révision $REVISION"
  exit 0
fi

# Les secrets doivent exister AVANT de démarrer. Sans clé de chiffrement,
# le serveur refuse d'enregistrer un numéro de sécurité sociale — ce qui
# est le bon comportement, mais vaut mieux le savoir maintenant.
if [[ ! -f "$FICHIER_ENV" ]]; then
  mourir "Fichier de configuration absent : $FICHIER_ENV
  Copiez prevention-sante.env.exemple, renseignez-le, puis :
    chown root:prevention $FICHIER_ENV && chmod 640 $FICHIER_ENV"
fi
if ! grep -q '^CLE_CHIFFREMENT=.\+' "$FICHIER_ENV"; then
  mourir "CLE_CHIFFREMENT est vide dans $FICHIER_ENV.
  Générez-la UNE SEULE FOIS : cd $RACINE_APPLI && npm run cle
  Si vous la changez, les valeurs déjà chiffrées deviennent illisibles."
fi
if ! grep -q '^DATABASE_URL=.\+' "$FICHIER_ENV"; then
  mourir "DATABASE_URL est vide dans $FICHIER_ENV."
fi
if grep -q 'DATABASE_URL=postgres://postgres' "$FICHIER_ENV"; then
  log "AVERTISSEMENT : la base semble accédée avec le compte « postgres »."
  log "  Le propriétaire des tables CONTOURNE les politiques de sécurité au"
  log "  niveau des lignes. Utilisez le rôle prevention_appli."
fi

log "Installation du serveur applicatif dans $RACINE_APPLI"
mkdir -p "$RACINE_APPLI"
rsync -a --delete --exclude='node_modules/' --exclude='.git/' \
      "$SOURCE_APPLI"/ "$RACINE_APPLI"/

log "Dépendances (npm ci, production seulement)"
command -v npm >/dev/null || mourir "npm est absent."
( cd "$RACINE_APPLI" && npm ci --omit=dev --no-audit --no-fund )

log "Migrations de base de données"
# migrer est idempotent : il n'applique que ce qui manque, et s'arrête si
# une migration déjà passée a été modifiée depuis.
( cd "$RACINE_APPLI" && set -a && . "$FICHIER_ENV" && set +a && npm run migrer )

chown -R "$PROPRIETAIRE_APPLI" "$RACINE_APPLI" 2>/dev/null || log "chown appli ignoré."

if command -v systemctl >/dev/null; then
  if [[ ! -f "/etc/systemd/system/$SERVICE.service" ]]; then
    log "AVERTISSEMENT : l'unité $SERVICE.service n'est pas installée."
    log "  Copiez prevention-sante.service dans /etc/systemd/system/ puis :"
    log "    systemctl daemon-reload && systemctl enable --now $SERVICE"
  else
    log "Redémarrage du service $SERVICE"
    systemctl restart "$SERVICE"
    sleep 2
    if systemctl is-active --quiet "$SERVICE"; then
      log "  service actif"
    else
      mourir "Le service n'a pas démarré. Voir : journalctl -u $SERVICE -n 50"
    fi
  fi
fi

# ------------------------------------------------- vérification de bout en bout
if command -v curl >/dev/null; then
  log "Contrôle de l'API"
  CODE=$(curl -so /dev/null -w '%{http_code}' --max-time 10 \
         http://127.0.0.1:"${PORT_APPLI:-3000}"/api/moi || echo 000)
  if [[ "$CODE" == "401" ]]; then
    log "  l'API répond et refuse un accès sans session (401) : correct"
  else
    log "  AVERTISSEMENT : /api/moi a renvoyé $CODE au lieu de 401."
    log "  401 est la réponse attendue : elle prouve que l'API tourne ET"
    log "  qu'elle exige une session."
  fi
fi

log "Déploiement terminé — révision $REVISION"
log "Rappel : le site reste derrière un mot de passe tant que l'ouverture au"
log "public n'a pas été décidée explicitement (voir la conf nginx)." 
