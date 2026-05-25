import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientProfile } from './interfaces/client-profile.interface';
import { ClientProfilesRepository } from './client-profiles.repository';

@Injectable()
export class ClientProfilesService {
  constructor(private readonly clientProfilesRepository: ClientProfilesRepository) {}

  async create(businessId: string, customerId: string, data: CreateClientProfileDto): Promise<ClientProfile> {
    try {
      return await this.clientProfilesRepository.create(businessId, customerId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  findAllByCustomerId(businessId: string, customerId: string): Promise<ClientProfile[]> {
    return this.clientProfilesRepository.findAllByCustomerId(businessId, customerId);
  }

  async findById(businessId: string, id: string): Promise<ClientProfile> {
    const profile = await this.clientProfilesRepository.findById(businessId, id);
    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }
    return profile;
  }

  async update(businessId: string, id: string, data: UpdateClientProfileDto): Promise<ClientProfile> {
    try {
      const profile = await this.clientProfilesRepository.update(businessId, id, data);
      if (!profile) {
        throw new NotFoundException('Client profile not found');
      }
      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }
}