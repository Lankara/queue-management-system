# PostgreSQL Backup and Restore

The production Docker setup stores PostgreSQL data in the `postgres_data` Docker volume. Back up the database regularly with `pg_dump` and keep copies outside the VM.

## Backup With pg_dump

From the project directory on the VM:

```bash
chmod +x scripts/deployment/backup-postgres.sh
./scripts/deployment/backup-postgres.sh
```

This creates a timestamped SQL dump in `backups/postgres/` by default.

Manual command:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  > backups/postgres/qms-$(date +%Y%m%d-%H%M%S).sql
```

## Download Backup Locally

From your local machine:

```bash
scp ubuntu@YOUR_VM_PUBLIC_IP:/path/to/queue-management-system/backups/postgres/qms-YYYYMMDD-HHMMSS.sql .
```

## Restore

Upload a backup if needed:

```bash
scp qms-backup.sql ubuntu@YOUR_VM_PUBLIC_IP:/path/to/queue-management-system/backups/postgres/
```

Run:

```bash
chmod +x scripts/deployment/restore-postgres.sh
./scripts/deployment/restore-postgres.sh backups/postgres/qms-backup.sql
```

Restoring can overwrite data depending on the SQL dump contents. Stop API and worker first when restoring production data:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop api worker
./scripts/deployment/restore-postgres.sh backups/postgres/qms-backup.sql
docker compose --env-file .env.production -f docker-compose.prod.yml start api worker
```

## Docker Volume Backup Note

A raw Docker volume backup is useful for disaster recovery, but `pg_dump` is safer for portable logical backups. Prefer scheduled `pg_dump` plus occasional full VM snapshots if available.

## Scheduled Backups

Use cron on the VM:

```bash
crontab -e
```

Example daily backup at 2:30 AM:

```cron
30 2 * * * cd /path/to/queue-management-system && ./scripts/deployment/backup-postgres.sh >> backups/postgres/backup.log 2>&1
```

Regularly copy backups off the VM.