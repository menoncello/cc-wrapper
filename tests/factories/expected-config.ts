/**
 * Expected Configuration Factories
 *
 * Single source of truth for expected project configurations.
 * When dependencies or configurations change, update here instead of 20+ tests.
 *
 * Usage:
 * ```typescript
 * import { expectedDependencies, expectedScripts } from '../factories/expected-config';
 *
 * test('should have correct Vite version', () => {
 *   const deps = expectedDependencies();
 *   expect(packageJson.devDependencies?.vite).toMatch(deps.vite.pattern);
 * });
 * ```
 */

/**
 * Expected dependency versions
 */
export const expectedDependencies = () => ({
  // Build System Dependencies
  vite: {
    minVersion: '7.0.0',
    pattern: /^[\^~]?7\./,
    type: 'devDependencies' as const,
    description: 'Frontend build tool'
  },
  typescript: {
    minVersion: '5.9.0',
    pattern: /^[\^~]?5\.9\./,
    type: 'devDependencies' as const,
    description: 'TypeScript compiler'
  },
  turbo: {
    minVersion: '2.0.0',
    pattern: /^[\^~]?2\./,
    type: 'devDependencies' as const,
    description: 'Monorepo build system'
  },

  // Test Framework Dependencies
  playwright: {
    minVersion: '1.56.0',
    pattern: /^[\^~]?1\.56\./,
    type: 'devDependencies' as const,
    description: 'E2E testing framework'
  },
  '@playwright/test': {
    minVersion: '1.56.0',
    pattern: /^[\^~]?1\.56\./,
    type: 'devDependencies' as const,
    description: 'Playwright test runner'
  },

  // Code Quality Dependencies
  eslint: {
    minVersion: '9.0.0',
    pattern: /^[\^~]?9\./,
    type: 'devDependencies' as const,
    description: 'JavaScript/TypeScript linter'
  },
  prettier: {
    minVersion: '3.0.0',
    pattern: /^[\^~]?3\./,
    type: 'devDependencies' as const,
    description: 'Code formatter'
  },
  '@typescript-eslint/parser': {
    minVersion: '8.0.0',
    pattern: /^[\^~]?8\./,
    type: 'devDependencies' as const,
    description: 'TypeScript ESLint parser'
  },
  '@typescript-eslint/eslint-plugin': {
    minVersion: '8.0.0',
    pattern: /^[\^~]?8\./,
    type: 'devDependencies' as const,
    description: 'TypeScript ESLint rules'
  },

  // Git Hooks
  husky: {
    minVersion: '9.0.0',
    pattern: /^[\^~]?9\./,
    type: 'devDependencies' as const,
    description: 'Git hooks manager'
  },
  'lint-staged': {
    minVersion: '15.0.0',
    pattern: /^[\^~]?15\./,
    type: 'devDependencies' as const,
    description: 'Pre-commit linter'
  }
});

/**
 * Expected npm scripts
 */
export const expectedScripts = () => ({
  // Development Scripts
  dev: {
    description: 'Start development server',
    shouldContain: ['turbo', 'dev']
  },

  // Build Scripts
  build: {
    description: 'Build all packages',
    shouldContain: ['turbo', 'build']
  },
  'build:all': {
    description: 'Build all workspaces',
    shouldContain: ['turbo']
  },
  'build:watch': {
    description: 'Watch mode for builds',
    shouldContain: ['turbo']
  },

  // Test Scripts
  test: {
    description: 'Run all tests',
    shouldContain: ['bun', 'test']
  },
  'test:coverage': {
    description: 'Run tests with coverage',
    shouldContain: ['bun', 'test']
  },
  'test:watch': {
    description: 'Run tests in watch mode',
    shouldContain: ['bun', 'test']
  },
  'test:e2e': {
    description: 'Run E2E tests',
    shouldContain: ['playwright']
  },
  'test:unit': {
    description: 'Run unit tests',
    shouldContain: ['bun', 'test']
  },
  'test:integration': {
    description: 'Run integration tests',
    shouldContain: ['bun', 'test']
  },

  // Code Quality Scripts
  lint: {
    description: 'Lint all code',
    shouldContain: ['turbo', 'lint']
  },
  'lint:fix': {
    description: 'Auto-fix linting issues',
    shouldContain: ['turbo', 'lint']
  },
  format: {
    description: 'Format all code',
    shouldContain: ['turbo', 'format']
  },
  'type-check': {
    description: 'TypeScript type checking',
    shouldContain: ['turbo', 'type-check']
  },

  // Setup & Utility Scripts
  setup: {
    description: 'Initial project setup',
    shouldContain: []
  },
  health: {
    description: 'Health check',
    shouldContain: []
  },

  // Docker Services Scripts
  'services:up': {
    description: 'Start Docker services',
    shouldContain: ['docker', 'compose']
  },
  'services:down': {
    description: 'Stop Docker services',
    shouldContain: ['docker', 'compose']
  },
  'services:logs': {
    description: 'View service logs',
    shouldContain: ['docker', 'compose']
  }
});

/**
 * Expected workspace configuration
 */
export const expectedWorkspaces = () => ({
  workspaces: ['packages/*', 'services/*', 'apps/*'],
  directories: [
    {
      name: 'packages',
      description: 'Shared libraries and packages',
      minPackages: 1
    },
    {
      name: 'services',
      description: 'Backend microservices',
      minPackages: 0 // Optional initially
    },
    {
      name: 'apps',
      description: 'Frontend applications',
      minPackages: 0 // Optional initially
    }
  ]
});

/**
 * Expected TypeScript configuration
 */
export const expectedTsConfig = () => ({
  compilerOptions: {
    strict: true,
    target: 'ES2022' as const,
    module: 'ESNext' as const,
    moduleResolution: 'bundler' as const,
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true
  }
});

/**
 * Expected file structure
 */
export const expectedFiles = () => ({
  root: [
    'package.json',
    'tsconfig.json',
    'turbo.json',
    'README.md',
    'LICENSE',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md'
  ],
  config: [
    'vite.config.ts',
    'playwright.config.ts',
    'eslint.config.js',
    'prettier.config.js'
  ],
  docs: [
    'docs/development-workflow.md',
    'docs/build-process.md',
    'docs/deployment.md',
    'docs/troubleshooting.md',
    'docs/architecture.md',
    'docs/testing.md'
  ],
  tests: [
    'tests/integration',
    'tests/e2e',
    'tests/unit',
    'tests/support'
  ]
});

/**
 * Expected ESLint configuration patterns
 */
export const expectedESLintConfig = () => ({
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ]
});

/**
 * Helper to check if dependency version matches expected pattern
 */
export const matchesDependencyPattern = (
  actual: string | undefined,
  expected: ReturnType<typeof expectedDependencies>[keyof ReturnType<typeof expectedDependencies>]
): boolean => {
  if (!actual) {
return false;
}
  return expected.pattern.test(actual);
};
