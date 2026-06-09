import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { CallNextDto } from './dto/call-next.dto';
import { ConfirmQueueEntryDto } from './dto/confirm-queue-entry.dto';
import { CreateQueueJoinDto } from './dto/create-queue-join.dto';
import { OpenQueueDto } from './dto/open-queue.dto';
import { QueuePositionQueryDto } from './dto/queue-position-query.dto';
import { RejectQueueEntryDto } from './dto/reject-queue-entry.dto';
import { TodayQueuesQueryDto } from './dto/today-queues-query.dto';
import { QueuesService } from './queues.service';

@BusinessParam('businessId')
@Controller('businesses/:businessId')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Public()
  @Post('queues/join-draft')
  async joinDraft(@Param('businessId') businessId: string, @Body() data: CreateQueueJoinDto) {
    return successResponse(await this.queuesService.joinDraft(businessId, data));
  }

  @Public()
  @Patch('queue-entries/:entryId/confirm')
  async confirmEntry(@Param('businessId') businessId: string, @Param('entryId') entryId: string, @Body() data: ConfirmQueueEntryDto) {
    return successResponse(await this.queuesService.confirmEntry(businessId, entryId, data));
  }

  @Public()
  @Patch('queue-entries/:entryId/reject')
  async rejectEntry(@Param('businessId') businessId: string, @Param('entryId') entryId: string, @Body() data: RejectQueueEntryDto) {
    return successResponse(await this.queuesService.rejectEntry(businessId, entryId, data));
  }

  @Public()
  @Get('queue-entries/:entryId/position')
  async getPosition(@Param('businessId') businessId: string, @Param('entryId') entryId: string, @Query() query: QueuePositionQueryDto) {
    return successResponse(await this.queuesService.getPosition(businessId, entryId, query));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Post('queues/open')
  async openQueue(@Param('businessId') businessId: string, @Body() data: OpenQueueDto) {
    return successResponse(await this.queuesService.openQueue(businessId, data));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
  @Get('queues/open-active')
  async findOpenActiveQueues(@Param('businessId') businessId: string, @Query() query: TodayQueuesQueryDto) {
    return successResponse(await this.queuesService.findOpenActiveQueues(businessId, query));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
  @Get('queues/pending-requests')
  async findPendingRequests(@Param('businessId') businessId: string, @Query() query: TodayQueuesQueryDto) {
    return successResponse(await this.queuesService.findPendingRequests(businessId, query));
  }
  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
  @Get('queues/today')
  async findTodayQueues(@Param('businessId') businessId: string, @Query() query: TodayQueuesQueryDto) {
    return successResponse(await this.queuesService.findTodayQueues(businessId, query));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
  @Get('queues/:queueId/entries')
  async findEntriesByQueueId(@Param('businessId') businessId: string, @Param('queueId') queueId: string) {
    return successResponse(await this.queuesService.findEntriesByQueueId(businessId, queueId));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queues/:queueId/close')
  async closeQueue(@Param('businessId') businessId: string, @Param('queueId') queueId: string) {
    return successResponse(await this.queuesService.closeQueue(businessId, queueId));
  }
  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queues/:queueId/call-next')
  async callNext(@Param('businessId') businessId: string, @Param('queueId') queueId: string, @Body() data: CallNextDto) {
    return successResponse(await this.queuesService.callNext(businessId, queueId, data));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queue-entries/:entryId/approve')
  async approveEntry(@Param('businessId') businessId: string, @Param('entryId') entryId: string, @Body() data: ConfirmQueueEntryDto) {
    return successResponse(await this.queuesService.approveEntry(businessId, entryId, data));
  }
  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queue-entries/:entryId/start-service')
  async startService(@Param('businessId') businessId: string, @Param('entryId') entryId: string) {
    return successResponse(await this.queuesService.startService(businessId, entryId));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queue-entries/:entryId/complete')
  async complete(@Param('businessId') businessId: string, @Param('entryId') entryId: string) {
    return successResponse(await this.queuesService.complete(businessId, entryId));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
  @Patch('queue-entries/:entryId/no-show')
  async markNoShow(@Param('businessId') businessId: string, @Param('entryId') entryId: string) {
    return successResponse(await this.queuesService.markNoShow(businessId, entryId));
  }
}
