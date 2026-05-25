# Phase 24 - Appointment Approval Polish

## Completed

- Added shared appointment status labels/messages for consistent admin and public display.
- Added admin appointment lifecycle timeline.
- Added admin queue assignment card showing queue number, queue status, branch, service, and approved time.
- Improved approval form with requested-time/default behavior, adjusted-time preview, duration preview, and queue impact note.
- Improved time change history with old/new visual comparison and badges.
- Extended safe public appointment status payload with linked queue entry id, queue number, and queue status.
- Improved public appointment status page polling to every 20 seconds.
- Public status now fetches linked queue position when the appointment has a queue entry.
- Public status now shows customer-facing approval, rejection, cancellation, reschedule, and queue assignment messages.
- Public cancellation now uses a browser confirmation and disables invalid actions through status gating.

## Lifecycle Flow

Public appointment requests begin as `PENDING_APPROVAL`. Admin approval creates the queue entry and assigns a queue number. Public status polling then displays the approval state and live queue position when available.

## Public Sync Behavior

The public appointment status page refreshes appointment status every 20 seconds. If the approved appointment has a linked queue entry, the page also refreshes queue position every 20 seconds using the existing public queue position endpoint.

## Queue Assignment Behavior

Queue number and queue status appear prominently in admin and public views once approval creates a queue entry. Queue number remains unavailable while the appointment is pending approval.

## Current Limitations

- No websocket/live push infrastructure yet.
- Public reschedule accept/reject endpoints are not available yet; reschedule proposal is informational on the public page.
- No WhatsApp sending yet; notification logs remain the current foundation.
- Admin queue status is based on linked queue entry metadata returned with the appointment response.

## Future Notes

A later phase can add websocket sync, WhatsApp delivery, public reschedule accept/reject actions, and richer notification delivery visibility.
