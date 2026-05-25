-- File: dev_sample_data.sql
-- Purpose: Insert minimal local development sample data for API smoke testing.
-- Safe to re-run. Does not delete or reset existing data.
-- Queue entries and appointments are intentionally not seeded; create them through the API.

INSERT INTO businesses (
  id,
  name,
  slug,
  business_type,
  default_language,
  timezone,
  phone,
  email,
  address,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'City Care Medical Center',
  'city-care-medical',
  'MEDICAL_CENTER',
  'en',
  'Asia/Colombo',
  '+94112345678',
  'info@citycare.test',
  'Main Street, Colombo',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_profile_settings (
  business_id,
  profile_mode,
  require_customer_name,
  require_age,
  require_gender,
  require_address,
  require_medical_history,
  require_current_symptoms,
  allow_linked_clients,
  allow_online_booking,
  no_show_ban_limit,
  queue_number_length
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'MEDICAL',
  true,
  false,
  false,
  false,
  false,
  false,
  true,
  true,
  3,
  3
)
ON CONFLICT (business_id) DO NOTHING;

INSERT INTO branches (
  id,
  business_id,
  name,
  code,
  address,
  phone,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000101',
  'Main Branch',
  'MAIN',
  'Main Street, Colombo',
  '+94112345678',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (
  id,
  business_id,
  branch_id,
  name,
  code,
  description,
  duration_minutes,
  requires_approval,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  'General Practice',
  'GP',
  'General doctor consultation',
  15,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (
  id,
  business_id,
  primary_phone,
  preferred_language,
  is_online_booking_banned,
  no_show_count
)
VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000101',
  '+94771234567',
  'en',
  false,
  0
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO client_profiles (
  id,
  business_id,
  customer_id,
  full_name,
  relationship_to_contact,
  gender,
  age_years,
  address,
  notes
)
VALUES (
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000104',
  'Test Patient',
  'SELF',
  'NOT_SPECIFIED',
  35,
  'Colombo',
  'Smoke test client profile'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO medical_profiles (
  id,
  business_id,
  customer_id,
  client_profile_id,
  blood_group,
  allergies,
  medical_history,
  current_symptoms,
  previous_visit_notes,
  emergency_contact_name,
  emergency_contact_phone
)
VALUES (
  '00000000-0000-0000-0000-000000000106',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105',
  'O+',
  'None known',
  'No major history',
  'Fever',
  'First visit',
  'Test Contact',
  '+94770000000'
)
ON CONFLICT (id) DO NOTHING;