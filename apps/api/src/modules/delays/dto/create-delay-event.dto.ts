import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDelayEventDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsUUID()
  serviceId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  delayMinutes!: number;

  @IsDateString()
  affectedFromTime!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}