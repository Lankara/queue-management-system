import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BusinessProfileSettingsController } from './business-profile-settings.controller';
import { BusinessProfileSettingsRepository } from './business-profile-settings.repository';
import { BusinessProfileSettingsService } from './business-profile-settings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessProfileSettingsController],
  providers: [BusinessProfileSettingsRepository, BusinessProfileSettingsService],
  exports: [BusinessProfileSettingsRepository, BusinessProfileSettingsService]
})
export class BusinessProfileSettingsModule {}