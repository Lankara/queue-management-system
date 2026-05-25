# Environment Security Checklist

## Required production variables

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `API_JSON_BODY_LIMIT`

## Secrets handling

Store these in a secret manager or deployment secret system:

- `DATABASE_URL`
- `JWT_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_WEBHOOK_APP_SECRET`
- worker service tokens

Never expose secrets through `NEXT_PUBLIC_*` frontend variables.

## CORS rules

`CORS_ORIGIN` supports comma-separated origins, for example:

```text
CORS_ORIGIN=https://admin.example.com,https://app.example.com
```

Production must use explicit origins. Wildcard or empty CORS origin is rejected by API startup in production.

## WhatsApp real mode safety

When `WHATSAPP_ENABLED=true` and `WHATSAPP_DEV_MODE=false`, these are required:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

Use dev mode until message templates, sender numbers, and operational procedures are validated.

## Database URL safety

Use least-privilege DB credentials where possible. Do not log the database URL. Prefer SSL in hosted environments.
