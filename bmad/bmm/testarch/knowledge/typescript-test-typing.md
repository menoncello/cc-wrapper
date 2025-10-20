# TypeScript Types in Test Code

## Principle
Test code must meet the SAME TypeScript standards as production code.

## Project TypeScript Configuration

This project uses TypeScript 5.9.3 with strict mode enabled:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

## Common Mistakes

### ❌ BAD: Using `any`
```typescript
it("should process data", () => {
  const data: any = { name: "test" };  // BAD - loses type safety
  expect(processData(data)).toBeDefined();
});
```

### ✅ GOOD: Proper types
```typescript
interface UserData {
  name: string;
  id: number;
}

it("should process data", () => {
  const data: UserData = { name: "test", id: 1 };  // GOOD
  expect(processData(data)).toBeDefined();
});
```

### ❌ BAD: Untyped mocks
```typescript
const mockFn: any = () => {};  // BAD
```

### ✅ GOOD: Typed mocks
```typescript
const mockFn: (input: string) => number = (input) => input.length;  // GOOD
```

### ❌ BAD: Ignoring null/undefined
```typescript
it("should get user", () => {
  const user = getUserById(1);
  expect(user.name).toBe("Test");  // Error if noUncheckedIndexedAccess is true
});
```

### ✅ GOOD: Null-safe access
```typescript
it("should get user", () => {
  const user = getUserById(1);
  expect(user).toBeDefined();
  if (user) {
    expect(user.name).toBe("Test");
  }
});
```

## Type Inference

Let TypeScript infer when obvious:
```typescript
// ✅ Type inferred as number
const result = calculateTotal([1, 2, 3]);
expect(result).toBe(6);

// ✅ Type inferred from function return
const users = await fetchUsers();
expect(users).toHaveLength(3);
```

Explicit types when needed:
```typescript
// ✅ Explicit when inference isn't clear
const config: AppConfig = {
  port: 3000,
  host: "localhost"
};
```

## Test Data Types

### Define interfaces for test data
```typescript
interface TestProduct {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const testProduct: TestProduct = {
  id: "prod-123",
  name: "Test Product",
  price: 99.99,
  inStock: true
};
```

### Use type guards in tests
```typescript
function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response
  );
}

it("should handle errors", async () => {
  const response = await makeRequest();

  if (isErrorResponse(response)) {
    expect(response.error).toBeDefined();
  }
});
```

## Generic Test Utilities

```typescript
// ✅ Generic test factory
function createTestEntity<T extends { id: string }>(
  partial: Partial<T>
): T {
  return {
    id: "test-id",
    ...partial
  } as T;
}

// Usage
interface User {
  id: string;
  name: string;
  email: string;
}

const testUser = createTestEntity<User>({
  name: "Test User",
  email: "test@example.com"
});
```

## Strict Mode Compliance

All tests MUST compile with:
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused function parameters
- `noImplicitReturns: true` - All code paths must return
- `strict: true` - All strict checks enabled
- `noUncheckedIndexedAccess: true` - Safe array/object access

## Handling External Libraries

When using external libraries without types:
```typescript
// ❌ BAD - Using any
const lib: any = require("no-types-lib");

// ✅ GOOD - Define minimal types
interface NoTypesLib {
  method: (input: string) => string;
}
const lib = require("no-types-lib") as NoTypesLib;
```

## Type Assertions

Use sparingly and only when TypeScript can't infer correctly:
```typescript
// ✅ Acceptable when you know more than TypeScript
const element = document.querySelector(".button") as HTMLButtonElement;

// ❌ Avoid double assertions
const value = (unknown as any) as MyType;  // BAD

// ✅ Better - use type guard
function isMyType(value: unknown): value is MyType {
  return typeof value === "object" && value !== null && "prop" in value;
}
```

## Never Use

- ❌ `@ts-ignore` - Hides errors instead of fixing them
- ❌ `@ts-expect-error` - Acceptable only for testing error cases
- ❌ `any` type - Loses all type safety
- ❌ Type assertions to `any` - Defeats purpose of TypeScript

## Quality Check

Before committing test code:
```bash
# Verify TypeScript compilation
bun run type-check

# Should output: 0 errors
```

## Resources

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Project tsconfig.json: /tsconfig.json
- TypeScript 5.9 Release Notes: https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/
