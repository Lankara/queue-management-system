# Phase 04: API Common Foundation

## What Was Added

- Global API prefix configuration.
- CORS configuration with `CORS_ORIGIN` support.
- Global validation pipe using `class-validator` and `class-transformer`.
- Global exception filter for consistent JSON errors.
- Request logging middleware for method, path, status code, and response time.
- Common folder structure for decorators, DTOs, filters, interceptors, middleware, responses, types, and utilities.
- Shared API response helpers for success, error, and paginated responses.
- Common pagination query DTO.
- Request context type and request ID utility.

## API Prefix

All API routes now use the `/api` prefix.

Existing health endpoints are now:

```text
GET /api/health
GET /api/health/db
```

The health response payloads were not changed.

## Validation Behavior

The global validation pipe is configured with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

This means future DTOs can safely strip unknown fields, reject unexpected properties, and transform query/body values to DTO types.

## Error Response Format

The global exception filter returns errors in this shape:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Error message",
    "path": "/api/example",
    "timestamp": "2026-05-23T00:00:00.000Z"
  }
}
```

Unexpected errors avoid leaking stack traces in production.

## Intentionally Not Implemented Yet

- No business module.
- No customer module.
- No queue module.
- No appointment module.
- No authentication module.
- No Prisma, ORM, repository, entity, or model layer.
- No domain business logic.
- No frontend, admin, mobile, worker, WhatsApp, or hardware display logic.