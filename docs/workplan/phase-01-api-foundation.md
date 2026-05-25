# Phase 01: API Foundation

## What Was Created

- A NestJS TypeScript API foundation in `apps/api`.
- A pnpm-compatible `apps/api/package.json` with development, build, start, lint, typecheck, and test scripts.
- Basic NestJS application files:
  - `src/main.ts`
  - `src/app.module.ts`
  - `src/app.controller.ts`
  - `src/app.service.ts`
- A health endpoint at `GET /health` returning:

```json
{
  "status": "ok",
  "service": "queue-management-api"
}
```

- Environment placeholders for `PORT`, `NODE_ENV`, and `DATABASE_URL`.
- TypeScript and Nest CLI configuration files.

## How To Run The API

From the monorepo root:

```bash
pnpm --filter @queue-management/api dev
```

The API defaults to port `4000`. After it starts, open:

```text
http://localhost:4000/health
```

## Intentionally Not Implemented Yet

- No database ORM or Prisma schema.
- No authentication APIs.
- No business, branch, service, queue, customer, appointment, notification, or WhatsApp business logic.
- No production configuration or deployment setup.
- No frontend, admin, mobile, worker, or hardware display integration.
