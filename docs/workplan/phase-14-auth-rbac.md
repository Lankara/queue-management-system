# Phase 14: Auth and RBAC

## What Was Completed

- Added JWT authentication with `POST /api/auth/login` and `GET /api/auth/me`.
- Added Passport JWT strategy and global JWT guard.
- Added `@Public()`, `@CurrentUser()`, `@Roles(...)`, and `@BusinessParam(...)` decorators.
- Added role and business access guards.
- Added user auth lookup and business role lookup methods.
- Added local development auth seed SQL.
- Updated smoke scripts to log in and reuse a stored access token.

## Protected Route Strategy

The JWT guard is global. Public routes opt out with `@Public()`. Business-scoped controllers use `@BusinessParam('businessId')` so `SUPER_ADMIN` can access all businesses while other users must have a matching business link in their token.

Operator/admin style routes are protected with role metadata. Customer-facing queue draft, confirm, reject, and position endpoints remain public for QR and online queue flows.

## Public Routes

- `GET /api/health`
- `GET /api/health/db`
- `POST /api/auth/login`
- `POST /api/businesses/:businessId/queues/join-draft`
- `PATCH /api/businesses/:businessId/queue-entries/:entryId/confirm`
- `PATCH /api/businesses/:businessId/queue-entries/:entryId/reject`
- `GET /api/businesses/:businessId/queue-entries/:entryId/position`

## Development Auth Seed Usage

Run `database/seeds/dev_auth_users.sql` in pgAdmin 4 after migrations and after `database/seeds/dev_sample_data.sql`.

Development credentials:

- `admin@example.com` / `Admin@123456`
- `owner@example.com` / `Owner@123456`

The seed file stores bcrypt password hashes only. Plaintext passwords appear only in comments for local testing.

## Intentionally Not Implemented Yet

- Refresh tokens
- Refresh token persistence table
- Password reset email/SMS
- User registration endpoint
- Frontend login UI
- Prisma or any ORM
- Database schema changes
