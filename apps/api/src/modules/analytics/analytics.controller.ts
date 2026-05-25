import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';
import { successResponse } from '../../common/responses/api-response';
import { AnalyticsService } from './analytics.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard-summary')
  async getDashboardSummary(@Query('businessId') businessId: string, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, businessId);
    return successResponse(await this.analyticsService.getDashboardSummary(businessId));
  }

  @Get('queue-summary')
  async getQueueSummary(@Query('businessId') businessId: string, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, businessId);
    return successResponse(await this.analyticsService.getQueueSummary(businessId));
  }

  @Get('appointment-summary')
  async getAppointmentSummary(@Query('businessId') businessId: string, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, businessId);
    return successResponse(await this.analyticsService.getAppointmentSummary(businessId));
  }

  @Get('notification-summary')
  async getNotificationSummary(@Query('businessId') businessId: string, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, businessId);
    return successResponse(await this.analyticsService.getNotificationSummary(businessId));
  }

  @Get('today-activity')
  async getTodayActivity(@Query('businessId') businessId: string, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, businessId);
    return successResponse(await this.analyticsService.getTodayActivity(businessId));
  }

  private assertBusinessAccess(user: AuthenticatedUser | undefined, businessId?: string): void {
    if (!businessId) throw new ForbiddenException('businessId is required');
    if (user?.roles.includes('SUPER_ADMIN')) return;
    if (user?.businessIds.includes(businessId)) return;
    throw new ForbiddenException('You do not have access to this business');
  }
}
