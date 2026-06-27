#!/usr/bin/env bash
# setup.sh — Personalizes the rn-starter template.
#
# Usage:
#   bash scripts/setup.sh                        # interactive
#   bash scripts/setup.sh \
#     --name "My App" \
#     --slug "my-app" \
#     --bundle "com.acme.myapp" \
#     --scheme "myapp"                           # non-interactive
#
# Idempotent: safe to run multiple times.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_CONFIG="$REPO_ROOT/apps/mobile/app.config.js"
MOBILE_ENV="$REPO_ROOT/apps/mobile/.env"
MOBILE_ENV_EXAMPLE="$REPO_ROOT/apps/mobile/.env.example"
API_VARS="$REPO_ROOT/apps/api/.dev.vars"
API_VARS_EXAMPLE="$REPO_ROOT/apps/api/.dev.vars.example"

# ─── Color helpers ────────────────────────────────────────────────────────────
BOLD=$'\033[1m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
RESET=$'\033[0m'

info()    { printf "%s%s%s\n"    "$CYAN"   "$*" "$RESET"; }
success() { printf "%s%s%s\n"    "$GREEN"  "$*" "$RESET"; }
warn()    { printf "%s%s%s\n"    "$YELLOW" "$*" "$RESET"; }
header()  { printf "\n%s%s%s\n" "$BOLD"   "$*" "$RESET"; }

# ─── Parse CLI args ───────────────────────────────────────────────────────────
APP_NAME=""
APP_SLUG=""
BUNDLE_ID=""
SCHEME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)   APP_NAME="$2";   shift 2 ;;
    --slug)   APP_SLUG="$2";   shift 2 ;;
    --bundle) BUNDLE_ID="$2";  shift 2 ;;
    --scheme) SCHEME="$2";     shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ─── Interactive prompts (only for missing values) ────────────────────────────
header "RN Starter — Setup"
info "This script personalizes the template and copies example secret files."
echo ""

prompt() {
  local var_name="$1"
  local prompt_text="$2"
  local default_val="$3"
  local current_val="${!var_name}"

  if [[ -n "$current_val" ]]; then
    return
  fi

  if [[ -n "$default_val" ]]; then
    read -rp "$prompt_text [$default_val]: " input
    eval "$var_name=\"${input:-$default_val}\""
  else
    read -rp "$prompt_text: " input
    eval "$var_name=\"$input\""
  fi
}

prompt APP_NAME   "App display name (e.g. My App)"       "RN Starter"
prompt APP_SLUG   "Expo slug (lowercase, hyphens only)"   "rn-starter"
prompt BUNDLE_ID  "Bundle ID (reverse-DNS)"               "com.yourcompany.rnstarter"
prompt SCHEME     "URL scheme (lowercase, no hyphens)"    "rnstarter"

# Basic validation
if [[ -z "$APP_NAME" || -z "$APP_SLUG" || -z "$BUNDLE_ID" || -z "$SCHEME" ]]; then
  echo "Error: all four values are required." >&2
  exit 1
fi

# ─── Patch app.config.js ──────────────────────────────────────────────────────
header "Patching apps/mobile/app.config.js"

if [[ ! -f "$APP_CONFIG" ]]; then
  echo "Error: $APP_CONFIG not found." >&2
  exit 1
fi

# Use node for reliable multi-line-safe replacements
node - "$APP_CONFIG" "$APP_NAME" "$APP_SLUG" "$BUNDLE_ID" "$SCHEME" <<'NODE_SCRIPT'
const fs = require('fs')
const [, , configPath, appName, appSlug, bundleId, scheme] = process.argv

let src = fs.readFileSync(configPath, 'utf8')

// name: 'RN Starter'  ->  name: '<AppName>'
src = src.replace(/(name:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${appName}$4`)

// slug: 'rn-starter'  ->  slug: '<appSlug>'
src = src.replace(/(slug:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${appSlug}$4`)

// scheme: 'rnstarter'  ->  scheme: '<scheme>'
src = src.replace(/(scheme:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${scheme}$4`)

// bundleIdentifier: 'com.yourcompany.rnstarter'  ->  bundleIdentifier: '<bundleId>'
src = src.replace(/(bundleIdentifier:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${bundleId}$4`)

// applicationId: 'com.yourcompany.rnstarter'  ->  applicationId: '<bundleId>'
src = src.replace(/(applicationId:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${bundleId}$4`)

// package: 'com.yourcompany.rnstarter'  (in intentFilters data)
src = src.replace(/(package:\s*)(['"`])([^'"`]*)(['"`])/, `$1$2${bundleId}$4`)

fs.writeFileSync(configPath, src, 'utf8')
NODE_SCRIPT

success "app.config.js updated."
info "  name     = $APP_NAME"
info "  slug     = $APP_SLUG"
info "  bundleId = $BUNDLE_ID"
info "  scheme   = $SCHEME"

# ─── Copy example files if absent ─────────────────────────────────────────────
header "Copying example secret files (if absent)"

if [[ ! -f "$MOBILE_ENV" ]]; then
  cp "$MOBILE_ENV_EXAMPLE" "$MOBILE_ENV"
  success "Created apps/mobile/.env from .env.example — fill in your real values."
else
  warn "apps/mobile/.env already exists — skipped."
fi

if [[ ! -f "$API_VARS" ]]; then
  cp "$API_VARS_EXAMPLE" "$API_VARS"
  success "Created apps/api/.dev.vars from .dev.vars.example — fill in your real values."
else
  warn "apps/api/.dev.vars already exists — skipped."
fi

# ─── Next steps ───────────────────────────────────────────────────────────────
header "Next steps"
echo ""
echo "  1. pnpm install"
echo ""
echo "  2. Edit apps/mobile/.env with your AdMob, RevenueCat, Backend, and other keys."
echo "     See apps/mobile/.env.example for all variables and comments."
echo ""
echo "  3. Add Firebase config files:"
echo "     - apps/mobile/google-services.json  (Android — use google-services.json.example as template)"
echo "     - apps/mobile/GoogleService-Info.plist  (iOS — download from Firebase Console)"
echo ""
echo "  4. Edit apps/api/.dev.vars with your API_KEY and Firebase credentials."
echo ""
echo "  5. Generate native projects:"
echo "     pnpm --filter mobile preb"
echo ""
echo "  6. Start dev servers:"
echo "     pnpm dev:mobile"
echo "     pnpm dev:api"
echo ""
success "Setup complete. Happy building!"
