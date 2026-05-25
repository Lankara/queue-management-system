# Phase 22 - QR Code Management UI

## Completed

- Added QR code management route at `/dashboard/qr`.
- Added dashboard sidebar item: QR Codes.
- Added client-side QR generation using the lightweight `qrcode` package.
- Added dynamic public queue link building for the selected business.
- Added QR preview, copy link, download PNG, and print-friendly card behavior.
- Added `NEXT_PUBLIC_PUBLIC_APP_URL` to the web environment example.

## QR Link Strategy

QR codes are generated dynamically in the browser and are not stored in the database yet.

The base public app URL comes from:

```env
NEXT_PUBLIC_PUBLIC_APP_URL=http://localhost:3000
```

If the variable is missing in development, the QR page falls back to `window.location.origin`.

## Link Formats

Business-level QR:

```text
{PUBLIC_APP_URL}/q/{businessSlug}
```

Branch-specific QR:

```text
{PUBLIC_APP_URL}/q/{businessSlug}?branchId={branchId}
```

Service-specific QR:

```text
{PUBLIC_APP_URL}/q/{businessSlug}?serviceId={serviceId}
```

Branch + service QR:

```text
{PUBLIC_APP_URL}/q/{businessSlug}?branchId={branchId}&serviceId={serviceId}
```

## Download And Print Behavior

- Download creates a PNG from the currently selected QR link.
- Filenames use the format:
  - `queue-qr-{businessSlug}.png`
  - `queue-qr-{businessSlug}-{serviceCode}.png`
  - `queue-qr-{businessSlug}-{branchCode}-{serviceCode}.png`
- Print uses a clean card with:
  - business name
  - branch/service label when selected
  - QR code
  - English instruction: `Scan to join the queue`
  - Sinhala instruction: `පෝලිමට එකතු වීමට ස්කෑන් කරන්න`

## Current Limitations

- Public QR query parameters are now consumed by the public self-service flow and preselect matching branch/service options.
- QR codes are not persisted or registered in the backend.
- There is no QR usage analytics yet.
- No WhatsApp or mobile app integration is included in this phase.

## Future Backend QR Registry Option

A later phase can add a backend QR registry table to track QR campaigns, location labels, branch/service defaults, generated asset versions, scan analytics, and deactivation state.


## Manual QR Link Tests

- Open a business-level QR link and confirm normal selection behavior.
- Open a branch-only QR link and confirm the branch is preselected on the join page.
- Open a service-only QR link and confirm the service is preselected on the join page.
- Open a branch + service QR link and confirm both selections are preselected on the join page.
- Try an invalid ranchId or serviceId and confirm the flow ignores it with a warning.

