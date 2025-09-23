#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

# --- ENV 必須 & バリデーション ---
: "${ENV:?ENV is required (production|staging)}"
case "$ENV" in
  production|staging) ;;
  *) echo "ENV must be one of: production | staging" >&2; exit 2 ;;
esac

# --- スクリプトの場所を基準に絶対パス解決 ---
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
# INFRA_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"        # => packages/infrastructure
API_DIR="$(cd "$SCRIPT_DIR/../../../api" && pwd)"   # => packages/api

case "$ENV" in
  production)   VARS_FILE="$SCRIPT_DIR/.env.production" ;;
  staging)      VARS_FILE="$SCRIPT_DIR/.env.staging"  ;;
esac

cd "$API_DIR"
pnpm wrangler secret bulk "$VARS_FILE" --env "$ENV"