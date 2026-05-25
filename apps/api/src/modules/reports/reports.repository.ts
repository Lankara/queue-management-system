import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ReportFilters { businessId: string; startDate?: string; endDate?: string; branchId?: string; serviceId?: string }

@Injectable()
export class ReportsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  dailyQueueReport(filters: ReportFilters) {
    const { where, params } = this.buildQueueFilters(filters, 'qe');
    return this.databaseService.query(
      `SELECT qe.service_date AS date,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE qe.status = 'COMPLETED')::int AS completed,
              COUNT(*) FILTER (WHERE qe.status = 'NO_SHOW')::int AS "noShow",
              COUNT(*) FILTER (WHERE qe.status = 'CANCELLED')::int AS cancelled,
              NULL::int AS "averageProcessingMinutes"
       FROM queue_entries qe
       WHERE ${where}
       GROUP BY qe.service_date
       ORDER BY qe.service_date DESC`,
      params
    ).then((result) => result.rows);
  }

  dailyAppointmentReport(filters: ReportFilters) {
    const { where, params } = this.buildAppointmentFilters(filters, 'a');
    return this.databaseService.query(
      `SELECT a.requested_start_time::date AS date,
              COUNT(*)::int AS requests,
              COUNT(*) FILTER (WHERE a.status = 'APPROVED')::int AS approvals,
              COUNT(*) FILTER (WHERE a.status = 'REJECTED')::int AS rejections,
              COUNT(*) FILTER (WHERE a.status IN ('CANCELLED_BY_CUSTOMER','CANCELLED_BY_OPERATOR'))::int AS cancellations,
              COUNT(*) FILTER (WHERE a.status IN ('RESCHEDULE_PROPOSED','RESCHEDULE_ACCEPTED','RESCHEDULE_REJECTED'))::int AS reschedules
       FROM appointments a
       WHERE ${where}
       GROUP BY a.requested_start_time::date
       ORDER BY date DESC`,
      params
    ).then((result) => result.rows);
  }

  staffActivityReport(filters: ReportFilters) {
    const params: unknown[] = [filters.businessId];
    const start = filters.startDate ?? this.todayString();
    const end = filters.endDate ?? filters.startDate ?? this.todayString();
    params.push(start, end);
    return this.databaseService.query(
      `SELECT 'APPROVALS_HANDLED' AS metric, COUNT(*)::int AS count FROM appointments WHERE business_id = $1 AND approved_at::date BETWEEN $2::date AND $3::date
       UNION ALL SELECT 'QUEUES_COMPLETED', COUNT(*)::int FROM queue_entries WHERE business_id = $1 AND completed_at::date BETWEEN $2::date AND $3::date
       UNION ALL SELECT 'DELAYS_CREATED', COUNT(*)::int FROM queue_delay_events WHERE business_id = $1 AND created_at::date BETWEEN $2::date AND $3::date`,
      params
    ).then((result) => result.rows);
  }

  notificationReport(filters: ReportFilters) {
    const params: unknown[] = [filters.businessId];
    const clauses = ['business_id = $1'];
    if (filters.startDate) { params.push(filters.startDate); clauses.push(`created_at::date >= $${params.length}::date`); }
    if (filters.endDate) { params.push(filters.endDate); clauses.push(`created_at::date <= $${params.length}::date`); }
    return this.databaseService.query(
      `SELECT created_at::date AS date,
              channel,
              COUNT(*) FILTER (WHERE status = 'SENT')::int AS sent,
              COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
              COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending
       FROM notifications
       WHERE ${clauses.join(' AND ')}
       GROUP BY created_at::date, channel
       ORDER BY date DESC, channel`,
      params
    ).then((result) => result.rows);
  }

  private buildQueueFilters(filters: ReportFilters, alias: string) {
    const params: unknown[] = [filters.businessId];
    const clauses = [`${alias}.business_id = $1`];
    if (filters.startDate) { params.push(filters.startDate); clauses.push(`${alias}.service_date >= $${params.length}::date`); }
    if (filters.endDate) { params.push(filters.endDate); clauses.push(`${alias}.service_date <= $${params.length}::date`); }
    if (filters.branchId) { params.push(filters.branchId); clauses.push(`${alias}.branch_id = $${params.length}`); }
    if (filters.serviceId) { params.push(filters.serviceId); clauses.push(`${alias}.service_id = $${params.length}`); }
    return { where: clauses.join(' AND '), params };
  }

  private buildAppointmentFilters(filters: ReportFilters, alias: string) {
    const params: unknown[] = [filters.businessId];
    const clauses = [`${alias}.business_id = $1`];
    if (filters.startDate) { params.push(filters.startDate); clauses.push(`${alias}.requested_start_time::date >= $${params.length}::date`); }
    if (filters.endDate) { params.push(filters.endDate); clauses.push(`${alias}.requested_start_time::date <= $${params.length}::date`); }
    if (filters.branchId) { params.push(filters.branchId); clauses.push(`${alias}.branch_id = $${params.length}`); }
    if (filters.serviceId) { params.push(filters.serviceId); clauses.push(`${alias}.service_id = $${params.length}`); }
    return { where: clauses.join(' AND '), params };
  }

  private todayString() { return new Date().toISOString().slice(0, 10); }
}
