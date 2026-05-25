export function toIsoString(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  return date.toISOString();
}

export function addMinutes(date: Date | string | number, minutes: number): Date {
  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    throw new Error('Invalid date value');
  }

  return new Date(value.getTime() + minutes * 60_000);
}

export function getTodayDateString(timezone?: string): string {
  if (!timezone) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}
