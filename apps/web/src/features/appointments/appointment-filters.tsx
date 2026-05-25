'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Branch, Service } from '@/types/business-setup';
import { AppointmentStatus } from '@/types/appointment';

export const appointmentStatusOptions: Array<{ label: string; value: AppointmentStatus }> = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'RESCHEDULE_PROPOSED',
  'RESCHEDULE_ACCEPTED',
  'RESCHEDULE_REJECTED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_OPERATOR',
  'DELAYED',
  'IN_QUEUE',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW'
].map((status) => ({ label: status, value: status as AppointmentStatus }));

export interface AppointmentFilterState {
  status: string;
  branchId: string;
  serviceId: string;
  customerId: string;
  from: string;
  to: string;
}

export function AppointmentFilters({ filters, branches, services, onChange }: { filters: AppointmentFilterState; branches: Branch[]; services: Service[]; onChange: (filters: AppointmentFilterState) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Select label="Status" placeholder="All statuses" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })} options={appointmentStatusOptions} />
      <Select label="Branch" placeholder="All branches" value={filters.branchId} onChange={(event) => onChange({ ...filters, branchId: event.target.value })} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
      <Select label="Service" placeholder="All services" value={filters.serviceId} onChange={(event) => onChange({ ...filters, serviceId: event.target.value })} options={services.map((service) => ({ label: service.name, value: service.id }))} />
      <Input label="Customer ID" value={filters.customerId} onChange={(event) => onChange({ ...filters, customerId: event.target.value })} />
      <Input label="From" type="date" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
      <Input label="To" type="date" value={filters.to} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
    </div>
  );
}
