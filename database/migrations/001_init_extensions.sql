-- File: 001_init_extensions.sql
-- Purpose: Enable PostgreSQL extensions required by the Queue Management System database.
-- Warning: Run migrations in order from 001 to 005. Do not skip files.

-- This script is safe to re-run because each extension is created only if it does not already exist.

-- pgcrypto provides gen_random_uuid(), which will be used for UUID primary keys and identifiers in later migrations.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
