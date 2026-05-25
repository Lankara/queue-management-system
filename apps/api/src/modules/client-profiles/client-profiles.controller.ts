import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { ClientProfilesService } from './client-profiles.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@BusinessParam('businessId')
@Controller()
export class ClientProfilesController {
  constructor(private readonly clientProfilesService: ClientProfilesService) {}

  @Post('businesses/:businessId/customers/:customerId/client-profiles')
  async create(@Param('businessId') businessId: string, @Param('customerId') customerId: string, @Body() data: CreateClientProfileDto) {
    return successResponse(await this.clientProfilesService.create(businessId, customerId, data));
  }

  @Get('businesses/:businessId/customers/:customerId/client-profiles')
  async findAllByCustomerId(@Param('businessId') businessId: string, @Param('customerId') customerId: string) {
    return successResponse(await this.clientProfilesService.findAllByCustomerId(businessId, customerId));
  }

  @Get('businesses/:businessId/client-profiles/:id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.clientProfilesService.findById(businessId, id));
  }

  @Patch('businesses/:businessId/client-profiles/:id')
  async update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: UpdateClientProfileDto) {
    return successResponse(await this.clientProfilesService.update(businessId, id, data));
  }
}