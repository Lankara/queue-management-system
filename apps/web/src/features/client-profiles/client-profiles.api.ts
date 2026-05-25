import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { ClientProfile, GenderCode } from '@/types/customer-profile';

export interface ClientProfilePayload {
  fullName: string;
  relationshipToContact?: string;
  gender?: GenderCode;
  dateOfBirth?: string;
  ageYears?: number;
  address?: string;
  notes?: string;
}

export function listClientProfiles(businessId: string, customerId: string): Promise<ClientProfile[]> {
  return apiGet<ClientProfile[]>(`/businesses/${businessId}/customers/${customerId}/client-profiles`);
}

export function createClientProfile(businessId: string, customerId: string, data: ClientProfilePayload): Promise<ClientProfile> {
  return apiPost<ClientProfile, ClientProfilePayload>(`/businesses/${businessId}/customers/${customerId}/client-profiles`, data);
}

export function updateClientProfile(businessId: string, id: string, data: Partial<ClientProfilePayload>): Promise<ClientProfile> {
  return apiPatch<ClientProfile, Partial<ClientProfilePayload>>(`/businesses/${businessId}/client-profiles/${id}`, data);
}
