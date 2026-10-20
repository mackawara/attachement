#!/usr/bin/env bash
# Runs ON the VM from the repo root. Called by .github/workflows/deploy.yml.
set -euo pipefail

SERVICE=app
IMAGE=attachement-app

# 1. Fail fast if .env is missing a key that .env.example declares.
[ -f .env ] || { echo "::error::.env missing"; exit 1; }
missing=0
for key in $(grep -E '^[A-Z_][A-Z0-9_]*=' .env.example | cut -d= -f1); do
  if ! grep -Eq "^${key}=.+" .env; then
    # ALLOWED_EMAILS may legitimately be empty (= allow all).
    [ "$key" = "ALLOWED_EMAILS" ] && continue
    echo "Missing or empty env var: $key"; missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

# 2. Keep the running image so we can roll back.
docker image inspect "$IMAGE:latest" >/dev/null 2>&1 && docker tag "$IMAGE:latest" "$IMAGE:previous" || true

# 3. Build and (re)start.
docker compose up -d --build --remove-orphans

# 4. Wait for the container healthcheck (defined in docker-compose.yml).
cid=$(docker compose ps -q "$SERVICE")
for _ in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo starting)
  [ "$status" = healthy ] && { echo "Deploy OK"; docker image prune -f >/dev/null; exit 0; }
  [ "$status" = unhealthy ] && break
  sleep 5
done

# 5. Roll back.
echo "Healthcheck failed; rolling back"
docker compose logs --tail=50 "$SERVICE" || true
if docker image inspect "$IMAGE:previous" >/dev/null 2>&1; then
  docker tag "$IMAGE:previous" "$IMAGE:latest"
  docker compose up -d --no-build
fi
exit 1
