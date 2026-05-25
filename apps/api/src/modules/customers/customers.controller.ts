import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { BanResetDto } from './dto/ban-reset.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@BusinessParam('businessId')
@Controller('businesses/:businessId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(@Param('businessId') businessId: string, @Body() data: CreateCustomerDto) {
    return successResponse(await this.customersService.create(businessId, data));
  }

  @Get()
  async findAll(@Param('businessId') businessId: string) {
    return successResponse(await this.customersService.findAllByBusinessId(businessId));
  }

  @Get('by-phone/:phone')
  async findByPhone(@Param('businessId') businessId: string, @Param('phone') phone: string) {
    return successResponse(await this.customersService.findByPhone(businessId, phone));
  }

  @Get(':id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.customersService.findById(businessId, id));
  }

  @Patch(':id')
  async update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: UpdateCustomerDto) {
    return successResponse(await this.customersService.update(businessId, id, data));
  }

  @Patch(':id/ban-reset')
  async resetBan(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: BanResetDto) {
    return successResponse(await this.customersService.resetBan(businessId, id, data));
  }
}