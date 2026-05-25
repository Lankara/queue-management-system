# Phase 32 - Production Hardening

## What was audited

- API controller response wrappers were searched for unresolved Promise wrapping.
- Public self-service and WhatsApp webhook surfaces were reviewed.
- CORS, body-size limits, env validation, logging, and frontend analytics/report safety were reviewed.

## What was fixed

- Confirmed service/repository responses in controllers are awaited before `successResponse(...)` wrapping.
- Added in-memory rate limiting for `/api/public/*` and `/api/whatsapp/webhook`.
- Added configurable JSON and URL-encoded body size limits through `API_JSON_BODY_LIMIT`.
- Hardened env parsing: `DATABASE_URL` is required, production requires explicit CORS origins, and WhatsApp real mode requires Meta credentials.
- Removed the temporary public join-draft DTO debug log.
- Masked phone-number-like values in request logs.
- Added defensive array handling to dashboard activity and report tables.
- Updated API, web, and worker environment examples with security comments.

## Remaining risks

- Rate limiting is in-memory only and should be moved to Redis/API gateway for multi-instance production.
- WhatsApp inbound signature verification is not enforced yet.
- Public self-service identity is still lightweight and should be strengthened before sensitive production use.
- Security headers, CSRF strategy, and deployment-level TLS/HSTS are deployment concerns still to be finalized.

## Next hardening phases

- Add persistent rate limiting and account lockout rules.
- Add WhatsApp webhook signature verification.
- Add audit dashboards for sensitive admin actions.
- Add automated API security smoke tests in CI.
