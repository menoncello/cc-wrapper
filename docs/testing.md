# CC Wrapper Testing Documentation

For the complete testing guide, see [tests/TESTING.md](../tests/TESTING.md).

## Quick Links

- [Comprehensive Testing Guide](../tests/TESTING.md) - Full testing
  documentation
- [Test Design - Epic 0](test-design-epic-0.md) - Epic 0 test design
- [Development Workflow](development-workflow.md) - Testing in development
  workflow
- [Troubleshooting](troubleshooting.md) - Testing troubleshooting

## Testing Overview

CC Wrapper uses a multi-level testing strategy:

### Test Types

1. **Unit Tests** - Individual functions and classes
   - Location: `tests/unit/`
   - Coverage target: ≥ 90%
   - Run with: `bun run test:unit`
2. **Integration Tests** - Multiple components together
   - Location: `tests/integration/`
   - Coverage target: ≥ 80%
   - Run with: `bun run test:integration`
3. **E2E Tests** - Complete user workflows
   - Location: `tests/e2e/`
   - Run with: `bun run test:e2e`

### Testing Framework

- **Bun Test** - Fast, native test runner for Bun
- **Playwright 1.56.0** - E2E browser testing
- **Coverage** - Built-in coverage reporting with thresholds

### Quick Start

```bash
# Run all tests
bun test

# Run specific test type
bun run test:unit
bun run test:integration
bun run test:e2e

# Run with coverage
bun run test:coverage

# Watch mode for development
bun run test:watch
```

### Writing Tests

Use the AAA (Arrange-Act-Assert) pattern with BDD-style comments:

```typescript
test('should calculate total correctly', () => {
  // GIVEN: A shopping cart with items
  const cart = new ShoppingCart();
  cart.addItem({ id: '1', price: 10, quantity: 2 });

  // WHEN: Calculating total
  const total = cart.calculateTotal();

  // THEN: Total should be correct
  expect(total).toBe(20);
});
```

### Test Utilities

Common test utilities are available in `tests/support/test-helpers.ts`:

- `TempDirectory` - Temporary directory management
- `MockConsole` - Console output capturing
- `asyncHelpers` - Async testing utilities
- `mockFactory` - Mock object creation
- `assertions` - Custom assertions
- `PerformanceMonitor` - Performance testing

### Coverage Requirements

- Overall coverage: ≥ 80%
- Critical paths: ≥ 90%
- New code: Should not decrease coverage

### Best Practices

1. **Write tests first** (TDD recommended)
2. **Test behavior, not implementation**
3. **Keep tests focused** - One assertion per test ideally
4. **Use descriptive test names**
5. **Clean up after tests** - No side effects
6. **Mock external dependencies** - Tests should be isolated

For complete testing documentation, patterns, and best practices, see
[tests/TESTING.md](../tests/TESTING.md).
