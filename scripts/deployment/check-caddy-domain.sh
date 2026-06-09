#!/usr/bin/env bash
set -euo pipefail

# Quick production-domain smoke check. Run on the Oracle VM after Caddy deployment.
# Usage: APP_DOMAIN=yourdomain.com API_DOMAIN=api.yourdomain.com ./scripts/deployment/check-caddy-domain.sh

APP_DOMAIN="${APP_DOMAIN:-}"
API_DOMAIN="${API_DOMAIN:-}"

if [ -z "$APP_DOMAIN" ] || [ -z "$API_DOMAIN" ]; then
  echo "Set APP_DOMAIN and API_DOMAIN before running."
  echo "Example: APP_DOMAIN=example.com API_DOMAIN=api.example.com $0"
  exit 1
fi

echo "Checking web HTTPS..."
curl -I "https://$APP_DOMAIN"

echo "Checking API health..."
curl "https://$API_DOMAIN/api/health"

echo "Checking local Docker service status..."
docker compose --env-file .env.production -f docker-compose.prod.yml ps