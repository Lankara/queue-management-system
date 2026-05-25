# WhatsApp Customer Flow Testing

## Setup

In `apps/api/.env`:

```env
WHATSAPP_INBOUND_ENABLED=true
WHATSAPP_INBOUND_DEV_MODE=true
WHATSAPP_ENABLED=false
WHATSAPP_DEFAULT_BUSINESS_SLUG=city-care-medical
```

Start the API:

```powershell
pnpm --filter @queue-management/api dev
```

## Base Webhook URL

Local:

```text
http://localhost:4000/api/whatsapp/webhook
```

For Meta testing, expose it with ngrok or another HTTPS tunnel:

```text
https://your-tunnel-url/api/whatsapp/webhook
```

## Sample Inbound Payload Helper

PowerShell payload for text message:

```powershell
function Send-WhatsAppText($text) {
  $payload = @{
    object = "whatsapp_business_account"
    entry = @(
      @{
        id = "entry-1"
        changes = @(
          @{
            value = @{
              metadata = @{ phone_number_id = "phone-number-id" }
              contacts = @(@{ profile = @{ name = "Test Patient" }; wa_id = "94771234567" })
              messages = @(
                @{
                  from = "94771234567"
                  id = "wamid.$([guid]::NewGuid())"
                  timestamp = "1710000000"
                  type = "text"
                  text = @{ body = $text }
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
}
```

## Conversation: Greeting + Menu

```powershell
Send-WhatsAppText "hi"
```

Expected:

- command `HI`
- menu reply preview

## Conversation: Language Selection

```powershell
Send-WhatsAppText "SI"
```

Expected:

- Sinhala menu reply preview

```powershell
Send-WhatsAppText "EN"
```

Expected:

- English menu reply preview

## Conversation: Join Queue

```powershell
Send-WhatsAppText "queue"
Send-WhatsAppText "1"
```

Expected:

- first response lists active services
- second response confirms queue number and position

Notes:

- The default business must have at least one active service.
- Customer and basic client profile are auto-created if missing.

## Conversation: Book Appointment

```powershell
Send-WhatsAppText "appointment"
Send-WhatsAppText "1"
Send-WhatsAppText "2026-06-01 14:30"
```

Expected:

- first response lists services
- second asks for date/time
- third creates a `PENDING_APPROVAL` appointment

## Conversation: Check Status

```powershell
Send-WhatsAppText "status"
```

Expected:

- active queue status if one exists
- otherwise latest active appointment status
- otherwise no active status message

## Conversation: Cancel Appointment

```powershell
Send-WhatsAppText "cancel"
Send-WhatsAppText "YES"
```

Expected:

- confirmation prompt
- latest cancellable appointment is marked `CANCELLED_BY_CUSTOMER`

## Dev Mode Behavior

With dev mode on:

- no real WhatsApp message is sent
- each response includes `replyPreview`
- API logs safe metadata only

## Current Limitations

- Sessions reset on API restart.
- Only one default business slug is supported.
- No advanced interactive WhatsApp buttons.
- No AI chatbot behavior.
- No payment or complex scheduling rules.
