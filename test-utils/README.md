# Test Utilities

This directory contains reusable test utilities, factories, and fixtures for the
CC Wrapper development environment setup tests.

## Structure

```
test-utils/
├── factories/           # Data factories for generating test data
│   └── setup-factory.ts # Factory functions for setup-related test data
├── fixtures/            # Common test fixtures for setup/teardown
│   └── setup-fixtures.ts # Reusable test environment fixtures
└── index.ts            # Central export point for test utilities
```

## Usage

### Data Factories

```typescript
import { createMockSetupEnvironment, createMockHealthCheck } from '../test-utils';

// Create mock setup environment with overrides
const setupConfig = createMockSetupEnvironment({
  REQUIRED_VERSIONS: {
    bun: '1.4.0' // Override default version
  }
});

// Create mock health check result
const healthCheck = createMockHealthCheck({
  status: 'unhealthy',
  message: 'Service unavailable'
});
```

### Test Fixtures

```typescript
import { setupMockConsole, setupTemporaryDirectory } from '../test-utils';

// Set up mock console to prevent output pollution
const mockConsole = setupMockConsole();

// Create temporary directory for isolated testing
const tempDir = setupTemporaryDirectory();

// Use in tests
describe('My Test', () => {
  beforeEach(() => {
    mockConsole = setupMockConsole();
    tempDir = setupTemporaryDirectory();
  });

  afterEach(() => {
    mockConsole.restore();
    tempDir.cleanup();
  });
});
```

### Complete Test Environment

```typescript
import { setupTestEnvironment } from '../test-utils';

describe('Complex Test', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    // All fixtures set up automatically
  });

  afterEach(() => {
    testEnv.cleanup();
    // All cleanup handled automatically
  });
});
```

## Available Factories

### `createMockSetupEnvironment(overrides?)`

Creates mock setup environment configuration with default versions and platform
info.

### `createMockEnvironmentConfig(overrides?)`

Creates mock environment configuration with default environment variables.

### `createMockHealthCheck(overrides?)`

Creates mock health check result with customizable status and timing.

### `createMockToolVersion(overrides?)`

Creates mock tool version check result.

### `createMockHealthChecks()`

Creates array of healthy health check results for all services.

### `createMockHealthChecksWithErrors()`

Creates array of mixed health check results for testing error scenarios.

### `createPlatformTestData(platform)`

Creates platform-specific test data for macOS, Linux, Windows, or unsupported
platforms.

### `createMockDependencyChecks()`

Creates dependency check results with mixed installation states.

### `createMockEnvironmentVariables()`

Creates mock environment variables for testing.

## Available Fixtures

### `setupMockConsole()`

Mocks console methods to prevent test output pollution. Returns object with
`restore()` method.

### `setupPlatformMock(platform)`

Mocks `process.platform` for cross-platform testing. Returns restore function.

### `setupFileSystemFixture()`

Provides file system utilities for creating and cleaning up test
files/directories.

### `setupEnvironmentFixture()`

Manages environment variables during tests with automatic cleanup.

### `setupTemporaryDirectory(baseName?)`

Creates isolated temporary directories for testing with automatic cleanup.

### `setupVSCodeFixture()`

Manages VS Code configuration files during testing.

### `setupTestEnvironment()`

Complete test environment fixture combining all common fixtures.

### `setupPerformanceTimer()`

Provides performance measurement utilities for timing tests.

## Best Practices

1. **Always use factories** instead of hardcoded test data
2. **Clean up fixtures** in `afterEach()` to prevent test pollution
3. **Use temporary directories** for file system operations
4. **Mock console output** to keep test results clean
5. **Use the complete test environment** for complex test scenarios

## Examples

See the test files in `/tests/` directory for comprehensive examples of using
these utilities.
