import type { AuthResponse, User } from '@cc-wrapper/shared-types';

import { REFRESH_TOKEN_SIZE } from '../../constants/auth.constants.js';
import { generateJWT, generateRandomToken } from '../../lib/crypto.js';
import type { JWTPayload } from '../../types/jwt.js';
import { UserDatabaseOperations } from '../database/user-operations.js';
import { AuthValidation } from '../validation/auth-validation.js';

/**
 * Interface for user with profile from database (re-exported for convenience)
 */
interface UserWithProfile {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  userType?: string | null;
  oauthProvider?: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    id: string;
    userId: string;
    onboardingCompleted: boolean;
    tourCompleted: boolean;
    preferredAITools?: string[] | null;
    notificationPreferences?: unknown;
    defaultWorkspaceId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * User utilities and helper functions
 * Contains user transformation and token management logic
 */
export class UserUtils {
  /**
   * Create authentication response with tokens
   * @param {UserWithProfile} user - User object with profile
   * @param {string} jwtSecret - JWT secret for token generation
   * @param {string} jwtExpiry - JWT expiry time
   * @returns {Promise<AuthResponse>} Authentication response containing user data and tokens
   */
  public static async createAuthResponse(
    user: UserWithProfile,
    jwtSecret: string,
    jwtExpiry: string
  ): Promise<AuthResponse> {
    const { token, refreshToken } = await this.generateTokens(user, jwtSecret, jwtExpiry);

    await this.createUserSession(user.id, token, refreshToken, jwtExpiry);

    const sanitizedUser = this.sanitizeUser(user);
    return this.buildAuthResponse(sanitizedUser, token, refreshToken);
  }

  /**
   * Build authentication response object
   * @param {User} user - Sanitized user object
   * @param {string} token - JWT access token
   * @param {string} refreshToken - Refresh token
   * @returns {AuthResponse} Authentication response containing user data and tokens
   */
  private static buildAuthResponse(user: User, token: string, refreshToken: string): AuthResponse {
    return {
      user,
      token,
      refreshToken
    };
  }

  /**
   * Generate access and refresh tokens for user
   * @param {object} user - User object containing essential token information
   * @param {string} user.id - Unique user identifier
   * @param {string} user.email - User email address
   * @param {string} user.role - User role for authorization
   * @param {string} jwtSecret - JWT secret for signing
   * @param {string} jwtExpiry - JWT expiry time
   * @returns {Promise<{token: string, refreshToken: string}>} Generated tokens
   */
  private static async generateTokens(
    user: { id: string; email: string; role: string },
    jwtSecret: string,
    jwtExpiry: string
  ): Promise<{ token: string; refreshToken: string }> {
    const token = await this.generateAccessToken(user, jwtSecret, jwtExpiry);
    const refreshToken = generateRandomToken(REFRESH_TOKEN_SIZE);

    return { token, refreshToken };
  }

  /**
   * Create user session in database
   * @param {string} userId - User unique identifier
   * @param {string} token - JWT access token
   * @param {string} refreshToken - Refresh token
   * @param {string} jwtExpiry - JWT expiry time
   * @returns {Promise<void>}
   */
  private static async createUserSession(
    userId: string,
    token: string,
    refreshToken: string,
    jwtExpiry: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + AuthValidation.parseExpiry(jwtExpiry));
    await UserDatabaseOperations.createSession(userId, token, refreshToken, expiresAt.getTime());
  }

  /**
   * Generate access token (JWT)
   * @param {object} user - User object containing essential token information
   * @param {string} user.id - Unique user identifier
   * @param {string} user.email - User email address
   * @param {string} user.role - User role for authorization
   * @param {string} jwtSecret - JWT secret for signing
   * @param {string} jwtExpiry - JWT expiry time
   * @returns {Promise<string>} JWT access token
   */
  public static async generateAccessToken(
    user: { id: string; email: string; role: string },
    jwtSecret: string,
    jwtExpiry: string
  ): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as JWTPayload['role']
    };

    return generateJWT(payload, jwtSecret, jwtExpiry);
  }

  /**
   * Sanitize user object (remove sensitive data)
   * @param {object} user - Raw user object from database
   * @param {string} user.id - User unique identifier
   * @param {string} user.email - User email address
   * @param {string | null} [user.name] - User display name
   * @param {string} user.role - User role
   * @param {string | null} [user.userType] - User type
   * @param {string | null} [user.oauthProvider] - OAuth provider
   * @param {Date} user.createdAt - Account creation date
   * @param {Date} user.updatedAt - Last update date
   * @returns {User} Sanitized user object with sensitive fields removed
   */
  public static sanitizeUser(user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    userType?: string | null;
    oauthProvider?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role as User['role'],
      userType: user.userType as User['userType'],
      oauthProvider: user.oauthProvider as User['oauthProvider'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
