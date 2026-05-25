# Phase 08: Queue Foundation

## Queue Flow

The queue foundation supports draft queue joining, customer confirmation or rejection, position lookup, and basic operator actions. Queue entries are FIFO by `queue_sequence`.

A customer flow starts by creating or finding a customer by phone through the existing customer module, selecting or creating a client profile, then calling the queue draft join endpoint.

## Draft, Confirm, And Reject

Draft join endpoint:

```text
POST /api/businesses/:businessId/queues/join-draft
```

This creates or reuses today's active queue for the business, branch, service, and date, then allocates a queue number immediately. The entry starts as `DRAFT`.

Confirm endpoint:

```text
PATCH /api/businesses/:businessId/queue-entries/:entryId/confirm
```

Only draft entries can be confirmed. Online sources are blocked if the customer is banned from online booking.

Reject endpoint:

```text
PATCH /api/businesses/:businessId/queue-entries/:entryId/reject
```

This cancels a draft or waiting entry.

## Queue Number Generation

Queue numbers are numeric text values such as `000`, `001`, and `002`.

The number length comes from `business_profile_settings.queue_number_length`. The numeric sequence is stored in `queue_entries.queue_sequence`, and the formatted value is stored in `queue_entries.queue_number`.

Queue numbers reset per business, branch, service, and date because each queue tracks its own `last_issued_number`.

## Position Lookup

Position endpoint:

```text
GET /api/businesses/:businessId/queue-entries/:entryId/position
```

Position counts active entries before the selected entry. Active statuses are `CONFIRMED`, `WAITING`, `CALLED`, and `IN_SERVICE`. Completed, cancelled, and no-show entries return position `0`.

No estimated time calculation is implemented yet. The endpoint returns `estimatedWaitingCount` only.

## Operator Actions

Operator endpoints:

```text
GET /api/businesses/:businessId/queues/today
GET /api/businesses/:businessId/queues/:queueId/entries
PATCH /api/businesses/:businessId/queues/:queueId/call-next
PATCH /api/businesses/:businessId/queue-entries/:entryId/start-service
PATCH /api/businesses/:businessId/queue-entries/:entryId/complete
PATCH /api/businesses/:businessId/queue-entries/:entryId/no-show
```

Calling next selects the oldest `CONFIRMED` or `WAITING` entry by `queue_sequence`, sets it to `CALLED`, and updates the queue's `current_number`.

## No-Show Ban Logic

Marking no-show sets the queue entry to `NO_SHOW`, increments the customer's `no_show_count`, and checks `business_profile_settings.no_show_ban_limit`.

If the count reaches the limit, the customer is banned from online booking with reason `Exceeded no-show limit`.

## Intentionally Not Implemented Yet

- No appointment logic.
- No WhatsApp integration.
- No notification sending.
- No JWT login or auth guards.
- No estimated time calculation.
- No hardware display integration.
- No Prisma or ORM.
- No database migration changes.