# pgAdmin 4 Setup Guide

## Create the Database

1. Open pgAdmin 4.
2. Connect to your local PostgreSQL server.
3. Right-click `Databases`.
4. Select `Create` > `Database...`.
5. Set the database name to `queue_management_db`.
6. Confirm the owner is the expected local PostgreSQL user, usually `postgres`.
7. Click `Save`.

## Run Migrations

Run the migration files in this exact order:

1. `database/migrations/001_init_extensions.sql`
2. `database/migrations/002_core_enums.sql`
3. `database/migrations/003_core_tables.sql`
4. `database/migrations/004_indexes_constraints.sql`
5. `database/migrations/005_seed_master_data.sql`

For each file:

1. Select the `queue_management_db` database in pgAdmin 4.
2. Open the Query Tool.
3. Open or paste the SQL file content.
4. Run the script.
5. Confirm it completes successfully before moving to the next file.

## If an Error Occurs

- Stop immediately.
- Do not continue to the next migration.
- Read the error message and line number shown by pgAdmin 4.
- Fix the current migration or database state before retrying.
- Re-run the failed migration only after the issue is understood.

## Local Development Reset

Warning: This reset deletes all objects and data in the `public` schema. Use it only for local development.

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

After resetting, run migrations `001` to `005` again in order.
