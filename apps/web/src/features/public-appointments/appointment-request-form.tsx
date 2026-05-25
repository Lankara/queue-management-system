'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PublicBusiness } from '@/types/public-queue';
import { AppointmentTimePicker } from './appointment-time-picker';

export function AppointmentRequestForm({
  business,
  branchId,
  serviceId,
  startTime,
  endTime,
  onBranchChange,
  onServiceChange,
  onStartTimeChange,
  onSubmit,
  isLoading,
  error,
  warning,
  preselectedFromQr
}: {
  business: PublicBusiness;
  branchId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  onBranchChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onSubmit: () => void;
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
        <p className="text-sm font-semibold text-slate-950">Appointment details</p>
        {preselectedFromQr ? <Badge tone="teal">Preselected from QR code</Badge> : null}
      </div>
      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p>Branch: <span className="font-medium text-slate-950">{branch?.name ?? 'Any branch'}</span></p>
        <p>Service: <span className="font-medium text-slate-950">{service?.name ?? 'Select a service'}</span></p>
      </div>
      {warning ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{warning}</div> : null}
      <Select label="Branch" placeholder="No branch" value={branchId} onChange={(event) => onBranchChange(event.target.value)} options={business.branches.map((item) => ({ label: item.name, value: item.id }))} />
      <Select label="Service" placeholder="Select service" value={serviceId} onChange={(event) => onServiceChange(event.target.value)} options={business.services.map((item) => ({ label: item.name, value: item.id }))} />
      <AppointmentTimePicker startTime={startTime} endTime={endTime} onStartTimeChange={onStartTimeChange} />
      {error ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div> : null}
      <Button disabled={!serviceId || !startTime || !endTime} isLoading={isLoading} onClick={onSubmit}>Request appointment</Button>
      <p className="text-xs text-slate-500">Appointments are pending until staff approve them. Queue numbers are assigned only after approval.</p>
    </Card>
  );
}
