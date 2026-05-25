export interface ReportFilter { businessId: string; startDate?: string; endDate?: string; branchId?: string; serviceId?: string; }
export interface QueueReportRow { date: string; total: number; completed: number; noShow: number; cancelled: number; averageProcessingMinutes: number | null; }
export interface AppointmentReportRow { date: string; requests: number; approvals: number; rejections: number; cancellations: number; reschedules: number; }
export interface StaffActivityReportRow { metric: string; count: number; }
export interface NotificationReportRow { date: string; channel: string; sent: number; failed: number; pending: number; }
