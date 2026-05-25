# Phase 06: Business Setup Foundation

## Modules Added

- `BusinessesModule`
- `BranchesModule`
- `ServicesModule`
- `BusinessProfileSettingsModule`

Each module includes DTOs, interfaces, controller, service, repository, and module wiring. Repositories use raw PostgreSQL queries through the existing `DatabaseService` only.

## Endpoints Added

Business endpoints:

```text
POST /api/businesses
GET /api/businesses
GET /api/businesses/:id
PATCH /api/businesses/:id
```

Branch endpoints:

```text
POST /api/businesses/:businessId/branches
GET /api/businesses/:businessId/branches
GET /api/businesses/:businessId/branches/:id
PATCH /api/businesses/:businessId/branches/:id
```

Service endpoints:

```text
POST /api/businesses/:businessId/services
GET /api/businesses/:businessId/services
GET /api/businesses/:businessId/services/:id
PATCH /api/businesses/:businessId/services/:id
```

Business profile settings endpoints:

```text
GET /api/businesses/:businessId/profile-settings
PATCH /api/businesses/:businessId/profile-settings
```

## Behavior Added

Creating a business also creates a default `business_profile_settings` row in the same database transaction.

Default profile mode is:

- `MEDICAL` for medical centers, doctors, clinics, and hospitals.
- `BASIC` for barber shops, beauty parlours, salons, service shops, and other businesses.

## No Auth Guard Yet

These endpoints are open for local development only. Authentication, authorization, tenant scoping, and role guards are intentionally not implemented in this phase.

## Next Step

The next backend phase should add authentication endpoints and guards, then apply authenticated tenant-aware access rules to these modules.

## Intentionally Not Implemented Yet

- No queue logic.
- No customer logic.
- No appointment logic.
- No WhatsApp or notification sending logic.
- No JWT login or auth guards.
- No Prisma or ORM.
- No database migration changes.