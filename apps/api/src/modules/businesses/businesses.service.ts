import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business, BusinessType } from './interfaces/business.interface';
import { BusinessesRepository } from './businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessesRepository) {}

  async create(data: CreateBusinessDto): Promise<Business> {
    try {
      return await this.businessesRepository.createWithDefaultSettings(
        data,
        this.getDefaultProfileMode(data.businessType)
      );
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAll(): Promise<Business[]> {
    return this.businessesRepository.findAll();
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(id: string, data: UpdateBusinessDto): Promise<Business> {
    try {
      const business = await this.businessesRepository.update(id, data);
      if (!business) {
        throw new NotFoundException('Business not found');
      }
      return business;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }

  private getDefaultProfileMode(businessType: BusinessType): 'BASIC' | 'MEDICAL' {
    return ['MEDICAL_CENTER', 'DOCTOR', 'CLINIC', 'HOSPITAL'].includes(businessType) ? 'MEDICAL' : 'BASIC';
  }
}