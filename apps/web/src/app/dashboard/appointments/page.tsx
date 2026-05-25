'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useMemo, useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { AppointmentActionBar } from '@/features/appointments/appointment-action-bar';
import { AppointmentCard } from '@/features/appointments/appointment-card';
import { AppointmentFilters, AppointmentFilterState } from '@/features/appointments/appointment-filters';
import { AppointmentForm, AppointmentFormValues } from '@/features/appointments/appointment-form';
import { AppointmentHistoryRow } from '@/features/appointments/appointment-history-row';
import { AppointmentStatusBadge } from '@/features/appointments/appointment-status-badge';
import { AppointmentTimeline } from '@/features/appointments/appointment-timeline';
import { QueueAssignmentCard } from '@/features/appointments/queue-assignment-card';
import { ApprovalForm, ApprovalFormValues } from '@/features/appointments/approval-form';
import { RescheduleForm, RescheduleFormValues } from '@/features/appointments/reschedule-form';
import { acceptReschedule, approveAppointment, cancelAppointmentByOperator, getAppointment, listAppointments, listAppointmentTimeChanges, proposeReschedule, rejectAppointment, rejectReschedule, requestAppointment } from '@/features/appointments/appointments.api';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { listBranches } from '@/features/branches/branches.api';
import { listClientProfiles } from '@/features/client-profiles/client-profiles.api';
import { listCustomers } from '@/features/customers/customers.api';
import { listServices } from '@/features/services/services.api';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { ClientProfile, Customer } from '@/types/customer-profile';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

