# Bun Testing Patterns

## Test API

**Basic Test Structure**:

```typescript
import { describe, it, expect } from 'bun:test';

describe('Component', () => {
  it('should work correctly', () => {
    expect(result).toBe(expected);
  });
});
```

## Best Practices

- Use Bun Test API (describe, it, expect) - NOT Jest/Vitest
- Test files: `*.test.ts` or `*.spec.ts`
- Test location: Same directory as source code or `__tests__` folder
- Async tests: Use `async/await` properly
- Mocking: Use Bun's built-in mocking capabilities

## Common Patterns

### Unit Tests

```typescript
import { describe, it, expect } from 'bun:test';
import { UserService } from './user-service';

describe('UserService', () => {
  it('should create user with valid data', async () => {
    const service = new UserService();
    const user = await service.create({
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DatabaseService } from './database-service';

describe('Database Integration', () => {
  let db: DatabaseService;

  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('should persist and retrieve data', async () => {
    const created = await db.save({ name: 'test' });
    const retrieved = await db.findById(created.id);

    expect(retrieved).toEqual(created);
  });
});
```

### Mocking

```typescript
import { describe, it, expect, mock } from 'bun:test';
import { UserService } from './user-service';
import { EmailService } from './email-service';

const mockSendEmail = mock(() => Promise.resolve(true));

describe('UserService with mocked EmailService', () => {
  it('should send welcome email on user creation', async () => {
    const userService = new UserService(mockSendEmail);

    await userService.createUser({
      name: 'John',
      email: 'john@example.com'
    });

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'john@example.com',
      subject: 'Welcome!'
    });
  });
});
```

## Commands

```bash
bun test                    # Run all tests
bun test path/to/test.ts    # Run specific test file
bun test --watch           # Watch mode
bun test --coverage        # Run with coverage
```
