import type { UserProfile } from '@cc-wrapper/shared-types';

import { prisma } from '../../lib/prisma.js';
import { createSafePrisma } from '../../lib/prisma-helpers.js';

const safePrisma = createSafePrisma(prisma);

/**
 * Interface for user with profile from database
 */
interface UserWithProfile {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  userType?: string | null;
  oauthProvider?: string | null;
  oauthId?: string | null;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    id: string;
    userId: string;
    preferredAITools?: string[] | null;
    notificationPreferences?: unknown;
    defaultWorkspaceId?: string | null;
    onboardingCompleted: boolean;
    tourCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Interface for user with profile and password from database
 */
interface UserWithProfileAndPassword extends UserWithProfile {
  passwordHash: string;
}

/**
 * Database operations for user management
 * Contains all Prisma database operations to separate concerns
 */
export class UserDatabaseOperations {
  /**
   * Create user with associated profile
   * @param {string} email - User email address
   * @param {string} passwordHash - Hashed password
   * @param {string} [name] - Optional display name
   * @returns {Promise<UserWithProfile>} Created user with profile included
   */
  public static async createUserWithProfile(
    email: string,
    passwordHash: string,
    name?: string
  ): Promise<UserWithProfile> {
    const result = await safePrisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'DEVELOPER',
        profile: {
          create: {
            onboardingCompleted: false,
            tourCompleted: false
          }
        }
      },
      include: {
        profile: true
      }
    });

    if (!result.profile) {
      throw new Error('Failed to create user profile');
    }

    return result as UserWithProfile;
  }

  /**
   * Create new OAuth user record
   * @param {string} email - User email address
   * @param {string} oauthProvider - OAuth provider name
   * @param {string} oauthId - Provider-specific user identifier
   * @param {string} [name] - Optional display name
   * @returns {Promise<UserWithProfile>} Created user with profile
   */
  public static async createOAuthUserRecord(
    email: string,
    oauthProvider: string,
    oauthId: string,
    name?: string
  ): Promise<UserWithProfile> {
    const result = await safePrisma.user.create({
      data: {
        email,
        oauthProvider,
        oauthId,
        name,
        role: 'DEVELOPER',
        profile: {
          create: {
            onboardingCompleted: false,
            tourCompleted: false
          }
        }
      },
      include: {
        profile: true
      }
    });

    if (!result.profile) {
      throw new Error('Failed to create user profile');
    }

    return result as UserWithProfile;
  }

  /**
   * Find user by email with profile included
   * @param {string} email - User email address
   * @returns {Promise<UserWithProfileAndPassword | null>} User object with profile or null if not found
   */
  public static async findUserByEmail(email: string): Promise<UserWithProfileAndPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    return user as unknown as UserWithProfileAndPassword;
  }

  /**
   * Find existing OAuth user by provider credentials
   * @param {string} email - User email address
   * @param {string} oauthProvider - OAuth provider name
   * @param {string} oauthId - Provider-specific user identifier
   * @returns {Promise<UserWithProfile | null>} Existing user or null if not found
   */
  public static async findOAuthUser(
    email: string,
    oauthProvider: string,
    oauthId: string
  ): Promise<UserWithProfile | null> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        oauthProvider,
        oauthId
      },
      include: {
        profile: true
      }
    });

    if (!user) {
      return null;
    }

    return user as unknown as UserWithProfile;
  }

  /**
   * Get user by ID
   * @param {string} userId - Unique user identifier
   * @returns {Promise<UserWithProfile | null>} User object or null if not found
   */
  public static async getUserById(userId: string): Promise<UserWithProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      return null;
    }

    return user as unknown as UserWithProfile;
  }

  /**
   * Update user profile
   * @param {string} userId - Unique user identifier
   * @param {object} data - Profile update data
   * @param {string[]} [data.preferredAITools] - Preferred AI tools
   * @param {unknown} [data.notificationPreferences] - Notification preferences
   * @param {string} [data.defaultWorkspaceId] - Default workspace ID
   * @returns {Promise<UserProfile>} Updated user profile
   */
  public static async updateUserProfile(
    userId: string,
    data: {
      preferredAITools?: string[];
      notificationPreferences?: unknown;
      defaultWorkspaceId?: string;
    }
  ): Promise<UserProfile> {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        preferredAITools: data.preferredAITools as any,
        notificationPreferences: data.notificationPreferences as any,
        defaultWorkspaceId: data.defaultWorkspaceId || undefined
      }
    });

    return {
      ...profile,
      preferredAITools: profile.preferredAITools as string[] | undefined,
      notificationPreferences: profile.notificationPreferences as unknown as
        | import('@cc-wrapper/shared-types').NotificationPreferences
        | undefined,
      defaultWorkspaceId: profile.defaultWorkspaceId || undefined
    };
  }

  /**
   * Create a new session for a user
   * @param {string} userId - Unique user identifier
   * @param {string} token - JWT access token
   * @param {string} refreshToken - Refresh token for token renewal
   * @param {number} expiresAt - Session expiration timestamp
   * @returns {Promise<void>}
   */
  public static async createSession(
    userId: string,
    token: string,
    refreshToken: string,
    expiresAt: number
  ): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt: new Date(expiresAt)
      }
    });
  }

  /**
   * Delete session by token
   * @param {string} token - JWT access token to invalidate
   * @returns {Promise<void>}
   */
  public static async deleteSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token }
    });
  }
}
