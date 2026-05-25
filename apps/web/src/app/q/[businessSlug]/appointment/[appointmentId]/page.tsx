'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { RefreshCcw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PublicLayout } from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { AppointmentStatusCard } from '@/features/public-appointments/appointment-status-card';
import { acceptPublicReschedule, cancelPublicAppointment, getPublicAppointmentStatus, rejectPublicReschedule } from '@/features/public-appointments/public-appointment.api';
import { getPublicBusiness, getPublicQueuePosition } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function PublicAppointmentStatusPage() {
  const params = useParams<{ businessSlug: string; appointmentId: string }>();
  const setAppointmentId = usePublicQueueStore((state) => state.setAppointmentId);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const appointmentQuery = useQuery({ queryKey: ['public-appointment-status', params.businessSlug, params.appointmentId], queryFn: () => getPublicAppointmentStatus(params.businessSlug, params.appointmentId), refetchInterval: 20000 });
  const queuePositionQuery = useQuery({ queryKey: ['public-appointment-queue-position', params.businessSlug, appointmentQuery.data?.queueEntryId], queryFn: () => getPublicQueuePosition(params.businessSlug, appointmentQuery.data?.queueEntryId as string), enabled: Boolean(appointmentQuery.data?.queueEntryId), refetchInterval: 20000 });
  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!window.confirm('Cancel this appointment request?')) throw new Error('Cancellation stopped');
      return cancelPublicAppointment(params.businessSlug, params.appointmentId, 'Cancelled by customer');
    },
    onSuccess: () => appointmentQuery.refetch()
  });
  const acceptRescheduleMutation = useMutation({
    mutationFn: () => acceptPublicReschedule(params.businessSlug, params.appointmentId),
    onSuccess: () => appointmentQuery.refetch()
  });
  const rejectRescheduleMutation = useMutation({
    mutationFn: (reason?: string) => rejectPublicReschedule(params.businessSlug, params.appointmentId, reason),
    onSuccess: () => appointmentQuery.refetch()
  });

  if (businessQuery.isLoading || appointmentQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading appointment status..." /></PublicLayout>;
  if (!businessQuery.data) return <PublicLayout title="Business not found"><ErrorState message="This appointment link is not available." /></PublicLayout>;

  return (
    <PublicLayout title={businessQuery.data.name} subtitle="Appointment status refreshes every 20 seconds.">
      {appointmentQuery.isFetching ? <p className="text-center text-xs text-slate-500">Refreshing status...</p> : null}
      {appointmentQuery.error ? <ErrorState message={getErrorMessage(appointmentQuery.error)} /> : null}
      {cancelMutation.error && getErrorMessage(cancelMutation.error) !== 'Cancellation stopped' ? <ErrorState message={getErrorMessage(cancelMutation.error)} /> : null}
      {acceptRescheduleMutation.error ? <ErrorState message={getErrorMessage(acceptRescheduleMutation.error)} /> : null}
      {rejectRescheduleMutation.error ? <ErrorState message={getErrorMessage(rejectRescheduleMutation.error)} /> : null}
      {acceptRescheduleMutation.isSuccess ? <p className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">New appointment time accepted.</p> : null}
      {rejectRescheduleMutation.isSuccess ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">Proposed appointment time rejected.</p> : null}
      {appointmentQuery.data ? (
        <AppointmentStatusCard
          appointment={appointmentQuery.data}
          queuePosition={queuePositionQuery.data}
          isCancelling={cancelMutation.isPending}
          onCancel={() => cancelMutation.mutate()}
          isUpdatingReschedule={acceptRescheduleMutation.isPending || rejectRescheduleMutation.isPending}
          onAcceptReschedule={() => acceptRescheduleMutation.mutate()}
          onRejectReschedule={(reason) => rejectRescheduleMutation.mutate(reason)}
        />
      ) : null}
      <Card className="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => { appointmentQuery.refetch(); queuePositionQuery.refetch(); }}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
        <Link href={`/q/${params.businessSlug}`}><Button className="w-full" variant="secondary" onClick={() => setAppointmentId(null)}>Back to self-service</Button></Link>
      </Card>
    </PublicLayout>
  );
}
