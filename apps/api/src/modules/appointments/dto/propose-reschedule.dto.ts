import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProposeRescheduleDto {
  @IsDateString()
  newStartTime!: string;

  @IsDateString()
  newEndTime!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedBy?: string;
}