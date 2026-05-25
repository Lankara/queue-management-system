# Phase 10: Notification Foundation

## Template Hierarchy

Notification templates are resolved in this order:

1. Active business-specific template where `business_id` matches the business.
2. Active global template where `business_id IS NULL`.

If no active template exists, the API returns a clean not-found error.

## Global vs Business-Specific Templates

Global templates were seeded during the database foundation phase and are shared defaults. Businesses can create their own templates or copy a global template into a business-specific row.

Global templates cannot be updated through the business template update endpoint. Only templates owned by the business can be changed.

## Rendering Behavior

The rendering endpoint replaces variables written as `{{variableName}}` or `{{ variableName }}` with the matching value from the request variables object.

Unknown variables are left unchanged, so missing values remain visible as placeholders such as `{{missing_value}}`.

## Notification Log Behavior

Notification log endpoints create and update records in the `notifications` table only. They do not send WhatsApp, SMS, email, push, or web notifications.

Future modules can call reusable service helpers:

- `renderTemplate(...)`
- `createLog(...)`
- `createRenderedLog(...)`

`createRenderedLog` renders the selected template and inserts a `PENDING` notification log record.

## Endpoints Added

```text
GET /api/businesses/:businessId/notification-templates
GET /api/businesses/:businessId/notification-templates/:id
POST /api/businesses/:businessId/notification-templates
PATCH /api/businesses/:businessId/notification-templates/:id
POST /api/businesses/:businessId/notification-templates/copy-global
POST /api/businesses/:businessId/notifications/render
POST /api/businesses/:businessId/notifications
GET /api/businesses/:businessId/notifications
GET /api/businesses/:businessId/notifications/:id
PATCH /api/businesses/:businessId/notifications/:id/status
```

## Intentionally Not Implemented Yet

- No real WhatsApp integration.
- No SMS gateway integration.
- No email sending.
- No push notification sending.
- No background worker dispatch.
- No JWT login or auth guards.
- No Prisma or ORM.
- No database migration changes.