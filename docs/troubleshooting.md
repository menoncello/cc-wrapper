# CC Wrapper Troubleshooting Guide

This guide provides solutions to common issues you may encounter while
developing with CC Wrapper.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Development Issues](#development-issues)
- [Build Issues](#build-issues)
- [Test Issues](#test-issues)
- [Service Issues](#service-issues)
- [Performance Issues](#performance-issues)
- [Getting Help](#getting-help)

## Setup Issues

### Bun Installation Fails

**Symptom:** Cannot install or run Bun

**Causes & Solutions:**

```bash
# Check if Bun is installed
bun --version

# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Install Bun (Windows)
# Use WSL2 or see https://bun.sh/docs/installation

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Verify installation
bun --version  # Should show >= 1.3.0
```

### Dependency Installation Fails

**Symptom:** `bun install` errors or hangs

**Solutions:**

```bash
# Clear Bun cache
rm -rf ~/.bun/install/cache

# Remove node_modules
rm -rf node_modules

# Remove lock file
rm -f bun.lockb

# Reinstall
bun install

# If still failing, try with frozen lockfile
bun install --frozen-lockfile
```

### Setup Script Fails

**Symptom:** `bun run setup` errors

**Common Causes:**

1. **Missing Bun or Node.js**

   ```bash
   # Check versions
   bun --version  # >= 1.3.0
   node --version # >= 20.0.0
   ```

2. **Permission errors**

   ```bash
   # Fix permissions
   chmod +x setup.ts
   chmod +x scripts/*.ts
   ```

3. **Git not initialized**

   ```bash
   # Initialize git
   git init
   ```

### Environment Variable Issues

**Symptom:** Application can't connect to services

**Solution:**

```bash
# Create .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://ccwrapper:password@localhost:5432/ccwrapper_dev
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
EOF

# Verify variables load
bun run validate
```

## Development Issues

### Hot Reload Not Working

**Symptom:** Changes don't reflect immediately

**Solutions:**

```bash
# Frontend (Vite)
# 1. Restart dev server
# Press Ctrl+C, then:
bun run dev

# 2. Clear Vite cache
rm -rf node_modules/.vite
bun run dev

# 3. Hard refresh browser
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

# Backend
# 1. Restart with clean cache
bun run clean
bun run dev:backend

# 2. Check watch mode is enabled
# Should see --watch flag in command
```

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE :::3000`

**Solutions:**

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 bun run dev
```

### Module Not Found

**Symptom:** `Cannot find module '@/components/Button'`

**Causes & Solutions:**

```bash
# 1. Check path alias in tsconfig.json
cat tsconfig.json | grep paths

# 2. Reinstall dependencies
rm -rf node_modules
bun install

# 3. Check import path
# ✅ Correct
import { Button } from '@/components/Button';

# ❌ Incorrect
import { Button } from 'components/Button';

# 4. Restart TypeScript server (VS Code)
# Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### TypeScript Errors After Update

**Symptom:** Sudden type errors after pulling changes

**Solutions:**

```bash
# 1. Reinstall dependencies
bun install

# 2. Clear TypeScript cache
rm -rf node_modules/.cache

# 3. Restart IDE/TS server

# 4. Check TypeScript version
bunx tsc --version

# 5. Run type check
bun run type-check
```

## Build Issues

### Build Fails with Type Errors

**Symptom:** `bun run build:all` fails with TypeScript errors

**Solutions:**

```bash
# 1. Run type check to see all errors
bun run type-check

# 2. Fix type errors (don't use @ts-ignore)
# Example: Add proper types
interface User {
  id: string;
  name: string;
}

# 3. Rebuild
bun run build:all
```

### Build Fails with "Out of Memory"

**Symptom:** Build crashes with memory error

**Solutions:**

```bash
# 1. Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" bun run build:all

# 2. Build targets separately
bun run build:frontend
bun run build:backend
bun run build:packages

# 3. Clean before building
bun run clean
bun run build:all

# 4. Close other applications
# Free up system memory
```

### Build is Very Slow

**Symptom:** Build takes > 1 minute

**Solutions:**

```bash
# 1. Clean build cache
bun run clean
rm -rf node_modules/.vite
rm -rf .bun-cache

# 2. Check for large dependencies
du -sh node_modules/* | sort -hr | head -20

# 3. Use build:watch during development
bun run build:watch

# 4. Ensure SSD is not full
df -h
```

### Vite Build Fails

**Symptom:** Frontend build errors

**Solutions:**

```bash
# 1. Check Vite config
cat vite.config.ts

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Verify React dependencies
bun list react react-dom

# 4. Check for circular dependencies
# Review import statements

# 5. Rebuild
bun run build:frontend
```

## Test Issues

### Tests Fail After Pulling Changes

**Symptom:** Previously passing tests now fail

**Solutions:**

```bash
# 1. Reinstall dependencies
rm -rf node_modules
bun install

# 2. Clear test cache
rm -rf coverage

# 3. Run tests
bun test

# 4. If specific test fails, run in isolation
bun test tests/unit/my-test.test.ts
```

### Test Timeout Errors

**Symptom:** `Error: Test timeout of 5000ms exceeded`

**Solutions:**

```bash
# 1. Increase timeout in bunfig.toml
# Edit bunfig.toml:
[test]
timeout = 10000  # Increase from 5000 to 10000

# 2. Or set timeout per test
test('slow operation', async () => {
  // ... test code
}, { timeout: 10000 });

# 3. Check for hanging promises
# Ensure all async operations complete
await Promise.all([...]);
```

### Coverage Below Threshold

**Symptom:** Coverage test fails with low coverage

**Solutions:**

```bash
# 1. Check coverage report
bun run test:coverage

# 2. View detailed HTML report
open coverage/lcov-report/index.html

# 3. Add tests for uncovered code
# Focus on red/yellow highlighted code

# 4. ❌ DON'T lower thresholds
# ✅ DO add more tests
```

### E2E Tests Failing

**Symptom:** Playwright E2E tests fail

**Solutions:**

```bash
# 1. Ensure services are running
bun run services:up
bun run health

# 2. Check browser installation
bunx playwright install

# 3. Run E2E tests with UI
bunx playwright test --ui

# 4. Check test selectors
# Ensure data-testid attributes exist

# 5. Increase timeout for slow operations
await page.waitForSelector('[data-testid="button"]', {
  timeout: 10000
});
```

## Service Issues

### Docker Services Won't Start

**Symptom:** `bun run services:up` fails

**Solutions:**

```bash
# 1. Check Docker is running
docker ps

# 2. Check Docker Compose file
docker compose -f docker-compose.dev.yml config

# 3. View service logs
docker compose -f docker-compose.dev.yml logs

# 4. Remove containers and restart
bun run services:down
docker compose -f docker-compose.dev.yml rm -f
bun run services:up

# 5. Check for port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Cannot Connect to PostgreSQL

**Symptom:** Database connection errors

**Solutions:**

```bash
# 1. Check PostgreSQL is running
docker compose -f docker-compose.dev.yml ps

# 2. Check DATABASE_URL
echo $DATABASE_URL
# Should be: postgresql://ccwrapper:password@localhost:5432/ccwrapper_dev

# 3. Test connection
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U ccwrapper -d ccwrapper_dev

# 4. Check logs
docker compose -f docker-compose.dev.yml logs postgres

# 5. Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres
```

### Cannot Connect to Redis

**Symptom:** Redis connection errors

**Solutions:**

```bash
# 1. Check Redis is running
docker compose -f docker-compose.dev.yml ps

# 2. Test connection
docker compose -f docker-compose.dev.yml exec redis redis-cli ping
# Should return: PONG

# 3. Check REDIS_URL
echo $REDIS_URL
# Should be: redis://localhost:6379

# 4. Check logs
docker compose -f docker-compose.dev.yml logs redis

# 5. Restart Redis
docker compose -f docker-compose.dev.yml restart redis
```

### Health Check Fails

**Symptom:** `bun run health` shows unhealthy services

**Solutions:**

```bash
# 1. Run health check for details
bun run health

# 2. Check each service individually
docker compose -f docker-compose.dev.yml ps

# 3. Verify environment variables
bun run validate

# 4. Restart all services
bun run services:restart

# 5. Check Docker resource limits
# Ensure Docker has enough memory (>= 4GB)
```

## Performance Issues

### Slow Application Startup

**Symptom:** App takes > 10 seconds to start

**Solutions:**

```bash
# 1. Check services are already running
bun run health

# 2. Use dev:all for concurrent startup
bun run dev:all

# 3. Clear caches
bun run clean
rm -rf node_modules/.vite

# 4. Check system resources
top  # macOS/Linux
taskmgr  # Windows

# 5. Close unnecessary applications
```

### Slow Test Execution

**Symptom:** Tests take > 2 minutes

**Solutions:**

```bash
# 1. Run tests in parallel (default)
# Check bunfig.toml:
[test]
concurrent = true
maxConcurrency = 20

# 2. Run specific test types
bun run test:unit  # Fastest

# 3. Use test:watch for development
bun run test:watch

# 4. Check for slow tests
bun test --reporter verbose
```

### High Memory Usage

**Symptom:** System runs out of memory

**Solutions:**

```bash
# 1. Check memory usage
ps aux | grep bun
ps aux | grep node

# 2. Stop unused services
bun run services:down

# 3. Clear caches
bun run clean

# 4. Close development tools
# Close terminals, browsers, etc.

# 5. Increase system swap
# Or add more RAM
```

## ESLint and Prettier Issues

### ESLint Errors Block Commit

**Symptom:** Git hooks prevent commit due to ESLint errors

**Solutions:**

```bash
# 1. Run lint with auto-fix
bun run lint:fix

# 2. Check specific errors
bun run lint

# 3. Fix errors (don't disable rules)
# ❌ NEVER: // eslint-disable-next-line
# ✅ FIX: Resolve the underlying issue

# 4. Commit again
git commit -m "fix: resolve linting errors"
```

### Prettier Formatting Conflicts

**Symptom:** Code keeps getting reformatted

**Solutions:**

```bash
# 1. Run Prettier
bun run format

# 2. Check .prettierrc.json
cat .prettierrc.json

# 3. Ensure editor uses project Prettier
# VS Code: Install "Prettier - Code formatter"
# Enable "Format on Save"

# 4. Format all files
bun run format
```

### Import Sorting Issues

**Symptom:** ESLint complains about import order

**Solutions:**

```bash
# 1. Auto-fix import sorting
bun run lint:fix

# 2. Manually organize:
// 1. External dependencies
import { useState } from 'react';

// 2. Internal dependencies
import { UserService } from '@/services/user';

// 3. Relative imports
import { Button } from './Button';

# 3. Commit changes
git add .
git commit -m "style: fix import sorting"
```

## Getting Help

### Documentation

- [Contributing Guide](../CONTRIBUTING.md)
- [Development Workflow](development-workflow.md)
- [Build Process](build-process.md)
- [Testing Guide](../tests/TESTING.md)
- [Scripts Reference](../scripts/README.md)

### GitHub Resources

- [Issues](https://github.com/ccwrapper/cc-wrapper/issues) - Report bugs
- [Discussions](https://github.com/ccwrapper/cc-wrapper/discussions) - Ask
  questions
- [Wiki](https://github.com/ccwrapper/cc-wrapper/wiki) - Additional docs

### Debugging Commands

```bash
# System information
bun --version
node --version
docker --version
git --version

# Project validation
bun run validate
bun run health

# Check configuration
cat package.json | grep '"version"'
cat tsconfig.json
cat vite.config.ts

# View logs
docker compose -f docker-compose.dev.yml logs
bun run services:logs

# Clean everything
bun run clean:all
bun install
bun run setup
```

### Creating a Bug Report

When reporting issues, include:

1. **Environment:**

   ```bash
   bun --version
   node --version
   uname -a  # OS information
   ```

2. **Steps to reproduce:**

   ```bash
   bun install
   bun run dev
   # Error occurs when...
   ```

3. **Expected behavior:**
   - What should happen

4. **Actual behavior:**
   - What actually happens
   - Include error messages
   - Include stack traces

5. **Screenshots/logs:**
   - Terminal output
   - Browser console
   - Service logs

### Emergency Fixes

**Complete reset:**

```bash
# Stop all services
bun run services:down

# Remove all build artifacts and dependencies
bun run clean:all

# Reinstall everything
bun install

# Run setup
bun run setup

# Start services
bun run services:up

# Verify
bun run health
bun test
```

**Database reset:**

```bash
# Stop services
bun run services:down

# Remove database volume
docker volume rm ccwrapper_postgres-data

# Restart services
bun run services:up

# Run migrations
# (when migrations are implemented)
```

---

**Still stuck?** Open a
[GitHub Issue](https://github.com/ccwrapper/cc-wrapper/issues/new) with detailed
information about your problem.
