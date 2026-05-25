# Phase 26 - WhatsApp Integration Foundation

## Architecture Added

This phase adds outbound notification delivery infrastructure only. It is not a chatbot and it does not process inbound WhatsApp messages.

The new architecture has four layers:

1. Existing modules create rows in `notifications` with status `PENDING`.
2. `NotificationDispatcherService` fetches pending logs in batches.
3. A provider abstraction maps notification channels to delivery providers.
4. `WhatsAppProvider` prepares and sends WhatsApp Cloud API text messages, or simulates them in development mode.

Existing notification creation behavior remains unchanged.

## Provider Abstraction

The provider contract lives in the notifications module and supports future channels:

- WhatsApp
- SMS
- Email
- Mobile push

Current implemented provider:

- `WHATSAPP` -> WhatsApp Cloud API provider

Unsupported channels are marked `FAILED` during dispatch with a clear failed reason. This prevents unsupported pending logs from blocking the queue indefinitely.

## WhatsApp Cloud API Foundation

The WhatsApp provider prepares Meta Cloud API text payloads for:

`POST /{phone-number-id}/messages`

Payload shape:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "94771234567",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Message text"
  }
}
```

Supported message type in this phase:

- Text messages only

No inbound webhook handling is implemented yet.

## Environment Variables

API and worker examples include:

```env
WHATSAPP_PROVIDER=whatsapp-cloud-api
WHATSAPP_ENABLED=false
WHATSAPP_DEV_MODE=true
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_API_VERSION=v20.0
WHATSAPP_GRAPH_BASE_URL=https://graph.facebook.com
WHATSAPP_DEFAULT_COUNTRY_CODE=94
```

## Development Mode

When `WHATSAPP_DEV_MODE=true`:

- No real WhatsApp API request is sent.
- The provider logs a simulated send.
- The notification log is marked `SENT` because the current database enum does not include `SENT_SIMULATED`.
- A simulated provider message id is generated in memory for logging/result purposes.

This is the recommended local development mode.

## Real Send Mode

To allow real outbound WhatsApp delivery:

```env
WHATSAPP_ENABLED=true
WHATSAPP_DEV_MODE=false
WHATSAPP_PHONE_NUMBER_ID=your-meta-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
```

Access tokens are never logged.

## Dispatch Pipeline

Manual protected endpoint:

```http
POST /api/notifications/dispatch-pending
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json

{
  "limit": 25
}
```

The dispatcher:

- Fetches oldest `PENDING` notification logs.
- Selects the provider by channel.
- Sends the rendered message body already stored on the log.
- Marks successful sends as `SENT` and sets `sent_at`.
- Marks failed sends as `FAILED` and saves `failed_reason`.
- Uses a simple in-memory retry count for the current process.

## Worker Foundation

A minimal worker package was added in `apps/worker`.

The worker polls the protected dispatch endpoint using:

```env
WORKER_API_BASE_URL=http://localhost:4000/api
WORKER_API_ACCESS_TOKEN=<SUPER_ADMIN_TOKEN>
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_POLL_INTERVAL_MS=15000
NOTIFICATION_WORKER_BATCH_SIZE=25
```

Run flow:

```powershell
pnpm --filter @queue-management/worker build
pnpm --filter @queue-management/worker start
```

The worker is intentionally simple and HTTP-based for now. A future queue system can replace this with Redis, BullMQ, SQS, or another durable queue.

## Local Manual Test

1. Keep WhatsApp in dev mode:

```env
WHATSAPP_DEV_MODE=true
WHATSAPP_ENABLED=false
```

2. Create notification logs through existing queue/appointment flows.

3. Log in as a super admin and copy the JWT token.

4. Dispatch pending notifications:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:4000/api/notifications/dispatch-pending" `
  -Headers @{ Authorization = "Bearer <SUPER_ADMIN_TOKEN>" } `
  -ContentType "application/json" `
  -Body '{"limit":25}'
```

5. Check notification logs in the dashboard. WhatsApp logs should move from `PENDING` to `SENT` in dev mode.

## Current Limitations

- No chatbot or inbound webhook automation.
- No message templates submitted to Meta yet.
- No media, buttons, or interactive WhatsApp messages.
- No durable retry table or queue backend.
- No provider message id column exists yet, so provider ids are not persisted.
- SMS, email, and push providers are placeholders through the provider selection design only.

## Future Work

- Add inbound WhatsApp webhook verification and message capture.
- Add a durable delivery attempts table.
- Add provider message id persistence.
- Add real queue infrastructure for high-volume dispatch.
- Add WhatsApp template message support for production-initiated conversations.
- Add chatbot or guided conversation flows as a separate phase.
