import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { NotificationsService } from '../notifications/notifications.service';
import { AcceptRescheduleDto } from './dto/accept-reschedule.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { ApproveAppointmentDto } from './dto/approve-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ProposeRescheduleDto } from './dto/propose-reschedule.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { RejectRescheduleDto } from './dto/reject-reschedule.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { Appointment, AppointmentTimeChange } from './interfaces/appointment.interface';
import { AppointmentNotificationContext, AppointmentsRepository } from './appointments.repository';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly notificationsService: NotificationsService
  ) {}

  async requestAppointment(businessId: string, data: RequestAppointmentDto): Promise<Appointment> {
    this.ensureEndAfterStart(data.requestedStartTime, data.requestedEndTime);
    await this.ensureRequestReferences(businessId, data);

    try {
      const appointment = await this.appointmentsRepository.requestAppointment(businessId, data);
      await this.createAppointmentNotification(businessId, appointment.id, 'APPOINTMENT_PENDING_APPROVAL');
      return appointment;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAll(businessId: string, query: AppointmentListQueryDto): Promise<Appointment[]> {
    return this.appointmentsRepository.findAll(businessId, query);
  }

  async findById(businessId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findById(businessId, id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async approve(businessId: string, id: string, data: ApproveAppointmentDto): Promise<Appointment> {
    const start = data.approvedStartTime;
    const end = data.approvedEndTime;
    if ((start && !end) || (!start && end)) {
      throw new BadRequestException('approvedStartTime and approvedEndTime must be provided together');
    }
    if (start && end) {
      this.ensureEndAfterStart(start, end);
    }

    try {
      const appointment = await this.appointmentsRepository.approveAppointment(businessId, id, data);
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (appointment.status !== 'APPROVED') {
        throw new BadRequestException(`Appointment cannot be approved from status ${appointment.status}`);
      }
      await this.createAppointmentNotification(businessId, appointment.id, 'APPOINTMENT_APPROVED');
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async reject(businessId: string, id: string, data: RejectAppointmentDto): Promise<Appointment> {
    try {
      const appointment = await this.appointmentsRepository.rejectAppointment(businessId, id, data);
      if (!appointment) {
        throw new NotFoundException('Appointment not found or cannot be rejected from its current status');
      }
      await this.createAppointmentNotification(businessId, appointment.id, 'APPOINTMENT_REJECTED', {
        reason: data.reason ?? ''
      });
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  cancelByCustomer(businessId: string, id: string, data: CancelAppointmentDto): Promise<Appointment> {
    return this.cancel(businessId, id, data, 'CANCELLED_BY_CUSTOMER');
  }

  cancelByOperator(businessId: string, id: string, data: CancelAppointmentDto): Promise<Appointment> {
    return this.cancel(businessId, id, data, 'CANCELLED_BY_OPERATOR');
  }

  async proposeReschedule(businessId: string, id: string, data: ProposeRescheduleDto): Promise<Appointment> {
    this.ensureEndAfterStart(data.newStartTime, data.newEndTime);

    try {
      const appointment = await this.appointmentsRepository.proposeReschedule(businessId, id, data);
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (appointment.status !== 'RESCHEDULE_PROPOSED') {
        throw new BadRequestException(`Appointment cannot be rescheduled from status ${appointment.status}`);
      }
      await this.createAppointmentNotification(businessId, appointment.id, 'RESCHEDULE_PROPOSED', {
        new_appointment_time: data.newStartTime,
        reason: data.reason ?? ''
      });
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async acceptReschedule(businessId: string, id: string, data: AcceptRescheduleDto): Promise<Appointment> {
    try {
      const appointment = await this.appointmentsRepository.acceptReschedule(businessId, id, data);
      if (!appointment) {
        throw new NotFoundException('Appointment not found or no reschedule proposal is active');
      }
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async rejectReschedule(businessId: string, id: string, data: RejectRescheduleDto): Promise<Appointment> {
    try {
      const appointment = await this.appointmentsRepository.rejectReschedule(businessId, id, data);
      if (!appointment) {
        throw new NotFoundException('Appointment not found or no reschedule proposal is active');
      }
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  async findTimeChanges(businessId: string, id: string): Promise<AppointmentTimeChange[]> {
    await this.findById(businessId, id);
    return this.appointmentsRepository.findTimeChanges(businessId, id);
  }

  private async cancel(
    businessId: string,
    id: string,
    data: CancelAppointmentDto,
    status: 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_OPERATOR'
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentsRepository.cancelAppointment(businessId, id, data, status);
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (appointment.status !== status) {
        throw new BadRequestException(`Appointment cannot be cancelled from status ${appointment.status}`);
      }
      if (status === 'CANCELLED_BY_CUSTOMER') {
        await this.createAppointmentNotification(businessId, appointment.id, 'APPOINTMENT_CANCELLED_BY_CUSTOMER', {
          reason: data.reason ?? ''
        });
      }
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private async createAppointmentNotification(
    businessId: string,
    appointmentId: string,
    templateKey: 'APPOINTMENT_PENDING_APPROVAL' | 'APPOINTMENT_APPROVED' | 'APPOINTMENT_REJECTED' | 'APPOINTMENT_CANCELLED_BY_CUSTOMER' | 'RESCHEDULE_PROPOSED',
    extraVariables: Record<string, unknown> = {}
  ): Promise<void> {
    const context = await this.appointmentsRepository.getNotificationContext(businessId, appointmentId);
    if (!context) {
      return;
    }
    await this.safeCreateRenderedNotificationLog(businessId, context, appointmentId, templateKey, extraVariables);
  }

  private async safeCreateRenderedNotificationLog(
    businessId: string,
    context: AppointmentNotificationContext,
    appointmentId: string,
    templateKey: 'APPOINTMENT_PENDING_APPROVAL' | 'APPOINTMENT_APPROVED' | 'APPOINTMENT_REJECTED' | 'APPOINTMENT_CANCELLED_BY_CUSTOMER' | 'RESCHEDULE_PROPOSED',
    extraVariables: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.notificationsService.createRenderedLog(businessId, {
        customerId: context.customerId,
        clientProfileId: context.clientProfileId,
        appointmentId,
        language: context.language,
        templateKey,
        channel: 'WHATSAPP',
        recipient: context.customerPhone,
        variables: {
          customer_name: context.customerName,
          business_name: context.businessName,
          appointment_time: context.appointmentTime,
          new_appointment_time: context.appointmentTime,
          queue_number: context.queueNumber ?? '',
          ...extraVariables
        }
      });
    } catch (error) {
      this.logger.warn(`Notification log creation failed for ${templateKey}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ensureRequestReferences(businessId: string, data: RequestAppointmentDto): Promise<void> {
    const customerExists = await this.appointmentsRepository.customerBelongsToBusiness(businessId, data.customerId);
    if (!customerExists) {
      throw new NotFoundException('Customer not found');
    }

    const clientProfileExists = await this.appointmentsRepository.clientProfileBelongsToCustomer(
      businessId,
      data.customerId,
      data.clientProfileId
    );
    if (!clientProfileExists) {
      throw new NotFoundException('Client profile not found for this customer');
    }

    const serviceExists = await this.appointmentsRepository.serviceBelongsToBusiness(businessId, data.serviceId);
    if (!serviceExists) {
      throw new NotFoundException('Service not found');
    }
  }

  private ensureEndAfterStart(start: string, end: string): void {
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      throw new BadRequestException('End time must be greater than start time');
    }
  }
}