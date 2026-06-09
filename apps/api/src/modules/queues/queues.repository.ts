import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { formatQueueNumber } from '../../common/utils/queue-number.util';
import { DatabaseService } from '../../database/database.service';
import { CreateQueueJoinDto } from './dto/create-queue-join.dto';
import { Queue, QueueEntry, QueuePosition, QueueStatus } from './interfaces/queue.interface';

interface QueueRow {
  id: string;
  business_id: string;
  branch_id: string | null;
  service_id: string | null;
  queue_date: string;
  code: string;
  current_number: string | null;
  last_issued_number: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

interface QueueEntryRow {
  id: string;
  business_id: string;
  queue_id: string;
  branch_id: string | null;
  service_id: string | null;
  customer_id: string;
  client_profile_id: string;
  queue_number: string;
  queue_sequence: number;
  status: QueueStatus;
  source: QueueEntry['source'];
  service_date: string;
  confirmed_at: Date | null;
  called_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  no_show_marked_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

const QUEUE_COLUMNS = `id, business_id, branch_id, service_id, queue_date, code, current_number, last_issued_number, is_active, created_at, updated_at`;
const ENTRY_COLUMNS = `id, business_id, queue_id, branch_id, service_id, customer_id, client_profile_id, queue_number, queue_sequence, status, source, service_date, confirmed_at, called_at, started_at, completed_at, cancelled_at, no_show_marked_at, created_at, updated_at`;

export interface ConfirmEntryResult {
  entry: QueueEntry | null;
  failure?: 'BANNED' | 'INVALID_STATUS' | 'QUEUE_CLOSED';
  currentStatus?: QueueStatus;
}

export interface MarkNoShowResult {
  entry: QueueEntry | null;
  onlineBookingBanApplied: boolean;
}

export interface QueueNotificationContext {
  queueEntryId: string;
  businessName: string;
  customerId: string;
  clientProfileId: string;
  customerName: string;
  customerPhone: string;
  language: 'en' | 'si';
  queueNumber: string;
  currentNumber: string | null;
  position: number;
}

@Injectable()
export class QueuesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createDraftEntry(businessId: string, data: CreateQueueJoinDto, queueCode: string): Promise<QueueEntry | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const serviceDate = await this.getCurrentDate(client);
      const queueNumberLength = await this.getQueueNumberLength(client, businessId);
      const queue = await this.findOpenQueueForJoin(client, businessId, data.branchId ?? null, data.serviceId ?? null, serviceDate, queueCode);
      if (!queue) {
        await client.query('ROLLBACK');
        return null;
      }
      const nextSequence = Math.max(queue.lastIssuedNumber + 1, 1);
      const queueNumber = formatQueueNumber(nextSequence, queueNumberLength);

      await client.query(`UPDATE queues SET last_issued_number = $2, updated_at = now() WHERE id = $1`, [queue.id, nextSequence]);

      const initialStatus: QueueStatus = data.source === 'OPERATOR' ? 'CONFIRMED' : 'DRAFT';
      const result = await client.query<QueueEntryRow>(
        `INSERT INTO queue_entries (business_id, queue_id, branch_id, service_id, customer_id, client_profile_id, queue_number, queue_sequence, status, source, service_date, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::queue_status_enum, $10::queue_source_enum, $11, CASE WHEN $9 = 'CONFIRMED' THEN now() ELSE NULL END)
         RETURNING ${ENTRY_COLUMNS}`,
        [businessId, queue.id, data.branchId ?? null, data.serviceId ?? null, data.customerId, data.clientProfileId, queueNumber, nextSequence, initialStatus, data.source, serviceDate]
      );

      await client.query('COMMIT');
      return this.mapEntryRow(result.rows[0]) as QueueEntry;
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmDraftEntry(businessId: string, entryId: string): Promise<ConfirmEntryResult> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const entryResult = await client.query<QueueEntryRow>(
        `SELECT ${ENTRY_COLUMNS} FROM queue_entries WHERE business_id = $1 AND id = $2 FOR UPDATE`,
        [businessId, entryId]
      );
      const entry = this.mapEntryRow(entryResult.rows[0]);

      if (!entry) {
        await client.query('ROLLBACK');
        return { entry: null };
      }

      if (entry.status !== 'DRAFT') {
        await client.query('ROLLBACK');
        return { entry, failure: 'INVALID_STATUS', currentStatus: entry.status };
      }

