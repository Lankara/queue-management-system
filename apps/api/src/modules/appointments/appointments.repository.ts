import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PoolClient } from 'pg';
import { formatQueueNumber } from '../../common/utils/queue-number.util';
import { DatabaseService } from '../../database/database.service';
import { AcceptRescheduleDto } from './dto/accept-reschedule.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { ApproveAppointmentDto } from './dto/approve-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ProposeRescheduleDto } from './dto/propose-reschedule.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { RejectRescheduleDto } from './dto/reject-reschedule.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { Appointment, AppointmentStatus, AppointmentTimeChange } from './interfaces/appointment.interface';

interface AppointmentRow {
  id: string;
  business_id: string;
  branch_id: string | null;
  service_id: string | null;
  customer_id: string;
  client_profile_id: string;
  queue_entry_id: string | null;
  requested_start_time: Date;
  requested_end_time: Date;
  approved_start_time: Date | null;
  approved_end_time: Date | null;
  status: AppointmentStatus;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
  created_at: Date;
  updated_at: Date | null;
  queue_number?: string | null;
  queue_status?: string | null;
}

interface AppointmentTimeChangeRow {
  id: string;
  business_id: string;
  appointment_id: string;
  old_start_time: Date | null;
  old_end_time: Date | null;
  new_start_time: Date | null;
  new_end_time: Date | null;
  change_reason: string | null;
  changed_by: string | null;
  customer_notified: boolean;
  created_at: Date;
}

const APPOINTMENT_COLUMNS = `a.id, a.business_id, a.branch_id, a.service_id, a.customer_id, a.client_profile_id, a.queue_entry_id, a.requested_start_time, a.requested_end_time, a.approved_start_time, a.approved_end_time, a.status, a.requested_by, a.approved_by, a.approved_at, a.cancelled_at, a.cancellation_reason, a.reschedule_reason, a.created_at, a.updated_at, qe.queue_number, qe.status AS queue_status`;
const TIME_CHANGE_COLUMNS = `id, business_id, appointment_id, old_start_time, old_end_time, new_start_time, new_end_time, change_reason, changed_by, customer_notified, created_at`;

export interface AppointmentNotificationContext {
  businessName: string;
  customerId: string;
  clientProfileId: string;
  customerName: string;
  customerPhone: string;
  language: 'en' | 'si';
  appointmentTime: string;
  queueNumber: string | null;
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async customerBelongsToBusiness(businessId: string, customerId: string): Promise<boolean> {
    const result = await this.databaseService.query(`SELECT 1 FROM customers WHERE business_id = $1 AND id = $2`, [businessId, customerId]);
    return result.rowCount === 1;
  }

  async clientProfileBelongsToCustomer(businessId: string, customerId: string, clientProfileId: string): Promise<boolean> {
    const result = await this.databaseService.query(
      `SELECT 1 FROM client_profiles WHERE business_id = $1 AND customer_id = $2 AND id = $3`,
      [businessId, customerId, clientProfileId]
    );
    return result.rowCount === 1;
  }

  async serviceBelongsToBusiness(businessId: string, serviceId: string): Promise<boolean> {
    const result = await this.databaseService.query(`SELECT 1 FROM services WHERE business_id = $1 AND id = $2`, [businessId, serviceId]);
    return result.rowCount === 1;
  }

  async requestAppointment(businessId: string, data: RequestAppointmentDto): Promise<Appointment> {
    const result = await this.databaseService.query<AppointmentRow>(
      `INSERT INTO appointments (business_id, branch_id, service_id, customer_id, client_profile_id, requested_start_time, requested_end_time, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, business_id, branch_id, service_id, customer_id, client_profile_id, queue_entry_id, requested_start_time, requested_end_time, approved_start_time, approved_end_time, status, requested_by, approved_by, approved_at, cancelled_at, cancellation_reason, reschedule_reason, created_at, updated_at, NULL::text AS queue_number, NULL::text AS queue_status`,
      [businessId, data.branchId ?? null, data.serviceId, data.customerId, data.clientProfileId, data.requestedStartTime, data.requestedEndTime, data.requestedBy ?? null]
    );
    return this.mapAppointmentRow(result.rows[0]) as Appointment;
  }

  async findById(businessId: string, id: string): Promise<Appointment | null> {
    const result = await this.databaseService.query<AppointmentRow>(
      `SELECT ${APPOINTMENT_COLUMNS}
       FROM appointments a
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE a.business_id = $1 AND a.id = $2
       LIMIT 1`,
      [businessId, id]
    );
    return this.mapAppointmentRow(result.rows[0]);
  }

