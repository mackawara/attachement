#!/usr/bin/env bash
# Upload every KEY=value in a local env file (default: .env.production) as an
# individual secret of the "production" GitHub Environment.
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
gh secret set --env production --repo "$REPO" --env-file "$FILE"
echo "Secrets set from $FILE:"; grep -E '^[A-Z_][A-Z0-9_]*=' "$FILE" | cut -d= -f1
