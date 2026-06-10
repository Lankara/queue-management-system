'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Building2, Check, Copy, ExternalLink, GitBranch, Link2, Lock, MapPin, Plus, QrCode, Scissors, Stethoscope, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { BusinessForm, BusinessFormValues } from '@/features/businesses/business-form';
import { getBusiness, updateBusiness } from '@/features/businesses/businesses.api';
import { BranchForm, BranchFormValues } from '@/features/branches/branch-form';
import { createBranch, deleteBranch, listBranches } from '@/features/branches/branches.api';
import { ServiceForm, ServiceFormValues } from '@/features/services/service-form';
import { createService, deleteService, listServices } from '@/features/services/services.api';
import { buildPublicQueueLink, buildQrFilename, getPublicAppUrl } from '@/features/qr/qr-link-builder';
import { QrCodePreview } from '@/features/qr/qr-code-preview';
import { useBusinessStore } from '@/store/business-store';
import { Branch, BusinessType } from '@/types/business-setup';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

const branchCardStyles = [
  'border-teal-200 bg-teal-50 text-teal-950',
  'border-sky-200 bg-sky-50 text-sky-950',
  'border-violet-200 bg-violet-50 text-violet-950',
  'border-amber-200 bg-amber-50 text-amber-950',
  'border-emerald-200 bg-emerald-50 text-emerald-950',
  'border-rose-200 bg-rose-50 text-rose-950'
];

const serviceTemplates: Partial<Record<BusinessType, Array<{ name: string; code: string; durationMinutes: number }>>> = {
  BARBER_SHOP: [
    { name: 'Hair Cutting', code: 'HAIR-CUT', durationMinutes: 20 },
    { name: 'Coloring', code: 'COLORING', durationMinutes: 45 },
    { name: 'Shaving', code: 'SHAVING', durationMinutes: 15 },
    { name: 'Beard Trim', code: 'BEARD-TRIM', durationMinutes: 15 }
  ],
  SALON: [
    { name: 'Hair Cutting', code: 'HAIR-CUT', durationMinutes: 30 },
    { name: 'Coloring', code: 'COLORING', durationMinutes: 60 },
    { name: 'Hair Treatment', code: 'HAIR-TREAT', durationMinutes: 45 }
  ],
  BEAUTY_PARLOUR: [
    { name: 'Facial', code: 'FACIAL', durationMinutes: 45 },
    { name: 'Hair Cutting', code: 'HAIR-CUT', durationMinutes: 30 },
    { name: 'Makeup', code: 'MAKEUP', durationMinutes: 60 }
  ]
};

