import { IsOptional, IsString } from 'class-validator';

export class UpdateMedicalProfileDto {
  @IsOptional()
  @IsString()
  bloodGroup?: string | null;

  @IsOptional()
  @IsString()
  allergies?: string | null;

  @IsOptional()
  @IsString()
  medicalHistory?: string | null;

  @IsOptional()
  @IsString()
  currentSymptoms?: string | null;

  @IsOptional()
  @IsString()
  previousVisitNotes?: string | null;

  @IsOptional()
  @IsString()
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string | null;
}