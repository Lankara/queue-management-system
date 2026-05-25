import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { AppointmentQueueSource } from '../interfaces/appointment.interface';

const APPOINTMENT_QUEUE_SOURCES: AppointmentQueueSource[] = ['QR', 'WEB', 'MOBILE_APP', 'WHATSAPP', 'OPERATOR', 'HARDWARE'];

export class ApproveAppointmentDto {
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedStartTime?: string;

  @IsOptional()
  @IsDateString()
  approvedEndTime?: string;

  @IsOptional()
  @IsIn(APPOINTMENT_QUEUE_SOURCES)
  source?: AppointmentQueueSource;
}