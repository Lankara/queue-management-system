export interface BusinessRole {
  businessId: string;
  businessName: string | null;
  businessType?: string | null;
  isActive?: boolean;
  role: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  preferredLanguage: 'en' | 'si';
  isActive: boolean;
  roles: string[];
  businessIds: string[];
  businesses: BusinessRole[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  businesses: BusinessRole[];
}
