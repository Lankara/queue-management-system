import { apiGet } from '@/lib/api-client';
import { AppointmentReportRow, NotificationReportRow, QueueReportRow, ReportFilter, StaffActivityReportRow } from '@/types/reports';

function withQuery(path: string, filters: ReportFilter) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
  return `${path}?${params.toString()}`;
}
export function getDailyQueueReport(filters: ReportFilter): Promise<QueueReportRow[]> { return apiGet<QueueReportRow[]>(withQuery('/reports/daily-queue-report', filters)); }
export function getDailyAppointmentReport(filters: ReportFilter): Promise<AppointmentReportRow[]> { return apiGet<AppointmentReportRow[]>(withQuery('/reports/daily-appointment-report', filters)); }
export function getStaffActivityReport(filters: ReportFilter): Promise<StaffActivityReportRow[]> { return apiGet<StaffActivityReportRow[]>(withQuery('/reports/staff-activity-report', filters)); }
export function getNotificationReport(filters: ReportFilter): Promise<NotificationReportRow[]> { return apiGet<NotificationReportRow[]>(withQuery('/reports/notification-report', filters)); }
