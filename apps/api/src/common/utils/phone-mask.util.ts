export function maskPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length < 7) {
    return value;
  }

  const prefixLength = value.trim().startsWith('+') ? 5 : 4;
  const suffixLength = 3;
  const visiblePrefix = value.slice(0, Math.min(prefixLength, value.length));
  const visibleSuffix = value.slice(Math.max(value.length - suffixLength, 0));

  return `${visiblePrefix}****${visibleSuffix}`;
}

export function maskPhoneNumbersInText(value: string): string {
  return value.replace(/\+?\d[\d\s().-]{6,}\d/g, (match) => maskPhoneNumber(match));
}
