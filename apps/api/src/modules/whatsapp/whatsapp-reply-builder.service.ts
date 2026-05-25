import { Injectable } from '@nestjs/common';
import { WhatsAppCommand } from './whatsapp-inbound.types';

@Injectable()
export class WhatsAppReplyBuilderService {
  buildWelcomeReply(): string {
    return 'Welcome to Queue Management. Reply HELP to see available options.';
  }

  buildHelpReply(): string {
    return 'Available options: JOIN QUEUE, BOOK APPOINTMENT, CHECK STATUS, CANCEL. WhatsApp actions are coming soon.';
  }

  buildUnknownReply(): string {
    return 'Sorry, I did not understand that. Reply HELP to see available options.';
  }

  buildFeatureComingSoonReply(command: WhatsAppCommand): string {
    return `${command.replace(/_/g, ' ')} through WhatsApp is coming soon. Please use the public QR link or contact the counter for now.`;
  }
}
