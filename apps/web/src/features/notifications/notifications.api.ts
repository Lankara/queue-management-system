import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { NotificationChannel, NotificationDispatchResult, NotificationDispatchSummary, NotificationLanguage, NotificationLog, NotificationStatus, NotificationTemplate, RenderedNotification, TemplateKey } from '@/types/notification';

export interface NotificationLogFilters {
  customerId?: string;
  appointmentId?: string;
  queueEntryId?: string;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  from?: string;
  to?: string;
}

export interface TemplateFilters {
  language?: NotificationLanguage;
  channel?: NotificationChannel;
  templateKey?: TemplateKey;
  isActive?: boolean;
}

export interface TemplatePayload {
  language: NotificationLanguage;
  templateKey: TemplateKey;
  channel: NotificationChannel;
  title?: string;
  messageBody: string;
  isActive?: boolean;
}

export interface RenderPayload {
  language: NotificationLanguage;
  templateKey: TemplateKey;
  channel: NotificationChannel;
  variables: Record<string, unknown>;
}

function withQuery(base: string, filters: object) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString() ? `${base}?${params.toString()}` : base;
}

export function listNotificationLogs(businessId: string, filters: NotificationLogFilters = {}): Promise<NotificationLog[]> {
  return apiGet<NotificationLog[]>(withQuery(`/businesses/${businessId}/notifications`, filters));
}

export function markNotificationStatus(businessId: string, id: string, data: { status: NotificationStatus; failedReason?: string }): Promise<NotificationLog> {
  return apiPatch<NotificationLog, { status: NotificationStatus; failedReason?: string }>(`/businesses/${businessId}/notifications/${id}/status`, data);
}

export function listNotificationTemplates(businessId: string, filters: TemplateFilters = {}): Promise<NotificationTemplate[]> {
  return apiGet<NotificationTemplate[]>(withQuery(`/businesses/${businessId}/notification-templates`, filters));
}

export function createNotificationTemplate(businessId: string, data: TemplatePayload): Promise<NotificationTemplate> {
  return apiPost<NotificationTemplate, TemplatePayload>(`/businesses/${businessId}/notification-templates`, data);
}

export function updateNotificationTemplate(businessId: string, id: string, data: Partial<Pick<TemplatePayload, 'title' | 'messageBody' | 'isActive'>>): Promise<NotificationTemplate> {
  return apiPatch<NotificationTemplate, Partial<Pick<TemplatePayload, 'title' | 'messageBody' | 'isActive'>>>(`/businesses/${businessId}/notification-templates/${id}`, data);
}

export function copyGlobalTemplate(businessId: string, data: Pick<TemplatePayload, 'language' | 'templateKey' | 'channel'>): Promise<NotificationTemplate> {
  return apiPost<NotificationTemplate, Pick<TemplatePayload, 'language' | 'templateKey' | 'channel'>>(`/businesses/${businessId}/notification-templates/copy-global`, data);
}

export function renderNotificationTemplate(businessId: string, data: RenderPayload): Promise<RenderedNotification> {
  return apiPost<RenderedNotification, RenderPayload>(`/businesses/${businessId}/notifications/render`, data);
}


export function dispatchPendingNotifications(limit = 25): Promise<NotificationDispatchResult> {
  return apiPost<NotificationDispatchResult, { limit: number }>('/notifications/dispatch-pending', { limit });
}

export function getNotificationDispatchSummary(): Promise<NotificationDispatchSummary> {
  return apiGet<NotificationDispatchSummary>('/notifications/dispatch-summary');
}

