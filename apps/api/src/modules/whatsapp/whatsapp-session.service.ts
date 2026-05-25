import { Injectable } from '@nestjs/common';
import { WhatsAppSessionState } from './whatsapp-inbound.types';

@Injectable()
export class WhatsAppSessionService {
  private readonly sessions = new Map<string, WhatsAppSessionState>();

  getSession(phone: string): WhatsAppSessionState {
    const existing = this.sessions.get(phone);
    if (existing) return existing;

    const created: WhatsAppSessionState = {
      phone,
      lastMessageAt: new Date(),
      data: {}
    };
    this.sessions.set(phone, created);
    return created;
  }

  getExistingSession(phone: string): WhatsAppSessionState | null {
    return this.sessions.get(phone) ?? null;
  }

  updateSession(phone: string, patch: Partial<Omit<WhatsAppSessionState, 'phone'>>): WhatsAppSessionState {
    const current = this.getSession(phone);
    const updated: WhatsAppSessionState = {
      ...current,
      ...patch,
      phone,
      lastMessageAt: patch.lastMessageAt ?? new Date(),
      data: { ...current.data, ...(patch.data ?? {}) }
    };
    this.sessions.set(phone, updated);
    return updated;
  }

  clearSession(phone: string): void {
    this.sessions.delete(phone);
  }
}
