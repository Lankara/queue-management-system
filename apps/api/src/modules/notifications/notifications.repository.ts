import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CopyGlobalTemplateDto } from './dto/copy-global-template.dto';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { MarkNotificationStatusDto } from './dto/mark-notification-status.dto';
import { NotificationLogQueryDto } from './dto/notification-log-query.dto';
import { NotificationTemplateQueryDto } from './dto/notification-template-query.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import {
  NotificationChannel,
  NotificationLanguage,
  NotificationLog,
  NotificationStatus,
  NotificationTemplate,
  TemplateKey
} from './interfaces/notification.interface';

interface TemplateRow {
  id: string;
  business_id: string | null;
  language: NotificationLanguage;
  template_key: TemplateKey;
  channel: NotificationChannel;
  title: string | null;
  message_body: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

interface DispatchSummaryCounts {
  pending_count: string;
  sent_today: string;
  failed_today: string;
  whatsapp_sent_today: string;
}

interface LogRow {
  id: string;
  business_id: string;
  customer_id: string | null;
  client_profile_id: string | null;
  appointment_id: string | null;
  queue_entry_id: string | null;
  channel: NotificationChannel;
  language: NotificationLanguage;
  template_key: TemplateKey | null;
  recipient: string;
  message_body: string;
  status: NotificationStatus;
  sent_at: Date | null;
  failed_reason: string | null;
  created_at: Date;
}

const TEMPLATE_COLUMNS = `id, business_id, language, template_key, channel, title, message_body, is_active, created_at, updated_at`;
const LOG_COLUMNS = `id, business_id, customer_id, client_profile_id, appointment_id, queue_entry_id, channel, language, template_key, recipient, message_body, status, sent_at, failed_reason, created_at`;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findTemplates(businessId: string, query: NotificationTemplateQueryDto): Promise<NotificationTemplate[]> {
    const params: unknown[] = [businessId];
    const filters = ['(business_id = $1 OR business_id IS NULL)'];

    if (query.language) {
      params.push(query.language);
      filters.push(`language = $${params.length}`);
    }
    if (query.channel) {
      params.push(query.channel);
      filters.push(`channel = $${params.length}`);
    }
    if (query.templateKey) {
      params.push(query.templateKey);
      filters.push(`template_key = $${params.length}`);
    }
    if (query.isActive !== undefined) {
      params.push(query.isActive);
      filters.push(`is_active = $${params.length}`);
    }

    const result = await this.databaseService.query<TemplateRow>(
      `SELECT ${TEMPLATE_COLUMNS}
       FROM notification_templates
       WHERE ${filters.join(' AND ')}
       ORDER BY business_id NULLS FIRST, language, template_key, channel`,
      params
    );
    return result.rows.map((row) => this.mapTemplateRow(row));
  }

