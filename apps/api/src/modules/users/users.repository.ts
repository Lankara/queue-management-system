import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuthBusinessRole } from '../auth/interfaces/auth-user.interface';
import { User, UserPreferredLanguage } from './interfaces/user.interface';

interface AuthUserRow extends UserRow {
  password_hash: string | null;
}

interface BusinessRoleRow {
  business_id: string;
  business_name: string | null;
  business_type: string | null;
  is_active: boolean | null;
  role: string;
}

interface UserRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  preferred_language: UserPreferredLanguage;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateUserData {
  fullName: string;
  phone?: string;
  email?: string;
  passwordHash: string;
  preferredLanguage?: UserPreferredLanguage;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `SELECT id, full_name, phone, email, preferred_language, is_active, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return this.mapRow(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `SELECT id, full_name, phone, email, preferred_language, is_active, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    return this.mapRow(result.rows[0]);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `SELECT id, full_name, phone, email, preferred_language, is_active, created_at, updated_at
       FROM users
       WHERE phone = $1
       LIMIT 1`,
      [phone]
    );

    return this.mapRow(result.rows[0]);
  }

  async findAuthUserByEmailOrPhone(identifier: string): Promise<(User & { passwordHash: string | null }) | null> {
    const normalized = identifier.trim();
    const result = await this.databaseService.query<AuthUserRow>(
      `SELECT id, full_name, phone, email, password_hash, preferred_language, is_active, created_at, updated_at
       FROM users
       WHERE lower(email) = lower($1) OR phone = $1
       LIMIT 1`,
      [normalized]
    );

    return this.mapAuthRow(result.rows[0]);
  }

  async findBusinessRolesByUserId(userId: string): Promise<AuthBusinessRole[]> {
    const result = await this.databaseService.query<BusinessRoleRow>(
      `SELECT bu.business_id, b.name AS business_name, b.business_type, b.is_active, bu.role
       FROM business_users bu
       LEFT JOIN businesses b ON b.id = bu.business_id
       WHERE bu.user_id = $1 AND bu.is_active = true
       ORDER BY bu.created_at ASC`,
      [userId]
    );

    return result.rows.map((row) => ({
      businessId: row.business_id,
      businessName: row.business_name,
      businessType: row.business_type,
      isActive: row.is_active ?? true,
      role: row.role
    }));
  }

  async createUser(data: CreateUserData): Promise<User> {
    const result = await this.databaseService.query<UserRow>(
      `INSERT INTO users (full_name, phone, email, password_hash, preferred_language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone, email, preferred_language, is_active, created_at, updated_at`,
      [
        data.fullName,
        data.phone ?? null,
        data.email ?? null,
        data.passwordHash,
        data.preferredLanguage ?? 'en'
      ]
    );

    return this.mapRow(result.rows[0]) as User;
  }

  async updateLastLogin(id: string): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `UPDATE users
       SET updated_at = now()
       WHERE id = $1
       RETURNING id, full_name, phone, email, preferred_language, is_active, created_at, updated_at`,
      [id]
    );

    return this.mapRow(result.rows[0]);
  }

  async setUserActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    const result = await this.databaseService.query<UserRow>(
      `UPDATE users
       SET is_active = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, full_name, phone, email, preferred_language, is_active, created_at, updated_at`,
      [id, isActive]
    );

    return this.mapRow(result.rows[0]);
  }

  private mapAuthRow(row?: AuthUserRow): (User & { passwordHash: string | null }) | null {
    const user = this.mapRow(row);

    if (!user || !row) {
      return null;
    }

    return {
      ...user,
      passwordHash: row.password_hash
    };
  }

  private mapRow(row?: UserRow): User | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      preferredLanguage: row.preferred_language,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
