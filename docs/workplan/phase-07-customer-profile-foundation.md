# Phase 07: Customer Profile Foundation

## Modules Added

- `CustomersModule`
- `ClientProfilesModule`
- `MedicalProfilesModule`

Each module uses raw PostgreSQL queries through the existing `DatabaseService`. DTOs use camelCase API fields and repositories map those fields to snake_case database columns.

## Endpoints Added

Customer endpoints:

```text
POST /api/businesses/:businessId/customers
GET /api/businesses/:businessId/customers
GET /api/businesses/:businessId/customers/by-phone/:phone
GET /api/businesses/:businessId/customers/:id
PATCH /api/businesses/:businessId/customers/:id
PATCH /api/businesses/:businessId/customers/:id/ban-reset
```

Client profile endpoints:

```text
POST /api/businesses/:businessId/customers/:customerId/client-profiles
GET /api/businesses/:businessId/customers/:customerId/client-profiles
GET /api/businesses/:businessId/client-profiles/:id
PATCH /api/businesses/:businessId/client-profiles/:id
```

Medical profile endpoints:

```text
POST /api/businesses/:businessId/client-profiles/:clientProfileId/medical-profile
GET /api/businesses/:businessId/client-profiles/:clientProfileId/medical-profile
PATCH /api/businesses/:businessId/client-profiles/:clientProfileId/medical-profile
```

## Shared Model For Ordinary And Medical Businesses

Customers are identified by phone number inside a business. One customer phone number can have many client profiles, which supports families, dependents, pets, or multiple people represented by the same contact number.

Ordinary businesses can use only customers and client profiles with minimal details. Medical businesses can optionally add one medical profile per client profile. Medical profiles are not forced for `BASIC` businesses yet.

## Behavior Added

- Customer phone number uniqueness is enforced per business.
- Customer ban reset clears online booking ban state, resets no-show count, clears ban reason, and records reset timestamp/user when provided.
- Medical profile creation verifies the client profile belongs to the business.
- Medical profile creation automatically uses the `customer_id` from the client profile.
- Clean not-found and duplicate-profile errors are returned through existing exception handling.

## Intentionally Not Implemented Yet

- No queue logic.
- No appointment logic.
- No WhatsApp logic.
- No notification sending.
- No JWT login or auth guards.
- No Prisma or ORM.
- No database migration changes.