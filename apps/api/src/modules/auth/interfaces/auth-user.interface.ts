export interface AuthBusinessRole {
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
  createdAt: Date;
  updatedAt: Date | null;
}

export interface AuthenticatedUser extends AuthUser {
  roles: string[];
  businessIds: string[];
  businesses: AuthBusinessRole[];
}


