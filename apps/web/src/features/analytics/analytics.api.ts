import { apiGet } from '@/lib/api-client';
import { ActivityEvent, AppointmentSummary, DashboardSummary, NotificationSummary, QueueSummary } from '@/types/analytics';

function withBusiness(path: string, businessId: string, branchId?: string) {
  const params = new URLSearchParams({ businessId });
  if (branchId) params.set('branchId', branchId);
  return `${path}?${params.toString()}`;
}

export function getDashboardSummary(businessId: string, branchId?: string): Promise<DashboardSummary> { return apiGet<DashboardSummary>(withBusiness('/analytics/dashboard-summary', businessId, branchId)); }
export function getQueueSummary(businessId: string, branchId?: string): Promise<QueueSummary> { return apiGet<QueueSummary>(withBusiness('/analytics/queue-summary', businessId, branchId)); }
export function getAppointmentSummary(businessId: string, branchId?: string): Promise<AppointmentSummary> { return apiGet<AppointmentSummary>(withBusiness('/analytics/appointment-summary', businessId, branchId)); }
export function getNotificationSummary(businessId: string, branchId?: string): Promise<NotificationSummary> { return apiGet<NotificationSummary>(withBusiness('/analytics/notification-summary', businessId, branchId)); }
export function getTodayActivity(businessId: string, branchId?: string): Promise<ActivityEvent[]> { return apiGet<ActivityEvent[]>(withBusiness('/analytics/today-activity', businessId, branchId)); }