      const queueResult = await client.query<{ is_active: boolean }>(
        `SELECT is_active FROM queues WHERE business_id = $1 AND id = $2 FOR UPDATE`,
        [businessId, entry.queueId]
      );
      if (queueResult.rows[0]?.is_active !== true) {
        await client.query('ROLLBACK');
        return { entry, failure: 'QUEUE_CLOSED' };
      }

      const customerResult = await client.query<{ is_online_booking_banned: boolean }>(
        `SELECT is_online_booking_banned FROM customers WHERE business_id = $1 AND id = $2 FOR UPDATE`,
        [businessId, entry.customerId]
      );
      const isBanned = customerResult.rows[0]?.is_online_booking_banned === true;
      const isOnlineSource = ['QR', 'WEB', 'MOBILE_APP', 'WHATSAPP'].includes(entry.source);

      if (isBanned && isOnlineSource) {
        await client.query('ROLLBACK');
        return { entry, failure: 'BANNED' };
      }

      const result = await client.query<QueueEntryRow>(
        `UPDATE queue_entries
         SET status = 'CONFIRMED', confirmed_at = now(), updated_at = now()
         WHERE business_id = $1 AND id = $2 AND status = 'DRAFT'
         RETURNING ${ENTRY_COLUMNS}`,
        [businessId, entryId]
      );

      await client.query('COMMIT');
      return { entry: this.mapEntryRow(result.rows[0]) };
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectEntry(businessId: string, entryId: string): Promise<QueueEntry | null> {
    const result = await this.databaseService.query<QueueEntryRow>(
      `UPDATE queue_entries
       SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
       WHERE business_id = $1 AND id = $2 AND status IN ('DRAFT', 'CONFIRMED', 'WAITING')
       RETURNING ${ENTRY_COLUMNS}`,
      [businessId, entryId]
    );
    return this.mapEntryRow(result.rows[0]);
  }


  async findEntryByIdForBusiness(businessId: string, entryId: string): Promise<QueueEntry | null> {
    return this.findEntryById(businessId, entryId);
  }
  async getPosition(businessId: string, entryId: string): Promise<QueuePosition | null> {
    const entry = await this.findEntryById(businessId, entryId);
    if (!entry) {
      return null;
    }

    const queueResult = await this.databaseService.query<{ current_number: string | null }>(
      `SELECT current_number FROM queues WHERE business_id = $1 AND id = $2`,
      [businessId, entry.queueId]
    );
    const activeStatuses = ['CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE'];
    const totalResult = await this.databaseService.query<{ total_count: string }>(
      'SELECT COUNT(*) AS total_count FROM queue_entries WHERE business_id = $1 AND queue_id = $2 AND service_date = $3 AND status NOT IN ($4, $5)',
      [businessId, entry.queueId, entry.serviceDate, 'CANCELLED', 'NO_SHOW']
    );
    const totalQueueCount = Number(totalResult.rows[0]?.total_count ?? 0);


    if (!activeStatuses.includes(entry.status)) {
      return {
        queueNumber: entry.queueNumber,
        status: entry.status,
        currentServingNumber: queueResult.rows[0]?.current_number ?? null,
        position: 0,
        estimatedWaitingCount: 0,
        totalQueueCount
      };
    }

    const countResult = await this.databaseService.query<{ waiting_count: string }>(
      `SELECT COUNT(*) AS waiting_count
       FROM queue_entries
       WHERE business_id = $1
         AND queue_id = $2
         AND service_date = $3
         AND queue_sequence < $4
         AND status IN ('CONFIRMED', 'WAITING', 'CALLED', 'IN_SERVICE')`,
      [businessId, entry.queueId, entry.serviceDate, entry.queueSequence]
    );
    const estimatedWaitingCount = Number(countResult.rows[0]?.waiting_count ?? 0);

    return {
      queueNumber: entry.queueNumber,
      status: entry.status,
      currentServingNumber: queueResult.rows[0]?.current_number ?? null,
      position: estimatedWaitingCount + 1,
      estimatedWaitingCount,
      totalQueueCount
    };
  }

  async openQueue(businessId: string, branchId: string | null, serviceId: string | null, queueCode: string): Promise<Queue> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const queueDate = await this.getCurrentDate(client);
      const existing = await client.query<QueueRow>(
        `SELECT ${QUEUE_COLUMNS}
         FROM queues
         WHERE business_id = $1 AND code = $2 AND queue_date = $3
         FOR UPDATE`,
        [businessId, queueCode, queueDate]
      );
      const existingQueue = this.mapQueueRow(existing.rows[0]);