export default function BusinessesPage() {
  const queryClient = useQueryClient();
  const selectedBusinessId = useBusinessStore((state) => state.selectedBusinessId);
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [showServiceForm, setShowServiceForm] = useState(false);

  const businessQuery = useQuery({
    queryKey: ['businesses', selectedBusinessId],
    queryFn: () => getBusiness(selectedBusinessId as string),
    enabled: Boolean(selectedBusinessId)
  });
  const branchesQuery = useQuery({ queryKey: ['branches', selectedBusinessId], queryFn: () => listBranches(selectedBusinessId as string), enabled: Boolean(selectedBusinessId) });
  const servicesQuery = useQuery({ queryKey: ['services', selectedBusinessId], queryFn: () => listServices(selectedBusinessId as string), enabled: Boolean(selectedBusinessId) });

  const business = businessQuery.data;
  const branches = branchesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const mainBranch = branches.find((branch) => branch.code.toUpperCase() === 'MAIN' || branch.name.toLowerCase() === 'main') ?? null;
  const isMainBranchLocked = branches.length === 1 && Boolean(mainBranch);
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? mainBranch ?? branches[0] ?? null;
  const selectedBranchServices = selectedBranch ? services.filter((service) => service.branchId === selectedBranch.id) : [];
  const templates = business ? serviceTemplates[business.businessType] ?? [] : [];
  const publicLink = useMemo(() => business ? buildPublicQueueLink(getPublicAppUrl(), business.slug) : '', [business]);

  const saveBusinessMutation = useMutation({
    mutationFn: (values: BusinessFormValues) => {
      if (!business) throw new Error('Select a business first');
      return updateBusiness(business.id, values);
    },
    onSuccess: (updatedBusiness) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses', updatedBusiness.id] });
      setSelectedBusiness(updatedBusiness.id, updatedBusiness.name, updatedBusiness.businessType);
      setMessage('Business details updated.');
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: (values: BranchFormValues) => createBranch(selectedBusinessId as string, values),
    onSuccess: (branch) => {
      queryClient.invalidateQueries({ queryKey: ['branches', selectedBusinessId] });
      setSelectedBranchId(branch.id);
      setShowBranchForm(false);
      setShowServiceForm(true);
      setMessage(branch.code.toUpperCase() === 'MAIN' ? 'Main branch locked. You can now create services.' : 'Branch created. You can now create a service for it.');
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: (values: ServiceFormValues) => createService(selectedBusinessId as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', selectedBusinessId] });
      setShowServiceForm(false);
      setMessage('Service created.');
    }
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (branch: Branch) => deleteBranch(selectedBusinessId as string, branch.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', selectedBusinessId] });
      queryClient.invalidateQueries({ queryKey: ['services', selectedBusinessId] });
      setSelectedBranchId('');
      setShowServiceForm(false);
      setMessage('Branch deleted. Services under that branch were removed.');
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) => deleteService(selectedBusinessId as string, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', selectedBusinessId] });
      setMessage('Service deleted.');
    }
  });

  async function copyPublicLink() {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function createMainBranch() {
    if (!business) return;
    createBranchMutation.mutate({
      name: 'Main',
      code: 'MAIN',
      address: business.address ?? '',
      phone: business.phone ?? '',
      isActive: true
    });
  }

  function selectBranch(branch: Branch) {
    setSelectedBranchId(branch.id);
    setShowServiceForm(false);
  }

  function confirmDeleteBranch(branch: Branch) {
    const branchServices = services.filter((service) => service.branchId === branch.id).length;
    const confirmMessage = branchServices > 0
      ? 'Delete ' + branch.name + ' and its ' + branchServices + ' service(s)? This cannot be undone.'
      : 'Delete ' + branch.name + '? This cannot be undone.';
    if (window.confirm(confirmMessage)) {
      deleteBranchMutation.mutate(branch);
    }
  }

  function confirmDeleteService(serviceId: string, serviceName: string) {
    if (window.confirm('Delete ' + serviceName + '? This cannot be undone.')) {
      deleteServiceMutation.mutate(serviceId);
    }
  }

  function createTemplateService(template: { name: string; code: string; durationMinutes: number }) {
    if (!selectedBranch) return;
    createServiceMutation.mutate({
      branchId: selectedBranch.id,
      name: template.name,
      code: template.code,
      description: '',
      durationMinutes: template.durationMinutes,
      requiresApproval: true,
      isActive: true
    });
  }

  function templateExists(template: { name: string; code: string }) {
    return selectedBranchServices.some((service) => service.code.toUpperCase() === template.code.toUpperCase() || service.name.toLowerCase() === template.name.toLowerCase());
  }

  if (!selectedBusinessId) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Business" description="Select the business linked to this login before editing details." />
        <BusinessSelector />
        <EmptyState title="No business selected" description="Each login should normally be linked to one business. Select it here if needed." />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Business" />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[saveBusinessMutation.error, createBranchMutation.error, createServiceMutation.error, deleteBranchMutation.error, deleteServiceMutation.error, businessQuery.error, branchesQuery.error, servicesQuery.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      {businessQuery.isLoading ? <LoadingState message="Loading business details..." /> : null}

      {business ? (
        <div className="grid gap-6">
          <div className="grid gap-6">
            <Card className="grid gap-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="grid content-start gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-700" />
                      <h2 className="text-lg font-semibold text-slate-950">{business.name}</h2>
                      <Badge tone={business.isActive ? 'green' : 'red'}>{business.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Badge tone="slate">{business.businessType}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Slug: {business.slug}</p>
                    <p className="mt-1 text-sm text-slate-500">{business.email ?? business.phone ?? 'No contact details'}</p>
                  </div>
                  <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Link2 className="h-4 w-4 text-teal-700" /> Public customer link</div>
                    <div className="flex flex-col gap-2 lg:flex-row">
                      <input readOnly className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={publicLink} />
                      <Button type="button" variant="secondary" onClick={copyPublicLink}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</Button>
                      <Button type="button" variant="ghost" onClick={() => window.open(publicLink, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-4 w-4" />Open</Button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 rounded-md border border-teal-100 bg-teal-50/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><QrCode className="h-4 w-4 text-teal-700" /> Business QR code</div>
                  <QrCodePreview value={publicLink} filename={buildQrFilename(business.slug)} compact />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-950">Update business details</h2>
              <BusinessForm business={business} isSubmitting={saveBusinessMutation.isPending} onSubmit={(values) => saveBusinessMutation.mutate(values)} />
            </Card>

            <Card className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950"><GitBranch className="h-4 w-4 text-teal-700" /> Branch</h2>
                  <p className="text-sm text-slate-600">Every service belongs to one branch. Single-location businesses can lock the branch as Main.</p>
                </div>
                {!isMainBranchLocked ? <Button type="button" onClick={() => { setShowBranchForm((value) => !value); setShowServiceForm(false); }}><Plus className="h-4 w-4" />Add Branch</Button> : null}
              </div>

              {branches.length === 0 ? (
                <Card className="grid gap-4 border-dashed border-teal-300 bg-teal-50/50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-teal-950"><Lock className="h-4 w-4" />Lock as Main branch</h3>
                      <p className="mt-1 text-sm text-teal-800">Use this for one-location businesses. The system creates a branch named Main, then you only create services under it.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" isLoading={createBranchMutation.isPending} onClick={createMainBranch}>Use Main Branch</Button>
                      <Button type="button" variant="secondary" onClick={() => { setShowBranchForm(true); setShowServiceForm(false); }}><Plus className="h-4 w-4" />Add Branch</Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              {showBranchForm ? (
                <Card className="border-dashed border-teal-300 bg-teal-50/40">
                  <h3 className="mb-4 text-sm font-semibold text-slate-950">New branch</h3>
                  <BranchForm isSubmitting={createBranchMutation.isPending} onSubmit={(values) => createBranchMutation.mutate(values)} />
                </Card>
              ) : null}

              {branchesQuery.isLoading ? <LoadingState message="Loading branches..." /> : null}
              {isMainBranchLocked && mainBranch ? (
                <Card className="border-teal-200 bg-teal-50 p-4 text-teal-950">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase opacity-75"><Lock className="h-3 w-3" />Locked branch</p>
                      <h3 className="mt-1 text-lg font-semibold">Main</h3>
                      <p className="text-sm opacity-80">All services for this business will be created under Main.</p>
                    </div>
                    <Badge tone="green">Active</Badge>
                  </div>
                </Card>
              ) : null}

              {!isMainBranchLocked && branches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {branches.map((branch, index) => {
                    const branchServices = services.filter((service) => service.branchId === branch.id);
                    const isSelected = selectedBranch?.id === branch.id;
                    return (
                      <div key={branch.id} role="button" tabIndex={0} onClick={() => selectBranch(branch)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectBranch(branch); }} className="text-left">
                        <Card className={`min-h-32 border p-4 transition hover:shadow-md ${branchCardStyles[index % branchCardStyles.length]} ${isSelected ? 'ring-2 ring-slate-900/20' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase opacity-70">{branch.code}</p>
                              <h3 className="mt-1 font-semibold">{branch.name}</h3>
                            </div>
                            <Badge tone={branch.isActive ? 'green' : 'red'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge>
                          </div>
                          <p className="mt-2 flex items-center gap-1 text-xs opacity-75"><MapPin className="h-3 w-3" />{branch.address ?? 'No address'}</p>
                          <div className="mt-3 flex items-center justify-between text-xs font-medium">
                            <span>{branchServices.length} services</span>
                            <span>{branch.phone ?? 'No phone'}</span>
                          </div>
                          <Button type="button" variant="secondary" className="mt-3 w-full" isLoading={deleteBranchMutation.isPending} onClick={(event) => { event.stopPropagation(); confirmDeleteBranch(branch); }}><Trash2 className="h-4 w-4" />Delete</Button>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Card>

            <Card className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950"><Stethoscope className="h-4 w-4 text-teal-700" /> Services</h2>
                  <p className="text-sm text-slate-600">Services are always created under the selected branch.</p>
                </div>
                <Button type="button" disabled={!selectedBranch} onClick={() => setShowServiceForm((value) => !value)}><Plus className="h-4 w-4" />Add Service</Button>
              </div>

              {!selectedBranch ? <EmptyState title="Lock or create a branch first" description="A service must be attached to a branch. For one-location businesses, use Main Branch above." /> : null}
              {selectedBranch && templates.length > 0 ? (
                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Scissors className="h-4 w-4 text-teal-700" />Suggested services</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((template) => {
                      const exists = templateExists(template);
                      return <Button key={template.code} type="button" variant={exists ? 'secondary' : 'ghost'} disabled={exists || createServiceMutation.isPending} onClick={() => createTemplateService(template)}>{exists ? 'Added' : template.name}</Button>;
                    })}
                  </div>
                </div>
              ) : null}
              {selectedBranch && showServiceForm ? (
                <Card className="border-dashed border-sky-300 bg-sky-50/50">
                  <h3 className="mb-4 text-sm font-semibold text-slate-950">New service for {selectedBranch.name}</h3>
                  <ServiceForm branches={branches} lockedBranch={selectedBranch} businessName={business.name} isSubmitting={createServiceMutation.isPending} onSubmit={(values) => createServiceMutation.mutate(values)} />
                </Card>
              ) : null}

              {servicesQuery.isLoading ? <LoadingState message="Loading services..." /> : null}
              {selectedBranch ? (
                <div className="grid gap-2">
                  {selectedBranchServices.length === 0 ? <EmptyState title={`No services for ${selectedBranch.name}`} description="Click Add Service or use a suggested service." /> : null}
                  {selectedBranchServices.map((service) => (
                    <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-950">{service.name}</span>
                          <Badge tone={service.isActive ? 'green' : 'red'}>{service.isActive ? 'Active' : 'Inactive'}</Badge>
                          <Badge tone="slate">{service.durationMinutes} min</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{service.code} - {service.requiresApproval ? 'Approval required' : 'No approval required'}</p>
                      </div>
                      <Button type="button" variant="secondary" isLoading={deleteServiceMutation.isPending} onClick={() => confirmDeleteService(service.id, service.name)}><Trash2 className="h-4 w-4" />Delete</Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>

        </div>
      ) : null}
    </div>
  );
}
