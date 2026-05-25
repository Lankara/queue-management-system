import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdateBusinessProfileSettingsDto } from './dto/update-business-profile-settings.dto';
import { BusinessProfileSettings, ProfileMode } from './interfaces/business-profile-settings.interface';

interface BusinessProfileSettingsRow {
  id: string;
  business_id: string;
  profile_mode: ProfileMode;
  require_customer_name: boolean;
  require_age: boolean;
  require_gender: boolean;
  require_address: boolean;
  require_medical_history: boolean;
  require_current_symptoms: boolean;
  allow_linked_clients: boolean;
  allow_online_booking: boolean;
  no_show_ban_limit: number;
  queue_number_length: number;
  created_at: Date;
  updated_at: Date | null;
}

const SETTINGS_COLUMNS = `id, business_id, profile_mode, require_customer_name, require_age, require_gender, require_address, require_medical_history, require_current_symptoms, allow_linked_clients, allow_online_booking, no_show_ban_limit, queue_number_length, created_at, updated_at`;

@Injectable()
export class BusinessProfileSettingsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByBusinessId(businessId: string): Promise<BusinessProfileSettings | null> {
    const result = await this.databaseService.query<BusinessProfileSettingsRow>(
      `SELECT ${SETTINGS_COLUMNS}
       FROM business_profile_settings
       WHERE business_id = $1
       LIMIT 1`,
      [businessId]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, data: UpdateBusinessProfileSettingsDto): Promise<BusinessProfileSettings | null> {
    const fieldMap: Record<string, string> = {
      profileMode: 'profile_mode',
      requireCustomerName: 'require_customer_name',
      requireAge: 'require_age',
      requireGender: 'require_gender',
      requireAddress: 'require_address',
      requireMedicalHistory: 'require_medical_history',
      requireCurrentSymptoms: 'require_current_symptoms',
      allowLinkedClients: 'allow_linked_clients',
      allowOnlineBooking: 'allow_online_booking',
      noShowBanLimit: 'no_show_ban_limit',
      queueNumberLength: 'queue_number_length'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findByBusinessId(businessId);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<BusinessProfileSettingsRow>(
      `UPDATE business_profile_settings
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1
       RETURNING ${SETTINGS_COLUMNS}`,
      [businessId, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: BusinessProfileSettingsRow): BusinessProfileSettings | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      profileMode: row.profile_mode,
      requireCustomerName: row.require_customer_name,
      requireAge: row.require_age,
      requireGender: row.require_gender,
      requireAddress: row.require_address,
      requireMedicalHistory: row.require_medical_history,
      requireCurrentSymptoms: row.require_current_symptoms,
      allowLinkedClients: row.allow_linked_clients,
      allowOnlineBooking: row.allow_online_booking,
      noShowBanLimit: row.no_show_ban_limit,
      queueNumberLength: row.queue_number_length,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}