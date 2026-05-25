# Security Smoke Test

## Protected endpoint without token

Request a protected endpoint without an `Authorization` header:

```powershell
Invoke-WebRequest "http://localhost:4000/api/analytics/dashboard-summary?businessId=00000000-0000-0000-0000-000000000101" -UseBasicParsing
```

Expected: `401 Unauthorized`.

## Public QR endpoint without token

```powershell
Invoke-WebRequest "http://localhost:4000/api/public/businesses/city-care-medical" -UseBasicParsing
```

Expected: `200 OK` with minimal public business data.

## Rate limit behavior

Send more than `PUBLIC_RATE_LIMIT_MAX_REQUESTS` requests within `PUBLIC_RATE_LIMIT_WINDOW_MS` to a public route.

Expected: eventually returns `429` with a safe JSON error body.

## Invalid UUID

Call a public queue or appointment endpoint with an invalid UUID value.

Expected: `400 Bad Request` with validation details.

## Analytics page no crash

Log in to the dashboard, select a business, and open `/dashboard`.

Expected: KPI cards, charts, and activity feed render. Empty or unexpected activity payloads should not crash the page.
