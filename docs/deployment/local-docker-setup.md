# Local Docker Setup

This setup runs a local production-like Queue Management System stack with Docker Compose:

- PostgreSQL on `localhost:5432`
- API on `http://localhost:4000/api`
- Web dashboard and public QR pages on `http://localhost:3000`
- Notification worker connected to the API

## Prerequisites

- Docker Desktop with Compose v2
- Ports `3000`, `4000`, and `5432` available
- Existing database migrations available in `database/migrations`

## Environment setup

The compose file includes safe local defaults. To override values, copy the example file:

```powershell
Copy-Item .env.docker.example .env.docker
```

Then pass it explicitly when needed:

```powershell
docker compose --env-file .env.docker up --build
```

WhatsApp is disabled by default and dev mode is enabled.

## Start the stack

```powershell
docker compose up --build
```

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker/start-local.ps1
```

Detached mode:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker/start-local.ps1 -Detached
```

## Stop the stack

```powershell
docker compose down
```

Helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker/stop-local.ps1
```

## Rebuild images

```powershell
docker compose build
```

No-cache rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker/rebuild-local.ps1 -NoCache
```

## Database setup and seeds

The PostgreSQL container creates `queue_management_db` automatically. Run the local database setup command after PostgreSQL is healthy:

```powershell
pnpm db:setup
```

This runs migrations `001` to `005`, then local dev seeds, then the validation SQL.

Individual commands are also available:

```powershell
pnpm db:migrate
pnpm db:seed
pnpm db:validate
```

For a clean local development reset:

```powershell
pnpm db:reset:dev
```

The reset command drops and recreates the `public` schema, then reruns migrations, seeds, and validation. It is guarded for local development and refuses to run without the script-level force flag.

Seed order:

1. `database/seeds/dev_sample_data.sql`
2. `database/seeds/dev_auth_users.sql`

Queue entries and appointments are intentionally created through API flows, not seed files.

## Useful commands

```powershell
docker compose logs -f api
docker compose logs -f web
docker compose logs -f worker
docker compose restart worker
docker compose ps
```

## Health checks

API:

```powershell
Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing
```

Web:

```powershell
Invoke-WebRequest http://localhost:3000/login -UseBasicParsing
```

## Ports

- Web: `3000`
- API: `4000`
- PostgreSQL: `5432`

## Volume cleanup

To remove containers and the PostgreSQL volume:

```powershell
docker compose down -v
```

This deletes local database data. Use only when you want a clean local database.

## Troubleshooting

- If API is unhealthy, check `docker compose logs -f api` and run `pnpm db:setup` after PostgreSQL is healthy.
- If web cannot reach API, confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.
- If worker reports missing token, either keep `NOTIFICATION_WORKER_ENABLED=false` or provide `WORKER_API_ACCESS_TOKEN`.
- If PostgreSQL port is busy, set `POSTGRES_PORT` in `.env.docker` and start with `--env-file`.
