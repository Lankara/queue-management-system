import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';
import { successResponse } from '../../common/responses/api-response';
import { ReportsService } from './reports.service';

interface ReportQuery { businessId: string; startDate?: string; endDate?: string; branchId?: string; serviceId?: string }

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-queue-report')
  async dailyQueueReport(@Query() query: ReportQuery, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, query.businessId);
    return successResponse(await this.reportsService.dailyQueueReport(query));
  }

  @Get('daily-appointment-report')
  async dailyAppointmentReport(@Query() query: ReportQuery, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, query.businessId);
    return successResponse(await this.reportsService.dailyAppointmentReport(query));
  }

  @Get('staff-activity-report')
  async staffActivityReport(@Query() query: ReportQuery, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, query.businessId);
    return successResponse(await this.reportsService.staffActivityReport(query));
  }

  @Get('notification-report')
  async notificationReport(@Query() query: ReportQuery, @CurrentUser() user?: AuthenticatedUser) {
    this.assertBusinessAccess(user, query.businessId);
    return successResponse(await this.reportsService.notificationReport(query));
  }

  private assertBusinessAccess(user: AuthenticatedUser | undefined, businessId?: string): void {
    if (!businessId) throw new ForbiddenException('businessId is required');
    if (user?.roles.includes('SUPER_ADMIN')) return;
    if (user?.businessIds.includes(businessId)) return;
    throw new ForbiddenException('You do not have access to this business');
  }
}
