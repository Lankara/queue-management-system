import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { errorResponse } from '../responses/api-response';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, RateLimitBucket>();

  use(request: Request, response: Response, next: NextFunction): void {
    const path = request.originalUrl ?? request.url;
    const limit = this.getLimit(path);

    if (!limit) {
      next();
      return;
    }

    const now = Date.now();
    const key = `${this.getClientIp(request)}:${request.method}:${this.getRateLimitPath(path)}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + env.publicRateLimitWindowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > limit) {
      response
        .status(429)
        .json(errorResponse(429, 'Too many requests. Please try again shortly.', path));
      return;
    }

    next();
  }

  private getLimit(path: string): number | null {
    if (path.startsWith('/api/whatsapp/webhook')) {
      return env.whatsappWebhookRateLimitMaxRequests;
    }

    if (path.startsWith('/api/public/')) {
      return env.publicRateLimitMaxRequests;
    }

    return null;
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    }

    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }

  private getRateLimitPath(path: string): string {
    return path.split('?')[0] ?? path;
  }
}
