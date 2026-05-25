# Phase 25 - Public Reschedule Flow

## Completed

- Added public appointment reschedule endpoints under `/api/public`:
  - `PATCH /api/public/businesses/:businessSlug/appointments/:appointmentId/accept-reschedule`
  - `PATCH /api/public/businesses/:businessSlug/appointments/:appointmentId/reject-reschedule`
- Added a public reject-reschedule DTO with an optional `reason` field.
- Public reschedule actions verify that the business slug resolves and that the appointment belongs to that business.
- Accept and reject actions are allowed only while the appointment status is `RESCHEDULE_PROPOSED`.
- Accepting a proposed reschedule sets the appointment status to `RESCHEDULE_ACCEPTED`.
- Rejecting a proposed reschedule sets the appointment status to `RESCHEDULE_REJECTED` and stores the optional reason in `reschedule_reason`.
- The public appointment status page now shows accept/reject controls only for `RESCHEDULE_PROPOSED` appointments.
- The public appointment status page refreshes immediately after accept/reject and continues polling every 20 seconds.

## Public UX Behavior

When staff proposes a new appointment time, the public status page shows the proposed time, the reschedule reason if available, and two actions:

- Accept new time
- Reject new time, with an optional reason

After accepting, the customer sees that the new time was accepted and that staff confirmation may still be required.

After rejecting, the customer sees that the proposed time was rejected and can wait for another update or contact the business.

## Queue Number Behavior

Accepting a reschedule does not approve the appointment and does not create a queue number. Queue numbers are still assigned only when staff approves the appointment from the protected dashboard flow.

## Notification Limitation

No new notification templates or enum values were added in this phase. Public reschedule accept/reject does not create notification logs yet because the current template enum does not include dedicated accepted/rejected reschedule templates.

## Future Work

- Add dedicated notification templates for customer reschedule acceptance and rejection.
- Notify staff in the dashboard when customers respond to proposed reschedules.
- Add WhatsApp responses for reschedule decisions.
- Replace polling with websocket or server-sent event status updates.
