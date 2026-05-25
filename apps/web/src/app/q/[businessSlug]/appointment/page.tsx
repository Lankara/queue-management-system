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
import { AppointmentRequestForm } from '@/features/public-appointments/appointment-request-form';
import { requestPublicAppointment } from '@/features/public-appointments/public-appointment.api';
import { ClientProfilePicker } from '@/features/public-queue/client-profile-picker';
import { CustomerConfirmationCard } from '@/features/public-queue/customer-confirmation-card';
import { LanguageSelector } from '@/features/public-queue/language-selector';
import { PhoneLookupForm, PhoneLookupValues } from '@/features/public-queue/phone-lookup-form';
import { PublicClientProfileForm, PublicClientProfileFormValues } from '@/features/public-queue/public-client-profile-form';
import { getPublicQueueQueryParams } from '@/features/public-queue/public-query-params';
import { createPublicClientProfile, createPublicCustomer, findPublicCustomerByPhone, getPublicBusiness, listPublicClientProfiles } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';
import { PublicCustomer } from '@/types/public-queue';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutesLocal(value: string, minutes: number) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return toDatetimeLocal(date);
}

export default function PublicAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ businessSlug: string }>();
  const searchParams = useSearchParams();
  const queryParams = useMemo(() => getPublicQueueQueryParams(searchParams), [searchParams]);
  const setBusiness = usePublicQueueStore((state) => state.setBusiness);
  const language = usePublicQueueStore((state) => state.language);
  const setLanguage = usePublicQueueStore((state) => state.setLanguage);
  const customer = usePublicQueueStore((state) => state.customer);
  const clientProfile = usePublicQueueStore((state) => state.clientProfile);
  const setCustomer = usePublicQueueStore((state) => state.setCustomer);
  const setClientProfile = usePublicQueueStore((state) => state.setClientProfile);
  const selectedBranchId = usePublicQueueStore((state) => state.selectedBranchId);
  const selectedServiceId = usePublicQueueStore((state) => state.selectedServiceId);
  const setBranchAndService = usePublicQueueStore((state) => state.setBranchAndService);
  const setAppointmentId = usePublicQueueStore((state) => state.setAppointmentId);
  const [phoneForRegistration, setPhoneForRegistration] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<PublicCustomer | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const [preselectedFromQr, setPreselectedFromQr] = useState(false);
  const [startTime, setStartTime] = useState(() => toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const businessQuery = useQuery({ queryKey: ['public-business', params.businessSlug], queryFn: () => getPublicBusiness(params.businessSlug) });
  const business = businessQuery.data;
  const selectedService = business?.services.find((service) => service.id === selectedServiceId);
  const durationMinutes = selectedService?.durationMinutes ?? 15;
  const endTime = addMinutesLocal(startTime, durationMinutes);

  useEffect(() => { if (business) setBusiness(business); }, [business, setBusiness]);

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
      if (!nextBranchId && serviceBranch) nextBranchId = serviceBranch.id;
      if (nextBranchId && nextBranchId !== matchedService.branchId && serviceBranch) {
        nextBranchId = serviceBranch.id;
        warnings.push('The selected service belongs to a different branch, so the service branch was selected.');
      }
    }
    if (!nextBranchId && business.branches.length === 1) nextBranchId = business.branches[0]?.id ?? null;
    if (!nextServiceId && business.services.length === 1) nextServiceId = business.services[0]?.id ?? null;
    setSelectionWarning(warnings.length > 0 ? warnings.join(' ') : null);
    setPreselectedFromQr(Boolean(matchedBranch || matchedService));
    if (nextBranchId !== selectedBranchId || nextServiceId !== selectedServiceId) setBranchAndService(nextBranchId ?? null, nextServiceId ?? null);
  }, [business, queryParams, selectedBranchId, selectedServiceId, setBranchAndService]);

  const profilesQuery = useQuery({ queryKey: ['public-client-profiles', params.businessSlug, customer?.id], queryFn: () => listPublicClientProfiles(params.businessSlug, customer?.id as string), enabled: Boolean(customer?.id) });
  const phoneMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => findPublicCustomerByPhone(params.businessSlug, values.phone), onMutate: (values) => setPhoneForRegistration(values.phone), onSuccess: setFoundCustomer });
  const customerMutation = useMutation({ mutationFn: (values: PhoneLookupValues) => createPublicCustomer(params.businessSlug, { primaryPhone: values.phone, preferredLanguage: language }), onSuccess: setCustomer });
  const profileMutation = useMutation({ mutationFn: (values: PublicClientProfileFormValues) => createPublicClientProfile(params.businessSlug, customer?.id as string, { ...values, ageYears: values.ageYears === '' ? undefined : Number(values.ageYears) }), onSuccess: (profile) => { setClientProfile(profile); setShowNewProfile(false); } });
  const appointmentMutation = useMutation({
    mutationFn: () => requestPublicAppointment(params.businessSlug, { branchId: selectedBranchId ?? undefined, serviceId: selectedServiceId as string, customerId: customer?.id as string, clientProfileId: clientProfile?.id as string, requestedStartTime: new Date(startTime).toISOString(), requestedEndTime: new Date(endTime).toISOString() }),
    onSuccess: (appointment) => { setAppointmentId(appointment.appointmentId); router.push(`/q/${params.businessSlug}/appointment/${appointment.appointmentId}`); }
  });

  function submitAppointment() {
    if (!customer) return setFormError('Enter or register your phone number before booking.');
    if (!clientProfile) return setFormError('Select or create a client profile before booking.');
    if (!selectedServiceId) return setFormError('Select a service before booking.');
    if (!startTime || !endTime || new Date(endTime).getTime() <= new Date(startTime).getTime()) return setFormError('Select a valid appointment time.');
    setFormError(null);
    appointmentMutation.mutate();
  }

  if (businessQuery.isLoading) return <PublicLayout title="Loading"><LoadingState message="Loading business..." /></PublicLayout>;
  if (!business) return <PublicLayout title="Business not found"><ErrorState message="This QR link is not configured yet." /></PublicLayout>;

  return (
    <PublicLayout title={business.name} subtitle="Request an appointment for staff approval.">
      {[phoneMutation.error, customerMutation.error, profileMutation.error, appointmentMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      <Card className="grid gap-4"><LanguageSelector value={language} onChange={setLanguage} /></Card>
      {!customer && !foundCustomer ? <Card className="grid gap-4"><h2 className="font-semibold">Enter your phone number</h2><PhoneLookupForm isLoading={phoneMutation.isPending} onSubmit={(values) => phoneMutation.mutate(values)} />{phoneMutation.isError ? <Button variant="secondary" isLoading={customerMutation.isPending} onClick={() => customerMutation.mutate({ phone: phoneForRegistration })}>Register this phone</Button> : null}</Card> : null}
      {foundCustomer && !customer ? <CustomerConfirmationCard customer={foundCustomer} onConfirm={() => setCustomer(foundCustomer)} onReject={() => setFoundCustomer(null)} /> : null}
      {customer && !clientProfile ? <Card className="grid gap-4"><h2 className="font-semibold">Who is the appointment for?</h2>{profilesQuery.isLoading ? <LoadingState /> : <ClientProfilePicker profiles={profilesQuery.data ?? []} selectedId={undefined} onSelect={setClientProfile} onCreateNew={() => setShowNewProfile(true)} />}{showNewProfile ? <PublicClientProfileForm isLoading={profileMutation.isPending} onSubmit={(values) => profileMutation.mutate(values)} /> : null}</Card> : null}
      {customer && clientProfile ? <AppointmentRequestForm business={business} branchId={selectedBranchId ?? ''} serviceId={selectedServiceId ?? ''} startTime={startTime} endTime={endTime} error={formError} warning={selectionWarning} preselectedFromQr={preselectedFromQr} onBranchChange={(branchId) => { setFormError(null); setSelectionWarning(null); setPreselectedFromQr(false); setBranchAndService(branchId || null, selectedServiceId); }} onServiceChange={(serviceId) => { setFormError(null); setSelectionWarning(null); setPreselectedFromQr(false); setBranchAndService(selectedBranchId, serviceId || null); }} onStartTimeChange={setStartTime} isLoading={appointmentMutation.isPending} onSubmit={submitAppointment} /> : null}
      <Link className="text-center text-sm text-slate-500" href={`/q/${business.slug}`}>Back</Link>
    </PublicLayout>
  );
}
