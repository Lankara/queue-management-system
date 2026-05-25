export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s().-]/g, '');
}

export function isLikelyPhone(phone: string): boolean {
  return /^\+?[0-9]{7,15}$/.test(normalizePhone(phone));
}
