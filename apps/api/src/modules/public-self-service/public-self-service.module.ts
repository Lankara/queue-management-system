import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientProfilesModule } from '../client-profiles/client-profiles.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueuesModule } from '../queues/queues.module';
import { PublicSelfServiceController } from './public-self-service.controller';
import { PublicSelfServiceService } from './public-self-service.service';

@Module({
  imports: [DatabaseModule, CustomersModule, ClientProfilesModule, QueuesModule, AppointmentsModule, NotificationsModule],
  controllers: [PublicSelfServiceController],
  providers: [PublicSelfServiceService]
})
export class PublicSelfServiceModule {}

