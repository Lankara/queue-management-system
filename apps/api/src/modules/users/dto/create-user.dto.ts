import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserPreferredLanguage } from '../interfaces/user.interface';

export class CreateUserDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['en', 'si'])
  preferredLanguage?: UserPreferredLanguage;
}