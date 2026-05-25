'use client';

import clsx from 'clsx';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { QueueEntry } from '@/types/queue';
import { QueueStatusBadge } from './queue-status-badge';

export function QueueEntryRow({
  entry,
  customer,
  clientProfile,
  selected,
  onSelect
}: {
  entry: QueueEntry;
  customer?: Customer;
  clientProfile?: ClientProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={clsx('w-full rounded-md border p-3 text-left transition', selected ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50')} onClick={onSelect} type="button">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-950">{entry.queueNumber}</span>
          <QueueStatusBadge status={entry.status} />
        </div>
        <span className="text-xs text-slate-500">#{entry.queueSequence} · {entry.source}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{clientProfile?.fullName ?? entry.clientProfileId}</p>
      <p className="text-xs text-slate-500">{customer?.primaryPhone ?? entry.customerId}</p>
    </button>
  );
}
