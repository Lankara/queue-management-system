# Phase 16: Business Setup UI

## Pages Implemented

- `/dashboard/businesses`
- `/dashboard/branches`
- `/dashboard/services`
- `/dashboard/settings`

## API Endpoints Used

- `GET /api/businesses`
- `GET /api/businesses/:id`
- `POST /api/businesses`
- `PATCH /api/businesses/:id`
- `GET /api/businesses/:businessId/branches`
- `POST /api/businesses/:businessId/branches`
- `PATCH /api/businesses/:businessId/branches/:id`
- `GET /api/businesses/:businessId/services`
- `POST /api/businesses/:businessId/services`
- `PATCH /api/businesses/:businessId/services/:id`
- `GET /api/businesses/:businessId/profile-settings`
- `PATCH /api/businesses/:businessId/profile-settings`

## Selected Business Behavior

The web app stores `selectedBusinessId` and `selectedBusinessName` in a persisted Zustand store. Branches, services, and settings read from that selected business. The business page can set the selected business after choosing or creating a record.

Business owners may not have permission to list all businesses, so the businesses page uses business IDs from the login token and fetches linked businesses individually when needed.

## Intentionally Not Implemented Yet

- Delete actions
- Queue management UI
- Appointment UI
- Customer UI
- Notification monitoring tables
- Role-specific page hiding
- Advanced table filtering and pagination
- Modal/drawer workflows
