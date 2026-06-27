#!/usr/bin/env bash
# Aggiorna lo spec DO di ideadiluce-platform (merge completo, no UI).
#
# Uso:
#   DIGITALOCEAN_ACCESS_TOKEN=dop_v1_... ./scripts/do-update-platform-spec.sh
#
# Token: https://cloud.digitalocean.com/account/api/tokens (Read + Write)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC="${1:-$ROOT/.do/app.platform.paste.yaml}"
APP_NAME="${DO_APP_NAME:-ideadiluce-pwa}"

if [[ ! -f "$SPEC" ]]; then
  echo "Spec non trovato: $SPEC" >&2
  exit 1
fi

TOKEN="${DIGITALOCEAN_ACCESS_TOKEN:-${DOCTL_ACCESS_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "Errore: imposta DIGITALOCEAN_ACCESS_TOKEN (token DO con scope Read+Write)." >&2
  exit 1
fi

export DIGITALOCEAN_ACCESS_TOKEN="$TOKEN"

APP_ID="$(doctl apps list --format ID,Spec.Name --no-header | awk -v n="$APP_NAME" '$2 == n { print $1; exit }')"
if [[ -z "$APP_ID" ]]; then
  echo "App '$APP_NAME' non trovata. Apps disponibili:" >&2
  doctl apps list --format ID,Spec.Name
  exit 1
fi

echo "→ Update app $APP_NAME ($APP_ID) con $(basename "$SPEC")"
doctl apps update "$APP_ID" --spec "$SPEC" --format ID,DefaultIngress,ActiveDeployment.Phase
echo "✓ Spec inviato. Controlla il deploy in DO → Activity."
