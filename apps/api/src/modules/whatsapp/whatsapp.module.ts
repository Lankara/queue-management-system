import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WhatsAppCommandParserService } from './whatsapp-command-parser.service';
import { WhatsAppCustomerFlowService } from './whatsapp-customer-flow.service';
import { WhatsAppInboundParserService } from './whatsapp-inbound-parser.service';
import { WhatsAppMessageBuilderService } from './whatsapp-message-builder.service';
import { WhatsAppProvider } from './whatsapp.provider';
import { WhatsAppReplyBuilderService } from './whatsapp-reply-builder.service';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppSessionService } from './whatsapp-session.service';
import { WhatsAppSimulatorController } from './whatsapp-simulator.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsAppWebhookController, WhatsAppSimulatorController],
  providers: [
    WhatsAppProvider,
    WhatsAppService,
    WhatsAppInboundParserService,
    WhatsAppCommandParserService,
    WhatsAppSessionService,
    WhatsAppReplyBuilderService,
    WhatsAppMessageBuilderService,
    WhatsAppCustomerFlowService
  ],
  exports: [WhatsAppProvider, WhatsAppService]
})
export class WhatsAppModule {}

