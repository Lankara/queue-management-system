import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
@BusinessParam('businessId')
@Controller('businesses/:businessId/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  async create(@Param('businessId') businessId: string, @Body() data: CreateBranchDto) {
    return successResponse(await this.branchesService.create(businessId, data));
  }

  @Get()
  async findAll(@Param('businessId') businessId: string) {
    return successResponse(await this.branchesService.findAllByBusinessId(businessId));
  }

  @Get(':id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.branchesService.findById(businessId, id));
  }

  @Patch(':id')
  async update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: UpdateBranchDto) {
    return successResponse(await this.branchesService.update(businessId, id, data));
  }
}