import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { BusinessProfileSettingsService } from './business-profile-settings.service';
import { UpdateBusinessProfileSettingsDto } from './dto/update-business-profile-settings.dto';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
@BusinessParam('businessId')
@Controller('businesses/:businessId/profile-settings')
export class BusinessProfileSettingsController {
  constructor(private readonly settingsService: BusinessProfileSettingsService) {}

  @Get()
  async findByBusinessId(@Param('businessId') businessId: string) {
    return successResponse(await this.settingsService.findByBusinessId(businessId));
  }

  @Patch()
  async update(@Param('businessId') businessId: string, @Body() data: UpdateBusinessProfileSettingsDto) {
    return successResponse(await this.settingsService.update(businessId, data));
  }
}