import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BranchesController } from './branches.controller';
import { BranchesRepository } from './branches.repository';
import { BranchesService } from './branches.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BranchesController],
  providers: [BranchesRepository, BranchesService],
  exports: [BranchesRepository, BranchesService]
})
export class BranchesModule {}