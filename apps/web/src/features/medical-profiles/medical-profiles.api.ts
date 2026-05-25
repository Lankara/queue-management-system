import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { MedicalProfile } from '@/types/customer-profile';

export interface MedicalProfilePayload {
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  currentSymptoms?: string;
  previousVisitNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export function getMedicalProfile(businessId: string, clientProfileId: string): Promise<MedicalProfile> {
  return apiGet<MedicalProfile>(`/businesses/${businessId}/client-profiles/${clientProfileId}/medical-profile`);
}

export function createMedicalProfile(businessId: string, clientProfileId: string, data: MedicalProfilePayload): Promise<MedicalProfile> {
  return apiPost<MedicalProfile, MedicalProfilePayload>(`/businesses/${businessId}/client-profiles/${clientProfileId}/medical-profile`, data);
}

export function updateMedicalProfile(businessId: string, clientProfileId: string, data: MedicalProfilePayload): Promise<MedicalProfile> {
  return apiPatch<MedicalProfile, MedicalProfilePayload>(`/businesses/${businessId}/client-profiles/${clientProfileId}/medical-profile`, data);
}
