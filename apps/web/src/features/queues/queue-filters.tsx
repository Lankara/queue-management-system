'use client';

import { Select } from '@/components/ui/select';
import { Branch, Service } from '@/types/business-setup';

export function QueueFilters({
  branches,
  services,
  branchId,
  serviceId,
  onBranchChange,
  onServiceChange
}: {
  branches: Branch[];
  services: Service[];
  branchId: string;
  serviceId: string;
  onBranchChange: (value: string) => void;
  onServiceChange: (value: string) => void;
}) {
  const servicePlaceholder = services.length === 0 ? 'No Service' : branchId ? 'All services for selected branch' : 'All services';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Select label="Branch filter" placeholder="All branches" value={branchId} onChange={(event) => onBranchChange(event.target.value)} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
      <Select label="Service filter" placeholder={servicePlaceholder} value={serviceId} disabled={services.length === 0} onChange={(event) => onServiceChange(event.target.value)} options={services.map((service) => ({ label: service.name, value: service.id }))} />
    </div>
  );
}
