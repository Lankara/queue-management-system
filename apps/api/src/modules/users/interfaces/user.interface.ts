export type UserPreferredLanguage = 'en' | 'si';

export interface User {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  preferredLanguage: UserPreferredLanguage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}