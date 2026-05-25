# Phase 34 - Migration Runner and One-Command Database Setup

## Goal

Remove the manual pgAdmin-only setup path for local and Docker development by adding repeatable scripts for migrations, seeds, validation, and guarded reset.

## Scripts added

- `scripts/db/migrate.ps1`
- `scripts/db/seed.ps1`
- `scripts/db/validate.ps1`
- `scripts/db/setup.ps1`
- `scripts/db/reset-dev.ps1`

## Root commands

```powershell
pnpm db:migrate
pnpm db:seed
pnpm db:setup
pnpm db:validate
pnpm db:reset:dev
```

## Execution order

`pnpm db:setup` runs:

1. `database/migrations/001_init_extensions.sql`
2. `database/migrations/002_core_enums.sql`
3. `database/migrations/003_core_tables.sql`
4. `database/migrations/004_indexes_constraints.sql`
5. `database/migrations/005_seed_master_data.sql`
6. `database/seeds/dev_sample_data.sql`
7. `database/seeds/dev_auth_users.sql`
8. `database/docs/validate_database.sql`

## Docker compatibility

The scripts use `docker compose exec -T postgres psql`, so they run against the local Docker PostgreSQL service by default.

Optional parameters support alternate database/user/service names:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/db/setup.ps1 -Database queue_management_db -User postgres -Service postgres
```

## Reset protections

`reset-dev.ps1` refuses to run unless the script receives `-Force`. The root `pnpm db:reset:dev` command includes this flag for local convenience. The script also refuses to run when `NODE_ENV=production`.

## Current limitations

- This is a local/Docker runner, not a production migration orchestration system.
- It does not track migration history in a database table yet.
- SQL files remain idempotent where practical, but destructive reset is still development-only.

## Future roadmap

- Add migration history tracking.
- Add CI database bootstrap job.
- Add production release migration workflow.
- Add automatic Docker init only when explicitly requested.
