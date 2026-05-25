import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  messageBody?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}