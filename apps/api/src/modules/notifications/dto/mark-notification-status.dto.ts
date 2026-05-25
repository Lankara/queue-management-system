import { IsIn, IsOptional, IsString } from 'class-validator';
import { NOTIFICATION_STATUSES } from './notification-values';
import { NotificationStatus } from '../interfaces/notification.interface';

export class MarkNotificationStatusDto {
  @IsIn(NOTIFICATION_STATUSES)
  status!: NotificationStatus;

  @IsOptional()
  @IsString()
  failedReason?: string;
}