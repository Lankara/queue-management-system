'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { PublicLayout } from '@/components/public/public-layout';
import { Badge } from '@/components/ui/badge';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { QueueStatusCard } from '@/features/public-queue/queue-status-card';
import { getPublicBusiness, getPublicQueuePosition } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';

export default function PublicQueueStatusPage() {
  const params = useParams<{ businessSlug: string; queueEntryId: string }>();
  const queueEntry = usePublicQueueStore((state) => state.queueEntry);
  const clientProfile = usePublicQueueStore((state) => state.clientProfile);
  const selectedServiceId = usePublicQueueStore((state) => state.selectedServiceId);
  const selectedBranchId = usePublicQueueStore((state) => state.selectedBranchId);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;
  const positionQuery = useQuery({ queryKey: ['public-queue-position', params.businessSlug, params.queueEntryId], queryFn: () => getPublicQueuePosition(params.businessSlug, params.queueEntryId), enabled: Boolean(business), refetchInterval: 15000 });

  if (businessQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading business..." /></PublicLayout>;
  if (!business) return <PublicLayout title="Business not found"><ErrorState message="This QR link is not configured yet." /></PublicLayout>;

  const service = business.services.find((item) => item.id === selectedServiceId);
  const branch = business.branches.find((item) => item.id === selectedBranchId);
  return (
    <PublicLayout title={business.name} subtitle="Live queue status refreshes every 15 seconds.">
      {positionQuery.isLoading ? <LoadingState message="Loading queue status..." /> : null}
      {positionQuery.error ? <ErrorState message="Queue entry not found or no longer available." /> : null}
      <QueueStatusCard position={positionQuery.data} />
      <div className="rounded-md bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2"><Badge tone="teal">{positionQuery.data?.status ?? queueEntry?.status ?? 'UNKNOWN'}</Badge><Badge>{service?.name ?? 'Selected service'}</Badge><Badge>{branch?.name ?? 'Selected branch'}</Badge></div>
        <p className="mt-3 text-sm text-slate-600">Client: {clientProfile?.fullName ?? 'This device session'}</p>
      </div>
    </PublicLayout>
  );
}
