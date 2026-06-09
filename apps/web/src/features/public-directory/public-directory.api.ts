import { publicGet } from '@/lib/public-api-client';
import { PublicDirectoryBusiness } from '@/types/public-directory';

export function searchPublicBusinesses(filters: { query?: string; businessType?: string }): Promise<PublicDirectoryBusiness[]> {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.businessType && filters.businessType !== 'ALL') params.set('businessType', filters.businessType);
  const queryString = params.toString();
  return publicGet<PublicDirectoryBusiness[]>(`/public/directory/businesses${queryString ? `?${queryString}` : ''}`);
}
