import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { BusinessProfileSettingsRepository } from './business-profile-settings.repository';
import { UpdateBusinessProfileSettingsDto } from './dto/update-business-profile-settings.dto';
import { BusinessProfileSettings } from './interfaces/business-profile-settings.interface';

@Injectable()
export class BusinessProfileSettingsService {
  constructor(private readonly settingsRepository: BusinessProfileSettingsRepository) {}

  async findByBusinessId(businessId: string): Promise<BusinessProfileSettings> {
    const settings = await this.settingsRepository.findByBusinessId(businessId);
    if (!settings) {
      throw new NotFoundException('Business profile settings not found');
    }
    return settings;
  }

  async update(businessId: string, data: UpdateBusinessProfileSettingsDto): Promise<BusinessProfileSettings> {
    try {
      const settings = await this.settingsRepository.update(businessId, data);
      if (!settings) {
        throw new NotFoundException('Business profile settings not found');
      }
      return settings;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw mapDatabaseError(error);
    }
  }
}