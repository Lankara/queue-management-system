import { IsOptional, IsString } from 'class-validator';

export class PublicAppointmentCancelDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
