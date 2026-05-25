import { LoginResponse } from '@/types/auth';

interface ReplaceRouter {
  replace: (path: string) => void;
}

export function routeAfterAuth(data: LoginResponse, router: ReplaceRouter, setSelectedBusiness: (businessId: string, businessName?: string | null, businessType?: string | null, role?: string | null) => void) {
  const activeBusinesses = data.businesses.filter((business) => business.isActive !== false);

  if (activeBusinesses.length === 1) {
    const business = activeBusinesses[0];
    setSelectedBusiness(business.businessId, business.businessName, business.businessType ?? null, business.role);
    router.replace('/dashboard');
    return;
  }

  router.replace('/select-business');
}