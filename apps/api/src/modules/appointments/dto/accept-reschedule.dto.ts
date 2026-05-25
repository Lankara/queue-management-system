import { IsOptional, IsUUID } from 'class-validator';

export class AcceptRescheduleDto {
  @IsOptional()
  @IsUUID()
  acceptedBy?: string;
}