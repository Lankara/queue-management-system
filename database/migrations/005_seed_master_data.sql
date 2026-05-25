-- File: 005_seed_master_data.sql
-- Purpose: Seed default global notification templates for the Queue Management System database.
-- Warning: Run migrations in order from 001 to 005. Do not skip files.

-- These are default global templates because business_id is NULL.
-- In a later phase, businesses can copy these templates and customize their own messages.
-- This script uses WHERE NOT EXISTS because nullable business_id values are not treated as
-- equal by a normal UNIQUE constraint in PostgreSQL.

INSERT INTO notification_templates (
  business_id,
  language,
  template_key,
  channel,
  title,
  message_body
)
SELECT
  NULL,
  seed.language::language_code_enum,
  seed.template_key::template_key_enum,
  seed.channel::notification_channel_enum,
  seed.title,
  seed.message_body
FROM (
  VALUES
    ('en', 'QUEUE_CONFIRMED', 'WHATSAPP', 'Queue confirmed', 'Hello {{customer_name}}, your queue number at {{business_name}} is {{queue_number}}.'),
    ('si', 'QUEUE_CONFIRMED', 'WHATSAPP', 'පෝලිම තහවුරුයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි ඔබගේ පෝලිම් අංකය {{queue_number}} වේ.'),

    ('en', 'QUEUE_POSITION_UPDATED', 'WHATSAPP', 'Queue position updated', 'Hello {{customer_name}}, current number is {{current_number}}. Your queue number is {{queue_number}} and your position is {{position}}.'),
    ('si', 'QUEUE_POSITION_UPDATED', 'WHATSAPP', 'පෝලිම් තත්ත්වය යාවත්කාලීනයි', 'ආයුබෝවන් {{customer_name}}, වත්මන් අංකය {{current_number}}. ඔබගේ අංකය {{queue_number}} සහ ස්ථානය {{position}} වේ.'),

    ('en', 'APPOINTMENT_PENDING_APPROVAL', 'WHATSAPP', 'Appointment pending approval', 'Hello {{customer_name}}, your appointment request for {{appointment_time}} at {{business_name}} is pending approval.'),
    ('si', 'APPOINTMENT_PENDING_APPROVAL', 'WHATSAPP', 'වෙන්කිරීම අනුමැතිය සඳහා', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි {{appointment_time}} වෙන්කිරීම අනුමැතිය සඳහා පවතී.'),

    ('en', 'APPOINTMENT_APPROVED', 'WHATSAPP', 'Appointment approved', 'Hello {{customer_name}}, your appointment at {{business_name}} is approved for {{appointment_time}}.'),
    ('si', 'APPOINTMENT_APPROVED', 'WHATSAPP', 'වෙන්කිරීම අනුමතයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි ඔබගේ වෙන්කිරීම {{appointment_time}} ට අනුමත කර ඇත.'),

    ('en', 'APPOINTMENT_REJECTED', 'WHATSAPP', 'Appointment rejected', 'Hello {{customer_name}}, your appointment request at {{business_name}} was rejected. Reason: {{reason}}.'),
    ('si', 'APPOINTMENT_REJECTED', 'WHATSAPP', 'වෙන්කිරීම ප්‍රතික්ෂේපයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි ඔබගේ වෙන්කිරීම ප්‍රතික්ෂේප කර ඇත. හේතුව: {{reason}}.'),

    ('en', 'APPOINTMENT_CANCELLED_BY_CUSTOMER', 'WHATSAPP', 'Appointment cancelled', 'Hello {{customer_name}}, your appointment at {{business_name}} for {{appointment_time}} has been cancelled.'),
    ('si', 'APPOINTMENT_CANCELLED_BY_CUSTOMER', 'WHATSAPP', 'වෙන්කිරීම අවලංගුයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි {{appointment_time}} වෙන්කිරීම අවලංගු කර ඇත.'),

    ('en', 'RESCHEDULE_PROPOSED', 'WHATSAPP', 'New appointment time proposed', 'Hello {{customer_name}}, {{business_name}} proposed a new appointment time: {{new_appointment_time}}. Reason: {{reason}}.'),
    ('si', 'RESCHEDULE_PROPOSED', 'WHATSAPP', 'නව වේලාවක් යෝජනා කර ඇත', 'ආයුබෝවන් {{customer_name}}, {{business_name}} නව වේලාවක් යෝජනා කර ඇත: {{new_appointment_time}}. හේතුව: {{reason}}.'),

    ('en', 'DELAY_NOTICE', 'WHATSAPP', 'Delay notice', 'Hello {{customer_name}}, {{business_name}} is delayed by about {{delay_minutes}} minutes. Reason: {{reason}}.'),
    ('si', 'DELAY_NOTICE', 'WHATSAPP', 'ප්‍රමාද දැනුම්දීම', 'ආයුබෝවන් {{customer_name}}, {{business_name}} තුළ මිනිත්තු {{delay_minutes}} ක පමණ ප්‍රමාදයක් ඇත. හේතුව: {{reason}}.'),

    ('en', 'NO_SHOW_WARNING', 'WHATSAPP', 'No-show warning', 'Hello {{customer_name}}, you missed your appointment or queue turn at {{business_name}}. Repeated no-shows may block online booking.'),
    ('si', 'NO_SHOW_WARNING', 'WHATSAPP', 'නොපැමිණීමේ අනතුරු ඇඟවීම', 'ආයුබෝවන් {{customer_name}}, {{business_name}} හි ඔබගේ වාරය හෝ වෙන්කිරීම මගහැරී ඇත. නැවත නැවත නොපැමිණීමෙන් online booking අවහිර විය හැක.'),

    ('en', 'ONLINE_BOOKING_BANNED', 'WHATSAPP', 'Online booking blocked', 'Hello {{customer_name}}, online booking at {{business_name}} has been blocked for your number. Reason: {{reason}}.'),
    ('si', 'ONLINE_BOOKING_BANNED', 'WHATSAPP', 'Online booking අවහිරයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} සඳහා ඔබගේ අංකයෙන් online booking අවහිර කර ඇත. හේතුව: {{reason}}.'),

    ('en', 'BAN_RESET', 'WHATSAPP', 'Online booking restored', 'Hello {{customer_name}}, online booking at {{business_name}} has been restored for your number.'),
    ('si', 'BAN_RESET', 'WHATSAPP', 'Online booking නැවත සක්‍රීයයි', 'ආයුබෝවන් {{customer_name}}, {{business_name}} සඳහා ඔබගේ අංකයෙන් online booking නැවත සක්‍රීය කර ඇත.')
) AS seed(language, template_key, channel, title, message_body)
WHERE NOT EXISTS (
  SELECT 1
  FROM notification_templates existing
  WHERE existing.business_id IS NULL
    AND existing.language = seed.language::language_code_enum
    AND existing.template_key = seed.template_key::template_key_enum
    AND existing.channel = seed.channel::notification_channel_enum
)
ON CONFLICT DO NOTHING;

