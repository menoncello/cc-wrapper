# Turborepo Configuration

This document explains the Turborepo setup for the CC Wrapper monorepo.

## Overview

Turborepo is configured to optimize build, test, and development workflows
across the monorepo packages.

## Key Features

### 1. **Intelligent Caching**

- ✅ Local caching enabled (`.turbo/` directory)
- ⚡ Dramatically speeds up builds (1000ms → 26ms)
- 🔄 Cache invalidation based on file changes

### 2. **Task Orchestration**

- 📦 Parallel execution of independent tasks
- 🔗 Dependency graph resolution (`dependsOn`)
- 🎯 Selective execution with filters

### 3. **Optimized Builds**

- 🏗️ Build only what changed
- 📊 Smart input/output tracking
- 🌍 Environment variable management

## Configuration Files

### `turbo.json`

Main configuration file defining tasks and dependencies.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### `.turboignore`

Files to ignore when determining cache hits.

### `package.json`

- `packageManager`: Specifies Bun version
- `workspaces`: Defines monorepo structure

## Usage

### Build All Packages

```bash
turbo run build
```

### Build Specific Package

```bash
turbo run build --filter=@cc-wrapper/shared-utils
```

### Run Tests

```bash
turbo run test
```

### Development Mode

```bash
turbo run dev
```

### Lint All

```bash
turbo run lint
```

### Clear Cache

```bash
rm -rf .turbo
# or
bun run clean
```

## Task Definitions

| Task         | Description        | Cached | Dependencies |
| ------------ | ------------------ | ------ | ------------ |
| `build`      | Build all packages | ✅ Yes | `^build`     |
| `test`       | Run all tests      | ✅ Yes | `^build`     |
| `lint`       | Lint all code      | ✅ Yes | -            |
| `format`     | Format all code    | ❌ No  | -            |
| `dev`        | Start dev servers  | ❌ No  | `^build`     |
| `type-check` | TypeScript check   | ✅ Yes | `^build`     |

## Package Structure

```
packages/
  ├── shared-utils/        # Shared utilities
  │   ├── src/
  │   ├── dist/           # Build output
  │   ├── package.json
  │   └── tsconfig.json
  └── [other-packages]/
```

## Performance Benefits

### Before Turbo

```bash
bun run build:all
# Time: ~3-5 seconds (sequential)
```

### With Turbo (First Run)

```bash
turbo run build
# Time: ~1-2 seconds (parallel + caching)
```

### With Turbo (Cached)

```bash
turbo run build
# Time: ~20-50ms ⚡ FULL TURBO
```

## Environment Variables

Global env vars configured in `turbo.json`:

- `NODE_ENV`
- `CI`
- `DATABASE_URL`
- `REDIS_URL`

## Cache Strategies

### What Gets Cached

- ✅ Build outputs (`dist/`, `build/`)
- ✅ Test results (`coverage/`)
- ✅ Type checking results
- ✅ Lint results

### What Doesn't Get Cached

- ❌ Dev servers (persistent tasks)
- ❌ Format operations
- ❌ Service management
- ❌ E2E tests (marked as `cache: false`)

## Remote Caching

Currently **disabled** (local-only).

To enable remote caching (team collaboration):

1. Sign up at [https://vercel.com/](https://vercel.com/)
2. Link repository: `turbo link`
3. Remote cache will be automatically enabled

## Troubleshooting

### Cache Not Working

```bash
# Clear cache and rebuild
turbo run build --force
```

### Dependency Issues

```bash
# Check dependency graph
turbo run build --dry=json
```

### Task Not Found

Ensure task is defined in `turbo.json`

## Best Practices

1. **Define Outputs**: Always specify `outputs` for cached tasks
2. **Use Dependencies**: Use `dependsOn` to ensure correct build order
3. **Filter Strategically**: Use `--filter` for targeted builds
4. **Environment Variables**: Declare all env vars in `globalEnv`
5. **Ignore Wisely**: Use `.turboignore` for test files and docs

## Integration with CI/CD

Example GitHub Actions:

```yaml
- name: Build with Turbo
  run: turbo run build

- name: Test with Turbo
  run: turbo run test
```

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Bun + Turbo Guide](https://turbo.build/repo/docs/handbook/package-managers/bun)
- [Caching Strategy](https://turbo.build/repo/docs/core-concepts/caching)

---

**Status**: ✅ Configured and tested **Version**: Turbo 2.5.8 **Last Updated**:
October 20, 2025
