import { IsIn, IsOptional, IsString } from 'class-validator';
import { CustomerPreferredLanguage } from '../interfaces/customer.interface';

export const CUSTOMER_LANGUAGE_CODES: CustomerPreferredLanguage[] = ['en', 'si'];

export class CreateCustomerDto {
  @IsString()
  primaryPhone!: string;

  @IsOptional()
  @IsIn(CUSTOMER_LANGUAGE_CODES)
  preferredLanguage?: CustomerPreferredLanguage;
}