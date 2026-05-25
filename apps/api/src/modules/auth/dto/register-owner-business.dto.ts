import { IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength, ValidateIf } from 'class-validator';
import { BusinessType } from '../../businesses/interfaces/business.interface';

const businessTypes: BusinessType[] = [
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

export class RegisterOwnerBusinessDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(7)
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['en', 'si'])
  preferredLanguage!: 'en' | 'si';

  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must use lowercase letters, numbers, and hyphens' })
  slug!: string;

  @IsIn(businessTypes)
  businessType!: BusinessType;

  @IsOptional()
  @IsIn(['en', 'si'])
  defaultLanguage?: 'en' | 'si';

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @ValidateIf((data) => Boolean(data.branchName))
  @IsString()
  branchCode?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @ValidateIf((data) => Boolean(data.serviceName))
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes?: number;
}
