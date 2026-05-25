# Phase 19: Appointment Management UI

## Appointment Management Flow

The `/dashboard/appointments` page now supports appointment filtering, listing, selection, details, operator-side appointment requests, action controls, and time change history.

## Approval Flow

Operators can approve selected appointments with optional approved start/end overrides. Approval calls `PATCH /api/businesses/:businessId/appointments/:id/approve`, refreshes the list, and displays the assigned queue number when returned by the backend.

## Reschedule Flow

Operators can propose a reschedule with new start/end time and a reason. The page also supports accepting or rejecting reschedule proposals for selected appointments.

## Polling Behavior

- Appointment list uses `['appointments', businessId, filters]` and refreshes every 20 seconds.
- Selected appointment details use `['appointment', businessId, appointmentId]` and refresh every 15 seconds.
- Time changes use `['appointment-time-changes', businessId, appointmentId]`.

## Queue Linkage Behavior

When an approved appointment has a linked queue entry, the details panel shows the queue entry ID and queue number returned by the backend. Queue status lookup is not implemented yet because the appointment API currently returns the queue number, not expanded queue entry status.

## Intentionally Not Implemented Yet

- Calendar drag/drop scheduling
- Slot availability calculation
- WhatsApp/SMS notification UI
- Inline customer creation
- Queue entry status expansion
- Advanced appointment table pagination
