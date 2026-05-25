import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../interfaces/appointment.interface';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'RESCHEDULE_PROPOSED',
  'RESCHEDULE_ACCEPTED',
  'RESCHEDULE_REJECTED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_OPERATOR',
  'DELAYED',
  'IN_QUEUE',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW'
];

export class AppointmentListQueryDto {
  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  clientProfileId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}