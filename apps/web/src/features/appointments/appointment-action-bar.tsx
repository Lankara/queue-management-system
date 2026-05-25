'use client';

import { Check, Clock, X, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types/appointment';

export function AppointmentActionBar({ appointment, isBusy, onApprove, onReject, onCancel, onAcceptReschedule, onRejectReschedule }: { appointment: Appointment | null; isBusy?: boolean; onApprove: () => void; onReject: () => void; onCancel: () => void; onAcceptReschedule: () => void; onRejectReschedule: () => void }) {
  const status = appointment?.status;
  return (
    <div className="grid gap-2 md:grid-cols-5">
      <Button disabled={!appointment || !['PENDING_APPROVAL', 'RESCHEDULE_ACCEPTED'].includes(status ?? '')} isLoading={isBusy} onClick={onApprove}><Check className="h-4 w-4" />Approve</Button>
      <Button variant="secondary" disabled={!appointment || ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR'].includes(status ?? '')} isLoading={isBusy} onClick={onReject}><X className="h-4 w-4" />Reject</Button>
      <Button variant="secondary" disabled={!appointment || !['PENDING_APPROVAL', 'APPROVED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED'].includes(status ?? '')} isLoading={isBusy} onClick={onCancel}><Ban className="h-4 w-4" />Cancel</Button>
      <Button variant="secondary" disabled={!appointment || status !== 'RESCHEDULE_PROPOSED'} isLoading={isBusy} onClick={onAcceptReschedule}><Clock className="h-4 w-4" />Accept</Button>
      <Button variant="secondary" disabled={!appointment || status !== 'RESCHEDULE_PROPOSED'} isLoading={isBusy} onClick={onRejectReschedule}>Reject reschedule</Button>
    </div>
  );
}
