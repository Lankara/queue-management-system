import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BanResetDto } from './dto/ban-reset.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerPreferredLanguage } from './interfaces/customer.interface';

export interface CustomerNotificationContext {
  businessName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  language: CustomerPreferredLanguage;
}

interface CustomerRow {
  id: string;
  business_id: string;
  primary_phone: string;
  preferred_language: CustomerPreferredLanguage;
  is_online_booking_banned: boolean;
  no_show_count: number;
  ban_reason: string | null;
  banned_at: Date | null;
  ban_reset_at: Date | null;
  ban_reset_by: string | null;
  created_at: Date;
  updated_at: Date | null;
}

const CUSTOMER_COLUMNS = `id, business_id, primary_phone, preferred_language, is_online_booking_banned, no_show_count, ban_reason, banned_at, ban_reset_at, ban_reset_by, created_at, updated_at`;

@Injectable()
export class CustomersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(businessId: string, data: CreateCustomerDto): Promise<Customer> {
    const result = await this.databaseService.query<CustomerRow>(
      `INSERT INTO customers (business_id, primary_phone, preferred_language)
       VALUES ($1, $2, $3)
       RETURNING ${CUSTOMER_COLUMNS}`,
      [businessId, data.primaryPhone, data.preferredLanguage ?? 'en']
    );
    return this.mapRow(result.rows[0]) as Customer;
  }

  async findAllByBusinessId(businessId: string): Promise<Customer[]> {
    const result = await this.databaseService.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId]
    );
    return result.rows.map((row) => this.mapRow(row) as Customer);
  }

  async findById(businessId: string, id: string): Promise<Customer | null> {
    const result = await this.databaseService.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE business_id = $1 AND id = $2 LIMIT 1`,
      [businessId, id]
    );
    return this.mapRow(result.rows[0]);
  }

  async findByPhone(businessId: string, phone: string): Promise<Customer | null> {
    const result = await this.databaseService.query<CustomerRow>(
      `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE business_id = $1 AND primary_phone = $2 LIMIT 1`,
      [businessId, phone]
    );
    return this.mapRow(result.rows[0]);
  }

  async update(businessId: string, id: string, data: UpdateCustomerDto): Promise<Customer | null> {
    const fieldMap: Record<string, string> = {
      preferredLanguage: 'preferred_language',
      isOnlineBookingBanned: 'is_online_booking_banned',
      banReason: 'ban_reason'
    };
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return this.findById(businessId, id);
    }

    const setClauses = entries.map(([key], index) => `${fieldMap[key]} = $${index + 3}`);
    const values = entries.map(([, value]) => value);
    const result = await this.databaseService.query<CustomerRow>(
      `UPDATE customers
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${CUSTOMER_COLUMNS}`,
      [businessId, id, ...values]
    );
    return this.mapRow(result.rows[0]);
  }

  async resetBan(businessId: string, id: string, data: BanResetDto): Promise<Customer | null> {
    const result = await this.databaseService.query<CustomerRow>(
      `UPDATE customers
       SET is_online_booking_banned = false,
           no_show_count = 0,
           ban_reason = NULL,
           ban_reset_at = now(),
           ban_reset_by = $3,
           updated_at = now()
       WHERE business_id = $1 AND id = $2
       RETURNING ${CUSTOMER_COLUMNS}`,
      [businessId, id, data.resetBy ?? null]
    );
    return this.mapRow(result.rows[0]);
  }


  async getNotificationContext(businessId: string, customerId: string): Promise<CustomerNotificationContext | null> {
    const result = await this.databaseService.query<{
      business_name: string;
      customer_id: string;
      customer_name: string | null;
      customer_phone: string;
      language: CustomerPreferredLanguage;
    }>(
      `SELECT b.name AS business_name,
              c.id AS customer_id,
              cp.full_name AS customer_name,
              c.primary_phone AS customer_phone,
              c.preferred_language AS language
       FROM customers c
       JOIN businesses b ON b.id = c.business_id
       LEFT JOIN LATERAL (
         SELECT full_name
         FROM client_profiles
         WHERE business_id = c.business_id AND customer_id = c.id
         ORDER BY created_at ASC
         LIMIT 1
       ) cp ON true
       WHERE c.business_id = $1 AND c.id = $2
       LIMIT 1`,
      [businessId, customerId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      businessName: row.business_name,
      customerId: row.customer_id,
      customerName: row.customer_name ?? 'Customer',
      customerPhone: row.customer_phone,
      language: row.language
    };
  }

  private mapRow(row?: CustomerRow): Customer | null {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      businessId: row.business_id,
      primaryPhone: row.primary_phone,
      preferredLanguage: row.preferred_language,
      isOnlineBookingBanned: row.is_online_booking_banned,
      noShowCount: row.no_show_count,
      banReason: row.ban_reason,
      bannedAt: row.banned_at,
      banResetAt: row.ban_reset_at,
      banResetBy: row.ban_reset_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}