import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business, BusinessType } from './interfaces/business.interface';

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  default_language: 'en' | 'si';
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

const BUSINESS_COLUMNS = `id, name, slug, business_type, default_language, timezone, phone, email, address, is_active, created_at, updated_at`;

@Injectable()
export class BusinessesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createWithDefaultSettings(data: CreateBusinessDto, profileMode: 'BASIC' | 'MEDICAL'): Promise<Business> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<BusinessRow>(
        `INSERT INTO businesses (name, slug, business_type, default_language, timezone, phone, email, address, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${BUSINESS_COLUMNS}`,
        [
          data.name,
          data.slug,
          data.businessType,
          data.defaultLanguage ?? 'en',
          data.timezone ?? 'Asia/Colombo',
          data.phone ?? null,
          data.email ?? null,
          data.address ?? null,
          data.isActive ?? true
        ]
      );
      const business = this.mapRow(result.rows[0]) as Business;

      await client.query(
        `INSERT INTO business_profile_settings (business_id, profile_mode)
         VALUES ($1, $2)`,
        [business.id, profileMode]
      );

      await client.query('COMMIT');
      return business;
    } catch (error) {
      await this.safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<Business[]> {
    const result = await this.databaseService.query<BusinessRow>(
      `SELECT ${BUSINESS_COLUMNS} FROM businesses ORDER BY created_at DESC`
    );
    return result.rows.map((row) => this.mapRow(row) as Business);
  }

  async findById(id: string): Promise<Business | null> {
    const result = await this.databaseService.query<BusinessRow>(
      `SELECT ${BUSINESS_COLUMNS} FROM businesses WHERE id = $1 LIMIT 1`,
      [id]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(id: string, data: UpdateBusinessDto): Promise<Business | null> {
    const fieldMap: Record<keyof UpdateBusinessDto, string> = {
      name: 'name',
      slug: 'slug',
      businessType: 'business_type',
      defaultLanguage: 'default_language',
      timezone: 'timezone',
      phone: 'phone',
      email: 'email',
      address: 'address',
      isActive: 'is_active'
    };
    return this.updateByFields(id, data, fieldMap);
  }

  private async updateByFields(id: string, data: UpdateBusinessDto, fieldMap: Record<string, string>): Promise<Business | null> {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findById(id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<BusinessRow>(
      `UPDATE businesses
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING ${BUSINESS_COLUMNS}`,
      [id, ...values]
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: BusinessRow): Business | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      businessType: row.business_type,
      defaultLanguage: row.default_language,
      timezone: row.timezone,
      phone: row.phone,
      email: row.email,
      address: row.address,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async safeRollback(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback failures so the original database error can be handled by the service.
    }
  }
}