import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { BusinessType, LanguageCode } from '../interfaces/business.interface';

export const BUSINESS_TYPES: BusinessType[] = [
  'MEDICAL_CENTER',
  'DOCTOR',
  'CLINIC',
  'HOSPITAL',
  'BARBER_SHOP',
  'BEAUTY_PARLOUR',
  'SALON',
  'SERVICE_SHOP',
  'OTHER'
];

export const LANGUAGE_CODES: LanguageCode[] = ['en', 'si'];

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsIn(BUSINESS_TYPES)
  businessType!: BusinessType;

  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  defaultLanguage?: LanguageCode;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}