import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class RequestAppointmentDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  clientProfileId!: string;

  @IsDateString()
  requestedStartTime!: string;

  @IsDateString()
  requestedEndTime!: string;

  @IsOptional()
  @IsUUID()
  requestedBy?: string;
}