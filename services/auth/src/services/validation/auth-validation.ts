import {
  DEFAULT_JWT_EXPIRY,
  JWT_SECRET_MIN_LENGTH,
  VALIDATION_CONSTANTS
} from '../../constants/auth.constants.js';
import { verifyPassword } from '../../lib/crypto.js';
import { UserDatabaseOperations } from '../database/user-operations.js';

/**
 * Interface for user with password hash
 */
interface UserWithPasswordHash {
  passwordHash?: string | null;
}

/**
 * Authentication validation utilities
 * Contains validation logic to separate concerns
 */
export class AuthValidation {
  /**
   * Validate JWT secret configuration
   * @returns {string} Validated JWT secret
   * @throws {Error} When JWT_SECRET environment variable is missing or too short
   */
  public static validateJwtSecret(): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
      throw new Error(`JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`);
    }

    return jwtSecret;
  }

  /**
   * Get JWT expiry with fallback to default
   * @returns {string} JWT expiry string
   */
  public static getJwtExpiry(): string {
    return process.env.JWT_EXPIRY || DEFAULT_JWT_EXPIRY;
  }

  /**
   * Validate that email is not already registered
   * @param {string} email - Email address to validate
   * @throws {Error} When email is already registered
   */
  public static async validateUniqueEmail(email: string): Promise<void> {
    const existingUser = await UserDatabaseOperations.findUserByEmail(email);

    if (existingUser) {
      throw new Error('Email already registered');
    }
  }

  /**
   * Validate user password credentials
   * @param {UserWithPasswordHash} user - User object with password hash
   * @param {string} password - Plain text password to validate
   * @throws {Error} When password is invalid or user has no password
   */
  public static async validateUserCredentials(
    user: UserWithPasswordHash,
    password: string
  ): Promise<void> {
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
  }

  /**
   * Parse expiry string to milliseconds
   * @param {string} expiry - Expiry string in format "number + unit" (e.g., "15m", "1h", "7d")
   * @returns {number} Expiry time in milliseconds
   * @throws {Error} When expiry format is invalid
   */
  public static parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2] as keyof typeof VALIDATION_CONSTANTS.TIME_MULTIPLIERS;

    const multiplier = VALIDATION_CONSTANTS.TIME_MULTIPLIERS[unit];
    if (multiplier === undefined) {
      throw new Error(`Invalid time unit: ${unit}`);
    }

    return value * multiplier;
  }
}
