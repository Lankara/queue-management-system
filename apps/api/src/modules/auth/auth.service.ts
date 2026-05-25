import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PoolClient } from 'pg';
import { mapDatabaseError } from '../../common/utils/database-error.util';
import { comparePassword, hashPassword } from '../../common/utils/password.util';
import { env } from '../../config/env';
import { DatabaseService } from '../../database/database.service';
import { BusinessType } from '../businesses/interfaces/business.interface';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerBusinessDto } from './dto/register-owner-business.dto';
import { AuthBusinessRole, AuthenticatedUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface AuthUserRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  preferred_language: 'en' | 'si';
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService
  ) {}

  async login(data: LoginDto): Promise<{ accessToken: string; user: AuthenticatedUser; businesses: AuthBusinessRole[] }> {
    const authUser = await this.usersRepository.findAuthUserByEmailOrPhone(data.identifier);

    if (!authUser || !authUser.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await comparePassword(data.password, authUser.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!authUser.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    await this.usersRepository.updateLastLogin(authUser.id);

    return this.createAuthSession({
      id: authUser.id,
      fullName: authUser.fullName,
      phone: authUser.phone,
      email: authUser.email,
      preferredLanguage: authUser.preferredLanguage,
      isActive: authUser.isActive,
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt
    });
  }

  async registerOwnerBusiness(data: RegisterOwnerBusinessDto): Promise<{ accessToken: string; user: AuthenticatedUser; businesses: AuthBusinessRole[] }> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query('BEGIN');

      const passwordHash = await hashPassword(data.password);
      const userResult = await client.query<AuthUserRow>(
        `INSERT INTO users (full_name, phone, email, password_hash, preferred_language)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, phone, email, preferred_language, is_active, created_at, updated_at`,
        [data.fullName, data.phone, data.email, passwordHash, data.preferredLanguage]
      );
      const userRow = userResult.rows[0];

      const businessResult = await client.query<{ id: string }>(
        `INSERT INTO businesses (name, slug, business_type, default_language, timezone, phone, email, address, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id`,
        [
          data.businessName,
          data.slug,
          data.businessType,
          data.defaultLanguage ?? data.preferredLanguage ?? 'en',
          data.timezone ?? 'Asia/Colombo',
          data.businessPhone ?? data.phone,
          data.businessEmail ?? data.email,
          data.address ?? null
        ]
      );
      const businessId = businessResult.rows[0]?.id as string;

      await client.query(
        `INSERT INTO business_profile_settings (business_id, profile_mode)
         VALUES ($1, $2)`,
        [businessId, this.getDefaultProfileMode(data.businessType)]
      );

      await client.query(
        `INSERT INTO business_users (business_id, user_id, role)
         VALUES ($1, $2, 'BUSINESS_OWNER')`,
        [businessId, userRow.id]
      );

      let branchId: string | null = null;
      if (data.branchName && data.branchCode) {
        const branchResult = await client.query<{ id: string }>(
          `INSERT INTO branches (business_id, name, code, address, phone)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [businessId, data.branchName, data.branchCode, data.address ?? null, data.businessPhone ?? data.phone]
        );
        branchId = branchResult.rows[0]?.id ?? null;
      }

      if (data.serviceName && data.serviceCode) {
        await client.query(
          `INSERT INTO services (business_id, branch_id, name, code, duration_minutes)
           VALUES ($1, $2, $3, $4, $5)`,
          [businessId, branchId, data.serviceName, data.serviceCode, data.durationMinutes ?? 15]
        );
      }

      await client.query('COMMIT');

      return this.createAuthSession({
        id: userRow.id,
        fullName: userRow.full_name,
        phone: userRow.phone,
        email: userRow.email,
        preferredLanguage: userRow.preferred_language,
        isActive: userRow.is_active,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at
      });
    } catch (error) {
      await this.safeRollback(client);
      throw mapDatabaseError(error);
    } finally {
      client.release();
    }
  }

  private async createAuthSession(authUser: Omit<AuthenticatedUser, 'roles' | 'businessIds' | 'businesses'>): Promise<{ accessToken: string; user: AuthenticatedUser; businesses: AuthBusinessRole[] }> {
    const businesses = await this.usersRepository.findBusinessRolesByUserId(authUser.id);
    const roles = [...new Set(businesses.map((business) => business.role))];
    const businessIds = [...new Set(businesses.map((business) => business.businessId))];
    const user: AuthenticatedUser = {
      ...authUser,
      roles,
      businessIds,
      businesses
    };

    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      phone: authUser.phone,
      roles,
      businessIds
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn: env.jwtExpiresIn as JwtSignOptions['expiresIn'] }),
      user,
      businesses
    };
  }

  private getDefaultProfileMode(businessType: BusinessType): 'BASIC' | 'MEDICAL' {
    return ['MEDICAL_CENTER', 'DOCTOR', 'CLINIC', 'HOSPITAL'].includes(businessType) ? 'MEDICAL' : 'BASIC';
  }

  private async safeRollback(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original database error.
    }
  }
}
