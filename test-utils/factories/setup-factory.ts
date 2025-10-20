/**
 * Factory functions for test data in development environment setup tests
 *
 * Provides centralized, maintainable test data generation with override capabilities
 * following the factory pattern for test data management
 */

// Type definitions for test data
export interface SetupEnvironmentConfig {
  REQUIRED_VERSIONS: {
    bun: string
    typescript: string
    docker: string
    dockerCompose: string
    postgresql: string
    redis: string
  }
  platform: {
    os: string
    arch: string
    packageManager: string
  }
}

export interface EnvironmentConfig {
  DATABASE_URL: string
  REDIS_URL: string
  NODE_ENV: string
  PORT: number
  HOST: string
  LOG_LEVEL: string
  BUN_VERSION: string
  TYPESCRIPT_VERSION: string
  COMPOSE_PROJECT_NAME: string
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'degraded'
  name: string
  responseTime?: number
  message?: string
}

export interface ToolVersion {
  installed: boolean
  version?: string
  required: string
}

/**
 * Creates a mock setup environment configuration with sensible defaults
 */
export const createMockSetupEnvironment = (overrides: Partial<SetupEnvironmentConfig> = {}): SetupEnvironmentConfig => ({
  REQUIRED_VERSIONS: {
    bun: '1.3.0',
    typescript: '5.9.3',
    docker: '28.5.1',
    dockerCompose: '2.27.0',
    postgresql: '18.0',
    redis: '8.2.2',
    ...overrides.REQUIRED_VERSIONS
  },
  platform: {
    os: 'macos',
    arch: 'x64',
    packageManager: 'bun',
    ...overrides.platform
  },
  ...overrides
});

/**
 * Creates a mock environment configuration for testing
 */
export const createMockEnvironmentConfig = (overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig => ({
  DATABASE_URL: 'postgresql://localhost:5432/ccwrapper_dev',
  REDIS_URL: 'redis://localhost:6379',
  NODE_ENV: 'development',
  PORT: 3000,
  HOST: 'localhost',
  LOG_LEVEL: 'debug',
  BUN_VERSION: '1.3.0',
  TYPESCRIPT_VERSION: '5.9.3',
  COMPOSE_PROJECT_NAME: 'ccwrapper',
  ...overrides
});

/**
 * Creates a mock health check result
 */
export const createMockHealthCheck = (overrides: Partial<HealthCheckResult> = {}): HealthCheckResult => ({
  status: 'healthy',
  name: 'Test Service',
  responseTime: 100,
  message: 'All systems operational',
  ...overrides
});

/**
 * Creates a mock tool version check result
 */
export const createMockToolVersion = (overrides: Partial<ToolVersion> = {}): ToolVersion => ({
  installed: true,
  required: '1.3.0',
  version: '1.3.0',
  ...overrides
});

/**
 * Creates multiple mock health check results with different statuses
 */
export const createMockHealthChecks = (): HealthCheckResult[] => [
  createMockHealthCheck({
    name: 'Bun Runtime',
    status: 'healthy',
    responseTime: 50,
    message: 'Version 1.3.0'
  }),
  createMockHealthCheck({
    name: 'TypeScript Compiler',
    status: 'healthy',
    responseTime: 75,
    message: 'Version 5.9.3'
  }),
  createMockHealthCheck({
    name: 'Docker Engine',
    status: 'healthy',
    responseTime: 200,
    message: 'Version 28.5.1'
  }),
  createMockHealthCheck({
    name: 'PostgreSQL Service',
    status: 'healthy',
    responseTime: 150,
    message: 'Database accessible'
  }),
  createMockHealthCheck({
    name: 'Redis Service',
    status: 'healthy',
    responseTime: 25,
    message: 'Cache accessible'
  })
];

/**
 * Creates mixed health check results for testing error scenarios
 */
export const createMockHealthChecksWithErrors = (): HealthCheckResult[] => [
  createMockHealthCheck({
    name: 'Bun Runtime',
    status: 'healthy',
    responseTime: 50
  }),
  createMockHealthCheck({
    name: 'TypeScript Compiler',
    status: 'unhealthy',
    message: 'TypeScript not found'
  }),
  createMockHealthCheck({
    name: 'Docker Engine',
    status: 'unknown',
    message: 'Docker daemon not running'
  }),
  createMockHealthCheck({
    name: 'PostgreSQL Service',
    status: 'healthy',
    responseTime: 150
  }),
  createMockHealthCheck({
    name: 'Redis Service',
    status: 'degraded',
    responseTime: 500,
    message: 'High latency'
  })
];

/**
 * Creates platform-specific test data
 */
export const createPlatformTestData = (platform: 'macos' | 'linux' | 'windows' | 'unsupported') => {
  const platformMap = {
    macos: { os: 'macos', arch: 'x64', packageManager: 'bun' },
    linux: { os: 'linux', arch: 'x64', packageManager: 'bun' },
    windows: { os: 'windows', arch: 'x64', packageManager: 'bun' },
    unsupported: { os: 'freebsd', arch: 'x64', packageManager: 'bun' }
  };

  return platformMap[platform];
};

/**
 * Creates dependency check results with mixed installation states
 */
export const createMockDependencyChecks = (): Record<string, ToolVersion> => ({
  bun: createMockToolVersion({ installed: true, version: '1.3.0', required: '1.3.0' }),
  typescript: createMockToolVersion({ installed: true, version: '5.9.3', required: '5.9.3' }),
  docker: createMockToolVersion({ installed: false, required: '28.5.1' }),
  postgresql: createMockToolVersion({ installed: true, version: '18.0', required: '18.0' }),
  redis: createMockToolVersion({ installed: false, required: '8.2.2' })
});

/**
 * Creates test environment variables for testing
 */
export const createMockEnvironmentVariables = (): Record<string, string> => ({
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  NODE_ENV: 'test',
  PORT: '3000',
  HOST: 'localhost',
  LOG_LEVEL: 'debug',
  BUN_VERSION: '1.3.0',
  TYPESCRIPT_VERSION: '5.9.3',
  COMPOSE_PROJECT_NAME: 'ccwrapper-test'
});