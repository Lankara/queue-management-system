import { Injectable, Logger } from '@nestjs/common';
import { normalizePhone } from '../../common/utils/phone.util';
import { NotificationProvider, NotificationPayload, NotificationSendResult } from '../notifications/providers/notification-provider.interface';
import { DEFAULT_WHATSAPP_API_VERSION, DEFAULT_WHATSAPP_COUNTRY_CODE, DEFAULT_WHATSAPP_GRAPH_BASE_URL, WHATSAPP_PROVIDER_NAME } from './whatsapp.constants';
import { WhatsAppCloudResponse, WhatsAppCloudTextRequest, WhatsAppProviderConfig } from './whatsapp.types';

function parseBoolean(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
}

@Injectable()
export class WhatsAppProvider implements NotificationProvider {
  readonly channel = 'WHATSAPP' as const;
  private readonly logger = new Logger(WhatsAppProvider.name);
  private readonly config: WhatsAppProviderConfig;

  constructor() {
    this.config = {
      provider: process.env.WHATSAPP_PROVIDER ?? WHATSAPP_PROVIDER_NAME,
      enabled: parseBoolean(process.env.WHATSAPP_ENABLED),
      devMode: parseBoolean(process.env.WHATSAPP_DEV_MODE ?? 'true'),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiVersion: process.env.WHATSAPP_API_VERSION ?? DEFAULT_WHATSAPP_API_VERSION,
      graphBaseUrl: process.env.WHATSAPP_GRAPH_BASE_URL ?? DEFAULT_WHATSAPP_GRAPH_BASE_URL,
      defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? DEFAULT_WHATSAPP_COUNTRY_CODE
    };
  }

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const requestBody = this.createTextRequest(payload.recipient, payload.messageBody);

    if (this.config.devMode) {
      this.logger.log(`Simulated WhatsApp send notificationId=${payload.notificationId} to=${requestBody.to}`);
      return {
        success: true,
        provider: this.config.provider,
        providerMessageId: `simulated-${payload.notificationId}`,
        simulated: true,
        rawResponse: requestBody
      };
    }

    if (!this.config.enabled) {
      return { success: false, provider: this.config.provider, errorMessage: 'WhatsApp provider is disabled' };
    }

    if (!this.config.phoneNumberId || !this.config.accessToken) {
      return { success: false, provider: this.config.provider, errorMessage: 'WhatsApp provider credentials are not configured' };
    }

    const endpoint = `${this.config.graphBaseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const body = (await response.json().catch(() => ({}))) as WhatsAppCloudResponse;

      if (!response.ok) {
        return {
          success: false,
          provider: this.config.provider,
          errorMessage: body.error?.message ?? `WhatsApp API request failed with status ${response.status}`,
          rawResponse: body
        };
      }

      return {
        success: true,
        provider: this.config.provider,
        providerMessageId: body.messages?.[0]?.id,
        rawResponse: body
      };
    } catch (error) {
      return {
        success: false,
        provider: this.config.provider,
        errorMessage: error instanceof Error ? error.message : 'Unknown WhatsApp provider error'
      };
    }
  }

  private createTextRequest(recipient: string, messageBody: string): WhatsAppCloudTextRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.toWhatsAppRecipient(recipient),
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody
      }
    };
  }

  private toWhatsAppRecipient(recipient: string): string {
    const normalized = normalizePhone(recipient).replace(/^\+/, '');
    if (normalized.startsWith('0')) {
      return `${this.config.defaultCountryCode}${normalized.slice(1)}`;
    }
    return normalized;
  }
}
