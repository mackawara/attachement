#!/usr/bin/env bash
# Upload a local env file (default: .env.production) as the APP_ENV secret of
# the "production" GitHub Environment, plus the VM SSH secrets if given.
# Usage: scripts/push-env-secrets.sh [env-file]
set -euo pipefail

FILE="${1:-.env.production}"
REPO="mackawara/attachement"
[ -f "$FILE" ] || { echo "$FILE not found"; exit 1; }

# Guard against shipping dev values to production.
if grep -Eq '^(MONGODB_URI|NEXTAUTH_URL)=.*(localhost|127\.0\.0\.1)' "$FILE"; then
  echo "Refusing: $FILE has localhost MONGODB_URI/NEXTAUTH_URL. Use production values."; exit 1
fi

gh api -X PUT "repos/$REPO/environments/production" --silent   # create env if missing
gh secret set APP_ENV --env production --repo "$REPO" < "$FILE"
echo "APP_ENV set from $FILE (includes MONGODB_URI)."
