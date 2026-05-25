import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ServicesController } from './services.controller';
import { ServicesRepository } from './services.repository';
import { ServicesService } from './services.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesController],
  providers: [ServicesRepository, ServicesService],
  exports: [ServicesRepository, ServicesService]
})
export class ServicesModule {}