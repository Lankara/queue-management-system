import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientProfilesService } from '../client-profiles/client-profiles.service';
import { CreateClientProfileDto } from '../client-profiles/dto/create-client-profile.dto';
import { ClientProfile } from '../client-profiles/interfaces/client-profile.interface';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { Customer } from '../customers/interfaces/customer.interface';
import { CustomersService } from '../customers/customers.service';
import { ConfirmQueueEntryDto } from '../queues/dto/confirm-queue-entry.dto';
import { QueuePositionQueryDto } from '../queues/dto/queue-position-query.dto';
import { RejectQueueEntryDto } from '../queues/dto/reject-queue-entry.dto';
import { QueueEntry, QueuePosition } from '../queues/interfaces/queue.interface';
import { QueuesService } from '../queues/queues.service';
import { PublicAppointmentCancelDto } from './dto/public-appointment-cancel.dto';
import { PublicAppointmentRequestDto } from './dto/public-appointment-request.dto';
import { PublicAppointmentRejectRescheduleDto } from './dto/public-appointment-reject-reschedule.dto';
import { PublicQueueJoinDto } from './dto/public-queue-join.dto';

interface PublicBusinessRow {
  id: string;
  slug: string;
  name: string;
  default_language: 'en' | 'si';
}

interface PublicBranchRow {
  id: string;
  name: string;
  code: string;
}

interface PublicServiceRow {
  id: string;
  name: string;
  code: string;
  duration_minutes: number;
  branch_id: string | null;
}

interface PublicAppointmentRow {
  appointment_id: string;
  status: string;
  requested_start_time: Date;
  requested_end_time: Date;
  approved_start_time: Date | null;
  approved_end_time: Date | null;
  queue_entry_id: string | null;
  queue_number: string | null;
  queue_status: string | null;
  service_name: string;
  branch_name: string | null;
  customer_name: string;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
}

export interface PublicBusinessResponse {
  id: string;
  slug: string;
  name: string;
  defaultLanguage: 'en' | 'si';
  branches: PublicBranchResponse[];
  services: PublicServiceResponse[];
}

export interface PublicBranchResponse {
  id: string;
  name: string;
  code: string;
}

export interface PublicServiceResponse {
  id: string;
  name: string;
  code: string;
  durationMinutes: number;
  branchId: string | null;
}

export interface PublicCustomerResponse {
  id: string;
  primaryPhone: string;
  preferredLanguage: 'en' | 'si';
  isOnlineBookingBanned: boolean;
  noShowCount: number;
  banReason: string | null;
}

export interface PublicClientProfileResponse {
  id: string;
  customerId: string;
  fullName: string;
  relationshipToContact: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
  ageYears: number | null;
}

export interface PublicAppointmentResponse {
  appointmentId: string;
  status: string;
  requestedStartTime: Date;
  requestedEndTime: Date;
  approvedStartTime: Date | null;
  approvedEndTime: Date | null;
  queueEntryId: string | null;
  queueNumber: string | null;
  queueStatus: string | null;
  serviceName: string;
  branchName: string | null;
  customerName: string;
  cancellationReason: string | null;
  rescheduleReason: string | null;
  message: string;
}

