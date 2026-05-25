import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
@BusinessParam('businessId')
@Controller('businesses/:businessId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  async create(@Param('businessId') businessId: string, @Body() data: CreateServiceDto) {
    return successResponse(await this.servicesService.create(businessId, data));
  }

  @Get()
  async findAll(@Param('businessId') businessId: string) {
    return successResponse(await this.servicesService.findAllByBusinessId(businessId));
  }

  @Get(':id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.servicesService.findById(businessId, id));
  }

  @Patch(':id')
  async update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: UpdateServiceDto) {
    return successResponse(await this.servicesService.update(businessId, id, data));
  }
}