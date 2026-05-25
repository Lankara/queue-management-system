# Backend Smoke Test Flow

This guide describes a manual API smoke test flow using `curl`, Thunder Client, Postman, or the VS Code REST Client file at `docs/testing/sample-api-requests.http`.

Start the API first:

```powershell
cd "C:\Queue Management System"
pnpm --filter @queue-management/api dev
```

Base URL:

```text
http://localhost:4000/api
```

## Test Order

1. Check API health: `GET /health`
2. Check DB health: `GET /health/db`
3. Create business: `POST /businesses`
4. Create branch: `POST /businesses/:businessId/branches`
5. Create service: `POST /businesses/:businessId/services`
6. Get profile settings: `GET /businesses/:businessId/profile-settings`
7. Create customer: `POST /businesses/:businessId/customers`
8. Create client profile: `POST /businesses/:businessId/customers/:customerId/client-profiles`
9. Create medical profile: `POST /businesses/:businessId/client-profiles/:clientProfileId/medical-profile`
10. Join queue draft: `POST /businesses/:businessId/queues/join-draft`
11. Confirm queue entry: `PATCH /businesses/:businessId/queue-entries/:entryId/confirm`
12. Get queue position: `GET /businesses/:businessId/queue-entries/:entryId/position?logNotification=true`
13. Call next queue entry: `PATCH /businesses/:businessId/queues/:queueId/call-next`
14. Start service: `PATCH /businesses/:businessId/queue-entries/:entryId/start-service`
15. Complete service: `PATCH /businesses/:businessId/queue-entries/:entryId/complete`
16. Request appointment: `POST /businesses/:businessId/appointments/request`
17. Approve appointment: `PATCH /businesses/:businessId/appointments/:appointmentId/approve`
18. Propose reschedule: `PATCH /businesses/:businessId/appointments/:appointmentId/propose-reschedule`
19. Accept reschedule: `PATCH /businesses/:businessId/appointments/:appointmentId/accept-reschedule`
20. Create delay event: `POST /businesses/:businessId/delays`
21. List notifications: `GET /businesses/:businessId/notifications`

## Notes

- These endpoints are currently open for local development. Auth guards are not implemented yet.
- Notification endpoints create log records only. No WhatsApp, SMS, email, or push messages are sent.
- Queue entries and appointments should be created through the API so queue number generation and event notification logging are tested properly.
- Copy response IDs into the variables at the top of `sample-api-requests.http` as you move through the flow.

## PowerShell Smoke Scripts

A scripted version of the main backend smoke flow is available under `scripts/api-smoke/`.

Run all steps from the monorepo root:

```powershell
pnpm smoke:api
```

The scripts store created IDs in `scripts/api-smoke/.tmp/ids.json` and reuse them across the queue, appointment, delay, and notification checks. See `docs/testing/api-smoke-powershell-guide.md` for details.