@Injectable()
export class PublicSelfServiceService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly customersService: CustomersService,
    private readonly clientProfilesService: ClientProfilesService,
    private readonly queuesService: QueuesService,
    private readonly appointmentsService: AppointmentsService
  ) {}

  async getBusinessBySlug(businessSlug: string): Promise<PublicBusinessResponse> {
    const business = await this.resolveBusiness(businessSlug);
    const [branches, services] = await Promise.all([this.findActiveBranches(business.id), this.findActiveServices(business.id)]);
    return { id: business.id, slug: business.slug, name: business.name, defaultLanguage: business.default_language, branches, services };
  }

  async findCustomerByPhone(businessSlug: string, phone: string): Promise<PublicCustomerResponse> {
    const business = await this.resolveBusiness(businessSlug);
    return this.mapCustomer(await this.customersService.findByPhone(business.id, phone));
  }

  async createCustomer(businessSlug: string, data: CreateCustomerDto): Promise<PublicCustomerResponse> {
    const business = await this.resolveBusiness(businessSlug);
    return this.mapCustomer(await this.customersService.create(business.id, data));
  }

  async findClientProfiles(businessSlug: string, customerId: string): Promise<PublicClientProfileResponse[]> {
    const business = await this.resolveBusiness(businessSlug);
    await this.customersService.findById(business.id, customerId);
    const profiles = await this.clientProfilesService.findAllByCustomerId(business.id, customerId);
    return profiles.map((profile) => this.mapClientProfile(profile));
  }

  async createClientProfile(businessSlug: string, customerId: string, data: CreateClientProfileDto): Promise<PublicClientProfileResponse> {
    const business = await this.resolveBusiness(businessSlug);
    await this.customersService.findById(business.id, customerId);
    return this.mapClientProfile(await this.clientProfilesService.create(business.id, customerId, data));
  }

  async requestAppointment(businessSlug: string, data: PublicAppointmentRequestDto): Promise<PublicAppointmentResponse> {
    const business = await this.resolveBusiness(businessSlug);
    this.ensureEndAfterStart(data.requestedStartTime, data.requestedEndTime);
    await this.assertPublicAppointmentReferences(business.id, data);
    const appointment = await this.appointmentsService.requestAppointment(business.id, {
      branchId: data.branchId,
      serviceId: data.serviceId,
      customerId: data.customerId,
      clientProfileId: data.clientProfileId,
      requestedStartTime: data.requestedStartTime,
      requestedEndTime: data.requestedEndTime
    });
    return this.getAppointmentStatusByBusinessId(business.id, appointment.id, 'Appointment request submitted and pending approval');
  }

  async getAppointmentStatus(businessSlug: string, appointmentId: string): Promise<PublicAppointmentResponse> {
    const business = await this.resolveBusiness(businessSlug);
    return this.getAppointmentStatusByBusinessId(business.id, appointmentId);
  }

  async cancelAppointment(businessSlug: string, appointmentId: string, data: PublicAppointmentCancelDto): Promise<PublicAppointmentResponse> {
    const business = await this.resolveBusiness(businessSlug);
    await this.appointmentsService.cancelByCustomer(business.id, appointmentId, { reason: data.reason });
    return this.getAppointmentStatusByBusinessId(business.id, appointmentId, 'Appointment cancelled');
  }

  async acceptAppointmentReschedule(businessSlug: string, appointmentId: string): Promise<PublicAppointmentResponse> {
    const business = await this.resolveBusiness(businessSlug);
    await this.updatePublicRescheduleStatus(business.id, appointmentId, 'RESCHEDULE_ACCEPTED');
    return this.getAppointmentStatusByBusinessId(business.id, appointmentId, 'You accepted the new appointment time. Waiting for staff confirmation if required.');
  }

  async rejectAppointmentReschedule(
    businessSlug: string,
    appointmentId: string,
    data: PublicAppointmentRejectRescheduleDto
  ): Promise<PublicAppointmentResponse> {
    const business = await this.resolveBusiness(businessSlug);
    await this.updatePublicRescheduleStatus(business.id, appointmentId, 'RESCHEDULE_REJECTED', data.reason);
    return this.getAppointmentStatusByBusinessId(business.id, appointmentId, 'You rejected the proposed new time. Please contact the business or wait for another update.');
  }
  async joinQueueDraft(businessSlug: string, data: PublicQueueJoinDto): Promise<QueueEntry> {
    const business = await this.resolveBusiness(businessSlug);
    if (!data.serviceId) throw new BadRequestException('Service is required to join the public queue');
    await this.assertCustomerAndProfileMatch(business.id, data.customerId, data.clientProfileId);
    return this.queuesService.joinDraft(business.id, data);
  }

  async confirmQueueEntry(businessSlug: string, entryId: string, data: ConfirmQueueEntryDto): Promise<QueueEntry> {
    const business = await this.resolveBusiness(businessSlug);
    return this.queuesService.confirmEntry(business.id, entryId, data);
  }

  async rejectQueueEntry(businessSlug: string, entryId: string, data: RejectQueueEntryDto): Promise<QueueEntry> {
    const business = await this.resolveBusiness(businessSlug);
    return this.queuesService.rejectEntry(business.id, entryId, data);
  }

  async getQueuePosition(businessSlug: string, entryId: string, query: QueuePositionQueryDto): Promise<QueuePosition> {
    const business = await this.resolveBusiness(businessSlug);
    return this.queuesService.getPosition(business.id, entryId, query);
  }

  private async assertPublicAppointmentReferences(businessId: string, data: PublicAppointmentRequestDto): Promise<void> {
    const service = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM services WHERE business_id = $1 AND id = $2 AND is_active = true LIMIT 1`,
      [businessId, data.serviceId]
    );
    if (!service.rows[0]) throw new NotFoundException('Service not found');

    if (data.branchId) {
      const branch = await this.databaseService.query<{ id: string }>(
        `SELECT id FROM branches WHERE business_id = $1 AND id = $2 AND is_active = true LIMIT 1`,
        [businessId, data.branchId]
      );
      if (!branch.rows[0]) throw new NotFoundException('Branch not found');
    }

    const customer = await this.databaseService.query<{ is_online_booking_banned: boolean }>(
      `SELECT is_online_booking_banned FROM customers WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, data.customerId]
    );
    if (!customer.rows[0]) throw new NotFoundException('Customer not found');
    if (customer.rows[0].is_online_booking_banned) throw new ConflictException('Customer is banned from online bookings');

    await this.assertCustomerAndProfileMatch(businessId, data.customerId, data.clientProfileId);
  }

  private ensureEndAfterStart(start: string, end: string): void {
    if (new Date(end).getTime() <= new Date(start).getTime()) throw new BadRequestException('Appointment end time must be after start time');
  }

  private async updatePublicRescheduleStatus(
    businessId: string,
    appointmentId: string,
    status: 'RESCHEDULE_ACCEPTED' | 'RESCHEDULE_REJECTED',
    reason?: string
  ): Promise<void> {
    const appointment = await this.databaseService.query<{ status: string }>(
      `SELECT status FROM appointments WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, appointmentId]
    );
    if (!appointment.rows[0]) throw new NotFoundException('Appointment not found');
    if (appointment.rows[0].status !== 'RESCHEDULE_PROPOSED') {
      throw new BadRequestException('Appointment does not have an active reschedule proposal');
    }

    await this.databaseService.query(
      `UPDATE appointments
       SET status = $3,
           reschedule_reason = COALESCE($4, reschedule_reason),
           updated_at = now()
       WHERE business_id = $1 AND id = $2`,
      [businessId, appointmentId, status, reason ?? null]
    );
  }
  private async getAppointmentStatusByBusinessId(businessId: string, appointmentId: string, message?: string): Promise<PublicAppointmentResponse> {
    const result = await this.databaseService.query<PublicAppointmentRow>(
      `SELECT a.id AS appointment_id,
              a.status,
              a.requested_start_time,
              a.requested_end_time,
              a.approved_start_time,
              a.approved_end_time,
              a.queue_entry_id,
              qe.queue_number,
              qe.status AS queue_status,
              s.name AS service_name,
              br.name AS branch_name,
              cp.full_name AS customer_name,
              a.cancellation_reason,
              a.reschedule_reason
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       JOIN client_profiles cp ON cp.id = a.client_profile_id
       LEFT JOIN branches br ON br.id = a.branch_id
       LEFT JOIN queue_entries qe ON qe.id = a.queue_entry_id
       WHERE a.business_id = $1 AND a.id = $2
       LIMIT 1`,
      [businessId, appointmentId]
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Appointment not found');
    return {
      appointmentId: row.appointment_id,
      status: row.status,
      requestedStartTime: row.requested_start_time,
      requestedEndTime: row.requested_end_time,
      approvedStartTime: row.approved_start_time,
      approvedEndTime: row.approved_end_time,
      queueEntryId: row.queue_entry_id,
      queueNumber: row.queue_number,
      queueStatus: row.queue_status,
      serviceName: row.service_name,
      branchName: row.branch_name,
      customerName: row.customer_name,
      cancellationReason: row.cancellation_reason,
      rescheduleReason: row.reschedule_reason,
      message: message ?? this.appointmentMessage(row.status)
    };
  }

  private appointmentMessage(status: string): string {
    if (status === 'PENDING_APPROVAL') return 'Appointment request is pending approval';
    if (status === 'APPROVED') return 'Appointment approved';
    if (status === 'REJECTED') return 'Appointment rejected';
    if (status === 'CANCELLED_BY_CUSTOMER' || status === 'CANCELLED_BY_OPERATOR') return 'Appointment cancelled';
    if (status === 'RESCHEDULE_PROPOSED') return 'A reschedule has been proposed';
    if (status === 'RESCHEDULE_ACCEPTED') return 'You accepted the new appointment time. Waiting for staff confirmation if required.';
    if (status === 'RESCHEDULE_REJECTED') return 'You rejected the proposed new time. Please contact the business or wait for another update.';
    return 'Appointment status updated';
  }

  private async resolveBusiness(businessSlug: string): Promise<PublicBusinessRow> {
    const result = await this.databaseService.query<PublicBusinessRow>(
      `SELECT id, slug, name, default_language FROM businesses WHERE slug = $1 AND is_active = true LIMIT 1`,
      [businessSlug]
    );
    if (!result.rows[0]) throw new NotFoundException('Business not found');
    return result.rows[0];
  }

  private async findActiveBranches(businessId: string): Promise<PublicBranchResponse[]> {
    const result = await this.databaseService.query<PublicBranchRow>(
      `SELECT id, name, code FROM branches WHERE business_id = $1 AND is_active = true ORDER BY name ASC`,
      [businessId]
    );
    return result.rows.map((row) => ({ id: row.id, name: row.name, code: row.code }));
  }

  private async findActiveServices(businessId: string): Promise<PublicServiceResponse[]> {
    const result = await this.databaseService.query<PublicServiceRow>(
      `SELECT id, name, code, duration_minutes, branch_id FROM services WHERE business_id = $1 AND is_active = true ORDER BY name ASC`,
      [businessId]
    );
    return result.rows.map((row) => ({ id: row.id, name: row.name, code: row.code, durationMinutes: row.duration_minutes, branchId: row.branch_id }));
  }

  private async assertCustomerAndProfileMatch(businessId: string, customerId: string, clientProfileId: string): Promise<void> {
    await this.customersService.findById(businessId, customerId);
    const profile = await this.clientProfilesService.findById(businessId, clientProfileId);
    if (profile.customerId !== customerId) throw new BadRequestException('Client profile does not belong to this customer');
  }

  private mapCustomer(customer: Customer): PublicCustomerResponse {
    return { id: customer.id, primaryPhone: customer.primaryPhone, preferredLanguage: customer.preferredLanguage, isOnlineBookingBanned: customer.isOnlineBookingBanned, noShowCount: customer.noShowCount, banReason: customer.banReason };
  }

  private mapClientProfile(profile: ClientProfile): PublicClientProfileResponse {
    return { id: profile.id, customerId: profile.customerId, fullName: profile.fullName, relationshipToContact: profile.relationshipToContact, gender: profile.gender, ageYears: profile.ageYears };
  }
}






