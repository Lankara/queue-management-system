import { LanguageCode } from './business-setup';

export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';

export interface Customer {
  id: string;
  businessId: string;
  primaryPhone: string;
  preferredLanguage: LanguageCode;
  isOnlineBookingBanned: boolean;
  noShowCount: number;
  banReason: string | null;
  bannedAt: string | null;
  banResetAt: string | null;
  banResetBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ClientProfile {
  id: string;
  businessId: string;
  customerId: string;
  fullName: string;
  relationshipToContact: string | null;
  gender: GenderCode;
  dateOfBirth: string | null;
  ageYears: number | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface MedicalProfile {
  id: string;
  businessId: string;
  customerId: string;
  clientProfileId: string;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  currentSymptoms: string | null;
  previousVisitNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string | null;
}
