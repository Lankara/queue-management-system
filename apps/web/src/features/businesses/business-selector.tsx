'use client';

import { useQueries } from '@tanstack/react-query';
import { Select } from '@/components/ui/select';
import { getBusiness } from './businesses.api';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';

export function BusinessSelector() {
  const user = useAuthStore((state) => state.user);
  const selectedBusinessId = useBusinessStore((state) => state.selectedBusinessId);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const businessIds = user?.businessIds ?? [];
  const queries = useQueries({
    queries: businessIds.map((businessId) => ({
      queryKey: ['businesses', businessId],
      queryFn: () => getBusiness(businessId),
      enabled: Boolean(businessId)
    }))
  });
  const businesses = queries.map((query) => query.data).filter(Boolean);

  if (businessIds.length === 0) {
    return null;
  }

  return (
    <Select
      label="Selected business"
      value={selectedBusinessId ?? ''}
      placeholder="Select a business"
      options={businesses.map((business) => ({ label: business?.name ?? '', value: business?.id ?? '' }))}
      onChange={(event) => {
        const business = businesses.find((item) => item?.id === event.target.value);
        if (business) {
          setSelectedBusiness(business.id, business.name, business.businessType, user?.businesses.find((item) => item.businessId === business.id)?.role ?? null);
        }
      }}
    />
  );
}

