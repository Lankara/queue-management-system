export interface ApiEnvironment {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  databaseSsl: boolean;
  corsOrigin: string | string[];
  apiJsonBodyLimit: string;
  publicRateLimitWindowMs: number;
  publicRateLimitMaxRequests: number;
  whatsappWebhookRateLimitMaxRequests: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  whatsappProvider: string;
  whatsappEnabled: boolean;
  whatsappDevMode: boolean;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappApiVersion: string;
  whatsappGraphBaseUrl: string;
  whatsappDefaultCountryCode: string;
  whatsappWebhookVerifyToken?: string;
  whatsappWebhookAppSecret?: string;
  whatsappInboundEnabled: boolean;
  whatsappInboundDevMode: boolean;
  whatsappDefaultBusinessSlug?: string;
}

function parsePort(value: string | undefined): number {
  const parsed = Number(value ?? '4000');

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return parsed;
}

function parsePositiveInteger(name: string, value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? String(fallback));

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'require'].includes(value.toLowerCase());
}

function parseCorsOrigin(nodeEnv: string, value: string | undefined): string | string[] {
  if (!value || value === '*') {
    if (nodeEnv === 'production') {
      throw new Error('CORS_ORIGIN must be set to explicit origins in production');
    }

    return 'http://localhost:3000';
  }

  if (value.includes(',')) {
    const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
    if (origins.length === 0) {
      throw new Error('CORS_ORIGIN must contain at least one origin');
    }
    return origins;
  }

  return value;
}

function resolveJwtSecret(nodeEnv: string, value: string | undefined): string {
  if (value) {
    return value;
  }

  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  console.warn('JWT_SECRET is missing. Using development fallback secret.');
  return 'development-only-change-me';
}

function resolveDatabaseUrl(value: string | undefined): string {
  if (!value) {
    throw new Error('DATABASE_URL is required');
  }

  return value;
}

function assertWhatsAppRealModeConfig(enabled: boolean, devMode: boolean, phoneNumberId?: string, accessToken?: string): void {
  if (!enabled || devMode) {
    return;
  }

  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required when WhatsApp real sending is enabled');
  }
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const whatsappEnabled = parseBoolean(process.env.WHATSAPP_ENABLED);
const whatsappDevMode = parseBoolean(process.env.WHATSAPP_DEV_MODE ?? 'true');
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

assertWhatsAppRealModeConfig(whatsappEnabled, whatsappDevMode, whatsappPhoneNumberId, whatsappAccessToken);

export const env: ApiEnvironment = {
  port: parsePort(process.env.PORT),
  nodeEnv,
  databaseUrl: resolveDatabaseUrl(process.env.DATABASE_URL),
  databaseSsl: parseBoolean(process.env.DATABASE_SSL),
  corsOrigin: parseCorsOrigin(nodeEnv, process.env.CORS_ORIGIN),
  apiJsonBodyLimit: process.env.API_JSON_BODY_LIMIT ?? '1mb',
  publicRateLimitWindowMs: parsePositiveInteger('PUBLIC_RATE_LIMIT_WINDOW_MS', process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 60000),
  publicRateLimitMaxRequests: parsePositiveInteger('PUBLIC_RATE_LIMIT_MAX_REQUESTS', process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS, 60),
  whatsappWebhookRateLimitMaxRequests: parsePositiveInteger('WHATSAPP_WEBHOOK_RATE_LIMIT_MAX_REQUESTS', process.env.WHATSAPP_WEBHOOK_RATE_LIMIT_MAX_REQUESTS, 120),
  jwtSecret: resolveJwtSecret(nodeEnv, process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  whatsappProvider: process.env.WHATSAPP_PROVIDER ?? 'whatsapp-cloud-api',
  whatsappEnabled,
  whatsappDevMode,
  whatsappPhoneNumberId,
  whatsappAccessToken,
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? 'v20.0',
  whatsappGraphBaseUrl: process.env.WHATSAPP_GRAPH_BASE_URL ?? 'https://graph.facebook.com',
  whatsappDefaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? '94',
  whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  whatsappWebhookAppSecret: process.env.WHATSAPP_WEBHOOK_APP_SECRET,
  whatsappInboundEnabled: parseBoolean(process.env.WHATSAPP_INBOUND_ENABLED),
  whatsappInboundDevMode: parseBoolean(process.env.WHATSAPP_INBOUND_DEV_MODE ?? 'true'),
  whatsappDefaultBusinessSlug: process.env.WHATSAPP_DEFAULT_BUSINESS_SLUG
};
