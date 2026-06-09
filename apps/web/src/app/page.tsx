'use client';

import { ArrowRight, CalendarClock, Flag, HeartPulse, Loader2, LogIn, MapPin, QrCode, Scissors, Search, Sparkles, Store, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { searchPublicBusinesses } from '@/features/public-directory/public-directory.api';
import { getPublicBusiness, rejectPublicQueueEntry } from '@/features/public-queue/public-queue.api';
import { usePublicQueueStore } from '@/store/public-queue-store';
import { PublicDirectoryBusiness } from '@/types/public-directory';
import { PublicBusiness, PublicBranchSummary, PublicServiceSummary } from '@/types/public-queue';

const businessTypeOptions = [
  { label: 'All', value: 'ALL', icon: Search },
  { label: 'Medical centers', value: 'MEDICAL_CENTER', icon: HeartPulse },
  { label: 'Doctors', value: 'DOCTOR', icon: CalendarClock },
  { label: 'Clinics', value: 'CLINIC', icon: HeartPulse },
  { label: 'Hospitals', value: 'HOSPITAL', icon: HeartPulse },
  { label: 'Barber shops', value: 'BARBER_SHOP', icon: Scissors },
  { label: 'Beauty salons', value: 'BEAUTY_PARLOUR', icon: Sparkles },
  { label: 'Salons', value: 'SALON', icon: Users },
  { label: 'Service shops', value: 'SERVICE_SHOP', icon: Store }
];

const mapPositions = [
  { left: '18%', top: '28%' },
  { left: '36%', top: '42%' },
  { left: '62%', top: '24%' },
  { left: '76%', top: '52%' },
  { left: '28%', top: '68%' },
  { left: '52%', top: '64%' },
  { left: '84%', top: '32%' },
  { left: '12%', top: '54%' }
];

function getTypeLabel(type: string) {
  return businessTypeOptions.find((option) => option.value === type)?.label.replace(/s$/, '') ?? type.replace(/_/g, ' ');
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function uniqueBusinesses(items: PublicDirectoryBusiness[]) {
  const bySlug = new Map<string, PublicDirectoryBusiness>();
  items.forEach((item) => {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  });
  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
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

function buildPublicHref(businessSlug: string, path: 'join' | 'appointment', branchId: string, serviceId: string) {
  const params = new URLSearchParams();
  if (branchId) params.set('branchId', branchId);
  if (serviceId) params.set('serviceId', serviceId);
  const query = params.toString();
  return `/q/${businessSlug}/${path}${query ? `?${query}` : ''}`;
}

function CustomerFinder({ businesses, selectedSlug, selectedBusiness, selectedBranchId, selectedServiceId, isBusinessLoading, onBusinessChange, onBranchChange, onServiceChange }: {
  businesses: PublicDirectoryBusiness[];
  selectedSlug: string;
  selectedBusiness: PublicBusiness | null;
  selectedBranchId: string;
  selectedServiceId: string;
  isBusinessLoading: boolean;
  onBusinessChange: (slug: string) => void;
  onBranchChange: (branchId: string) => void;
  onServiceChange: (serviceId: string) => void;
}) {
  const queueEntry = usePublicQueueStore((state) => state.queueEntry);
  const setQueueEntry = usePublicQueueStore((state) => state.setQueueEntry);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const filteredServices = selectedBusiness ? (selectedBranchId ? selectedBusiness.services.filter((service) => serviceBelongsToBranch(service, selectedBranchId, selectedBusiness.branches)) : selectedBusiness.services) : [];
  const canContinue = Boolean(selectedBusiness && selectedServiceId);
  const savedQueueEntryForSelectedBusiness = Boolean(selectedBusiness && queueEntry && queueEntry.businessId === selectedBusiness.id);
  const queueStatusHref = selectedBusiness && savedQueueEntryForSelectedBusiness && queueEntry ? `/q/${selectedBusiness.slug}/queue/${queueEntry.id}` : '';

  async function cancelDraftBooking() {
    if (!selectedBusiness || !queueEntry || queueEntry.businessId !== selectedBusiness.id) return;
    try {
      await rejectPublicQueueEntry(selectedBusiness.slug, queueEntry.id);
      setQueueEntry(null);
      setCancelMessage('Your draft queue booking was cancelled.');
    } catch {
      setCancelMessage('This booking could not be cancelled here. Please contact the counter if it is already confirmed.');
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Find your queue</h2>
          <p className="mt-1 text-sm text-slate-600">Select business, branch, and service. Then join the live queue or book an appointment.</p>
        </div>
        {isBusinessLoading ? <Loader2 className="h-5 w-5 animate-spin text-teal-700" /> : null}
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          <span>Business</span>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={selectedSlug} onChange={(event) => onBusinessChange(event.target.value)}>
            <option value="">Select business</option>
            {businesses.map((business) => <option key={business.slug} value={business.slug}>{business.name} - {getTypeLabel(business.businessType)}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          <span>Branch</span>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={selectedBranchId} disabled={!selectedBusiness} onChange={(event) => onBranchChange(event.target.value)}>
            <option value="">All branches</option>
            {selectedBusiness?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          <span>Service / Queue</span>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" value={selectedServiceId} disabled={!selectedBusiness || filteredServices.length === 0} onChange={(event) => onServiceChange(event.target.value)}>
            <option value="">{filteredServices.length === 0 ? 'No Service' : 'Select service'}</option>
            {filteredServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {selectedBusiness ? (
          <Link aria-disabled={!canContinue} className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${canContinue ? 'bg-teal-700 text-white hover:bg-teal-800' : 'pointer-events-none bg-slate-200 text-slate-500'}`} href={canContinue ? buildPublicHref(selectedBusiness.slug, 'join', selectedBranchId, selectedServiceId) : '#'}>
            <QrCode className="h-4 w-4" />Join ongoing queue
          </Link>
        ) : <button className="h-12 rounded-md bg-slate-200 text-sm font-semibold text-slate-500" disabled>Join ongoing queue</button>}
        {selectedBusiness ? (
          <Link aria-disabled={!canContinue} className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${canContinue ? 'bg-slate-950 text-white hover:bg-slate-800' : 'pointer-events-none bg-slate-200 text-slate-500'}`} href={canContinue ? buildPublicHref(selectedBusiness.slug, 'appointment', selectedBranchId, selectedServiceId) : '#'}>
            <CalendarClock className="h-4 w-4" />Book appointment
          </Link>
        ) : <button className="h-12 rounded-md bg-slate-200 text-sm font-semibold text-slate-500" disabled>Book appointment</button>}
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">Already booked on this device?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {queueStatusHref ? <Link className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-teal-700 ring-1 ring-teal-200" href={queueStatusHref}>Check ongoing number <ArrowRight className="h-3.5 w-3.5" /></Link> : <span className="text-xs text-slate-500">No active queue booking saved on this device.</span>}
          {savedQueueEntryForSelectedBusiness && queueEntry ? <button type="button" onClick={cancelDraftBooking} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200"><XCircle className="h-3.5 w-3.5" />Cancel booking</button> : null}
        </div>
        {cancelMessage ? <p className="mt-2 text-xs text-slate-600">{cancelMessage}</p> : null}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [businessType, setBusinessType] = useState('ALL');
  const [directoryBusinesses, setDirectoryBusinesses] = useState<PublicDirectoryBusiness[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<PublicBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const businessOptions = useMemo(() => uniqueBusinesses(directoryBusinesses), [directoryBusinesses]);
  const visibleBusinesses = businessOptions.slice(0, 8);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);
    searchPublicBusinesses({ query: debouncedQuery, businessType })
      .then((data) => {
        if (!mounted) return;
        const safeData = Array.isArray(data) ? data : [];
        setDirectoryBusinesses(safeData);
        if (!selectedSlug && safeData[0]?.slug) setSelectedSlug(safeData[0].slug);
      })
      .catch(() => {
        if (!mounted) return;
        setDirectoryBusinesses([]);
        setError('Could not load available businesses. Please try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [businessType, debouncedQuery, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedBusiness(null);
      return;
    }
    let mounted = true;
    setIsBusinessLoading(true);
    getPublicBusiness(selectedSlug)
      .then((business) => {
        if (!mounted) return;
        setSelectedBusiness(business);
        setSelectedBranchId((current) => current && business.branches.some((branch) => branch.id === current) ? current : business.branches[0]?.id ?? '');
        setSelectedServiceId('');
      })
      .catch(() => {
        if (!mounted) return;
        setSelectedBusiness(null);
      })
      .finally(() => {
        if (mounted) setIsBusinessLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedSlug]);

  function handleBusinessChange(slug: string) {
    setSelectedSlug(slug);
    setSelectedBranchId('');
    setSelectedServiceId('');
  }

  function handleBranchChange(branchId: string) {
    setSelectedBranchId(branchId);
    setSelectedServiceId('');
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-24" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-teal-950/85" />
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <nav className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-400 text-slate-950"><Store className="h-5 w-5" /></span>
              Queue Management System
            </div>
            <div className="flex items-center gap-2">
              <Link className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10" href="/login"><LogIn className="h-3.5 w-3.5" />Business login</Link>
              <Link className="hidden rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-950 sm:inline-flex" href="/register">Register business</Link>
            </div>
          </nav>

          <div className="grid min-h-[430px] content-center gap-6 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal-200">Find a queue near you</p>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">Search, select, and join the right queue.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">No QR code? No problem. Choose a business, branch, and service, then join the ongoing queue or book an appointment.</p>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input className="h-12 w-full rounded-md border border-white/20 bg-white px-10 text-sm font-medium text-slate-950 outline-none ring-teal-300 placeholder:text-slate-500 focus:ring-2" placeholder="Search business, type, or service" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {businessTypeOptions.slice(0, 6).map((option) => (
                  <button key={option.value} type="button" onClick={() => setBusinessType(option.value)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${businessType === option.value ? 'bg-teal-300 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <option.icon className="h-3.5 w-3.5" />{option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,460px)_1fr]">
        <aside className="grid content-start gap-4">
          <CustomerFinder businesses={businessOptions} selectedSlug={selectedSlug} selectedBusiness={selectedBusiness} selectedBranchId={selectedBranchId} selectedServiceId={selectedServiceId} isBusinessLoading={isBusinessLoading} onBusinessChange={handleBusinessChange} onBranchChange={handleBranchChange} onServiceChange={setSelectedServiceId} />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Available businesses</h2>
                <p className="text-sm text-slate-500">{isLoading ? 'Searching...' : `${businessOptions.length} result${businessOptions.length === 1 ? '' : 's'}`}</p>
              </div>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-teal-700" /> : null}
            </div>
            <div className="mt-3 grid gap-2">
              <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
                {businessTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            </div>
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-950">Map search</h2>
              <p className="text-sm text-slate-500">Use the map pins or the dropdowns to select a business.</p>
            </div>
            {selectedBusiness && selectedServiceId ? <Link href={buildPublicHref(selectedBusiness.slug, 'join', selectedBranchId, selectedServiceId)} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Join selected queue <ArrowRight className="h-4 w-4" /></Link> : null}
          </div>

          <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,.22),transparent_28%),radial-gradient(circle_at_75%_65%,rgba(14,165,233,.18),transparent_30%)]" />
            <div className="absolute left-6 top-6 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow">Business location map</div>

            {visibleBusinesses.map((item, index) => {
              const position = mapPositions[index % mapPositions.length];
              const isSelected = selectedSlug === item.slug;
              return (
                <button key={item.slug} type="button" onClick={() => handleBusinessChange(item.slug)} className="absolute -translate-x-1/2 -translate-y-1/2" style={position} title={item.name}>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white shadow-lg transition ${isSelected ? 'scale-110 border-teal-500 text-teal-700' : 'border-white text-rose-600 hover:scale-105'}`}>
                    <Flag className="h-6 w-6 fill-current" />
                  </span>
                </button>
              );
            })}

            {selectedBusiness ? (
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xl md:left-auto md:w-96">
                <p className="text-xs font-semibold uppercase text-teal-700">Selected business</p>
                <h3 className="mt-1 font-semibold text-slate-950">{selectedBusiness.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4" />{businessOptions.find((item) => item.slug === selectedBusiness.slug)?.address ?? 'Address not listed'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedBusiness.services.slice(0, 5).map((service) => <span key={service.id} className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">{service.name}</span>)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-950">Do you own a business?</h2>
            <p className="text-sm text-slate-600">Create your portal once, then customers can find you here or scan your QR code.</p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" href="/login">Business login</Link>
            <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href="/register">Register business</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
