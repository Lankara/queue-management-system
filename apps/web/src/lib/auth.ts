import { apiPost } from './api-client';
import { LoginResponse } from '@/types/auth';
import { BusinessType, LanguageCode } from '@/types/business-setup';

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface OwnerBusinessRegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  preferredLanguage: LanguageCode;
  businessName: string;
  businessType: BusinessType;
  defaultLanguage?: LanguageCode;
  timezone?: string;
  businessPhone?: string;
  businessEmail?: string;
  address?: string;
  branchName?: string;
  branchCode?: string;
  serviceName?: string;
  serviceCode?: string;
  durationMinutes?: number;
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiPost<LoginResponse, LoginInput>('/auth/login', input);
}

export function registerOwnerBusiness(input: OwnerBusinessRegistrationPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse, OwnerBusinessRegistrationPayload>('/auth/register-owner-business', input);
}
