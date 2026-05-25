import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { LanguageCode } from '@/types/business-setup';
import { Customer } from '@/types/customer-profile';

export interface CustomerPayload {
  primaryPhone: string;
  preferredLanguage?: LanguageCode;
}

export interface UpdateCustomerPayload {
  preferredLanguage?: LanguageCode;
  isOnlineBookingBanned?: boolean;
  banReason?: string;
}

export interface BanResetPayload {
  resetBy?: string;
  resetNote?: string;
}

export function listCustomers(businessId: string): Promise<Customer[]> {
  return apiGet<Customer[]>(`/businesses/${businessId}/customers`);
}

export function findCustomerByPhone(businessId: string, phone: string): Promise<Customer> {
  return apiGet<Customer>(`/businesses/${businessId}/customers/by-phone/${encodeURIComponent(phone)}`);
}

export function createCustomer(businessId: string, data: CustomerPayload): Promise<Customer> {
  return apiPost<Customer, CustomerPayload>(`/businesses/${businessId}/customers`, data);
}

export function updateCustomer(businessId: string, id: string, data: UpdateCustomerPayload): Promise<Customer> {
  return apiPatch<Customer, UpdateCustomerPayload>(`/businesses/${businessId}/customers/${id}`, data);
}

export function resetCustomerBan(businessId: string, id: string, data: BanResetPayload): Promise<Customer> {
  return apiPatch<Customer, BanResetPayload>(`/businesses/${businessId}/customers/${id}/ban-reset`, data);
}
