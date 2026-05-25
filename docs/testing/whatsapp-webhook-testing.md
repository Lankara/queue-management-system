# WhatsApp Webhook Testing

## Local Setup

Set these values in `apps/api/.env`:

```env
WHATSAPP_WEBHOOK_VERIFY_TOKEN=local-test-token
WHATSAPP_INBOUND_ENABLED=true
WHATSAPP_INBOUND_DEV_MODE=true
```

Start the API:

```powershell
pnpm --filter @queue-management/api dev
```

## Test Meta Verification GET

PowerShell:

```powershell
Invoke-WebRequest "http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=local-test-token&hub.challenge=12345" -UseBasicParsing
```

Expected response body:

```text
12345
```

Invalid token example:

```powershell
Invoke-WebRequest "http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345" -UseBasicParsing
```

Expected result:

- HTTP 403

## Test Inbound Text POST

PowerShell:

```powershell
$payload = @{
  object = "whatsapp_business_account"
  entry = @(
    @{
      id = "entry-1"
      changes = @(
        @{
          value = @{
            metadata = @{ phone_number_id = "phone-number-id" }
            contacts = @(@{ profile = @{ name = "Test Customer" }; wa_id = "94771234567" })
            messages = @(
              @{
                from = "94771234567"
                id = "wamid.test"
                timestamp = "1710000000"
                type = "text"
                text = @{ body = "help" }
              }
            )
          }
        }
      )
    }
  )
} | ConvertTo-Json -Depth 12

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:4000/api/whatsapp/webhook" `
  -ContentType "application/json" `
  -Body $payload
```

Expected response shape:

```json
{
  "enabled": true,
  "devMode": true,
  "received": true,
  "eventCount": 1,
  "events": [
    {
      "type": "MESSAGE",
      "command": "HELP",
      "confidence": 0.9,
      "replyPreview": "Available options: JOIN QUEUE, BOOK APPOINTMENT, CHECK STATUS, CANCEL. WhatsApp actions are coming soon."
    }
  ]
}
```

## Disabled Mode Test

Set:

```env
WHATSAPP_INBOUND_ENABLED=false
```

POST requests should still return `received=true`, but no command processing is performed.

## Local Tunnel Note

Meta must reach your local API through a public HTTPS URL. For local testing, use a tunnel such as ngrok or Cloudflare Tunnel and configure the Meta webhook URL as:

```text
https://your-tunnel-url/api/whatsapp/webhook
```

Use the same verify token as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## Current Limitations

- No inbound message persistence.
- No signature validation yet.
- No automatic WhatsApp replies.
- No chatbot or booking flow execution.
