export interface WhatsAppCloudTextRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url: boolean;
    body: string;
  };
}

export interface WhatsAppCloudResponse {
  messaging_product?: string;
  contacts?: Array<{ input?: string; wa_id?: string }>;
  messages?: Array<{ id?: string }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface WhatsAppProviderConfig {
  provider: string;
  enabled: boolean;
  devMode: boolean;
  phoneNumberId?: string;
  accessToken?: string;
  apiVersion: string;
  graphBaseUrl: string;
  defaultCountryCode: string;
}
