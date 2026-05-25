import { PublicBusiness } from '@/types/public-queue';

const publicBusinessMap: Record<string, PublicBusiness> = {
  'city-care-medical': {
    id: '00000000-0000-0000-0000-000000000101',
    slug: 'city-care-medical',
    name: 'City Care Medical Center',
    defaultLanguage: 'en',
    branches: [{ id: '00000000-0000-0000-0000-000000000102', name: 'Main Branch', code: 'MAIN' }],
    services: [{ id: '00000000-0000-0000-0000-000000000103', name: 'General Practice', code: 'GP', durationMinutes: 15 }]
  }
};

export function resolvePublicBusiness(businessSlug: string): PublicBusiness | null {
  return publicBusinessMap[businessSlug] ?? null;
}
