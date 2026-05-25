# Phase 20: Notifications and Delay UI

## Notification Management Flow

The `/dashboard/notifications` page now supports notification log filtering, log inspection, manual status updates, notification template listing, business template creation/editing, global template copying, and template render testing.

## Template Hierarchy Behavior

Global templates are displayed as read-only. Business-specific templates can be edited. A global template can be copied into a business-specific template using the copy action.

## Template Render/Test Behavior

The render panel calls `POST /api/businesses/:businessId/notifications/render` with language, channel, template key, and JSON variables. Rendered title and message body are displayed without sending any external message.

## Delay Workflow

The `/dashboard/delays` page supports delay filtering, delay event creation, event listing, and selected event details. Creating a delay calls `POST /api/businesses/:businessId/delays`.

## Affected Appointment Behavior

Affected appointment shift results are shown immediately after creating a delay event. Persisted delay events are listed from the backend, but affected appointment details are not reloaded for old events because the current backend list/detail endpoints return delay event records only.

## Polling Behavior

- Notification logs refresh every 20 seconds using `['notifications', businessId, filters]`.
- Delay events refresh every 30 seconds using `['delays', businessId, filters]`.

## Intentionally Not Implemented Yet

- Real WhatsApp/SMS/email/push sending
- Real-time websocket notifications
- Notification resend actions
- Advanced notification analytics
- Persisted affected-appointment reload for historical delay events
- Calendar drag/drop scheduling
