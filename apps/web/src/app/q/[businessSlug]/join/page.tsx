'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PublicLayout } from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { ClientProfilePicker } from '@/features/public-queue/client-profile-picker';
import { CustomerConfirmationCard } from '@/features/public-queue/customer-confirmation-card';
import { PhoneLookupForm, PhoneLookupValues } from '@/features/public-queue/phone-lookup-form';
import { PublicClientProfileForm, PublicClientProfileFormValues } from '@/features/public-queue/public-client-profile-form';
import { getPublicQueueQueryParams } from '@/features/public-queue/public-query-params';
import { QueueJoinCard } from '@/features/public-queue/queue-join-card';
import {
  confirmPublicQueueEntry,
  createPublicClientProfile,
  createPublicCustomer,
  findPublicCustomerByPhone,
  getPublicBusiness,
  getPublicQueuePosition,
  joinPublicQueueDraft,
  listPublicClientProfiles,
  rejectPublicQueueEntry
} from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';
import { PublicBranchSummary, PublicCustomer, PublicServiceSummary } from '@/types/public-queue';
import { QueueEntry } from '@/types/queue';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return error.message;
  }

  return 'Request failed';
}

function formatQueueStatus(status: string) {
  return status.toLowerCase().replace(/_/g, ' ');
}

function isMainBranch(branch?: PublicBranchSummary) {
  const name = branch?.name?.toLowerCase().trim();
  const code = branch?.code?.toLowerCase().trim();
  return name === 'main' || name === 'main branch' || code === 'main';
}

function serviceBelongsToBranch(service: PublicServiceSummary, branchId: string, branches: PublicBranchSummary[]) {
  if (!branchId) return true;
  if (service.branchId === branchId) return true;
  const branch = branches.find((item) => item.id === branchId);
  return !service.branchId && isMainBranch(branch);
}

