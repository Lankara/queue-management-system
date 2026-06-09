import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { Service } from '@/types/business-setup';

export interface ServicePayload {
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  durationMinutes?: number;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export function listServices(businessId: string): Promise<Service[]> {
  return apiGet<Service[]>(`/businesses/${businessId}/services`);
}

export function createService(businessId: string, data: ServicePayload): Promise<Service> {
  return apiPost<Service, ServicePayload>(`/businesses/${businessId}/services`, data);
}

export function updateService(businessId: string, id: string, data: Partial<ServicePayload>): Promise<Service> {
  return apiPatch<Service, Partial<ServicePayload>>(`/businesses/${businessId}/services/${id}`, data);
}

export function deleteService(businessId: string, id: string): Promise<{ deleted: true }> {
  return apiDelete<{ deleted: true }>(`/businesses/${businessId}/services/${id}`);
}