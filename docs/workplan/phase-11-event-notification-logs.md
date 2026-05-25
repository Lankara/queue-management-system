# Phase 11: Event Notification Logs

## What This Phase Adds

Queue, appointment, and customer ban events now create `PENDING` notification log records through the existing `NotificationsService`.

No external messages are sent in this phase. The API only renders templates and inserts rows into the `notifications` table for later worker or integration processing.

## Events That Create Logs

Queue events:

- Queue entry confirmed: `QUEUE_CONFIRMED`
- Queue position checked with `logNotification=true`: `QUEUE_POSITION_UPDATED`
- Queue entry marked no-show: `NO_SHOW_WARNING`
- No-show limit causes online booking ban: `ONLINE_BOOKING_BANNED`

Customer event:

- Online booking ban reset: `BAN_RESET`

Appointment events:

- Appointment requested: `APPOINTMENT_PENDING_APPROVAL`
- Appointment approved: `APPOINTMENT_APPROVED`
- Appointment rejected: `APPOINTMENT_REJECTED`
- Appointment cancelled by customer: `APPOINTMENT_CANCELLED_BY_CUSTOMER`
- Reschedule proposed: `RESCHEDULE_PROPOSED`

## Why Logs Are Pending

All created records use status `PENDING` because no WhatsApp, SMS, email, web, or push delivery integration exists yet. A future worker can read pending logs, send them through the correct provider, and mark them as `SENT`, `FAILED`, or `CANCELLED`.

## Position Update Logging

The queue position endpoint can be called frequently, so it does not create notification logs by default.

To create a queue position notification log, call:

```text
GET /api/businesses/:businessId/queue-entries/:entryId/position?logNotification=true
```

Without `logNotification=true`, the endpoint only returns the position response.

## Failure Handling

Notification log creation is intentionally non-blocking. If template lookup, rendering, or log insertion fails, the main queue, appointment, or customer operation still succeeds and the service logs a warning.

## Intentionally Not Implemented Yet

- No real WhatsApp sending.
- No SMS gateway integration.
- No email delivery.
- No push notification delivery.
- No notification worker.
- No retry policy.
- No auth/JWT guards.
- No Prisma or ORM.
- No database migration changes.