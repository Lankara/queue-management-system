import { NotificationChannel } from '../interfaces/notification.interface';

export interface NotificationPayload {
  notificationId: string;
  businessId: string;
  channel: NotificationChannel;
  recipient: string;
  messageBody: string;
}

export interface NotificationSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  simulated?: boolean;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}
