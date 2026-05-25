import { NotificationChannel, NotificationLanguage, NotificationStatus, TemplateKey } from '@/types/notification';

export const notificationStatusOptions: Array<{ label: string; value: NotificationStatus }> = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'].map((value) => ({ label: value, value: value as NotificationStatus }));
export const notificationChannelOptions: Array<{ label: string; value: NotificationChannel }> = ['WEB', 'MOBILE_PUSH', 'WHATSAPP', 'SMS', 'EMAIL'].map((value) => ({ label: value, value: value as NotificationChannel }));
export const notificationLanguageOptions: Array<{ label: string; value: NotificationLanguage }> = [
  { label: 'English', value: 'en' },
  { label: 'Sinhala', value: 'si' }
];
export const templateKeyOptions: Array<{ label: string; value: TemplateKey }> = [
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
].map((value) => ({ label: value, value: value as TemplateKey }));
