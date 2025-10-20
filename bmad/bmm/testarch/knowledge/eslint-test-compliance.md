# ESLint Compliance for Test Code

## Policy
Test code follows the SAME ESLint rules as production code.

## Project ESLint Configuration

This project uses:
- ESLint 9.14.0
- @typescript-eslint/eslint-plugin 8.14.0
- @typescript-eslint/parser 8.14.0

**Zero-tolerance policy**: 0 errors, no eslint-disable comments allowed.

## Common Issues and Solutions

### 1. no-unused-vars / @typescript-eslint/no-unused-vars

#### ❌ BAD
```typescript
import { describe, it, expect, beforeAll } from "bun:test";

describe("test", () => {
  // beforeAll imported but never used
  it("works", () => expect(true).toBeTrue());
});
```

#### ✅ GOOD - Remove unused import
```typescript
import { describe, it, expect } from "bun:test";

describe("test", () => {
  it("works", () => expect(true).toBeTrue());
});
```

#### ❌ BAD - Unused variable
```typescript
it("test", () => {
  const result = calculate();
  const unused = 123;  // Never used
  expect(result).toBe(42);
});
```

#### ✅ GOOD - Remove unused variables
```typescript
it("test", () => {
  const result = calculate();
  expect(result).toBe(42);
});
```

### 2. @typescript-eslint/no-floating-promises

#### ❌ BAD - Missing await
```typescript
it("async test", () => {
  fetchData();  // Floating promise - not awaited
});
```

#### ✅ GOOD - Proper async handling
```typescript
it("async test", async () => {
  await fetchData();
});
```

#### ✅ GOOD - Alternative: void operator (when intentional)
```typescript
it("async test", () => {
  void fetchData();  // Explicitly ignoring promise
});
```

### 3. @typescript-eslint/no-explicit-any

#### ❌ BAD
```typescript
const mockData: any = { name: "test" };
```

#### ✅ GOOD
```typescript
interface TestData {
  name: string;
}
const mockData: TestData = { name: "test" };
```

### 4. prefer-const

#### ❌ BAD
```typescript
it("test", () => {
  let value = 42;  // Never reassigned
  expect(value).toBe(42);
});
```

#### ✅ GOOD
```typescript
it("test", () => {
  const value = 42;
  expect(value).toBe(42);
});
```

### 5. no-console

Test code should use proper assertions, not console.log:

#### ❌ BAD
```typescript
it("test", () => {
  const result = calculate();
  console.log(result);  // Don't debug with console.log
  expect(result).toBe(42);
});
```

#### ✅ GOOD
```typescript
it("test", () => {
  const result = calculate();
  expect(result).toBe(42);
});
```

### 6. @typescript-eslint/no-non-null-assertion

#### ❌ BAD - Non-null assertion
```typescript
it("test", () => {
  const user = getUser()!;  // Using ! operator
  expect(user.name).toBe("Test");
});
```

#### ✅ GOOD - Proper null check
```typescript
it("test", () => {
  const user = getUser();
  expect(user).toBeDefined();
  if (user) {
    expect(user.name).toBe("Test");
  }
});
```

### 7. @typescript-eslint/require-await

#### ❌ BAD - Async function without await
```typescript
it("test", async () => {
  const result = syncFunction();  // No await needed
  expect(result).toBe(42);
});
```

#### ✅ GOOD - Remove async if not needed
```typescript
it("test", () => {
  const result = syncFunction();
  expect(result).toBe(42);
});
```

## NEVER Disable Rules

### ❌ **NEVER DO THIS**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unusedVar = 123;

/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = {};
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### ✅ **DO THIS INSTEAD**:
Remove unused variables or refactor code to comply with rules.

## Running ESLint

```bash
# Check all files
bun run lint

# Check specific file
bunx eslint path/to/test.test.ts

# Auto-fix (when possible)
bun run lint:fix
```

## Quality Gates

Test code MUST pass:
```bash
bun run lint
# Expected output: 0 errors, 0 warnings
```

## Special Cases

### Test-specific patterns that ARE allowed:

#### Magic numbers in tests
```typescript
// ✅ OK in tests - literals are more readable
expect(calculateTotal([1, 2, 3])).toBe(6);

// vs production code would use constants
const EXPECTED_TOTAL = 6;
```

#### Multiple expects per test
```typescript
// ✅ OK when testing related properties
it("should create user with correct properties", () => {
  const user = createUser({ name: "Test", email: "test@example.com" });
  expect(user.name).toBe("Test");
  expect(user.email).toBe("test@example.com");
  expect(user.id).toBeDefined();
});
```

## Integration with TypeScript

ESLint works WITH TypeScript strict mode:
- TypeScript catches type errors
- ESLint catches code quality issues
- Both must pass (0 errors each)

## Before Committing

Always run both checks:
```bash
# TypeScript type checking
bun run type-check

# ESLint validation
bun run lint

# All tests
bun test
```

All three MUST pass with 0 errors.

## Resources

- ESLint Rules: https://eslint.org/docs/latest/rules/
- TypeScript ESLint: https://typescript-eslint.io/rules/
- Project eslint.config.js: /eslint.config.js
