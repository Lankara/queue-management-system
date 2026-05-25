# Production Security Checklist

Use this before exposing the Oracle VM publicly.

## Server Access

- Restrict SSH port 22 to your own IP in Oracle security rules where possible.
- Disable password SSH login and use SSH keys.
- Keep Ubuntu packages updated:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- Enable `ufw` and allow only 22, 80, and 443.

## HTTPS and Domains

- Use Caddy or another reverse proxy for HTTPS.
- Confirm HTTP redirects to HTTPS.
- Do not expose API/web Docker ports publicly except through Caddy.
- Do not expose PostgreSQL port publicly.

## Secrets

- Generate a strong `JWT_SECRET`.
- Use a strong PostgreSQL password.
- Do not commit `.env.production` files.
- Do not paste secrets into issue trackers or chat.
- Rotate any leaked secret immediately.

## CORS

- Set `CORS_ORIGIN=https://your-domain.com`.
- Do not use wildcard CORS in production.
- Add only trusted admin/customer web origins.

## Accounts

- Remove or disable development seed users.
- Change any seeded/admin password before public testing.
- Create real business owners through the SaaS registration flow.

## WhatsApp Safety

- Keep `WHATSAPP_ENABLED=false` and `WHATSAPP_DEV_MODE=true` until Meta credentials are ready.
- Store `WHATSAPP_ACCESS_TOKEN` only on the server.
- Do not log message bodies or tokens in production.
- Use a random `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## Backups

- Run a backup before every deployment update.
- Schedule daily `pg_dump` backups.
- Download backups off the VM regularly.
- Test restore on a non-production copy.

## Operational Checks

- Confirm `docker compose ps` shows healthy services.
- Monitor disk usage with `df -h`.
- Monitor Docker logs for restart loops.
- Keep a rollback copy of the previous `.env.production` and image tag strategy for future production releases.