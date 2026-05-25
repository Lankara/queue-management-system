import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';

interface DatabaseErrorLike {
  code?: string;
  detail?: string;
  constraint?: string;
  message?: string;
}

export function isDatabaseError(error: unknown): error is DatabaseErrorLike {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function mapDatabaseError(error: unknown): Error {
  if (!isDatabaseError(error)) {
    return new InternalServerErrorException('Unexpected database error');
  }

  if (error.code === '23505') {
    return new ConflictException({
      message: 'Duplicate record violates a unique constraint',
      constraint: error.constraint,
      detail: error.detail
    });
  }

  if (error.code === '23503') {
    return new BadRequestException({
      message: 'Related record does not exist',
      constraint: error.constraint,
      detail: error.detail
    });
  }

  return new InternalServerErrorException('Database operation failed');
}