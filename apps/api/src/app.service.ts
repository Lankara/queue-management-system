import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: 'queue-management-api';
}

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'queue-management-api'
    };
  }
}
