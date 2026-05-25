# Database Execution Order

## Database Name

Use the PostgreSQL database named `queue_management_db`.

## Migration Run Order

Run the migration files in this exact order:

1. `database/migrations/001_init_extensions.sql`
2. `database/migrations/002_core_enums.sql`
3. `database/migrations/003_core_tables.sql`
4. `database/migrations/004_indexes_constraints.sql`
5. `database/migrations/005_seed_master_data.sql`

## Running Scripts in pgAdmin 4

1. Open pgAdmin 4.
2. Connect to your PostgreSQL server.
3. Create or select the database named `queue_management_db`.
4. Open the Query Tool for `queue_management_db`.
5. Open the first migration file, starting with `001_init_extensions.sql`.
6. Run the script.
7. Confirm it completes without errors.
8. Continue with the next migration file in order until `005_seed_master_data.sql` is complete.

## Execution Rules

- Stop immediately if any error occurs.
- Do not skip files.
- Do not run files out of order.
- Do not add table, enum, index, constraint, or seed SQL until the database design phase begins.
