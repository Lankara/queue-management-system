import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';
import { MedicalProfile } from './interfaces/medical-profile.interface';

interface MedicalProfileRow {
  id: string;
  business_id: string;
  customer_id: string;
  client_profile_id: string;
  blood_group: string | null;
  allergies: string | null;
  medical_history: string | null;
  current_symptoms: string | null;
  previous_visit_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: Date;
  updated_at: Date | null;
}

const MEDICAL_PROFILE_COLUMNS = `id, business_id, customer_id, client_profile_id, blood_group, allergies, medical_history, current_symptoms, previous_visit_notes, emergency_contact_name, emergency_contact_phone, created_at, updated_at`;

@Injectable()
export class MedicalProfilesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: string, customerId: string, clientProfileId: string, data: CreateMedicalProfileDto): Promise<MedicalProfile> {
    const result = await this.databaseService.query<MedicalProfileRow>(
      `INSERT INTO medical_profiles (business_id, customer_id, client_profile_id, blood_group, allergies, medical_history, current_symptoms, previous_visit_notes, emergency_contact_name, emergency_contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${MEDICAL_PROFILE_COLUMNS}`,
      [businessId, customerId, clientProfileId, data.bloodGroup ?? null, data.allergies ?? null, data.medicalHistory ?? null, data.currentSymptoms ?? null, data.previousVisitNotes ?? null, data.emergencyContactName ?? null, data.emergencyContactPhone ?? null]
    );
    return this.mapRow(result.rows[0]) as MedicalProfile;
  }

  async findByClientProfileId(businessId: string, clientProfileId: string): Promise<MedicalProfile | null> {
    const result = await this.databaseService.query<MedicalProfileRow>(
      `SELECT ${MEDICAL_PROFILE_COLUMNS}
       FROM medical_profiles
       WHERE business_id = $1 AND client_profile_id = $2
       LIMIT 1`,
      [businessId, clientProfileId]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, clientProfileId: string, data: UpdateMedicalProfileDto): Promise<MedicalProfile | null> {
    const fieldMap: Record<string, string> = {
      bloodGroup: 'blood_group',
      allergies: 'allergies',
      medicalHistory: 'medical_history',
      currentSymptoms: 'current_symptoms',
      previousVisitNotes: 'previous_visit_notes',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findByClientProfileId(businessId, clientProfileId);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<MedicalProfileRow>(
      `UPDATE medical_profiles
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND client_profile_id = $2
       RETURNING ${MEDICAL_PROFILE_COLUMNS}`,
      [businessId, clientProfileId, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: MedicalProfileRow): MedicalProfile | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      clientProfileId: row.client_profile_id,
      bloodGroup: row.blood_group,
      allergies: row.allergies,
      medicalHistory: row.medical_history,
      currentSymptoms: row.current_symptoms,
      previousVisitNotes: row.previous_visit_notes,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}