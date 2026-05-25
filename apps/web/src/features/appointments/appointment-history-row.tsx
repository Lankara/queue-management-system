import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppointmentTimeChange } from '@/types/appointment';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

export function AppointmentHistoryRow({ change }: { change: AppointmentTimeChange }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="teal">Time change</Badge><span className="text-xs text-slate-500">{formatDateTime(change.createdAt)}</span></div>
      <div className="mt-3 grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
        <p className="rounded-md bg-slate-50 p-2"><span className="font-medium text-slate-700">Old:</span> {formatDateTime(change.oldStartTime)} - {formatDateTime(change.oldEndTime)}</p>
        <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" />
        <p className="rounded-md bg-teal-50 p-2"><span className="font-medium text-teal-900">New:</span> {formatDateTime(change.newStartTime)} - {formatDateTime(change.newEndTime)}</p>
      </div>
      <p className="mt-2 text-slate-600">{change.changeReason ?? 'No reason recorded'}</p>
      <p className="mt-1 text-xs text-slate-500">Changed by: {change.changedBy ?? 'Unknown'}</p>
    </div>
  );
}
