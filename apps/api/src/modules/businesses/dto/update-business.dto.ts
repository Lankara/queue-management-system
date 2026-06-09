import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { BUSINESS_TYPES, LANGUAGE_CODES } from './create-business.dto';
import { BusinessType, LanguageCode } from '../interfaces/business.interface';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;


  @IsOptional()
  @IsIn(BUSINESS_TYPES)
  businessType?: BusinessType;

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
