import { apiGet, apiPost } from '@/lib/api-client';
import { DelayOperationResult, QueueDelayEvent } from '@/types/delay';

export interface DelayFilters {
  branchId?: string;
  serviceId?: string;
  from?: string;
  to?: string;
}

export interface CreateDelayPayload {
  branchId?: string;
  serviceId: string;
  delayMinutes: number;
  affectedFromTime: string;
  reason?: string;
  createdBy?: string;
}

function withQuery(base: string, filters: DelayFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString() ? `${base}?${params.toString()}` : base;
}

export function listDelays(businessId: string, filters: DelayFilters = {}): Promise<QueueDelayEvent[]> {
  return apiGet<QueueDelayEvent[]>(withQuery(`/businesses/${businessId}/delays`, filters));
}

export function getDelay(businessId: string, id: string): Promise<QueueDelayEvent> {
  return apiGet<QueueDelayEvent>(`/businesses/${businessId}/delays/${id}`);
}

export function createDelay(businessId: string, data: CreateDelayPayload): Promise<DelayOperationResult> {
  return apiPost<DelayOperationResult, CreateDelayPayload>(`/businesses/${businessId}/delays`, data);
}
