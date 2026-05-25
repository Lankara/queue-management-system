import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ClientProfile, GenderCode } from './interfaces/client-profile.interface';

interface ClientProfileRow {
  id: string;
  business_id: string;
  customer_id: string;
  full_name: string;
  relationship_to_contact: string | null;
  gender: GenderCode;
  date_of_birth: string | null;
  age_years: number | null;
  address: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

const CLIENT_PROFILE_COLUMNS = `id, business_id, customer_id, full_name, relationship_to_contact, gender, date_of_birth, age_years, address, notes, created_at, updated_at`;

@Injectable()
export class ClientProfilesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: string, customerId: string, data: CreateClientProfileDto): Promise<ClientProfile> {
    const result = await this.databaseService.query<ClientProfileRow>(
      `INSERT INTO client_profiles (business_id, customer_id, full_name, relationship_to_contact, gender, date_of_birth, age_years, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${CLIENT_PROFILE_COLUMNS}`,
      [businessId, customerId, data.fullName, data.relationshipToContact ?? null, data.gender ?? 'NOT_SPECIFIED', data.dateOfBirth ?? null, data.ageYears ?? null, data.address ?? null, data.notes ?? null]
    );
    return this.mapRow(result.rows[0]) as ClientProfile;
  }

  async findAllByCustomerId(businessId: string, customerId: string): Promise<ClientProfile[]> {
    const result = await this.databaseService.query<ClientProfileRow>(
      `SELECT ${CLIENT_PROFILE_COLUMNS}
       FROM client_profiles
       WHERE business_id = $1 AND customer_id = $2
       ORDER BY created_at DESC`,
      [businessId, customerId]
    );
    return result.rows.map((row) => this.mapRow(row) as ClientProfile);
  }

  async findById(businessId: string, id: string): Promise<ClientProfile | null> {
    const result = await this.databaseService.query<ClientProfileRow>(
      `SELECT ${CLIENT_PROFILE_COLUMNS}
       FROM client_profiles
       WHERE business_id = $1 AND id = $2
       LIMIT 1`,
      [businessId, id]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, id: string, data: UpdateClientProfileDto): Promise<ClientProfile | null> {
    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      relationshipToContact: 'relationship_to_contact',
      gender: 'gender',
      dateOfBirth: 'date_of_birth',
      ageYears: 'age_years',
      address: 'address',
      notes: 'notes'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findById(businessId, id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<ClientProfileRow>(
      `UPDATE client_profiles
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${CLIENT_PROFILE_COLUMNS}`,
      [businessId, id, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: ClientProfileRow): ClientProfile | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      fullName: row.full_name,
      relationshipToContact: row.relationship_to_contact,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      ageYears: row.age_years,
      address: row.address,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}