import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ClientProfilesModule } from '../client-profiles/client-profiles.module';
import { MedicalProfilesController } from './medical-profiles.controller';
import { MedicalProfilesRepository } from './medical-profiles.repository';
import { MedicalProfilesService } from './medical-profiles.service';

@Module({
  imports: [DatabaseModule, ClientProfilesModule],
  controllers: [MedicalProfilesController],
  providers: [MedicalProfilesRepository, MedicalProfilesService],
  exports: [MedicalProfilesRepository, MedicalProfilesService]
})
export class MedicalProfilesModule {}