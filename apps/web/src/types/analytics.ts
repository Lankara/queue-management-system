export interface DashboardSummary {
  totalCustomers: number;
  totalQueuesToday: number;
  totalAppointmentsToday: number;
  waitingQueues: number;
  inServiceQueues: number;
  completedQueuesToday: number;
  noShowCountToday: number;
  pendingAppointments: number;
  approvedAppointmentsToday: number;
  pendingNotifications: number;
  failedNotificationsToday: number;
}

export interface QueueSummary { counts: Record<string, number>; averageWaitEstimate: number | null; currentServingCount: number; }
export type AppointmentSummary = Record<string, number>;
export interface NotificationSummary { counts: Record<string, number>; channelBreakdown: Record<string, number>; simulatedToday: number; }
export interface ActivityEvent { type: string; id: string; createdAt: string; title: string; subtitle: string | null; }
