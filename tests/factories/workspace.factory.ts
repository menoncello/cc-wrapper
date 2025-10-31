/**
 * Workspace Data Factory
 * Story 1.1 - Test data generation for workspace tests
 *
 * Pattern: Pure functions using @faker-js/faker with override support
 * Reference: bmad/bmm/testarch/knowledge/data-factories.md
 */

import { faker } from '@faker-js/faker';

export type WorkspaceTemplate = 'react' | 'nodejs' | 'python' | 'custom';
export type UserType = 'solo' | 'team' | 'enterprise';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string;
  template: WorkspaceTemplate;
  configuration: WorkspaceConfiguration;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceConfiguration {
  framework?: string;
  packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm';
  typescript: boolean;
  aiTools: string[];
  customSettings?: Record<string, any>;
}

export interface OnboardingData {
  userType: UserType;
  aiTools: string[];
  workspaceName: string;
  workspaceDescription: string;
  workspaceTemplate: WorkspaceTemplate;
}

/**
 * Create template-specific configuration
 *
 * @param template - Workspace template type
 * @returns Template-specific configuration
 */
const getTemplateConfiguration = (template: WorkspaceTemplate): WorkspaceConfiguration => {
  const baseConfig: WorkspaceConfiguration = {
    packageManager: 'bun',
    typescript: true,
    aiTools: []
  };

  switch (template) {
    case 'react':
      return {
        ...baseConfig,
        framework: 'react'
      };
    case 'nodejs':
      return {
        ...baseConfig,
        framework: 'nodejs'
      };
    case 'python':
      return {
        ...baseConfig,
        packageManager: 'npm', // Python projects may use npm for tooling
        framework: 'python'
      };
    case 'custom':
    default:
      return baseConfig;
  }
};

/**
 * Create a single workspace with optional overrides
 *
 * @param userId - User ID who owns the workspace
 * @param overrides - Partial workspace data to override
 * @returns Workspace object
 *
 * @example
 * const workspace = createWorkspace('user-123');
 * const reactWorkspace = createWorkspace('user-123', { template: 'react' });
 */
export const createWorkspace = (userId: string, overrides: Partial<Workspace> = {}): Workspace => {
  const template =
    overrides.template ||
    faker.helpers.arrayElement(['react', 'nodejs', 'python', 'custom'] as WorkspaceTemplate[]);

  const defaultWorkspace: Workspace = {
    id: faker.string.uuid(),
    user_id: userId,
    name: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    template,
    configuration: getTemplateConfiguration(template),
    is_default: false,
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: faker.date.recent({ days: 7 }).toISOString()
  };

  return {
    ...defaultWorkspace,
    ...overrides,
    // Ensure configuration matches template if template is overridden
    configuration: overrides.configuration || getTemplateConfiguration(template)
  };
};

/**
 * Create default workspace for new user
 *
 * @param userId - User ID
 * @param template - Workspace template
 * @param overrides - Additional overrides
 * @returns Default workspace
 *
 * @example
 * const defaultWs = createDefaultWorkspace('user-123', 'react');
 */
export const createDefaultWorkspace = (
  userId: string,
  template: WorkspaceTemplate = 'custom',
  overrides: Partial<Workspace> = {}
): Workspace => {
  return createWorkspace(userId, {
    name: 'My Workspace',
    description: 'Default workspace',
    template,
    is_default: true,
    ...overrides
  });
};

/**
 * Create array of workspaces for a user
 *
 * @param userId - User ID
 * @param count - Number of workspaces
 * @param overrides - Shared overrides for all workspaces
 * @returns Array of workspaces
 *
 * @example
 * const workspaces = createWorkspaces('user-123', 3);
 * const reactWorkspaces = createWorkspaces('user-123', 2, { template: 'react' });
 */
export const createWorkspaces = (
  userId: string,
  count: number,
  overrides: Partial<Workspace> = {}
): Workspace[] => {
  return Array.from({ length: count }, (_, index) =>
    createWorkspace(userId, {
      is_default: index === 0, // First workspace is default
      ...overrides
    })
  );
};

/**
 * Create onboarding form data
 *
 * @param overrides - Data to override
 * @returns Onboarding wizard data
 *
 * @example
 * const onboarding = createOnboardingData();
 * const teamOnboarding = createOnboardingData({ userType: 'team' });
 */
export const createOnboardingData = (overrides: Partial<OnboardingData> = {}): OnboardingData => {
  const defaultOnboarding: OnboardingData = {
    userType: faker.helpers.arrayElement(['solo', 'team', 'enterprise'] as UserType[]),
    aiTools: faker.helpers.arrayElements(
      ['claude', 'chatgpt', 'cursor', 'windsurf', 'github-copilot'],
      { min: 1, max: 3 }
    ),
    workspaceName: faker.company.buzzPhrase(),
    workspaceDescription: faker.lorem.sentence(),
    workspaceTemplate: faker.helpers.arrayElement([
      'react',
      'nodejs',
      'python',
      'custom'
    ] as WorkspaceTemplate[])
  };

  return {
    ...defaultOnboarding,
    ...overrides
  };
};

/**
 * Create workspace creation API payload
 *
 * @param overrides - Data to override
 * @returns API request payload
 *
 * @example
 * const payload = createWorkspacePayload();
 * const reactPayload = createWorkspacePayload({ template: 'react' });
 */
export const createWorkspacePayload = (
  overrides: Partial<{
    name: string;
    description: string;
    template: WorkspaceTemplate;
    userType: UserType;
  }> = {}
) => {
  return {
    name: overrides.name || faker.company.buzzPhrase(),
    description: overrides.description || faker.lorem.sentence(),
    template: overrides.template || 'react',
    userType: overrides.userType || 'solo'
  };
};

/**
 * Create workspace configuration for specific use case
 *
 * @param template - Template type
 * @param aiTools - Array of AI tools
 * @param overrides - Additional config overrides
 * @returns Workspace configuration
 *
 * @example
 * const config = createWorkspaceConfiguration('react', ['claude', 'cursor']);
 */
export const createWorkspaceConfiguration = (
  template: WorkspaceTemplate,
  aiTools: string[] = [],
  overrides: Partial<WorkspaceConfiguration> = {}
): WorkspaceConfiguration => {
  const baseConfig = getTemplateConfiguration(template);

  return {
    ...baseConfig,
    aiTools,
    ...overrides
  };
};
