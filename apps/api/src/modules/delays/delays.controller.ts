import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { CreateDelayEventDto } from './dto/create-delay-event.dto';
import { DelayListQueryDto } from './dto/delay-list-query.dto';
import { DelaysService } from './delays.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR')
@BusinessParam('businessId')
@Controller('businesses/:businessId/delays')
export class DelaysController {
  constructor(private readonly delaysService: DelaysService) {}

  @Post()
  async createDelayEvent(@Param('businessId') businessId: string, @Body() data: CreateDelayEventDto) {
    return successResponse(await this.delaysService.createDelayEvent(businessId, data));
  }

  @Get()
  async findAll(@Param('businessId') businessId: string, @Query() query: DelayListQueryDto) {
    return successResponse(await this.delaysService.findAll(businessId, query));
  }

  @Get(':id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.delaysService.findById(businessId, id));
  }
}