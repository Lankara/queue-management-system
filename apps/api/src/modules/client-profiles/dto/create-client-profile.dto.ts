import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GenderCode } from '../interfaces/client-profile.interface';

export const GENDER_CODES: GenderCode[] = ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'];

export class CreateClientProfileDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  relationshipToContact?: string;

  @IsOptional()
  @IsIn(GENDER_CODES)
  gender?: GenderCode;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageYears?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}