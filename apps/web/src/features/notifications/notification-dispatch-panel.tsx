import { RefreshCcw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NotificationDispatchResult, NotificationDispatchSummary } from '@/types/notification';

interface NotificationDispatchPanelProps {
  summary?: NotificationDispatchSummary;
  result?: NotificationDispatchResult;
  limit: number;
  onLimitChange: (limit: number) => void;
  onDispatch: () => void;
  onRefreshSummary: () => void;
  onRefreshLogs: () => void;
  isDispatching?: boolean;
  isRefreshingSummary?: boolean;
  canDispatch: boolean;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'red' | 'teal' | 'slate' }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      {tone ? <Badge tone={tone} className="mt-2">{label}</Badge> : null}
    </Card>
  );
}

export function NotificationDispatchPanel({
  summary,
  result,
  limit,
  onLimitChange,
  onDispatch,
  onRefreshSummary,
  onRefreshLogs,
  isDispatching,
  isRefreshingSummary,
  canDispatch
}: NotificationDispatchPanelProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Pending" value={summary?.pendingCount ?? 0} tone="slate" />
        <SummaryCard label="Sent today" value={summary?.sentToday ?? 0} tone="green" />
        <SummaryCard label="Failed today" value={summary?.failedToday ?? 0} tone="red" />
        <SummaryCard label="Simulated today" value={summary?.simulatedToday ?? 0} tone="teal" />
      </div>

      <Card className="grid gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={summary?.whatsappEnabled ? 'green' : 'red'}>WhatsApp {summary?.whatsappEnabled ? 'Enabled' : 'Disabled'}</Badge>
          <Badge tone={summary?.whatsappDevMode ? 'teal' : 'slate'}>Dev Mode {summary?.whatsappDevMode ? 'On' : 'Off'}</Badge>
          <Badge tone={summary?.workerEnabled ? 'green' : 'slate'}>Worker {summary?.workerEnabled ? 'Polling active' : 'Not active'}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_auto_auto_auto]">
          <Input label="Batch limit" type="number" min={1} max={100} value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} disabled={!canDispatch} />
          <Button className="self-end" onClick={onDispatch} isLoading={isDispatching} disabled={!canDispatch}><Send className="h-4 w-4" /> Dispatch pending</Button>
          <Button className="self-end" variant="secondary" onClick={onRefreshSummary} isLoading={isRefreshingSummary}><RefreshCcw className="h-4 w-4" /> Refresh summary</Button>
          <Button className="self-end" variant="secondary" onClick={onRefreshLogs}><RefreshCcw className="h-4 w-4" /> Refresh logs</Button>
        </div>
        {!canDispatch ? <p className="text-sm text-slate-500">Dispatch controls are available to SUPER_ADMIN, BUSINESS_OWNER, and MANAGER roles.</p> : null}
        {result ? (
          <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-6">
            <span>Processed: <strong>{result.processed}</strong></span>
            <span>Sent: <strong>{result.sent}</strong></span>
            <span>Failed: <strong>{result.failed}</strong></span>
            <span>Simulated: <strong>{result.simulated}</strong></span>
            <span>Skipped: <strong>{result.skipped}</strong></span>
            <span>Duration: <strong>{result.durationMs}ms</strong></span>
            {result.providers.map((provider) => (
              <span key={`${provider.provider}-${provider.channel}`} className="md:col-span-6">
                {provider.channel}: {provider.sent}/{provider.attempted} sent, {provider.failed} failed, {provider.simulated} simulated via {provider.provider}
              </span>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
