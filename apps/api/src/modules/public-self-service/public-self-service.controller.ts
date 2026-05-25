import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { successResponse } from '../../common/responses/api-response';
import { Public } from '../auth/decorators/public.decorator';
import { CreateClientProfileDto } from '../client-profiles/dto/create-client-profile.dto';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { ConfirmQueueEntryDto } from '../queues/dto/confirm-queue-entry.dto';
import { QueuePositionQueryDto } from '../queues/dto/queue-position-query.dto';
import { RejectQueueEntryDto } from '../queues/dto/reject-queue-entry.dto';
import { PublicAppointmentCancelDto } from './dto/public-appointment-cancel.dto';
import { PublicAppointmentRequestDto } from './dto/public-appointment-request.dto';
import { PublicAppointmentRejectRescheduleDto } from './dto/public-appointment-reject-reschedule.dto';
import { PublicQueueJoinDto } from './dto/public-queue-join.dto';
import { PublicSelfServiceService } from './public-self-service.service';

@Public()
@Controller('public/businesses/:businessSlug')
export class PublicSelfServiceController {

  constructor(private readonly publicSelfServiceService: PublicSelfServiceService) {}

  @Get()
  async getBusiness(@Param('businessSlug') businessSlug: string) {
    return successResponse(await this.publicSelfServiceService.getBusinessBySlug(businessSlug));
  }

  @Get('customers/by-phone/:phone')
  async findCustomerByPhone(@Param('businessSlug') businessSlug: string, @Param('phone') phone: string) {
    return successResponse(await this.publicSelfServiceService.findCustomerByPhone(businessSlug, phone));
  }

  @Post('customers')
  async createCustomer(@Param('businessSlug') businessSlug: string, @Body() data: CreateCustomerDto) {
    return successResponse(await this.publicSelfServiceService.createCustomer(businessSlug, data));
  }

  @Get('customers/:customerId/client-profiles')
  async findClientProfiles(@Param('businessSlug') businessSlug: string, @Param('customerId') customerId: string) {
    return successResponse(await this.publicSelfServiceService.findClientProfiles(businessSlug, customerId));
  }

  @Post('customers/:customerId/client-profiles')
  async createClientProfile(
    @Param('businessSlug') businessSlug: string,
    @Param('customerId') customerId: string,
    @Body() data: CreateClientProfileDto
  ) {
    return successResponse(await this.publicSelfServiceService.createClientProfile(businessSlug, customerId, data));
  }


  @Post('appointments/request')
  async requestAppointment(@Param('businessSlug') businessSlug: string, @Body() data: PublicAppointmentRequestDto) {
    return successResponse(await this.publicSelfServiceService.requestAppointment(businessSlug, data));
  }

  @Get('appointments/:appointmentId/status')
  async getAppointmentStatus(@Param('businessSlug') businessSlug: string, @Param('appointmentId') appointmentId: string) {
    return successResponse(await this.publicSelfServiceService.getAppointmentStatus(businessSlug, appointmentId));
  }

  @Patch('appointments/:appointmentId/cancel')
  async cancelAppointment(
    @Param('businessSlug') businessSlug: string,
    @Param('appointmentId') appointmentId: string,
    @Body() data: PublicAppointmentCancelDto
  ) {
    return successResponse(await this.publicSelfServiceService.cancelAppointment(businessSlug, appointmentId, data));
  }

  @Patch('appointments/:appointmentId/accept-reschedule')
  async acceptAppointmentReschedule(@Param('businessSlug') businessSlug: string, @Param('appointmentId') appointmentId: string) {
    return successResponse(await this.publicSelfServiceService.acceptAppointmentReschedule(businessSlug, appointmentId));
  }

  @Patch('appointments/:appointmentId/reject-reschedule')
  async rejectAppointmentReschedule(
    @Param('businessSlug') businessSlug: string,
    @Param('appointmentId') appointmentId: string,
    @Body() data: PublicAppointmentRejectRescheduleDto
  ) {
    return successResponse(await this.publicSelfServiceService.rejectAppointmentReschedule(businessSlug, appointmentId, data));
  }
  @Post('queues/join-draft')
  async joinQueueDraft(@Param('businessSlug') businessSlug: string, @Body() data: PublicQueueJoinDto) {
    return successResponse(await this.publicSelfServiceService.joinQueueDraft(businessSlug, data));
  }

  @Patch('queue-entries/:entryId/confirm')
  async confirmQueueEntry(@Param('businessSlug') businessSlug: string, @Param('entryId') entryId: string, @Body() data: ConfirmQueueEntryDto) {
    return successResponse(await this.publicSelfServiceService.confirmQueueEntry(businessSlug, entryId, data));
  }

  @Patch('queue-entries/:entryId/reject')
  async rejectQueueEntry(@Param('businessSlug') businessSlug: string, @Param('entryId') entryId: string, @Body() data: RejectQueueEntryDto) {
    return successResponse(await this.publicSelfServiceService.rejectQueueEntry(businessSlug, entryId, data));
  }

  @Get('queue-entries/:entryId/position')
  async getQueuePosition(@Param('businessSlug') businessSlug: string, @Param('entryId') entryId: string, @Query() query: QueuePositionQueryDto) {
    return successResponse(await this.publicSelfServiceService.getQueuePosition(businessSlug, entryId, query));
  }
}





