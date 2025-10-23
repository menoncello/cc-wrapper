import type {
  AuthResponse,
  NotificationPreferences,
  ProfileUpdateRequest,
  RegisterRequest,
  User,
  UserProfile
} from '@cc-wrapper/shared-types';

import {
  DEFAULT_JWT_EXPIRY,
  JWT_SECRET_MIN_LENGTH,
  REFRESH_TOKEN_SIZE
} from '../constants/auth.constants.js';
import { generateJWT, generateRandomToken, hashPassword, verifyPassword } from '../lib/crypto.js';
import prisma from '../lib/prisma.js';
import type { JWTPayload } from '../types/jwt.js';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiry: string;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
      throw new Error(`JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`);
    }

    this.jwtSecret = jwtSecret;
    this.jwtExpiry = process.env.JWT_EXPIRY || DEFAULT_JWT_EXPIRY;
  }

  /**
   * Register a new user with email and password
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password using Bun's Argon2id
    const passwordHash = await hashPassword(data.password);

    // Create user and profile in a transaction
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
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

    // Generate JWT token
    const token = await this.generateAccessToken(user);
    const refreshToken = generateRandomToken(REFRESH_TOKEN_SIZE);

    // Create session
    await this.createSession(user.id, token, refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password using Bun's Argon2id
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = await this.generateAccessToken(user);
    const refreshToken = generateRandomToken(REFRESH_TOKEN_SIZE);

    // Create session
    await this.createSession(user.id, token, refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  /**
   * Logout user by invalidating session
   */
  async logout(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token }
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: ProfileUpdateRequest): Promise<UserProfile> {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        preferredAITools: data.preferredAITools,
        notificationPreferences: data.notificationPreferences as never,
        defaultWorkspaceId: data.defaultWorkspaceId
      }
    });

    return {
      ...profile,
      preferredAITools: profile.preferredAITools as string[],
      notificationPreferences: profile.notificationPreferences as unknown as
        | NotificationPreferences
        | undefined
    } as UserProfile;
  }

  /**
   * Create OAuth user account
   */
  async createOAuthUser(
    email: string,
    oauthProvider: string,
    oauthId: string,
    name?: string
  ): Promise<AuthResponse> {
    // Check if user exists with this OAuth provider
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        oauthProvider,
        oauthId
      },
      include: {
        profile: true
      }
    });

    if (existingUser) {
      // User exists, generate token
      const token = await this.generateAccessToken(existingUser);
      const refreshToken = generateRandomToken(64);

      await this.createSession(existingUser.id, token, refreshToken);

      return {
        user: this.sanitizeUser(existingUser),
        token,
        refreshToken
      };
    }

    // Create new OAuth user
    const user = await prisma.user.create({
      data: {
        email,
        oauthProvider,
        oauthId,
        name,
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

    // Generate token
    const token = await this.generateAccessToken(user);
    const refreshToken = generateRandomToken(64);

    await this.createSession(user.id, token, refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  /**
   * Create a new session for a user
   */
  private async createSession(userId: string, token: string, refreshToken: string): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + this.parseExpiry(this.jwtExpiry))
      }
    });
  }

  /**
   * Generate access token (JWT)
   */
  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as JWTPayload['role']
    };

    return await generateJWT(payload, this.jwtSecret, this.jwtExpiry);
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private sanitizeUser(user: unknown): User {
    const u = user as {
      id: string;
      email: string;
      name: string | null;
      role: string;
      userType: string | null;
      oauthProvider: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      id: u.id,
      email: u.email,
      name: u.name || undefined,
      role: u.role as User['role'],
      userType: u.userType as User['userType'],
      oauthProvider: u.oauthProvider as User['oauthProvider'],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    const multiplier = multipliers[unit];
    if (multiplier === undefined) {
      throw new Error(`Invalid time unit: ${unit}`);
    }

    return value * multiplier;
  }
}
