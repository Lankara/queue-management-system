import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RejectAppointmentDto {
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}