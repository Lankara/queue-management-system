# Phase 27 - WhatsApp Dispatch Testing + Admin UI Controls

## Architecture Overview

This phase adds operational controls on top of the outbound notification foundation from Phase 26.

Existing queue, appointment, delay, and customer flows still create notification logs exactly as before. The new dispatch tools process existing `PENDING` logs and make delivery behavior visible to admins.

## Backend Enhancements

Protected endpoints:

- `POST /api/notifications/dispatch-pending`
- `GET /api/notifications/dispatch-summary`

The dispatch endpoint accepts an optional `limit` in the request body or query string. The default is `25`, and the API caps manual batches at `100`.

Dispatch result includes:

- requested count
- processed count
- sent count
- failed count
- skipped count
- simulated count
- duration in milliseconds
- provider summary

The summary endpoint returns:

- pending count
- sent today
- failed today
- simulated today
- WhatsApp enabled state
- WhatsApp dev mode state
- worker enabled state

## Manual Dispatch Flow

1. Notification events create `PENDING` rows in `notifications`.
2. An admin opens the Notifications dashboard.
3. The dispatch panel shows pending/sent/failed/simulated counters.
4. Clicking `Dispatch pending` calls the protected dispatch endpoint.
5. The dispatcher selects the provider based on notification channel.
6. WhatsApp notifications are simulated or sent depending on environment flags.
7. Logs are updated to `SENT` or `FAILED`.

Dispatch controls are intended for:

- `SUPER_ADMIN`
- `BUSINESS_OWNER`
- `MANAGER`

## Worker Polling Flow

The worker app can call the same protected dispatch endpoint on an interval.

Worker environment:

```env
WORKER_API_BASE_URL=http://localhost:4000/api
WORKER_API_ACCESS_TOKEN=<SUPER_ADMIN_OR_ALLOWED_TOKEN>
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_POLL_INTERVAL_MS=15000
NOTIFICATION_WORKER_BATCH_SIZE=25
NOTIFICATION_WORKER_RETRY_DELAY_MS=5000
NOTIFICATION_WORKER_HEARTBEAT_EVERY_POLLS=10
```

The worker logs:

- startup banner
- polling interval and batch size
- heartbeat every configured number of polls
- processed/sent/failed/skipped/simulated result per dispatch
- graceful error messages with retry delay

## Dev Mode Behavior

Recommended local settings:

```env
WHATSAPP_ENABLED=false
WHATSAPP_DEV_MODE=true
```

In dev mode:

- no real WhatsApp API call is made
- the provider logs a simulated send
- the notification row is marked `SENT`
- the dashboard shows simulated dispatch counts

The current database enum does not include `SENT_SIMULATED`, so simulated sends use `SENT` and are identified through dispatch result/summary context.

## Sample Test Flow

1. Start the API and web app.
2. Ensure WhatsApp dev mode is enabled.
3. Use the public QR flow or admin queue flow to create and confirm a queue entry.
4. This creates one or more `PENDING` notification logs.
5. Open `/dashboard/notifications`.
6. Click `Refresh summary`.
7. Click `Dispatch pending`.
8. Confirm the result panel shows processed/sent/simulated counts.
9. Confirm notification logs move from `PENDING` to `SENT`.

## Production Considerations

- Use a real Meta phone number id and access token only in secure environments.
- Keep `WHATSAPP_DEV_MODE=false` only when ready to send real messages.
- Use a durable queue and delivery attempt table before high-volume production use.
- Add provider message id persistence in a future schema phase.
- Avoid logging phone numbers and message bodies in production mode.

## Future Webhook Plan

Inbound WhatsApp webhooks are intentionally not implemented in this phase. A future phase should add:

- webhook verification
- delivery status callbacks
- inbound message capture
- conversation routing
- optional chatbot or guided response flows

## Current Limitations

- No chatbot.
- No inbound webhook handling.
- No durable retry table.
- No persisted provider message id.
- SMS, email, and push providers are not implemented yet.
