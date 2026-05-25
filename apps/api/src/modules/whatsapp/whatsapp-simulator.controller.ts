import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { WhatsAppCustomerFlowService } from './whatsapp-customer-flow.service';
import { WhatsAppInboundMessage } from './whatsapp-inbound.types';
import { WhatsAppSessionService } from './whatsapp-session.service';

interface SimulateMessageBody {
  phone: string;
  text: string;
  profileName?: string;
}

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
@Controller('whatsapp/simulator')
export class WhatsAppSimulatorController {
  constructor(
    private readonly customerFlow: WhatsAppCustomerFlowService,
    private readonly sessions: WhatsAppSessionService
  ) {}

  @Post('simulate-message')
  async simulateMessage(@Body() body: SimulateMessageBody) {
    const sessionBefore = this.sessions.getExistingSession(body.phone);
    const inboundMessage: WhatsAppInboundMessage = {
      object: 'simulator',
      entryId: 'simulator',
      phoneNumberId: 'simulator',
      fromPhone: body.phone,
      messageId: `sim-${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      messageType: 'text',
      textBody: body.text,
      buttonReply: null,
      listReply: null,
      profileName: body.profileName ?? 'Simulator User'
    };
    const result = await this.customerFlow.handleMessage(inboundMessage, { suppressSend: true, ignoreCooldown: true });
    const sessionAfter = this.sessions.getExistingSession(body.phone);
    return successResponse({
      normalizedCommand: result.command,
      confidence: result.confidence,
      sessionBefore,
      sessionAfter,
      generatedReply: result.reply,
      detectedLanguage: result.detectedLanguage ?? sessionAfter?.language ?? null,
      flowState: result.state,
      actionSummary: result.actionSummary ?? sessionAfter?.data?.lastAction ?? null
    });
  }

  @Get('session/:phone')
  async getSession(@Param('phone') phone: string) {
    return successResponse({ session: this.sessions.getExistingSession(phone) });
  }

  @Delete('session/:phone')
  async clearSession(@Param('phone') phone: string) {
    this.sessions.clearSession(phone);
    return successResponse({ cleared: true });
  }

  @Get('supported-commands')
  async getSupportedCommands() {
    return successResponse({
      supportedLanguages: ['en', 'si'],
      intents: [
        { command: 'HI', samples: ['hi', 'hello', 'start'], description: 'Show welcome menu' },
        { command: 'HELP', samples: ['help', '4'], description: 'Show help text' },
        { command: 'JOIN_QUEUE', samples: ['queue', 'join queue', '1'], description: 'Start guided queue join flow' },
        { command: 'BOOK_APPOINTMENT', samples: ['appointment', 'book appointment', '2'], description: 'Start guided appointment request flow' },
        { command: 'CHECK_STATUS', samples: ['status', 'check status', '3'], description: 'Check latest active queue or appointment' },
        { command: 'CANCEL', samples: ['cancel'], description: 'Cancel latest cancellable appointment with confirmation' }
      ],
      flows: [
        'Greeting and language selection',
        'Queue service selection and confirmed queue entry creation',
        'Appointment service and datetime selection',
        'Queue or appointment status lookup',
        'Appointment cancellation confirmation'
      ]
    });
  }
}
