import { LanguageCode } from './business-setup';
import { GenderCode } from './customer-profile';
import { QueueEntry, QueuePosition } from './queue';

export interface PublicBranchSummary {
  id: string;
  name: string;
  code: string;
}

export interface PublicServiceSummary {
  id: string;
  name: string;
  code: string;
  durationMinutes: number;
  branchId?: string | null;
}

export interface PublicBusiness {
  id: string;
  slug: string;
  name: string;
  defaultLanguage: LanguageCode;
  branches: PublicBranchSummary[];
  services: PublicServiceSummary[];
}

export interface PublicCustomer {
  id: string;
  primaryPhone: string;
  preferredLanguage: LanguageCode;
  isOnlineBookingBanned: boolean;
  noShowCount: number;
  banReason: string | null;
}

export interface PublicClientProfile {
  id: string;
  customerId: string;
  fullName: string;
  relationshipToContact: string | null;
  gender: GenderCode;
  ageYears: number | null;
}

export interface PublicQueueSession {
  language: LanguageCode;
  business: PublicBusiness | null;
  customer: PublicCustomer | null;
  clientProfile: PublicClientProfile | null;
  queueEntry: QueueEntry | null;
  selectedBranchId: string | null;
  selectedServiceId: string | null;
}

export interface PublicClientProfilePayload {
  fullName: string;
  relationshipToContact?: string;
  gender?: GenderCode;
  ageYears?: number;
}

export interface PublicQueueStatus extends QueuePosition {
  queueEntryId: string;
  queueNumber: string;
}
