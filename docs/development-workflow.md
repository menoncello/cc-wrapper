# CC Wrapper Development Workflow

This guide provides a comprehensive overview of the development workflow for CC
Wrapper, from initial setup to production deployment.

## Table of Contents

- [Overview](#overview)
- [Initial Setup](#initial-setup)
- [Daily Development Workflow](#daily-development-workflow)
- [Feature Development](#feature-development)
- [Code Quality Workflow](#code-quality-workflow)
- [Testing Workflow](#testing-workflow)
- [Review and Merge Process](#review-and-merge-process)
- [Release Process](#release-process)

## Overview

CC Wrapper follows a modern development workflow with:

- **Monorepo structure** with Bun workspaces
- **TypeScript strict mode** for type safety
- **Automated testing** with Bun Test and Playwright
- **Continuous integration** with GitHub Actions
- **Pre-commit hooks** for code quality
- **Conventional commits** for clear history

## Initial Setup

### 1. Environment Prerequisites

Ensure you have the following installed:

```bash
# Check Bun version (>= 1.3.0)
bun --version

# Check Node.js version (>= 20.0.0)
node --version

# Check Docker version
docker --version
docker compose version
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/ccwrapper/cc-wrapper.git
cd cc-wrapper

# Run setup script
bun run setup
```

The setup script will:

- Validate your environment (Bun, Node.js versions)
- Install dependencies across all workspaces
- Initialize Git hooks with Husky
- Verify project structure
- Run initial validation checks

### 3. Configure Environment

Create `.env.local` in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://ccwrapper:password@localhost:5432/ccwrapper_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
NODE_ENV=development
PORT=3000

# Optional: API Keys
# OPENAI_API_KEY=your_key_here
```

### 4. Start Services

```bash
# Start Docker services (PostgreSQL, Redis)
bun run services:up

# Verify services are healthy
bun run health
```

### 5. Verify Installation

```bash
# Run validation
bun run validate

# Run all tests
bun test

# Build the project
bun run build:all
```

If all commands complete successfully, your environment is ready!

## Daily Development Workflow

### Morning Routine

```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Update dependencies (if needed)
bun install

# 3. Start services
bun run services:up

# 4. Verify environment health
bun run health

# 5. Run tests to ensure everything works
bun test
```

### Starting Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Start development servers
bun run dev:all  # Frontend + Backend + Packages

# Or start individually:
bun run dev           # Frontend only (Vite)
bun run dev:backend   # Backend only (with watch mode)
```

### Active Development

While developing:

1. **Frontend changes** - Auto-reload with HMR (< 200ms)
2. **Backend changes** - Auto-restart with watch mode (< 1s)
3. **Test changes** - Run in watch mode:

   ```bash
   # Terminal 1: Development server
   bun run dev

   # Terminal 2: Test watch mode
   bun run test:watch:unit
   ```

### End of Day

```bash
# Ensure all changes are committed
git status

# Stop services to free resources
bun run services:down

# Optional: Clean build artifacts
bun run clean
```

## Feature Development

### 1. Planning Phase

Before writing code:

1. **Review requirements** - Understand the feature specifications
2. **Check existing code** - Look for similar patterns or components
3. **Plan approach** - Outline the implementation strategy
4. **Identify tests** - Think about test scenarios upfront

### 2. Implementation Phase

#### a. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/user-authentication
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation
- `test/` - Test improvements

#### b. Test-Driven Development (Recommended)

```bash
# 1. Write failing tests
# tests/unit/auth/user-service.test.ts

# 2. Run tests (they should fail)
bun run test:watch:unit

# 3. Implement the feature
# src/auth/user-service.ts

# 4. Tests should pass
# Continue refining until all tests pass
```

#### c. Code While Maintaining Quality

Run quality checks frequently:

```bash
# Type check
bun run type-check

# Lint and auto-fix
bun run lint:fix

# Format code
bun run format
```

### 3. Quality Assurance Phase

Before committing, ensure:

```bash
# All tests pass
bun test

# No type errors
bun run type-check

# No linting errors
bun run lint

# Code is formatted
bun run format:check

# Build succeeds
bun run build:all
```

### 4. Documentation Phase

Update relevant documentation:

- Add JSDoc comments to public APIs
- Update README if adding user-facing features
- Create/update technical documentation
- Add examples for complex features

## Code Quality Workflow

### Pre-Commit Checks (Automatic)

Git hooks automatically run on `git commit`:

1. **Lint staged files** - ESLint with auto-fix
2. **Format staged files** - Prettier with auto-write
3. **Validate changes** - Ensure no errors

If checks fail, the commit is rejected. Fix issues and try again.

### Manual Quality Checks

Run these before pushing or creating a PR:

```bash
# Complete quality check
bun run type-check && \
  bun run lint && \
  bun run format:check && \
  bun test

# If all pass, you're ready to push!
```

### TypeScript Best Practices

```typescript
// ✅ DO: Explicit types for public APIs
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ❌ DON'T: Implicit any or missing types
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ✅ DO: Use interfaces for complex types
interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

// ❌ DON'T: Use 'any'
function processItem(item: any) {
  // ...
}
```

### ESLint Best Practices

```typescript
// ✅ DO: Fix the underlying issue
logger.debug('User logged in', { userId });

// ❌ DON'T: Disable ESLint rules
// eslint-disable-next-line no-console
console.log('User logged in');

// ✅ DO: Organize imports properly (auto-sorted by ESLint)
import { useState } from 'react';
import path from 'path';

import { UserService } from '@/services/user';

import { Button } from './Button';
```

## Testing Workflow

### Test Levels

1. **Unit Tests** - Individual functions/classes

   ```bash
   bun run test:unit
   ```

   - Coverage target: ≥ 90%
   - Fast execution (< 1s for all unit tests)
   - No external dependencies

2. **Integration Tests** - Multiple components together

   ```bash
   bun run test:integration
   ```

   - Coverage target: ≥ 80%
   - May use real file system, database
   - Moderate execution time

3. **E2E Tests** - Complete user workflows

   ```bash
   bun run test:e2e
   ```

   - Cover critical paths
   - May be slower
   - Test real application behavior

### Writing Tests

Use the AAA pattern with BDD comments:

```typescript
import { describe, expect, test } from 'bun:test';

describe('UserService', () => {
  test('should create user with valid data', async () => {
    // GIVEN: Valid user data
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };
    const userService = new UserService();

    // WHEN: Creating user
    const user = await userService.create(userData);

    // THEN: User should be created with correct data
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.id).toBeDefined();
  });
});
```

### Test Coverage

```bash
# Generate coverage report
bun run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

Coverage thresholds:

- Overall: ≥ 80%
- Critical paths: ≥ 90%
- New code: Should not decrease overall coverage

### Continuous Testing

During development, use watch mode:

```bash
# Watch all tests
bun run test:watch

# Watch only unit tests
bun run test:watch:unit
```

Tests re-run automatically on file changes.

## Review and Merge Process

### 1. Create Pull Request

```bash
# Push your branch
git push origin feature/user-authentication

# Create PR on GitHub
# Use the PR template and fill all sections
```

### 2. PR Checklist

Before requesting review:

- [ ] All tests pass locally
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code is formatted with Prettier
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Commit messages follow convention
- [ ] PR description is complete

### 3. Automated Checks

GitHub Actions will automatically run:

- TypeScript type checking
- ESLint validation
- Prettier format check
- Unit tests
- Integration tests
- E2E tests
- Build verification
- PR size labeling
- Secret scanning

All checks must pass before merge.

### 4. Code Review

Reviewers will check:

- Code quality and clarity
- Test coverage
- Documentation completeness
- Adherence to patterns
- Performance considerations
- Security implications

### 5. Addressing Feedback

```bash
# Make requested changes
# ... edit files ...

# Commit changes
git add .
git commit -m "refactor: address review feedback"

# Push updates
git push origin feature/user-authentication
```

### 6. Merge

Once approved and all checks pass:

- **Squash and merge** to main branch
- Delete feature branch after merge
- Automated deployment may trigger (depending on branch)

## Release Process

### Version Tagging

```bash
# Create and push version tag
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

This triggers:

1. Automated build of all targets
2. Test execution
3. Release artifact creation
4. GitHub release with changelog

### Semantic Versioning

- **Major (1.0.0):** Breaking changes
- **Minor (0.1.0):** New features (backward compatible)
- **Patch (0.0.1):** Bug fixes

### Deployment

Deployments are triggered automatically:

- **Main branch:** Deploys to staging environment
- **Version tags:** Deploys to production environment

Monitor deployment:

```bash
# Check GitHub Actions for deployment status
# View deployment logs in CI/CD dashboard
```

## Troubleshooting

### Common Issues

**Services won't start:**

```bash
bun run services:down
bun run services:up
bun run health
```

**Tests failing unexpectedly:**

```bash
bun run clean
bun install
bun test
```

**Type errors after update:**

```bash
bun install
bun run type-check
```

**Build failures:**

```bash
bun run clean
bun run build:all
```

For more troubleshooting help, see
[docs/troubleshooting.md](troubleshooting.md).

## Additional Resources

- [Contributing Guide](../CONTRIBUTING.md)
- [Build Process](build-process.md)
- [Testing Guide](../tests/TESTING.md)
- [Scripts Reference](../scripts/README.md)
- [Troubleshooting Guide](troubleshooting.md)

---

**Questions?** Open a
[GitHub Discussion](https://github.com/ccwrapper/cc-wrapper/discussions) or
check existing [Issues](https://github.com/ccwrapper/cc-wrapper/issues).
