'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PublicBusiness } from '@/types/public-queue';

export function QueueJoinCard({
  business,
  branchId,
  serviceId,
  onBranchChange,
  onServiceChange,
  onJoin,
  isLoading,
  error,
  warning,
  preselectedFromQr
}: {
  business: PublicBusiness;
  branchId: string;
  serviceId: string;
  onBranchChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onJoin: () => void;
  isLoading?: boolean;
  error?: string | null;
  warning?: string | null;
  preselectedFromQr?: boolean;
}) {
  const branch = business.branches.find((item) => item.id === branchId);
  const service = business.services.find((item) => item.id === serviceId);

  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-950">Queue selection</p>
        {preselectedFromQr ? <Badge tone="teal">Preselected from QR code</Badge> : null}
      </div>
      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p>Branch: <span className="font-medium text-slate-950">{branch?.name ?? 'Any branch'}</span></p>
        <p>Service: <span className="font-medium text-slate-950">{service?.name ?? 'Select a service'}</span></p>
      </div>
      {warning ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{warning}</div> : null}
      <Select label="Branch" placeholder="No branch" value={branchId} onChange={(event) => onBranchChange(event.target.value)} options={business.branches.map((item) => ({ label: item.name, value: item.id }))} />
      <Select label="Service" placeholder="Select service" value={serviceId} error={error ?? undefined} onChange={(event) => onServiceChange(event.target.value)} options={business.services.map((item) => ({ label: item.name, value: item.id }))} />
      {error ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div> : null}
      <Button disabled={!serviceId} isLoading={isLoading} onClick={onJoin}>Join queue</Button>
    </Card>
  );
}
