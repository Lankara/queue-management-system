export type CustomerPreferredLanguage = 'en' | 'si';

export interface Customer {
  id: string;
  businessId: string;
  primaryPhone: string;
  preferredLanguage: CustomerPreferredLanguage;
  isOnlineBookingBanned: boolean;
  noShowCount: number;
  banReason: string | null;
  bannedAt: Date | null;
  banResetAt: Date | null;
  banResetBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}