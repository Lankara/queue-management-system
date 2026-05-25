import { NotificationChannel, NotificationLanguage, NotificationStatus, TemplateKey } from '../interfaces/notification.interface';

export const NOTIFICATION_LANGUAGES: NotificationLanguage[] = ['en', 'si'];
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['WEB', 'MOBILE_PUSH', 'WHATSAPP', 'SMS', 'EMAIL'];
export const NOTIFICATION_STATUSES: NotificationStatus[] = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'];
export const TEMPLATE_KEYS: TemplateKey[] = [
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
];