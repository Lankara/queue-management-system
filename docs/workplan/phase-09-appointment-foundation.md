# Phase 09: Appointment Foundation

## Appointment Lifecycle

Customers can request appointments for a selected time range. New appointments start as `PENDING_APPROVAL` after the API verifies that the customer, client profile, and service belong to the business.

Operators, admins, or doctors can later approve or reject appointments. Authentication and role guards are not implemented yet, so these endpoints remain open for development.

## Approval Creates Queue Number

Approving an appointment creates or reuses the daily queue for the appointment business, branch, service, and approved appointment date.

The approval transaction:

- Locks or creates the daily queue.
- Reads `business_profile_settings.queue_number_length`.
- Increments `queues.last_issued_number`.
- Creates a confirmed `queue_entries` row.
- Updates the appointment to `APPROVED`.
- Links the appointment to the created queue entry through `queue_entry_id`.

Queue numbers follow the same format as the queue module, such as `000`, `001`, and `002`.

## Cancellation Behavior

Customers and operators can cancel appointments through separate endpoints. Cancellation is allowed for pending, approved, and reschedule-related active states.

If the appointment is linked to a queue entry and that queue entry is not already completed or no-show, the linked queue entry is cancelled too.

## Reschedule Behavior

Operators can propose a reschedule for pending or approved appointments. The proposal writes an `appointment_time_changes` row and updates the appointment to `RESCHEDULE_PROPOSED`.

Customers can accept or reject the proposed reschedule. Accepting a proposal sets the appointment to `RESCHEDULE_ACCEPTED`, but it does not auto-approve the appointment yet. Approval remains a separate action.

## Endpoints Added

```text
POST /api/businesses/:businessId/appointments/request
GET /api/businesses/:businessId/appointments
GET /api/businesses/:businessId/appointments/:id
PATCH /api/businesses/:businessId/appointments/:id/approve
PATCH /api/businesses/:businessId/appointments/:id/reject
PATCH /api/businesses/:businessId/appointments/:id/cancel-by-customer
PATCH /api/businesses/:businessId/appointments/:id/cancel-by-operator
PATCH /api/businesses/:businessId/appointments/:id/propose-reschedule
PATCH /api/businesses/:businessId/appointments/:id/accept-reschedule
PATCH /api/businesses/:businessId/appointments/:id/reject-reschedule
GET /api/businesses/:businessId/appointments/:id/time-changes
```

## Intentionally Not Implemented Yet

- No slot availability calculation.
- No WhatsApp or SMS integration.
- No notification sending.
- No JWT login or auth guards.
- No payment or deposit handling.
- No Prisma or ORM.
- No database migration changes.