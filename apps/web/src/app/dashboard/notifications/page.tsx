'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { InfoRow } from '@/components/info-row';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { BusinessSelector } from '@/features/businesses/business-selector';
import { NotificationCard } from '@/features/notifications/notification-card';
import { NotificationDispatchPanel } from '@/features/notifications/notification-dispatch-panel';
import { NotificationFilters, NotificationFilterState } from '@/features/notifications/notification-filters';
import { NotificationStatusBadge } from '@/features/notifications/notification-status-badge';
import { notificationStatusOptions } from '@/features/notifications/notification-options';
import { TemplateForm, TemplateFormValues } from '@/features/notifications/template-form';
import { TemplateRenderPanel } from '@/features/notifications/template-render-panel';
import { copyGlobalTemplate, createNotificationTemplate, dispatchPendingNotifications, getNotificationDispatchSummary, listNotificationLogs, listNotificationTemplates, markNotificationStatus, updateNotificationTemplate } from '@/features/notifications/notifications.api';
import { useAuthStore } from '@/store/auth-store';
import { useBusinessStore } from '@/store/business-store';
import { NotificationLog, NotificationStatus, NotificationTemplate } from '@/types/notification';

function getErrorMessage(error: unknown) {
  return error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Request failed';
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.selectedBusinessId);
  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<NotificationFilterState>({ status: '', channel: '', customerId: '', appointmentId: '', queueEntryId: '', from: '', to: '' });
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [status, setStatus] = useState<NotificationStatus>('SENT');
  const [failedReason, setFailedReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [dispatchLimit, setDispatchLimit] = useState(25);
  const canDispatchNotifications = Boolean(user?.roles.some((role) => ['SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER'].includes(role)));

  const dispatchSummaryQuery = useQuery({ queryKey: ['notification-dispatch-summary'], queryFn: getNotificationDispatchSummary, refetchInterval: 30000 });
  const logsQuery = useQuery({ queryKey: ['notifications', businessId, filters], queryFn: () => listNotificationLogs(businessId as string, { status: filters.status as NotificationStatus || undefined, channel: filters.channel as never || undefined, customerId: filters.customerId || undefined, appointmentId: filters.appointmentId || undefined, queueEntryId: filters.queueEntryId || undefined, from: filters.from || undefined, to: filters.to || undefined }), enabled: Boolean(businessId), refetchInterval: 20000 });
  const templatesQuery = useQuery({ queryKey: ['notification-templates', businessId], queryFn: () => listNotificationTemplates(businessId as string), enabled: Boolean(businessId) });
  const statusMutation = useMutation({ mutationFn: () => markNotificationStatus(businessId as string, selectedLog?.id as string, { status, failedReason: status === 'FAILED' ? failedReason : undefined }), onSuccess: (log) => { queryClient.invalidateQueries({ queryKey: ['notifications', businessId] }); queryClient.invalidateQueries({ queryKey: ['notification-dispatch-summary'] }); setSelectedLog(log); setMessage('Notification status updated.'); } });
  const templateMutation = useMutation({ mutationFn: (values: TemplateFormValues) => selectedTemplate?.businessId ? updateNotificationTemplate(businessId as string, selectedTemplate.id, values) : createNotificationTemplate(businessId as string, values), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notification-templates', businessId] }); setMessage('Template saved.'); } });
  const copyMutation = useMutation({ mutationFn: (template: NotificationTemplate) => copyGlobalTemplate(businessId as string, { language: template.language, channel: template.channel, templateKey: template.templateKey }), onSuccess: (template) => { queryClient.invalidateQueries({ queryKey: ['notification-templates', businessId] }); setSelectedTemplate(template); setMessage('Global template copied.'); } });
  const dispatchMutation = useMutation({ mutationFn: () => dispatchPendingNotifications(dispatchLimit), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications', businessId] }); queryClient.invalidateQueries({ queryKey: ['notification-dispatch-summary'] }); setMessage('Dispatch completed.'); } });

  if (!businessId) return <div className="grid gap-6"><PageHeader title="Notifications" description="Monitor notification logs and manage templates." /><BusinessSelector /><EmptyState title="Select or create a business first" /></div>;

  return (
    <div className="grid gap-6">
      <PageHeader title="Notifications" description="Monitor notification logs, manage templates, and dispatch outbound messages." />
      <BusinessSelector />
      {message ? <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{message}</Card> : null}
      {[logsQuery.error, templatesQuery.error, dispatchSummaryQuery.error, statusMutation.error, templateMutation.error, copyMutation.error, dispatchMutation.error].filter(Boolean).map((error, index) => <ErrorState key={index} message={getErrorMessage(error)} />)}
      <SectionCard title="Dispatch controls" description="Safely test WhatsApp dev-mode delivery and monitor notification dispatch.">
        <NotificationDispatchPanel
          summary={dispatchSummaryQuery.data}
          result={dispatchMutation.data}
          limit={dispatchLimit}
          onLimitChange={(nextLimit) => setDispatchLimit(Number.isFinite(nextLimit) ? Math.min(Math.max(nextLimit, 1), 100) : 25)}
          onDispatch={() => dispatchMutation.mutate()}
          onRefreshSummary={() => dispatchSummaryQuery.refetch()}
          onRefreshLogs={() => logsQuery.refetch()}
          isDispatching={dispatchMutation.isPending}
          isRefreshingSummary={dispatchSummaryQuery.isFetching}
          canDispatch={canDispatchNotifications}
        />
      </SectionCard>
      <SectionCard title="Notification filters" description="Notification logs refresh every 20 seconds."><NotificationFilters filters={filters} onChange={setFilters} /></SectionCard>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SectionCard title="Notification logs" description="Click a log to inspect or update status.">
          <div className="grid gap-3">
            {logsQuery.isLoading ? <LoadingState message="Loading notification logs..." /> : null}
            {logsQuery.data?.length === 0 ? <EmptyState title="No notification logs found" /> : null}
            {logsQuery.data?.map((log) => <NotificationCard key={log.id} log={log} selected={selectedLog?.id === log.id} onSelect={() => setSelectedLog(log)} />)}
          </div>
        </SectionCard>
        <div className="grid gap-6">
          <SectionCard title="Notification detail" description="Inspect message body and related entity IDs.">
            {!selectedLog ? <EmptyState title="Select a notification log" /> : (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2"><NotificationStatusBadge status={selectedLog.status} /><Badge>{selectedLog.channel}</Badge><Badge>{selectedLog.templateKey ?? 'CUSTOM'}</Badge>{selectedLog.status === 'SENT' && selectedLog.channel === 'WHATSAPP' && dispatchSummaryQuery.data?.whatsappDevMode ? <Badge tone="teal">Simulated possible</Badge> : null}</div>
                <dl className="grid gap-4 md:grid-cols-3"><InfoRow label="Recipient" value={selectedLog.recipient} /><InfoRow label="Customer" value={selectedLog.customerId} /><InfoRow label="Appointment" value={selectedLog.appointmentId} /><InfoRow label="Queue entry" value={selectedLog.queueEntryId} /><InfoRow label="Created" value={new Date(selectedLog.createdAt).toLocaleString()} /><InfoRow label="Sent" value={selectedLog.sentAt ? new Date(selectedLog.sentAt).toLocaleString() : null} /></dl>
                <Textarea label="Message body" value={selectedLog.messageBody} readOnly />
                {selectedLog.failedReason ? <ErrorState message={selectedLog.failedReason} /> : null}
                <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]"><Select label="Set status" value={status} onChange={(event) => setStatus(event.target.value as NotificationStatus)} options={notificationStatusOptions} /><Input label="Failed reason" value={failedReason} onChange={(event) => setFailedReason(event.target.value)} disabled={status !== 'FAILED'} /><Button className="self-end" disabled={status === 'FAILED' && !failedReason} isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate()}>Update</Button></div>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Notification templates" description="Global templates are visible; copy them before editing for this business.">
            <div className="grid gap-3">
              {templatesQuery.isLoading ? <LoadingState message="Loading templates..." /> : null}
              {templatesQuery.data?.map((template) => (
                <button key={template.id} className="rounded-md border border-slate-200 bg-white p-3 text-left hover:bg-slate-50" type="button" onClick={() => setSelectedTemplate(template)}>
                  <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{template.templateKey}</span><Badge tone={template.businessId ? 'teal' : 'slate'}>{template.businessId ? 'Business' : 'Global'}</Badge><Badge tone={template.isActive ? 'green' : 'red'}>{template.isActive ? 'Active' : 'Inactive'}</Badge></div>
                  <p className="mt-1 text-xs text-slate-500">{template.language} - {template.channel}</p>
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title={selectedTemplate?.businessId ? 'Edit business template' : selectedTemplate ? 'Copy global template' : 'Create template'} description="Global templates cannot be edited directly.">
            {selectedTemplate && !selectedTemplate.businessId ? <Button className="mb-4" isLoading={copyMutation.isPending} onClick={() => copyMutation.mutate(selectedTemplate)}>Copy global template</Button> : null}
            <TemplateForm template={selectedTemplate?.businessId ? selectedTemplate : null} isSubmitting={templateMutation.isPending} onSubmit={(values) => templateMutation.mutate(values)} />
          </SectionCard>
          <SectionCard title="Render/test template" description="Preview template rendering with JSON variables."><TemplateRenderPanel businessId={businessId} template={selectedTemplate} /></SectionCard>
        </div>
      </div>
    </div>
  );
}
