import { IsOptional, IsString } from 'class-validator';

export class RejectRescheduleDto {
  @IsOptional()
  @IsString()
  reason?: string;
}