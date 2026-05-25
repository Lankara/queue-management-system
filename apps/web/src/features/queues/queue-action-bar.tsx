'use client';

import { Check, PhoneCall, Play, UserX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueueEntry } from '@/types/queue';

export function QueueActionBar({
  entry,
  isBusy,
  onConfirm,
  onReject,
  onStart,
  onComplete,
  onNoShow
}: {
  entry: QueueEntry | null;
  isBusy?: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onStart: () => void;
  onComplete: () => void;
  onNoShow: () => void;
}) {
  const status = entry?.status;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <Button disabled={!entry || status !== 'DRAFT'} isLoading={isBusy} onClick={onConfirm}><Check className="h-4 w-4" />Confirm</Button>
      <Button variant="secondary" disabled={!entry || !['DRAFT', 'CONFIRMED', 'WAITING'].includes(status ?? '')} isLoading={isBusy} onClick={onReject}><X className="h-4 w-4" />Reject</Button>
      <Button variant="secondary" disabled={!entry || status !== 'CALLED'} isLoading={isBusy} onClick={onStart}><Play className="h-4 w-4" />Start</Button>
      <Button variant="secondary" disabled={!entry || status !== 'IN_SERVICE'} isLoading={isBusy} onClick={onComplete}><PhoneCall className="h-4 w-4" />Complete</Button>
      <Button variant="secondary" disabled={!entry || !['CONFIRMED', 'WAITING', 'CALLED'].includes(status ?? '')} isLoading={isBusy} onClick={onNoShow}><UserX className="h-4 w-4" />No-show</Button>
    </div>
  );
}
