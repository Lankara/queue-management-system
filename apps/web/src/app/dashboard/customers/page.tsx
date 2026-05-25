'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { RotateCcw, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { SectionCard } from '@/components/section-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { WarningBanner } from '@/components/warning-banner';
import { getBusinessProfileSettings } from '@/features/business-profile-settings/business-profile-settings.api';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { ClientProfileForm, ClientProfileFormValues } from '@/features/client-profiles/client-profile-form';
import { createClientProfile, listClientProfiles, updateClientProfile } from '@/features/client-profiles/client-profiles.api';
import { CustomerForm, CustomerFormValues } from '@/features/customers/customer-form';
import { createCustomer, listCustomers, resetCustomerBan, updateCustomer } from '@/features/customers/customers.api';
import { MedicalProfileForm, MedicalProfileFormValues } from '@/features/medical-profiles/medical-profile-form';
import { createMedicalProfile, getMedicalProfile, updateMedicalProfile } from '@/features/medical-profiles/medical-profiles.api';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';
import { ClientProfile, Customer } from '@/types/customer-profile';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const customersQuery = useQuery({ queryKey: ['customers', businessId], queryFn: () => listCustomers(businessId as string), enabled: Boolean(businessId) });
  const settingsQuery = useQuery({ queryKey: ['business-profile-settings', businessId], queryFn: () => getBusinessProfileSettings(businessId as string), enabled: Boolean(businessId) });
  const clientProfilesQuery = useQuery({ queryKey: ['client-profiles', businessId, selectedCustomer?.id], queryFn: () => listClientProfiles(businessId as string, selectedCustomer?.id as string), enabled: Boolean(businessId && selectedCustomer?.id) });
  const medicalProfileQuery = useQuery({ queryKey: ['medical-profile', businessId, selectedProfile?.id], queryFn: () => getMedicalProfile(businessId as string, selectedProfile?.id as string), enabled: Boolean(businessId && selectedProfile?.id), retry: false });
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const customers = customersQuery.data ?? [];
    if (!query) return customers;
    return customers.filter((customer) => customer.primaryPhone.toLowerCase().includes(query));
  }, [customersQuery.data, search]);
  const profileMode = settingsQuery.data?.profileMode ?? 'BASIC';
  const showMedicalProminent = profileMode === 'MEDICAL' || profileMode === 'CUSTOM';

  const customerMutation = useMutation({
    mutationFn: (values: CustomerFormValues) => editingCustomer ? updateCustomer(businessId as string, editingCustomer.id, { preferredLanguage: values.preferredLanguage }) : createCustomer(businessId as string, values),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] });
      setSelectedCustomer(customer);
      setEditingCustomer(customer);
      setMessage('Customer saved.');
    }
  });
  const resetBanMutation = useMutation({
    mutationFn: () => resetCustomerBan(businessId as string, selectedCustomer?.id as string, { resetBy: user?.id }),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] });
      setSelectedCustomer(customer);
      setMessage('Online booking ban reset.');
    }
  });
  const profileMutation = useMutation({
    mutationFn: (values: ClientProfileFormValues) => editingProfile ? updateClientProfile(businessId as string, editingProfile.id, values) : createClientProfile(businessId as string, selectedCustomer?.id as string, values),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['client-profiles', businessId, selectedCustomer?.id] });
      setSelectedProfile(profile);
      setEditingProfile(profile);
      setMessage('Client profile saved.');
    }
  });
  const medicalMutation = useMutation({
    mutationFn: (values: MedicalProfileFormValues) => medicalProfileQuery.data ? updateMedicalProfile(businessId as string, selectedProfile?.id as string, values) : createMedicalProfile(businessId as string, selectedProfile?.id as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-profile', businessId, selectedProfile?.id] });
      setMessage('Medical profile saved.');
    }
  });

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Customers" description="Manage customer contacts, linked client profiles, and medical details." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Customers" description="Manage contacts, linked client profiles, medical details, and online booking bans." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[customersQuery.error, customerMutation.error, resetBanMutation.error, profileMutation.error, medicalMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Customer search" description="Search by phone or partial phone.">
          <div className="grid gap-4">
            <SearchInput placeholder="Search phone number" value={search} onChange={(event) => setSearch(event.target.value)} />
            {customersQuery.isLoading ? <LoadingState message="Loading customers..." /> : null}
            {!customersQuery.isLoading && filteredCustomers.length === 0 ? <EmptyState title="No customers found" /> : null}
            <div className="grid gap-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  className={`rounded-md border p-3 text-left transition ${selectedCustomer?.id === customer.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  onClick={() => { setSelectedCustomer(customer); setEditingCustomer(customer); setSelectedProfile(null); setEditingProfile(null); }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-950">{customer.primaryPhone}</span>{customer.isOnlineBookingBanned ? <Badge tone="red">Banned</Badge> : <Badge tone="green">Allowed</Badge>}</div>
                  <p className="mt-1 text-xs text-slate-500">Language: {customer.preferredLanguage} · No-shows: {customer.noShowCount}</p>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title={editingCustomer ? 'Customer details' : 'Create customer'} description="Phone number is the primary customer identity inside a business.">
            <CustomerForm customer={editingCustomer} isSubmitting={customerMutation.isPending} onSubmit={(values) => customerMutation.mutate(values)} />
            {selectedCustomer ? (
              <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge active={!selectedCustomer.isOnlineBookingBanned} activeLabel="Online booking allowed" inactiveLabel="Online booking banned" />
                  <Badge tone="slate">No-shows: {selectedCustomer.noShowCount}</Badge>
                </div>
                {selectedCustomer.isOnlineBookingBanned ? <WarningBanner><p className="font-medium">This customer is banned from online booking.</p><p>{selectedCustomer.banReason ?? 'No ban reason recorded.'}</p><Button className="mt-3" variant="secondary" isLoading={resetBanMutation.isPending} onClick={() => resetBanMutation.mutate()}><RotateCcw className="h-4 w-4" />Reset ban</Button></WarningBanner> : null}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Linked client profiles" description="One phone number can manage multiple clients or patients.">
            {!selectedCustomer ? <EmptyState title="Select a customer first" /> : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="grid gap-2">
                  {clientProfilesQuery.isLoading ? <LoadingState message="Loading client profiles..." /> : null}
                  {clientProfilesQuery.data?.length === 0 ? <EmptyState title="No linked profiles yet" /> : null}
                  {clientProfilesQuery.data?.map((profile) => (
                    <button key={profile.id} type="button" className={`rounded-md border p-3 text-left transition ${selectedProfile?.id === profile.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`} onClick={() => { setSelectedProfile(profile); setEditingProfile(profile); }}>
                      <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-teal-700" /><span className="font-medium">{profile.fullName}</span><Badge>{profile.gender}</Badge></div>
                      <dl className="mt-3 grid grid-cols-2 gap-3"><InfoRow label="Relationship" value={profile.relationshipToContact} /><InfoRow label="Age" value={profile.ageYears} /></dl>
                    </button>
                  ))}
                </div>
                <ClientProfileForm profile={editingProfile} isSubmitting={profileMutation.isPending} onSubmit={(values) => profileMutation.mutate(values)} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Medical profile" description={profileMode === 'BASIC' ? 'Optional for this business profile mode.' : 'Medical details are prominent for this business profile mode.'}>
            {!selectedProfile ? <EmptyState title="Select a client profile first" /> : (
              <div className={showMedicalProminent ? 'grid gap-4' : 'grid gap-4 opacity-90'}>
                <div className="flex flex-wrap gap-2"><Badge tone={showMedicalProminent ? 'teal' : 'slate'}>Profile mode: {profileMode}</Badge>{settingsQuery.data?.requireMedicalHistory ? <Badge tone="teal">Medical history required</Badge> : null}{settingsQuery.data?.requireCurrentSymptoms ? <Badge tone="teal">Symptoms required</Badge> : null}</div>
                {medicalProfileQuery.isLoading ? <LoadingState message="Loading medical profile..." /> : null}
                {medicalProfileQuery.error && !medicalProfileQuery.isLoading ? <EmptyState title="No medical profile yet" description="Create one when medical details are needed." /> : null}
                {!medicalProfileQuery.isLoading ? <MedicalProfileForm profile={medicalProfileQuery.data ?? null} isSubmitting={medicalMutation.isPending} onSubmit={(values) => medicalMutation.mutate(values)} /> : null}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
