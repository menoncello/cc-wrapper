import { z } from 'zod';

// Email validation with proper RFC 5322 compliance
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Name validation
const nameSchema = z
  .string()
  .min(1, 'Name must be at least 1 character')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .optional();

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Time validation helper
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Profile update schema
export const profileUpdateSchema = z.object({
  preferredAITools: z.array(z.string()).optional(),
  notificationPreferences: z
    .object({
      email: z.boolean(),
      inApp: z.boolean(),
      quietHours: z
        .object({
          enabled: z.boolean(),
          start: z.string().regex(timeRegex, 'Invalid time format (HH:mm, 00-23:00-59)'),
          end: z.string().regex(timeRegex, 'Invalid time format (HH:mm, 00-23:00-59)')
        })
        .optional()
    })
    .optional(),
  defaultWorkspaceId: z.string().uuid().optional()
});

// Onboarding data schema
export const onboardingDataSchema = z.object({
  userType: z.enum(['solo', 'team', 'enterprise']),
  preferredAITools: z.array(z.string()),
  // Allow empty array for users who skip onboarding or don't select AI tools
  workspaceName: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must not exceed 100 characters'),
  workspaceDescription: z.string().max(500).optional(),
  workspaceTemplate: z.enum(['React', 'Node.js', 'Python', 'Custom']).optional()
});

// OAuth callback query schema
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required')
});

// Export types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type OnboardingDataInput = z.infer<typeof onboardingDataSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
