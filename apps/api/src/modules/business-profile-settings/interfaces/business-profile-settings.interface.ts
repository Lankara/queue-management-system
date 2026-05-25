export type ProfileMode = 'BASIC' | 'MEDICAL' | 'CUSTOM';

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
  createdAt: Date;
  updatedAt: Date | null;
}