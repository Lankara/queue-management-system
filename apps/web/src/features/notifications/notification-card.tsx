'use client';

import clsx from 'clsx';
import { NotificationLog } from '@/types/notification';
import { NotificationStatusBadge } from './notification-status-badge';

export function NotificationCard({ log, selected, onSelect }: { log: NotificationLog; selected: boolean; onSelect: () => void }) {
  return (
    <button className={clsx('w-full rounded-md border bg-white p-3 text-left transition hover:bg-slate-50', selected ? 'border-teal-300 bg-teal-50' : 'border-slate-200')} onClick={onSelect} type="button">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-slate-950">{log.recipient}</span>
        <NotificationStatusBadge status={log.status} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{log.channel} · {log.templateKey ?? 'Custom'} · {new Date(log.createdAt).toLocaleString()}</p>
      <p className="mt-2 line-clamp-2 text-sm text-slate-700">{log.messageBody}</p>
    </button>
  );
}
