import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboardSummary(businessId: string, branchId?: string) {
    const result = await this.databaseService.query(
      `SELECT
        (SELECT COUNT(*)::int FROM customers WHERE business_id = $1) AS "totalCustomers",
        (SELECT COUNT(*)::int FROM queues WHERE business_id = $1 AND queue_date = CURRENT_DATE AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "totalQueuesToday",
        (SELECT COUNT(*)::int FROM appointments WHERE business_id = $1 AND requested_start_time::date = CURRENT_DATE AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "totalAppointmentsToday",
        (SELECT COUNT(*)::int FROM queue_entries WHERE business_id = $1 AND service_date = CURRENT_DATE AND status IN ('CONFIRMED','WAITING') AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "waitingQueues",
        (SELECT COUNT(*)::int FROM queue_entries WHERE business_id = $1 AND service_date = CURRENT_DATE AND status = 'IN_SERVICE' AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "inServiceQueues",
        (SELECT COUNT(*)::int FROM queue_entries WHERE business_id = $1 AND service_date = CURRENT_DATE AND status = 'COMPLETED' AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "completedQueuesToday",
        (SELECT COUNT(*)::int FROM queue_entries WHERE business_id = $1 AND service_date = CURRENT_DATE AND status = 'NO_SHOW' AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "noShowCountToday",
        (SELECT COUNT(*)::int FROM appointments WHERE business_id = $1 AND status = 'PENDING_APPROVAL' AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "pendingAppointments",
        (SELECT COUNT(*)::int FROM appointments WHERE business_id = $1 AND approved_at::date = CURRENT_DATE AND status = 'APPROVED' AND ($2::uuid IS NULL OR branch_id = $2::uuid)) AS "approvedAppointmentsToday",
        (SELECT COUNT(*)::int FROM notifications n WHERE n.business_id = $1 AND n.status = 'PENDING' AND ${this.notificationBranchFilter()}) AS "pendingNotifications",
        (SELECT COUNT(*)::int FROM notifications n WHERE n.business_id = $1 AND n.created_at::date = CURRENT_DATE AND n.status = 'FAILED' AND ${this.notificationBranchFilter()}) AS "failedNotificationsToday"`,
      [businessId, branchId ?? null]
    );
    return result.rows[0];
  }

  async getQueueSummary(businessId: string, branchId?: string) {
    const counts = await this.databaseService.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count
       FROM queue_entries
       WHERE business_id = $1 AND service_date = CURRENT_DATE AND ($2::uuid IS NULL OR branch_id = $2::uuid)
       GROUP BY status`,
      [businessId, branchId ?? null]
    );
    const currentServing = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM queues
       WHERE business_id = $1 AND queue_date = CURRENT_DATE AND current_number IS NOT NULL AND ($2::uuid IS NULL OR branch_id = $2::uuid)`,
      [businessId, branchId ?? null]
    );
    return { counts: this.toCountMap(counts.rows, ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'CANCELLED']), averageWaitEstimate: null, currentServingCount: Number(currentServing.rows[0]?.count ?? 0) };
  }

  async getAppointmentSummary(businessId: string, branchId?: string) {
    const result = await this.databaseService.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count
       FROM appointments
       WHERE business_id = $1 AND requested_start_time::date = CURRENT_DATE AND ($2::uuid IS NULL OR branch_id = $2::uuid)
       GROUP BY status`,
      [businessId, branchId ?? null]
    );
    return this.toCountMap(result.rows, ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'RESCHEDULE_PROPOSED']);
  }

  async getNotificationSummary(businessId: string, branchId?: string) {
    const statusCounts = await this.databaseService.query<{ status: string; count: string }>(
      `SELECT n.status, COUNT(*) AS count
       FROM notifications n
       WHERE n.business_id = $1 AND ${this.notificationBranchFilter()}
       GROUP BY n.status`,
      [businessId, branchId ?? null]
    );
    const channelCounts = await this.databaseService.query<{ channel: string; count: string }>(
      `SELECT n.channel, COUNT(*) AS count
       FROM notifications n
       WHERE n.business_id = $1 AND ${this.notificationBranchFilter()}
       GROUP BY n.channel`,
      [businessId, branchId ?? null]
    );
    const simulatedToday = process.env.WHATSAPP_DEV_MODE === 'true'
      ? Number((await this.databaseService.query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM notifications n
           WHERE n.business_id = $1 AND n.channel = 'WHATSAPP' AND n.status = 'SENT' AND n.sent_at::date = CURRENT_DATE AND ${this.notificationBranchFilter()}`,
          [businessId, branchId ?? null]
        )).rows[0]?.count ?? 0)
      : 0;
    return { counts: this.toCountMap(statusCounts.rows, ['PENDING', 'SENT', 'FAILED', 'CANCELLED']), channelBreakdown: Object.fromEntries(channelCounts.rows.map((row) => [row.channel, Number(row.count)])), simulatedToday };
  }

  async getTodayActivity(businessId: string, branchId?: string) {
    const result = await this.databaseService.query(
      `SELECT * FROM (
        SELECT 'QUEUE_JOINED' AS type, qe.id::text AS id, qe.created_at AS "createdAt", qe.queue_number AS title, cp.full_name AS subtitle
        FROM queue_entries qe
        JOIN client_profiles cp ON cp.id = qe.client_profile_id
        WHERE qe.business_id = $1 AND qe.created_at::date = CURRENT_DATE AND ($2::uuid IS NULL OR qe.branch_id = $2::uuid)
        UNION ALL
        SELECT 'APPOINTMENT_REQUESTED', a.id::text, a.created_at, a.status::text, cp.full_name
        FROM appointments a
        JOIN client_profiles cp ON cp.id = a.client_profile_id
        WHERE a.business_id = $1 AND a.created_at::date = CURRENT_DATE AND ($2::uuid IS NULL OR a.branch_id = $2::uuid)
        UNION ALL
        SELECT 'APPOINTMENT_APPROVED', a.id::text, a.approved_at, 'APPROVED', cp.full_name
        FROM appointments a
        JOIN client_profiles cp ON cp.id = a.client_profile_id
        WHERE a.business_id = $1 AND a.approved_at::date = CURRENT_DATE AND ($2::uuid IS NULL OR a.branch_id = $2::uuid)
        UNION ALL
        SELECT 'APPOINTMENT_CANCELLED', a.id::text, a.cancelled_at, a.status::text, cp.full_name
        FROM appointments a
        JOIN client_profiles cp ON cp.id = a.client_profile_id
        WHERE a.business_id = $1 AND a.cancelled_at::date = CURRENT_DATE AND ($2::uuid IS NULL OR a.branch_id = $2::uuid)
        UNION ALL
        SELECT 'DELAY_CREATED', qde.id::text, qde.created_at, CONCAT(qde.delay_minutes, ' minutes'), COALESCE(qde.reason, 'Delay event')
        FROM queue_delay_events qde
        WHERE qde.business_id = $1 AND qde.created_at::date = CURRENT_DATE AND ($2::uuid IS NULL OR qde.branch_id = $2::uuid)
      ) events WHERE "createdAt" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 25`,
      [businessId, branchId ?? null]
    );
    return result.rows;
  }

  private notificationBranchFilter() {
    return `($2::uuid IS NULL
      OR EXISTS (SELECT 1 FROM queue_entries qe WHERE qe.id = n.queue_entry_id AND qe.business_id = n.business_id AND qe.branch_id = $2::uuid)
      OR EXISTS (SELECT 1 FROM appointments a WHERE a.id = n.appointment_id AND a.business_id = n.business_id AND a.branch_id = $2::uuid))`;
  }

  private toCountMap(rows: Array<{ status: string; count: string }>, keys: string[]) {
    const map: Record<string, number> = Object.fromEntries(keys.map((key) => [key, 0]));
    for (const row of rows) {
      if (row.status.startsWith('CANCELLED_BY')) map.CANCELLED = (map.CANCELLED ?? 0) + Number(row.count);
      else map[row.status] = Number(row.count);
    }
    return map;
  }
}