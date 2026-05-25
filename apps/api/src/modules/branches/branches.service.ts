import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { BranchesRepository } from './branches.repository';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './interfaces/branch.interface';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  async create(businessId: string, data: CreateBranchDto): Promise<Branch> {
    try {
      return await this.branchesRepository.create(businessId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAllByBusinessId(businessId: string): Promise<Branch[]> {
    return this.branchesRepository.findAllByBusinessId(businessId);
  }

  async findById(businessId: string, id: string): Promise<Branch> {
    const branch = await this.branchesRepository.findById(businessId, id);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(businessId: string, id: string, data: UpdateBranchDto): Promise<Branch> {
    try {
      const branch = await this.branchesRepository.update(businessId, id, data);
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
      return branch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }
}