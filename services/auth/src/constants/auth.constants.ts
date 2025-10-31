/**
 * Authentication and security constants
 */

/**
 * Minimum required length for JWT secret (in characters)
 * Using 32 characters ensures strong cryptographic security
 */
export const JWT_SECRET_MIN_LENGTH = 32;

/**
 * Size of refresh tokens (in bytes)
 * 64 bytes = 128 hex characters
 */
export const REFRESH_TOKEN_SIZE = 64;

/**
 * Size of OAuth state tokens for CSRF protection (in bytes)
 * 32 bytes = 64 hex characters
 */
export const OAUTH_STATE_TOKEN_SIZE = 32;

/**
 * Default JWT token expiry time
 * Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
 */
export const DEFAULT_JWT_EXPIRY = '15m';

/**
 * OAuth state cookie maximum age (in seconds)
 * 600 seconds = 10 minutes
 */
export const OAUTH_STATE_COOKIE_MAX_AGE = 600;

/**
 * Basic numeric constants
 */
export const NUMBERS = {
  /** Base 1000 for time calculations */
  THOUSAND: 1000,
  /** Minutes in an hour */
  MINUTES_PER_HOUR: 60,
  /** Hours in a day */
  HOURS_PER_DAY: 24
} as const;

/**
 * Time conversion constants for parsing expiry strings
 */
export const TIME_MULTIPLIERS = {
  /** Milliseconds in one second */
  s: NUMBERS.THOUSAND,
  /** Milliseconds in one minute */
  m: NUMBERS.MINUTES_PER_HOUR * NUMBERS.THOUSAND,
  /** Milliseconds in one hour */
  h: NUMBERS.MINUTES_PER_HOUR * NUMBERS.MINUTES_PER_HOUR * NUMBERS.THOUSAND,
  /** Milliseconds in one day */
  d: NUMBERS.HOURS_PER_DAY * NUMBERS.MINUTES_PER_HOUR * NUMBERS.MINUTES_PER_HOUR * NUMBERS.THOUSAND
} as const;

/**
 * Validation constants for user input fields
 */
export const VALIDATION_CONSTANTS = {
  /** Minimum email length for validation */
  MIN_EMAIL_LENGTH: 5,
  /** Maximum email length for validation */
  MAX_EMAIL_LENGTH: 255,
  /** Minimum password length for validation */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length for validation */
  MAX_PASSWORD_LENGTH: 128,
  /** Minimum name length for validation */
  MIN_NAME_LENGTH: 1,
  /** Maximum name length for validation */
  MAX_NAME_LENGTH: 100,
  /** Maximum workspace name length for validation */
  MAX_WORKSPACE_NAME_LENGTH: 100,
  /** Maximum workspace description length for validation */
  MAX_WORKSPACE_DESCRIPTION_LENGTH: 500,
  /** Maximum profile description length for validation */
  MAX_PROFILE_DESCRIPTION_LENGTH: 500,
  /** Length of "Bearer " prefix for authorization headers */
  BEARER_PREFIX_LENGTH: 7,
  /** Default token size for OAuth refresh tokens */
  DEFAULT_TOKEN_SIZE: 64,
  /** Basic numeric constants */
  NUMBERS,
  /** Time conversion constants for parsing expiry strings */
  TIME_MULTIPLIERS
} as const;
