import { apiDelete, apiGet, apiPost } from '@/lib/api-client';
import { WhatsAppSessionState, WhatsAppSimulatorResponse, WhatsAppSupportedCommands } from '@/types/whatsapp';

export function simulateWhatsAppMessage(data: { phone: string; text: string; profileName?: string }): Promise<WhatsAppSimulatorResponse> {
  return apiPost<WhatsAppSimulatorResponse, { phone: string; text: string; profileName?: string }>('/whatsapp/simulator/simulate-message', data);
}

export function getWhatsAppSession(phone: string): Promise<{ session: WhatsAppSessionState | null }> {
  return apiGet<{ session: WhatsAppSessionState | null }>(`/whatsapp/simulator/session/${encodeURIComponent(phone)}`);
}

export function clearWhatsAppSession(phone: string): Promise<{ cleared: boolean }> {
  return apiDelete<{ cleared: boolean }>(`/whatsapp/simulator/session/${encodeURIComponent(phone)}`);
}

export function getSupportedCommands(): Promise<WhatsAppSupportedCommands> {
  return apiGet<WhatsAppSupportedCommands>('/whatsapp/simulator/supported-commands');
}
