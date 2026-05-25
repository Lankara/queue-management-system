import { Matches, ValidationOptions } from 'class-validator';

export const POSTGRES_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function IsPostgresUuid(propertyName: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return Matches(POSTGRES_UUID_PATTERN, {
    message: `${propertyName} must be a UUID`,
    ...validationOptions
  });
}
