import type {
  AuthResponse,
  ProfileUpdateRequest,
  RegisterRequest,
  User,
  UserProfile
} from '@cc-wrapper/shared-types';

import { hashPassword } from '../lib/crypto.js';
import { UserDatabaseOperations } from './database/user-operations.js';
import { UserUtils } from './utils/user-utils.js';
import { AuthValidation } from './validation/auth-validation.js';

/**
 * Authentication service for CC Wrapper
 * Handles user registration, login, token management, and profile operations
 */
export class AuthService {
  private jwtSecret: string;
  private jwtExpiry: string;

  /**
   * Initialize the authentication service
   * Validates JWT secret configuration and sets up token expiry settings
   * @throws {Error} When JWT_SECRET environment variable is missing or too short
   */
  public constructor() {
    this.jwtSecret = AuthValidation.validateJwtSecret();
    this.jwtExpiry = AuthValidation.getJwtExpiry();
  }

  /**
   * Register a new user with email and password
   * @param {RegisterRequest} data - User registration data including email, password, and optional name
   * @returns {Promise<AuthResponse>} Authentication response containing user data and tokens
   * @throws {Error} When email is already registered
   */
  public async register(data: RegisterRequest): Promise<AuthResponse> {
    await AuthValidation.validateUniqueEmail(data.email);

    const passwordHash = await hashPassword(data.password);
    const user = await UserDatabaseOperations.createUserWithProfile(
      data.email,
      passwordHash,
      data.name
    );

    return UserUtils.createAuthResponse(user, this.jwtSecret, this.jwtExpiry);
  }

  /**
   * Login user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<AuthResponse>} Authentication response containing user data and tokens
   * @throws {Error} When email or password is invalid
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    const user = await UserDatabaseOperations.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    await AuthValidation.validateUserCredentials(user, password);

    return UserUtils.createAuthResponse(user, this.jwtSecret, this.jwtExpiry);
  }

  /**
   * Logout user by invalidating session
   * @param {string} token - JWT access token to invalidate
   */
  public async logout(token: string): Promise<void> {
    await UserDatabaseOperations.deleteSession(token);
  }

  /**
   * Get user by ID
   * @param {string} userId - Unique user identifier
   * @returns {Promise<User | null>} User object or null if not found
   */
  public async getUserById(userId: string): Promise<User | null> {
    const user = await UserDatabaseOperations.getUserById(userId);

    return user ? UserUtils.sanitizeUser(user) : null;
  }

  /**
   * Update user profile
   * @param {string} userId - Unique user identifier
   * @param {ProfileUpdateRequest} data - Profile update data
   * @returns {Promise<UserProfile>} Updated user profile
   */
  public async updateProfile(userId: string, data: ProfileUpdateRequest): Promise<UserProfile> {
    return UserDatabaseOperations.updateUserProfile(userId, {
      preferredAITools: data.preferredAITools,
      notificationPreferences: data.notificationPreferences,
      defaultWorkspaceId: data.defaultWorkspaceId
    });
  }

  /**
   * Create OAuth user account
   * @param {string} email - User email address
   * @param {string} oauthProvider - OAuth provider name (e.g., 'google', 'github')
   * @param {string} oauthId - Provider-specific user identifier
   * @param {string} [name] - Optional display name
   * @returns {Promise<AuthResponse>} Authentication response containing user data and tokens
   */
  public async createOAuthUser(
    email: string,
    oauthProvider: string,
    oauthId: string,
    name?: string
  ): Promise<AuthResponse> {
    const existingUser = await UserDatabaseOperations.findOAuthUser(email, oauthProvider, oauthId);

    if (existingUser) {
      return UserUtils.createAuthResponse(existingUser, this.jwtSecret, this.jwtExpiry);
    }

    const newUser = await UserDatabaseOperations.createOAuthUserRecord(
      email,
      oauthProvider,
      oauthId,
      name
    );

    return UserUtils.createAuthResponse(newUser, this.jwtSecret, this.jwtExpiry);
  }
}
