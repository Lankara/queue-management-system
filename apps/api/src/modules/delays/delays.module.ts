import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DelaysController } from './delays.controller';
import { DelaysRepository } from './delays.repository';
import { DelaysService } from './delays.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [DelaysController],
  providers: [DelaysRepository, DelaysService],
  exports: [DelaysRepository, DelaysService]
})
export class DelaysModule {}