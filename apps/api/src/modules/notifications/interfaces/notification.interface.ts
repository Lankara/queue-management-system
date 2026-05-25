export type NotificationLanguage = 'en' | 'si';
export type NotificationChannel = 'WEB' | 'MOBILE_PUSH' | 'WHATSAPP' | 'SMS' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
export type TemplateKey =
  | 'QUEUE_CONFIRMED'
  | 'QUEUE_POSITION_UPDATED'
  | 'APPOINTMENT_PENDING_APPROVAL'
  | 'APPOINTMENT_APPROVED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED_BY_CUSTOMER'
  | 'RESCHEDULE_PROPOSED'
  | 'DELAY_NOTICE'
  | 'NO_SHOW_WARNING'
  | 'ONLINE_BOOKING_BANNED'
  | 'BAN_RESET';

export interface NotificationTemplate {
  id: string;
  businessId: string | null;
  language: NotificationLanguage;
  templateKey: TemplateKey;
  channel: NotificationChannel;
  title: string | null;
  messageBody: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface NotificationLog {
  id: string;
  businessId: string;
  customerId: string | null;
  clientProfileId: string | null;
  appointmentId: string | null;
  queueEntryId: string | null;
  channel: NotificationChannel;
  language: NotificationLanguage;
  templateKey: TemplateKey | null;
  recipient: string;
  messageBody: string;
  status: NotificationStatus;
  sentAt: Date | null;
  failedReason: string | null;
  createdAt: Date;
}

export interface RenderNotificationInput {
  language: NotificationLanguage;
  templateKey: TemplateKey;
  channel: NotificationChannel;
  variables: Record<string, unknown>;
}

export interface RenderedNotification {
  templateId: string;
  title: string | null;
  messageBody: string;
}