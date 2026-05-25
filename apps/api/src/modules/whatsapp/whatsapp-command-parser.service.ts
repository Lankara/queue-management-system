import { Injectable } from '@nestjs/common';
import { WhatsAppParsedCommand } from './whatsapp-inbound.types';

@Injectable()
export class WhatsAppCommandParserService {
  parse(text: string | null | undefined): WhatsAppParsedCommand {
    const normalizedText = (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (!normalizedText) return { command: 'UNKNOWN', confidence: 0, normalizedText };
    if (['hi', 'hello', 'hey'].includes(normalizedText)) return { command: 'HI', confidence: 0.95, normalizedText };
    if (normalizedText === 'help' || normalizedText.includes('help')) return { command: 'HELP', confidence: 0.9, normalizedText };
    if (normalizedText === 'queue' || normalizedText.includes('join queue') || normalizedText.includes('queue')) return { command: 'JOIN_QUEUE', confidence: 0.85, normalizedText };
    if (normalizedText === 'appointment' || normalizedText.includes('book appointment') || normalizedText.includes('appointment')) return { command: 'BOOK_APPOINTMENT', confidence: 0.85, normalizedText };
    if (normalizedText === 'status' || normalizedText.includes('check status') || normalizedText.includes('status')) return { command: 'CHECK_STATUS', confidence: 0.85, normalizedText };
    if (normalizedText === 'cancel' || normalizedText.includes('cancel')) return { command: 'CANCEL', confidence: 0.85, normalizedText };

    return { command: 'UNKNOWN', confidence: 0.1, normalizedText };
  }
}
