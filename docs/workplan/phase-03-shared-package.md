# Phase 03: Shared Package

## Purpose

The `@queue-management/shared` package centralizes reusable TypeScript enums, constants, status values, queue defaults, language defaults, and lightweight shared API types.

This package is framework-agnostic. It does not depend on NestJS, Next.js, Flutter, PostgreSQL, Prisma, or any database library.

## Why Enums Are Centralized

The PostgreSQL database defines core enum values in `002_core_enums.sql`. Matching TypeScript enums in one shared package helps keep API, web, mobile, and worker code aligned with the database contract.

Centralizing these values reduces the risk of spelling drift, duplicated status lists, and mismatched queue or appointment states across applications.

## Future Usage Across Apps

Future packages and apps can import shared values from `@queue-management/shared`, including:

- `apps/api` for request validation, DTOs, and service logic.
- `apps/web` and `apps/admin` for UI labels and status handling.
- `apps/mobile` for mobile queue and appointment screens.
- `apps/worker` for notification and background processing jobs.

## Future Expansion

The package is structured so future phases can add:

- Validation schemas.
- DTO-friendly shared types.
- Shared API contracts.
- Cross-app constants.
- Utility functions that are not framework-specific.

## Intentionally Not Implemented Yet

- No business logic.
- No database access.
- No ORM or Prisma code.
- No framework-specific modules.
- No API routes, queues, customers, appointments, or authentication logic.