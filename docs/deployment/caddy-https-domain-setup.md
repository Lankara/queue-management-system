# Caddy HTTPS Domain Setup

This guide moves the Oracle VM deployment from direct test ports to a production-style HTTPS setup.

## Target Architecture

```text
Internet
  |
  v
Caddy container, public ports 80/443
  |-- yourdomain.com     -> web:3000
  |-- api.yourdomain.com -> api:4000

Docker internal network
  |-- web exposes 3000 internally only
  |-- api exposes 4000 internally only
  |-- postgres is internal only
  |-- worker is internal only
```

## 1. Domain DNS

Buy or use a domain from any DNS provider. Create these records:

```text
yourdomain.com      A    ORACLE_VM_PUBLIC_IP
api.yourdomain.com  A    ORACLE_VM_PUBLIC_IP
```

Wait for DNS propagation. Check from your computer:

```bash
nslookup yourdomain.com
nslookup api.yourdomain.com
```

Both should resolve to the Oracle VM public IP.

## 2. Update Production Env Files On The VM

Edit root env:

```bash
cd ~/queue-management-system
nano .env.production
```

Set:

```env
APP_DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com
CADDY_EMAIL=admin@yourdomain.com
NEXT_PUBLIC_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
CORS_ORIGIN=https://yourdomain.com
```

Edit API env:

```bash
nano apps/api/.env.production
```

Set:

```env
CORS_ORIGIN=https://yourdomain.com
```

Edit web env:

```bash
nano apps/web/.env.production
```

Set:

```env
NEXT_PUBLIC_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

Important:

- Recreate API after `CORS_ORIGIN` changes.
- Rebuild web after `NEXT_PUBLIC_*` changes because Next.js bakes these into the browser bundle.

## 3. Oracle Security List

In Oracle Cloud Console:

1. Open `Compute -> Instances -> qms-server`.
2. Open the attached subnet/security list.
3. Keep or add inbound rules:

```text
22/tcp   Source: your IP if possible, or 0.0.0.0/0 temporarily
80/tcp   Source: 0.0.0.0/0
443/tcp  Source: 0.0.0.0/0
```

Remove public test rules:

```text
3000/tcp
4000/tcp
```

Do not open PostgreSQL `5432`.

## 4. Ubuntu UFW

On the VM:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw delete allow 3000/tcp || true
sudo ufw delete allow 4000/tcp || true
sudo ufw status
```

Expected public app ports:

```text
OpenSSH ALLOW
80/tcp  ALLOW
443/tcp ALLOW
```

## 5. Pull Latest Deployment Config

On the VM:

```bash
cd ~/queue-management-system
git pull
```

Confirm files exist:

```bash
ls Caddyfile docker-compose.prod.yml
```

## 6. Deploy With Caddy

From the VM project folder:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

On a micro VM, the web build can be slow. If needed, build web in the background and monitor logs.

Check services:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Watch Caddy logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy
```

Caddy should automatically request certificates. HTTP redirects to HTTPS automatically.

## 7. Verify

Browser checks:

```text
https://yourdomain.com
https://yourdomain.com/register
https://api.yourdomain.com/api/health
```

Command checks:

```bash
curl -I https://yourdomain.com
curl https://api.yourdomain.com/api/health
```

Expected:

- HTTPS lock icon appears.
- Landing page loads.
- Login page loads.
- Register business works.
- Dashboard loads after registration/login.
- API health returns OK.
- Public QR route works.
- Public appointment request works.

## 8. Troubleshooting

### DNS Not Ready

Symptoms:

- Caddy cannot issue certificate.
- Browser cannot find domain.

Check:

```bash
nslookup yourdomain.com
nslookup api.yourdomain.com
```

### Certificate Fails

Check that Oracle and UFW both allow `80` and `443`.

```bash
sudo ufw status
docker compose --env-file .env.production -f docker-compose.prod.yml logs caddy
```

### CORS Failure

Make sure API env has exact web origin:

```env
CORS_ORIGIN=https://yourdomain.com
```

Then recreate API:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate api
```

### Stale Web Build

If browser still calls the old API URL, rebuild web:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build web
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate web
```

### Ports 3000/4000 Still Public

The Caddy production compose uses `expose`, not `ports`, for API/web. Also remove Oracle and UFW rules for `3000` and `4000`.

## 9. Rollback To IP Testing

If domain setup fails and you need temporary direct IP testing again, do not use this Caddy compose as-is. You would need to temporarily publish `3000` and `4000` again and set env URLs back to IP + ports. This should only be temporary.