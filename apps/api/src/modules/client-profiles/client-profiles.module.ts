import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ClientProfilesController } from './client-profiles.controller';
import { ClientProfilesRepository } from './client-profiles.repository';
import { ClientProfilesService } from './client-profiles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClientProfilesController],
  providers: [ClientProfilesRepository, ClientProfilesService],
  exports: [ClientProfilesRepository, ClientProfilesService]
})
export class ClientProfilesModule {}