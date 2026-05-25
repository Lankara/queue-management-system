'use client';

import Link from 'next/link';
import { CalendarClock, ListOrdered } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { PublicLayout } from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { LanguageSelector } from '@/features/public-queue/language-selector';
import { buildPublicQueueQueryString, getPublicQueueQueryParams } from '@/features/public-queue/public-query-params';
import { getPublicBusiness } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';

export default function PublicBusinessPage() {
  const params = useParams<{ businessSlug: string }>();
  const searchParams = useSearchParams();
  const language = usePublicQueueStore((state) => state.language);
  const setLanguage = usePublicQueueStore((state) => state.setLanguage);
  const setBusiness = usePublicQueueStore((state) => state.setBusiness);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;
  const queueParams = useMemo(() => getPublicQueueQueryParams(searchParams), [searchParams]);
  const queryString = buildPublicQueueQueryString(queueParams);
  const joinHref = `/q/${business?.slug ?? params.businessSlug}/join${queryString}`;
  const appointmentHref = `/q/${business?.slug ?? params.businessSlug}/appointment${queryString}`;

  useEffect(() => { if (business) setBusiness(business); }, [business, setBusiness]);

  if (businessQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading business..." /></PublicLayout>;
  if (!business) return <PublicLayout title="Business not found"><ErrorState message="This QR link is not configured yet." /></PublicLayout>;

  return (
    <PublicLayout title={business.name} subtitle="Choose your language and continue.">
      <Card className="grid gap-5">
        {(queueParams.branchId || queueParams.serviceId) ? <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">This QR code includes a preselected branch or service.</div> : null}
        {(queueParams.invalidBranchId || queueParams.invalidServiceId) ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Some QR link parameters were invalid and will be ignored.</div> : null}
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={joinHref}><Button className="w-full"><ListOrdered className="h-4 w-4" /> Join Queue</Button></Link>
          <Link href={appointmentHref}><Button className="w-full" variant="secondary"><CalendarClock className="h-4 w-4" /> Book Appointment</Button></Link>
        </div>
      </Card>
    </PublicLayout>
  );
}
