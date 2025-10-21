# CC Wrapper Deployment Guide

This guide covers the deployment process for CC Wrapper, from staging to
production environments.

## Table of Contents

- [Overview](#overview)
- [Deployment Environments](#deployment-environments)
- [Automated Deployments](#automated-deployments)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Deployment Verification](#deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)

## Overview

CC Wrapper uses automated CI/CD pipelines for deployments:

- **Staging:** Automatic deployment on `main` branch merges
- **Production:** Automatic deployment on version tag creation
- **Platform:** Configured for containerized deployment (Docker)
- **Build artifacts:** Generated during CI/CD pipeline

## Deployment Environments

### Development

- **Purpose:** Local development and testing
- **Deployment:** Manual (local machine)
- **Services:** Docker Compose
- **URL:** http://localhost:3000

**Start development:**

```bash
bun run services:up
bun run dev:all
```

### Staging

- **Purpose:** Pre-production testing and QA
- **Trigger:** Automatic on merge to `main` branch
- **Services:** Cloud-hosted (configuration TBD)
- **URL:** https://staging.ccwrapper.dev (TBD)

**Deployment flow:**

1. PR merged to `main`
2. CI/CD builds and tests
3. Automatic deployment to staging
4. Health checks verify deployment
5. Team notified of deployment

### Production

- **Purpose:** Live environment for end users
- **Trigger:** Automatic on version tag (e.g., `v1.2.0`)
- **Services:** Cloud-hosted (configuration TBD)
- **URL:** https://ccwrapper.dev (TBD)

**Deployment flow:**

1. Version tag created
2. CI/CD builds and tests
3. Build artifacts created
4. Automatic deployment to production
5. Health checks verify deployment
6. GitHub release created with changelog

## Automated Deployments

### GitHub Actions Workflows

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and PR:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

**Steps:**

1. Quality checks (TypeScript, ESLint, Prettier)
2. Test matrix (unit, integration, E2E)
3. Coverage reporting
4. Build all targets
5. Status check aggregation

#### Release Workflow (`.github/workflows/release.yml`)

Runs on version tags:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

**Steps:**

1. Build and test all targets
2. Upload build artifacts
3. Generate release notes
4. Create GitHub release
5. (Future) Deploy to production

### Triggering Deployments

#### Staging Deployment

```bash
# 1. Create PR
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature

# 2. Create PR on GitHub

# 3. Get approval and merge
# Staging deployment triggers automatically
```

#### Production Deployment

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create version tag
git tag -a v1.2.0 -m "Release version 1.2.0: Add user authentication"

# 3. Push tag
git push origin v1.2.0

# 4. Monitor GitHub Actions
# Production deployment triggers automatically
```

### Semantic Versioning

Follow semantic versioning (SemVer):

- **Major version (1.0.0):** Breaking changes
- **Minor version (0.1.0):** New features (backward compatible)
- **Patch version (0.0.1):** Bug fixes

**Examples:**

```bash
# Breaking changes
git tag -a v2.0.0 -m "Release v2.0.0: API v2 with breaking changes"

# New features
git tag -a v1.3.0 -m "Release v1.3.0: Add dashboard feature"

# Bug fixes
git tag -a v1.2.1 -m "Release v1.2.1: Fix authentication bug"
```

## Manual Deployment

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- Build artifacts available

### Building for Production

```bash
# 1. Clean previous builds
bun run clean

# 2. Install production dependencies
bun install --production

# 3. Build all targets
bun run build:all

# 4. Verify build
ls -lh dist/
```

### Docker Deployment

#### Build Docker Image

```dockerfile
# Dockerfile (example)
FROM oven/bun:1.3.0

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/ ./packages/

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source and build
COPY . .
RUN bun run build:all

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "dist/index.js"]
```

**Build and run:**

```bash
# Build image
docker build -t ccwrapper:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e REDIS_URL=$REDIS_URL \
  -e NODE_ENV=production \
  ccwrapper:latest
```

### Docker Compose Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ccwrapper
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

**Deploy:**

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Environment Variables

Required variables for each environment:

#### Development

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/ccwrapper_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

#### Staging

```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://staging-db:5432/ccwrapper_staging
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=info
API_BASE_URL=https://api.staging.ccwrapper.dev
```

#### Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod-db:5432/ccwrapper_prod
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=warn
API_BASE_URL=https://api.ccwrapper.dev
```

### Secrets Management

**DO NOT commit secrets to version control!**

**Development:**

- Use `.env.local` (gitignored)

**Staging/Production:**

- Use environment-specific secret management:
  - GitHub Actions Secrets
  - AWS Secrets Manager
  - HashiCorp Vault
  - Cloud provider secret management

**Example (GitHub Actions):**

```yaml
- name: Deploy to production
  env:
    DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
    REDIS_URL: ${{ secrets.PROD_REDIS_URL }}
    API_KEY: ${{ secrets.PROD_API_KEY }}
```

## Deployment Verification

### Health Checks

After deployment, verify health:

```bash
# HTTP health check
curl https://api.ccwrapper.dev/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-20T..."}
```

### Smoke Tests

Run critical path tests:

```bash
# Test authentication
curl -X POST https://api.ccwrapper.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test API endpoints
curl https://api.ccwrapper.dev/api/users
```

### Monitoring Checks

Verify monitoring systems:

1. **Application logs** - Check for errors
2. **Error tracking** - Verify error reporting
3. **Metrics** - Check performance metrics
4. **Alerts** - Ensure alerts are configured

### Deployment Checklist

After deployment:

- [ ] Health check endpoint returns 200
- [ ] Application logs show no errors
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Critical features working
- [ ] No increase in error rates
- [ ] Response times within SLA
- [ ] Team notified of deployment

## Rollback Procedures

### Automatic Rollback

CI/CD may automatically rollback if:

- Health checks fail
- Error rate exceeds threshold
- Deployment verification fails

### Manual Rollback

#### Option 1: Redeploy Previous Version

```bash
# 1. Find previous version tag
git tag -l

# 2. Create rollback tag
git tag -a v1.2.1-rollback -m "Rollback to v1.2.0"

# 3. Push to trigger deployment
git push origin v1.2.1-rollback
```

#### Option 2: Revert Commits

```bash
# 1. Revert problematic commits
git revert <commit-hash>

# 2. Push to main
git push origin main

# 3. Staging auto-deploys
```

#### Option 3: Container Rollback

```bash
# Pull previous image
docker pull ccwrapper:v1.2.0

# Restart with previous version
docker compose up -d
```

### Post-Rollback

After rollback:

1. **Verify** - Confirm system stability
2. **Investigate** - Determine root cause
3. **Fix** - Address the issue
4. **Test** - Verify fix in staging
5. **Redeploy** - Deploy fixed version

## Monitoring

### Application Monitoring

**Logs:**

- Centralized logging (TBD - e.g., DataDog, CloudWatch)
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured logging (JSON format)

**Metrics:**

- Request rate
- Response time (p50, p95, p99)
- Error rate
- CPU and memory usage
- Database connection pool

**Alerts:**

- Error rate > 5%
- Response time > 1000ms (p95)
- Service down
- Database connection failures

### Infrastructure Monitoring

**Resources:**

- CPU usage
- Memory usage
- Disk usage
- Network traffic

**Services:**

- Database health
- Redis health
- Container health
- Load balancer health

### Deployment Tracking

Track deployments:

- **Who:** Deployment initiator
- **When:** Deployment timestamp
- **What:** Version deployed
- **Where:** Environment
- **Status:** Success/failure

## Best Practices

### 1. Test Before Deploying

```bash
# Complete validation
bun run type-check && \
  bun run lint && \
  bun test && \
  bun run build:all
```

### 2. Deploy to Staging First

Always test in staging before production.

### 3. Use Feature Flags

For risky changes, use feature flags:

```typescript
if (featureFlags.newAuthSystem) {
  // New code
} else {
  // Old code
}
```

### 4. Monitor After Deployment

Watch metrics for 30 minutes after deployment.

### 5. Communicate Deployments

Notify team:

- Pre-deployment announcement
- Deployment in progress
- Deployment complete
- Issues detected

### 6. Keep Rollback Plan Ready

Always have a rollback plan before deploying.

## Troubleshooting

### Deployment Failures

**Build fails:**

```bash
# Check CI logs
# Fix issues locally
bun run build:all

# Commit fix and retry
```

**Health check fails:**

```bash
# Check application logs
# Verify environment variables
# Check service dependencies (DB, Redis)
```

**Slow deployment:**

- Check build cache
- Verify network connectivity
- Review deployment logs

### Post-Deployment Issues

**High error rate:**

- Check application logs
- Review recent changes
- Consider rollback

**Performance degradation:**

- Check resource usage
- Review database queries
- Check cache hit rate

**Service unavailable:**

- Verify service health
- Check load balancer
- Review infrastructure logs

## Additional Resources

- [Development Workflow](development-workflow.md)
- [Build Process](build-process.md)
- [Troubleshooting Guide](troubleshooting.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Questions?** Contact the DevOps team or open a
[GitHub Issue](https://github.com/ccwrapper/cc-wrapper/issues).
