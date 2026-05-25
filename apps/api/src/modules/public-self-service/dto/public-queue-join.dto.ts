import { IsIn, IsOptional, IsString } from 'class-validator';
import { IsPostgresUuid } from '../../../common/validators/postgres-uuid.validator';
import { QueueSource } from '../../queues/interfaces/queue.interface';

export class PublicQueueJoinDto {
  @IsOptional()
  @IsString()
  @IsPostgresUuid('branchId')
  branchId?: string;

  @IsString()
  @IsPostgresUuid('serviceId')
  serviceId!: string;

  @IsString()
  @IsPostgresUuid('customerId')
  customerId!: string;

  @IsString()
  @IsPostgresUuid('clientProfileId')
  clientProfileId!: string;

  @IsIn(['QR'])
  source!: Extract<QueueSource, 'QR'>;
}

