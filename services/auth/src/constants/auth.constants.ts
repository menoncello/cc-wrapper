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
