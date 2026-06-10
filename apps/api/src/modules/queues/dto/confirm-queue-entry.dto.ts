import { IsOptional, IsString } from 'class-validator';
import { IsPostgresUuid } from '../../../common/validators/postgres-uuid.validator';

export class ConfirmQueueEntryDto {
  @IsOptional()
  @IsString()
  @IsPostgresUuid('confirmedBy')
  confirmedBy?: string;

  @IsOptional()
  @IsString()
  @IsPostgresUuid('insertBeforeEntryId')
  insertBeforeEntryId?: string;
}
