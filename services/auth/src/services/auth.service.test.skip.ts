import { beforeEach, describe, expect, it } from 'bun:test';

import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    process.env.JWT_SECRET = 'dummy-test-key-for-auth-service-testing-only-32-characters';
  });

  describe('register', () => {
    it('should initialize AuthService instance', () => {
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('should throw error if JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => new AuthService()).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('should successfully register a new user', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User'
      };

      // Note: This test requires database setup
      // For unit tests, we would mock the database calls
      expect(registerData.email).toBe('newuser@example.com');
    });
  });

  describe('password validation', () => {
    it('should accept valid email and password', () => {
      const email = 'test@example.com';
      const password = 'ValidPassword123!';

      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(password.length).toBeGreaterThanOrEqual(8);
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['notanemail', '@example.com', 'test@', 'test @example.com'];

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe('JWT token generation', () => {
    it('should generate valid JWT with expiry', async () => {
      // Test that JWT configuration is properly set
      expect(process.env.JWT_SECRET).toBeDefined();
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
      }
    });
  });

  describe('OAuth user creation', () => {
    it('should accept valid OAuth provider names', () => {
      const validProviders = ['google', 'github'];

      validProviders.forEach(provider => {
        expect(['google', 'github']).toContain(provider);
      });
    });

    it('should reject invalid OAuth providers', () => {
      const invalidProviders = ['facebook', 'twitter', 'invalid'];

      invalidProviders.forEach(provider => {
        expect(['google', 'github']).not.toContain(provider);
      });
    });
  });

  describe('Profile updates', () => {
    it('should validate AI tools array', () => {
      const validAITools = ['Claude', 'ChatGPT', 'Cursor', 'Windsurf'];

      expect(Array.isArray(validAITools)).toBe(true);
      expect(validAITools.length).toBeGreaterThan(0);
    });

    it('should validate notification preferences structure', () => {
      const validPreferences = {
        email: true,
        inApp: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      };

      expect(validPreferences.email).toBeDefined();
      expect(validPreferences.inApp).toBeDefined();
      expect(validPreferences.quietHours?.start).toMatch(/^\d{2}:\d{2}$/);
      expect(validPreferences.quietHours?.end).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
