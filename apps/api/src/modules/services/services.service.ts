import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BusinessServiceItem } from './interfaces/service.interface';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  async create(businessId: string, data: CreateServiceDto): Promise<BusinessServiceItem> {
    try {
      return await this.servicesRepository.create(businessId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAllByBusinessId(businessId: string): Promise<BusinessServiceItem[]> {
    return this.servicesRepository.findAllByBusinessId(businessId);
  }

  async findById(businessId: string, id: string): Promise<BusinessServiceItem> {
    const service = await this.servicesRepository.findById(businessId, id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(businessId: string, id: string, data: UpdateServiceDto): Promise<BusinessServiceItem> {
    try {
      const service = await this.servicesRepository.update(businessId, id, data);
      if (!service) {
        throw new NotFoundException('Service not found');
      }
      return service;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }
}