-- File: validate_database.sql
-- Purpose: Read-only validation checks for the Queue Management System database.
-- Usage: Run this script in pgAdmin 4 after migrations 001 to 005 complete successfully.
-- Note: This script uses SELECT queries only and does not change database data or schema.

-- 1. Validate pgcrypto extension exists.
SELECT
  'pgcrypto extension exists' AS check_name,
  1 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 1 AS passed
FROM pg_extension
WHERE extname = 'pgcrypto';

-- 2. Validate all 11 enum types exist.
SELECT
  'core enum types exist' AS check_name,
  11 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 11 AS passed
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'business_type_enum',
    'profile_mode_enum',
    'user_role_enum',
    'language_code_enum',
    'gender_code_enum',
    'queue_status_enum',
    'appointment_status_enum',
    'queue_source_enum',
    'notification_channel_enum',
    'notification_status_enum',
    'template_key_enum'
  );

-- 3. List enum types and values for manual review.
SELECT
  t.typname AS enum_type,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 4. Validate all 17 core tables exist.
SELECT
  'core tables exist' AS check_name,
  17 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 17 AS passed
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'businesses',
    'branches',
    'users',
    'business_users',
    'business_profile_settings',
    'services',
    'customers',
    'client_profiles',
    'medical_profiles',
    'queues',
    'queue_entries',
    'appointments',
    'appointment_time_changes',
    'queue_delay_events',
    'notification_templates',
    'notifications',
    'audit_logs'
  );

-- 5. List core tables for manual review.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 6. Validate total global notification template count is 22.
SELECT
  'global notification template count' AS check_name,
  22 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 22 AS passed
FROM notification_templates
WHERE business_id IS NULL;

-- 7. Validate English global notification template count is 11.
SELECT
  'English global notification template count' AS check_name,
  11 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 11 AS passed
FROM notification_templates
WHERE business_id IS NULL
  AND language = 'en';

-- 8. Validate Sinhala global notification template count is 11.
SELECT
  'Sinhala global notification template count' AS check_name,
  11 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 11 AS passed
FROM notification_templates
WHERE business_id IS NULL
  AND language = 'si';

-- 9. Validate important indexes exist.
SELECT
  'important indexes exist' AS check_name,
  14 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 14 AS passed
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_branches_business_id',
    'idx_business_users_business_id',
    'idx_services_business_id',
    'idx_customers_business_phone',
    'idx_client_profiles_business_customer',
    'idx_medical_profiles_business_client_profile',
    'idx_queues_business_branch_service_date',
    'idx_queue_entries_business_queue_status',
    'idx_queue_entries_business_queue_date_sequence',
    'idx_appointments_business_status',
    'idx_appointments_business_service_approved_start',
    'idx_notifications_business_status_created',
    'idx_audit_logs_business_created',
    'idx_users_is_active'
  );

-- 10. List important indexes for manual review.
SELECT tablename,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_branches_business_id',
    'idx_business_users_business_id',
    'idx_services_business_id',
    'idx_customers_business_phone',
    'idx_client_profiles_business_customer',
    'idx_medical_profiles_business_client_profile',
    'idx_queues_business_branch_service_date',
    'idx_queue_entries_business_queue_status',
    'idx_queue_entries_business_queue_date_sequence',
    'idx_appointments_business_status',
    'idx_appointments_business_service_approved_start',
    'idx_notifications_business_status_created',
    'idx_audit_logs_business_created',
    'idx_users_is_active'
  )
ORDER BY tablename, indexname;

-- 11. Validate CHECK constraints exist.
SELECT
  'check constraints exist' AS check_name,
  10 AS expected_count,
  COUNT(*) AS actual_count,
  COUNT(*) = 10 AS passed
FROM pg_constraint
WHERE contype = 'c'
  AND conname IN (
    'chk_business_profile_settings_no_show_ban_limit_non_negative',
    'chk_business_profile_settings_queue_number_length_range',
    'chk_services_duration_minutes_positive',
    'chk_customers_no_show_count_non_negative',
    'chk_client_profiles_age_years_non_negative',
    'chk_queues_last_issued_number_minimum',
    'chk_queue_entries_queue_sequence_non_negative',
    'chk_appointments_requested_time_order',
    'chk_appointments_approved_time_order',
    'chk_queue_delay_events_delay_minutes_positive'
  );

-- 12. List CHECK constraints for manual review.
SELECT conname AS constraint_name,
       conrelid::regclass AS table_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
  AND conname IN (
    'chk_business_profile_settings_no_show_ban_limit_non_negative',
    'chk_business_profile_settings_queue_number_length_range',
    'chk_services_duration_minutes_positive',
    'chk_customers_no_show_count_non_negative',
    'chk_client_profiles_age_years_non_negative',
    'chk_queues_last_issued_number_minimum',
    'chk_queue_entries_queue_sequence_non_negative',
    'chk_appointments_requested_time_order',
    'chk_appointments_approved_time_order',
    'chk_queue_delay_events_delay_minutes_positive'
  )
ORDER BY table_name, constraint_name;
