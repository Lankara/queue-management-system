import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProfileMode } from '../interfaces/business-profile-settings.interface';

export const PROFILE_MODES: ProfileMode[] = ['BASIC', 'MEDICAL', 'CUSTOM'];

export class UpdateBusinessProfileSettingsDto {
  @IsOptional()
  @IsIn(PROFILE_MODES)
  profileMode?: ProfileMode;

  @IsOptional()
  @IsBoolean()
  requireCustomerName?: boolean;

  @IsOptional()
  @IsBoolean()
  requireAge?: boolean;

  @IsOptional()
  @IsBoolean()
  requireGender?: boolean;

  @IsOptional()
  @IsBoolean()
  requireAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  requireMedicalHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  requireCurrentSymptoms?: boolean;

  @IsOptional()
  @IsBoolean()
  allowLinkedClients?: boolean;

  @IsOptional()
  @IsBoolean()
  allowOnlineBooking?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  noShowBanLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  queueNumberLength?: number;
}