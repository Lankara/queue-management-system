export interface PublicDirectoryBusiness {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  address: string | null;
  phone: string | null;
  branchId: string | null;
  branchName: string | null;
  branchCode: string | null;
  locationLabel: string;
  services: string[];
}
