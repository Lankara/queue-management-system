export function createSlugBase(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18)
    .replace(/-+$/g, '');

  return normalized || 'business';
}

export function createSlugCandidate(base: string, suffix: string): string {
  return `${createSlugBase(base)}-${suffix.toLowerCase()}`;
}
