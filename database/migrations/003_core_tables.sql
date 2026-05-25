-- File: 003_core_tables.sql
-- Purpose: Create core PostgreSQL tables for the Queue Management System database.
-- Warning: Run migrations in order from 001 to 005. Do not skip files.

-- This migration depends on:
-- 001_init_extensions.sql for gen_random_uuid().
-- 002_core_enums.sql for enum types used by these tables.

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  business_type business_type_enum NOT NULL,
  default_language language_code_enum NOT NULL DEFAULT 'en',
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Colombo',
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, code)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  password_hash TEXT,
  preferred_language language_code_enum NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (email),
  UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS business_profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  profile_mode profile_mode_enum NOT NULL DEFAULT 'BASIC',
  require_customer_name BOOLEAN NOT NULL DEFAULT true,
  require_age BOOLEAN NOT NULL DEFAULT false,
  require_gender BOOLEAN NOT NULL DEFAULT false,
  require_address BOOLEAN NOT NULL DEFAULT false,
  require_medical_history BOOLEAN NOT NULL DEFAULT false,
  require_current_symptoms BOOLEAN NOT NULL DEFAULT false,
  allow_linked_clients BOOLEAN NOT NULL DEFAULT true,
  allow_online_booking BOOLEAN NOT NULL DEFAULT true,
  no_show_ban_limit INTEGER NOT NULL DEFAULT 3,
  queue_number_length INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, code)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  primary_phone VARCHAR(30) NOT NULL,
  preferred_language language_code_enum NOT NULL DEFAULT 'en',
  is_online_booking_banned BOOLEAN NOT NULL DEFAULT false,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  ban_reset_at TIMESTAMPTZ,
  ban_reset_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, primary_phone)
);

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  relationship_to_contact VARCHAR(80),
  gender gender_code_enum NOT NULL DEFAULT 'NOT_SPECIFIED',
  date_of_birth DATE,
  age_years INTEGER,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL UNIQUE REFERENCES client_profiles(id) ON DELETE CASCADE,
  blood_group VARCHAR(20),
  allergies TEXT,
  medical_history TEXT,
  current_symptoms TEXT,
  previous_visit_notes TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  queue_date DATE NOT NULL,
  code VARCHAR(80) NOT NULL,
  current_number TEXT,
  last_issued_number INTEGER NOT NULL DEFAULT -1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, code, queue_date)
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  queue_number TEXT NOT NULL,
  queue_sequence INTEGER NOT NULL,
  status queue_status_enum NOT NULL DEFAULT 'DRAFT',
  source queue_source_enum NOT NULL,
  service_date DATE NOT NULL,
  confirmed_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  no_show_marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, queue_id, service_date, queue_sequence),
  UNIQUE (business_id, queue_id, service_date, queue_number)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
  requested_start_time TIMESTAMPTZ NOT NULL,
  requested_end_time TIMESTAMPTZ NOT NULL,
  approved_start_time TIMESTAMPTZ,
  approved_end_time TIMESTAMPTZ,
  status appointment_status_enum NOT NULL DEFAULT 'PENDING_APPROVAL',
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  reschedule_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS appointment_time_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_start_time TIMESTAMPTZ,
  old_end_time TIMESTAMPTZ,
  new_start_time TIMESTAMPTZ,
  new_end_time TIMESTAMPTZ,
  change_reason TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue_delay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  delay_minutes INTEGER NOT NULL,
  reason TEXT,
  affected_from_time TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  language language_code_enum NOT NULL,
  template_key template_key_enum NOT NULL,
  channel notification_channel_enum NOT NULL,
  title VARCHAR(200),
  message_body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (business_id, language, template_key, channel)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
  channel notification_channel_enum NOT NULL,
  language language_code_enum NOT NULL,
  template_key template_key_enum,
  recipient VARCHAR(255) NOT NULL,
  message_body TEXT NOT NULL,
  status notification_status_enum NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
