import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { maskPhoneNumbersInText } from '../utils/phone-mask.util';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      const responseTimeMs = Date.now() - startedAt;
      const path = maskPhoneNumbersInText(request.originalUrl ?? request.url);
      this.logger.log(`${request.method} ${path} ${response.statusCode} ${responseTimeMs}ms`);
    });

    next();
  }
}
