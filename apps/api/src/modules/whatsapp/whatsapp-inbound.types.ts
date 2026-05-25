export type WhatsAppInboundEventType = 'MESSAGE' | 'STATUS' | 'UNKNOWN';

export type WhatsAppCommand =
  | 'HI'
  | 'HELP'
  | 'JOIN_QUEUE'
  | 'BOOK_APPOINTMENT'
  | 'CHECK_STATUS'
  | 'CANCEL'
  | 'UNKNOWN';

export interface WhatsAppInboundMessage {
  object: string | null;
  entryId: string | null;
  phoneNumberId: string | null;
  fromPhone: string | null;
  messageId: string | null;
  timestamp: string | null;
  messageType: string | null;
  textBody: string | null;
  buttonReply: string | null;
  listReply: string | null;
  profileName: string | null;
}

export interface WhatsAppStatusEvent {
  object: string | null;
  entryId: string | null;
  phoneNumberId: string | null;
  recipientId: string | null;
  messageId: string | null;
  status: string | null;
  timestamp: string | null;
}

export interface WhatsAppInboundEvent {
  type: WhatsAppInboundEventType;
  message?: WhatsAppInboundMessage;
  status?: WhatsAppStatusEvent;
  rawObject?: string | null;
}

export interface WhatsAppParsedCommand {
  command: WhatsAppCommand;
  confidence: number;
  normalizedText: string;
}

export type WhatsAppLanguage = 'en' | 'si';

export type WhatsAppFlowState =
  | 'IDLE'
  | 'MAIN_MENU'
  | 'WAITING_FOR_LANGUAGE'
  | 'WAITING_FOR_ACTION'
  | 'WAITING_FOR_QUEUE_SERVICE'
  | 'WAITING_FOR_APPOINTMENT_SERVICE'
  | 'WAITING_FOR_APPOINTMENT_TIME'
  | 'WAITING_FOR_CONFIRMATION'
  | 'WAITING_FOR_STATUS_LOOKUP'
  | 'WAITING_FOR_CANCEL_CONFIRMATION';

export interface WhatsAppSessionState {
  phone: string;
  currentIntent?: WhatsAppCommand;
  businessSlug?: string;
  language?: WhatsAppLanguage;
  customerId?: string;
  clientProfileId?: string;
  lastMessageAt: Date;
  step?: WhatsAppFlowState;
  data: Record<string, unknown>;
}

export interface WhatsAppInboundProcessingResult {
  enabled: boolean;
  devMode: boolean;
  received: boolean;
  eventCount: number;
  events: Array<{
    type: WhatsAppInboundEventType;
    command?: WhatsAppCommand;
    confidence?: number;
    replyPreview?: string;
  }>;
}


