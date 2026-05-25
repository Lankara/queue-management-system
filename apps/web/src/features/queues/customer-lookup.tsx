'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/ui/state';
import { listClientProfiles } from '@/features/client-profiles/client-profiles.api';
import { listCustomers } from '@/features/customers/customers.api';
import { ClientProfile, Customer } from '@/types/customer-profile';

export function CustomerLookup({
  businessId,
  selectedCustomer,
  selectedProfile,
  onCustomerSelect,
  onProfileSelect
}: {
  businessId: string;
  selectedCustomer: Customer | null;
  selectedProfile: ClientProfile | null;
  onCustomerSelect: (customer: Customer) => void;
  onProfileSelect: (profile: ClientProfile) => void;
}) {
  const [search, setSearch] = useState('');
  const customersQuery = useQuery({ queryKey: ['customers', businessId], queryFn: () => listCustomers(businessId) });
  const profilesQuery = useQuery({ queryKey: ['client-profiles', businessId, selectedCustomer?.id], queryFn: () => listClientProfiles(businessId, selectedCustomer?.id as string), enabled: Boolean(selectedCustomer?.id) });
  const customers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customersQuery.data ?? [];
    return (customersQuery.data ?? []).filter((customer) => customer.primaryPhone.toLowerCase().includes(query));
  }, [customersQuery.data, search]);

  return (
    <div className="grid gap-4">
      <SearchInput placeholder="Search customer phone" value={search} onChange={(event) => setSearch(event.target.value)} />
      {customersQuery.isLoading ? <LoadingState message="Loading customers..." /> : null}
      <div className="grid max-h-52 gap-2 overflow-auto">
        {customers.map((customer) => (
          <button key={customer.id} className={`rounded-md border p-2 text-left text-sm ${selectedCustomer?.id === customer.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'}`} onClick={() => onCustomerSelect(customer)} type="button">
            <div className="flex items-center justify-between gap-2"><span className="font-medium">{customer.primaryPhone}</span>{customer.isOnlineBookingBanned ? <Badge tone="red">Banned</Badge> : null}</div>
            <span className="text-xs text-slate-500">No-shows: {customer.noShowCount}</span>
          </button>
        ))}
      </div>
      {selectedCustomer ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-slate-800">Client profile</p>
          {profilesQuery.isLoading ? <LoadingState message="Loading profiles..." /> : null}
          {profilesQuery.data?.length === 0 ? <EmptyState title="No client profiles" /> : null}
          {profilesQuery.data?.map((profile) => (
            <button key={profile.id} className={`rounded-md border p-2 text-left text-sm ${selectedProfile?.id === profile.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'}`} onClick={() => onProfileSelect(profile)} type="button">
              <span className="font-medium">{profile.fullName}</span>
              <span className="ml-2 text-xs text-slate-500">{profile.gender}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
