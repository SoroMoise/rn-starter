#!/usr/bin/env bash
# Vercel's Ignored Build Step: exit 0 skips the deployment, anything else builds.
# Vercel's own skip and turbo-ignore count any file at the repository's root as
# a change to every project (CLAUDE.md alone redeployed the site): only what the
# site's build reads is compared, and whatever can't be compared builds.
set -u
site="$(cd "$(dirname "$0")/.." && git rev-parse --show-prefix)" || exit 1
cd "$(git rev-parse --show-toplevel)" || exit 1

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$base" ]; then
  git cat-file -e "$base^{commit}" 2>/dev/null || git fetch --quiet --depth=1 origin "$base" || exit 1
else
  # A branch's first deployment has no previous one: compare with main.
  git fetch --quiet --depth=1 origin main || exit 1
  base="$(git rev-parse FETCH_HEAD)" || exit 1
fi
[ "$(git rev-parse HEAD)" != "$(git rev-parse "$base^{commit}")" ] || exit 1

if git diff --quiet "$base" HEAD -- "$site" package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc patches; then
  echo "Nothing the site's build reads changed since ${base}: skipping."
  exit 0
fi
echo "The site's inputs changed since ${base}: building."
exit 1
