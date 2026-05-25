import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { Queue, QueueEntry, QueuePosition } from '@/types/queue';

export interface TodayQueuesFilters {
  branchId?: string;
  serviceId?: string;
}

export interface QueueJoinPayload {
  branchId?: string;
  serviceId?: string;
  customerId: string;
  clientProfileId: string;
  source: 'OPERATOR';
}

export function listTodayQueues(businessId: string, filters: TodayQueuesFilters = {}): Promise<Queue[]> {
  const params = new URLSearchParams();
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (filters.serviceId) params.set('serviceId', filters.serviceId);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiGet<Queue[]>(`/businesses/${businessId}/queues/today${suffix}`);
}

export function listQueueEntries(businessId: string, queueId: string): Promise<QueueEntry[]> {
  return apiGet<QueueEntry[]>(`/businesses/${businessId}/queues/${queueId}/entries`);
}

export function joinQueueDraft(businessId: string, data: QueueJoinPayload): Promise<QueueEntry> {
  return apiPost<QueueEntry, QueueJoinPayload>(`/businesses/${businessId}/queues/join-draft`, data);
}

export function confirmQueueEntry(businessId: string, entryId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, Record<string, never>>(`/businesses/${businessId}/queue-entries/${entryId}/confirm`, {});
}

export function rejectQueueEntry(businessId: string, entryId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, { reason?: string }>(`/businesses/${businessId}/queue-entries/${entryId}/reject`, {});
}

export function callNextQueueEntry(businessId: string, queueId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, Record<string, never>>(`/businesses/${businessId}/queues/${queueId}/call-next`, {});
}

export function startQueueEntryService(businessId: string, entryId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, Record<string, never>>(`/businesses/${businessId}/queue-entries/${entryId}/start-service`, {});
}

export function completeQueueEntry(businessId: string, entryId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, Record<string, never>>(`/businesses/${businessId}/queue-entries/${entryId}/complete`, {});
}

export function markQueueEntryNoShow(businessId: string, entryId: string): Promise<QueueEntry> {
  return apiPatch<QueueEntry, Record<string, never>>(`/businesses/${businessId}/queue-entries/${entryId}/no-show`, {});
}

export function getQueuePosition(businessId: string, entryId: string): Promise<QueuePosition> {
  return apiGet<QueuePosition>(`/businesses/${businessId}/queue-entries/${entryId}/position`);
}
