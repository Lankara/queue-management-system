import { IsIn, IsOptional, IsString } from 'class-validator';
import { IsPostgresUuid } from '../../../common/validators/postgres-uuid.validator';
import { QueueSource } from '../interfaces/queue.interface';

export const QUEUE_SOURCES: QueueSource[] = ['QR', 'WEB', 'MOBILE_APP', 'WHATSAPP', 'OPERATOR', 'HARDWARE'];

export class CreateQueueJoinDto {
  @IsOptional()
  @IsString()
  @IsPostgresUuid('branchId')
  branchId?: string;

  @IsOptional()
  @IsString()
  @IsPostgresUuid('serviceId')
  serviceId?: string;

  @IsString()
  @IsPostgresUuid('customerId')
  customerId!: string;

  @IsString()
  @IsPostgresUuid('clientProfileId')
  clientProfileId!: string;

  @IsIn(QUEUE_SOURCES)
  source!: QueueSource;
}
