# Development Seed Guide

The file `database/seeds/dev_sample_data.sql` inserts a minimal local dataset for smoke testing.

## How To Run In pgAdmin 4

1. Open pgAdmin 4.
2. Connect to your local PostgreSQL server.
3. Select the `queue_management_db` database.
4. Open the Query Tool.
5. Open or paste `database/seeds/dev_sample_data.sql`.
6. Run the script.
7. Confirm it completes without errors.

The script is safe to re-run. It uses fixed UUIDs and `ON CONFLICT DO NOTHING` where possible. It does not delete, truncate, or reset existing data.

## Fixed UUIDs For API Tests

Use these IDs in API requests:

```text
businessId      = 00000000-0000-0000-0000-000000000101
branchId        = 00000000-0000-0000-0000-000000000102
serviceId       = 00000000-0000-0000-0000-000000000103
customerId      = 00000000-0000-0000-0000-000000000104
clientProfileId = 00000000-0000-0000-0000-000000000105
medicalProfileId = 00000000-0000-0000-0000-000000000106
```

These values match the variables in `docs/testing/sample-api-requests.http`.

## Why Queue Entries And Appointments Are Not Seeded

Queue entries and appointments are intentionally created through the API instead of seed SQL because those flows test important backend behavior:

- Queue creation or reuse.
- Queue number generation.
- Draft queue confirmation.
- Queue position calculation.
- Appointment approval creating a queue entry.
- Notification log creation from queue and appointment events.

Seeding those records directly would skip the core smoke test behavior.