import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { NOTIFICATION_CHANNELS, NOTIFICATION_LANGUAGES, NOTIFICATION_STATUSES, TEMPLATE_KEYS } from './notification-values';
import { NotificationChannel, NotificationLanguage, NotificationStatus, TemplateKey } from '../interfaces/notification.interface';

export class CreateNotificationLogDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  clientProfileId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  queueEntryId?: string;

  @IsIn(NOTIFICATION_CHANNELS)
  channel!: NotificationChannel;

  @IsIn(NOTIFICATION_LANGUAGES)
  language!: NotificationLanguage;

  @IsOptional()
  @IsIn(TEMPLATE_KEYS)
  templateKey?: TemplateKey;

  @IsString()
  recipient!: string;

  @IsString()
  messageBody!: string;

  @IsOptional()
  @IsIn(NOTIFICATION_STATUSES)
  status?: NotificationStatus;
}