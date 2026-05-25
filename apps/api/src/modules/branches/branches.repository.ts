import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './interfaces/branch.interface';

interface BranchRow {
  id: string;
  business_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

const BRANCH_COLUMNS = `id, business_id, name, code, address, phone, is_active, created_at, updated_at`;

@Injectable()
export class BranchesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: string, data: CreateBranchDto): Promise<Branch> {
    const result = await this.databaseService.query<BranchRow>(
      `INSERT INTO branches (business_id, name, code, address, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${BRANCH_COLUMNS}`,
      [businessId, data.name, data.code, data.address ?? null, data.phone ?? null, data.isActive ?? true]
    );
    return this.mapRow(result.rows[0]) as Branch;
  }

  async findAllByBusinessId(businessId: string): Promise<Branch[]> {
    const result = await this.databaseService.query<BranchRow>(
      `SELECT ${BRANCH_COLUMNS} FROM branches WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );
    return result.rows.map((row) => this.mapRow(row) as Branch);
  }

  async findById(businessId: string, id: string): Promise<Branch | null> {
    const result = await this.databaseService.query<BranchRow>(
      `SELECT ${BRANCH_COLUMNS} FROM branches WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, id]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, id: string, data: UpdateBranchDto): Promise<Branch | null> {
    const fieldMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      address: 'address',
      phone: 'phone',
      isActive: 'is_active'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findById(businessId, id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<BranchRow>(
      `UPDATE branches
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${BRANCH_COLUMNS}`,
      [businessId, id, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row?: BranchRow): Branch | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      code: row.code,
      address: row.address,
      phone: row.phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}