      if (existingQueue) {
        const updated = await client.query<QueueRow>(
          `UPDATE queues SET is_active = true, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING ${QUEUE_COLUMNS}`,
          [businessId, existingQueue.id]
        );
        await client.query('COMMIT');
        return this.mapQueueRow(updated.rows[0]) as Queue;
      }

      const created = await client.query<QueueRow>(
        `INSERT INTO queues (business_id, branch_id, service_id, queue_date, code, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING ${QUEUE_COLUMNS}`,
        [businessId, branchId, serviceId, queueDate, queueCode]
      );
      await client.query('COMMIT');
      return this.mapQueueRow(created.rows[0]) as Queue;
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async closeQueue(businessId: string, queueId: string): Promise<Queue | null> {
    const result = await this.databaseService.query<QueueRow>(
      `UPDATE queues SET is_active = false, updated_at = now() WHERE business_id = $1 AND id = $2 RETURNING ${QUEUE_COLUMNS}`,
      [businessId, queueId]
    );
    return this.mapQueueRow(result.rows[0]);
  }

  async findOpenActiveQueues(businessId: string, branchId?: string, serviceId?: string): Promise<Queue[]> {
    const params: unknown[] = [businessId];
    const filters = [`business_id = $1`, `queue_date = CURRENT_DATE`, `is_active = true`];

    if (branchId) {
      params.push(branchId);
      filters.push(`branch_id = $${params.length}`);
    }

    if (serviceId) {
      params.push(serviceId);
      filters.push(`service_id = $${params.length}`);
    }

    const result = await this.databaseService.query<QueueRow>(
      `SELECT ${QUEUE_COLUMNS} FROM queues WHERE ${filters.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return result.rows.map((row) => this.mapQueueRow(row) as Queue);
  }

  async findPendingRequests(businessId: string, branchId?: string, serviceId?: string): Promise<QueueEntry[]> {
    const params: unknown[] = [businessId];
    const filters = [`qe.business_id = $1`, `qe.service_date = CURRENT_DATE`, `qe.status = 'DRAFT'`, `qe.source IN ('QR', 'WEB', 'MOBILE_APP', 'WHATSAPP')`];

    if (branchId) {
      params.push(branchId);
      filters.push(`qe.branch_id = $${params.length}`);
    }

    if (serviceId) {
      params.push(serviceId);
      filters.push(`qe.service_id = $${params.length}`);
    }

    const result = await this.databaseService.query<QueueEntryRow>(
      `SELECT qe.id, qe.business_id, qe.queue_id, qe.branch_id, qe.service_id, qe.customer_id, qe.client_profile_id, qe.queue_number, qe.queue_sequence, qe.status, qe.source, qe.service_date, qe.confirmed_at, qe.called_at, qe.started_at, qe.completed_at, qe.cancelled_at, qe.no_show_marked_at, qe.created_at, qe.updated_at
       FROM queue_entries qe
       JOIN queues q ON q.id = qe.queue_id AND q.business_id = qe.business_id
       WHERE ${filters.join(' AND ')}
       ORDER BY qe.created_at ASC`,
      params
    );
    return result.rows.map((row) => this.mapEntryRow(row) as QueueEntry);
  }
  async findTodayQueues(businessId: string, branchId?: string, serviceId?: string): Promise<Queue[]> {
    const params: unknown[] = [businessId];
    const filters = [`business_id = $1`, `queue_date = CURRENT_DATE`];

    if (branchId) {
      params.push(branchId);
      filters.push(`branch_id = $${params.length}`);
    }

    if (serviceId) {
      params.push(serviceId);
      filters.push(`service_id = $${params.length}`);
    }

    const result = await this.databaseService.query<QueueRow>(
      `SELECT ${QUEUE_COLUMNS} FROM queues WHERE ${filters.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return result.rows.map((row) => this.mapQueueRow(row) as Queue);
  }

  async findEntriesByQueueId(businessId: string, queueId: string): Promise<QueueEntry[]> {
    const result = await this.databaseService.query<QueueEntryRow>(
      `SELECT ${ENTRY_COLUMNS}
       FROM queue_entries
       WHERE business_id = $1 AND queue_id = $2
       ORDER BY
         CASE
           WHEN status IN ('CALLED', 'IN_SERVICE') THEN 1
           WHEN status IN ('CONFIRMED', 'WAITING') THEN 2
           WHEN status = 'DRAFT' THEN 3
           ELSE 4
         END ASC,
         CASE WHEN source = 'OPERATOR' THEN 1 WHEN source = 'HARDWARE' THEN 2 ELSE 3 END ASC,
         queue_sequence ASC`,
      [businessId, queueId]
    );
    return result.rows.map((row) => this.mapEntryRow(row) as QueueEntry);
  }

  async callNext(businessId: string, queueId: string): Promise<QueueEntry | null> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const queueLock = await client.query<{ is_active: boolean }>(`SELECT is_active FROM queues WHERE business_id = $1 AND id = $2 FOR UPDATE`, [businessId, queueId]);
      if (queueLock.rows[0]?.is_active !== true) {
        await client.query('ROLLBACK');
        return null;
      }
      const entryResult = await client.query<QueueEntryRow>(
        `SELECT ${ENTRY_COLUMNS}
         FROM queue_entries
         WHERE business_id = $1 AND queue_id = $2 AND status IN ('CONFIRMED', 'WAITING')
         ORDER BY
           CASE WHEN source = 'OPERATOR' THEN 1 WHEN source = 'HARDWARE' THEN 2 ELSE 3 END ASC,
           queue_sequence ASC
         LIMIT 1
         FOR UPDATE`,
        [businessId, queueId]
      );
      const entry = this.mapEntryRow(entryResult.rows[0]);

      if (!entry) {
        await client.query('ROLLBACK');
        return null;
      }

      const updatedResult = await client.query<QueueEntryRow>(
        `UPDATE queue_entries
         SET status = 'CALLED', called_at = now(), updated_at = now()
         WHERE business_id = $1 AND id = $2 AND status IN ('CONFIRMED', 'WAITING')
         RETURNING ${ENTRY_COLUMNS}`,
        [businessId, entry.id]
      );
      const calledEntry = this.mapEntryRow(updatedResult.rows[0]) as QueueEntry;

      await client.query(
        `UPDATE queues SET current_number = $3, updated_at = now() WHERE business_id = $1 AND id = $2`,
        [businessId, queueId, calledEntry.queueNumber]
      );

      await client.query('COMMIT');
      return calledEntry;
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async findNextCallableEntry(businessId: string, queueId: string): Promise<QueueEntry | null> {
    const result = await this.databaseService.query<QueueEntryRow>(
      `SELECT ${ENTRY_COLUMNS}
       FROM queue_entries
       WHERE business_id = $1 AND queue_id = $2 AND status IN ('CONFIRMED', 'WAITING')
       ORDER BY
         CASE WHEN source = 'OPERATOR' THEN 1 WHEN source = 'HARDWARE' THEN 2 ELSE 3 END ASC,
         queue_sequence ASC
       LIMIT 1`,
      [businessId, queueId]
    );
    return this.mapEntryRow(result.rows[0]);
  }

  async updateEntryStatus(businessId: string, entryId: string, status: 'IN_SERVICE' | 'COMPLETED'): Promise<QueueEntry | null> {
    const timestampColumn = status === 'IN_SERVICE' ? 'started_at' : 'completed_at';
    const allowedCurrentStatus = status === 'IN_SERVICE' ? 'CALLED' : 'IN_SERVICE';
    const result = await this.databaseService.query<QueueEntryRow>(
      `UPDATE queue_entries
       SET status = $3, ${timestampColumn} = now(), updated_at = now()
       WHERE business_id = $1 AND id = $2 AND status = $4
       RETURNING ${ENTRY_COLUMNS}`,
      [businessId, entryId, status, allowedCurrentStatus]
    );
    return this.mapEntryRow(result.rows[0]);
  }

  async markNoShow(businessId: string, entryId: string): Promise<MarkNoShowResult> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<QueueEntryRow>(
        `UPDATE queue_entries
         SET status = 'NO_SHOW', no_show_marked_at = now(), updated_at = now()
         WHERE business_id = $1 AND id = $2 AND status IN ('CONFIRMED', 'WAITING', 'CALLED')
         RETURNING ${ENTRY_COLUMNS}`,
        [businessId, entryId]
      );
      const entry = this.mapEntryRow(result.rows[0]);

      if (!entry) {
        await client.query('ROLLBACK');
        return { entry: null, onlineBookingBanApplied: false };
      }

      const wasBannedResult = await client.query<{ is_online_booking_banned: boolean }>(
        `SELECT is_online_booking_banned FROM customers WHERE business_id = $1 AND id = $2 FOR UPDATE`,
        [businessId, entry.customerId]
      );
      const wasBanned = wasBannedResult.rows[0]?.is_online_booking_banned === true;
      const customerResult = await client.query<{ no_show_count: number }>(
        `UPDATE customers
         SET no_show_count = no_show_count + 1, updated_at = now()
         WHERE business_id = $1 AND id = $2
         RETURNING no_show_count`,
        [businessId, entry.customerId]
      );
      const noShowCount = customerResult.rows[0]?.no_show_count ?? 0;
      const settingsResult = await client.query<{ no_show_ban_limit: number }>(
        `SELECT no_show_ban_limit FROM business_profile_settings WHERE business_id = $1`,
        [businessId]
      );
      const banLimit = settingsResult.rows[0]?.no_show_ban_limit ?? 3;
      const shouldBan = !wasBanned && noShowCount >= banLimit;

      if (shouldBan) {
        await client.query(
          `UPDATE customers
           SET is_online_booking_banned = true,
               banned_at = now(),
               ban_reason = 'Exceeded no-show limit',
               updated_at = now()
           WHERE business_id = $1 AND id = $2`,
          [businessId, entry.customerId]
        );
      }

      await client.query('COMMIT');
      return { entry, onlineBookingBanApplied: shouldBan };
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async getNotificationContext(businessId: string, entryId: string): Promise<QueueNotificationContext | null> {
    const result = await this.databaseService.query<{
      business_name: string;
      queue_entry_id: string;
      customer_id: string;
      client_profile_id: string;
      customer_name: string;
      customer_phone: string;
      language: 'en' | 'si';
      queue_number: string;
      current_number: string | null;
    }>(
      `SELECT b.name AS business_name,
              c.id AS customer_id,
              cp.id AS client_profile_id,
              cp.full_name AS customer_name,
              c.primary_phone AS customer_phone,
              c.preferred_language AS language,
              qe.id AS queue_entry_id,
              qe.queue_number,
              q.current_number
       FROM queue_entries qe
       JOIN businesses b ON b.id = qe.business_id
       JOIN customers c ON c.id = qe.customer_id
       JOIN client_profiles cp ON cp.id = qe.client_profile_id
       JOIN queues q ON q.id = qe.queue_id
       WHERE qe.business_id = $1 AND qe.id = $2
       LIMIT 1`,
      [businessId, entryId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    const position = await this.getPosition(businessId, entryId);

    return {
      queueEntryId: row.queue_entry_id,
      businessName: row.business_name,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      language: row.language,
      queueNumber: row.queue_number,
      currentNumber: row.current_number,
      position: position?.position ?? 0
    };
  }

  private async getCurrentDate(client: PoolClient): Promise<string> {
    const result = await client.query<{ service_date: string }>(`SELECT CURRENT_DATE::text AS service_date`);
    return result.rows[0].service_date;
  }

  private async getQueueNumberLength(client: PoolClient, businessId: string): Promise<number> {
    const result = await client.query<{ queue_number_length: number }>(
      `SELECT queue_number_length FROM business_profile_settings WHERE business_id = $1`,
      [businessId]
    );
    return result.rows[0]?.queue_number_length ?? 3;
  }

  private async findOpenQueueForJoin(
    client: PoolClient,
    businessId: string,
    branchId: string | null,
    serviceId: string | null,
    queueDate: string,
    queueCode: string
  ): Promise<Queue | null> {
    const existing = await client.query<QueueRow>(
      `SELECT ${QUEUE_COLUMNS}
       FROM queues
       WHERE business_id = $1
         AND code = $2
         AND queue_date = $3
         AND is_active = true
         AND ($4::uuid IS NULL OR branch_id = $4::uuid)
         AND ($5::uuid IS NULL OR service_id = $5::uuid)
       FOR UPDATE`,
      [businessId, queueCode, queueDate, branchId, serviceId]
    );
    return this.mapQueueRow(existing.rows[0]);
  }
  private async findEntryById(businessId: string, entryId: string): Promise<QueueEntry | null> {
    const result = await this.databaseService.query<QueueEntryRow>(
      `SELECT ${ENTRY_COLUMNS} FROM queue_entries WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, entryId]
    );
    return this.mapEntryRow(result.rows[0]);
  }

  private mapQueueRow(row?: QueueRow): Queue | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      branchId: row.branch_id,
      serviceId: row.service_id,
      queueDate: row.queue_date,
      code: row.code,
      currentNumber: row.current_number,
      lastIssuedNumber: row.last_issued_number,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapEntryRow(row?: QueueEntryRow): QueueEntry | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      queueId: row.queue_id,
      branchId: row.branch_id,
      serviceId: row.service_id,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      queueNumber: row.queue_number,
      queueSequence: row.queue_sequence,
      status: row.status,
      source: row.source,
      serviceDate: row.service_date,
      confirmedAt: row.confirmed_at,
      calledAt: row.called_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      noShowMarkedAt: row.no_show_marked_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
