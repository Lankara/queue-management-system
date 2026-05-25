'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PhoneCall, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { WarningBanner } from '@/components/warning-banner';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { listBranches } from '@/features/branches/branches.api';
import { listClientProfiles } from '@/features/client-profiles/client-profiles.api';
import { listCustomers } from '@/features/customers/customers.api';
import { CurrentServingCard } from '@/features/queues/current-serving-card';
import { CustomerLookup } from '@/features/queues/customer-lookup';
import { QueueActionBar } from '@/features/queues/queue-action-bar';
import { QueueCard } from '@/features/queues/queue-card';
import { QueueEntryRow } from '@/features/queues/queue-entry-row';
import { QueueFilters } from '@/features/queues/queue-filters';
import { callNextQueueEntry, completeQueueEntry, confirmQueueEntry, getQueuePosition, joinQueueDraft, listQueueEntries, listTodayQueues, markQueueEntryNoShow, rejectQueueEntry, startQueueEntryService } from '@/features/queues/queues.api';
import { listServices } from '@/features/services/services.api';
import { useBusinessStore } from '@/store/business-store';
import { Branch, Service } from '@/types/business-setup';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { Queue, QueueEntry } from '@/types/queue';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

function countByStatus(entries: QueueEntry[]) {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = (acc[entry.status] ?? 0) + 1;
    return acc;
  }, {});
}

