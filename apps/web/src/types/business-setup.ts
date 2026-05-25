export type BusinessType =
  | 'MEDICAL_CENTER'
  | 'DOCTOR'
  | 'CLINIC'
  | 'HOSPITAL'
  | 'BARBER_SHOP'
  | 'BEAUTY_PARLOUR'
  | 'SALON'
  | 'SERVICE_SHOP'
  | 'OTHER';

export type LanguageCode = 'en' | 'si';
export type ProfileMode = 'BASIC' | 'MEDICAL' | 'CUSTOM';

export interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  defaultLanguage: LanguageCode;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface Service {
  id: string;
  businessId: string;
  branchId: string | null;
  name: string;
  code: string;
  description: string | null;
  durationMinutes: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface BusinessProfileSettings {
  id: string;
  businessId: string;
  profileMode: ProfileMode;
  requireCustomerName: boolean;
  requireAge: boolean;
  requireGender: boolean;
  requireAddress: boolean;
  requireMedicalHistory: boolean;
  requireCurrentSymptoms: boolean;
  allowLinkedClients: boolean;
  allowOnlineBooking: boolean;
  noShowBanLimit: number;
  queueNumberLength: number;
  createdAt: string;
  updatedAt: string | null;
}
