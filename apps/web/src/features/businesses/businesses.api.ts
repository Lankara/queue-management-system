import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { Business, BusinessType, LanguageCode } from '@/types/business-setup';

export interface BusinessPayload {
  name: string;
  slug: string;
  businessType: BusinessType;
  defaultLanguage?: LanguageCode;
  timezone?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export function listBusinesses(): Promise<Business[]> {
  return apiGet<Business[]>('/businesses');
}

export function getBusiness(id: string): Promise<Business> {
  return apiGet<Business>(`/businesses/${id}`);
}

export function createBusiness(data: BusinessPayload): Promise<Business> {
  return apiPost<Business, BusinessPayload>('/businesses', data);
}

export function updateBusiness(id: string, data: Partial<BusinessPayload>): Promise<Business> {
  return apiPatch<Business, Partial<BusinessPayload>>(`/businesses/${id}`, data);
}
