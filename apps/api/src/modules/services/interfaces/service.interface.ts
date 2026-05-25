export interface BusinessServiceItem {
  id: string;
  businessId: string;
  branchId: string | null;
  name: string;
  code: string;
  description: string | null;
  durationMinutes: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}