'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Activity, Clock, PhoneCall, Plus, Power, StopCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { AppointmentStatusBadge } from '@/features/appointments/appointment-status-badge';
import { approveAppointment, cancelAppointmentByOperator, listAppointments, rejectAppointment } from '@/features/appointments/appointments.api';
import { WarningBanner } from '@/components/warning-banner';
import { listBranches } from '@/features/branches/branches.api';
import { createClientProfile, listClientProfiles } from '@/features/client-profiles/client-profiles.api';
import { createCustomer, findCustomerByPhone, listCustomers } from '@/features/customers/customers.api';
import { CustomerLookup } from '@/features/queues/customer-lookup';
import { QueueActionBar } from '@/features/queues/queue-action-bar';
import { QueueCard } from '@/features/queues/queue-card';
import { QueueEntryRow } from '@/features/queues/queue-entry-row';
import { QueueFilters } from '@/features/queues/queue-filters';
import { approveQueueEntry, callNextQueueEntry, closeQueue, completeQueueEntry, getQueuePosition, joinQueueDraft, listPendingQueueRequests, listQueueEntries, listTodayQueues, markQueueEntryNoShow, openQueue, rejectQueueEntry, startQueueEntryService } from '@/features/queues/queues.api';
import { listServices } from '@/features/services/services.api';
import { useBusinessStore } from '@/store/business-store';
import { Appointment } from '@/types/appointment';
import { Branch, Service } from '@/types/business-setup';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { Queue, QueueEntry } from '@/types/queue';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

function countByStatus(entries: QueueEntry[]) {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    const label = entry.status === 'DRAFT' ? 'PENDING_APPROVAL' : entry.status;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
}


const activeQueueStatuses = ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'];

function isMainBranch(branch?: Branch) {
  const name = branch?.name?.toLowerCase().trim();
  const code = branch?.code?.toLowerCase().trim();
  return name === 'main' || name === 'main branch' || code === 'main';
}

function serviceBelongsToBranch(service: Service, branchId: string, branches: Branch[]) {
  if (!branchId) return true;
  if (service.branchId === branchId) return true;
  const branch = branches.find((item) => item.id === branchId);
  return !service.branchId && isMainBranch(branch);
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
}

function getGapText(appointment: Appointment) {
  const target = appointment.approvedStartTime ?? appointment.requestedStartTime;
  const minutes = Math.round((new Date(target).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return 'Due now';
  if (minutes < 60) return `${minutes} min gap`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m gap` : `${hours}h gap`;
}

function hasConsiderableAppointmentGap(appointment: Appointment, minimumGapMinutes = 20) {
  const target = appointment.approvedStartTime ?? appointment.requestedStartTime;
  return new Date(target).getTime() - Date.now() >= minimumGapMinutes * 60000;
}

function queueBelongsToBranch(queue: Queue, branchId: string, branches: Branch[], services: Service[]) {
  if (!branchId) return true;
  if (queue.branchId === branchId) return true;
  const service = services.find((item) => item.id === queue.serviceId);
  return Boolean(service && serviceBelongsToBranch(service, branchId, branches));
}

function queueBelongsToService(queue: Queue, serviceId: string) {
  if (!serviceId) return true;
  return queue.serviceId === serviceId;
}

function getQueueLabel(queue: Queue, branches: Branch[], services: Service[]) {
  const branch = branches.find((item) => item.id === queue.branchId);
  const service = services.find((item) => item.id === queue.serviceId);
  return {
    branchName: branch?.name ?? 'All branches',
    serviceName: service?.name ?? 'All services'
  };
}

function getQueueMetrics(queue: Queue, entries: QueueEntry[]) {
  const total = entries.length || Math.max(queue.lastIssuedNumber, 0);
  const pending = entries.filter((entry) => entry.status === 'DRAFT').length;
  const waiting = entries.filter((entry) => ['CONFIRMED', 'WAITING'].includes(entry.status)).length;
  const active = entries.filter((entry) => activeQueueStatuses.includes(entry.status)).length;
  const completed = entries.filter((entry) => entry.status === 'COMPLETED').length;
  const noShow = entries.filter((entry) => entry.status === 'NO_SHOW').length;
  return { total, pending, waiting, active, completed, noShow };
}

function MetricBar({ label, value, total, tone = 'teal' }: { label: string; value: number; total: number; tone?: 'teal' | 'amber' | 'green' | 'red' }) {
  const width = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const toneClass = tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-500' : 'bg-teal-500';
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs text-slate-500"><span>{label}</span><span className="font-semibold text-slate-700">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${toneClass} h-full rounded-full`} style={{ width: `${width}%` }} /></div>
    </div>
  );
}

