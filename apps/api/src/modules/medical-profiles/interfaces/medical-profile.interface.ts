export interface MedicalProfile {
  id: string;
  businessId: string;
  customerId: string;
  clientProfileId: string;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  currentSymptoms: string | null;
  previousVisitNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}