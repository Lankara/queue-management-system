import { publicGet, publicPatch, publicPost } from '@/lib/public-api-client';
import { LanguageCode } from '@/types/business-setup';
import { GenderCode } from '@/types/customer-profile';
import { PublicBusiness, PublicClientProfile, PublicCustomer } from '@/types/public-queue';
import { QueueEntry, QueuePosition } from '@/types/queue';

export function getPublicBusiness(businessSlug: string): Promise<PublicBusiness> {
  return publicGet<PublicBusiness>(`/public/businesses/${encodeURIComponent(businessSlug)}`);
}

export function findPublicCustomerByPhone(businessSlug: string, phone: string): Promise<PublicCustomer> {
  return publicGet<PublicCustomer>(`/public/businesses/${encodeURIComponent(businessSlug)}/customers/by-phone/${encodeURIComponent(phone)}`);
}

export function createPublicCustomer(businessSlug: string, data: { primaryPhone: string; preferredLanguage: LanguageCode }): Promise<PublicCustomer> {
  return publicPost<PublicCustomer, { primaryPhone: string; preferredLanguage: LanguageCode }>(`/public/businesses/${encodeURIComponent(businessSlug)}/customers`, data);
}

export function listPublicClientProfiles(businessSlug: string, customerId: string): Promise<PublicClientProfile[]> {
  return publicGet<PublicClientProfile[]>(`/public/businesses/${encodeURIComponent(businessSlug)}/customers/${customerId}/client-profiles`);
}

export function createPublicClientProfile(
  businessSlug: string,
  customerId: string,
  data: { fullName: string; relationshipToContact?: string; gender?: GenderCode; ageYears?: number }
): Promise<PublicClientProfile> {
  return publicPost<PublicClientProfile, typeof data>(`/public/businesses/${encodeURIComponent(businessSlug)}/customers/${customerId}/client-profiles`, data);
}

export function joinPublicQueueDraft(
  businessSlug: string,
  data: { branchId?: string; serviceId?: string; customerId: string; clientProfileId: string; source: 'QR' | 'WEB' }
): Promise<QueueEntry> {
  return publicPost<QueueEntry, typeof data>(`/public/businesses/${encodeURIComponent(businessSlug)}/queues/join-draft`, data);
}

export function confirmPublicQueueEntry(businessSlug: string, entryId: string): Promise<QueueEntry> {
  return publicPatch<QueueEntry, Record<string, never>>(`/public/businesses/${encodeURIComponent(businessSlug)}/queue-entries/${entryId}/confirm`, {});
}

export function rejectPublicQueueEntry(businessSlug: string, entryId: string): Promise<QueueEntry> {
  return publicPatch<QueueEntry, { reason?: string }>(`/public/businesses/${encodeURIComponent(businessSlug)}/queue-entries/${entryId}/reject`, {});
}

export function getPublicQueuePosition(
  businessSlug: string,
  entryId: string,
  options: { logNotification?: boolean } = {}
): Promise<QueuePosition> {
  const params = new URLSearchParams({ _: String(Date.now()) });
  if (options.logNotification) params.set('logNotification', 'true');
  return publicGet<QueuePosition>(`/public/businesses/${encodeURIComponent(businessSlug)}/queue-entries/${entryId}/position?${params.toString()}`);
}
