import { z } from 'zod';

import { VALIDATION_CONSTANTS } from '../constants/auth.constants.js';

// Email validation with proper RFC 5322 compliance
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(
    VALIDATION_CONSTANTS.MIN_EMAIL_LENGTH,
    `Email must be at least ${VALIDATION_CONSTANTS.MIN_EMAIL_LENGTH} characters`
  )
  .max(
    VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH,
    `Email must not exceed ${VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH} characters`
  )
  .toLowerCase()
  .trim();

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH,
    `Password must be at least ${VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH} characters`
  )
  .max(
    VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH,
    `Password must not exceed ${VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH} characters`
  )
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Name validation
const nameSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.MIN_NAME_LENGTH,
    `Name must be at least ${VALIDATION_CONSTANTS.MIN_NAME_LENGTH} character`
  )
  .max(
    VALIDATION_CONSTANTS.MAX_NAME_LENGTH,
    `Name must not exceed ${VALIDATION_CONSTANTS.MAX_NAME_LENGTH} characters`
  )
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
    .max(
      VALIDATION_CONSTANTS.MAX_WORKSPACE_NAME_LENGTH,
      `Workspace name must not exceed ${VALIDATION_CONSTANTS.MAX_WORKSPACE_NAME_LENGTH} characters`
    ),
  workspaceDescription: z
    .string()
    .max(VALIDATION_CONSTANTS.MAX_WORKSPACE_DESCRIPTION_LENGTH)
    .optional(),
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
