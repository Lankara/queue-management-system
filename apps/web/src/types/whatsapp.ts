export type WhatsAppCommand = 'HI' | 'HELP' | 'JOIN_QUEUE' | 'BOOK_APPOINTMENT' | 'CHECK_STATUS' | 'CANCEL' | 'UNKNOWN';
export type WhatsAppLanguage = 'en' | 'si';

export interface WhatsAppSessionState {
  phone: string;
  currentIntent?: WhatsAppCommand;
  businessSlug?: string;
  language?: WhatsAppLanguage;
  customerId?: string;
  clientProfileId?: string;
  lastMessageAt: string;
  step?: string;
  data: Record<string, unknown>;
}

export interface WhatsAppSimulatorResponse {
  normalizedCommand: WhatsAppCommand;
  confidence: number;
  sessionBefore: WhatsAppSessionState | null;
  sessionAfter: WhatsAppSessionState | null;
  generatedReply: string;
  detectedLanguage: WhatsAppLanguage | null;
  flowState: string;
  actionSummary: Record<string, unknown> | null;
}

export interface WhatsAppConversationMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  language?: WhatsAppLanguage | null;
}

export interface WhatsAppSupportedCommands {
  supportedLanguages: WhatsAppLanguage[];
  intents: Array<{ command: WhatsAppCommand; samples: string[]; description: string }>;
  flows: string[];
}
