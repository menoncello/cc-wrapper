# Contributing to CC Wrapper

Thank you for your interest in contributing to CC Wrapper! This document
provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Development Scripts](#development-scripts)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to
follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before
contributing.

## Getting Started

### Prerequisites

- **Bun** >= 1.3.0 ([Installation Guide](https://bun.sh/docs/installation))
- **Node.js** >= 20.0.0 (for compatibility)
- **Docker** and **Docker Compose** (for services)
- **Git** (for version control)

### Initial Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/your-username/cc-wrapper.git
   cd cc-wrapper
   ```

2. **Run the setup script:**

   ```bash
   bun run setup
   ```

   This will:
   - Validate your environment
   - Install all dependencies
   - Set up Git hooks (Husky)
   - Verify project structure

3. **Validate your environment:**

   ```bash
   bun run validate
   ```

   This checks your configuration and environment variables.

4. **Start development services:**

   ```bash
   bun run services:up
   ```

   This starts PostgreSQL, Redis, and other Docker services.

5. **Verify everything works:**

   ```bash
   bun run health
   bun test
   ```

### Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://ccwrapper:password@localhost:5432/ccwrapper_dev

# Redis
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
PORT=3000
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Make Your Changes

Follow the [Code Standards](#code-standards) and write tests for your changes.

### 3. Test Your Changes

```bash
# Run all tests
bun test

# Run specific test types
bun run test:unit
bun run test:integration
bun run test:e2e

# Run tests with coverage
bun run test:coverage
```

### 4. Ensure Code Quality

```bash
# Type checking
bun run type-check

# Linting
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Or run all quality checks at once
bun run type-check && bun run lint && bun run format:check
```

### 5. Commit Your Changes

Follow the [Commit Message Convention](#commit-message-convention).

```bash
git add .
git commit -m "feat: add user authentication"
```

Git hooks will automatically:

- Run ESLint on staged files
- Run Prettier on staged files
- Prevent commits with linting errors

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Standards

### TypeScript

- **Strict mode enabled** - All code must pass TypeScript strict type checking
- **No `any` types** - Use proper types or `unknown` with type guards
- **Explicit return types** - For public functions and methods
- **No implicit returns** - All code paths must explicitly return values

### Code Style

We use **Prettier** for consistent formatting and **ESLint** for code quality.

**Key rules:**

- Single quotes for strings
- 2 spaces for indentation
- 100 character line length
- No trailing commas
- Semicolons required
- Arrow functions preferred over function expressions

### Import Organization

Imports are automatically sorted by ESLint:

```typescript
// 1. External dependencies
import { useState } from 'react';
import path from 'path';

// 2. Internal dependencies
import { UserService } from '@/services/user';

// 3. Relative imports
import { Button } from './Button';
```

### Naming Conventions

- **Files:** kebab-case (`user-service.ts`)
- **Classes:** PascalCase (`UserService`)
- **Functions:** camelCase (`getUserById`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces:** PascalCase, optionally prefixed with `I` (`IUserService` or
  `UserService`)

### ESLint Rules

**CRITICAL:** Never disable ESLint rules with inline comments:

```typescript
// ❌ NEVER DO THIS
// eslint-disable-next-line no-console
console.log('debug');

// ✅ DO THIS - Fix the underlying issue
logger.debug('debug message');
```

If ESLint flags an issue, **fix the code**, don't disable the rule.

## Testing Guidelines

### Test Coverage Requirements

- **Unit tests:** ≥ 90% coverage for individual units
- **Integration tests:** ≥ 80% overall coverage
- **E2E tests:** Cover critical user workflows

### Test Structure

Use the **Arrange-Act-Assert (AAA)** pattern with BDD-style comments:

```typescript
test('should calculate total price correctly', () => {
  // GIVEN: A shopping cart with items
  const cart = new ShoppingCart();
  cart.addItem({ id: '1', price: 10, quantity: 2 });
  cart.addItem({ id: '2', price: 5, quantity: 1 });

  // WHEN: Calculating total
  const total = cart.calculateTotal();

  // THEN: Total should be sum of all items
  expect(total).toBe(25);
});
```

### Test Naming

- Descriptive test names explaining the scenario
- Use `should` prefix for expected behavior
- Group related tests with `describe` blocks

### Test Location

```
tests/
├── unit/          # Unit tests for individual functions/classes
├── integration/   # Integration tests for multiple components
├── e2e/           # End-to-end workflow tests
└── support/       # Test utilities and helpers
```

### Mutation Testing

**CRITICAL:** Never reduce mutation testing thresholds to make tests pass.

If mutation score is below threshold:

- ✅ **ADD MORE TESTS** to kill surviving mutants
- ✅ **IMPROVE TEST QUALITY** to cover edge cases
- ❌ **NEVER LOWER THRESHOLDS** as a shortcut

## Commit Message Convention

We follow the **Conventional Commits** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no code change)
- `refactor:` - Code refactoring (no feature change or bug fix)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, build config)
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `build:` - Build system changes

### Examples

```bash
feat(auth): add user authentication with JWT
fix(api): handle null response from user service
docs(readme): update installation instructions
test(user): add unit tests for UserService
refactor(cart): simplify cart calculation logic
```

### Scope (Optional)

The scope specifies the affected area:

- `auth` - Authentication
- `api` - API endpoints
- `ui` - User interface
- `db` - Database
- `build` - Build system
- `deps` - Dependencies

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass:**

   ```bash
   bun test
   ```

2. **Run quality checks:**

   ```bash
   bun run type-check
   bun run lint
   bun run format:check
   ```

3. **Build the project:**

   ```bash
   bun run build:all
   ```

4. **Update documentation** if needed

5. **Add yourself to contributors** (if first contribution)

### Creating a PR

1. **Use the PR template** - Fill out all sections
2. **Link related issues** - Use "Closes #123" or "Fixes #456"
3. **Provide clear description** - Explain what changed and why
4. **Add screenshots/recordings** - For UI changes
5. **Mark as draft** if work in progress

### PR Title Format

Follow the same convention as commit messages:

```
feat(auth): add user authentication system
```

### PR Checklist

Before requesting review, ensure:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] TypeScript type check passes
- [ ] ESLint validation passes
- [ ] Prettier formatting applied
- [ ] All tests pass
- [ ] Test coverage maintained or improved

### Code Review Process

1. **Automated checks** run via GitHub Actions
2. **Code owners** are automatically assigned as reviewers
3. **At least one approval** required before merging
4. **Address feedback** - Respond to all review comments
5. **Squash merge** - Maintain clean commit history

### PR Size Guidelines

- **XS:** < 100 lines - Quick review
- **S:** 100-300 lines - Standard review
- **M:** 300-500 lines - May need multiple reviewers
- **L:** 500-1000 lines - Consider splitting
- **XL:** > 1000 lines - Should be split into smaller PRs

Large PRs take longer to review. Consider splitting into smaller, focused PRs.

## Development Scripts

### Most Used Scripts

```bash
# Development
bun run dev              # Start frontend dev server
bun run dev:backend      # Start backend with watch mode
bun run dev:all          # Start all services concurrently

# Testing
bun test                 # Run all tests
bun run test:coverage    # Run tests with coverage
bun run test:watch       # Run tests in watch mode

# Code Quality
bun run lint:fix         # Fix linting issues
bun run format           # Format all files
bun run type-check       # TypeScript type checking

# Building
bun run build:all        # Build all targets
bun run clean            # Clean build artifacts

# Services
bun run services:up      # Start Docker services
bun run services:down    # Stop Docker services
bun run services:logs    # View service logs

# Validation
bun run validate         # Validate configuration
bun run health           # Check service health
```

For a complete list of available scripts, see
[scripts/README.md](scripts/README.md).

## Additional Resources

- [Development Workflow Guide](docs/development-workflow.md)
- [Build Process Documentation](docs/build-process.md)
- [Testing Guide](tests/TESTING.md)
- [Troubleshooting Guide](docs/troubleshooting.md)
- [Scripts Reference](scripts/README.md)

## Getting Help

- **Documentation:** Check the [docs/](docs/) directory
- **Issues:** Search existing
  [GitHub issues](https://github.com/ccwrapper/cc-wrapper/issues)
- **Discussions:** Start a
  [GitHub discussion](https://github.com/ccwrapper/cc-wrapper/discussions)
- **Chat:** Join our development chat (link TBD)

## License

By contributing to CC Wrapper, you agree that your contributions will be
licensed under the project's [MIT License](LICENSE).

---

Thank you for contributing to CC Wrapper! 🎉
