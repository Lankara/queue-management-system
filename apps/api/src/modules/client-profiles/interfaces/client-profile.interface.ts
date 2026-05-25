export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';

export interface ClientProfile {
  id: string;
  businessId: string;
  customerId: string;
  fullName: string;
  relationshipToContact: string | null;
  gender: GenderCode;
  dateOfBirth: string | null;
  ageYears: number | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}