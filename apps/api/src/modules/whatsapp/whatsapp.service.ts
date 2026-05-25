import { Injectable } from '@nestjs/common';
import { NotificationPayload, NotificationSendResult } from '../notifications/providers/notification-provider.interface';
import { WhatsAppProvider } from './whatsapp.provider';

@Injectable()
export class WhatsAppService {
  constructor(private readonly whatsAppProvider: WhatsAppProvider) {}

  sendText(payload: NotificationPayload): Promise<NotificationSendResult> {
    return this.whatsAppProvider.send(payload);
  }
}
