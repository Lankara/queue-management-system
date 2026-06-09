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
  useCustomerId: boolean;
  customerId: string;
  useDateRange: boolean;
  from: string;
  to: string;
}

export function AppointmentFilters({ filters, branches, services, onChange }: { filters: AppointmentFilterState; branches: Branch[]; services: Service[]; onChange: (filters: AppointmentFilterState) => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Status" placeholder="All statuses" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })} options={appointmentStatusOptions} />
        <Select label="Branch" placeholder="All branches" value={filters.branchId} onChange={(event) => onChange({ ...filters, branchId: event.target.value, serviceId: '' })} options={branches.map((branch) => ({ label: branch.name, value: branch.id }))} />
        <Select label="Service" placeholder={filters.branchId ? 'All services in branch' : 'All services'} value={filters.serviceId} onChange={(event) => onChange({ ...filters, serviceId: event.target.value })} options={services.map((service) => ({ label: service.name, value: service.id }))} />
      </div>

      <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800 md:col-span-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700/20"
            checked={filters.useCustomerId}
            onChange={(event) => onChange({ ...filters, useCustomerId: event.target.checked, customerId: event.target.checked ? filters.customerId : '' })}
          />
          Filter by Customer ID
        </label>
        <div className="md:col-span-2">
          <Input label="Customer ID" value={filters.customerId} disabled={!filters.useCustomerId} onChange={(event) => onChange({ ...filters, customerId: event.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-800 md:col-span-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700/20"
            checked={filters.useDateRange}
            onChange={(event) => onChange({ ...filters, useDateRange: event.target.checked, from: event.target.checked ? filters.from : '', to: event.target.checked ? filters.to : '' })}
          />
          Filter by date range
        </label>
        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <Input label="From" type="date" value={filters.from} disabled={!filters.useDateRange} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
          <Input label="To" type="date" value={filters.to} disabled={!filters.useDateRange} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
        </div>
      </div>
    </div>
  );
}
