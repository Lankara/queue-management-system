# Phase 12: Delay Queue Dragging

## Delay Event Flow

The delay module records service-provider delays and shifts affected appointments for a business. A delay is scoped to a business and service, with an optional branch filter.

Endpoint added:

```text
POST /api/businesses/:businessId/delays
GET /api/businesses/:businessId/delays
GET /api/businesses/:businessId/delays/:id
```

## Appointment Shifting Behavior

Creating a delay event runs a database transaction that:

- Creates a `queue_delay_events` row.
- Finds affected appointments for the business and service.
- Optionally filters by branch.
- Selects appointments with status `APPROVED`, `PENDING_APPROVAL`, or `RESCHEDULE_ACCEPTED`.
- Uses `approved_start_time` when available, otherwise `requested_start_time`, to decide whether the appointment is affected.
- Shifts requested times and approved times by `delayMinutes`.
- Inserts an `appointment_time_changes` row for every shifted appointment.

Existing queue entries and queue numbers are not changed.

## Notification Log Behavior

After the transaction completes, the service creates `PENDING` notification log records using the existing `NotificationsService` and the `DELAY_NOTICE` template.

Variables include:

- `customer_name`
- `business_name`
- `delay_minutes`
- `reason`
- `appointment_time`
- `new_appointment_time`
- `queue_number`

Notification log failures do not roll back the delay operation. They are logged as warnings and the main delay response still succeeds.

## Intentionally Not Implemented Yet

- No real WhatsApp sending.
- No SMS, email, or push delivery.
- No slot availability recalculation.
- No queue-number reordering.
- No hardware display updates.
- No auth/JWT guards.
- No Prisma or ORM.
- No database migration changes.