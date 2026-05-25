# Phase 23 - Public Appointment Flow

## Completed

- Added public appointment request, status, and cancellation endpoints under `/api/public/businesses/:businessSlug`.
- Added public appointment routes under `/q/[businessSlug]/appointment` and `/q/[businessSlug]/appointment/[appointmentId]`.
- Updated the public landing page to offer both `Join Queue` and `Book Appointment`.
- Reused the public phone lookup, customer registration, and client profile selection flow.
- Added branch/service query parameter prefill for appointment links.
- Added appointment status polling every 30 seconds.

## Public API Endpoints

- `POST /api/public/businesses/:businessSlug/appointments/request`
- `GET /api/public/businesses/:businessSlug/appointments/:appointmentId/status`
- `PATCH /api/public/businesses/:businessSlug/appointments/:appointmentId/cancel`

## Request Flow

1. Customer chooses language.
2. Customer identifies by phone or registers a phone number.
3. Customer selects or creates a client profile.
4. Customer selects branch and service.
5. Customer selects a preferred date/time.
6. The system submits an appointment request with status `PENDING_APPROVAL`.

Appointments are not approved automatically. Staff, operators, or doctors approve them later from the dashboard.

## Cancellation Behavior

Customers can cancel public appointments while the appointment is in one of these states:

- `PENDING_APPROVAL`
- `APPROVED`
- `RESCHEDULE_PROPOSED`
- `RESCHEDULE_ACCEPTED`

Cancellation sets the status to `CANCELLED_BY_CUSTOMER`. If a queue entry was already linked and is not completed/no-show, the backend appointment service cancels the linked queue entry too.

## Current Limitations

- No public slot availability calculation yet.
- No payment flow.
- No OTP/phone verification.
- No WhatsApp sending. Notification logs are created through the existing notification foundation where available.
- No full public appointment calendar UI yet.

## Future Notes

A later phase can add WhatsApp confirmations, appointment reminder sending, public reschedule accept/reject flows, slot availability checks, and branch/service-specific appointment QR campaigns.
