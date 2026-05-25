import { BusinessType, LanguageCode, ProfileMode } from '@/types/business-setup';

export const businessTypeOptions: Array<{ label: string; value: BusinessType }> = [
  { label: 'Medical Center', value: 'MEDICAL_CENTER' },
  { label: 'Doctor', value: 'DOCTOR' },
  { label: 'Clinic', value: 'CLINIC' },
  { label: 'Hospital', value: 'HOSPITAL' },
  { label: 'Barber Shop', value: 'BARBER_SHOP' },
  { label: 'Beauty Parlour', value: 'BEAUTY_PARLOUR' },
  { label: 'Salon', value: 'SALON' },
  { label: 'Service Shop', value: 'SERVICE_SHOP' },
  { label: 'Other', value: 'OTHER' }
];

export const languageOptions: Array<{ label: string; value: LanguageCode }> = [
  { label: 'English', value: 'en' },
  { label: 'Sinhala', value: 'si' }
];

export const profileModeOptions: Array<{ label: string; value: ProfileMode }> = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Medical', value: 'MEDICAL' },
  { label: 'Custom', value: 'CUSTOM' }
];
