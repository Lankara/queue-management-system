import { IsOptional, IsString } from 'class-validator';

export class RejectQueueEntryDto {
  @IsOptional()
  @IsString()
  reason?: string;
}