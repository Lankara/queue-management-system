import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { CopyGlobalTemplateDto } from './dto/copy-global-template.dto';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { MarkNotificationStatusDto } from './dto/mark-notification-status.dto';
import { NotificationLogQueryDto } from './dto/notification-log-query.dto';
import { NotificationTemplateQueryDto } from './dto/notification-template-query.dto';
import { RenderNotificationDto } from './dto/render-notification.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import {
  NotificationChannel,
  NotificationLanguage,
  NotificationLog,
  NotificationTemplate,
  RenderedNotification,
  RenderNotificationInput,
  TemplateKey
} from './interfaces/notification.interface';
import { NotificationsRepository } from './notifications.repository';

export interface CreateRenderedNotificationLogInput extends RenderNotificationInput {
  customerId?: string;
  clientProfileId?: string;
  appointmentId?: string;
  queueEntryId?: string;
  recipient: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  findTemplates(businessId: string, query: NotificationTemplateQueryDto): Promise<NotificationTemplate[]> {
    return this.notificationsRepository.findTemplates(businessId, query);
  }

  async findTemplateById(businessId: string, id: string): Promise<NotificationTemplate> {
    const template = await this.notificationsRepository.findTemplateById(businessId, id);
    if (!template) {
      throw new NotFoundException('Notification template not found');
    }
    return template;
  }

  async createBusinessTemplate(businessId: string, data: CreateNotificationTemplateDto): Promise<NotificationTemplate> {
    try {
      return await this.notificationsRepository.createBusinessTemplate(businessId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async updateBusinessTemplate(businessId: string, id: string, data: UpdateNotificationTemplateDto): Promise<NotificationTemplate> {
    try {
      const template = await this.notificationsRepository.updateBusinessTemplate(businessId, id, data);
      if (!template) {
        throw new NotFoundException('Business-specific notification template not found');
      }
      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async copyGlobalTemplate(businessId: string, data: CopyGlobalTemplateDto): Promise<NotificationTemplate> {
    try {
      const template = await this.notificationsRepository.copyGlobalTemplate(businessId, data);
      if (!template) {
        throw new NotFoundException('Global notification template not found');
      }
      return template;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  renderTemplate(
    businessId: string,
    language: NotificationLanguage,
    templateKey: TemplateKey,
    channel: NotificationChannel,
    variables: Record<string, unknown>
  ): Promise<RenderedNotification> {
    return this.renderTemplateInternal(businessId, { language, templateKey, channel, variables });
  }

  async renderTemplateFromDto(businessId: string, data: RenderNotificationDto): Promise<RenderedNotification> {
    return this.renderTemplateInternal(businessId, data);
  }

  async createLog(businessId: string, data: CreateNotificationLogDto): Promise<NotificationLog> {
    try {
      return await this.notificationsRepository.createLog(businessId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async createRenderedLog(businessId: string, input: CreateRenderedNotificationLogInput): Promise<NotificationLog> {
    const rendered = await this.renderTemplateInternal(businessId, input);
    return this.createLog(businessId, {
      customerId: input.customerId,
      clientProfileId: input.clientProfileId,
      appointmentId: input.appointmentId,
      queueEntryId: input.queueEntryId,
      channel: input.channel,
      language: input.language,
      templateKey: input.templateKey,
      recipient: input.recipient,
      messageBody: rendered.messageBody,
      status: 'PENDING'
    });
  }

  findLogs(businessId: string, query: NotificationLogQueryDto): Promise<NotificationLog[]> {
    return this.notificationsRepository.findLogs(businessId, query);
  }

  async findLogById(businessId: string, id: string): Promise<NotificationLog> {
    const log = await this.notificationsRepository.findLogById(businessId, id);
    if (!log) {
      throw new NotFoundException('Notification log not found');
    }
    return log;
  }

  async markLogStatus(businessId: string, id: string, data: MarkNotificationStatusDto): Promise<NotificationLog> {
    try {
      const log = await this.notificationsRepository.markLogStatus(businessId, id, data);
      if (!log) {
        throw new NotFoundException('Notification log not found');
      }
      return log;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private async renderTemplateInternal(businessId: string, input: RenderNotificationInput): Promise<RenderedNotification> {
    const template = await this.notificationsRepository.findActiveTemplate(
      businessId,
      input.language,
      input.templateKey,
      input.channel
    );

    if (!template) {
      throw new NotFoundException('Active notification template not found');
    }

    return {
      templateId: template.id,
      title: template.title ? this.renderText(template.title, input.variables) : null,
      messageBody: this.renderText(template.messageBody, input.variables)
    };
  }

  private renderText(text: string, variables: Record<string, unknown>): string {
    return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => {
      if (!Object.prototype.hasOwnProperty.call(variables, key)) {
        return match;
      }

      const value = variables[key];
      return value === null || value === undefined ? '' : String(value);
    });
  }
}