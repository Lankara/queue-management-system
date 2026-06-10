import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CallNextDto } from './dto/call-next.dto';
import { ConfirmQueueEntryDto } from './dto/confirm-queue-entry.dto';
import { CreateQueueJoinDto } from './dto/create-queue-join.dto';
import { OpenQueueDto } from './dto/open-queue.dto';
import { QueuePositionQueryDto } from './dto/queue-position-query.dto';
import { RejectQueueEntryDto } from './dto/reject-queue-entry.dto';
import { TodayQueuesQueryDto } from './dto/today-queues-query.dto';
import { Queue, QueueEntry, QueuePosition } from './interfaces/queue.interface';
import { QueueNotificationContext, QueuesRepository } from './queues.repository';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    private readonly queuesRepository: QueuesRepository,
    private readonly notificationsService: NotificationsService
  ) {}

  async joinDraft(businessId: string, data: CreateQueueJoinDto): Promise<QueueEntry> {
    try {
      const entry = await this.queuesRepository.createDraftEntry(businessId, data, this.createQueueCode(data.branchId, data.serviceId));
      if (!entry) {
        throw new BadRequestException('Queue is not open yet. Please contact staff or try again later.');
      }
      if (data.insertBeforeEntryId) {
        await this.createQueueNotification(businessId, data.insertBeforeEntryId, 'QUEUE_POSITION_UPDATED', {
          alert_type: 'QUEUE_NUMBER_CHANGED',
          message: 'Your queue number was updated because the counter inserted an earlier customer before your appointment time.'
        });
      }
      return entry;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async confirmEntry(businessId: string, entryId: string, data: ConfirmQueueEntryDto): Promise<QueueEntry> {
    try {
      const result = await this.queuesRepository.confirmDraftEntry(businessId, entryId, data);

      if (!result.entry) {
        throw new NotFoundException('Queue entry not found');
      }

      if (result.failure === 'BANNED') {
        throw new ConflictException('Customer is banned from online queue bookings');
      }

      if (result.failure === 'INVALID_STATUS') {
        throw new BadRequestException(`Queue entry cannot be confirmed from status ${result.currentStatus}`);
      }

      if (data.insertBeforeEntryId) {
        await this.createQueueNotification(businessId, data.insertBeforeEntryId, 'QUEUE_POSITION_UPDATED', {
          alert_type: 'QUEUE_NUMBER_CHANGED',
          message: 'Your queue number was updated because the counter confirmed an earlier customer before your appointment time.'
        });
      }

      await this.createQueueNotification(businessId, result.entry.id, 'QUEUE_CONFIRMED');
      return result.entry;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }


  async getEntryForPublicConfirmation(businessId: string, entryId: string): Promise<QueueEntry> {
    const entry = await this.queuesRepository.findEntryByIdForBusiness(businessId, entryId);
    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }
    return entry;
  }
  async rejectEntry(businessId: string, entryId: string, _data: RejectQueueEntryDto): Promise<QueueEntry> {
    try {
      const entry = await this.queuesRepository.rejectEntry(businessId, entryId);
      if (!entry) {
        throw new NotFoundException('Queue entry not found or cannot be rejected from its current status');
      }
      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async getPosition(businessId: string, entryId: string, query: QueuePositionQueryDto): Promise<QueuePosition> {
    const position = await this.queuesRepository.getPosition(businessId, entryId);
    if (!position) {
      throw new NotFoundException('Queue entry not found');
    }

    if (query.logNotification) {
      await this.createQueueNotification(businessId, entryId, 'QUEUE_POSITION_UPDATED');
    }

    return position;
  }

  findTodayQueues(businessId: string, query: TodayQueuesQueryDto): Promise<Queue[]> {
    return this.queuesRepository.findTodayQueues(businessId, query.branchId, query.serviceId);
  }

  async openQueue(businessId: string, data: OpenQueueDto): Promise<Queue> {
    try {
      return await this.queuesRepository.openQueue(businessId, data.branchId ?? null, data.serviceId ?? null, this.createQueueCode(data.branchId, data.serviceId));
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async closeQueue(businessId: string, queueId: string): Promise<Queue> {
    try {
      const queue = await this.queuesRepository.closeQueue(businessId, queueId);
      if (!queue) throw new NotFoundException('Queue not found');
      return queue;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw mapDatabaseError(error);
    }
  }

  findOpenActiveQueues(businessId: string, query: TodayQueuesQueryDto): Promise<Queue[]> {
    return this.queuesRepository.findOpenActiveQueues(businessId, query.branchId, query.serviceId);
  }

  findPendingRequests(businessId: string, query: TodayQueuesQueryDto): Promise<QueueEntry[]> {
    return this.queuesRepository.findPendingRequests(businessId, query.branchId, query.serviceId);
  }

  approveEntry(businessId: string, entryId: string, data: ConfirmQueueEntryDto): Promise<QueueEntry> {
    return this.confirmEntry(businessId, entryId, data);
  }
  findEntriesByQueueId(businessId: string, queueId: string): Promise<QueueEntry[]> {
    return this.queuesRepository.findEntriesByQueueId(businessId, queueId);
  }

  async callNext(businessId: string, queueId: string, _data: CallNextDto): Promise<QueueEntry> {
    try {
      const entry = await this.queuesRepository.callNext(businessId, queueId);
      if (!entry) {
        throw new NotFoundException('No confirmed or waiting queue entries found');
      }

      await this.createQueueNotification(businessId, entry.id, 'QUEUE_POSITION_UPDATED', {
        alert_type: 'NOW_SERVING',
        message: 'Your queue number is now being served.'
      });

      const nextEntry = await this.queuesRepository.findNextCallableEntry(businessId, queueId);
      if (nextEntry) {
        await this.createQueueNotification(businessId, nextEntry.id, 'QUEUE_POSITION_UPDATED', {
          alert_type: 'BE_PREPARED',
          message: 'Your queue number is next. Please be prepared.'
        });
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async startService(businessId: string, entryId: string): Promise<QueueEntry> {
    return this.updateStatusOrThrow(businessId, entryId, 'IN_SERVICE', 'Queue entry not found');
  }

  async complete(businessId: string, entryId: string): Promise<QueueEntry> {
    return this.updateStatusOrThrow(businessId, entryId, 'COMPLETED', 'Queue entry not found');
  }

  async markNoShow(businessId: string, entryId: string): Promise<QueueEntry> {
    try {
      const result = await this.queuesRepository.markNoShow(businessId, entryId);
      if (!result.entry) {
        throw new NotFoundException('Queue entry not found');
      }

      await this.createQueueNotification(businessId, result.entry.id, 'NO_SHOW_WARNING', {
        reason: 'No-show marked'
      });

      if (result.onlineBookingBanApplied) {
        await this.createQueueNotification(businessId, result.entry.id, 'ONLINE_BOOKING_BANNED', {
          reason: 'Exceeded no-show limit'
        });
      }

      return result.entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private async updateStatusOrThrow(
    businessId: string,
    entryId: string,
    status: 'IN_SERVICE' | 'COMPLETED',
    notFoundMessage: string
  ): Promise<QueueEntry> {
    try {
      const entry = await this.queuesRepository.updateEntryStatus(businessId, entryId, status);
      if (!entry) {
        throw new NotFoundException(notFoundMessage);
      }
      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private async createQueueNotification(
    businessId: string,
    entryId: string,
    templateKey: 'QUEUE_CONFIRMED' | 'QUEUE_POSITION_UPDATED' | 'NO_SHOW_WARNING' | 'ONLINE_BOOKING_BANNED',
    extraVariables: Record<string, unknown> = {}
  ): Promise<void> {
    const context = await this.queuesRepository.getNotificationContext(businessId, entryId);
    if (!context) {
      return;
    }

    await this.safeCreateRenderedNotificationLog(businessId, context, templateKey, extraVariables);
  }

  private async safeCreateRenderedNotificationLog(
    businessId: string,
    context: QueueNotificationContext,
    templateKey: 'QUEUE_CONFIRMED' | 'QUEUE_POSITION_UPDATED' | 'NO_SHOW_WARNING' | 'ONLINE_BOOKING_BANNED',
    extraVariables: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.notificationsService.createRenderedLog(businessId, {
        customerId: context.customerId,
        clientProfileId: context.clientProfileId,
        queueEntryId: context.queueEntryId,
        language: context.language,
        templateKey,
        channel: 'WHATSAPP',
        recipient: context.customerPhone,
        variables: {
          customer_name: context.customerName,
          business_name: context.businessName,
          queue_number: context.queueNumber,
          current_number: context.currentNumber ?? '',
          position: context.position,
          ...extraVariables
        }
      });
    } catch (error) {
      this.logger.warn(`Notification log creation failed for ${templateKey}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private createQueueCode(branchId?: string, serviceId?: string): string {
    const queueKey = `${branchId ?? 'all'}:${serviceId ?? 'all'}`;
    return `q:${createHash('sha256').update(queueKey).digest('hex').slice(0, 32)}`;
  }
}
