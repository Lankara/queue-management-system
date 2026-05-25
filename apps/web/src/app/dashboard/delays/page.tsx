'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { listBranches } from '@/features/branches/branches.api';
import { DelayForm, DelayFormValues } from '@/features/delays/delay-form';
import { createDelay, listDelays } from '@/features/delays/delays.api';
import { listServices } from '@/features/services/services.api';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';
import { AffectedAppointmentDelayResult, QueueDelayEvent } from '@/types/delay';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function DelaysPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const user = useAuthStore((state) => state.user);
  const [branchId, setBranchId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedDelay, setSelectedDelay] = useState<QueueDelayEvent | null>(null);
  const [affectedAppointments, setAffectedAppointments] = useState<AffectedAppointmentDelayResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const servicesQuery = useQuery({ queryKey: ['services', businessId], queryFn: () => listServices(businessId as string), enabled: Boolean(businessId) });
  const delaysQuery = useQuery({ queryKey: ['delays', businessId, { branchId, serviceId, from, to }], queryFn: () => listDelays(businessId as string, { branchId: branchId || undefined, serviceId: serviceId || undefined, from: from || undefined, to: to || undefined }), enabled: Boolean(businessId), refetchInterval: 30000 });
  const mutation = useMutation({
    mutationFn: (values: DelayFormValues) => createDelay(businessId as string, { ...values, affectedFromTime: new Date(values.affectedFromTime).toISOString(), createdBy: user?.id }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['delays', businessId] });
      setSelectedDelay(result.delayEvent);
      setAffectedAppointments(result.affectedAppointments);
      setMessage(`Delay created. Affected appointments: ${result.affectedCount}.`);
    }
  });
  const branches = branchesQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  if (!businessId) return <div className="grid gap-6"><PageHeader title="Delays" description="Create and monitor service delay events." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;

  return (
    <div className="grid gap-6">
      <PageHeader title="Delays" description="Create service delays and monitor shifted appointment impact." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[delaysQuery.error, mutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      <SectionCard title="Delay filters" description="Delay list refreshes every 30 seconds.">
        <div className="grid gap-4 md:grid-cols-4">
          <Select label="Branch" placeholder="All branches" value={branchId} onChange={(event) => setBranchId(event.target.value)} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
          <Select label="Service" placeholder="All services" value={serviceId} onChange={(event) => setServiceId(event.target.value)} options={services.map((service) => ({ label: service.name, value: service.id }))} />
          <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </SectionCard>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="grid gap-6">
          <SectionCard title="Create delay event" description="Shift affected appointments and queue pending delay notifications."><DelayForm branches={branches} services={services} isSubmitting={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} /></SectionCard>
          <SectionCard title="Delay events" description="Click an event to inspect it.">
            <div className="grid gap-3">
              {delaysQuery.isLoading ? <LoadingState message="Loading delays..." /> : null}
              {delaysQuery.data?.length === 0 ? <EmptyState title="No delay events found" /> : null}
              {delaysQuery.data?.map((delay) => {
                const branch = branches.find((item) => item.id === delay.branchId);
                const service = services.find((item) => item.id === delay.serviceId);
                return (
                  <button key={delay.id} type="button" className={`rounded-md border bg-white p-3 text-left hover:bg-slate-50 ${selectedDelay?.id === delay.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200'}`} onClick={() => { setSelectedDelay(delay); setAffectedAppointments([]); }}>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{service?.name ?? delay.serviceId}</span><Badge tone="teal">{delay.delayMinutes} min</Badge></div>
                    <p className="mt-1 text-xs text-slate-500">{branch?.name ?? 'All branches'} · from {new Date(delay.affectedFromTime).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-600">{delay.reason ?? 'No reason recorded'}</p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>
        <div className="grid gap-6">
          <SectionCard title="Delay details" description="Stored delay event information.">
            {!selectedDelay ? <EmptyState title="Select a delay event" /> : <dl className="grid gap-4 md:grid-cols-3"><InfoRow label="Delay minutes" value={selectedDelay.delayMinutes} /><InfoRow label="Affected from" value={new Date(selectedDelay.affectedFromTime).toLocaleString()} /><InfoRow label="Created" value={new Date(selectedDelay.createdAt).toLocaleString()} /><InfoRow label="Created by" value={selectedDelay.createdBy} /><InfoRow label="Reason" value={selectedDelay.reason} /><InfoRow label="Service" value={services.find((service) => service.id === selectedDelay.serviceId)?.name ?? selectedDelay.serviceId} /></dl>}
          </SectionCard>
          <SectionCard title="Affected appointments" description="Available immediately after creating a delay event.">
            {affectedAppointments.length === 0 ? <EmptyState title="No affected appointment details loaded" description="Create a delay event to see the affected appointment shift result." /> : (
              <div className="grid gap-3">
                {affectedAppointments.map((item) => <Card key={item.appointmentId}><div className="grid gap-3 md:grid-cols-4"><InfoRow label="Appointment" value={item.appointmentId} /><InfoRow label="Customer" value={item.customerId} /><InfoRow label="Old time" value={new Date(item.oldStartTime).toLocaleString()} /><InfoRow label="New time" value={new Date(item.newStartTime).toLocaleString()} /><InfoRow label="Queue" value={item.queueNumber ?? 'Not assigned'} /></div></Card>)}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
