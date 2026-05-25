-- File: 004_indexes_constraints.sql
-- Purpose: Create performance indexes and additional CHECK constraints for the Queue Management System database.
-- Warning: Run migrations in order from 001 to 005. Do not skip files.

-- Indexes use CREATE INDEX IF NOT EXISTS so this script is safe to re-run.
-- CHECK constraints are added through safe DO blocks because PostgreSQL does not support
-- ADD CONSTRAINT IF NOT EXISTS directly.

-- Tenant filtering indexes
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches (business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users (business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users (user_id);
CREATE INDEX IF NOT EXISTS idx_business_profile_settings_business_id ON business_profile_settings (business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services (business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers (business_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_business_id ON client_profiles (business_id);
CREATE INDEX IF NOT EXISTS idx_medical_profiles_business_id ON medical_profiles (business_id);
CREATE INDEX IF NOT EXISTS idx_queues_business_id ON queues (business_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_id ON queue_entries (business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments (business_id);
CREATE INDEX IF NOT EXISTS idx_appointment_time_changes_business_id ON appointment_time_changes (business_id);
CREATE INDEX IF NOT EXISTS idx_queue_delay_events_business_id ON queue_delay_events (business_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_business_id ON notification_templates (business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications (business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs (business_id);

-- Customer lookup indexes
CREATE INDEX IF NOT EXISTS idx_customers_business_phone ON customers (business_id, primary_phone);
CREATE INDEX IF NOT EXISTS idx_client_profiles_business_customer ON client_profiles (business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_medical_profiles_business_client_profile ON medical_profiles (business_id, client_profile_id);

-- Queue operation indexes
CREATE INDEX IF NOT EXISTS idx_queues_business_branch_service_date ON queues (business_id, branch_id, service_id, queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_queue_status ON queue_entries (business_id, queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_queue_date_sequence ON queue_entries (business_id, queue_id, service_date, queue_sequence);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_customer_date ON queue_entries (business_id, customer_id, service_date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_client_profile_date ON queue_entries (business_id, client_profile_id, service_date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_status_created ON queue_entries (business_id, status, created_at);

-- Appointment operation indexes
CREATE INDEX IF NOT EXISTS idx_appointments_business_status ON appointments (business_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_business_requested_start ON appointments (business_id, requested_start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_business_approved_start ON appointments (business_id, approved_start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_business_customer ON appointments (business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_client_profile ON appointments (business_id, client_profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_service_approved_start ON appointments (business_id, service_id, approved_start_time);

-- Delay and reschedule indexes
CREATE INDEX IF NOT EXISTS idx_appointment_time_changes_business_appointment ON appointment_time_changes (business_id, appointment_id);
CREATE INDEX IF NOT EXISTS idx_queue_delay_events_business_branch_service_time ON queue_delay_events (business_id, branch_id, service_id, affected_from_time);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_business_language_key_channel ON notification_templates (business_id, language, template_key, channel);
CREATE INDEX IF NOT EXISTS idx_notifications_business_customer_status ON notifications (business_id, customer_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_business_appointment ON notifications (business_id, appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_queue_entry ON notifications (business_id, queue_entry_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_status_created ON notifications (business_id, status, created_at);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_created ON audit_logs (business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs (actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- Helpful active-record indexes
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses (is_active);
CREATE INDEX IF NOT EXISTS idx_branches_business_active ON branches (business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_business_active ON services (business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- CHECK constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_business_profile_settings_no_show_ban_limit_non_negative') THEN
    ALTER TABLE business_profile_settings
      ADD CONSTRAINT chk_business_profile_settings_no_show_ban_limit_non_negative
      CHECK (no_show_ban_limit >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_business_profile_settings_queue_number_length_range') THEN
    ALTER TABLE business_profile_settings
      ADD CONSTRAINT chk_business_profile_settings_queue_number_length_range
      CHECK (queue_number_length BETWEEN 1 AND 6);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_services_duration_minutes_positive') THEN
    ALTER TABLE services
      ADD CONSTRAINT chk_services_duration_minutes_positive
      CHECK (duration_minutes > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_customers_no_show_count_non_negative') THEN
    ALTER TABLE customers
      ADD CONSTRAINT chk_customers_no_show_count_non_negative
      CHECK (no_show_count >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_client_profiles_age_years_non_negative') THEN
    ALTER TABLE client_profiles
      ADD CONSTRAINT chk_client_profiles_age_years_non_negative
      CHECK (age_years IS NULL OR age_years >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_queues_last_issued_number_minimum') THEN
    ALTER TABLE queues
      ADD CONSTRAINT chk_queues_last_issued_number_minimum
      CHECK (last_issued_number >= -1);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_queue_entries_queue_sequence_non_negative') THEN
    ALTER TABLE queue_entries
      ADD CONSTRAINT chk_queue_entries_queue_sequence_non_negative
      CHECK (queue_sequence >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_appointments_requested_time_order') THEN
    ALTER TABLE appointments
      ADD CONSTRAINT chk_appointments_requested_time_order
      CHECK (requested_end_time > requested_start_time);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_appointments_approved_time_order') THEN
    ALTER TABLE appointments
      ADD CONSTRAINT chk_appointments_approved_time_order
      CHECK (approved_end_time IS NULL OR approved_start_time IS NULL OR approved_end_time > approved_start_time);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_queue_delay_events_delay_minutes_positive') THEN
    ALTER TABLE queue_delay_events
      ADD CONSTRAINT chk_queue_delay_events_delay_minutes_positive
      CHECK (delay_minutes > 0);
  END IF;
END
$$;
