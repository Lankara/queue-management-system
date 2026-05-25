import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { NotificationDispatchController } from './notification-dispatch.controller';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule, WhatsAppModule],
  controllers: [NotificationsController, NotificationDispatchController],
  providers: [NotificationsRepository, NotificationsService, NotificationDispatcherService],
  exports: [NotificationsRepository, NotificationsService, NotificationDispatcherService]
})
export class NotificationsModule {}
