'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { listBranches } from '@/features/branches/branches.api';
import { ServiceForm, ServiceFormValues } from '@/features/services/service-form';
import { createService, listServices, updateService } from '@/features/services/services.api';
import { useBusinessStore } from '@/store/business-store';
import { Service } from '@/types/business-setup';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const servicesQuery = useQuery({ queryKey: ['services', businessId], queryFn: () => listServices(businessId as string), enabled: Boolean(businessId) });
  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const saveMutation = useMutation({
    mutationFn: (values: ServiceFormValues) => editingService ? updateService(businessId as string, editingService.id, values) : createService(businessId as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      setEditingService(null);
      setMessage('Service saved.');
    }
  });

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Services" description="Manage services for the selected business." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Services" description="Manage services for the selected business." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {saveMutation.error ? <ErrorState message={getErrorMessage(saveMutation.error)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          {servicesQuery.isLoading ? <LoadingState message="Loading services..." /> : null}
          {servicesQuery.error ? <ErrorState message={getErrorMessage(servicesQuery.error)} /> : null}
          {servicesQuery.data?.length === 0 ? <EmptyState title="No services yet" /> : null}
          {servicesQuery.data?.map((service) => (
            <Card key={service.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{service.name}</h2><Badge tone={service.isActive ? 'green' : 'red'}>{service.isActive ? 'Active' : 'Inactive'}</Badge><Badge>{service.durationMinutes} min</Badge></div><p className="mt-2 text-sm text-slate-600">{service.code} · {service.requiresApproval ? 'Approval required' : 'No approval required'}</p><p className="mt-1 text-sm text-slate-500">{service.description ?? 'No description'}</p></div>
                <Button variant="ghost" onClick={() => setEditingService(service)}><Pencil className="h-4 w-4" />Edit</Button>
              </div>
            </Card>
          ))}
        </div>
        <Card><h2 className="mb-4 text-base font-semibold">{editingService ? 'Edit service' : 'Create service'}</h2><ServiceForm service={editingService} branches={branchesQuery.data ?? []} isSubmitting={saveMutation.isPending} onSubmit={(values) => saveMutation.mutate(values)} /></Card>
      </div>
    </div>
  );
}
