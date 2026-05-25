import { IsOptional, IsUUID } from 'class-validator';

export class ConfirmQueueEntryDto {
  @IsOptional()
  @IsUUID()
  confirmedBy?: string;
}