  async findAll(businessId: string, query: AppointmentListQueryDto): Promise<Appointment[]> {
    const params: unknown[] = [businessId];
    const filters = ['a.business_id = $1'];

    if (query.status) {
      params.push(query.status);
      filters.push(`a.status = $${params.length}`);
    }
    if (query.customerId) {
      params.push(query.customerId);
      filters.push(`a.customer_id = $${params.length}`);
    }
    if (query.clientProfileId) {
      params.push(query.clientProfileId);
      filters.push(`a.client_profile_id = $${params.length}`);
    }
    if (query.serviceId) {
      params.push(query.serviceId);
      filters.push(`a.service_id = $${params.length}`);
    }
    if (query.from) {
      params.push(query.from);
      filters.push(`a.requested_start_time >= $${params.length}`);
    }
    if (query.to) {
      params.push(query.to);
      filters.push(`a.requested_start_time <= $${params.length}`);
    }

    const result = await this.databaseService.query<AppointmentRow>(
      `SELECT ${APPOINTMENT_COLUMNS}
       FROM appointments a
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE ${filters.join(' AND ')}
       ORDER BY a.requested_start_time ASC`,
      params
    );
    return result.rows.map((row) => this.mapAppointmentRow(row) as Appointment);
  }

  async approveAppointment(businessId: string, appointmentId: string, data: ApproveAppointmentDto): Promise<Appointment | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const appointment = await this.findAppointmentForUpdate(client, businessId, appointmentId);
      if (!appointment) {
        await client.query('ROLLBACK');
        return null;
      }
      if (!['PENDING_APPROVAL', 'RESCHEDULE_ACCEPTED'].includes(appointment.status)) {
        await client.query('ROLLBACK');
        return appointment;
      }

      const approvedStart = data.approvedStartTime ?? appointment.requestedStartTime.toISOString();
      const approvedEnd = data.approvedEndTime ?? appointment.requestedEndTime.toISOString();
      const queueDate = await this.getDateFromTimestamp(client, approvedStart);
      const queueNumberLength = await this.getQueueNumberLength(client, businessId);
      const queue = await this.getOrCreateQueue(client, businessId, appointment.branchId, appointment.serviceId, queueDate);
      const nextSequence = queue.lastIssuedNumber + 1;
      const queueNumber = formatQueueNumber(nextSequence, queueNumberLength);

      await client.query(`UPDATE queues SET last_issued_number = $2, updated_at = now() WHERE id = $1`, [queue.id, nextSequence]);
      const queueEntryResult = await client.query<{ id: string }>(
        `INSERT INTO queue_entries (business_id, queue_id, branch_id, service_id, customer_id, client_profile_id, queue_number, queue_sequence, status, source, service_date, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', $9, $10, now())
         RETURNING id`,
        [businessId, queue.id, appointment.branchId, appointment.serviceId, appointment.customerId, appointment.clientProfileId, queueNumber, nextSequence, data.source ?? 'OPERATOR', queueDate]
      );

      const result = await client.query<AppointmentRow>(
        `UPDATE appointments a
         SET status = 'APPROVED', approved_start_time = $3, approved_end_time = $4, approved_by = $5, approved_at = now(), queue_entry_id = $6, updated_at = now()
         FROM queue_entries qe
         WHERE a.business_id = $1 AND a.id = $2 AND qe.id = $6
         RETURNING ${APPOINTMENT_COLUMNS}`,
        [businessId, appointmentId, approvedStart, approvedEnd, data.approvedBy ?? null, queueEntryResult.rows[0].id]
      );

      await client.query('COMMIT');
      return this.mapAppointmentRow(result.rows[0]);
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectAppointment(businessId: string, appointmentId: string, data: RejectAppointmentDto): Promise<Appointment | null> {
    const result = await this.databaseService.query<AppointmentRow>(
      `UPDATE appointments a
       SET status = 'REJECTED', approved_by = $3, cancellation_reason = $4, updated_at = now()
       WHERE a.business_id = $1 AND a.id = $2 AND a.status NOT IN ('COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OPERATOR')
       RETURNING ${APPOINTMENT_COLUMNS}`,
      [businessId, appointmentId, data.approvedBy ?? null, data.reason ?? null]
    );
    return this.mapAppointmentRow(result.rows[0]);
  }

