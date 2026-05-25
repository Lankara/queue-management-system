import { apiGet } from '@/lib/api-client';
import { ActivityEvent, AppointmentSummary, DashboardSummary, NotificationSummary, QueueSummary } from '@/types/analytics';

function withBusiness(path: string, businessId: string) { return `${path}?businessId=${encodeURIComponent(businessId)}`; }
export function getDashboardSummary(businessId: string): Promise<DashboardSummary> { return apiGet<DashboardSummary>(withBusiness('/analytics/dashboard-summary', businessId)); }
export function getQueueSummary(businessId: string): Promise<QueueSummary> { return apiGet<QueueSummary>(withBusiness('/analytics/queue-summary', businessId)); }
export function getAppointmentSummary(businessId: string): Promise<AppointmentSummary> { return apiGet<AppointmentSummary>(withBusiness('/analytics/appointment-summary', businessId)); }
export function getNotificationSummary(businessId: string): Promise<NotificationSummary> { return apiGet<NotificationSummary>(withBusiness('/analytics/notification-summary', businessId)); }
export function getTodayActivity(businessId: string): Promise<ActivityEvent[]> { return apiGet<ActivityEvent[]>(withBusiness('/analytics/today-activity', businessId)); }
