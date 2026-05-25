import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueuesController } from './queues.controller';
import { QueuesRepository } from './queues.repository';
import { QueuesService } from './queues.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [QueuesController],
  providers: [QueuesRepository, QueuesService],
  exports: [QueuesRepository, QueuesService]
})
export class QueuesModule {}