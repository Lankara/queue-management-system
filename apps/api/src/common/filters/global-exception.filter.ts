import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { env } from '../../config/env';
import { errorResponse } from '../responses/api-response';

interface HttpExceptionResponseBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.getMessage(exception, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        message,
        env.nodeEnv === 'production' ? undefined : exception instanceof Error ? exception.stack : String(exception)
      );
    }

    response.status(statusCode).json(errorResponse(statusCode, message, request.originalUrl ?? request.url));
  }

  private getMessage(exception: unknown, statusCode: number): string | string[] {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return exceptionResponse;
      }

      const body = exceptionResponse as HttpExceptionResponseBody;
      return body.message ?? body.error ?? exception.message;
    }

    if (env.nodeEnv === 'production') {
      return 'Internal server error';
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Unexpected error';
  }
}