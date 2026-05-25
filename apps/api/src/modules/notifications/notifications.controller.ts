import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { CopyGlobalTemplateDto } from './dto/copy-global-template.dto';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { MarkNotificationStatusDto } from './dto/mark-notification-status.dto';
import { NotificationLogQueryDto } from './dto/notification-log-query.dto';
import { NotificationTemplateQueryDto } from './dto/notification-template-query.dto';
import { RenderNotificationDto } from './dto/render-notification.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationsService } from './notifications.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'OPERATOR')
@BusinessParam('businessId')
@Controller('businesses/:businessId')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notification-templates')
  async findTemplates(@Param('businessId') businessId: string, @Query() query: NotificationTemplateQueryDto) {
    return successResponse(await this.notificationsService.findTemplates(businessId, query));
  }

  @Post('notification-templates/copy-global')
  async copyGlobalTemplate(@Param('businessId') businessId: string, @Body() data: CopyGlobalTemplateDto) {
    return successResponse(await this.notificationsService.copyGlobalTemplate(businessId, data));
  }

  @Get('notification-templates/:id')
  async findTemplateById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.notificationsService.findTemplateById(businessId, id));
  }

  @Post('notification-templates')
  async createBusinessTemplate(@Param('businessId') businessId: string, @Body() data: CreateNotificationTemplateDto) {
    return successResponse(await this.notificationsService.createBusinessTemplate(businessId, data));
  }

  @Patch('notification-templates/:id')
  async updateBusinessTemplate(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() data: UpdateNotificationTemplateDto
  ) {
    return successResponse(await this.notificationsService.updateBusinessTemplate(businessId, id, data));
  }

  @Post('notifications/render')
  async render(@Param('businessId') businessId: string, @Body() data: RenderNotificationDto) {
    return successResponse(await this.notificationsService.renderTemplateFromDto(businessId, data));
  }

  @Post('notifications')
  async createLog(@Param('businessId') businessId: string, @Body() data: CreateNotificationLogDto) {
    return successResponse(await this.notificationsService.createLog(businessId, data));
  }

  @Get('notifications')
  async findLogs(@Param('businessId') businessId: string, @Query() query: NotificationLogQueryDto) {
    return successResponse(await this.notificationsService.findLogs(businessId, query));
  }

  @Get('notifications/:id')
  async findLogById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.notificationsService.findLogById(businessId, id));
  }

  @Patch('notifications/:id/status')
  async markLogStatus(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() data: MarkNotificationStatusDto
  ) {
    return successResponse(await this.notificationsService.markLogStatus(businessId, id, data));
  }
}