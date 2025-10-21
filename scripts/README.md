# CC Wrapper Development Scripts

This document provides a comprehensive guide to all development scripts
available in the CC Wrapper project. All scripts are run using
`bun run <script-name>`.

## Table of Contents

- [Setup & Initialization](#setup--initialization)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Services Management](#services-management)
- [Validation & Health Checks](#validation--health-checks)
- [Utilities](#utilities)

## Setup & Initialization

### `bun run setup`

Initial project setup script. Run this when first cloning the repository.

```bash
bun run setup
```

**What it does:**

- Validates Bun installation and version
- Installs dependencies across all workspaces
- Verifies project structure
- Performs initial configuration

**When to use:**

- First time setting up the project
- After major dependency updates
- When onboarding new team members

### `bun run validate`

Validates project configuration and environment variables.

```bash
bun run validate
```

**What it does:**

- Validates DATABASE_URL format and configuration
- Validates REDIS_URL format and configuration
- Checks NODE_ENV setting
- Verifies PORT configuration
- Validates required directories exist
- Checks configuration files are present
- Validates required dependencies are installed

**When to use:**

- Before starting development
- When troubleshooting configuration issues
- After modifying environment variables
- As part of CI/CD pre-flight checks

### `bun run health`

Checks the health status of all development services.

```bash
bun run health
```

**What it does:**

- Checks Bun runtime availability
- Verifies TypeScript compiler
- Tests Docker and Docker Compose
- Validates PostgreSQL connectivity
- Checks Redis connectivity
- Verifies environment variables

**When to use:**

- Before starting development work
- When debugging service connectivity issues
- As part of startup validation

## Development

### `bun run dev`

Starts the Vite development server for frontend development with hot module
replacement (HMR).

```bash
bun run dev
```

**Features:**

- Hot module replacement (HMR) for instant updates
- React Fast Refresh for component development
- Source maps for debugging
- Development mode optimizations

**Port:** Default 5173 (configurable in vite.config.ts)

### `bun run dev:backend`

Starts the backend service with watch mode for automatic reloading.

```bash
bun run dev:backend
```

**Features:**

- Automatic restart on file changes
- Source map support
- Development error reporting

### `bun run dev:all`

Starts all development services concurrently (frontend, backend, and packages).

```bash
bun run dev:all
```

**What it does:**

- Starts package development servers
- Starts backend with watch mode
- Starts frontend Vite server
- All services run in parallel

**When to use:**

- Full-stack development
- Testing integration between services
- Working across multiple packages

### `bun run start`

Complete development environment startup with validation and health checks.

```bash
bun run start
```

**What it does:**

1. Runs configuration validation
2. Performs health checks on all services
3. Starts Docker services
4. Launches all development servers

**When to use:**

- Starting a development session
- Ensuring all systems are operational
- Production-like local development

## Building

### `bun run build`

Alias for `build:all`. Builds all targets (frontend, backend, packages).

```bash
bun run build
```

### `bun run build:all`

Comprehensive build of all project components.

```bash
bun run build:all
```

**What it does:**

- Builds frontend with Vite (production optimizations)
- Builds backend with Bun (minification, source maps)
- Builds all packages with TypeScript

**Output:**

- Frontend: `dist/` directory
- Backend: `dist/` directory
- Packages: `packages/*/dist/` directories

**Performance target:** < 30 seconds total build time

### `bun run build:frontend`

Builds only the frontend application using Vite.

```bash
bun run build:frontend
```

**Features:**

- Production minification with esbuild
- Code splitting with vendor chunks
- Tree shaking for smaller bundles
- Source map generation
- Asset optimization

### `bun run build:backend`

Builds only the backend services using Bun's native build.

```bash
bun run build:backend
```

**Features:**

- Bun runtime target
- Source map generation
- Minification

### `bun run build:packages`

Builds all shared packages in the monorepo.

```bash
bun run build:packages
```

**What it does:**

- Compiles TypeScript for each package
- Generates type declarations (.d.ts files)
- Creates distributable package builds

### `bun run build:watch`

Builds frontend in watch mode for continuous building during development.

```bash
bun run build:watch
```

**When to use:**

- Testing production builds during development
- Debugging build-specific issues
- Validating build output

### `bun run preview`

Previews the production build locally.

```bash
bun run preview
```

**When to use:**

- Testing production builds before deployment
- Validating optimizations and code splitting
- Debugging production-specific issues

## Testing

### `bun run test`

Runs all tests across the project.

```bash
bun run test
```

**What it does:**

- Executes unit tests
- Executes integration tests
- Executes E2E tests
- Parallel execution for performance

**Performance target:** < 2 minutes

### `bun run test:unit`

Runs only unit tests.

```bash
bun run test:unit
```

**Coverage target:** ≥ 90% for individual units

**Location:** `tests/unit/**/*.test.ts`

### `bun run test:integration`

Runs only integration tests.

```bash
bun run test:integration
```

**Coverage target:** ≥ 80% overall

**Location:** `tests/integration/**/*.test.ts`

### `bun run test:e2e`

Runs only end-to-end tests.

```bash
bun run test:e2e
```

**Location:** `tests/e2e/**/*.test.ts`

**When to use:**

- Testing complete workflows
- Validating multi-service interactions
- Pre-deployment validation

### `bun run test:coverage`

Runs all tests with coverage reporting.

```bash
bun run test:coverage
```

**Coverage outputs:**

- Text summary in terminal
- LCOV format for CI/CD integration
- HTML report (via lcov-genhtml)

**Coverage thresholds:**

- Overall: ≥ 80%
- Critical paths: ≥ 90%

### `bun run test:watch`

Runs tests in watch mode for continuous testing during development.

```bash
bun run test:watch
```

**Features:**

- Automatic re-run on file changes
- Fast incremental testing
- Immediate feedback

### `bun run test:watch:unit`

Runs only unit tests in watch mode.

```bash
bun run test:watch:unit
```

**When to use:**

- Test-driven development (TDD)
- Rapid iteration on unit tests
- Focused unit test development

## Code Quality

### `bun run lint`

Runs ESLint to check for code quality issues.

```bash
bun run lint
```

**What it checks:**

- TypeScript type safety
- Code style compliance
- Import ordering
- Best practices adherence
- Unused variables and imports

**Configuration:** `eslint.config.js`

**Quality standard:** Zero errors, minimal warnings

### `bun run lint:fix`

Automatically fixes ESLint issues where possible.

```bash
bun run lint:fix
```

**What it fixes:**

- Import sorting
- Formatting issues
- Simple code style violations
- Unused imports (removal)

**When to use:**

- Before committing code
- After adding new imports
- Cleaning up code quality issues

### `bun run format`

Formats all code files using Prettier.

```bash
bun run format
```

**File types:**

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- JSON (.json)
- Markdown (.md)

**Configuration:** `.prettierrc.json`

### `bun run format:check`

Checks if files are formatted without modifying them.

```bash
bun run format:check
```

**When to use:**

- CI/CD validation
- Pre-commit verification
- Code review preparation

### `bun run type-check`

Runs TypeScript compiler in check mode (no output files).

```bash
bun run type-check
```

**What it checks:**

- Type safety across all files
- TypeScript strict mode compliance
- Type inference correctness
- Interface and type consistency

**Quality standard:** Zero type errors

## Services Management

### `bun run services:up`

Starts all Docker services defined in docker-compose.dev.yml.

```bash
bun run services:up
```

**Services started:**

- PostgreSQL database
- Redis cache
- Any additional development services

**Mode:** Detached (-d flag)

### `bun run services:down`

Stops and removes all Docker containers.

```bash
bun run services:down
```

**When to use:**

- Ending development session
- Freeing system resources
- Resetting service state

### `bun run services:logs`

Follows logs from all Docker services.

```bash
bun run services:logs
```

**Features:**

- Live log streaming
- All services in one view
- Timestamp information

**When to use:**

- Debugging service issues
- Monitoring service behavior
- Investigating errors

### `bun run services:restart`

Restarts all Docker services (down then up).

```bash
bun run services:restart
```

**When to use:**

- After configuration changes
- Clearing service state
- Troubleshooting service issues

## Utilities

### `bun run clean`

Removes build artifacts and cache directories.

```bash
bun run clean
```

**What it removes:**

- `dist/` - Build output
- `coverage/` - Test coverage reports
- `.bun-cache/` - Bun cache
- `packages/*/dist/` - Package build outputs

**When to use:**

- Before fresh builds
- Troubleshooting build issues
- Freeing disk space
- Cleaning up before commits

### `bun run clean:all`

Complete cleanup including all node_modules directories.

```bash
bun run clean:all
```

**What it removes:**

- Everything from `clean`
- Root `node_modules/`
- All workspace `node_modules/`

**⚠️ Warning:** Requires `bun install` afterwards

**When to use:**

- Resolving dependency conflicts
- After major dependency updates
- Complete project reset
- Troubleshooting installation issues

## Script Hooks

Some scripts are automatically triggered by Git or npm events:

### `prepare`

Automatically runs after `bun install` to initialize Husky git hooks.

### `prestart`

Runs before `start` to validate configuration and perform health checks.

## Common Workflows

### Starting Development

```bash
# First time setup
bun run setup
bun run validate
bun run health

# Start services
bun run services:up
bun run dev:all
```

### Pre-Commit Checklist

```bash
# Run all quality checks
bun run lint:fix
bun run format
bun run type-check
bun test

# Or use the pre-commit hook (automatic)
git commit -m "Your message"
```

### Full Build & Test

```bash
# Clean previous builds
bun run clean

# Build all targets
bun run build:all

# Run all tests with coverage
bun run test:coverage

# Validate everything
bun run type-check
bun run lint
bun run format:check
```

### Troubleshooting

```bash
# Validate configuration
bun run validate

# Check service health
bun run health

# View service logs
bun run services:logs

# Complete reset
bun run clean:all
bun install
bun run setup
```

## Performance Targets

- **Build time:** < 30 seconds
- **Test execution:** < 2 minutes
- **Hot reload (frontend):** < 200ms
- **Hot reload (backend):** < 1 second

## Best Practices

1. **Always run validation before starting work:**

   ```bash
   bun run validate && bun run health
   ```

2. **Use watch modes during development:**

   ```bash
   bun run test:watch:unit  # In one terminal
   bun run dev              # In another terminal
   ```

3. **Run quality checks before committing:**

   ```bash
   bun run lint:fix && bun run format && bun run type-check
   ```

4. **Clean builds periodically:**

   ```bash
   bun run clean && bun run build:all
   ```

5. **Monitor service health regularly:**
   ```bash
   bun run health
   ```

## Troubleshooting

### Script Not Found

If you see "script not found", ensure you're using `bun run` prefix:

```bash
# ❌ Wrong
npm run build

# ✅ Correct
bun run build
```

### Permission Denied

Make sure script files are executable:

```bash
chmod +x scripts/*.ts
```

### Services Won't Start

1. Check Docker is running
2. Validate configuration: `bun run validate`
3. Check service health: `bun run health`
4. View logs: `bun run services:logs`

### Build Failures

1. Clean build artifacts: `bun run clean`
2. Check TypeScript: `bun run type-check`
3. Rebuild: `bun run build:all`

### Test Failures

1. Run tests in watch mode to see details: `bun run test:watch`
2. Check for environment variable issues: `bun run validate`
3. Ensure services are running: `bun run services:up`

## Additional Resources

- [Testing Guide](../tests/TESTING.md) - Comprehensive testing documentation
- [Contributing Guide](../CONTRIBUTING.md) - Contribution guidelines
- [Tech Spec](../docs/tech-spec-epic-0.md) - Technical specifications

---

_For questions or issues with scripts, please open an issue on GitHub or consult
the development team._
