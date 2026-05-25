# Phase 30 - WhatsApp Flow Testing Dashboard + Simulator

## Completed

Added a protected developer/admin simulator for deterministic WhatsApp customer flows.

The simulator lets admins and developers test WhatsApp behavior without Meta, ngrok, webhook setup, or real outbound sends.

## Backend Simulator API

Protected endpoints under `/api/whatsapp/simulator`:

- `POST /simulate-message`
- `GET /session/:phone`
- `DELETE /session/:phone`
- `GET /supported-commands`

Allowed roles:

- `SUPER_ADMIN`
- `BUSINESS_OWNER`
- `MANAGER`

## Simulator Architecture

The simulator builds a fake inbound WhatsApp message object and passes it into the same `WhatsAppCustomerFlowService` used by the real webhook.

Important difference:

- webhook can send replies depending on env flags
- simulator always calls the flow with sending suppressed

This keeps testing safe while still exercising the same customer flow state machine.

## Response Data

The simulator returns:

- normalized command
- confidence
- session before
- session after
- generated reply
- detected language
- flow state
- action summary for queue/appointment creation when available

## Dashboard UI

Added route:

- `/dashboard/whatsapp`

Dashboard sections:

- phone/profile controls
- inbound message input
- quick action buttons
- chat-style conversation preview
- session inspector JSON panel
- last result/debug panel
- supported commands panel
- reset session button

## Debugging Workflow

1. Open `/dashboard/whatsapp`.
2. Use the default test phone or enter another phone.
3. Send `Hi`.
4. Use quick actions or type messages manually.
5. Watch the session state and last result panels.
6. Reset the session when testing a fresh conversation.

## Webhook vs Simulator

The webhook endpoint is for Meta Cloud API events:

- `/api/whatsapp/webhook`

The simulator endpoint is for protected admin/developer testing:

- `/api/whatsapp/simulator/simulate-message`

The simulator is not public and should never be exposed as a customer endpoint.

## Dev-Only Safety

The simulator does not call Meta and does not send real WhatsApp messages. It only returns generated replies and updates the in-memory session state.

## Current Limitations

- Conversation history is frontend-only and resets on page reload.
- Sessions are still in-memory on the API server.
- No AI chatbot behavior.
- No advanced WhatsApp interactive buttons.
- Multi-business routing is not implemented.

## Future Work

- Persist simulator transcripts for QA.
- Add seeded scenario buttons.
- Add assertions for regression testing.
- Add Redis/database session persistence.
- Add test mode for future interactive button payloads.