function isTodayQueueEntry(entry: QueueEntry) {
  return entry.serviceDate?.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export default function PublicJoinPage() {
  const router = useRouter();
  const params = useParams<{ businessSlug: string }>();
  const searchParams = useSearchParams();
  const queryParams = useMemo(() => getPublicQueueQueryParams(searchParams), [searchParams]);
  const setBusiness = usePublicQueueStore((state) => state.setBusiness);
  const customer = usePublicQueueStore((state) => state.customer);
  const clientProfile = usePublicQueueStore((state) => state.clientProfile);
  const queueEntry = usePublicQueueStore((state) => state.queueEntry);
  const setCustomer = usePublicQueueStore((state) => state.setCustomer);
  const setClientProfile = usePublicQueueStore((state) => state.setClientProfile);
  const setQueueEntry = usePublicQueueStore((state) => state.setQueueEntry);
  const selectedBranchId = usePublicQueueStore((state) => state.selectedBranchId);
  const selectedServiceId = usePublicQueueStore((state) => state.selectedServiceId);
  const setBranchAndService = usePublicQueueStore((state) => state.setBranchAndService);
  const language = usePublicQueueStore((state) => state.language);
  const [phoneForRegistration, setPhoneForRegistration] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<PublicCustomer | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [joinValidationError, setJoinValidationError] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const [preselectedFromQr, setPreselectedFromQr] = useState(false);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;

  useEffect(() => {
    if (!business) return;
    setBusiness(business);

    if (queueEntry && (queueEntry.businessId !== business.id || !isTodayQueueEntry(queueEntry))) {
      setQueueEntry(null);
    }
  }, [business, queueEntry, setBusiness, setQueueEntry]);

  useEffect(() => {
    if (!business) return;

    const matchedBranch = queryParams.branchId ? business.branches.find((branch) => branch.id === queryParams.branchId) : null;
    const matchedService = queryParams.serviceId ? business.services.find((service) => service.id === queryParams.serviceId) : null;
    let nextBranchId = matchedBranch?.id ?? selectedBranchId;
    let nextServiceId = matchedService?.id ?? selectedServiceId;
    const warnings: string[] = [];

    if (queryParams.invalidBranchId) warnings.push('The branch in this QR link is invalid and was ignored.');
    if (queryParams.invalidServiceId) warnings.push('The service in this QR link is invalid and was ignored.');
    if (queryParams.branchId && !matchedBranch) warnings.push('The branch in this QR link is not available.');
    if (queryParams.serviceId && !matchedService) warnings.push('The service in this QR link is not available.');

    if (matchedService?.branchId) {
      const serviceBranch = business.branches.find((branch) => branch.id === matchedService.branchId);
      if (!nextBranchId && serviceBranch) {
        nextBranchId = serviceBranch.id;
      } else if (nextBranchId && nextBranchId !== matchedService.branchId && serviceBranch) {
        nextBranchId = serviceBranch.id;
        warnings.push('The selected service belongs to a different branch, so the service branch was selected.');
      }
    }

    if (!nextBranchId && business.branches.length === 1) nextBranchId = business.branches[0]?.id ?? null;
    if (!nextServiceId && business.services.length === 1) nextServiceId = business.services[0]?.id ?? null;

    setSelectionWarning(warnings.length > 0 ? warnings.join(' ') : null);
    setPreselectedFromQr(Boolean(matchedBranch || matchedService));

    if (nextBranchId !== selectedBranchId || nextServiceId !== selectedServiceId) {
      setBranchAndService(nextBranchId ?? null, nextServiceId ?? null);
    }
  }, [business, queryParams, selectedBranchId, selectedServiceId, setBranchAndService]);

  const profilesQuery = useQuery({ queryKey: ['public-client-profiles', params.businessSlug, customer?.id], queryFn: () => listPublicClientProfiles(params.businessSlug, customer?.id as string), enabled: Boolean(customer?.id) });
  const canUseSavedQueueEntry = Boolean(business && queueEntry && queueEntry.businessId === business.id);
  const queuePositionQuery = useQuery({
    queryKey: ['public-queue-position-before-confirm', params.businessSlug, queueEntry?.id],
    queryFn: () => getPublicQueuePosition(params.businessSlug, queueEntry?.id as string),
    enabled: canUseSavedQueueEntry && queueEntry?.status !== 'DRAFT',
    refetchInterval: 15000
  });
  const phoneMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => findPublicCustomerByPhone(params.businessSlug, values.phone), onMutate: (values) => setPhoneForRegistration(values.phone), onSuccess: setFoundCustomer });
  const customerMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => createPublicCustomer(params.businessSlug, { primaryPhone: values.phone, preferredLanguage: language }), onSuccess: setCustomer });
  const profileMutation = useMutation({ mutationFn: (values: PublicClientProfileFormValues) => createPublicClientProfile(params.businessSlug, customer?.id as string, { ...values, ageYears: values.ageYears === '' ? undefined : Number(values.ageYears) }), onSuccess: (profile) => { setClientProfile(profile); setShowNewProfile(false); } });
  const joinMutation = useMutation({ mutationFn: () => joinPublicQueueDraft(params.businessSlug, { branchId: selectedBranchId ?? undefined, serviceId: selectedServiceId as string, customerId: customer?.id as string, clientProfileId: clientProfile?.id as string, source: 'QR' }), onSuccess: setQueueEntry });
  const confirmMutation = useMutation({
    mutationFn: () => confirmPublicQueueEntry(params.businessSlug, queueEntry?.id as string),
    onSuccess: (entry) => { setQueueEntry(entry); router.push(`/q/${params.businessSlug}/queue/${entry.id}`); }
  });
  const rejectMutation = useMutation({ mutationFn: () => rejectPublicQueueEntry(params.businessSlug, queueEntry?.id as string), onSuccess: () => setQueueEntry(null) });
  const queueStatus = queuePositionQuery.data?.status ?? queueEntry?.status;

  function handleJoinQueue() {
    if (!customer) {
      setJoinValidationError('Enter or register your phone number before joining the queue.');
      return;
    }
    if (!clientProfile) {
      setJoinValidationError('Select or create a client profile before joining the queue.');
      return;
    }
    if (!selectedServiceId) {
      setJoinValidationError('Select a service before joining the queue.');
      return;
    }

    setJoinValidationError(null);
    joinMutation.mutate();
  }

  if (businessQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading business..." /></PublicLayout>;
  if (!business) return <PublicLayout title="Business not found"><ErrorState message="This QR link is not configured yet." /></PublicLayout>;

  return (
    <PublicLayout title={business.name} subtitle="Join the queue in a few quick steps.">
      {[phoneMutation.error, customerMutation.error, profileMutation.error, joinMutation.error, confirmMutation.error, rejectMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      {!customer && !foundCustomer ? <Card className="grid gap-4"><h2 className="font-semibold">Enter your phone number</h2><PhoneLookupForm isLoading={phoneMutation.isPending} onSubmit={(values) => phoneMutation.mutate(values)} />{phoneMutation.isError ? <Button variant="secondary" isLoading={customerMutation.isPending} onClick={() => customerMutation.mutate({ phone: phoneForRegistration })}>Register this phone</Button> : null}</Card> : null}
      {foundCustomer && !customer ? <CustomerConfirmationCard customer={foundCustomer} onConfirm={() => setCustomer(foundCustomer)} onReject={() => setFoundCustomer(null)} /> : null}
      {customer && !clientProfile ? <Card className="grid gap-4"><h2 className="font-semibold">Who is joining?</h2>{profilesQuery.isLoading ? <LoadingState /> : <ClientProfilePicker profiles={profilesQuery.data ?? []} selectedId={undefined} onSelect={setClientProfile} onCreateNew={() => setShowNewProfile(true)} />}{showNewProfile ? <PublicClientProfileForm isLoading={profileMutation.isPending} onSubmit={(values) => profileMutation.mutate(values)} /> : null}</Card> : null}
      {customer && clientProfile && !queueEntry ? <QueueJoinCard business={business} branchId={selectedBranchId ?? ''} serviceId={selectedServiceId ?? ''} error={joinValidationError} warning={selectionWarning} preselectedFromQr={preselectedFromQr} onBranchChange={(nextBranchId) => { setJoinValidationError(null); setSelectionWarning(null); setPreselectedFromQr(false); const selectedService = business.services.find((service) => service.id === selectedServiceId); const nextServiceId = nextBranchId && selectedService && !serviceBelongsToBranch(selectedService, nextBranchId, business.branches) ? null : selectedServiceId; setBranchAndService(nextBranchId || null, nextServiceId); }} onServiceChange={(nextServiceId) => { setJoinValidationError(null); setSelectionWarning(null); setPreselectedFromQr(false); const selectedService = business.services.find((service) => service.id === nextServiceId); setBranchAndService(selectedService?.branchId ?? selectedBranchId, nextServiceId || null); }} isLoading={joinMutation.isPending} onJoin={handleJoinQueue} /> : null}
      {canUseSavedQueueEntry && queueEntry && queueStatus === 'DRAFT' ? <Card className="grid gap-4 text-center"><p className="text-sm text-slate-600">Your queue request number</p><p className="text-5xl font-bold text-slate-950">{queueEntry.queueNumber}</p><div className="grid grid-cols-2 gap-3"><Button isLoading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>Send request</Button><Button variant="secondary" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>Reject</Button></div><Button variant="ghost" onClick={() => setQueueEntry(null)}>Start a new request</Button></Card> : null}
      {canUseSavedQueueEntry && queueEntry && queueStatus && queueStatus !== 'DRAFT' ? <Card className="grid gap-4 text-center"><p className="text-sm text-slate-600">This queue entry is already {formatQueueStatus(queueStatus)}.</p><p className="text-5xl font-bold text-slate-950">{queueEntry.queueNumber}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Button onClick={() => router.push(`/q/${params.businessSlug}/queue/${queueEntry.id}`)}>View status</Button><Button variant="secondary" onClick={() => setQueueEntry(null)}>Start new queue</Button></div></Card> : null}
      <Link className="text-center text-sm text-slate-500" href={`/q/${business.slug}`}>Back to language selection</Link>
    </PublicLayout>
  );
}
