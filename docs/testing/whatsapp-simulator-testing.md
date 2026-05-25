# WhatsApp Simulator Testing

## Prerequisites

Start the API and web app, then log in to the dashboard with a role allowed to use the simulator:

- `SUPER_ADMIN`
- `BUSINESS_OWNER`
- `MANAGER`

Open:

```text
http://localhost:3000/dashboard/whatsapp
```

## Quick Smoke Test

1. Keep phone as `+94771234567`.
2. Send `Hi`.
3. Confirm the conversation preview shows a menu reply.
4. Confirm the session inspector shows a state like `WAITING_FOR_ACTION`.

## Sinhala Example

Send:

```text
SI
```

Expected:

- detected language is `si`
- reply is Sinhala menu text
- session language is `si`

Send:

```text
EN
```

Expected:

- detected language is `en`
- English menu appears again

## Queue Flow Example

Send messages sequentially using the same phone:

```text
Queue
1
```

Expected:

- `Queue` lists active services for the default WhatsApp business.
- `1` selects the first service.
- A customer/profile is created if missing.
- A confirmed queue entry is created.
- The reply includes queue number and position.
- Last result contains an action summary like `QUEUE_CREATED`.

## Appointment Flow Example

Send messages sequentially:

```text
Appointment
1
2026-06-01 14:30
```

Expected:

- service list appears
- datetime prompt appears
- appointment is created as `PENDING_APPROVAL`
- last result contains an action summary like `APPOINTMENT_CREATED`

## Status Flow Example

Send:

```text
Status
```

Expected:

- active queue status if one exists
- otherwise latest active appointment status
- otherwise a no-active-status message

## Cancel Flow Example

Send:

```text
Cancel
YES
```

Expected:

- first message asks for confirmation
- `YES` cancels the latest cancellable appointment

## Reset Session Flow

Click `Reset Session`.

Expected:

- frontend conversation history clears
- API in-memory session clears
- session inspector returns `null`

## Supported Commands Endpoint

The dashboard loads supported commands from:

```http
GET /api/whatsapp/simulator/supported-commands
```

This is useful when adding new deterministic flows later.

## Notes

- The simulator never sends real WhatsApp messages.
- It uses the same state-machine service as the webhook.
- Default business is controlled by `WHATSAPP_DEFAULT_BUSINESS_SLUG` on the API.
