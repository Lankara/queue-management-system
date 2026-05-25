# Phase 02: Database Foundation

## What Was Implemented

- Added minimal PostgreSQL connection support to the NestJS API using `pg` and a reusable `Pool`.
- Added `DatabaseModule` and `DatabaseService` under `apps/api/src/database`.
- Added `DatabaseService.query()`, `DatabaseService.getPool()`, and `DatabaseService.checkConnection()`.
- Added application shutdown handling so the PostgreSQL pool is closed when Nest shuts down.
- Added `GET /health/db`, which runs `SELECT NOW()` and returns:

```json
{
  "status": "ok",
  "database": "connected"
}
```

If the database is unavailable, the endpoint returns HTTP `503` with:

```json
{
  "status": "error",
  "database": "disconnected"
}
```

## How The Database Connection Works

The API reads `DATABASE_URL` from the environment and creates a shared `pg` Pool in `DatabaseService`. The service checks connectivity during startup and logs whether PostgreSQL is reachable. Future modules can inject `DatabaseService` for direct SQL access or replace this layer when Prisma is introduced later.

`DATABASE_SSL` is optional. Set it to `true`, `1`, `yes`, or `require` only when the PostgreSQL server requires SSL.

## DATABASE_URL Configuration

Example local connection string:

```text
postgresql://postgres:password@localhost:5432/queue_management_db
```

For local development, add the real value to an environment file or shell environment. Do not commit real database credentials.

## Intentionally Not Implemented Yet

- No Prisma schema.
- No ORM setup with Prisma, TypeORM, or Sequelize.
- No repositories, entities, or models.
- No authentication logic.
- No queue, customer, appointment, notification, WhatsApp, or business modules.
- No database migrations were changed in this phase.