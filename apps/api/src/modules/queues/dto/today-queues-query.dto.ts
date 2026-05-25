import { IsOptional, IsString } from 'class-validator';
import { IsPostgresUuid } from '../../../common/validators/postgres-uuid.validator';

export class TodayQueuesQueryDto {
  @IsOptional()
  @IsString()
  @IsPostgresUuid('branchId')
  branchId?: string;

  @IsOptional()
  @IsString()
  @IsPostgresUuid('serviceId')
  serviceId?: string;
}
