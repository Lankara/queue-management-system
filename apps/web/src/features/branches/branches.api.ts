import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { Branch } from '@/types/business-setup';

export interface BranchPayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export function listBranches(businessId: string): Promise<Branch[]> {
  return apiGet<Branch[]>(`/businesses/${businessId}/branches`);
}

export function createBranch(businessId: string, data: BranchPayload): Promise<Branch> {
  return apiPost<Branch, BranchPayload>(`/businesses/${businessId}/branches`, data);
}

export function updateBranch(businessId: string, id: string, data: Partial<BranchPayload>): Promise<Branch> {
  return apiPatch<Branch, Partial<BranchPayload>>(`/businesses/${businessId}/branches/${id}`, data);
}
