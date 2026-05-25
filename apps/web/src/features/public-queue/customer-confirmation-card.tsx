'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicCustomer } from '@/types/public-queue';

export function CustomerConfirmationCard({ customer, onConfirm, onReject }: { customer: PublicCustomer; onConfirm: () => void; onReject: () => void }) {
  return (
    <Card className="grid gap-4">
      <div><p className="text-sm text-slate-600">Is this you?</p><p className="text-xl font-semibold text-slate-950">{customer.primaryPhone}</p></div>
      {customer.isOnlineBookingBanned ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Online booking is currently unavailable for this phone number. Please contact the counter or staff.</div> : null}
      <div className="grid grid-cols-2 gap-3"><Button disabled={customer.isOnlineBookingBanned} onClick={onConfirm}>Yes</Button><Button variant="secondary" onClick={onReject}>No</Button></div>
    </Card>
  );
}

