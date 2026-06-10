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
import { CurrentQueueBookingsCard } from '@/features/public-queue/current-queue-bookings-card';
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
import { QueueEntry, QueuePosition } from '@/types/queue';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    if (error.response?.status === 404) return 'This saved customer session is no longer valid for this business. Please enter your phone number again.';
    return error.message;
  }

  return 'Request failed';
}

function isAxiosStatus(error: unknown, status: number) {
  return error instanceof AxiosError && error.response?.status === status;
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
  const storedBusiness = usePublicQueueStore((state) => state.business);
  const customer = usePublicQueueStore((state) => state.customer);
  const clientProfile = usePublicQueueStore((state) => state.clientProfile);
  const queueEntry = usePublicQueueStore((state) => state.queueEntry);
  const queueBookings = usePublicQueueStore((state) => state.queueBookings ?? []);
  const setCustomer = usePublicQueueStore((state) => state.setCustomer);
  const setClientProfile = usePublicQueueStore((state) => state.setClientProfile);
  const setQueueEntry = usePublicQueueStore((state) => state.setQueueEntry);
  const addQueueBooking = usePublicQueueStore((state) => state.addQueueBooking);
  const removeQueueBooking = usePublicQueueStore((state) => state.removeQueueBooking);
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
  const [bookingPositions, setBookingPositions] = useState<Record<string, QueuePosition | undefined>>({});
  const [bookingCheckMessage, setBookingCheckMessage] = useState<string | null>(null);
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;
  const isCurrentBusinessSession = Boolean(business && storedBusiness?.id === business.id);
  const currentCustomer = isCurrentBusinessSession ? customer : null;
  const currentClientProfile = isCurrentBusinessSession ? clientProfile : null;
  const currentQueueEntry = isCurrentBusinessSession ? queueEntry : null;

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

  const profilesQuery = useQuery({ queryKey: ['public-client-profiles', params.businessSlug, currentCustomer?.id], queryFn: () => listPublicClientProfiles(params.businessSlug, currentCustomer?.id as string), enabled: Boolean(currentCustomer?.id) });
  const canUseSavedQueueEntry = Boolean(business && currentQueueEntry && currentQueueEntry.businessId === business.id);
  const queuePositionQuery = useQuery({
    queryKey: ['public-queue-position-before-confirm', params.businessSlug, currentQueueEntry?.id],
    queryFn: () => getPublicQueuePosition(params.businessSlug, currentQueueEntry?.id as string),
    enabled: canUseSavedQueueEntry && currentQueueEntry?.status !== 'DRAFT',
    refetchInterval: 15000
  });
  const phoneMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => findPublicCustomerByPhone(params.businessSlug, values.phone), onMutate: (values) => setPhoneForRegistration(values.phone), onSuccess: setFoundCustomer });
  const customerMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => createPublicCustomer(params.businessSlug, { primaryPhone: values.phone, preferredLanguage: language }), onSuccess: setCustomer });
  const profileMutation = useMutation({ mutationFn: (values: PublicClientProfileFormValues) => createPublicClientProfile(params.businessSlug, currentCustomer?.id as string, { ...values, ageYears: values.ageYears === '' ? undefined : Number(values.ageYears) }), onSuccess: (profile) => { setClientProfile(profile); setShowNewProfile(false); } });
  const joinMutation = useMutation({
    mutationFn: () => joinPublicQueueDraft(params.businessSlug, { branchId: selectedBranchId ?? undefined, serviceId: selectedServiceId as string, customerId: currentCustomer?.id as string, clientProfileId: currentClientProfile?.id as string, source: 'QR' }),
    onSuccess: (entry) => {
      setQueueEntry(entry);
      addQueueBooking(entry, params.businessSlug);
    },
    onError: (error) => {
      if (isAxiosStatus(error, 404)) {
        setCustomer(null);
        setClientProfile(null);
        setQueueEntry(null);
      }
    }
  });
  const confirmMutation = useMutation({
    mutationFn: () => confirmPublicQueueEntry(params.businessSlug, currentQueueEntry?.id as string),
    onSuccess: (entry) => { setQueueEntry(entry); addQueueBooking(entry, params.businessSlug); router.push(`/q/${params.businessSlug}/queue/${entry.id}`); }
  });
  const rejectMutation = useMutation({ mutationFn: () => rejectPublicQueueEntry(params.businessSlug, currentQueueEntry?.id as string), onSuccess: () => { if (currentQueueEntry?.id) removeQueueBooking(currentQueueEntry.id); setQueueEntry(null); } });
  const bookingCheckMutation = useMutation({
    mutationFn: (entryId: string) => getPublicQueuePosition(params.businessSlug, entryId, { logNotification: true }),
    onSuccess: (position, entryId) => {
      setBookingPositions((current) => ({ ...current, [entryId]: position }));
      setBookingCheckMessage(`Ongoing number: ${position.currentServingNumber ?? 'Not started yet'}.`);
    },
    onError: (error, entryId) => {
      if (isAxiosStatus(error, 404)) removeQueueBooking(entryId);
      setBookingCheckMessage('Could not refresh that booking. It may no longer be active.');
    }
  });
  const queueStatus = queuePositionQuery.data?.status ?? currentQueueEntry?.status;
  const appointmentQuery = new URLSearchParams();
  if (selectedBranchId) appointmentQuery.set('branchId', selectedBranchId);
  if (selectedServiceId) appointmentQuery.set('serviceId', selectedServiceId);
  const appointmentHref = `/q/${params.businessSlug}/appointment${appointmentQuery.toString() ? `?${appointmentQuery.toString()}` : ''}`;

  useEffect(() => {
    if (isAxiosStatus(profilesQuery.error, 404)) {
      setCustomer(null);
      setClientProfile(null);
      setQueueEntry(null);
    }
  }, [profilesQuery.error, setClientProfile, setCustomer, setQueueEntry]);

  function handleJoinQueue() {
    if (!currentCustomer) {
      setJoinValidationError('Enter or register your phone number before joining the queue.');
      return;
    }
    if (!currentClientProfile) {
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
      {queueBookings.length > 0 ? <CurrentQueueBookingsCard business={business} bookings={queueBookings} positions={bookingPositions} checkingId={bookingCheckMutation.isPending ? bookingCheckMutation.variables : null} onCheck={(booking) => bookingCheckMutation.mutate(booking.id)} /> : null}
      {bookingCheckMessage ? <Card className="p-3 text-center text-sm text-teal-800">{bookingCheckMessage}</Card> : null}
      {!currentCustomer && !foundCustomer ? <Card className="grid gap-4"><h2 className="font-semibold">Enter your phone number</h2><PhoneLookupForm isLoading={phoneMutation.isPending} onSubmit={(values) => phoneMutation.mutate(values)} />{phoneMutation.isError ? <Button variant="secondary" isLoading={customerMutation.isPending} onClick={() => customerMutation.mutate({ phone: phoneForRegistration })}>Register this phone</Button> : null}</Card> : null}
      {foundCustomer && !currentCustomer ? <CustomerConfirmationCard customer={foundCustomer} onConfirm={() => setCustomer(foundCustomer)} onReject={() => setFoundCustomer(null)} /> : null}
      {currentCustomer && !currentClientProfile ? <Card className="grid gap-4"><h2 className="font-semibold">Who is joining?</h2>{profilesQuery.isLoading ? <LoadingState /> : <ClientProfilePicker profiles={profilesQuery.data ?? []} selectedId={undefined} onSelect={setClientProfile} onCreateNew={() => setShowNewProfile(true)} />}{showNewProfile ? <PublicClientProfileForm isLoading={profileMutation.isPending} onSubmit={(values) => profileMutation.mutate(values)} /> : null}</Card> : null}
      {currentCustomer && currentClientProfile && !currentQueueEntry ? <QueueJoinCard business={business} branchId={selectedBranchId ?? ''} serviceId={selectedServiceId ?? ''} error={joinValidationError} warning={selectionWarning} preselectedFromQr={preselectedFromQr} appointmentHref={appointmentHref} onBranchChange={(nextBranchId) => { setJoinValidationError(null); setSelectionWarning(null); setPreselectedFromQr(false); const selectedService = business.services.find((service) => service.id === selectedServiceId); const nextServiceId = nextBranchId && selectedService && !serviceBelongsToBranch(selectedService, nextBranchId, business.branches) ? null : selectedServiceId; setBranchAndService(nextBranchId || null, nextServiceId); }} onServiceChange={(nextServiceId) => { setJoinValidationError(null); setSelectionWarning(null); setPreselectedFromQr(false); const selectedService = business.services.find((service) => service.id === nextServiceId); setBranchAndService(selectedService?.branchId ?? selectedBranchId, nextServiceId || null); }} isLoading={joinMutation.isPending} onJoin={handleJoinQueue} /> : null}
      {canUseSavedQueueEntry && currentQueueEntry && queueStatus === 'DRAFT' ? <Card className="grid gap-4 text-center"><p className="text-sm text-slate-600">Your queue request number</p><p className="text-5xl font-bold text-slate-950">{currentQueueEntry.queueNumber}</p><div className="grid grid-cols-2 gap-3"><Button isLoading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>Send request</Button><Button variant="secondary" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>Reject</Button></div><Button variant="ghost" onClick={() => setQueueEntry(null)}>Start a new request</Button></Card> : null}
      {canUseSavedQueueEntry && currentQueueEntry && queueStatus && queueStatus !== 'DRAFT' ? <Card className="grid gap-4 text-center"><p className="text-sm text-slate-600">This queue entry is already {formatQueueStatus(queueStatus)}.</p><p className="text-5xl font-bold text-slate-950">{currentQueueEntry.queueNumber}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Button onClick={() => router.push(`/q/${params.businessSlug}/queue/${currentQueueEntry.id}`)}>View status</Button><Button variant="secondary" onClick={() => setQueueEntry(null)}>Start new queue</Button></div></Card> : null}
      <Link className="text-center text-sm text-slate-500" href={`/q/${business.slug}`}>Back to language selection</Link>
    </PublicLayout>
  );
}
