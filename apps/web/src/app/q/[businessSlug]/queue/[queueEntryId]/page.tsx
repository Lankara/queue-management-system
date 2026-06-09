'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { PublicLayout } from '@/components/public/public-layout';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { QueueStatusCard } from '@/features/public-queue/queue-status-card';
import { getPublicBusiness, getPublicQueuePosition } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';

export default function PublicQueueStatusPage() {
  const params = useParams<{ businessSlug: string; queueEntryId: string }>();
  const queryClient = useQueryClient();
  const [manualCheckMessage, setManualCheckMessage] = useState<string | null>(null);
  const queueEntry = usePublicQueueStore((state) => state.queueEntry);
  const setQueueEntry = usePublicQueueStore((state) => state.setQueueEntry);
  const clientProfile = usePublicQueueStore((state) => state.clientProfile);
  const selectedServiceId = usePublicQueueStore((state) => state.selectedServiceId);
  const selectedBranchId = usePublicQueueStore((state) => state.selectedBranchId);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;
  const positionQueryKey = ['public-queue-position', params.businessSlug, params.queueEntryId] as const;
  const positionQuery = useQuery({ queryKey: positionQueryKey, queryFn: () => getPublicQueuePosition(params.businessSlug, params.queueEntryId), enabled: Boolean(business), refetchInterval: 15000, retry: false });
  const manualPositionCheck = useMutation({
    mutationFn: () => getPublicQueuePosition(params.businessSlug, params.queueEntryId, { logNotification: true }),
    onSuccess: (position) => {
      queryClient.setQueryData(positionQueryKey, position);
      setManualCheckMessage(`Current serving number: ${position.currentServingNumber ?? 'Not started yet'}. WhatsApp update queued if messaging is enabled.`);
    },
    onError: () => setManualCheckMessage('Could not check the current serving number. Please try again.')
  });

  if (businessQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading business..." /></PublicLayout>;
  if (!business) return <PublicLayout title="Business not found"><ErrorState message="This QR link is not configured yet." /></PublicLayout>;

  const service = business.services.find((item) => item.id === selectedServiceId);
  const branch = business.branches.find((item) => item.id === selectedBranchId);
  const displayPosition = positionQuery.data;
  const isMissingLiveEntry = Boolean(positionQuery.error);

  return (
    <PublicLayout title={business.name} subtitle="Live queue status refreshes every 15 seconds.">
      {positionQuery.isLoading ? <LoadingState message="Loading queue status..." /> : null}
      {isMissingLiveEntry ? (
        <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <ErrorState message="Queue entry not found or no longer available." />
          <Link className="text-sm font-semibold text-teal-700 underline" href={`/q/${params.businessSlug}/join`} onClick={() => setQueueEntry(null)}>Start a new queue request</Link>
        </div>
      ) : null}
      <div className="rounded-md border border-teal-100 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => manualPositionCheck.mutate()}
          disabled={manualPositionCheck.isPending || isMissingLiveEntry}
          className="w-full rounded-md bg-teal-700 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {manualPositionCheck.isPending ? 'Checking...' : 'Check current serving number'}
        </button>
        <p className="mt-2 text-center text-sm text-slate-600">
          {manualCheckMessage ?? 'Tap to refresh this screen now. If WhatsApp is enabled, a position update message will be queued.'}
        </p>
      </div>
      <QueueStatusCard position={displayPosition} />
      <div className="rounded-md bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2"><Badge tone="teal">{displayPosition?.status ?? queueEntry?.status ?? 'UNKNOWN'}</Badge><Badge>{service?.name ?? 'Selected service'}</Badge><Badge>{branch?.name ?? 'Selected branch'}</Badge></div>
        <p className="mt-3 text-sm text-slate-600">Client: {clientProfile?.fullName ?? 'This device session'}</p>
      </div>
    </PublicLayout>
  );
}