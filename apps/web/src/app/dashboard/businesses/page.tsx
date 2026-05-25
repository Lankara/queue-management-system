'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Building2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';
import { Business } from '@/types/business-setup';
import { BusinessForm, BusinessFormValues } from '@/features/businesses/business-form';
import { createBusiness, getBusiness, listBusinesses, updateBusiness } from '@/features/businesses/businesses.api';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function BusinessesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const selectedBusinessId = useBusinessStore((state) => state.selectedBusinessId);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canListAll = user?.roles.includes('SUPER_ADMIN');
  const linkedIds = user?.businessIds ?? [];
  const allBusinessesQuery = useQuery({ queryKey: ['businesses'], queryFn: listBusinesses, enabled: Boolean(canListAll) });
  const linkedBusinessQueries = useQueries({ queries: linkedIds.map((id) => ({ queryKey: ['businesses', id], queryFn: () => getBusiness(id), enabled: !canListAll })) });
  const linkedBusinesses = linkedBusinessQueries.map((query) => query.data).filter(Boolean) as Business[];
  const businesses = canListAll ? allBusinessesQuery.data ?? [] : linkedBusinesses;
  const isLoading = canListAll ? allBusinessesQuery.isLoading : linkedBusinessQueries.some((query) => query.isLoading);
  const error = canListAll ? allBusinessesQuery.error : linkedBusinessQueries.find((query) => query.error)?.error;

  const saveMutation = useMutation({
    mutationFn: (values: BusinessFormValues) => editingBusiness ? updateBusiness(editingBusiness.id, values) : createBusiness(values),
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses', business.id] });
      setSelectedBusiness(business.id, business.name);
      setEditingBusiness(business);
      setMessage(editingBusiness ? 'Business updated.' : 'Business created and selected.');
    }
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Businesses" description="Create, select, and maintain business records." />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {saveMutation.error ? <ErrorState message={getErrorMessage(saveMutation.error)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          {isLoading ? <LoadingState message="Loading businesses..." /> : null}
          {error ? <ErrorState message={getErrorMessage(error)} /> : null}
          {!isLoading && businesses.length === 0 ? <EmptyState title="No businesses available" description="Create a business or ask an admin to link one to your account." /> : null}
          {businesses.map((business) => (
            <Card key={business.id} className={selectedBusinessId === business.id ? 'border-teal-300 ring-1 ring-teal-200' : ''}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-700" />
                    <h2 className="font-semibold text-slate-950">{business.name}</h2>
                    <Badge tone={business.isActive ? 'green' : 'red'}>{business.isActive ? 'Active' : 'Inactive'}</Badge>
                    <Badge tone="slate">{business.businessType}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{business.slug} · {business.defaultLanguage} · {business.timezone}</p>
                  <p className="mt-1 text-sm text-slate-500">{business.email ?? business.phone ?? 'No contact details'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelectedBusiness(business.id, business.name)}>Select</Button>
                  <Button variant="ghost" onClick={() => setEditingBusiness(business)}><Pencil className="h-4 w-4" />Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-950">{editingBusiness ? 'Edit business' : 'Create business'}</h2>
          <BusinessForm business={editingBusiness} isSubmitting={saveMutation.isPending} onSubmit={(values) => saveMutation.mutate(values)} />
          {editingBusiness ? <Button className="mt-3 w-full" variant="secondary" onClick={() => setEditingBusiness(null)}>Clear form</Button> : null}
        </Card>
      </div>
    </div>
  );
}
