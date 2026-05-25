import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService, HealthResponse } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';
import { DatabaseService } from './database/database.service';

interface DatabaseHealthResponse {
  status: 'ok';
  database: 'connected';
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService
  ) {}

  @Public()
  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health/db')
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    const connected = await this.databaseService.checkConnection();

    if (!connected) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected'
      });
    }

    return {
      status: 'ok',
      database: 'connected'
    };
  }
}