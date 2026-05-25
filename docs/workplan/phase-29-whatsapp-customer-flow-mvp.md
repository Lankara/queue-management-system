# Phase 29 - WhatsApp Customer Flow MVP

## Completed

Implemented the first deterministic WhatsApp customer interaction MVP. This is not an AI chatbot. It is a menu/state-machine flow using the existing WhatsApp inbound webhook foundation.

Supported MVP flows:

- Greeting/help
- Language selection
- Join queue
- Book appointment
- Check active queue or appointment status
- Cancel latest cancellable appointment
- English and Sinhala replies

## State-Machine Design

The session state is held in the existing in-memory `WhatsAppSessionService`.

Supported states:

- `IDLE`
- `MAIN_MENU`
- `WAITING_FOR_LANGUAGE`
- `WAITING_FOR_ACTION`
- `WAITING_FOR_QUEUE_SERVICE`
- `WAITING_FOR_APPOINTMENT_SERVICE`
- `WAITING_FOR_APPOINTMENT_TIME`
- `WAITING_FOR_CONFIRMATION`
- `WAITING_FOR_STATUS_LOOKUP`
- `WAITING_FOR_CANCEL_CONFIRMATION`

Production must replace this in-memory state with Redis, PostgreSQL, or another durable session store.

## Business Scope

The MVP uses one configured default business slug:

```env
WHATSAPP_DEFAULT_BUSINESS_SLUG=city-care-medical
```

Multi-business discovery is intentionally not implemented yet.

## Language Flow

Users can send:

- `EN`
- `SI`

The selected language is stored in the WhatsApp session and used for future replies.

## Queue Flow

Customer can send:

- `hi`
- `queue`
- `1`

Flow:

1. The system loads active services for the default business.
2. Customer selects a service number.
3. Customer identity is resolved from WhatsApp phone number.
4. If the customer does not exist, a lightweight customer is created.
5. If the customer has no client profile, a basic profile is created using the WhatsApp profile name when available.
6. A queue entry is created with source `WHATSAPP` and status `CONFIRMED`.
7. The reply includes queue number, position, service, and branch where available.

Queue numbers follow the existing queue length setting and `queues.last_issued_number` behavior.

## Appointment Flow

Customer can send:

- `appointment`
- `2`

Flow:

1. The system lists active services.
2. Customer selects a service number.
3. System asks for preferred datetime in this format:

```text
2026-06-01 14:30
```

4. The appointment is created as `PENDING_APPROVAL`.
5. No queue number is created until staff approval.

## Status Flow

Customer can send:

- `status`
- `3`

The system first checks for an active queue entry. If none exists, it checks for the latest active appointment.

No internal IDs are exposed to the customer.

## Cancel Flow

Customer can send:

- `cancel`

The system asks for confirmation. If the customer replies `YES`, the latest appointment in an allowed status is cancelled as `CANCELLED_BY_CUSTOMER`.

## Outbound Reply Behavior

If `WHATSAPP_INBOUND_DEV_MODE=true` or `WHATSAPP_ENABLED=false`:

- no real WhatsApp reply is sent
- the reply is returned as `replyPreview` in the webhook response
- safe metadata is logged

If real sending is enabled:

- replies are sent through the existing WhatsApp provider
- the provider still respects its own dev-mode settings

## Safety

- Simple in-memory cooldown prevents spam loops per phone.
- Delivery status payloads are ignored by the customer flow.
- Actions are scoped to the default business only.
- Replies do not expose internal IDs.
- Invalid selections return menu guidance.

## Limitations

- No AI/NLP.
- No advanced WhatsApp interactive buttons.
- No multi-business routing.
- No durable session storage.
- No persisted inbound message history.
- No payment.
- No rich appointment availability engine.

## Future AI Assistant Path

Future phases can layer AI assistance on top of this deterministic state machine by:

1. Keeping structured command/state transitions as the source of truth.
2. Using AI only to clarify ambiguous customer messages.
3. Requiring confirmation before business actions.
4. Persisting sessions and audit events before production use.
