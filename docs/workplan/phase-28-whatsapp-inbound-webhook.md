# Phase 28 - WhatsApp Inbound Webhook Foundation

## Completed

This phase adds the foundation for inbound WhatsApp events. It does not implement chatbot actions, queue booking through WhatsApp, appointment booking through WhatsApp, or inbound automation.

Added public webhook endpoints:

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`

## Webhook Verification Flow

Meta calls the GET endpoint with:

- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

If `hub.mode=subscribe` and `hub.verify_token` matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, the API returns the challenge as plain text. Otherwise it returns `403`.

The endpoint is public and does not require JWT because Meta must be able to call it.

## Inbound Receive Flow

Meta sends inbound events to:

`POST /api/whatsapp/webhook`

The API:

1. Accepts the payload quickly.
2. Checks `WHATSAPP_INBOUND_ENABLED`.
3. Parses the payload into normalized events.
4. Logs only safe metadata.
5. Parses basic commands for inbound text messages.
6. Updates a temporary in-memory session.
7. In dev mode, returns/logs a reply preview only.

No automatic outbound reply is sent in this phase.

## Environment Variables

```env
WHATSAPP_WEBHOOK_VERIFY_TOKEN=change-this-webhook-token
WHATSAPP_WEBHOOK_APP_SECRET=
WHATSAPP_INBOUND_ENABLED=false
WHATSAPP_INBOUND_DEV_MODE=true
```

Development defaults:

- inbound disabled
- inbound dev mode enabled

## Normalized Event Structure

Inbound message events include safe extracted fields:

- object
- entry id
- phone number id
- from phone
- message id
- timestamp
- message type
- text body
- button/list reply placeholders
- contact profile name

Status events include:

- object
- entry id
- phone number id
- recipient id
- message id
- status
- timestamp

Unknown payloads are normalized as `UNKNOWN` events.

## Command Parser Foundation

Recognized command intents:

- `HI`
- `HELP`
- `JOIN_QUEUE`
- `BOOK_APPOINTMENT`
- `CHECK_STATUS`
- `CANCEL`
- `UNKNOWN`

Examples:

- `hi`, `hello`
- `help`
- `queue`, `join queue`
- `appointment`, `book appointment`
- `status`, `check status`
- `cancel`

Commands are recognized only. They do not execute business actions yet.

## Session Limitation

`WhatsAppSessionService` stores session state in memory by phone number.

State includes:

- phone
- current intent
- business slug placeholder
- last message time
- step
- data object

This is temporary and will reset whenever the API process restarts. Production should use PostgreSQL, Redis, or another durable store.

## Why No Chatbot Actions Yet

This phase intentionally avoids queue booking, appointment booking, cancellation, or status lookup through WhatsApp. The purpose is to safely establish webhook verification, payload parsing, and session/command foundations before adding business actions.

## Next Phase Plan

- Add webhook signature validation using `WHATSAPP_WEBHOOK_APP_SECRET`.
- Persist inbound messages and sessions.
- Connect commands to guided WhatsApp flows.
- Add outbound auto-replies through the existing WhatsApp provider in dev mode first.
- Add Meta delivery status reconciliation.
