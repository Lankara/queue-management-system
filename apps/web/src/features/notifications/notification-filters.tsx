'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { notificationChannelOptions, notificationStatusOptions } from './notification-options';

export interface NotificationFilterState {
  status: string;
  channel: string;
  customerId: string;
  appointmentId: string;
  queueEntryId: string;
  from: string;
  to: string;
}

export function NotificationFilters({ filters, onChange }: { filters: NotificationFilterState; onChange: (filters: NotificationFilterState) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Select label="Status" placeholder="All statuses" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })} options={notificationStatusOptions} />
      <Select label="Channel" placeholder="All channels" value={filters.channel} onChange={(event) => onChange({ ...filters, channel: event.target.value })} options={notificationChannelOptions} />
      <Input label="Customer ID" value={filters.customerId} onChange={(event) => onChange({ ...filters, customerId: event.target.value })} />
      <Input label="Appointment ID" value={filters.appointmentId} onChange={(event) => onChange({ ...filters, appointmentId: event.target.value })} />
      <Input label="Queue entry ID" value={filters.queueEntryId} onChange={(event) => onChange({ ...filters, queueEntryId: event.target.value })} />
      <Input label="From" type="date" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
      <Input label="To" type="date" value={filters.to} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
    </div>
  );
}
