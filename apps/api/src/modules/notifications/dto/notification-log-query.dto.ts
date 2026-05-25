import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from './notification-values';
import { NotificationChannel, NotificationStatus } from '../interfaces/notification.interface';

export class NotificationLogQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  queueEntryId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_STATUSES)
  status?: NotificationStatus;

  @IsOptional()
  @IsIn(NOTIFICATION_CHANNELS)
  channel?: NotificationChannel;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}