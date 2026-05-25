#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL logical backup helper for docker-compose.prod.yml.
# Run from the repository root on the server.

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-backups/postgres}"
SERVICE_NAME="${POSTGRES_SERVICE_NAME:-postgres}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill production values first." >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/qms-${POSTGRES_DB}-$(date +%Y%m%d-%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"
echo "Backup complete: $BACKUP_FILE"