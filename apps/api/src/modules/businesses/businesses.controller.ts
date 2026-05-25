import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  async create(@Body() data: CreateBusinessDto) {
    return successResponse(await this.businessesService.create(data));
  }

  @Roles('SUPER_ADMIN')
  @Get()
  async findAll() {
    return successResponse(await this.businessesService.findAll());
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @BusinessParam('id')
  @Get(':id')
  async findById(@Param('id') id: string) {
    return successResponse(await this.businessesService.findById(id));
  }

  @Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @BusinessParam('id')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBusinessDto) {
    return successResponse(await this.businessesService.update(id, data));
  }
}