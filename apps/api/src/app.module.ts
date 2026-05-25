import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { DatabaseModule } from './database/database.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { BusinessProfileSettingsModule } from './modules/business-profile-settings/business-profile-settings.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ClientProfilesModule } from './modules/client-profiles/client-profiles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DelaysModule } from './modules/delays/delays.module';
import { MedicalProfilesModule } from './modules/medical-profiles/medical-profiles.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PublicSelfServiceModule } from './modules/public-self-service/public-self-service.module';
import { ReportsModule } from './modules/reports/reports.module';
import { QueuesModule } from './modules/queues/queues.module';
import { ServicesModule } from './modules/services/services.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    AnalyticsModule,
    ReportsModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    BranchesModule,
    ServicesModule,
    BusinessProfileSettingsModule,
    CustomersModule,
    ClientProfilesModule,
    MedicalProfilesModule,
    QueuesModule,
    AppointmentsModule,
    NotificationsModule,
    DelaysModule,
    PublicSelfServiceModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware, RequestLoggingMiddleware).forRoutes('*');
  }
}
