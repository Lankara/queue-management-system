import { randomUUID } from 'crypto';

export function generateRequestId(): string {
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}