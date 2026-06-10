'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PublicQueueBooking } from '@/store/public-queue-store';
import { PublicBusiness } from '@/types/public-queue';
import { QueuePosition } from '@/types/queue';

function getLabel(value?: string | null) {
  return value && value.trim() ? value : 'Not started';
}

export function CurrentQueueBookingsCard({
  business,
  bookings,
  positions,
  checkingId,
  onCheck
}: {
  business: PublicBusiness;
  bookings: PublicQueueBooking[];
  positions: Record<string, QueuePosition | undefined>;
  checkingId?: string | null;
  onCheck: (booking: PublicQueueBooking) => void;
}) {
  const activeBookings = bookings.filter((booking) => booking.businessId === business.id);

  if (activeBookings.length === 0) return null;

  return (
    <Card className="grid gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-950">Current bookings</h2>
        <Badge tone="teal">{activeBookings.length}</Badge>
      </div>
      <div className="grid gap-2">
        {activeBookings.map((booking) => {
          const branch = business.branches.find((item) => item.id === booking.branchId);
          const service = business.services.find((item) => item.id === booking.serviceId);
          const position = positions[booking.id];

          return (
            <div key={booking.id} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-black leading-none text-slate-950">{booking.queueNumber}</p>
                  <p className="mt-1 text-xs text-slate-600">{service?.name ?? 'Service'} / {branch?.name ?? 'Branch'}</p>
                </div>
                <Badge tone={position?.status === 'CALLED' || position?.status === 'IN_SERVICE' ? 'green' : 'slate'}>{position?.status ?? booking.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                <div className="rounded bg-white px-1 py-1"><p className="text-slate-500">Ongoing</p><p className="font-bold text-slate-950">{getLabel(position?.currentServingNumber)}</p></div>
                <div className="rounded bg-white px-1 py-1"><p className="text-slate-500">Position</p><p className="font-bold text-slate-950">{position?.position ?? '---'}</p></div>
                <div className="rounded bg-white px-1 py-1"><p className="text-slate-500">Waiting</p><p className="font-bold text-slate-950">{position?.estimatedWaitingCount ?? '---'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-8 px-2 text-xs" variant="secondary" isLoading={checkingId === booking.id} onClick={() => onCheck(booking)}>Check ongoing</Button>
                <Link className="inline-flex h-8 items-center justify-center rounded-md bg-teal-700 px-2 text-xs font-semibold text-white" href={`/q/${business.slug}/queue/${booking.id}`}>Open</Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
