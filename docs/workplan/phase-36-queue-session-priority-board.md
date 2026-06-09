# Phase 36 - Queue Session Opening + Priority Board

## Completed

- Added queue session controls using the existing `queues.is_active` column.
- Added protected dashboard API routes:
  - `POST /api/businesses/:businessId/queues/open`
  - `PATCH /api/businesses/:businessId/queues/:queueId/close`
  - `GET /api/businesses/:businessId/queues/open-active`
  - `GET /api/businesses/:businessId/queues/pending-requests`
  - `PATCH /api/businesses/:businessId/queue-entries/:entryId/approve`
- Queue joins now require an open queue for the selected branch/service/date.
- Operator joins are inserted directly as `CONFIRMED` entries.
- QR, web, mobile app, and WhatsApp joins remain `DRAFT`, which is used as the current database-backed pending approval state.
- Staff approval transitions pending requests from `DRAFT` to `CONFIRMED`.
- Call Next now ignores closed queues and prioritizes source order before sequence:
  - `OPERATOR`
  - `HARDWARE`
  - online sources such as `QR`, `WEB`, `MOBILE_APP`, `WHATSAPP`
- Queue entry ordering now groups active service states ahead of pending requests and terminal states.
- Public QR confirmation no longer performs staff approval. It returns the pending request and keeps approval for staff.
- WhatsApp queue join requests now require an open queue and create pending requests instead of auto-confirmed entries.
- Dashboard queue UI now includes:
  - open queue button
  - close selected queue button
  - open/closed badges
  - pending online request panel
  - approve/reject actions for pending requests
  - source-color visual queue rows
  - priority legend

## Open/Close Behavior

Queues are created or reopened by the dashboard operator before customers can join. If no matching open queue exists for the requested branch/service/date, public QR and WhatsApp queue joins fail with a clear message telling the customer to contact staff or try again later.

Closing a queue prevents new joins and prevents calling the next customer from that queue. Existing entries remain visible for operational review.

## Pending Approval Behavior

No database migration was added in this phase. The existing `queue_status_enum` does not include `PENDING_APPROVAL`, so `DRAFT` is intentionally used as pending approval for online customer sources.

The UI displays `DRAFT` as `PENDING_APPROVAL` to staff and customers.

## Source Priority

The service order uses source priority first, then queue sequence. This allows walk-ins/operator-entered customers to be called before online requests when both are active in the same queue.

## Current Limitations

- `SMS` and `WALK_IN` are not database enum values yet. Existing `OPERATOR` represents walk-in/operator entries for now.
- Queue numbers are still reserved at request creation because `queue_entries.queue_number` is required by the current schema. Staff approval activates the request but does not delay number assignment.
- No websocket/live push has been added; the dashboard continues using React Query polling.
- Hardware display routing is prepared conceptually through source priority but no hardware UI/API was added in this phase.

## Future Work

- Add a schema migration for explicit `PENDING_APPROVAL`, `WALK_IN`, and `SMS` values if required.
- Move queue number assignment to approval time if the schema is updated to allow nullable queue numbers.
- Add websocket updates for the dashboard and public status pages.
- Add hardware display endpoints and a separate display board UI.
