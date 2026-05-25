import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';
import { MedicalProfilesService } from './medical-profiles.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@BusinessParam('businessId')
@Controller('businesses/:businessId/client-profiles/:clientProfileId/medical-profile')
export class MedicalProfilesController {
  constructor(private readonly medicalProfilesService: MedicalProfilesService) {}

  @Post()
  async create(@Param('businessId') businessId: string, @Param('clientProfileId') clientProfileId: string, @Body() data: CreateMedicalProfileDto) {
    return successResponse(await this.medicalProfilesService.create(businessId, clientProfileId, data));
  }

  @Get()
  async findByClientProfileId(@Param('businessId') businessId: string, @Param('clientProfileId') clientProfileId: string) {
    return successResponse(await this.medicalProfilesService.findByClientProfileId(businessId, clientProfileId));
  }

  @Patch()
  async update(@Param('businessId') businessId: string, @Param('clientProfileId') clientProfileId: string, @Body() data: UpdateMedicalProfileDto) {
    return successResponse(await this.medicalProfilesService.update(businessId, clientProfileId, data));
  }
}