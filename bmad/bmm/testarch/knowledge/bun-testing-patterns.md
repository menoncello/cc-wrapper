# Bun Test Patterns and Best Practices

## Overview
This project uses Bun Test (built-in to Bun runtime) for all testing.

## Key APIs

### Test Structure
```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("Feature name", () => {
  beforeAll(() => {
    // Setup once before all tests
  });

  afterAll(() => {
    // Cleanup once after all tests
  });

  it("should do something", () => {
    expect(result).toBe(expected);
  });
});
```

### Assertions
- `expect(value).toBe(expected)` - Strict equality
- `expect(value).toEqual(expected)` - Deep equality
- `expect(value).toBeTrue()` / `toBeFalse()`
- `expect(value).toThrow()` - Error throwing
- `expect(value).toBeDefined()` - Value is not undefined
- `expect(value).toBeNull()` - Value is null
- `expect(value).toContain(item)` - Array/string contains item

### Async Tests
```typescript
it("should handle async", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Test Lifecycle Hooks
- `beforeAll(() => {})` - Run once before all tests in describe block
- `afterAll(() => {})` - Run once after all tests in describe block
- `beforeEach(() => {})` - Run before each test
- `afterEach(() => {})` - Run after each test

## Quality Requirements

### TypeScript Types
- ❌ NO `any` types in test code
- ✅ Proper type inference for test data
- ✅ Type assertions only when necessary
- ✅ Use interface/type for complex test data

### ESLint Compliance
- ✅ No unused variables
- ✅ Proper async/await handling (no floating promises)
- ❌ No eslint-disable comments
- ✅ Meaningful variable names

### Best Practices
- One assertion per test (when possible)
- Descriptive test names (use "should" pattern)
- Arrange-Act-Assert pattern
- Cleanup resources in afterEach/afterAll
- Isolate tests (no shared mutable state)
- Test edge cases and error paths

## Example: Good Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

interface TestUser {
  id: number;
  name: string;
  email: string;
}

describe("UserService", () => {
  let testUser: TestUser;

  beforeEach(() => {
    testUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com"
    };
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it("should create user with valid data", async () => {
    // Arrange
    const service = new UserService();

    // Act
    const result = await service.createUser(testUser);

    // Assert
    expect(result.id).toBe(testUser.id);
    expect(result.name).toBe(testUser.name);
  });

  it("should throw error for invalid email", async () => {
    // Arrange
    const service = new UserService();
    const invalidUser = { ...testUser, email: "invalid" };

    // Act & Assert
    expect(() => service.createUser(invalidUser)).toThrow();
  });
});
```

## Anti-Patterns to Avoid

### ❌ BAD: Using `any`
```typescript
const testData: any = { name: "test" };
```

### ✅ GOOD: Proper types
```typescript
interface TestData {
  name: string;
}
const testData: TestData = { name: "test" };
```

### ❌ BAD: Missing await
```typescript
it("test", () => {
  asyncFunction(); // Floating promise!
});
```

### ✅ GOOD: Proper async handling
```typescript
it("test", async () => {
  await asyncFunction();
});
```

### ❌ BAD: Multiple unrelated assertions
```typescript
it("should do everything", () => {
  expect(userService.create()).toBeTruthy();
  expect(userService.delete()).toBeTruthy();
  expect(userService.list()).toHaveLength(0);
});
```

### ✅ GOOD: Focused tests
```typescript
it("should create user", () => {
  expect(userService.create()).toBeTruthy();
});

it("should delete user", () => {
  expect(userService.delete()).toBeTruthy();
});
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test path/to/test.test.ts

# Run with coverage (if configured)
bun test --coverage

# Watch mode (re-run on file changes)
bun test --watch
```

## Coverage Targets

Based on project standards:
- Unit tests: 90%+ coverage
- Integration tests: 80%+ coverage
- E2E tests: 100% of critical paths

## Resources

- Bun Test Documentation: https://bun.sh/docs/cli/test
- Project testing strategy: docs/solution-architecture.md (Section 15)
