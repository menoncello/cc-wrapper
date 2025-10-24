import { describe, expect, it } from 'bun:test';

import { loginSchema, onboardingDataSchema, profileUpdateSchema, registerSchema } from './auth.js';

describe('Authentication schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User'
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'notanemail',
        password: 'ValidPass123'
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = ['short', 'nouppercase123', 'NOLOWERCASE123', 'NoNumbers'];

      invalidPasswords.forEach(password => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password
        });

        expect(result.success).toBe(false);
      });
    });

    it('should trim and lowercase email', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'ValidPass123'
      };

      const result = registerSchema.safeParse(data);

      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword'
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('profileUpdateSchema', () => {
    it('should accept valid profile update data', () => {
      const validData = {
        preferredAITools: ['Claude', 'ChatGPT'],
        notificationPreferences: {
          email: true,
          inApp: false,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        },
        defaultWorkspaceId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = profileUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept partial updates', () => {
      const partialData = {
        preferredAITools: ['Claude']
      };

      const result = profileUpdateSchema.safeParse(partialData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid workspace ID format', () => {
      const invalidData = {
        defaultWorkspaceId: 'not-a-uuid'
      };

      const result = profileUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid quiet hours time format', () => {
      const invalidData = {
        notificationPreferences: {
          email: true,
          inApp: true,
          quietHours: {
            enabled: true,
            start: '25:00', // Invalid hour
            end: '08:00'
          }
        }
      };

      const result = profileUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('onboardingDataSchema', () => {
    it('should accept valid onboarding data', () => {
      const validData = {
        userType: 'solo',
        preferredAITools: ['Claude', 'ChatGPT'],
        workspaceName: 'My Workspace',
        workspaceDescription: 'My first workspace',
        workspaceTemplate: 'React'
      };

      const result = onboardingDataSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid user type', () => {
      const invalidData = {
        userType: 'invalid',
        preferredAITools: ['Claude'],
        workspaceName: 'Test'
      };

      const result = onboardingDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should allow empty AI tools array for skip onboarding', () => {
      const validData = {
        userType: 'solo',
        preferredAITools: [],
        workspaceName: 'Test'
      };

      const result = onboardingDataSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject workspace name exceeding max length', () => {
      const invalidData = {
        userType: 'solo',
        preferredAITools: ['Claude'],
        workspaceName: 'A'.repeat(101)
      };

      const result = onboardingDataSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept valid workspace templates', () => {
      const validTemplates = ['React', 'Node.js', 'Python', 'Custom'];

      validTemplates.forEach(template => {
        const data = {
          userType: 'solo',
          preferredAITools: ['Claude'],
          workspaceName: 'Test',
          workspaceTemplate: template
        };

        const result = onboardingDataSchema.safeParse(data);

        expect(result.success).toBe(true);
      });
    });
  });
});
