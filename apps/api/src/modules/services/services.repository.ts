import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BusinessServiceItem } from './interfaces/service.interface';

interface ServiceRow {
  id: string;
  business_id: string;
  branch_id: string | null;
  name: string;
  code: string;
  description: string | null;
  duration_minutes: number;
  requires_approval: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

const SERVICE_COLUMNS = `id, business_id, branch_id, name, code, description, duration_minutes, requires_approval, is_active, created_at, updated_at`;

@Injectable()
export class ServicesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: string, data: CreateServiceDto): Promise<BusinessServiceItem> {
    const result = await this.databaseService.query<ServiceRow>(
      `INSERT INTO services (business_id, branch_id, name, code, description, duration_minutes, requires_approval, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${SERVICE_COLUMNS}`,
      [businessId, data.branchId ?? null, data.name, data.code, data.description ?? null, data.durationMinutes ?? 15, data.requiresApproval ?? true, data.isActive ?? true]
    );
    return this.mapRow(result.rows[0]) as BusinessServiceItem;
  }

  async findAllByBusinessId(businessId: string): Promise<BusinessServiceItem[]> {
    const result = await this.databaseService.query<ServiceRow>(
      `SELECT ${SERVICE_COLUMNS} FROM services WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );
    return result.rows.map((row) => this.mapRow(row) as BusinessServiceItem);
  }

  async findById(businessId: string, id: string): Promise<BusinessServiceItem | null> {
    const result = await this.databaseService.query<ServiceRow>(
      `SELECT ${SERVICE_COLUMNS} FROM services WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, id]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, id: string, data: UpdateServiceDto): Promise<BusinessServiceItem | null> {
    const fieldMap: Record<string, string> = {
      branchId: 'branch_id',
      name: 'name',
      code: 'code',
      description: 'description',
      durationMinutes: 'duration_minutes',
      requiresApproval: 'requires_approval',
      isActive: 'is_active'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findById(businessId, id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<ServiceRow>(
      `UPDATE services
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${SERVICE_COLUMNS}`,
      [businessId, id, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: ServiceRow): BusinessServiceItem | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      branchId: row.branch_id,
      name: row.name,
      code: row.code,
      description: row.description,
      durationMinutes: row.duration_minutes,
      requiresApproval: row.requires_approval,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}