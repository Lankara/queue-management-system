'use client';

import clsx from 'clsx';
import { Branch, Service } from '@/types/business-setup';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { Appointment } from '@/types/appointment';
import { AppointmentStatusBadge } from './appointment-status-badge';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

export function AppointmentCard({ appointment, customer, clientProfile, branch, service, selected, onSelect }: { appointment: Appointment; customer?: Customer; clientProfile?: ClientProfile; branch?: Branch; service?: Service; selected: boolean; onSelect: () => void }) {
  return (
    <button className={clsx('w-full rounded-md border bg-white p-3 text-left transition hover:bg-slate-50', selected ? 'border-teal-300 bg-teal-50' : 'border-slate-200')} onClick={onSelect} type="button">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">{clientProfile?.fullName ?? appointment.clientProfileId}</p>
          <p className="mt-1 text-xs text-slate-500">{customer?.primaryPhone ?? appointment.customerId}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-slate-600">
        <span>{service?.name ?? 'Service not set'} · {branch?.name ?? 'No branch'}</span>
        <span>Requested: {formatDateTime(appointment.requestedStartTime)}</span>
        <span>Approved: {formatDateTime(appointment.approvedStartTime)}</span>
        <span>Queue: {appointment.queueNumber ?? 'Not assigned'}</span>
      </div>
    </button>
  );
}