  async findTemplateById(businessId: string, id: string): Promise<NotificationTemplate | null> {
    const result = await this.databaseService.query<TemplateRow>(
      `SELECT ${TEMPLATE_COLUMNS}
       FROM notification_templates
       WHERE id = $2 AND (business_id = $1 OR business_id IS NULL)
       LIMIT 1`,
      [businessId, id]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  async createBusinessTemplate(businessId: string, data: CreateNotificationTemplateDto): Promise<NotificationTemplate> {
    const result = await this.databaseService.query<TemplateRow>(
      `INSERT INTO notification_templates (business_id, language, template_key, channel, title, message_body, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${TEMPLATE_COLUMNS}`,
      [businessId, data.language, data.templateKey, data.channel, data.title ?? null, data.messageBody, data.isActive ?? true]
    );
    return this.mapTemplateRow(result.rows[0]);
  }

  async updateBusinessTemplate(businessId: string, id: string, data: UpdateNotificationTemplateDto): Promise<NotificationTemplate | null> {
    const fieldMap: Record<string, string> = {
      title: 'title',
      messageBody: 'message_body',
      isActive: 'is_active'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findBusinessTemplateById(businessId, id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<TemplateRow>(
      `UPDATE notification_templates
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${TEMPLATE_COLUMNS}`,
      [businessId, id, ...values]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  async findBusinessTemplateById(businessId: string, id: string): Promise<NotificationTemplate | null> {
    const result = await this.databaseService.query<TemplateRow>(
      `SELECT ${TEMPLATE_COLUMNS} FROM notification_templates WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, id]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  async copyGlobalTemplate(businessId: string, data: CopyGlobalTemplateDto): Promise<NotificationTemplate | null> {
    const existing = await this.findActiveTemplateForBusinessOnly(businessId, data.language, data.templateKey, data.channel);
    if (existing) {
      return existing;
    }

    const result = await this.databaseService.query<TemplateRow>(
      `INSERT INTO notification_templates (business_id, language, template_key, channel, title, message_body, is_active)
       SELECT $1, language, template_key, channel, title, message_body, is_active
       FROM notification_templates
       WHERE business_id IS NULL
         AND language = $2
         AND template_key = $3
         AND channel = $4
       LIMIT 1
       RETURNING ${TEMPLATE_COLUMNS}`,
      [businessId, data.language, data.templateKey, data.channel]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  async findActiveTemplate(
    businessId: string,
    language: NotificationLanguage,
    templateKey: TemplateKey,
    channel: NotificationChannel
  ): Promise<NotificationTemplate | null> {
    const businessTemplate = await this.findActiveTemplateForBusinessOnly(businessId, language, templateKey, channel);
    if (businessTemplate) {
      return businessTemplate;
    }

    const result = await this.databaseService.query<TemplateRow>(
      `SELECT ${TEMPLATE_COLUMNS}
       FROM notification_templates
       WHERE business_id IS NULL
         AND language = $1
         AND template_key = $2
         AND channel = $3
         AND is_active = true
       LIMIT 1`,
      [language, templateKey, channel]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  async createLog(businessId: string, data: CreateNotificationLogDto): Promise<NotificationLog> {
    const result = await this.databaseService.query<LogRow>(
      `INSERT INTO notifications (business_id, customer_id, client_profile_id, appointment_id, queue_entry_id, channel, language, template_key, recipient, message_body, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ${LOG_COLUMNS}`,
      [
        businessId,
        data.customerId ?? null,
        data.clientProfileId ?? null,
        data.appointmentId ?? null,
        data.queueEntryId ?? null,
        data.channel,
        data.language,
        data.templateKey ?? null,
        data.recipient,
        data.messageBody,
        data.status ?? 'PENDING'
      ]
    );
    return this.mapLogRow(result.rows[0]);
  }

  async getDispatchSummaryCounts(): Promise<{ pendingCount: number; sentToday: number; failedToday: number; whatsappSentToday: number }> {
    const result = await this.databaseService.query<DispatchSummaryCounts>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
         COUNT(*) FILTER (WHERE status = 'SENT' AND sent_at::date = CURRENT_DATE) AS sent_today,
         COUNT(*) FILTER (WHERE status = 'FAILED' AND created_at::date = CURRENT_DATE) AS failed_today,
         COUNT(*) FILTER (WHERE status = 'SENT' AND channel = 'WHATSAPP' AND sent_at::date = CURRENT_DATE) AS whatsapp_sent_today
       FROM notifications`
    );
    const row = result.rows[0];
    return {
      pendingCount: Number(row?.pending_count ?? 0),
      sentToday: Number(row?.sent_today ?? 0),
      failedToday: Number(row?.failed_today ?? 0),
      whatsappSentToday: Number(row?.whatsapp_sent_today ?? 0)
    };
  }
  async findPendingLogs(limit: number): Promise<NotificationLog[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const result = await this.databaseService.query<LogRow>(
      `SELECT ${LOG_COLUMNS}
       FROM notifications
       WHERE status = 'PENDING'
       ORDER BY created_at ASC
       LIMIT $1`,
      [safeLimit]
    );
    return result.rows.map((row) => this.mapLogRow(row));
  }
  async findLogs(businessId: string, query: NotificationLogQueryDto): Promise<NotificationLog[]> {
    const params: unknown[] = [businessId];
    const filters = ['business_id = $1'];

    if (query.customerId) {
      params.push(query.customerId);
      filters.push(`customer_id = $${params.length}`);
    }
    if (query.appointmentId) {
      params.push(query.appointmentId);
      filters.push(`appointment_id = $${params.length}`);
    }
    if (query.queueEntryId) {
      params.push(query.queueEntryId);
      filters.push(`queue_entry_id = $${params.length}`);
    }
    if (query.status) {
      params.push(query.status);
      filters.push(`status = $${params.length}`);
    }
    if (query.channel) {
      params.push(query.channel);
      filters.push(`channel = $${params.length}`);
    }
    if (query.from) {
      params.push(query.from);
      filters.push(`created_at >= $${params.length}`);
    }
    if (query.to) {
      params.push(query.to);
      filters.push(`created_at <= $${params.length}`);
    }

    const result = await this.databaseService.query<LogRow>(
      `SELECT ${LOG_COLUMNS}
       FROM notifications
       WHERE ${filters.join(' AND ')}
       ORDER BY created_at DESC`,
      params
    );
    return result.rows.map((row) => this.mapLogRow(row));
  }

  async findLogById(businessId: string, id: string): Promise<NotificationLog | null> {
    const result = await this.databaseService.query<LogRow>(
      `SELECT ${LOG_COLUMNS} FROM notifications WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, id]
    );
    return this.mapLogRowOrNull(result.rows[0]);
  }

  async markLogStatus(businessId: string, id: string, data: MarkNotificationStatusDto): Promise<NotificationLog | null> {
    const result = await this.databaseService.query<LogRow>(
      `UPDATE notifications
       SET status = $3,
           sent_at = CASE WHEN $3 = 'SENT' THEN now() ELSE sent_at END,
           failed_reason = CASE WHEN $3 = 'FAILED' THEN $4 ELSE NULL END
       WHERE business_id = $1 AND id = $2
       RETURNING ${LOG_COLUMNS}`,
      [businessId, id, data.status, data.failedReason ?? null]
    );
    return this.mapLogRowOrNull(result.rows[0]);
  }

  private async findActiveTemplateForBusinessOnly(
    businessId: string,
    language: NotificationLanguage,
    templateKey: TemplateKey,
    channel: NotificationChannel
  ): Promise<NotificationTemplate | null> {
    const result = await this.databaseService.query<TemplateRow>(
      `SELECT ${TEMPLATE_COLUMNS}
       FROM notification_templates
       WHERE business_id = $1
         AND language = $2
         AND template_key = $3
         AND channel = $4
         AND is_active = true
       LIMIT 1`,
      [businessId, language, templateKey, channel]
    );
    return this.mapTemplateRowOrNull(result.rows[0]);
  }

  private mapTemplateRow(row: TemplateRow): NotificationTemplate {
    return {
      id: row.id,
      businessId: row.business_id,
      language: row.language,
      templateKey: row.template_key,
      channel: row.channel,
      title: row.title,
      messageBody: row.message_body,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapTemplateRowOrNull(row?: TemplateRow): NotificationTemplate | null {
    return row ? this.mapTemplateRow(row) : null;
  }

  private mapLogRow(row: LogRow): NotificationLog {
    return {
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      appointmentId: row.appointment_id,
      queueEntryId: row.queue_entry_id,
      channel: row.channel,
      language: row.language,
      templateKey: row.template_key,
      recipient: row.recipient,
      messageBody: row.message_body,
      status: row.status,
      sentAt: row.sent_at,
      failedReason: row.failed_reason,
      createdAt: row.created_at
    };
  }

  private mapLogRowOrNull(row?: LogRow): NotificationLog | null {
    return row ? this.mapLogRow(row) : null;
  }
}

