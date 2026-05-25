import { IsOptional, IsString } from 'class-validator';

export class PublicAppointmentRejectRescheduleDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