export default function QueuesPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const [branchId, setBranchId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [lookupCustomer, setLookupCustomer] = useState<Customer | null>(null);
  const [lookupProfile, setLookupProfile] = useState<ClientProfile | null>(null);
  const [joinBranchId, setJoinBranchId] = useState('');
  const [joinServiceId, setJoinServiceId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const servicesQuery = useQuery({ queryKey: ['services', businessId], queryFn: () => listServices(businessId as string), enabled: Boolean(businessId) });
  const queuesQuery = useQuery({ queryKey: ['queues-today', businessId, { branchId, serviceId }], queryFn: () => listTodayQueues(businessId as string, { branchId: branchId || undefined, serviceId: serviceId || undefined }), enabled: Boolean(businessId), refetchInterval: 15000 });
  const entriesQuery = useQuery({ queryKey: ['queue-entries', businessId, selectedQueue?.id], queryFn: () => listQueueEntries(businessId as string, selectedQueue?.id as string), enabled: Boolean(businessId && selectedQueue?.id), refetchInterval: 10000 });
  const customersQuery = useQuery({ queryKey: ['customers', businessId], queryFn: () => listCustomers(businessId as string), enabled: Boolean(businessId) });
  const selectedCustomerProfilesQuery = useQuery({ queryKey: ['client-profiles', businessId, selectedEntry?.customerId], queryFn: () => listClientProfiles(businessId as string, selectedEntry?.customerId as string), enabled: Boolean(businessId && selectedEntry?.customerId) });
  const positionQuery = useQuery({ queryKey: ['queue-position', businessId, selectedEntry?.id], queryFn: () => getQueuePosition(businessId as string, selectedEntry?.id as string), enabled: Boolean(businessId && selectedEntry?.id), refetchInterval: 10000 });

  const selectedEntryCustomer = customersQuery.data?.find((customer) => customer.id === selectedEntry?.customerId);
  const selectedEntryClientProfile = selectedCustomerProfilesQuery.data?.find((profile) => profile.id === selectedEntry?.clientProfileId);
  const statusSummary = countByStatus(entriesQuery.data ?? []);
  const branches = branchesQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const actionMutation = useMutation({
    mutationFn: async (action: 'confirm' | 'reject' | 'start' | 'complete' | 'no-show' | 'call-next') => {
      if (!businessId) throw new Error('Select a business first');
      if (action === 'call-next') {
        if (!selectedQueue) throw new Error('Select a queue first');
        return callNextQueueEntry(businessId, selectedQueue.id);
      }
      if (!selectedEntry) throw new Error('Select an entry first');
      if (action === 'confirm') return confirmQueueEntry(businessId, selectedEntry.id);
      if (action === 'reject') return rejectQueueEntry(businessId, selectedEntry.id);
      if (action === 'start') return startQueueEntryService(businessId, selectedEntry.id);
      if (action === 'complete') return completeQueueEntry(businessId, selectedEntry.id);
      return markQueueEntryNoShow(businessId, selectedEntry.id);
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId, selectedQueue?.id] });
      queryClient.invalidateQueries({ queryKey: ['queue-position', businessId, entry.id] });
      setSelectedEntry(entry);
      setMessage(`Queue entry ${entry.queueNumber} updated.`);
    }
  });

  const manualJoinMutation = useMutation({
    mutationFn: async (confirmImmediately: boolean) => {
      if (!businessId || !lookupCustomer || !lookupProfile) throw new Error('Select customer and client profile first');
      const draft = await joinQueueDraft(businessId, { customerId: lookupCustomer.id, clientProfileId: lookupProfile.id, branchId: joinBranchId || branchId || undefined, serviceId: joinServiceId || serviceId || undefined, source: 'OPERATOR' });
      return confirmImmediately ? confirmQueueEntry(businessId, draft.id) : draft;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      setSelectedEntry(entry);
      setMessage(`Manual queue entry ${entry.queueNumber} created.`);
    }
  });

  const selectedQueueEntries = entriesQuery.data ?? [];
  const queuesWithEntries = useMemo(() => new Map([[selectedQueue?.id, selectedQueueEntries]]), [selectedQueue?.id, selectedQueueEntries]);

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Queues" description="Manage live queue operations." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Queues" description="Monitor live queues, call customers, and manage operator queue actions." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[queuesQuery.error, entriesQuery.error, actionMutation.error, manualJoinMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}

      <SectionCard title="Queue filters" description="Refreshes queue list every 15 seconds.">
        <QueueFilters branches={branches} services={services} branchId={branchId} serviceId={serviceId} onBranchChange={setBranchId} onServiceChange={setServiceId} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-6">
          <CurrentServingCard currentNumber={selectedQueue?.currentNumber} />
          <SectionCard title="Today queues" description="Click a queue to view entries.">
            <div className="grid gap-3">
              {queuesQuery.isLoading ? <LoadingState message="Loading today queues..." /> : null}
              {queuesQuery.data?.length === 0 ? <EmptyState title="No queues for today" description="Create an entry through manual join or customer QR flow." /> : null}
              {queuesQuery.data?.map((queue) => (
                <QueueCard key={queue.id} queue={queue} entries={queuesWithEntries.get(queue.id)} branches={branches} services={services} selected={selectedQueue?.id === queue.id} onSelect={() => { setSelectedQueue(queue); setSelectedEntry(null); }} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard title="Queue entries" description="Refreshes selected queue entries every 10 seconds." action={<Button disabled={!selectedQueue} isLoading={actionMutation.isPending} onClick={() => actionMutation.mutate('call-next')}><PhoneCall className="h-4 w-4" />Call Next</Button>}>
            {!selectedQueue ? <EmptyState title="Select a queue first" /> : (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusSummary).map(([status, count]) => <Badge key={status} tone="slate">{status}: {count}</Badge>)}
                </div>
                {entriesQuery.isLoading ? <LoadingState message="Loading queue entries..." /> : null}
                {selectedQueueEntries.length === 0 ? <EmptyState title="No entries in this queue" /> : null}
                <div className="grid gap-2">
                  {selectedQueueEntries.map((entry) => {
                    const customer = customersQuery.data?.find((item) => item.id === entry.customerId);
                    return <QueueEntryRow key={entry.id} entry={entry} customer={customer} selected={selectedEntry?.id === entry.id} onSelect={() => setSelectedEntry(entry)} />;
                  })}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Selected entry" description="View customer context, queue position, and run operator actions.">
            {!selectedEntry ? <EmptyState title="Select a queue entry" /> : (
              <div className="grid gap-5">
                {selectedEntryCustomer?.isOnlineBookingBanned ? <WarningBanner><p className="font-medium">Customer is banned from online booking.</p><p>{selectedEntryCustomer.banReason ?? 'No ban reason recorded.'} No-shows: {selectedEntryCustomer.noShowCount}</p></WarningBanner> : null}
                <div className="grid gap-4 md:grid-cols-4">
                  <InfoRow label="Queue number" value={selectedEntry.queueNumber} />
                  <InfoRow label="Client" value={selectedEntryClientProfile?.fullName ?? selectedEntry.clientProfileId} />
                  <InfoRow label="Phone" value={selectedEntryCustomer?.primaryPhone ?? selectedEntry.customerId} />
                  <InfoRow label="Position" value={positionQuery.data?.position ?? 'Loading'} />
                  <InfoRow label="Current serving" value={positionQuery.data?.currentServingNumber ?? '---'} />
                  <InfoRow label="Waiting count" value={positionQuery.data?.estimatedWaitingCount ?? 'Loading'} />
                  <InfoRow label="Source" value={selectedEntry.source} />
                  <InfoRow label="Created" value={selectedEntry.createdAt ? new Date(selectedEntry.createdAt).toLocaleString() : null} />
                </div>
                <QueueActionBar entry={selectedEntry} isBusy={actionMutation.isPending} onConfirm={() => actionMutation.mutate('confirm')} onReject={() => actionMutation.mutate('reject')} onStart={() => actionMutation.mutate('start')} onComplete={() => actionMutation.mutate('complete')} onNoShow={() => actionMutation.mutate('no-show')} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Manual operator join" description="Select an existing customer and client profile, then create an operator queue entry.">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <CustomerLookup businessId={businessId} selectedCustomer={lookupCustomer} selectedProfile={lookupProfile} onCustomerSelect={(customer) => { setLookupCustomer(customer); setLookupProfile(null); }} onProfileSelect={setLookupProfile} />
              <div className="grid content-start gap-4">
                <Select label="Branch" placeholder="Use current filter" value={joinBranchId} onChange={(event) => setJoinBranchId(event.target.value)} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
                <Select label="Service" placeholder="Use current filter" value={joinServiceId} onChange={(event) => setJoinServiceId(event.target.value)} options={services.map((service) => ({ label: service.name, value: service.id }))} />
                <Button disabled={!lookupCustomer || !lookupProfile} isLoading={manualJoinMutation.isPending} onClick={() => manualJoinMutation.mutate(true)}><Plus className="h-4 w-4" />Join and confirm</Button>
                <Button variant="secondary" disabled={!lookupCustomer || !lookupProfile} isLoading={manualJoinMutation.isPending} onClick={() => manualJoinMutation.mutate(false)}>Create draft only</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
