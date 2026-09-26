#!/usr/bin/env bash
# remove-api.sh — Takes the backend out of an app that has none: apps/api, packages/shared,
# the Worker's workflow and scripts, and the network layer the mobile app keeps only to talk to it.
#
# Usage:
#   bash scripts/remove-api.sh         # lists what goes, then asks
#   bash scripts/remove-api.sh --yes   # no question
#
# Idempotent. It refuses a working tree with uncommitted changes, so that everything it removes is
# one diff git can take back — nothing else can.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BOLD=$'\033[1m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
RESET=$'\033[0m'

info()    { printf "%s%s%s\n"    "$CYAN"   "$*" "$RESET"; }
success() { printf "%s%s%s\n"    "$GREEN"  "$*" "$RESET"; }
warn()    { printf "%s%s%s\n"    "$YELLOW" "$*" "$RESET"; }
header()  { printf "\n%s%s%s\n" "$BOLD"   "$*" "$RESET"; }

ASSUME_YES=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y) ASSUME_YES=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

cd "$REPO_ROOT"

if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: the working tree has uncommitted changes. Commit or stash them first, so that" >&2
    echo "what this script removes is one diff you can review and take back." >&2
    exit 1
  fi
else
  warn "Not a git repository: nothing will be able to bring back what this script deletes."
fi

REMOVED_PATHS=(
  apps/api
  packages/shared
  .github/workflows/ci-api.yml
  apps/mobile/providers/QueryProvider.tsx
  apps/mobile/hooks/useNetworkStatus.ts
  apps/mobile/utils/retry.ts
  apps/mobile/utils/apiErrors.ts
  apps/mobile/services/api/backendClient.ts
  apps/mobile/services/api/exampleService.ts
  apps/mobile/types/api.ts
)

header "Removing the backend"
info "Deleted:"
for p in "${REMOVED_PATHS[@]}"; do printf "  %s\n" "$p"; done
info "Edited:"
cat <<'LIST'
  package.json              the dev:api and deploy:api scripts
  turbo.json                the deploy task
  pnpm-workspace.yaml       packages/*
  apps/mobile/package.json  axios, @tanstack/* (3) and @react-native-community/netinfo
  apps/mobile/app/_layout.tsx, constants/config.ts, app.config.js, .env.example,
  types/index.ts, services/api/purchaseService.ts
  apps/mobile/i18n/languages/*.json   the error.* keys, read only by the removed files
LIST

if [[ "$ASSUME_YES" != true ]]; then
  echo ""
  read -rp "Remove all of it? [y/N]: " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Nothing removed."
    exit 0
  fi
fi

rm -rf "${REMOVED_PATHS[@]}"
rmdir packages 2> /dev/null || true

node - "$REPO_ROOT" <<'NODE_SCRIPT'
const fs = require('fs')
const path = require('path')
const [, , repoRoot] = process.argv

function edit(relPath, replacer) {
  const file = path.join(repoRoot, relPath)
  if (!fs.existsSync(file)) return
  const before = fs.readFileSync(file, 'utf8')
  const after = replacer(before)
  if (after !== before) fs.writeFileSync(file, after, 'utf8')
}

function editJson(relPath, mutate) {
  edit(relPath, (src) => {
    const json = JSON.parse(src)
    mutate(json)
    return `${JSON.stringify(json, null, 2)}\n`
  })
}

function dropLines(src, pattern) {
  return src
    .split('\n')
    .filter((line) => !pattern.test(line))
    .join('\n')
}

editJson('package.json', (json) => {
  delete json.scripts['dev:api']
  delete json.scripts['deploy:api']
})

edit('turbo.json', (src) => src.replace(/,\s*"deploy":\s*\{[^}]*\}/, ''))

edit('pnpm-workspace.yaml', (src) => dropLines(src, /^\s*-\s*"packages\/\*"\s*$/))

editJson('apps/mobile/package.json', (json) => {
  for (const dep of [
    'axios',
    '@tanstack/react-query',
    '@tanstack/react-query-persist-client',
    '@tanstack/query-async-storage-persister',
    '@react-native-community/netinfo',
  ]) {
    delete json.dependencies[dep]
  }
})

edit('apps/mobile/app/_layout.tsx', (src) => {
  const lines = src.split('\n').filter((line) => !line.includes("from '@/providers/QueryProvider'"))
  const open = lines.findIndex((line) => line.trim() === '<QueryProvider>')
  const close = lines.findIndex((line) => line.trim() === '</QueryProvider>')
  if (open === -1 || close === -1) return lines.join('\n')
  const inner = lines.slice(open + 1, close).map((line) => line.replace(/^ {2}/, ''))
  return [...lines.slice(0, open), ...inner, ...lines.slice(close + 1)].join('\n')
})

edit('apps/mobile/constants/config.ts', (src) =>
  src.replace(/export const BACKEND_CONFIG = \{[\s\S]*?\n\}\n\n/, '')
)

edit('apps/mobile/app.config.js', (src) => dropLines(src, /^\s*backend(Url|ApiKey): process\.env\./))

edit('apps/mobile/.env.example', (src) =>
  src.replace(/\n# ─+\n# Backend API[^\n]*\n# ─+\n(BACKEND_[A-Z_]+=[^\n]*\n)+/, '')
)

edit('apps/mobile/types/index.ts', (src) => dropLines(src, /^export \* from '\.\/api'$/))

edit('apps/mobile/services/api/purchaseService.ts', (src) =>
  src.replace(/\n {2}async getAppUserId\(\)[^\n]*\n[^\n]*\n {2}\},\n/, '')
)

const localesDir = path.join(repoRoot, 'apps/mobile/i18n/languages')
if (fs.existsSync(localesDir)) {
  for (const entry of fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'))) {
    editJson(path.join('apps/mobile/i18n/languages', entry), (json) => {
      delete json.error
    })
  }
}
NODE_SCRIPT

success "Backend removed."

header "Updating the lockfile"
pnpm install

header "Left to you"
cat <<'NOTE'
  - Run `pnpm typecheck` and `pnpm lint`.
  - BACKEND_URL and BACKEND_API_KEY no longer mean anything: drop them from apps/mobile/.env and
    from the MOBILE_DOTENV repository secret, and delete the CLOUDFLARE_* secrets if you set them.
  - Update the docs that describe the backend: CLAUDE.md (Project Overview, Commands, Continuous
    delivery, API Layer, Data Fetching, Architecture (api), Code Style), apps/mobile/PROJECT_CONTEXT.md
    and README.md.
NOTE
