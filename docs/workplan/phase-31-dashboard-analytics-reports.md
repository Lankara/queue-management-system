# Phase 31 - Dashboard Analytics + Reports MVP

## Completed

Added an MVP operational analytics and reporting layer for business owners, managers, operators, doctors, and staff.

## Backend Analytics API

Created `AnalyticsModule` with protected endpoints:

- `GET /api/analytics/dashboard-summary?businessId=...`
- `GET /api/analytics/queue-summary?businessId=...`
- `GET /api/analytics/appointment-summary?businessId=...`
- `GET /api/analytics/notification-summary?businessId=...`
- `GET /api/analytics/today-activity?businessId=...`

All endpoints require JWT and explicitly check that the authenticated user is either `SUPER_ADMIN` or has access to the requested `businessId`.

## Backend Reports API

Created `ReportsModule` with protected endpoints:

- `GET /api/reports/daily-queue-report`
- `GET /api/reports/daily-appointment-report`
- `GET /api/reports/staff-activity-report`
- `GET /api/reports/notification-report`

Supported filters:

- `businessId` required
- `startDate` optional
- `endDate` optional
- `branchId` optional
- `serviceId` optional where relevant

The staff activity report is partial and uses existing timestamps for approvals handled, queues completed, and delays created.

## Web Dashboard

Updated `/dashboard` with:

- KPI summary cards
- queue status chart
- appointment status chart
- notification status chart
- today activity feed
- 30-second polling for operational visibility

No chart dependency was added. The MVP uses lightweight CSS bar charts.

## Reports UI

Added `/dashboard/reports` with:

- date range filters
- branch/service ID filters
- refresh button
- queue report table
- appointment report table
- notification report table
- staff activity report table

Reports navigation was added to the dashboard sidebar.

## Business Scoping

Analytics and reports are business-scoped. Since these endpoints accept `businessId` as a query parameter, controllers perform explicit user/business checks instead of relying only on the existing route-param business access guard.

## Time Handling Limitation

The MVP uses PostgreSQL `CURRENT_DATE` and date casts. This follows the database/server date, not full business-timezone-local logic. A future phase should apply each business timezone consistently.

## Performance Considerations

The MVP uses direct aggregate SQL over operational tables. This is appropriate for early-stage use, but future high-volume deployments should consider:

- covering indexes for report filters
- materialized summary tables
- background aggregation jobs
- pagination for long reports
- caching common dashboard summaries

## Future Roadmap

- CSV/PDF exports
- advanced charts
- scheduled reports
- real-time dashboard updates with websocket or server-sent events
- durable analytics snapshots
- BI/data warehouse integration
- business-timezone aware reporting
