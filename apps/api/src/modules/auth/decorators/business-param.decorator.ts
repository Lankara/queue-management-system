import { SetMetadata } from '@nestjs/common';

export const BUSINESS_PARAM_KEY = 'businessParam';

export const BusinessParam = (paramName = 'businessId') => SetMetadata(BUSINESS_PARAM_KEY, paramName);
