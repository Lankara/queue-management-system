import { IsDateString, IsOptional, IsString } from 'class-validator';
import { IsPostgresUuid } from '../../../common/validators/postgres-uuid.validator';

export class PublicAppointmentRequestDto {
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

  @IsDateString()
  requestedStartTime!: string;

  @IsDateString()
  requestedEndTime!: string;
}
