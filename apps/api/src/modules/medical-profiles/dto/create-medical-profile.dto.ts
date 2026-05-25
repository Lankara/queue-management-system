import { IsOptional, IsString } from 'class-validator';

export class CreateMedicalProfileDto {
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  currentSymptoms?: string;

  @IsOptional()
  @IsString()
  previousVisitNotes?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}