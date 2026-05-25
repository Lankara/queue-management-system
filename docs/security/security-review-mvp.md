# Security Review MVP

## Public endpoints

Public customer and integration endpoints are intentionally unauthenticated:

- `/api/public/*` for QR and appointment self-service.
- `/api/whatsapp/webhook` for Meta webhook verification and inbound events.
- `/api/health` and `/api/health/db` for health checks.

Public endpoints must return only minimal safe data. Admin customer, queue, appointment, report, and notification endpoints remain protected by JWT/RBAC.

## Protected endpoints

Dashboard and operational APIs use JWT authentication. Business-scoped routes require the user to be linked to the target business unless the user has `SUPER_ADMIN`.

## JWT/RBAC strategy

JWT payloads include user id, roles, and accessible business ids. Production must provide a strong `JWT_SECRET`; the development fallback is rejected in production.

## Public rate limiting

An in-memory rate limiter now applies to:

- `/api/public/*`
- `/api/whatsapp/webhook`

Defaults:

- `PUBLIC_RATE_LIMIT_WINDOW_MS=60000`
- `PUBLIC_RATE_LIMIT_MAX_REQUESTS=60`
- `WHATSAPP_WEBHOOK_RATE_LIMIT_MAX_REQUESTS=120`

This protects the MVP from accidental abuse. Production should move rate-limit state to Redis or an API gateway if horizontally scaled.

## WhatsApp webhook security

Webhook verification uses `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. `WHATSAPP_WEBHOOK_APP_SECRET` is reserved for future request signature verification. The inbound endpoint returns quickly and does not execute long-running actions.

## Logging and errors

Unexpected server errors do not expose stack traces in production. Request logs mask phone-number-like values in URLs. Access tokens and secrets must not be logged.

## Current limitations

- Rate limiting is process-local and resets on restart.
- WhatsApp webhook signature validation is documented but not enforced yet.
- Public QR flows use customer/session context from the browser and existing ids; stronger customer verification is a future phase.
- No centralized audit/security event dashboard yet.

## Production checklist

- Set explicit `CORS_ORIGIN` values.
- Set `DATABASE_URL` from a secret store.
- Set a strong `JWT_SECRET`.
- Keep WhatsApp real sending disabled until Meta credentials are verified.
- Use TLS at the reverse proxy/load balancer.
- Add persistent rate limiting before horizontal scaling.
