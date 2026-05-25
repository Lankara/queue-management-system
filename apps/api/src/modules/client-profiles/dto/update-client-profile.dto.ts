import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GENDER_CODES } from './create-client-profile.dto';
import { GenderCode } from '../interfaces/client-profile.interface';

export class UpdateClientProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  relationshipToContact?: string | null;

  @IsOptional()
  @IsIn(GENDER_CODES)
  gender?: GenderCode;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageYears?: number | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}