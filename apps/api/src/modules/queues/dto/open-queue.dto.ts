import { IsOptional, IsString, Matches } from 'class-validator';
import { POSTGRES_UUID_PATTERN } from '../../../common/validators/postgres-uuid.validator';

export class OpenQueueDto {
  @IsOptional()
  @IsString()
  @Matches(POSTGRES_UUID_PATTERN, { message: 'branchId must be a UUID' })
  branchId?: string;

  @IsOptional()
  @IsString()
  @Matches(POSTGRES_UUID_PATTERN, { message: 'serviceId must be a UUID' })
  serviceId?: string;
}
