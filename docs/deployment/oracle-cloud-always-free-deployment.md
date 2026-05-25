# Oracle Cloud Always Free Deployment Guide

This guide deploys the Queue Management System as one SaaS platform on an Oracle Cloud Always Free VM using Docker Compose.

## 1. Create the Oracle Cloud VM

1. Sign in to Oracle Cloud Infrastructure.
2. Create a compartment for the project if you want to keep resources organized.
3. Go to Compute > Instances > Create instance.
4. Recommended image: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS.
5. Recommended Always Free shape:
   - ARM: Ampere A1 Flex is usually the best free option when available.
   - AMD: VM.Standard.E2.1.Micro can work for smaller tests, but it has less room for builds.
6. Use at least 2 OCPUs and 12 GB RAM on Ampere A1 Flex if your Always Free capacity allows it.
7. Add or generate an SSH key and save the private key safely.
8. Create or select a VCN/subnet.
9. Assign a public IPv4 address.

## 2. Networking and Firewall

In the Oracle VCN security list or network security group, allow inbound:

- TCP 22 from your IP only for SSH
- TCP 80 from 0.0.0.0/0 for HTTP/HTTPS certificate challenge
- TCP 443 from 0.0.0.0/0 for HTTPS

Do not expose PostgreSQL publicly. In the production compose file, Postgres is internal-only.

On Ubuntu, allow the same ports locally:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 3. Install Docker and Compose

SSH to the VM:

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

Run the helper script after cloning the repo, or paste its commands manually:

```bash
chmod +x scripts/deployment/oracle-install-docker.sh
./scripts/deployment/oracle-install-docker.sh
```

Log out and back in after adding your user to the `docker` group.

## 4. Clone the Project

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git queue-management-system
cd queue-management-system
```

If using a private repository, configure a deploy key or GitHub SSH access first.

## 5. Prepare Production Environment Files

Copy templates:

```bash
cp .env.production.example .env.production
cp apps/api/.env.production.example apps/api/.env.production
cp apps/web/.env.production.example apps/web/.env.production
cp apps/worker/.env.production.example apps/worker/.env.production
```

Edit all four files:

```bash
nano .env.production
nano apps/api/.env.production
nano apps/web/.env.production
nano apps/worker/.env.production
```

Required replacements:

- real domain and API domain
- strong PostgreSQL password
- strong JWT secret
- CORS origin locked to the web domain
- WhatsApp values only when ready

Generate a JWT secret:

```bash
openssl rand -base64 48
```

## 6. Build and Start Services

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
```

## 7. Apply Migrations and Seeds

The production database starts empty. Apply migrations from inside the API container or from the host if the DB is reachable through Docker.

Recommended pattern from the VM:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec api sh
```

Then run your migration command if available in the container. If using the repository scripts from the host, make sure `DATABASE_URL` points to the Docker Postgres service or temporarily publish Postgres locally.

Seed order for initial testing only:

1. `database/seeds/dev_sample_data.sql`
2. `database/seeds/dev_auth_users.sql`

For production, prefer creating the first real owner through `/register` instead of keeping dev seed users.

## 8. Create First Admin or Business Owner

Preferred SaaS path:

1. Open `https://YOUR_DOMAIN/`.
2. Click Register Business.
3. Create the owner account and first business.
4. Log in and verify `/dashboard` loads for that business.

If you seed dev auth users, immediately change/remove development credentials before exposing the server.

## 9. Caddy HTTPS Reverse Proxy

Caddy is recommended because it handles certificates automatically.

Install Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Point DNS A records to the Oracle VM public IP:

- `example.com` -> VM public IP
- `api.example.com` -> VM public IP

Create `/etc/caddy/Caddyfile`:

```caddyfile
example.com {
    reverse_proxy 127.0.0.1:3000
}

api.example.com {
    reverse_proxy 127.0.0.1:4000
}
```

Reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

## 10. Verify Deployment

```bash
curl https://api.example.com/api/health
curl -I https://example.com
```

Then test in the browser:

- landing page
- owner registration
- login
- dashboard
- public QR flow
- appointment request

## ARM/AMD Compatibility Notes

The current Dockerfiles use official Node and Postgres images that support common Linux platforms. Ampere ARM is the best Always Free capacity target, but native dependencies such as bcrypt/sharp should be validated during build. If an ARM build fails, try an AMD VM shape or build multi-arch images in CI later.

## Operational Notes

- Keep Postgres private.
- Keep Caddy as the only public HTTP/HTTPS entry point.
- Use backups before updates.
- Use `docker compose pull` only if images are external; this repo builds local images.
- Use `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build` after code updates.