'use client';

import clsx from 'clsx';
import { ClientProfile, Customer } from '@/types/customer-profile';
import { QueueEntry } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { QueueStatusBadge } from './queue-status-badge';

const sourceTone: Record<string, string> = {
  OPERATOR: 'border-l-emerald-500',
  HARDWARE: 'border-l-teal-500',
  QR: 'border-l-amber-500',
  WEB: 'border-l-amber-500',
  MOBILE_APP: 'border-l-amber-500',
  WHATSAPP: 'border-l-sky-500'
};

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function QueueEntryRow({
  entry,
  customer,
  clientProfile,
  selected,
  isBusy,
  onSelect,
  onConfirm,
  onReject,
  onNoShow
}: {
  entry: QueueEntry;
  customer?: Customer;
  clientProfile?: ClientProfile;
  selected: boolean;
  isBusy?: boolean;
  onSelect: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onNoShow?: () => void;
}) {
  const isPendingApproval = entry.status === 'DRAFT';
  const canMarkNoShow = ['CONFIRMED', 'WAITING', 'CALLED'].includes(entry.status);
  const clientLabel = clientProfile?.fullName ?? customer?.primaryPhone ?? 'Client not loaded';

  return (
    <div
      className={clsx('w-full rounded-md border border-l-4 p-3 text-left transition', sourceTone[entry.source] ?? 'border-l-slate-300', selected ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50')}
      onClick={onSelect}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(); }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-950">{entry.queueNumber}</span>
            <QueueStatusBadge status={entry.status} />
          </div>
          <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-3 sm:gap-4">
            <span><span className="font-semibold uppercase text-slate-500">Client</span> {clientLabel}</span>
            <span><span className="font-semibold uppercase text-slate-500">Created</span> {formatCreatedAt(entry.createdAt)}</span>
            <span><span className="font-semibold uppercase text-slate-500">No show</span> {entry.status === 'NO_SHOW' ? 'Yes' : 'No'}</span>
          </div>
          {customer?.primaryPhone ? <p className="text-xs text-slate-500">{customer.primaryPhone}</p> : null}
        </div>
        <div className="grid justify-items-end gap-2">
          <span className="text-xs text-slate-500">#{entry.queueSequence} - {entry.source}</span>
          {isPendingApproval || canMarkNoShow ? (
            <div className="flex flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
              {isPendingApproval ? <Button className="h-8 px-3 text-xs" disabled={isBusy} onClick={onConfirm}>Confirm</Button> : null}
              {isPendingApproval ? <Button className="h-8 px-3 text-xs" variant="secondary" disabled={isBusy} onClick={onReject}>Reject</Button> : null}
              {canMarkNoShow ? <Button className="h-8 px-3 text-xs" variant="secondary" disabled={isBusy} onClick={onNoShow}>No-show</Button> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
