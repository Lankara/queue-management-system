# Phase 33 - Docker Local Deployment

## Architecture

The local Docker stack contains four services on one bridge network:

- `postgres`: PostgreSQL database with persistent Docker volume.
- `api`: compiled NestJS API connected to PostgreSQL.
- `web`: production Next.js server for admin and public self-service pages.
- `worker`: notification dispatcher worker connected to the API.

## Service layout

Dockerfiles live beside each app:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/worker/Dockerfile`

The compose build context is the monorepo root so pnpm workspaces, lockfile, and shared packages resolve consistently.

## Environment strategy

The compose file provides safe local defaults and supports overrides through shell variables or an explicit `.env.docker` file copied from `.env.docker.example`.

Local defaults keep WhatsApp disabled and dev mode enabled. Production secrets must not be committed.

## Database and seeds

PostgreSQL creates `queue_management_db`, but migrations are still run manually. Seed order for local smoke testing:

1. `database/seeds/dev_sample_data.sql`
2. `database/seeds/dev_auth_users.sql`

## Future production roadmap

- Add automated migration runner or release task.
- Move secrets to a managed secret store.
- Use managed PostgreSQL for cloud production.
- Add reverse proxy/TLS and security headers.
- Add persistent rate limiting and worker queues.
- Split worker scaling from API scaling.

## Scaling notes

This setup is intentionally local and staging-like. It is not a Kubernetes or cloud production architecture. API and worker can be scaled later, but the in-memory public rate limiter should be replaced before multi-instance production use.
