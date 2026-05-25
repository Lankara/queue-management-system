import { Body, Controller, ForbiddenException, Get, Header, Logger, Post, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { env } from '../../config/env';
import { WhatsAppCustomerFlowService } from './whatsapp-customer-flow.service';
import { WhatsAppInboundParserService } from './whatsapp-inbound-parser.service';
import { WhatsAppInboundProcessingResult } from './whatsapp-inbound.types';

@Public()
@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly inboundParser: WhatsAppInboundParserService,
    private readonly customerFlow: WhatsAppCustomerFlowService
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string
  ): string {
    if (mode === 'subscribe' && verifyToken && verifyToken === env.whatsappWebhookVerifyToken) {
      this.logger.log('WhatsApp webhook verification succeeded');
      return challenge ?? '';
    }

    this.logger.warn('WhatsApp webhook verification failed');
    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  @Post()
  async receiveWebhook(@Body() payload: unknown): Promise<WhatsAppInboundProcessingResult> {
    if (!env.whatsappInboundEnabled) {
      const disabledEvents = this.inboundParser.parse(payload);
      this.logger.log(`WhatsApp inbound webhook received while disabled eventCount=${disabledEvents.length}`);
      return { enabled: false, devMode: env.whatsappInboundDevMode, received: true, eventCount: disabledEvents.length, events: [] };
    }

    const events = this.inboundParser.parse(payload);
    const normalizedEvents: WhatsAppInboundProcessingResult['events'] = [];

    for (const event of events) {
      if (event.type === 'MESSAGE' && event.message) {
        const result = await this.customerFlow.handleMessage(event.message);
        this.logger.log(`WhatsApp customer flow event command=${result.command} state=${result.state} confidence=${result.confidence}`);
        normalizedEvents.push({
          type: event.type,
          command: result.command,
          confidence: result.confidence,
          replyPreview: env.whatsappInboundDevMode ? result.reply : undefined
        });
      } else if (event.type === 'STATUS' && event.status) {
        this.logger.log(`WhatsApp status update status=${event.status.status ?? 'unknown'} hasMessageId=${Boolean(event.status.messageId)}`);
        normalizedEvents.push({ type: event.type });
      } else {
        this.logger.log(`WhatsApp webhook unknown event object=${event.rawObject ?? 'unknown'}`);
        normalizedEvents.push({ type: event.type });
      }
    }

    return {
      enabled: true,
      devMode: env.whatsappInboundDevMode,
      received: true,
      eventCount: events.length,
      events: normalizedEvents
    };
  }
}
