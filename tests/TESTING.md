# Testing Guide for CC Wrapper

This guide provides comprehensive information about testing in the CC Wrapper
project.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions/classes
│   └── example.test.ts     # Example unit test demonstrating best practices
├── integration/            # Integration tests for module interactions
│   └── example.test.ts    # Example integration test
├── e2e/                    # End-to-end tests for complete workflows
│   └── example.test.ts    # Example E2E test
└── support/                # Test utilities and helpers
    └── test-helpers.ts     # Common test utilities
```

## Running Tests

### All Tests

```bash
bun test
```

### Unit Tests Only

```bash
bun run test:unit
```

### Integration Tests Only

```bash
bun run test:integration
```

### E2E Tests Only

```bash
bun run test:e2e
```

### With Coverage

```bash
bun run test:coverage
```

### Coverage with HTML Report

```bash
bun run test:coverage:html
```

### Watch Mode (Re-run on file changes)

```bash
bun run test:watch
```

### Watch Mode for Unit Tests Only

```bash
bun run test:watch:unit
```

## Test Types

### Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions, classes, or modules in isolation.

**Characteristics**:

- Fast execution (< 100ms per test)
- No external dependencies (database, network, file system)
- Use mocks for dependencies
- Test edge cases and error handling
- High code coverage (aim for 90%+)

**When to write**:

- Testing pure functions
- Testing business logic
- Testing utility functions
- Testing class methods

**Example**:

```typescript
import { describe, test, expect } from 'bun:test';

describe('StringUtils', () => {
  test('capitalize should uppercase first letter', () => {
    const result = capitalize('hello');
    expect(result).toBe('Hello');
  });
});
```

### Integration Tests (`tests/integration/`)

**Purpose**: Test how different modules/components work together.

**Characteristics**:

- Medium execution time (100ms - 1s per test)
- May use real dependencies (file system, database)
- Test module interactions
- Test data flow between components
- Realistic scenarios

**When to write**:

- Testing API integrations
- Testing database operations
- Testing file system operations
- Testing module interactions

**Example**:

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

describe('FileManager', () => {
  beforeAll(async () => {
    // Set up test environment
  });

  test('should create and read file', async () => {
    await fileManager.create('test.txt', 'content');
    const content = await fileManager.read('test.txt');
    expect(content).toBe('content');
  });

  afterAll(async () => {
    // Clean up test environment
  });
});
```

### End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete user workflows from start to finish.

**Characteristics**:

- Slow execution (1s+ per test)
- Test entire system
- Use real environment when possible
- Test critical user journeys
- Minimal mocking

**When to write**:

- Testing complete workflows
- Testing user scenarios
- Testing system integration
- Testing deployment processes

**Example**:

```typescript
import { describe, test, expect } from 'bun:test';

describe('User Registration Flow', () => {
  test('should complete full registration', async () => {
    // 1. Create account
    // 2. Verify email
    // 3. Complete profile
    // 4. Verify user can log in
  });
});
```

## Writing Tests

### Test Structure (AAA Pattern)

Follow the Arrange-Act-Assert pattern:

```typescript
test('description', () => {
  // Arrange: Set up test data and preconditions
  const input = 'test';
  const expected = 'TEST';

  // Act: Execute the code under test
  const result = toUpperCase(input);

  // Assert: Verify the outcome
  expect(result).toBe(expected);
});
```

### Test Naming Conventions

Use descriptive names that explain the scenario:

```typescript
// ✅ Good
test('should return empty array when no users exist');
test('should throw error when email is invalid');
test('should update user name successfully');

// ❌ Bad
test('test1');
test('works');
test('user test');
```

### Using Test Lifecycle Hooks

```typescript
import {
  describe,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach
} from 'bun:test';

describe('TestSuite', () => {
  // Run once before all tests in this describe block
  beforeAll(async () => {
    // Set up expensive resources (database connection, etc.)
  });

  // Run once after all tests in this describe block
  afterAll(async () => {
    // Clean up expensive resources
  });

  // Run before each test
  beforeEach(() => {
    // Set up fresh state for each test
  });

  // Run after each test
  afterEach(() => {
    // Clean up after each test
  });

  test('test 1', () => {});
  test('test 2', () => {});
});
```

