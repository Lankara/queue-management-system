import { IsIn } from 'class-validator';
import { NOTIFICATION_CHANNELS, NOTIFICATION_LANGUAGES, TEMPLATE_KEYS } from './notification-values';
import { NotificationChannel, NotificationLanguage, TemplateKey } from '../interfaces/notification.interface';

export class CopyGlobalTemplateDto {
  @IsIn(NOTIFICATION_LANGUAGES)
  language!: NotificationLanguage;

  @IsIn(TEMPLATE_KEYS)
  templateKey!: TemplateKey;

  @IsIn(NOTIFICATION_CHANNELS)
  channel!: NotificationChannel;
}