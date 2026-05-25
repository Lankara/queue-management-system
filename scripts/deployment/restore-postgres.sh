#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL restore helper for docker-compose.prod.yml.
# Usage: ./scripts/deployment/restore-postgres.sh backups/postgres/qms-backup.sql
# Stop API/worker before restoring production data.

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
SERVICE_NAME="${POSTGRES_SERVICE_NAME:-postgres}"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 path/to/backup.sql" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill production values first." >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

echo "About to restore $BACKUP_FILE into database $POSTGRES_DB."
echo "This may overwrite existing data depending on dump contents."
read -r -p "Type RESTORE to continue: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Restore cancelled."
  exit 1
fi

cat "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restore complete."