### Mocking

```typescript
import { mock } from 'bun:test';

// Create a mock function
const mockFn = mock((x: number) => x * 2);

// Use the mock
mockFn(5); // Returns 10

// Create mock object
const mockApi = {
  get: mock(async (url: string) => ({ data: {} })),
  post: mock(async (url: string, data: any) => ({ data: {} }))
};
```

## Test Utilities

The project provides helpful utilities in `tests/support/test-helpers.ts`:

### TempDirectory

```typescript
import { TempDirectory } from '../support/test-helpers';

const tempDir = new TempDirectory('my-test-');
await tempDir.create();
await tempDir.createFile('test.txt', 'content');
await tempDir.cleanup();
```

### MockConsole

```typescript
import { MockConsole } from '../support/test-helpers';

const mockConsole = new MockConsole();
mockConsole.install();

console.log('test'); // Captured in mockConsole.logs

expect(mockConsole.logs).toContain('test');
mockConsole.restore();
```

### Async Helpers

```typescript
import { asyncHelpers } from '../support/test-helpers';

// Wait for condition
await asyncHelpers.waitFor(() => fileExists('output.txt'));

// Delay
await asyncHelpers.delay(1000);

// Retry with exponential backoff
const result = await asyncHelpers.retry(() => fetchData());
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '../support/test-helpers';

const monitor = new PerformanceMonitor();
monitor.start();

// Execute code
await someOperation();

monitor.stop();
monitor.assertDurationUnder(1000); // Assert < 1 second
```

## Coverage Requirements

The project enforces minimum coverage thresholds:

- **Overall Coverage**: ≥ 80%
- **Critical Paths**: ≥ 90%
- **New Code**: 100% coverage recommended

### Viewing Coverage

**Terminal Output**:

```bash
bun run test:coverage
```

**HTML Report** (opens in browser):

```bash
bun run test:coverage:html
open coverage/index.html
```

## Best Practices

### DO ✅

- **Write tests first** (TDD) when possible
- **Test behavior, not implementation**
- **Keep tests isolated and independent**
- **Use descriptive test names**
- **Test edge cases and error conditions**
- **Clean up resources in afterEach/afterAll**
- **Mock external dependencies in unit tests**
- **Use realistic data in integration/E2E tests**
- **Keep tests fast** (parallelize when possible)
- **Document complex test scenarios**

### DON'T ❌

- **Don't test third-party libraries**
- **Don't write tests that depend on each other**
- **Don't use setTimeout for waiting** (use waitFor instead)
- **Don't test implementation details**
- **Don't ignore failing tests**
- **Don't commit commented-out tests**
- **Don't use production data in tests**
- **Don't write tests without assertions**

### Example Test Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

describe('FeatureName', () => {
  // Setup
  let subject: SubjectUnderTest;

  beforeEach(() => {
    subject = new SubjectUnderTest();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = subject.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('key');
    });

    test('should handle edge case', () => {
      const result = subject.methodName('');
      expect(result).toBe(null);
    });

    test('should throw error for invalid input', () => {
      expect(() => subject.methodName(null)).toThrow();
    });
  });
});
```

## Continuous Integration

Tests run automatically on:

- Every commit
- Pull requests
- Before deployment

CI requirements:

- All tests must pass
- Coverage thresholds must be met
- No TypeScript errors
- No ESLint errors

## Troubleshooting

### Tests Running Slowly

- Check for missing `.only` that runs subset of tests
- Ensure proper cleanup in afterEach hooks
- Use parallel execution: `bun test --concurrent`

### Coverage Not Updating

- Clear coverage directory: `rm -rf coverage`
- Re-run with clean slate: `bun test --coverage`

### Tests Failing Intermittently

- Look for race conditions
- Check for shared state between tests
- Ensure proper cleanup
- Use `asyncHelpers.waitFor()` instead of fixed delays

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Best Practices](https://martinfowler.com/testing/)
- Example tests in `tests/{unit,integration,e2e}/example.test.ts`
- Test utilities in `tests/support/test-helpers.ts`

## Getting Help

If you need help with testing:

1. Check example tests first
2. Review this guide
3. Check Bun test documentation
4. Ask the team in #testing channel
