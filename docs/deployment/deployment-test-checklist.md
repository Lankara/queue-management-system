# Deployment Test Checklist

Run these checks after deploying or updating the Oracle VM.

## Infrastructure

- `docker compose --env-file .env.production -f docker-compose.prod.yml ps` shows postgres, api, web, and worker.
- API container is healthy.
- Caddy is active: `sudo systemctl status caddy`.
- HTTPS certificate is issued for the web domain and API domain.

## Public Web

- Landing page loads at `https://example.com/`.
- Login page loads at `https://example.com/login`.
- Register page loads at `https://example.com/register`.
- Public QR route loads for a known business slug.

## API

- `curl https://api.example.com/api/health` returns OK.
- Protected endpoint without token returns 401.
- Public business endpoint works without token.
- Invalid UUIDs return validation errors.

## SaaS Onboarding

- Register a new owner and business.
- Login as the new owner.
- Dashboard loads and shows selected business context.
- Business setup pages can list/create branches and services.

## Public Customer Flows

- QR join flow works from public route.
- Public appointment request creates pending appointment.
- Public appointment status page polls and displays status.

## Notifications and Worker

- Notification logs are created by queue/appointment actions.
- Manual dispatch works in dev/simulated mode.
- Worker logs show disabled state or heartbeat depending on env.

## Backup

- Run `./scripts/deployment/backup-postgres.sh`.
- Confirm backup file exists and has non-zero size.
- Download a backup locally with `scp`.