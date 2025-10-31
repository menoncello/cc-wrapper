/**
 * User Data Factory
 * Story 1.1 - Test data generation for authentication tests
 *
 * Pattern: Pure functions using @faker-js/faker with override support
 * Reference: bmad/bmm/testarch/knowledge/data-factories.md
 */

import { faker } from '@faker-js/faker';

import { generateTestPassword } from '../../test-utils/password-generator.js';

export type UserType = 'solo' | 'team' | 'enterprise';
export type OAuthProvider = 'google' | 'github' | null;

export interface User {
  id: string;
  email: string;
  password: string; // Plain text for test purposes
  password_hash?: string; // Hashed password (set by backend)
  oauth_provider: OAuthProvider;
  oauth_id: string | null;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  preferred_ai_tools: string[];
  notification_preferences: {
    email: boolean;
    inApp: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  default_workspace_id: string | null;
  onboarding_completed: boolean;
  tour_completed: boolean;
}

/**
 * Create a single user with optional overrides
 * Uses faker for random data generation to prevent collisions
 *
 * @param overrides - Partial user data to override defaults
 * @returns User object with random data
 *
 * @example
 * const user = createUser({ email: 'specific@example.com' });
 * const oauthUser = createUser({ oauth_provider: 'google' });
 */
export const createUser = (overrides: Partial<User> = {}): User => {
  const defaultUser: User = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: generateTestPassword('user'), // Default password for test users
    oauth_provider: null,
    oauth_id: null,
    user_type: faker.helpers.arrayElement(['solo', 'team', 'enterprise'] as UserType[]),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: faker.date.recent({ days: 7 }).toISOString()
  };

  return {
    ...defaultUser,
    ...overrides
  };
};

/**
 * Create OAuth user with provider and oauth_id
 *
 * @param provider - OAuth provider ('google' or 'github')
 * @param overrides - Additional user data overrides
 * @returns User with OAuth configuration
 *
 * @example
 * const googleUser = createOAuthUser('google');
 * const githubUser = createOAuthUser('github', { email: 'dev@github.com' });
 */
export const createOAuthUser = (
  provider: 'google' | 'github',
  overrides: Partial<User> = {}
): User => {
  return createUser({
    oauth_provider: provider,
    oauth_id: faker.string.alphanumeric(20),
    password: '', // OAuth users don't have passwords
    ...overrides
  });
};

/**
 * Create array of users
 *
 * @param count - Number of users to create
 * @param overrides - Shared overrides for all users
 * @returns Array of users
 *
 * @example
 * const users = createUsers(5);
 * const teamUsers = createUsers(3, { user_type: 'team' });
 */
export const createUsers = (count: number, overrides: Partial<User> = {}): User[] => {
  return Array.from({ length: count }, () => createUser(overrides));
};

/**
 * Create user profile with optional overrides
 *
 * @param userId - User ID to associate profile with
 * @param overrides - Partial profile data to override defaults
 * @returns UserProfile object
 *
 * @example
 * const profile = createUserProfile('user-123');
 * const completeProfile = createUserProfile('user-123', { onboarding_completed: true });
 */
export const createUserProfile = (
  userId: string,
  overrides: Partial<UserProfile> = {}
): UserProfile => {
  const defaultProfile: UserProfile = {
    user_id: userId,
    preferred_ai_tools: faker.helpers.arrayElements(
      ['claude', 'chatgpt', 'cursor', 'windsurf', 'github-copilot'],
      { min: 1, max: 3 }
    ),
    notification_preferences: {
      email: faker.datatype.boolean(),
      inApp: faker.datatype.boolean(),
      quietHours: {
        enabled: faker.datatype.boolean(),
        start: '22:00',
        end: '08:00'
      }
    },
    default_workspace_id: null,
    onboarding_completed: faker.datatype.boolean(),
    tour_completed: faker.datatype.boolean()
  };

  return {
    ...defaultProfile,
    ...overrides
  };
};

/**
 * Create user with profile in single call
 *
 * @param userOverrides - User data overrides
 * @param profileOverrides - Profile data overrides
 * @returns Object with user and profile
 *
 * @example
 * const { user, profile } = createUserWithProfile();
 * const complete = createUserWithProfile(
 *   { email: 'test@example.com' },
 *   { onboarding_completed: true }
 * );
 */
export const createUserWithProfile = (
  userOverrides: Partial<User> = {},
  profileOverrides: Partial<UserProfile> = {}
): { user: User; profile: UserProfile } => {
  const user = createUser(userOverrides);
  const profile = createUserProfile(user.id, profileOverrides);

  return { user, profile };
};

/**
 * Create registration data (for form submission)
 *
 * @param overrides - Data to override
 * @returns Registration form data
 *
 * @example
 * const regData = createRegistrationData();
 * const customReg = createRegistrationData({ email: 'custom@example.com' });
 */
export const createRegistrationData = (
  overrides: Partial<{
    email: string;
    password: string;
    confirmPassword: string;
  }> = {}
) => {
  const password = overrides.password || generateTestPassword('registration');

  return {
    email: overrides.email || faker.internet.email(),
    password,
    confirmPassword: overrides.confirmPassword || password
  };
};

/**
 * Create login credentials
 *
 * @param overrides - Credentials to override
 * @returns Login form data
 *
 * @example
 * const creds = createLoginCredentials();
 * const specificCreds = createLoginCredentials({ email: 'user@example.com' });
 */
export const createLoginCredentials = (
  overrides: Partial<{
    email: string;
    password: string;
  }> = {}
) => {
  return {
    email: overrides.email || faker.internet.email(),
    password: overrides.password || generateTestPassword('login')
  };
};
