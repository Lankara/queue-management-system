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
  createdAt: Date;
  updatedAt: Date | null;
}