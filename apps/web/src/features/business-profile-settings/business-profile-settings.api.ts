import { apiGet, apiPatch } from '@/lib/api-client';
import { BusinessProfileSettings, ProfileMode } from '@/types/business-setup';

export interface BusinessProfileSettingsPayload {
  profileMode?: ProfileMode;
  requireCustomerName?: boolean;
  requireAge?: boolean;
  requireGender?: boolean;
  requireAddress?: boolean;
  requireMedicalHistory?: boolean;
  requireCurrentSymptoms?: boolean;
  allowLinkedClients?: boolean;
  allowOnlineBooking?: boolean;
  noShowBanLimit?: number;
  queueNumberLength?: number;
}

export function getBusinessProfileSettings(businessId: string): Promise<BusinessProfileSettings> {
  return apiGet<BusinessProfileSettings>(`/businesses/${businessId}/profile-settings`);
}

export function updateBusinessProfileSettings(businessId: string, data: BusinessProfileSettingsPayload): Promise<BusinessProfileSettings> {
  return apiPatch<BusinessProfileSettings, BusinessProfileSettingsPayload>(`/businesses/${businessId}/profile-settings`, data);
}
