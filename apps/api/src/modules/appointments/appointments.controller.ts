import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BusinessParam } from '../auth/decorators/business-param.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { successResponse } from '../../common/responses/api-response';
import { AcceptRescheduleDto } from './dto/accept-reschedule.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { ApproveAppointmentDto } from './dto/approve-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ProposeRescheduleDto } from './dto/propose-reschedule.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { RejectRescheduleDto } from './dto/reject-reschedule.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Roles('SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'DOCTOR', 'OPERATOR', 'STAFF')
@BusinessParam('businessId')
@Controller('businesses/:businessId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('request')
  async requestAppointment(@Param('businessId') businessId: string, @Body() data: RequestAppointmentDto) {
    return successResponse(await this.appointmentsService.requestAppointment(businessId, data));
  }

  @Get()
  async findAll(@Param('businessId') businessId: string, @Query() query: AppointmentListQueryDto) {
    return successResponse(await this.appointmentsService.findAll(businessId, query));
  }

  @Get(':id')
  async findById(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.appointmentsService.findById(businessId, id));
  }

  @Patch(':id/approve')
  async approve(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: ApproveAppointmentDto) {
    return successResponse(await this.appointmentsService.approve(businessId, id, data));
  }

  @Patch(':id/reject')
  async reject(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: RejectAppointmentDto) {
    return successResponse(await this.appointmentsService.reject(businessId, id, data));
  }

  @Patch(':id/cancel-by-customer')
  async cancelByCustomer(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: CancelAppointmentDto) {
    return successResponse(await this.appointmentsService.cancelByCustomer(businessId, id, data));
  }

  @Patch(':id/cancel-by-operator')
  async cancelByOperator(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: CancelAppointmentDto) {
    return successResponse(await this.appointmentsService.cancelByOperator(businessId, id, data));
  }

  @Patch(':id/propose-reschedule')
  async proposeReschedule(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: ProposeRescheduleDto) {
    return successResponse(await this.appointmentsService.proposeReschedule(businessId, id, data));
  }

  @Patch(':id/accept-reschedule')
  async acceptReschedule(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: AcceptRescheduleDto) {
    return successResponse(await this.appointmentsService.acceptReschedule(businessId, id, data));
  }

  @Patch(':id/reject-reschedule')
  async rejectReschedule(@Param('businessId') businessId: string, @Param('id') id: string, @Body() data: RejectRescheduleDto) {
    return successResponse(await this.appointmentsService.rejectReschedule(businessId, id, data));
  }

  @Get(':id/time-changes')
  async findTimeChanges(@Param('businessId') businessId: string, @Param('id') id: string) {
    return successResponse(await this.appointmentsService.findTimeChanges(businessId, id));
  }
}