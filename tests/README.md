# Test Suite

This directory contains the complete test suite for the CC Wrapper development environment setup.

## Structure

```
tests/
├── setup-platform-detection.test.ts    # Platform detection logic tests
├── setup-dependencies.test.ts           # Dependency version checking tests
├── setup-configuration.test.ts          # Environment configuration tests
├── setup-performance.test.ts            # Performance and SLA tests
├── setup-integration.test.ts            # Integration workflow tests
├── setup-error-handling.test.ts        # Error handling and edge cases
├── health-check.test.ts                 # Health check system unit tests
├── health-check-integration.test.ts     # Health check integration tests
├── e2e/                                 # End-to-end tests (if needed)
│   └── setup-workflow.test.ts           # Complete workflow E2E tests
└── index.ts                             # Central export point
```

## Test Categories

### Unit Tests
- **setup-platform-detection.test.ts**: Tests platform detection logic for macOS, Linux, Windows
- **setup-dependencies.test.ts**: Tests version checking for all required tools
- **setup-configuration.test.ts**: Tests environment file and directory setup
- **health-check.test.ts**: Tests individual health check components

### Integration Tests
- **setup-integration.test.ts**: Tests complete setup workflow integration
- **health-check-integration.test.ts**: Tests health check system integration
- **setup-performance.test.ts**: Tests performance requirements and SLA compliance

### Error Handling Tests
- **setup-error-handling.test.ts**: Tests error scenarios, edge cases, and graceful degradation

### End-to-End Tests
- **e2e/setup-workflow.test.ts**: Tests complete real-world setup scenarios

## Test ID Convention

Tests follow the structured ID format: `{story}.{category}-{type}-{sequence}`

- **Story**: 1.0, 1.1, 1.2, etc. (from requirements)
- **Category**: Platform, dependency, configuration, health check
- **Type**: E2E (end-to-end), UNIT, INT (integration)
- **Sequence**: Sequential numbering within category

Examples:
- `1.1-E2E-001`: Story 1.1, E2E test #001
- `2.4-E2E-001`: Story 2.4, E2E test #001

## Priority Classification

Tests are classified by priority using P0-P3 system:

- **P0 (Critical)**: Core functionality, must pass for deployment
- **P1 (High)**: Important features, should pass for release
- **P2 (Medium)**: Nice-to-have features, can be addressed later
- **P3 (Low)**: Edge cases, documentation, minor issues

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Specific Test Files
```bash
bun test tests/setup-platform-detection.test.ts
bun test tests/health-check.test.ts
```

### Run Tests by Pattern
```bash
bun test tests/setup-*.test.ts    # Run all setup tests
bun test tests/*-integration.test.ts  # Run integration tests
```

### Run Tests with Coverage
```bash
bun test --coverage
```

## Test Quality Standards

All tests in this suite follow these quality standards:

✅ **Deterministic**: No random data or conditionals
✅ **Isolated**: Clean setup/teardown, no shared state
✅ **Explicit**: Clear assertions with specific expectations
✅ **Maintainable**: Use factories and fixtures, avoid duplication
✅ **Fast**: Complete within reasonable time limits
✅ **Descriptive**: Clear test names and documentation

## Test Utilities

The test suite uses comprehensive test utilities located in `/test-utils/`:

```typescript
import {
  createMockSetupEnvironment,
  setupTestEnvironment,
  setupMockConsole
} from '../test-utils'
```

See `/test-utils/README.md` for detailed usage information.

## Recent Improvements

The test suite has been recently refactored to improve maintainability:

1. **Split large test files**: Original files >300 lines split into focused modules
2. **Added data factories**: Centralized test data generation with overrides
3. **Extracted common fixtures**: Reusable setup/teardown functionality
4. **Improved organization**: Logical grouping by functionality
5. **Enhanced documentation**: Clear README files and usage examples

## Performance Requirements

Tests validate these performance requirements:

- **Setup completion**: < 60 seconds (P0 critical SLA)
- **Health checks**: < 5 seconds for service validation
- **Individual operations**: < 2 seconds per dependency check
- **File operations**: < 1 second for configuration file creation

## Coverage Areas

The test suite provides comprehensive coverage of:

- Platform detection (macOS, Linux, Windows, unsupported)
- Dependency validation (Bun, TypeScript, Docker, PostgreSQL, Redis)
- Environment configuration (.env.local, directories, VS Code setup)
- Health check system (service monitoring, reporting, status calculation)
- Performance validation (timing, SLA compliance)
- Error handling (graceful degradation, recovery, rollback)
- Integration workflows (complete setup pipeline)
- Edge cases and troubleshooting scenarios

## Contributing

When adding new tests:

1. Follow the test ID convention and priority classification
2. Use existing factories and fixtures when possible
3. Keep test files under 300 lines (split if needed)
4. Add appropriate cleanup in `afterEach()`
5. Include descriptive test names and documentation
6. Validate both positive and negative scenarios
7. Test error handling and edge cases

## Troubleshooting

### Tests Fail with Permission Errors
Ensure test files have execute permissions:
```bash
chmod +x tests/*.test.ts
```

### Tests Take Too Long
Check for:
- Hard waits instead of deterministic waits
- External network calls instead of mocks
- Inefficient file operations
- Missing cleanup causing state pollution

### Flaky Tests
Check for:
- Race conditions in async operations
- Dependency on external services
- Non-deterministic test data
- Missing proper isolation

For more detailed troubleshooting, see the test quality review documents in `/docs/`.