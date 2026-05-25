import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { CUSTOMER_LANGUAGE_CODES } from './create-customer.dto';
import { CustomerPreferredLanguage } from '../interfaces/customer.interface';

export class UpdateCustomerDto {
  @IsOptional()
  @IsIn(CUSTOMER_LANGUAGE_CODES)
  preferredLanguage?: CustomerPreferredLanguage;

  @IsOptional()
  @IsBoolean()
  isOnlineBookingBanned?: boolean;

  @IsOptional()
  @IsString()
  banReason?: string | null;
}