  async cancelAppointment(businessId: string, appointmentId: string, data: CancelAppointmentDto, status: 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_OPERATOR'): Promise<Appointment | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const appointment = await this.findAppointmentForUpdate(client, businessId, appointmentId);
      if (!appointment) {
        await client.query('ROLLBACK');
        return null;
      }
      if (!['PENDING_APPROVAL', 'APPROVED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED'].includes(appointment.status)) {
        await client.query('ROLLBACK');
        return appointment;
      }

      if (appointment.queueEntryId) {
        await client.query(
          `UPDATE queue_entries
           SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
           WHERE business_id = $1 AND id = $2 AND status NOT IN ('COMPLETED', 'NO_SHOW')`,
          [businessId, appointment.queueEntryId]
        );
      }

      const result = await client.query<AppointmentRow>(
        `UPDATE appointments a
         SET status = $3, cancelled_at = now(), cancellation_reason = $4, updated_at = now()
         WHERE a.business_id = $1 AND a.id = $2
         RETURNING ${APPOINTMENT_COLUMNS}`,
        [businessId, appointmentId, status, data.reason ?? null]
      );

      await client.query('COMMIT');
      return this.mapAppointmentRow(result.rows[0]);
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async proposeReschedule(businessId: string, appointmentId: string, data: ProposeRescheduleDto): Promise<Appointment | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const appointment = await this.findAppointmentForUpdate(client, businessId, appointmentId);
      if (!appointment) {
        await client.query('ROLLBACK');
        return null;
      }
      if (!['PENDING_APPROVAL', 'APPROVED'].includes(appointment.status)) {
        await client.query('ROLLBACK');
        return appointment;
      }

      await client.query(
        `INSERT INTO appointment_time_changes (business_id, appointment_id, old_start_time, old_end_time, new_start_time, new_end_time, change_reason, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          businessId,
          appointmentId,
          appointment.approvedStartTime ?? appointment.requestedStartTime,
          appointment.approvedEndTime ?? appointment.requestedEndTime,
          data.newStartTime,
          data.newEndTime,
          data.reason ?? null,
          data.changedBy ?? null
        ]
      );

      const result = await client.query<AppointmentRow>(
        `UPDATE appointments a
         SET requested_start_time = $3, requested_end_time = $4, status = 'RESCHEDULE_PROPOSED', reschedule_reason = $5, updated_at = now()
         WHERE a.business_id = $1 AND a.id = $2
         RETURNING ${APPOINTMENT_COLUMNS}`,
        [businessId, appointmentId, data.newStartTime, data.newEndTime, data.reason ?? null]
      );

      await client.query('COMMIT');
      return this.mapAppointmentRow(result.rows[0]);
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async acceptReschedule(businessId: string, appointmentId: string, _data: AcceptRescheduleDto): Promise<Appointment | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<AppointmentRow>(
        `UPDATE appointments a
         SET status = 'RESCHEDULE_ACCEPTED', updated_at = now()
         WHERE a.business_id = $1 AND a.id = $2 AND a.status = 'RESCHEDULE_PROPOSED'
         RETURNING ${APPOINTMENT_COLUMNS}`,
        [businessId, appointmentId]
      );
      await client.query('COMMIT');
      return this.mapAppointmentRow(result.rows[0]);
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectReschedule(businessId: string, appointmentId: string, data: RejectRescheduleDto): Promise<Appointment | null> {
    const result = await this.databaseService.query<AppointmentRow>(
      `UPDATE appointments a
       SET status = 'RESCHEDULE_REJECTED', reschedule_reason = $3, updated_at = now()
       WHERE a.business_id = $1 AND a.id = $2 AND a.status = 'RESCHEDULE_PROPOSED'
       RETURNING ${APPOINTMENT_COLUMNS}`,
      [businessId, appointmentId, data.reason ?? null]
    );
    return this.mapAppointmentRow(result.rows[0]);
  }

  async findTimeChanges(businessId: string, appointmentId: string): Promise<AppointmentTimeChange[]> {
    const result = await this.databaseService.query<AppointmentTimeChangeRow>(
      `SELECT ${TIME_CHANGE_COLUMNS}
       FROM appointment_time_changes
       WHERE business_id = $1 AND appointment_id = $2
       ORDER BY created_at DESC`,
      [businessId, appointmentId]
    );
    return result.rows.map((row) => this.mapTimeChangeRow(row));
  }


  async getNotificationContext(businessId: string, appointmentId: string): Promise<AppointmentNotificationContext | null> {
    const result = await this.databaseService.query<{
      business_name: string;
      customer_id: string;
      client_profile_id: string;
      customer_name: string;
      customer_phone: string;
      language: 'en' | 'si';
      appointment_time: Date;
      queue_number: string | null;
    }>(
      `SELECT b.name AS business_name,
              c.id AS customer_id,
              cp.id AS client_profile_id,
              cp.full_name AS customer_name,
              c.primary_phone AS customer_phone,
              c.preferred_language AS language,
              COALESCE(a.approved_start_time, a.requested_start_time) AS appointment_time,
              qe.queue_number, qe.status AS queue_status
       FROM appointments a
       JOIN businesses b ON b.id = a.business_id
       JOIN customers c ON c.id = a.customer_id
       JOIN client_profiles cp ON cp.id = a.client_profile_id
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE a.business_id = $1 AND a.id = $2
       LIMIT 1`,
      [businessId, appointmentId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      businessName: row.business_name,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      language: row.language,
      appointmentTime: row.appointment_time.toISOString(),
      queueNumber: row.queue_number
    };
  }

  private async findAppointmentForUpdate(client: PoolClient, businessId: string, appointmentId: string): Promise<Appointment | null> {
    const result = await client.query<AppointmentRow>(
      `SELECT a.id, a.business_id, a.branch_id, a.service_id, a.customer_id, a.client_profile_id, a.queue_entry_id, a.requested_start_time, a.requested_end_time, a.approved_start_time, a.approved_end_time, a.status, a.requested_by, a.approved_by, a.approved_at, a.cancelled_at, a.cancellation_reason, a.reschedule_reason, a.created_at, a.updated_at, NULL::text AS queue_number, NULL::text AS queue_status
       FROM appointments a
       WHERE a.business_id = $1 AND a.id = $2
       FOR UPDATE`,
      [businessId, appointmentId]
    );
    return this.mapAppointmentRow(result.rows[0]);
  }

  private async getDateFromTimestamp(client: PoolClient, timestamp: string): Promise<string> {
    const result = await client.query<{ service_date: string }>(`SELECT $1::timestamptz::date::text AS service_date`, [timestamp]);
    return result.rows[0].service_date;
  }

  private async getQueueNumberLength(client: PoolClient, businessId: string): Promise<number> {
    const result = await client.query<{ queue_number_length: number }>(
      `SELECT queue_number_length FROM business_profile_settings WHERE business_id = $1`,
      [businessId]
    );
    return result.rows[0]?.queue_number_length ?? 3;
  }

  private async getOrCreateQueue(client: PoolClient, businessId: string, branchId: string | null, serviceId: string | null, queueDate: string): Promise<{ id: string; lastIssuedNumber: number }> {
    const code = this.createQueueCode(branchId, serviceId);
    const existing = await client.query<{ id: string; last_issued_number: number }>(
      `SELECT id, last_issued_number
       FROM queues
       WHERE business_id = $1 AND code = $2 AND queue_date = $3
       FOR UPDATE`,
      [businessId, code, queueDate]
    );

    if (existing.rows[0]) {
      return { id: existing.rows[0].id, lastIssuedNumber: existing.rows[0].last_issued_number };
    }

    const created = await client.query<{ id: string; last_issued_number: number }>(
      `INSERT INTO queues (business_id, branch_id, service_id, queue_date, code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, last_issued_number`,
      [businessId, branchId, serviceId, queueDate, code]
    );
    return { id: created.rows[0].id, lastIssuedNumber: created.rows[0].last_issued_number };
  }

  private createQueueCode(branchId: string | null, serviceId: string | null): string {
    const queueKey = `${branchId ?? 'all'}:${serviceId ?? 'all'}`;
    return `q:${createHash('sha256').update(queueKey).digest('hex').slice(0, 32)}`;
  }

  private mapAppointmentRow(row?: AppointmentRow): Appointment | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      branchId: row.branch_id,
      serviceId: row.service_id,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      queueEntryId: row.queue_entry_id,
      requestedStartTime: row.requested_start_time,
      requestedEndTime: row.requested_end_time,
      approvedStartTime: row.approved_start_time,
      approvedEndTime: row.approved_end_time,
      status: row.status,
      requestedBy: row.requested_by,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      rescheduleReason: row.reschedule_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      queueNumber: row.queue_number ?? null,
      queueStatus: row.queue_status ?? null
    };
  }

  private mapTimeChangeRow(row: AppointmentTimeChangeRow): AppointmentTimeChange {
    return {
      id: row.id,
      businessId: row.business_id,
      appointmentId: row.appointment_id,
      oldStartTime: row.old_start_time,
      oldEndTime: row.old_end_time,
      newStartTime: row.new_start_time,
      newEndTime: row.new_end_time,
      changeReason: row.change_reason,
      changedBy: row.changed_by,
      customerNotified: row.customer_notified,
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

