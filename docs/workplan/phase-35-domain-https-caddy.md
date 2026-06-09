# Phase 35 - Domain HTTPS Caddy Setup

## Before

The Oracle VM deployment was reachable through direct public test ports:

```text
http://SERVER_IP:3000      -> web
http://SERVER_IP:4000/api  -> api
```

This worked for early testing but exposed application service ports directly.

## After

The production target is:

```text
Internet
  -> Caddy on 80/443
      -> yourdomain.com routes to web:3000
      -> api.yourdomain.com routes to api:4000
```

Only Caddy exposes public ports. API, web, worker, and PostgreSQL stay on the internal Docker network.

## Files Added Or Updated

- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.production.example`
- `apps/api/.env.production.example`
- `apps/web/.env.production.example`
- `docs/deployment/caddy-https-domain-setup.md`

## Security Improvements

- Ports `3000` and `4000` are hidden externally.
- Public traffic uses HTTPS through Caddy.
- Caddy handles automatic certificate issue and renewal.
- PostgreSQL remains internal-only.
- CORS is locked to the SaaS web domain.

## Why Hide 3000 And 4000

Direct service ports are useful for temporary testing but are not the intended production entrypoint. Hiding them reduces public attack surface and keeps all HTTP traffic behind one reverse proxy layer.

## SaaS Architecture

One central web domain serves all businesses. Tenant separation continues through authenticated business context and `business_id` scoped API behavior. Business-specific public QR links remain paths under the main domain unless future custom domain support is added.

## Future Scaling Path

- Move Docker image builds to CI/CD to avoid slow builds on small Oracle VMs.
- Add managed backups or object storage backup upload.
- Add monitoring and alerting.
- Add custom domain mapping per business if needed.
- Move to a larger VM or managed container platform when traffic grows.