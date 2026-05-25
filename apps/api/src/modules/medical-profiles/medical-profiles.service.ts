import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { ClientProfilesRepository } from '../client-profiles/client-profiles.repository';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';
import { MedicalProfile } from './interfaces/medical-profile.interface';
import { MedicalProfilesRepository } from './medical-profiles.repository';

@Injectable()
export class MedicalProfilesService {
  constructor(
    private readonly medicalProfilesRepository: MedicalProfilesRepository,
    private readonly clientProfilesRepository: ClientProfilesRepository
  ) {}

  async create(businessId: string, clientProfileId: string, data: CreateMedicalProfileDto): Promise<MedicalProfile> {
    const clientProfile = await this.clientProfilesRepository.findById(businessId, clientProfileId);
    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    const existingProfile = await this.medicalProfilesRepository.findByClientProfileId(businessId, clientProfileId);
    if (existingProfile) {
      throw new ConflictException('Medical profile already exists for this client profile');
    }

    try {
      return await this.medicalProfilesRepository.create(businessId, clientProfile.customerId, clientProfileId, data);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findByClientProfileId(businessId: string, clientProfileId: string): Promise<MedicalProfile> {
    const profile = await this.medicalProfilesRepository.findByClientProfileId(businessId, clientProfileId);
    if (!profile) {
      throw new NotFoundException('Medical profile not found');
    }
    return profile;
  }

  async update(businessId: string, clientProfileId: string, data: UpdateMedicalProfileDto): Promise<MedicalProfile> {
    try {
      const profile = await this.medicalProfilesRepository.update(businessId, clientProfileId, data);
      if (!profile) {
        throw new NotFoundException('Medical profile not found');
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