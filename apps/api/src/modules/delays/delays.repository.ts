import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { addMinutes } from '../../common/utils/date-time.util';
import { DatabaseService } from '../../database/database.service';
import { CreateDelayEventDto } from './dto/create-delay-event.dto';
import { DelayListQueryDto } from './dto/delay-list-query.dto';
import { DelayNotificationContext, DelayOperationResult, QueueDelayEvent } from './interfaces/delay.interface';

interface DelayEventRow {
  id: string;
  business_id: string;
  branch_id: string | null;
  service_id: string | null;
  delay_minutes: number;
  reason: string | null;
  affected_from_time: Date;
  created_by: string | null;
  created_at: Date;
}

interface AffectedAppointmentRow {
  appointment_id: string;
  business_id: string;
  business_name: string;
  customer_id: string;
  client_profile_id: string;
  customer_name: string;
  customer_phone: string;
  language: 'en' | 'si';
  requested_start_time: Date;
  requested_end_time: Date;
  approved_start_time: Date | null;
  approved_end_time: Date | null;
  queue_number: string | null;
}

const DELAY_EVENT_COLUMNS = `id, business_id, branch_id, service_id, delay_minutes, reason, affected_from_time, created_by, created_at`;

@Injectable()
export class DelaysRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createDelayAndShiftAppointments(businessId: string, data: CreateDelayEventDto): Promise<DelayOperationResult & { notificationContexts: DelayNotificationContext[] }> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const eventResult = await client.query<DelayEventRow>(
        `INSERT INTO queue_delay_events (business_id, branch_id, service_id, delay_minutes, reason, affected_from_time, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${DELAY_EVENT_COLUMNS}`,
        [businessId, data.branchId ?? null, data.serviceId, data.delayMinutes, data.reason ?? null, data.affectedFromTime, data.createdBy ?? null]
      );
      const delayEvent = this.mapDelayEventRow(eventResult.rows[0]);
      const affectedRows = await this.findAffectedAppointmentsForUpdate(client, businessId, data);
      const affectedAppointments: DelayNotificationContext[] = [];

      for (const row of affectedRows) {
        const oldRequestedStart = row.requested_start_time;
        const oldRequestedEnd = row.requested_end_time;
        const oldApprovedStart = row.approved_start_time;
        const oldApprovedEnd = row.approved_end_time;
        const oldEffectiveStart = oldApprovedStart ?? oldRequestedStart;
        const oldEffectiveEnd = oldApprovedEnd ?? oldRequestedEnd;
        const newRequestedStart = addMinutes(oldRequestedStart, data.delayMinutes);
        const newRequestedEnd = addMinutes(oldRequestedEnd, data.delayMinutes);
        const newApprovedStart = oldApprovedStart ? addMinutes(oldApprovedStart, data.delayMinutes) : null;
        const newApprovedEnd = oldApprovedEnd ? addMinutes(oldApprovedEnd, data.delayMinutes) : null;
        const newEffectiveStart = newApprovedStart ?? newRequestedStart;
        const newEffectiveEnd = newApprovedEnd ?? newRequestedEnd;

        await client.query(
          `UPDATE appointments
           SET requested_start_time = $3,
               requested_end_time = $4,
               approved_start_time = $5,
               approved_end_time = $6,
               updated_at = now()
           WHERE business_id = $1 AND id = $2`,
          [businessId, row.appointment_id, newRequestedStart, newRequestedEnd, newApprovedStart, newApprovedEnd]
        );

        await client.query(
          `INSERT INTO appointment_time_changes (business_id, appointment_id, old_start_time, old_end_time, new_start_time, new_end_time, change_reason, changed_by, customer_notified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
          [
            businessId,
            row.appointment_id,
            oldEffectiveStart,
            oldEffectiveEnd,
            newEffectiveStart,
            newEffectiveEnd,
            data.reason ?? 'Service provider delayed',
            data.createdBy ?? null
          ]
        );

        affectedAppointments.push({
          appointmentId: row.appointment_id,
          customerId: row.customer_id,
          clientProfileId: row.client_profile_id,
          oldStartTime: oldEffectiveStart,
          oldEndTime: oldEffectiveEnd,
          newStartTime: newEffectiveStart,
          newEndTime: newEffectiveEnd,
          queueNumber: row.queue_number,
          businessName: row.business_name,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          language: row.language
        });
      }

      await client.query('COMMIT');

      return {
        delayEvent,
        affectedCount: affectedAppointments.length,
        affectedAppointments,
        notificationContexts: affectedAppointments
      };
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(businessId: string, query: DelayListQueryDto): Promise<QueueDelayEvent[]> {
    const params: unknown[] = [businessId];
    const filters = ['business_id = $1'];

    if (query.branchId) {
      params.push(query.branchId);
      filters.push(`branch_id = $${params.length}`);
    }
    if (query.serviceId) {
      params.push(query.serviceId);
      filters.push(`service_id = $${params.length}`);
    }
    if (query.from) {
      params.push(query.from);
      filters.push(`affected_from_time >= $${params.length}`);
    }
    if (query.to) {
      params.push(query.to);
      filters.push(`affected_from_time <= $${params.length}`);
    }

    const result = await this.databaseService.query<DelayEventRow>(
      `SELECT ${DELAY_EVENT_COLUMNS}
       FROM queue_delay_events
       WHERE ${filters.join(' AND ')}
       ORDER BY created_at DESC`,
      params
    );
    return result.rows.map((row) => this.mapDelayEventRow(row));
  }

  async findById(businessId: string, id: string): Promise<QueueDelayEvent | null> {
    const result = await this.databaseService.query<DelayEventRow>(
      `SELECT ${DELAY_EVENT_COLUMNS}
       FROM queue_delay_events
       WHERE business_id = $1 AND id = $2
       LIMIT 1`,
      [businessId, id]
    );
    return result.rows[0] ? this.mapDelayEventRow(result.rows[0]) : null;
  }

  private async findAffectedAppointmentsForUpdate(client: PoolClient, businessId: string, data: CreateDelayEventDto): Promise<AffectedAppointmentRow[]> {
    const params: unknown[] = [businessId, data.serviceId, data.affectedFromTime];
    const filters = [
      'a.business_id = $1',
      'a.service_id = $2',
      "a.status IN ('APPROVED', 'PENDING_APPROVAL', 'RESCHEDULE_ACCEPTED')",
      'COALESCE(a.approved_start_time, a.requested_start_time) >= $3'
    ];

    if (data.branchId) {
      params.push(data.branchId);
      filters.push(`a.branch_id = $${params.length}`);
    }

    const result = await client.query<AffectedAppointmentRow>(
      `SELECT a.id AS appointment_id,
              a.business_id,
              b.name AS business_name,
              a.customer_id,
              a.client_profile_id,
              cp.full_name AS customer_name,
              c.primary_phone AS customer_phone,
              c.preferred_language AS language,
              a.requested_start_time,
              a.requested_end_time,
              a.approved_start_time,
              a.approved_end_time,
              qe.queue_number
       FROM appointments a
       JOIN businesses b ON b.id = a.business_id
       JOIN customers c ON c.id = a.customer_id
       JOIN client_profiles cp ON cp.id = a.client_profile_id
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE ${filters.join(' AND ')}
       ORDER BY COALESCE(a.approved_start_time, a.requested_start_time) ASC
       FOR UPDATE OF a`,
      params
    );

    return result.rows;
  }


  private mapDelayEventRow(row: DelayEventRow): QueueDelayEvent {
    return {
      id: row.id,
      businessId: row.business_id,
      branchId: row.branch_id,
      serviceId: row.service_id,
      delayMinutes: row.delay_minutes,
      reason: row.reason,
      affectedFromTime: row.affected_from_time,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }

  private async safeRollback(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Keep the original database error visible to the service layer.
    }
  }
}