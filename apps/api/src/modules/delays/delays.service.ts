import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDelayEventDto } from './dto/create-delay-event.dto';
import { DelayListQueryDto } from './dto/delay-list-query.dto';
import { DelayNotificationContext, DelayOperationResult, QueueDelayEvent } from './interfaces/delay.interface';
import { DelaysRepository } from './delays.repository';

@Injectable()
export class DelaysService {
  private readonly logger = new Logger(DelaysService.name);

  constructor(
    private readonly delaysRepository: DelaysRepository,
    private readonly notificationsService: NotificationsService
  ) {}

  async createDelayEvent(businessId: string, data: CreateDelayEventDto): Promise<DelayOperationResult> {
    try {
      const result = await this.delaysRepository.createDelayAndShiftAppointments(businessId, data);

      for (const context of result.notificationContexts) {
        await this.safeCreateRenderedNotificationLog(businessId, context, data);
      }

      return {
        delayEvent: result.delayEvent,
        affectedCount: result.affectedCount,
        affectedAppointments: result.affectedAppointments.map((appointment) => ({
          appointmentId: appointment.appointmentId,
          customerId: appointment.customerId,
          clientProfileId: appointment.clientProfileId,
          oldStartTime: appointment.oldStartTime,
          newStartTime: appointment.newStartTime,
          queueNumber: appointment.queueNumber
        }))
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAll(businessId: string, query: DelayListQueryDto): Promise<QueueDelayEvent[]> {
    return this.delaysRepository.findAll(businessId, query);
  }

  async findById(businessId: string, id: string): Promise<QueueDelayEvent> {
    const delayEvent = await this.delaysRepository.findById(businessId, id);
    if (!delayEvent) {
      throw new NotFoundException('Delay event not found');
    }
    return delayEvent;
  }

  private async safeCreateRenderedNotificationLog(
    businessId: string,
    context: DelayNotificationContext,
    data: CreateDelayEventDto
  ): Promise<void> {
    try {
      await this.notificationsService.createRenderedLog(businessId, {
        customerId: context.customerId,
        clientProfileId: context.clientProfileId,
        appointmentId: context.appointmentId,
        language: context.language,
        templateKey: 'DELAY_NOTICE',
        channel: 'WHATSAPP',
        recipient: context.customerPhone,
        variables: {
          customer_name: context.customerName,
          business_name: context.businessName,
          delay_minutes: data.delayMinutes,
          reason: data.reason ?? 'Service provider delayed',
          appointment_time: context.oldStartTime.toISOString(),
          new_appointment_time: context.newStartTime.toISOString(),
          queue_number: context.queueNumber ?? ''
        }
      });
    } catch (error) {
      this.logger.warn(`Notification log creation failed for DELAY_NOTICE: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}