import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({ imports: [DatabaseModule], controllers: [ReportsController], providers: [ReportsRepository, ReportsService] })
export class ReportsModule {}
