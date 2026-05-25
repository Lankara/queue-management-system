import { Injectable } from '@nestjs/common';
import { WhatsAppInboundEvent } from './whatsapp-inbound.types';

interface WhatsAppPayloadContact {
  profile?: { name?: string };
  wa_id?: string;
}

interface WhatsAppPayloadMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
}

interface WhatsAppPayloadStatus {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
}

interface WhatsAppPayloadValue {
  metadata?: { phone_number_id?: string };
  contacts?: WhatsAppPayloadContact[];
  messages?: WhatsAppPayloadMessage[];
  statuses?: WhatsAppPayloadStatus[];
}

@Injectable()
export class WhatsAppInboundParserService {
  parse(payload: unknown): WhatsAppInboundEvent[] {
    if (!payload || typeof payload !== 'object') {
      return [{ type: 'UNKNOWN', rawObject: null }];
    }

    const root = payload as { object?: string; entry?: Array<{ id?: string; changes?: Array<{ value?: WhatsAppPayloadValue }> }> };
    const events: WhatsAppInboundEvent[] = [];

    for (const entry of root.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;
        const phoneNumberId = value.metadata?.phone_number_id ?? null;
        const profileName = value.contacts?.[0]?.profile?.name ?? null;

        for (const message of value.messages ?? []) {
          events.push({
            type: 'MESSAGE',
            message: {
              object: root.object ?? null,
              entryId: entry.id ?? null,
              phoneNumberId,
              fromPhone: message.from ?? null,
              messageId: message.id ?? null,
              timestamp: message.timestamp ?? null,
              messageType: message.type ?? null,
              textBody: message.type === 'text' ? message.text?.body ?? null : null,
              buttonReply: message.interactive?.button_reply?.title ?? message.button?.text ?? message.button?.payload ?? null,
              listReply: message.interactive?.list_reply?.title ?? null,
              profileName
            }
          });
        }

        for (const status of value.statuses ?? []) {
          events.push({
            type: 'STATUS',
            status: {
              object: root.object ?? null,
              entryId: entry.id ?? null,
              phoneNumberId,
              recipientId: status.recipient_id ?? null,
              messageId: status.id ?? null,
              status: status.status ?? null,
              timestamp: status.timestamp ?? null
            }
          });
        }
      }
    }

    return events.length > 0 ? events : [{ type: 'UNKNOWN', rawObject: root.object ?? null }];
  }
}
