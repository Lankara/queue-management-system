import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { NOTIFICATION_CHANNELS, NOTIFICATION_LANGUAGES, TEMPLATE_KEYS } from './notification-values';
import { NotificationChannel, NotificationLanguage, TemplateKey } from '../interfaces/notification.interface';

export class NotificationTemplateQueryDto {
  @IsOptional()
  @IsIn(NOTIFICATION_LANGUAGES)
  language?: NotificationLanguage;

  @IsOptional()
  @IsIn(NOTIFICATION_CHANNELS)
  channel?: NotificationChannel;

  @IsOptional()
  @IsIn(TEMPLATE_KEYS)
  templateKey?: TemplateKey;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}