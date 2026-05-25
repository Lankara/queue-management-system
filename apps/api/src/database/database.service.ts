import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined
    });
  }

  async onModuleInit(): Promise<void> {
    const connected = await this.checkConnection();

    if (connected) {
      this.logger.log('PostgreSQL connection established');
      return;
    }

    this.logger.error('PostgreSQL connection failed. Check DATABASE_URL and DATABASE_SSL.');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed');
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  getPool(): Pool {
    return this.pool;
  }

  async checkConnection(): Promise<boolean> {
    if (!env.databaseUrl) {
      return false;
    }

    try {
      await this.query('SELECT NOW()');
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}