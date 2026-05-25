import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { NotificationDispatcherService } from './notification-dispatcher.service';

interface DispatchPendingBody {
  limit?: number;
}

function resolveLimit(bodyLimit?: number, queryLimit?: string): number {
  const parsed = Number(bodyLimit ?? queryLimit ?? 25);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 25;
}

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
@Controller('notifications')
export class NotificationDispatchController {
  constructor(private readonly notificationDispatcherService: NotificationDispatcherService) {}

  @Post('dispatch-pending')
  async dispatchPending(@Body() body: DispatchPendingBody, @Query('limit') queryLimit?: string) {
    return successResponse(await this.notificationDispatcherService.dispatchPendingNotifications(resolveLimit(body.limit, queryLimit)));
  }

  @Get('dispatch-summary')
  async getDispatchSummary() {
    return successResponse(await this.notificationDispatcherService.getDispatchSummary());
  }
}
