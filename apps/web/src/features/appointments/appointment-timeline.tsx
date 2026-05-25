'use client';

import clsx from 'clsx';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { AppointmentStatus } from '@/types/appointment';

const steps: Array<{ key: string; label: string; active: AppointmentStatus[] }> = [
  { key: 'requested', label: 'Requested', active: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED', 'RESCHEDULE_REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR', 'IN_QUEUE', 'IN_SERVICE', 'COMPLETED'] },
  { key: 'approved', label: 'Approved', active: ['APPROVED', 'IN_QUEUE', 'IN_SERVICE', 'COMPLETED'] },
  { key: 'queue', label: 'In Queue', active: ['APPROVED', 'IN_QUEUE', 'IN_SERVICE', 'COMPLETED'] },
  { key: 'service', label: 'In Service', active: ['IN_SERVICE', 'COMPLETED'] },
  { key: 'completed', label: 'Completed', active: ['COMPLETED'] }
];

export function AppointmentTimeline({ status }: { status: AppointmentStatus }) {
  const stopped = ['REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR', 'NO_SHOW'].includes(status);
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {steps.map((step) => {
        const active = step.active.includes(status);
        const Icon = stopped && step.key !== 'requested' ? XCircle : active ? CheckCircle2 : Circle;
        return (
          <div key={step.key} className={clsx('rounded-md border p-3 text-sm', active ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-500')}>
            <Icon className="mb-2 h-4 w-4" />
            <p className="font-medium">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}
