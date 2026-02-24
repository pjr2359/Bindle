// lib/config/env.ts
/**
 * Environment variables manager
 * 
 * Centralizes access to environment variables and provides
 * appropriate defaults and validation
 */

interface EnvConfig {
  // API keys
  AMADEUS_CLIENT_ID: string;
  AMADEUS_CLIENT_SECRET: string;
  HERE_API_KEY: string;

  // Database
  DATABASE_URL: string;

  // Feature flags
  ENABLE_REAL_APIS: boolean;
  DEBUG_MODE: boolean;

  // Rate limiting
  API_RATE_LIMIT_MAX: number;
  API_RATE_LIMIT_WINDOW: number;
}

// Default values for development
const defaults: EnvConfig = {
  AMADEUS_CLIENT_ID: '',
  AMADEUS_CLIENT_SECRET: '',
  HERE_API_KEY: '',
  DATABASE_URL: '',
  ENABLE_REAL_APIS: false,
  DEBUG_MODE: true,
  API_RATE_LIMIT_MAX: 5,
  API_RATE_LIMIT_WINDOW: 10000,
};

/**
 * Get environment variables with fallbacks
 */
export function getEnv(): EnvConfig {
  return {
    AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || defaults.AMADEUS_CLIENT_ID,
    AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || defaults.AMADEUS_CLIENT_SECRET,

    HERE_API_KEY: process.env.NEXT_PUBLIC_HERE_API_KEY ||
      process.env.HERE_API_KEY ||
      defaults.HERE_API_KEY,

    DATABASE_URL: process.env.DATABASE_URL || defaults.DATABASE_URL,

    ENABLE_REAL_APIS: process.env.ENABLE_REAL_APIS === 'true' || defaults.ENABLE_REAL_APIS,

    DEBUG_MODE: process.env.DEBUG_MODE !== 'false' && defaults.DEBUG_MODE,

    API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX || '') || defaults.API_RATE_LIMIT_MAX,

    API_RATE_LIMIT_WINDOW: parseInt(process.env.API_RATE_LIMIT_WINDOW || '') || defaults.API_RATE_LIMIT_WINDOW,
  };
}

/**
 * Check if required environment variables are set
 */
export function validateEnv(): { valid: boolean; missingVars: string[] } {
  const requiredVars = [
    'DATABASE_URL'
  ];

  // Also require API keys if real APIs are enabled
  const env = getEnv();
  if (env.ENABLE_REAL_APIS) {
    requiredVars.push('HERE_API_KEY');
  }

  const missingVars = requiredVars.filter(varName => !env[varName as keyof EnvConfig]);

  return {
    valid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Is this a development environment?
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Is this a production environment?
 */
export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Is this a test environment?
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}