#!/usr/bin/env bash
# Isolated Docker Compose smoke test for CI (main / manual workflows).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PROJECT="ci-smoke-${GITHUB_RUN_ID:-local}-$(date +%s)"
export COMPOSE_PROJECT_NAME="$PROJECT"

cleanup() {
  docker compose -p "$PROJECT" down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

export POSTGRES_DB="${POSTGRES_DB:-immigration_ci}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export PORT="${PORT:-5000}"
export CLIENT_URL="${CLIENT_URL:-http://127.0.0.1}"
export BASE_URL="${BASE_URL:-http://127.0.0.1/api}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/immigration_ci}"
export CHROMIUM_PATH="${CHROMIUM_PATH:-/usr/bin/chromium}"
export AUTH_TOKEN_SECRET="${AUTH_TOKEN_SECRET:-ci-auth-token-secret-with-at-least-32-chars}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-change-me-admin-password}"
export ADMIN_NAME="${ADMIN_NAME:-CI Administrator}"
export VITE_API_URL="${VITE_API_URL:-/api}"
export NODE_ENV="${NODE_ENV:-production}"

echo "Starting compose project: $PROJECT"
docker compose -p "$PROJECT" up -d --build

wait_for() {
  local url="$1"
  local label="$2"
  for i in $(seq 1 60); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "$label is ready"
      return 0
    fi
    sleep 5
  done
  echo "$label failed to become ready"
  docker compose -p "$PROJECT" logs
  return 1
}

wait_for "http://127.0.0.1/api/health" "backend health"
wait_for "http://127.0.0.1/api/ready" "backend ready"
wait_for "http://127.0.0.1/" "frontend"

echo "Checking migration head via /api/ready"
READY_JSON="$(curl -sf http://127.0.0.1/api/ready)"
echo "$READY_JSON" | grep -q '"status":"ready"' || {
  echo "Migration head check failed: $READY_JSON"
  exit 1
}

echo "Auth smoke: register unverified user"
REGISTER_RESP="$(curl -sf -X POST http://127.0.0.1/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-user@example.com","password":"SmokeTestPass1!","name":"Smoke User"}')"
echo "$REGISTER_RESP" | grep -q '"emailVerified":false' || {
  echo "Expected unverified registration response"
  exit 1
}

echo "Restricted session: /api/account should require verified email"
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/account \
  -H "Cookie: $(echo "$REGISTER_RESP" | grep -o 'refreshToken=[^;]*' || true)")"
if [[ "$HTTP_CODE" != "401" && "$HTTP_CODE" != "403" ]]; then
  echo "Expected 401/403 for unverified account access, got $HTTP_CODE"
  exit 1
fi

echo "Compose smoke passed for project $PROJECT"
