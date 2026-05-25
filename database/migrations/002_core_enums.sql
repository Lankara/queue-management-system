-- File: 002_core_enums.sql
-- Purpose: Create core PostgreSQL enum types for the Queue Management System database.
-- Warning: Run migrations in order from 001 to 005. Do not skip files.

-- Each enum is created inside a safe DO block so this script can be re-run without failing
-- when the enum type already exists.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type_enum') THEN
    CREATE TYPE business_type_enum AS ENUM (
      'MEDICAL_CENTER',
      'DOCTOR',
      'CLINIC',
      'HOSPITAL',
      'BARBER_SHOP',
      'BEAUTY_PARLOUR',
      'SALON',
      'SERVICE_SHOP',
      'OTHER'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_mode_enum') THEN
    CREATE TYPE profile_mode_enum AS ENUM (
      'BASIC',
      'MEDICAL',
      'CUSTOM'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM (
      'SUPER_ADMIN',
      'BUSINESS_OWNER',
      'MANAGER',
      'DOCTOR',
      'OPERATOR',
      'STAFF',
      'CUSTOMER'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_code_enum') THEN
    CREATE TYPE language_code_enum AS ENUM (
      'en',
      'si'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_code_enum') THEN
    CREATE TYPE gender_code_enum AS ENUM (
      'MALE',
      'FEMALE',
      'OTHER',
      'NOT_SPECIFIED'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status_enum') THEN
    CREATE TYPE queue_status_enum AS ENUM (
      'DRAFT',
      'CONFIRMED',
      'WAITING',
      'CALLED',
      'IN_SERVICE',
      'COMPLETED',
      'SKIPPED',
      'CANCELLED',
      'NO_SHOW'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_enum') THEN
    CREATE TYPE appointment_status_enum AS ENUM (
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'RESCHEDULE_PROPOSED',
      'RESCHEDULE_ACCEPTED',
      'RESCHEDULE_REJECTED',
      'CANCELLED_BY_CUSTOMER',
      'CANCELLED_BY_OPERATOR',
      'DELAYED',
      'IN_QUEUE',
      'IN_SERVICE',
      'COMPLETED',
      'NO_SHOW'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_source_enum') THEN
    CREATE TYPE queue_source_enum AS ENUM (
      'QR',
      'WEB',
      'MOBILE_APP',
      'WHATSAPP',
      'OPERATOR',
      'HARDWARE'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel_enum') THEN
    CREATE TYPE notification_channel_enum AS ENUM (
      'WEB',
      'MOBILE_PUSH',
      'WHATSAPP',
      'SMS',
      'EMAIL'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status_enum') THEN
    CREATE TYPE notification_status_enum AS ENUM (
      'PENDING',
      'SENT',
      'FAILED',
      'CANCELLED'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_key_enum') THEN
    CREATE TYPE template_key_enum AS ENUM (
      'QUEUE_CONFIRMED',
      'QUEUE_POSITION_UPDATED',
      'APPOINTMENT_PENDING_APPROVAL',
      'APPOINTMENT_APPROVED',
      'APPOINTMENT_REJECTED',
      'APPOINTMENT_CANCELLED_BY_CUSTOMER',
      'RESCHEDULE_PROPOSED',
      'DELAY_NOTICE',
      'NO_SHOW_WARNING',
      'ONLINE_BOOKING_BANNED',
      'BAN_RESET'
    );
  END IF;
END
$$;
