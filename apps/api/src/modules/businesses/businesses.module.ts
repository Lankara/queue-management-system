import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesRepository } from './businesses.repository';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessesController],
  providers: [BusinessesRepository, BusinessesService],
  exports: [BusinessesRepository, BusinessesService]
})
export class BusinessesModule {}