function toIsoFromLocal(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const user = useAuthStore((state) => state.user);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<AppointmentFilterState>({ status: '', branchId: '', serviceId: '', customerId: '', from: '', to: '' });

  const branchesQuery = useQuery({ queryKey: ['branches', businessId], queryFn: () => listBranches(businessId as string), enabled: Boolean(businessId) });
  const servicesQuery = useQuery({ queryKey: ['services', businessId], queryFn: () => listServices(businessId as string), enabled: Boolean(businessId) });
  const customersQuery = useQuery({ queryKey: ['customers', businessId], queryFn: () => listCustomers(businessId as string), enabled: Boolean(businessId) });
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', businessId, filters],
    queryFn: () => listAppointments(businessId as string, {
      status: filters.status as AppointmentStatus || undefined,
      customerId: filters.customerId || undefined,
      serviceId: filters.serviceId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined
    }),
    enabled: Boolean(businessId),
    refetchInterval: 20000
  });
  const selectedAppointmentQuery = useQuery({ queryKey: ['appointment', businessId, selectedAppointment?.id], queryFn: () => getAppointment(businessId as string, selectedAppointment?.id as string), enabled: Boolean(businessId && selectedAppointment?.id), refetchInterval: 15000 });
  const selectedCustomerProfilesQuery = useQuery({ queryKey: ['client-profiles', businessId, selectedAppointment?.customerId], queryFn: () => listClientProfiles(businessId as string, selectedAppointment?.customerId as string), enabled: Boolean(businessId && selectedAppointment?.customerId) });
  const timeChangesQuery = useQuery({ queryKey: ['appointment-time-changes', businessId, selectedAppointment?.id], queryFn: () => listAppointmentTimeChanges(businessId as string, selectedAppointment?.id as string), enabled: Boolean(businessId && selectedAppointment?.id) });

  const branches = branchesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const appointments = useMemo(() => (appointmentsQuery.data ?? []).filter((appointment) => !filters.branchId || appointment.branchId === filters.branchId), [appointmentsQuery.data, filters.branchId]);
  const currentAppointment = selectedAppointmentQuery.data ?? selectedAppointment;
  const currentCustomer = customers.find((customer) => customer.id === currentAppointment?.customerId);
  const currentProfile = selectedCustomerProfilesQuery.data?.find((profile) => profile.id === currentAppointment?.clientProfileId);
  const currentBranch = branches.find((branch) => branch.id === currentAppointment?.branchId);
  const currentService = services.find((service) => service.id === currentAppointment?.serviceId);

  const requestMutation = useMutation({
    mutationFn: (values: AppointmentFormValues) => {
      if (!businessId || !selectedCustomer || !selectedProfile) throw new Error('Select customer and profile first');
      return requestAppointment(businessId, {
        customerId: selectedCustomer.id,
        clientProfileId: selectedProfile.id,
        serviceId: values.serviceId,
        branchId: values.branchId || undefined,
        requestedStartTime: new Date(values.requestedStartTime).toISOString(),
        requestedEndTime: new Date(values.requestedEndTime).toISOString(),
        requestedBy: user?.id
      });
    },
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
      setSelectedAppointment(appointment);
      setMessage('Appointment requested.');
    }
  });
  const actionMutation = useMutation({
    mutationFn: async (action: { type: 'approve'; values: ApprovalFormValues } | { type: 'reject' | 'cancel' | 'accept-reschedule' | 'reject-reschedule' }) => {
      if (!businessId || !currentAppointment) throw new Error('Select appointment first');
      if (action.type === 'approve') return approveAppointment(businessId, currentAppointment.id, { approvedBy: user?.id, approvedStartTime: toIsoFromLocal(action.values.approvedStartTime), approvedEndTime: toIsoFromLocal(action.values.approvedEndTime), source: 'OPERATOR' });
      if (action.type === 'reject') return rejectAppointment(businessId, currentAppointment.id, { reason: 'Rejected by operator' });
      if (action.type === 'cancel') return cancelAppointmentByOperator(businessId, currentAppointment.id, { reason: 'Cancelled by operator' });
      if (action.type === 'accept-reschedule') return acceptReschedule(businessId, currentAppointment.id);
      return rejectReschedule(businessId, currentAppointment.id, { reason: 'Rejected by operator' });
    },
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointment', businessId, appointment.id] });
      setSelectedAppointment(appointment);
      setMessage(`Appointment ${appointment.status.toLowerCase().replaceAll('_', ' ')}.`);
    }
  });
  const rescheduleMutation = useMutation({
    mutationFn: (values: RescheduleFormValues) => {
      if (!businessId || !currentAppointment) throw new Error('Select appointment first');
      return proposeReschedule(businessId, currentAppointment.id, { newStartTime: new Date(values.newStartTime).toISOString(), newEndTime: new Date(values.newEndTime).toISOString(), reason: values.reason, changedBy: user?.id });
    },
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointment-time-changes', businessId, appointment.id] });
      setSelectedAppointment(appointment);
      setMessage('Reschedule proposed.');
    }
  });

  if (!businessId) {
    return <div className="grid gap-6"><PageHeader title="Appointments" description="Manage appointment lifecycle and queue assignment." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Appointments" description="Manage appointment requests, approvals, reschedules, and queue linkage." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[appointmentsQuery.error, requestMutation.error, actionMutation.error, rescheduleMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      <SectionCard title="Filters" description="Appointment list refreshes every 20 seconds.">
        <AppointmentFilters filters={filters} branches={branches} services={services} onChange={setFilters} />
      </SectionCard>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="grid gap-6">
          <SectionCard title="Appointments" description="Click an appointment to manage it.">
            <div className="grid gap-3">
              {appointmentsQuery.isLoading ? <LoadingState message="Loading appointments..." /> : null}
              {appointments.length === 0 && !appointmentsQuery.isLoading ? <EmptyState title="No appointments found" /> : null}
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  customer={customers.find((customer) => customer.id === appointment.customerId)}
                  clientProfile={undefined}
                  branch={branches.find((branch) => branch.id === appointment.branchId)}
                  service={services.find((service) => service.id === appointment.serviceId)}
                  selected={selectedAppointment?.id === appointment.id}
                  onSelect={() => setSelectedAppointment(appointment)}
                />
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Request appointment" description="Operator-side appointment request for an existing customer and client profile.">
            <AppointmentForm businessId={businessId} branches={branches} services={services} selectedCustomer={selectedCustomer} selectedProfile={selectedProfile} onCustomerSelect={(customer) => { setSelectedCustomer(customer); setSelectedProfile(null); }} onProfileSelect={setSelectedProfile} isSubmitting={requestMutation.isPending} onSubmit={(values) => requestMutation.mutate(values)} />
          </SectionCard>
        </div>
        <div className="grid gap-6">
          <SectionCard title="Appointment details" description="Selected appointment lifecycle and queue assignment.">
            {!currentAppointment ? <EmptyState title="Select an appointment" /> : (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center gap-2"><AppointmentStatusBadge status={currentAppointment.status} />{currentAppointment.queueNumber ? <Badge tone="teal">Queue {currentAppointment.queueNumber}</Badge> : <Badge>Queue not assigned</Badge>}{currentAppointment.queueStatus ? <Badge>{currentAppointment.queueStatus}</Badge> : null}</div><AppointmentTimeline status={currentAppointment.status} />
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoRow label="Customer" value={currentCustomer?.primaryPhone ?? currentAppointment.customerId} />
                  <InfoRow label="Client" value={currentProfile?.fullName ?? currentAppointment.clientProfileId} />
                  <InfoRow label="Service" value={currentService?.name ?? currentAppointment.serviceId} />
                  <InfoRow label="Branch" value={currentBranch?.name ?? currentAppointment.branchId} />
                  <InfoRow label="Requested" value={formatDateTime(currentAppointment.requestedStartTime)} />
                  <InfoRow label="Approved" value={formatDateTime(currentAppointment.approvedStartTime)} />
                  <InfoRow label="Queue entry" value={currentAppointment.queueEntryId ?? 'Not linked'} />
                  <InfoRow label="Cancellation reason" value={currentAppointment.cancellationReason} />
                  <InfoRow label="Reschedule reason" value={currentAppointment.rescheduleReason} />
                  <InfoRow label="Created" value={formatDateTime(currentAppointment.createdAt)} />
                  <InfoRow label="Updated" value={formatDateTime(currentAppointment.updatedAt)} />
                </div>
                <QueueAssignmentCard appointment={currentAppointment} branch={currentBranch} service={currentService} /><AppointmentActionBar appointment={currentAppointment} isBusy={actionMutation.isPending} onApprove={() => actionMutation.mutate({ type: 'approve', values: {} })} onReject={() => actionMutation.mutate({ type: 'reject' })} onCancel={() => actionMutation.mutate({ type: 'cancel' })} onAcceptReschedule={() => actionMutation.mutate({ type: 'accept-reschedule' })} onRejectReschedule={() => actionMutation.mutate({ type: 'reject-reschedule' })} />
              </div>
            )}
          </SectionCard>
          <SectionCard title="Approval override" description="Optional approved time override. Leave blank to use requested time.">
            {!currentAppointment ? <EmptyState title="Select an appointment first" /> : <ApprovalForm requestedStartTime={currentAppointment.requestedStartTime} requestedEndTime={currentAppointment.requestedEndTime} isSubmitting={actionMutation.isPending} onSubmit={(values) => actionMutation.mutate({ type: 'approve', values })} />}
          </SectionCard>
          <SectionCard title="Propose reschedule" description="Record a proposed time change for customer acceptance.">
            {!currentAppointment ? <EmptyState title="Select an appointment first" /> : <RescheduleForm isSubmitting={rescheduleMutation.isPending} onSubmit={(values) => rescheduleMutation.mutate(values)} />}
          </SectionCard>
          <SectionCard title="Time change history" description="Appointment reschedule and delay history.">
            {!currentAppointment ? <EmptyState title="Select an appointment first" /> : (
              <div className="grid gap-3">
                {timeChangesQuery.isLoading ? <LoadingState message="Loading time changes..." /> : null}
                {timeChangesQuery.data?.length === 0 ? <EmptyState title="No time changes recorded" /> : null}
                {timeChangesQuery.data?.map((change) => <AppointmentHistoryRow key={change.id} change={change} />)}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

