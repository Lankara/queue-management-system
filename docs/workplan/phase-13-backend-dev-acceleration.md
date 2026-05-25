# Phase 13: Backend Development Acceleration

## What Was Added

This phase adds backend development helpers for faster manual verification:

- PowerShell smoke scripts under `scripts/api-smoke/`
- A single `pnpm smoke:api` command for running the full smoke flow
- Temporary ID persistence in `scripts/api-smoke/.tmp/ids.json`
- API smoke testing documentation
- Small common utility helpers for dates, phone numbers, queue number formatting, and API base path constants

## Smoke Script Flow

The smoke runner checks:

1. API health
2. Database health
3. Business, branch, service, and profile settings setup
4. Customer, client profile, and medical profile setup
5. Queue draft, confirm, position, call-next, start, and complete flow
6. Appointment request, approval, reschedule proposal, and reschedule acceptance flow
7. Delay event creation and notification log listing

## Utility Consistency

Queue number formatting is centralized in `formatQueueNumber()` so queue and appointment flows use the same padding rule.

Date and phone utilities were added for future module work, but phone normalization is not enforced globally yet.

## Intentionally Not Implemented Yet

- No endpoint contracts were changed.
- No database schema changes were made.
- No authentication or JWT login was added.
- No Prisma or ORM was added.
- No WhatsApp, SMS, email, or push provider integration was added.
- No frontend UI was created.
