import { IsOptional, IsString, IsUUID } from 'class-validator';

export class BanResetDto {
  @IsOptional()
  @IsUUID()
  resetBy?: string;

  @IsOptional()
  @IsString()
  resetNote?: string;
}