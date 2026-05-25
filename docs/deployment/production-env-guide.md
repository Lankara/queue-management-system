# Production Environment Guide

This project uses separate environment files for Docker Compose and each app. Do not commit real production values.

## Root `.env.production`

Used by Docker Compose for interpolation and shared service settings.

Required:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_PUBLIC_APP_URL`

Recommended:

- `WEB_PORT=3000`
- `API_PORT=4000`
- `API_JSON_BODY_LIMIT=1mb`
- `PUBLIC_RATE_LIMIT_WINDOW_MS=60000`
- `PUBLIC_RATE_LIMIT_MAX_REQUESTS=60`
- `WHATSAPP_WEBHOOK_RATE_LIMIT_MAX_REQUESTS=120`

## API Env

File: `apps/api/.env.production`

Core values:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://qms_app:password@postgres:5432/queue_management_db
DATABASE_SSL=false
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=1d
CORS_ORIGIN=https://example.com
API_JSON_BODY_LIMIT=1mb
```

Public endpoint protection:

```env
PUBLIC_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_RATE_LIMIT_MAX_REQUESTS=60
WHATSAPP_WEBHOOK_RATE_LIMIT_MAX_REQUESTS=120
```

WhatsApp foundation:

```env
WHATSAPP_PROVIDER=whatsapp-cloud-api
WHATSAPP_ENABLED=false
WHATSAPP_DEV_MODE=true
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_API_VERSION=v20.0
WHATSAPP_GRAPH_BASE_URL=https://graph.facebook.com
WHATSAPP_DEFAULT_COUNTRY_CODE=94
WHATSAPP_WEBHOOK_VERIFY_TOKEN=replace-with-random-token
WHATSAPP_WEBHOOK_APP_SECRET=
WHATSAPP_INBOUND_ENABLED=false
WHATSAPP_INBOUND_DEV_MODE=true
WHATSAPP_DEFAULT_BUSINESS_SLUG=
```

When real WhatsApp sending is enabled:

- set `WHATSAPP_ENABLED=true`
- set `WHATSAPP_DEV_MODE=false`
- provide `WHATSAPP_PHONE_NUMBER_ID`
- provide `WHATSAPP_ACCESS_TOKEN`
- store tokens only on the server

## Web Env

File: `apps/web/.env.production`

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api
NEXT_PUBLIC_PUBLIC_APP_URL=https://example.com
```

These values are visible to browsers. Never put secrets in `NEXT_PUBLIC_*` variables.

## Worker Env

File: `apps/worker/.env.production`

```env
NODE_ENV=production
WORKER_API_BASE_URL=http://api:4000/api
WORKER_API_ACCESS_TOKEN=
NOTIFICATION_WORKER_ENABLED=false
NOTIFICATION_WORKER_POLL_INTERVAL_MS=15000
NOTIFICATION_WORKER_BATCH_SIZE=25
NOTIFICATION_WORKER_RETRY_DELAY_MS=5000
NOTIFICATION_WORKER_HEARTBEAT_EVERY_POLLS=10
```

Enable the worker only after the manual dispatch path and worker auth token are configured safely.

## Secret Rules

- Generate `JWT_SECRET` with `openssl rand -base64 48`.
- Use a unique PostgreSQL password per deployment.
- Do not commit `.env.production` files.
- Do not log WhatsApp access tokens.
- Rotate tokens if they are pasted into chat, screenshots, or logs.