function BranchQueueBoard({ queues, entriesByQueueId, branches, services, selectedQueueId, onSelect }: { queues: Queue[]; entriesByQueueId: Map<string, QueueEntry[]>; branches: Branch[]; services: Service[]; selectedQueueId?: string; onSelect: (queue: Queue) => void }) {
  if (queues.length === 0) return <EmptyState title="No queue sessions open today" description="Open a branch/service queue to start receiving customer requests." />;

  const sortedQueues = [...queues].sort((a, b) => `${getQueueLabel(a, branches, services).branchName}-${getQueueLabel(a, branches, services).serviceName}`.localeCompare(`${getQueueLabel(b, branches, services).branchName}-${getQueueLabel(b, branches, services).serviceName}`));

  return (
    <div className="grid gap-4">
      {sortedQueues.map((queue) => {
        const labels = getQueueLabel(queue, branches, services);
        const entries = entriesByQueueId.get(queue.id) ?? [];
        const metrics = getQueueMetrics(queue, entries);
        const isSelected = selectedQueueId === queue.id;
        return (
          <button key={queue.id} type="button" onClick={() => onSelect(queue)} className="w-full text-left">
            <Card className={`grid w-full gap-4 transition hover:border-teal-300 ${isSelected ? 'border-teal-400 ring-1 ring-teal-200' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">{labels.branchName}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{labels.serviceName}</h3>
                </div>
                <Badge tone={queue.isActive ? 'green' : 'slate'}>{queue.isActive ? 'OPEN' : 'CLOSED'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-md bg-slate-950 p-4 text-white shadow-[0_0_22px_rgba(245,158,11,0.45)] [animation:qms-now-serving-flare_1.8s_ease-out_1] before:absolute before:inset-x-0 before:bottom-0 before:h-8 before:bg-gradient-to-t before:from-amber-400/35 before:via-red-500/15 before:to-transparent before:content-['']">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-300"><Activity className="h-4 w-4" />Now Serving</div>
                  <p className="mt-3 text-5xl font-bold">{queue.currentNumber ?? '---'}</p>
                </div>
                <div className="rounded-md bg-teal-50 p-4 text-teal-950">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-700"><Users className="h-4 w-4" />Total Requests</div>
                  <p className="mt-3 text-5xl font-bold">{metrics.total}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <MetricBar label="Pending approval" value={metrics.pending} total={metrics.total} tone="amber" />
                <MetricBar label="Waiting" value={metrics.waiting} total={metrics.total} tone="teal" />
                <MetricBar label="Active now" value={metrics.active} total={metrics.total} tone="green" />
                <MetricBar label="No-show" value={metrics.noShow} total={metrics.total} tone="red" />
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

function QueueSummaryTile({ title, subtitle, total, waiting, pending, currentNumber, selected, tone, onClick }: { title: string; subtitle?: string; total: number; waiting: number; pending: number; currentNumber?: string | null; selected?: boolean; tone: 'branch' | 'service' | 'detail'; onClick?: () => void }) {
  const toneClass = tone === 'branch' ? 'border-teal-200 bg-teal-50' : tone === 'service' ? 'border-sky-200 bg-sky-50' : 'border-violet-200 bg-violet-50';
  const content = (
    <Card className={`grid min-h-32 gap-3 border ${selected ? 'ring-2 ring-teal-200' : ''} ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
        </div>
        <Badge tone="teal">{total}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded bg-white/70 p-2"><p className="text-slate-500">Now</p><p className="text-base font-bold text-slate-950">{currentNumber ?? '---'}</p></div>
        <div className="rounded bg-white/70 p-2"><p className="text-slate-500">Waiting</p><p className="text-base font-bold text-amber-700">{waiting}</p></div>
        <div className="rounded bg-white/70 p-2"><p className="text-slate-500">Pending</p><p className="text-base font-bold text-teal-700">{pending}</p></div>
      </div>
    </Card>
  );

  return onClick ? <button type="button" className="text-left" onClick={onClick}>{content}</button> : content;
}

function QueueTimeSlotBoard({ entries, selectedEntryId, currentNumber, actionEntryId, onSelect, onConfirm, onReject }: { entries: QueueEntry[]; selectedEntryId?: string; currentNumber?: string | null; actionEntryId?: string | null; onSelect: (entry: QueueEntry) => void; onConfirm: (entry: QueueEntry) => void; onReject: (entry: QueueEntry) => void }) {
  if (entries.length === 0) return <EmptyState title="No entries to plot" />;

  const currentSlotRef = useRef<HTMLDivElement | null>(null);
  const sortedEntries = [...entries].sort((a, b) => a.queueSequence - b.queueSequence);
  useEffect(() => {
    currentSlotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentNumber, entries.length]);
  const statusClass: Record<string, string> = {
    DRAFT: 'border-amber-300 bg-amber-50 text-amber-900',
    CONFIRMED: 'border-sky-300 bg-sky-50 text-sky-900',
    WAITING: 'border-teal-300 bg-teal-50 text-teal-900',
    CALLED: 'border-violet-300 bg-violet-50 text-violet-900',
    IN_SERVICE: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    COMPLETED: 'border-slate-300 bg-slate-100 text-slate-500 opacity-60',
    CANCELLED: 'border-red-300 bg-red-50 text-red-700 opacity-60',
    NO_SHOW: 'border-red-300 bg-red-50 text-red-700 opacity-60'
  };

  return (
    <div className="max-w-full overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 pb-5 [scrollbar-gutter:stable]">
      <div className="flex min-w-max items-stretch gap-0">
        {sortedEntries.map((entry, index) => {
          const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
          const isCurrent = Boolean(currentNumber && entry.queueNumber === currentNumber);
          const isServedOrExpired = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(entry.status);
          const isPendingApproval = entry.status === 'DRAFT';
          const isActionPending = actionEntryId === entry.id;
          return (
            <div key={entry.id} className="flex items-center">
              <div
                ref={isCurrent ? currentSlotRef : null}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(entry)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(entry); }}
                className={`min-h-28 w-28 rounded-md border p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusClass[entry.status] ?? 'border-slate-300 bg-white text-slate-800'} ${selectedEntryId === entry.id ? 'ring-2 ring-teal-500' : ''}`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-70">Slot {entry.queueSequence}</span>
                <span className="mt-0.5 block text-2xl font-black leading-none">{entry.queueNumber}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold">{isCurrent ? 'NOW SERVING' : isServedOrExpired ? 'SERVED' : isPendingApproval ? 'PENDING_APPROVAL' : entry.status}</span>
                <span className="mt-0.5 block truncate text-[10px] opacity-70">#{entry.queueSequence} - {entry.source}</span>
                {isPendingApproval ? (
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <button type="button" disabled={isActionPending} onClick={(event) => { event.stopPropagation(); onConfirm(entry); }} className="h-5 rounded border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-700 disabled:opacity-60">OK</button>
                    <button type="button" disabled={isActionPending} onClick={(event) => { event.stopPropagation(); onReject(entry); }} className="h-5 rounded border border-red-300 bg-red-50 text-[10px] font-bold text-red-700 disabled:opacity-60">No</button>
                  </div>
                ) : <span className="mt-1 block text-xs opacity-70">{createdAt}</span>}
              </div>
              {index < sortedEntries.length - 1 ? <div className="h-1 w-8 bg-slate-300" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QueueAppointmentCounter({
  appointments,
  customers,
  branches,
  services,
  busyAppointmentId,
  onApprove,
  onReject,
  onCancel
}: {
  appointments: Appointment[];
  customers: Customer[];
  branches: Branch[];
  services: Service[];
  busyAppointmentId?: string | null;
  onApprove: (appointment: Appointment) => void;
  onReject: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}) {
  const pendingCount = appointments.filter((appointment) => appointment.status === 'PENDING_APPROVAL').length;
  const approvedCount = appointments.filter((appointment) => ['APPROVED', 'IN_QUEUE'].includes(appointment.status)).length;

  return (
    <SectionCard title="Appointments at counter" description="Approve appointment requests while watching walk-ins and queue gaps." action={<div className="flex gap-2"><Badge tone="slate">Pending {pendingCount}</Badge><Badge tone="green">Approved {approvedCount}</Badge></div>}>
      <div className="grid gap-3">
        {appointments.length === 0 ? <EmptyState title="No appointments for this selection" description="Walk-ins and online queue bookings can fill this counter time." /> : null}
        {appointments.length > 0 ? (
          <div className="max-h-72 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid gap-2">
              {appointments.map((appointment) => {
                const customer = customers.find((item) => item.id === appointment.customerId);
                const branch = branches.find((item) => item.id === appointment.branchId);
                const service = services.find((item) => item.id === appointment.serviceId);
                const isPending = appointment.status === 'PENDING_APPROVAL';
                const canCancel = ['PENDING_APPROVAL', 'APPROVED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED'].includes(appointment.status);
                const isBusy = busyAppointmentId === appointment.id;

                return (
                  <Card key={appointment.id} className="grid gap-2 border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-950">{formatTime(appointment.approvedStartTime ?? appointment.requestedStartTime)}</span>
                          <AppointmentStatusBadge status={appointment.status} />
                          {appointment.queueNumber ? <Badge tone="teal">Queue {appointment.queueNumber}</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{branch?.name ?? 'Branch'} / {service?.name ?? 'Service'} / {getGapText(appointment)}</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{customer?.primaryPhone ?? 'Customer'} <span className="text-xs font-normal text-slate-500">Client {appointment.clientProfileId.slice(0, 8)}</span></p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {isPending ? <Button className="h-8 px-2 text-xs" disabled={isBusy} isLoading={isBusy} onClick={() => onApprove(appointment)}>Approve</Button> : null}
                        {isPending ? <Button className="h-8 px-2 text-xs" variant="secondary" disabled={isBusy} onClick={() => onReject(appointment)}>Reject</Button> : null}
                        {canCancel && !isPending ? <Button className="h-8 px-2 text-xs" variant="secondary" disabled={isBusy} onClick={() => onCancel(appointment)}>Cancel</Button> : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
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
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInBranchId, setWalkInBranchId] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const servicesQuery = useQuery({ queryKey: ['services', businessId], queryFn: () => listServices(businessId as string), enabled: Boolean(businessId && branchesQuery.isSuccess) });
  const queuesQuery = useQuery({ queryKey: ['queues-today', businessId, { branchId, serviceId }], queryFn: () => listTodayQueues(businessId as string, { branchId: branchId || undefined, serviceId: serviceId || undefined }), enabled: Boolean(businessId), refetchInterval: 15000 });
  const summaryQueuesQuery = useQuery({ queryKey: ['queues-today-summary', businessId, { branchId }], queryFn: () => listTodayQueues(businessId as string, { branchId: branchId || undefined }), enabled: Boolean(businessId), refetchInterval: 15000 });
  const todayRange = useMemo(() => getTodayRange(), []);
  const appointmentsQuery = useQuery({
    queryKey: ['queue-counter-appointments', businessId, { branchId, serviceId, todayRange }],
    queryFn: () => listAppointments(businessId as string, { serviceId: serviceId || undefined, from: todayRange.from, to: todayRange.to }),
    enabled: Boolean(businessId),
    refetchInterval: 20000
  });
  const queueEntryQueries = useQueries({
    queries: (queuesQuery.data ?? []).map((queue) => ({
      queryKey: ['queue-entries', businessId, queue.id],
      queryFn: () => listQueueEntries(businessId as string, queue.id),
      enabled: Boolean(businessId),
      refetchInterval: 10000
    }))
  });
  const summaryQueueEntryQueries = useQueries({
    queries: (summaryQueuesQuery.data ?? []).map((queue) => ({
      queryKey: ['queue-summary-entries', businessId, queue.id],
      queryFn: () => listQueueEntries(businessId as string, queue.id),
      enabled: Boolean(businessId),
      refetchInterval: 10000
    }))
  });
  const allEntriesByQueueId = useMemo(() => {
    const result = new Map<string, QueueEntry[]>();
    (queuesQuery.data ?? []).forEach((queue, index) => {
      result.set(queue.id, queueEntryQueries[index]?.data ?? []);
    });
    return result;
  }, [queuesQuery.data, queueEntryQueries]);
  const summaryEntriesByQueueId = useMemo(() => {
    const result = new Map<string, QueueEntry[]>();
    (summaryQueuesQuery.data ?? []).forEach((queue, index) => {
      result.set(queue.id, summaryQueueEntryQueries[index]?.data ?? []);
    });
    return result;
  }, [summaryQueuesQuery.data, summaryQueueEntryQueries]);
  const entriesQuery = queueEntryQueries.find((query, index) => queuesQuery.data?.[index]?.id === selectedQueue?.id);
  const pendingRequestsQuery = useQuery({ queryKey: ['queue-pending-requests', businessId, { branchId, serviceId }], queryFn: () => listPendingQueueRequests(businessId as string, { branchId: branchId || undefined, serviceId: serviceId || undefined }), enabled: Boolean(businessId), refetchInterval: 10000 });
  const customersQuery = useQuery({ queryKey: ['customers', businessId], queryFn: () => listCustomers(businessId as string), enabled: Boolean(businessId) });
  const selectedCustomerProfilesQuery = useQuery({ queryKey: ['client-profiles', businessId, selectedEntry?.customerId], queryFn: () => listClientProfiles(businessId as string, selectedEntry?.customerId as string), enabled: Boolean(businessId && selectedEntry?.customerId) });
  const positionQuery = useQuery({ queryKey: ['queue-position', businessId, selectedEntry?.id], queryFn: () => getQueuePosition(businessId as string, selectedEntry?.id as string), enabled: Boolean(businessId && selectedEntry?.id), refetchInterval: 10000 });

  const selectedQueueEntries = selectedQueue ? allEntriesByQueueId.get(selectedQueue.id) ?? [] : [];
  const pendingRequests = pendingRequestsQuery.data ?? [];
  const counterAppointments = useMemo(() => (appointmentsQuery.data ?? [])
    .filter((appointment) => !branchId || appointment.branchId === branchId)
    .filter((appointment) => !serviceId || appointment.serviceId === serviceId)
    .filter((appointment) => !['REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR', 'COMPLETED', 'NO_SHOW'].includes(appointment.status))
    .sort((a, b) => new Date(a.approvedStartTime ?? a.requestedStartTime).getTime() - new Date(b.approvedStartTime ?? b.requestedStartTime).getTime()), [appointmentsQuery.data, branchId, serviceId]);
  const firstFutureAppointmentSlot = useMemo(() => counterAppointments.find((appointment) => appointment.queueEntryId && ['APPROVED', 'IN_QUEUE'].includes(appointment.status) && hasConsiderableAppointmentGap(appointment)), [counterAppointments]);

  function getInsertBeforeFutureAppointmentId(entry: QueueEntry): string | undefined {
    if (entry.status !== 'DRAFT') return undefined;
    const futureAppointment = counterAppointments.find((appointment) => {
      if (!appointment.queueEntryId || appointment.queueEntryId === entry.id) return false;
      if (!['APPROVED', 'IN_QUEUE'].includes(appointment.status)) return false;
      if (!hasConsiderableAppointmentGap(appointment)) return false;
      if (appointment.serviceId !== entry.serviceId) return false;
      if ((appointment.branchId ?? '') !== (entry.branchId ?? '')) return false;
      const appointmentEntry = selectedQueueEntries.find((item) => item.id === appointment.queueEntryId);
      return !appointmentEntry || entry.queueSequence > appointmentEntry.queueSequence;
    });

    if (!futureAppointment?.queueEntryId) return undefined;
    const appointmentTime = new Date(futureAppointment.approvedStartTime ?? futureAppointment.requestedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return window.confirm(`Appointment queue number ${futureAppointment.queueNumber} is scheduled for ${appointmentTime}. Confirm this request before that appointment and move the appointment to the next number?`) ? futureAppointment.queueEntryId : undefined;
  }
  const queuesWithEntries = allEntriesByQueueId;
  const selectedEntryCustomer = customersQuery.data?.find((customer) => customer.id === selectedEntry?.customerId);
  const selectedEntryClientProfile = selectedCustomerProfilesQuery.data?.find((profile) => profile.id === selectedEntry?.clientProfileId);
  const statusSummary = countByStatus(selectedQueueEntries);
  const branches = branchesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const filteredServices = branchId ? services.filter((service) => serviceBelongsToBranch(service, branchId, branches)) : services;
  const manualJoinBranchId = joinBranchId || branchId;
  const manualJoinServices = manualJoinBranchId ? services.filter((service) => serviceBelongsToBranch(service, manualJoinBranchId, branches)) : services;
  const activeWalkInBranchId = walkInBranchId || branchId;
  const walkInServices = activeWalkInBranchId ? services.filter((service) => serviceBelongsToBranch(service, activeWalkInBranchId, branches)) : services;
  const activeBranch = branches.find((branch) => branch.id === branchId);
  const activeService = services.find((service) => service.id === serviceId);
  const summaryQueues = summaryQueuesQuery.data ?? [];
  const branchSummary = useMemo(() => branches.map((branch) => {
    const branchQueues = summaryQueues.filter((queue) => queueBelongsToBranch(queue, branch.id, branches, services));
    const entries = branchQueues.flatMap((queue) => summaryEntriesByQueueId.get(queue.id) ?? []);
    return {
      branch,
      total: entries.length || branchQueues.reduce((sum, queue) => sum + Math.max(queue.lastIssuedNumber, 0), 0),
      waiting: entries.filter((entry) => ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'].includes(entry.status)).length,
      pending: entries.filter((entry) => entry.status === 'DRAFT').length,
      currentNumber: branchQueues.find((queue) => queue.currentNumber)?.currentNumber ?? null
    };
  }), [branches, services, summaryEntriesByQueueId, summaryQueues]);
  const serviceSummary = useMemo(() => filteredServices.map((service) => {
    const serviceQueues = summaryQueues.filter((queue) => queueBelongsToService(queue, service.id) && queueBelongsToBranch(queue, branchId, branches, services));
    const entries = serviceQueues.flatMap((queue) => summaryEntriesByQueueId.get(queue.id) ?? []);
    return {
      service,
      total: entries.length || serviceQueues.reduce((sum, queue) => sum + Math.max(queue.lastIssuedNumber, 0), 0),
      waiting: entries.filter((entry) => ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'].includes(entry.status)).length,
      pending: entries.filter((entry) => entry.status === 'DRAFT').length,
      currentNumber: serviceQueues.find((queue) => queue.currentNumber)?.currentNumber ?? null
    };
  }), [branchId, branches, filteredServices, services, summaryEntriesByQueueId, summaryQueues]);
  const selectedServiceQueue = serviceId ? summaryQueues.find((queue) => queueBelongsToService(queue, serviceId) && queueBelongsToBranch(queue, branchId, branches, services)) : null;
  const selectedServiceEntries = selectedServiceQueue ? summaryEntriesByQueueId.get(selectedServiceQueue.id) ?? [] : [];
  const selectedServiceMetrics = selectedServiceQueue ? getQueueMetrics(selectedServiceQueue, selectedServiceEntries) : null;
  const selectedBranchSummary = branchId ? branchSummary.find((item) => item.branch.id === branchId) : null;
  const activeQueueForSelection = useMemo(() => {
    if (!serviceId) return null;
    return (queuesQuery.data ?? []).find((queue) => queue.isActive && queueBelongsToBranch(queue, branchId, branches, services) && queueBelongsToService(queue, serviceId)) ?? null;
  }, [branchId, branches, queuesQuery.data, serviceId, services]);
  const branchBoardQueues = useMemo(() => {
    if (!serviceId) return [];
    return (queuesQuery.data ?? []).filter((queue) => queueBelongsToBranch(queue, branchId, branches, services) && queueBelongsToService(queue, serviceId));
  }, [branchId, branches, queuesQuery.data, serviceId, services]);

  useEffect(() => {
    if (!queuesQuery.isSuccess) return;

    if (!serviceId || branchBoardQueues.length === 0) {
      if (selectedQueue) setSelectedQueue(null);
      if (selectedEntry) setSelectedEntry(null);
      return;
    }

    const refreshedSelection = selectedQueue ? branchBoardQueues.find((queue) => queue.id === selectedQueue.id) : null;
    if (refreshedSelection) {
      setSelectedQueue(refreshedSelection);
      return;
    }

    setSelectedQueue(branchBoardQueues[0]);
    setSelectedEntry(null);
  }, [branchBoardQueues, queuesQuery.isSuccess, selectedEntry, selectedQueue, serviceId]);

  useEffect(() => {
    if (!branchesQuery.isSuccess) return;
    if (branchId && !branches.some((branch) => branch.id === branchId)) {
      setBranchId('');
    }
  }, [branchId, branches, branchesQuery.isSuccess]);

  useEffect(() => {
    if (!servicesQuery.isSuccess) return;
    if (serviceId && !services.some((service) => service.id === serviceId)) {
      setServiceId('');
      return;
    }

    if (branchId && serviceId && !filteredServices.some((service) => service.id === serviceId)) {
      setServiceId('');
    }
  }, [branchId, filteredServices, serviceId, services, servicesQuery.isSuccess]);

  useEffect(() => {
    if (!servicesQuery.isSuccess) return;
    if (joinServiceId && !manualJoinServices.some((service) => service.id === joinServiceId)) {
      setJoinServiceId('');
    }
  }, [joinServiceId, manualJoinServices, servicesQuery.isSuccess]);

  function handleBranchFilterChange(nextBranchId: string) {
    setBranchId(nextBranchId);
    const selectedService = services.find((service) => service.id === serviceId);
    if (nextBranchId && selectedService && !serviceBelongsToBranch(selectedService, nextBranchId, branches)) {
      setServiceId('');
    }
  }

  function handleServiceFilterChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    const selectedService = services.find((service) => service.id === nextServiceId);
    if (selectedService?.branchId && selectedService.branchId !== branchId) {
      setBranchId(selectedService.branchId);
    }
  }

  function handleJoinBranchChange(nextBranchId: string) {
    setJoinBranchId(nextBranchId);
    const selectedService = services.find((service) => service.id === joinServiceId);
    if (nextBranchId && selectedService && !serviceBelongsToBranch(selectedService, nextBranchId, branches)) {
      setJoinServiceId('');
    }
  }

  function handleJoinServiceChange(nextServiceId: string) {
    setJoinServiceId(nextServiceId);
    const selectedService = services.find((service) => service.id === nextServiceId);
    if (selectedService?.branchId && selectedService.branchId !== manualJoinBranchId) {
      setJoinBranchId(selectedService.branchId);
    }
  }

  function handleWalkInBranchChange(nextBranchId: string) {
    setWalkInBranchId(nextBranchId);
    const selectedService = services.find((service) => service.id === walkInServiceId);
    if (nextBranchId && selectedService && !serviceBelongsToBranch(selectedService, nextBranchId, branches)) {
      setWalkInServiceId('');
    }
  }

  function handleWalkInServiceChange(nextServiceId: string) {
    setWalkInServiceId(nextServiceId);
    const selectedService = services.find((service) => service.id === nextServiceId);
    if (selectedService?.branchId && selectedService.branchId !== activeWalkInBranchId) {
      setWalkInBranchId(selectedService.branchId);
    }
  }

  const queueSessionMutation = useMutation({
    mutationFn: async (action: 'open' | 'close') => {
      if (!businessId) throw new Error('Select a business first');
      if (action === 'open') {
        if (!serviceId) throw new Error('Select a service before opening a queue');
        return openQueue(businessId, { branchId: branchId || undefined, serviceId });
      }
      const queueToClose = activeQueueForSelection ?? selectedQueue;
      if (!queueToClose) throw new Error('Select a queue first');
      return closeQueue(businessId, queueToClose.id);
    },
    onSuccess: (queue) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-pending-requests', businessId] });
      setSelectedQueue(queue);
      setMessage(queue.isActive ? 'Queue opened for bookings.' : 'Queue closed for new bookings.');
    }
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'confirm' | 'reject' | 'start' | 'complete' | 'no-show' | 'call-next') => {
      if (!businessId) throw new Error('Select a business first');
      if (action === 'call-next') {
        if (!selectedQueue) throw new Error('Select a queue first');
        return callNextQueueEntry(businessId, selectedQueue.id);
      }
      if (!selectedEntry) throw new Error('Select an entry first');
      if (action === 'confirm') return approveQueueEntry(businessId, selectedEntry.id, { insertBeforeEntryId: getInsertBeforeFutureAppointmentId(selectedEntry) });
      if (action === 'reject') return rejectQueueEntry(businessId, selectedEntry.id);
      if (action === 'start') return startQueueEntryService(businessId, selectedEntry.id);
      if (action === 'complete') return completeQueueEntry(businessId, selectedEntry.id);
      return markQueueEntryNoShow(businessId, selectedEntry.id);
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId, selectedQueue?.id] });
      queryClient.invalidateQueries({ queryKey: ['queue-position', businessId, entry.id] });
      queryClient.invalidateQueries({ queryKey: ['queue-pending-requests', businessId] });
      setSelectedEntry(entry);
      setMessage(`Queue entry ${entry.queueNumber} updated.`);
    }
  });

  const slotApprovalMutation = useMutation({
    mutationFn: async ({ entryId, action }: { entryId: string; action: 'confirm' | 'reject' | 'no-show' }) => {
      if (!businessId) throw new Error('Select a business first');
      if (action === 'confirm') {
        const entry = selectedQueueEntries.find((item) => item.id === entryId);
        return approveQueueEntry(businessId, entryId, { insertBeforeEntryId: entry ? getInsertBeforeFutureAppointmentId(entry) : undefined });
      }
      if (action === 'reject') return rejectQueueEntry(businessId, entryId);
      return markQueueEntryNoShow(businessId, entryId);
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId, entry.queueId] });
      queryClient.invalidateQueries({ queryKey: ['queue-position', businessId, entry.id] });
      queryClient.invalidateQueries({ queryKey: ['queue-pending-requests', businessId] });
      setSelectedEntry(entry);
      setMessage(`Queue entry ${entry.queueNumber} updated.`);
    }
  });
  const manualJoinMutation = useMutation({
    mutationFn: async () => {
      if (!businessId || !lookupCustomer || !lookupProfile) throw new Error('Select customer and client profile first');
      const targetServiceId = joinServiceId || serviceId || undefined;
      const targetBranchId = joinBranchId || branchId || undefined;
      const futureAppointment = firstFutureAppointmentSlot && (!targetServiceId || firstFutureAppointmentSlot.serviceId === targetServiceId) && (!targetBranchId || firstFutureAppointmentSlot.branchId === targetBranchId) ? firstFutureAppointmentSlot : null;
      const insertBeforeEntryId = futureAppointment?.queueEntryId && window.confirm(`Appointment queue number ${futureAppointment.queueNumber} is scheduled for ${new Date(futureAppointment.approvedStartTime ?? futureAppointment.requestedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Add this customer before that appointment and move the appointment to the next number?`) ? futureAppointment.queueEntryId : undefined;
      return joinQueueDraft(businessId, { customerId: lookupCustomer.id, clientProfileId: lookupProfile.id, branchId: targetBranchId, serviceId: targetServiceId, source: 'OPERATOR', insertBeforeEntryId });
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId, entry.queueId] });
      setSelectedEntry(entry);
      setMessage(`Walk-in queue entry ${entry.queueNumber} created.`);
    }
  });

  const walkInMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('Select a business first');
      if (!walkInPhone.trim()) throw new Error('Enter walk-in phone number');
      if (!walkInName.trim()) throw new Error('Enter walk-in customer name');
      const selectedWalkInServiceId = walkInServiceId || serviceId;
      const selectedWalkInBranchId = walkInBranchId || branchId;
      if (!selectedWalkInServiceId) throw new Error('Select a service for the walk-in customer');
      const futureAppointment = firstFutureAppointmentSlot && firstFutureAppointmentSlot.serviceId === selectedWalkInServiceId && (!selectedWalkInBranchId || firstFutureAppointmentSlot.branchId === selectedWalkInBranchId) ? firstFutureAppointmentSlot : null;
      const insertBeforeEntryId = futureAppointment?.queueEntryId && window.confirm(`Appointment queue number ${futureAppointment.queueNumber} is scheduled for ${new Date(futureAppointment.approvedStartTime ?? futureAppointment.requestedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Add this walk-in before that appointment and move the appointment to the next number?`) ? futureAppointment.queueEntryId : undefined;

      let customer: Customer;
      const existingCustomer = customersQuery.data?.find((item) => item.primaryPhone === walkInPhone.trim());
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        try {
          customer = await createCustomer(businessId, { primaryPhone: walkInPhone.trim(), preferredLanguage: 'en' });
        } catch {
          customer = await findCustomerByPhone(businessId, walkInPhone.trim());
        }
      }

      const profile = await createClientProfile(businessId, customer.id, {
        fullName: walkInName.trim(),
        relationshipToContact: 'SELF',
        gender: 'NOT_SPECIFIED'
      });
      return joinQueueDraft(businessId, {
        customerId: customer.id,
        clientProfileId: profile.id,
        branchId: selectedWalkInBranchId || undefined,
        serviceId: selectedWalkInServiceId,
        source: 'OPERATOR',
        insertBeforeEntryId
      });
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queues-today-summary', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId, entry.queueId] });
      queryClient.invalidateQueries({ queryKey: ['queue-summary-entries', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-pending-requests', businessId] });
      queryClient.invalidateQueries({ queryKey: ['customers', businessId] });
      const queue = queuesQuery.data?.find((item) => item.id === entry.queueId) ?? selectedQueue;
      if (queue) setSelectedQueue(queue);
      setSelectedEntry(entry);
      setWalkInPhone('');
      setWalkInName('');
      setMessage(`Walk-in customer added as queue number ${entry.queueNumber}.`);
    }
  });

  const appointmentCounterMutation = useMutation({
    mutationFn: async ({ appointment, action }: { appointment: Appointment; action: 'approve' | 'reject' | 'cancel' }) => {
      if (!businessId) throw new Error('Select a business first');
      if (action === 'approve') {
        return approveAppointment(businessId, appointment.id, {
          approvedStartTime: appointment.requestedStartTime,
          approvedEndTime: appointment.requestedEndTime,
          source: 'OPERATOR'
        });
      }
      if (action === 'reject') return rejectAppointment(businessId, appointment.id, { reason: 'Rejected at queue counter' });
      return cancelAppointmentByOperator(businessId, appointment.id, { reason: 'Cancelled at queue counter' });
    },
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['queue-counter-appointments', businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queues-today', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queues-today-summary', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-entries', businessId] });
      queryClient.invalidateQueries({ queryKey: ['queue-summary-entries', businessId] });
      setMessage(`Appointment ${appointment.status.toLowerCase().replaceAll('_', ' ')}.`);
    }
  });


  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Queues" description="Manage live queue operations." /><EmptyState title="No business is selected for this login" description="Log in again or choose your business from the business selection screen." /></div>;
  }

  return (
    <div className="grid gap-6">
      <style>{`
        @keyframes qms-now-serving-flare {
          0% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); transform: scale(1); }
          35% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.95), 0 0 54px rgba(239, 68, 68, 0.45); transform: scale(1.025); }
          70% { box-shadow: 0 0 24px rgba(245, 158, 11, 0.6), 0 0 36px rgba(239, 68, 68, 0.25); transform: scale(1.01); }
          100% { box-shadow: 0 0 22px rgba(245, 158, 11, 0.45); transform: scale(1); }
        }
      `}</style>
      <PageHeader title="Queues" description="Open queues, approve online requests, and manage live service flow." />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[queuesQuery.error, entriesQuery?.error, pendingRequestsQuery.error, appointmentsQuery.error, queueSessionMutation.error, actionMutation.error, manualJoinMutation.error, walkInMutation.error, slotApprovalMutation.error, appointmentCounterMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}


      <div className="grid gap-4">
        <SectionCard title="Queue controls" description="Choose branch first, then service. The summary below follows this selection.">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="grid content-start gap-4">
              <QueueFilters branches={branches} services={filteredServices} branchId={branchId} serviceId={serviceId} onBranchChange={handleBranchFilterChange} onServiceChange={handleServiceFilterChange} />
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Badge tone="slate">Branch: {activeBranch?.name ?? 'All branches'}</Badge>
                <Badge tone="slate">Service: {activeService?.name ?? 'All services'}</Badge>
                {activeQueueForSelection ? <Badge tone="green">Queue already open</Badge> : null}
                {!serviceId ? <Badge tone="slate">Select service to open queue</Badge> : null}
                {(branchId || serviceId) ? <Button variant="secondary" onClick={() => { setBranchId(''); setServiceId(''); }}>Clear filters</Button> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="h-8 px-3 text-xs" disabled={!serviceId || Boolean(activeQueueForSelection)} isLoading={queueSessionMutation.isPending} onClick={() => queueSessionMutation.mutate('open')}><Power className="h-4 w-4" />Open Queue</Button>
                <Button className="h-8 px-3 text-xs" variant="secondary" disabled={!((activeQueueForSelection ?? selectedQueue)?.isActive)} isLoading={queueSessionMutation.isPending} onClick={() => queueSessionMutation.mutate('close')}><StopCircle className="h-4 w-4" />Close Selected</Button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 [scrollbar-gutter:stable]">
              <CustomerLookup businessId={businessId} selectedCustomer={lookupCustomer} selectedProfile={lookupProfile} onCustomerSelect={(customer) => { setLookupCustomer(customer); setLookupProfile(null); }} onProfileSelect={setLookupProfile} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Branch queue board" description="Live branch/service queue view with quick walk-in entry.">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid content-start gap-2 rounded-md border border-teal-100 bg-teal-50/60 p-3">
              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-950">Add walk-in</h3>
                  <Badge tone="teal">Operator</Badge>
                </div>

              </div>
              <label className="grid gap-1 text-xs font-medium text-slate-800">
                <span>Phone</span>
                <input className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={walkInPhone} onChange={(event) => setWalkInPhone(event.target.value)} placeholder="0771234567" />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-800">
                <span>Name</span>
                <input className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={walkInName} onChange={(event) => setWalkInName(event.target.value)} placeholder="Customer name" />
              </label>
              <Select label="Branch" placeholder="Use selected branch" value={walkInBranchId} onChange={(event) => handleWalkInBranchChange(event.target.value)} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
              <Select label="Service" placeholder={walkInServices.length === 0 ? 'No Service' : 'Use selected service'} value={walkInServiceId} disabled={walkInServices.length === 0} onChange={(event) => handleWalkInServiceChange(event.target.value)} options={walkInServices.map((service) => ({ label: service.name, value: service.id }))} />
              <Button disabled={!walkInPhone.trim() || !walkInName.trim() || !(walkInServiceId || serviceId)} isLoading={walkInMutation.isPending} onClick={() => walkInMutation.mutate()}><Plus className="h-4 w-4" />Add walk-in</Button>
            </div>
            <div className="min-w-0">
              {!serviceId ? <EmptyState title="Select a service to view its queue" description="The branch queue board stays empty until a service is selected." /> : queuesQuery.isLoading ? <LoadingState message="Loading branch queue board..." /> : <BranchQueueBoard queues={branchBoardQueues} entriesByQueueId={allEntriesByQueueId} branches={branches} services={services} selectedQueueId={selectedQueue?.id} onSelect={(queue) => { setSelectedQueue(queue); setSelectedEntry(null); }} />}
            </div>
            <div className="grid max-h-[360px] content-start gap-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
              <div className="grid gap-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Branch summary</h3>
                <div className="grid gap-1.5">
                  {!branchId && branchSummary.length === 0 ? <EmptyState title="No branches" /> : null}
                  {!branchId ? branchSummary.map(({ branch, total, waiting, pending, currentNumber }) => (
                    <button key={branch.id} type="button" className="rounded border border-teal-100 bg-white px-1.5 py-1 text-left shadow-sm hover:border-teal-300" onClick={() => { setBranchId(branch.id); setServiceId(''); }}>
                      <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-900">{branch.name}</span><span className="text-[11px] font-bold text-teal-700">{total}</span></div>
                      <div className="mt-0.5 flex items-center justify-between gap-0.5 text-[9px] text-slate-500"><span>N {currentNumber ?? '---'}</span><span>W {waiting}</span><span>P {pending}</span></div>
                    </button>
                  )) : null}
                  {branchId && selectedBranchSummary ? (
                    <div className="rounded border border-teal-200 bg-white px-1.5 py-1 shadow-sm">
                      <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-900">{selectedBranchSummary.branch.name}</span><span className="text-[11px] font-bold text-teal-700">{selectedBranchSummary.total}</span></div>
                      <div className="mt-0.5 flex items-center justify-between gap-0.5 text-[9px] text-slate-500"><span>N {selectedBranchSummary.currentNumber ?? '---'}</span><span>W {selectedBranchSummary.waiting}</span><span>P {selectedBranchSummary.pending}</span></div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-1.5 border-t border-slate-200 pt-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Service summary</h3>
                <div className="grid gap-1.5">
                  {serviceId && activeService && selectedServiceMetrics ? (
                    <div className="rounded border border-violet-200 bg-white px-1.5 py-1 shadow-sm">
                      <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-900">{activeService.name}</span><span className="text-[11px] font-bold text-violet-700">{selectedServiceMetrics.total}</span></div>
                      <div className="mt-0.5 flex items-center justify-between gap-0.5 text-[9px] text-slate-500"><span>N {selectedServiceQueue?.currentNumber ?? '---'}</span><span>W {selectedServiceMetrics.waiting}</span><span>P {selectedServiceMetrics.pending}</span></div>
                    </div>
                  ) : (
                    <>
                      {serviceSummary.length === 0 ? <EmptyState title={branchId ? 'No Service' : 'No services'} /> : null}
                      {serviceSummary.map(({ service, total, waiting, pending, currentNumber }) => (
                        <button key={service.id} type="button" className="rounded border border-sky-100 bg-white px-1.5 py-1 text-left shadow-sm hover:border-sky-300" onClick={() => { if (service.branchId) setBranchId(service.branchId); setServiceId(service.id); }}>
                          <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-900">{service.name}</span><span className="text-[11px] font-bold text-sky-700">{total}</span></div>
                          <div className="mt-0.5 flex items-center justify-between gap-0.5 text-[9px] text-slate-500"><span>N {currentNumber ?? '---'}</span><span>W {waiting}</span><span>P {pending}</span></div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Queue entries" description="Reserved queue slots and detailed rows for the selected queue." action={<Button disabled={!selectedQueue || !selectedQueue.isActive} isLoading={actionMutation.isPending} onClick={() => actionMutation.mutate('call-next')}><PhoneCall className="h-4 w-4" />Call Next</Button>}>
        {!selectedQueue ? <EmptyState title="Select a queue first" /> : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={selectedQueue.isActive ? 'green' : 'slate'}>{selectedQueue.isActive ? 'OPEN' : 'CLOSED'}</Badge>
              {Object.entries(statusSummary).map(([status, count]) => <Badge key={status} tone="slate">{status}: {count}</Badge>)}
              <Badge tone="teal">Call order: queue number</Badge>
            </div>
            {entriesQuery?.isLoading ? <LoadingState message="Loading queue entries..." /> : null}
            {selectedQueueEntries.length === 0 ? <EmptyState title="No entries in this queue" /> : null}
            {selectedQueueEntries.length > 0 ? <QueueTimeSlotBoard entries={selectedQueueEntries} selectedEntryId={selectedEntry?.id} currentNumber={selectedQueue.currentNumber} actionEntryId={slotApprovalMutation.isPending ? slotApprovalMutation.variables?.entryId : null} onSelect={setSelectedEntry} onConfirm={(entry) => { setSelectedEntry(entry); slotApprovalMutation.mutate({ entryId: entry.id, action: 'confirm' }); }} onReject={(entry) => { setSelectedEntry(entry); slotApprovalMutation.mutate({ entryId: entry.id, action: 'reject' }); }} /> : null}
            <div className="max-h-[360px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              <div className="grid gap-1.5">
                {[...selectedQueueEntries].sort((a, b) => b.queueSequence - a.queueSequence).map((entry) => {
                  const customer = customersQuery.data?.find((item) => item.id === entry.customerId);
                  return <QueueEntryRow key={entry.id} entry={entry} customer={customer} selected={selectedEntry?.id === entry.id} isBusy={slotApprovalMutation.isPending && slotApprovalMutation.variables?.entryId === entry.id} onSelect={() => setSelectedEntry(entry)} onConfirm={() => { setSelectedEntry(entry); slotApprovalMutation.mutate({ entryId: entry.id, action: 'confirm' }); }} onReject={() => { setSelectedEntry(entry); slotApprovalMutation.mutate({ entryId: entry.id, action: 'reject' }); }} onNoShow={() => { setSelectedEntry(entry); slotApprovalMutation.mutate({ entryId: entry.id, action: 'no-show' }); }} />;
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <QueueAppointmentCounter
        appointments={counterAppointments}
        customers={customersQuery.data ?? []}
        branches={branches}
        services={services}
        busyAppointmentId={appointmentCounterMutation.isPending ? appointmentCounterMutation.variables?.appointment.id : null}
        onApprove={(appointment) => appointmentCounterMutation.mutate({ appointment, action: 'approve' })}
        onReject={(appointment) => appointmentCounterMutation.mutate({ appointment, action: 'reject' })}
        onCancel={(appointment) => appointmentCounterMutation.mutate({ appointment, action: 'cancel' })}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-6">
          <SectionCard title="Today queues" description="Click a queue to view entries.">
            <div className="grid gap-3">
              {queuesQuery.isLoading ? <LoadingState message="Loading today queues..." /> : null}
              {queuesQuery.data?.length === 0 ? <EmptyState title="No queues for today" description="Open a queue before customer requests or walk-ins can join." /> : null}
              {queuesQuery.data?.map((queue) => (
                <QueueCard key={queue.id} queue={queue} entries={queuesWithEntries.get(queue.id)} branches={branches} services={services} selected={selectedQueue?.id === queue.id} onSelect={() => { setSelectedQueue(queue); setSelectedEntry(null); }} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
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

          <SectionCard title="Manual operator join" description="Use the selected customer/profile from Queue controls, then create a direct walk-in queue entry.">
            <div className="grid content-start gap-4">
              <Select label="Branch" placeholder="Use current filter" value={joinBranchId} onChange={(event) => handleJoinBranchChange(event.target.value)} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
              <Select label="Service" placeholder={manualJoinServices.length === 0 ? "No Service" : "Use current filter"} value={joinServiceId} disabled={manualJoinServices.length === 0} onChange={(event) => handleJoinServiceChange(event.target.value)} options={manualJoinServices.map((service) => ({ label: service.name, value: service.id }))} />
              <Button disabled={!lookupCustomer || !lookupProfile} isLoading={manualJoinMutation.isPending} onClick={() => manualJoinMutation.mutate()}><Plus className="h-4 w-4" />Add walk-in</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
