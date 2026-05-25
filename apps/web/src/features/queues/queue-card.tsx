'use client';

import clsx from 'clsx';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Branch, Service } from '@/types/business-setup';
import { Queue, QueueEntry } from '@/types/queue';

const activeStatuses = ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'];

export function QueueCard({
  queue,
  entries,
  branches,
  services,
  selected,
  onSelect
}: {
  queue: Queue;
  entries?: QueueEntry[];
  branches: Branch[];
  services: Service[];
  selected: boolean;
  onSelect: () => void;
}) {
  const branch = branches.find((item) => item.id === queue.branchId);
  const service = services.find((item) => item.id === queue.serviceId);
  const total = entries?.length ?? queue.lastIssuedNumber + 1;
  const active = entries?.filter((entry) => activeStatuses.includes(entry.status)).length ?? 0;
  const waiting = entries?.filter((entry) => ['CONFIRMED', 'WAITING'].includes(entry.status)).length ?? 0;

  return (
    <button className="text-left" onClick={onSelect} type="button">
      <Card className={clsx('transition hover:border-teal-300', selected && 'border-teal-400 ring-1 ring-teal-200')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">{service?.name ?? 'All services'}</h3>
            <p className="mt-1 text-sm text-slate-600">{branch?.name ?? 'All branches'} · {queue.queueDate}</p>
          </div>
          <Badge tone={queue.isActive ? 'green' : 'slate'}>{queue.isActive ? 'Active' : 'Closed'}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-slate-50 p-2"><p className="text-xs text-slate-500">Current</p><p className="font-semibold">{queue.currentNumber ?? '---'}</p></div>
          <div className="rounded-md bg-slate-50 p-2"><p className="text-xs text-slate-500">Active</p><p className="font-semibold">{active}</p></div>
          <div className="rounded-md bg-slate-50 p-2"><p className="text-xs text-slate-500">Waiting</p><p className="font-semibold">{waiting}</p></div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Total entries: {Math.max(total, 0)}</p>
      </Card>
    </button>
  );
}
