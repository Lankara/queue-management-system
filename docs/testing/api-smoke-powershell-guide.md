# API Smoke PowerShell Guide

This guide explains how to run the backend smoke scripts for the Queue Management System API.

## Start the API

From the monorepo root:

```powershell
pnpm --filter @queue-management/api dev
```

The scripts expect the API at:

```text
http://localhost:4000/api
```

To use a different URL:

```powershell
$env:API_BASE_URL = 'http://localhost:4001/api'
```

## Seed Development Auth Users

Before running authenticated smoke scripts, run these SQL files in pgAdmin 4 after migrations:

1. `database/seeds/dev_sample_data.sql`
2. `database/seeds/dev_auth_users.sql`

Development login credentials:

- Super admin: `admin@example.com` / `Admin@123456`
- Business owner: `owner@example.com` / `Owner@123456`

The smoke runner logs in as the business owner and stores the JWT access token in `scripts/api-smoke/.tmp/ids.json`. Protected requests automatically use that token as `Authorization: Bearer <token>`.

## Run All Smoke Scripts

From the monorepo root:

```powershell
pnpm smoke:api
```

Or run the script directly:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-all.ps1
```

`run-all.ps1` clears old temporary IDs, then runs the scripts in order.

## Run Individual Scripts

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/00-health.ps1
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/01-business-setup.ps1
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/02-customer-profile.ps1
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/03-queue-flow.ps1
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/04-appointment-flow.ps1
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/05-delay-notification-flow.ps1
```

Run them in order because later scripts reuse IDs created by earlier scripts.

## Temporary IDs

Created IDs are stored at:

```text
scripts/api-smoke/.tmp/ids.json
```

This file is ignored by Git. Delete the `.tmp` folder if you want a fresh manual run, or use `run-all.ps1` to reset it automatically.

## Common Errors

`localhost refused to connect`: Start the API first and confirm it is listening on port `4000`.

`database disconnected`: Check `DATABASE_URL` in `apps/api/.env` and confirm PostgreSQL is running.

`duplicate key value violates unique constraint`: Run `run-all.ps1`, which generates unique sample values, or delete the temporary IDs and try again.

`script execution is disabled`: Run PowerShell with `-ExecutionPolicy Bypass` as shown above.
