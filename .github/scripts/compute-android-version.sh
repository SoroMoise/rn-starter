#!/usr/bin/env bash
#
# Computes the next Android version from Conventional Commits since the commit
# recorded in .last_release_commit, using the project's existing scheme:
#
#   feat            -> minor bump   (X.Y+1.0)
#   fix / chore / … -> patch bump   (X.Y.Z+1)
#   <type>! or a "BREAKING CHANGE" footer -> major bump (X+1.0.0)
#   versionCode = major*1000000 + minor*1000 + patch  (same formula as app.config.js)
#
# Base version is the current `version` in app.config.js (the last released
# version). The commit range excludes .last_release_commit itself, so a feat
# that already shipped is never counted twice.
#
# Emits `bump`, `old_version`, `version`, `version_code` to stdout and, when
# running in GitHub Actions, appends them to $GITHUB_OUTPUT.
set -euo pipefail

CONFIG="apps/mobile/app.config.js"
MARKER=".last_release_commit"

BASE=""
if [ -f "$MARKER" ]; then
  BASE="$(tr -d '[:space:]' < "$MARKER")"
fi

if [ -n "$BASE" ] && git merge-base --is-ancestor "$BASE" HEAD 2>/dev/null; then
  RANGE="$BASE..HEAD"
else
  echo "warning: .last_release_commit ('$BASE') is not an ancestor of HEAD; falling back to last commit" >&2
  RANGE="HEAD~1..HEAD"
fi

SUBJECTS="$(git log --format='%s' "$RANGE" || true)"
BODIES="$(git log --format='%b' "$RANGE" || true)"

if printf '%s\n' "$SUBJECTS" | grep -qE '^[a-z]+(\([^)]+\))?!:' \
  || printf '%s\n' "$BODIES" | grep -qE 'BREAKING[ -]CHANGE'; then
  BUMP=major
elif printf '%s\n' "$SUBJECTS" | grep -qE '^feat(\([^)]+\))?:'; then
  BUMP=minor
else
  BUMP=patch
fi

OLD_VERSION="$(grep -oE "const version = '[0-9]+\.[0-9]+\.[0-9]+'" "$CONFIG" \
  | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
if [ -z "$OLD_VERSION" ]; then
  echo "error: could not read version from $CONFIG" >&2
  exit 1
fi

IFS=. read -r MAJOR MINOR PATCH <<EOF
$OLD_VERSION
EOF

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
VERSION_CODE=$((MAJOR * 1000000 + MINOR * 1000 + PATCH))

echo "bump=$BUMP"
echo "old_version=$OLD_VERSION"
echo "version=$NEW_VERSION"
echo "version_code=$VERSION_CODE"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "bump=$BUMP"
    echo "old_version=$OLD_VERSION"
    echo "version=$NEW_VERSION"
    echo "version_code=$VERSION_CODE"
  } >> "$GITHUB_OUTPUT"
fi
