# Load Testing Suite for CC Wrapper

This directory contains k6 load testing scripts for validating the performance
of the CC Wrapper application under concurrent load.

## Overview

The load testing suite focuses on the onboarding wizard flow and related user
journeys to ensure the application can handle the expected user load while
maintaining performance standards.

## Test Scenarios

### 1. Onboarding Wizard Flow (`onboarding-wizard.js`)

- **Description**: Complete onboarding wizard including user type selection, AI
  tools configuration, and workspace creation
- **Weight**: 70% of total traffic
- **Peak Load**: 50 concurrent users
- **Duration**: 18 minutes total test

### 2. Skip Onboarding Flow (`skip-onboarding.js`)

- **Description**: Skip onboarding functionality with default workspace creation
- **Weight**: 30% of total traffic
- **Peak Load**: 15 concurrent users
- **Duration**: 9 minutes total test

### 3. Profile Settings (`profile-settings.js`)

- **Description**: Profile settings access and updates performance test
- **Weight**: 50% of total traffic (can be run independently)
- **Peak Load**: 25 concurrent users
- **Duration**: 9 minutes total test

## Performance Targets

| Metric                   | Target                        | Description                                         |
| ------------------------ | ----------------------------- | --------------------------------------------------- |
| API Response Time        | < 2 seconds (95th percentile) | All API endpoints should respond within 2 seconds   |
| Error Rate               | < 1%                          | Less than 1% of requests should fail                |
| Onboarding Flow Duration | < 10 seconds                  | Complete onboarding should finish within 10 seconds |
| Skip Flow Duration       | < 5 seconds                   | Skip onboarding should complete within 5 seconds    |
| Profile Access Time      | < 500ms                       | Profile retrieval should be under 500ms             |

## Environment Configuration

The load tests support multiple environments through the `config.json` file:

- **Development**: `http://localhost:3000` (lower load levels)
- **Staging**: `https://staging.ccwrapper.dev` (medium load levels)
- **Production**: `https://ccwrapper.dev` (high load levels)

## Running Tests

### Prerequisites

1. Install k6:

   ```bash
   # macOS
   brew install k6

   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. Ensure the target application is running

### Running Individual Tests

```bash
# Set environment (optional, defaults to development)
export BASE_URL=http://localhost:3000

# Run onboarding wizard test
k6 run tests/load/k6/onboarding-wizard.js

# Run skip onboarding test
k6 run tests/load/k6/skip-onboarding.js

# Run profile settings test
k6 run tests/load/k6/profile-settings.js
```

### Running with Package Scripts

```bash
# Run development load tests
bun run test:load:dev

# Run staging load tests
bun run test:load:staging

# Run production load tests (CAUTION: Only run in maintenance window)
bun run test:load:prod

# Run all load tests sequentially
bun run test:load:all
```

### Running with Custom Configuration

```bash
# Override base URL
k6 run --env BASE_URL=https://staging.ccwrapper.dev tests/load/k6/onboarding-wizard.js

# Run with specific virtual users
k6 run --vus 20 --duration 5m tests/load/k6/onboarding-wizard.js
```

## Understanding Results

### Key Metrics

- **http_req_duration**: HTTP request duration
- **http_req_failed**: HTTP request failure rate
- **errors**: Custom error rate (business logic failures)
- **onboarding_duration**: Time to complete onboarding flow
- **api_response_time**: API endpoint response times

### Thresholds

Each test includes performance thresholds that will fail the test if exceeded:

- 95th percentile response time under 2 seconds
- Error rate under 1%
- Custom business logic error rate under 1%

### Output Files

Tests generate summary files in JSON format:

- `onboarding-load-test-summary.json`
- `skip-onboarding-summary.json`
- `profile-settings-summary.json`

## CI/CD Integration

Load tests are integrated into the CI pipeline:

- **Development Branches**: Light load testing (5-10 users)
- **Staging Environment**: Medium load testing (25-50 users)
- **Production Releases**: Load testing as part of release criteria

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the application is running on the target port
2. **High Error Rates**: Check application logs for concurrent request issues
3. **Slow Response Times**: Monitor database connection pooling and resource
   utilization

### Performance Tuning

1. **Database**: Check connection pool settings and query performance
2. **API Rate Limiting**: Ensure rate limits allow concurrent test traffic
3. **Resource Limits**: Monitor CPU, memory, and network during tests

## Best Practices

1. **Baseline First**: Establish baseline metrics before performance tuning
2. **Isolate Tests**: Run tests when other traffic is minimal for accurate
   results
3. **Monitor Resources**: Watch system resources during load tests
4. **Iterative Testing**: Make one change at a time and retest
5. **Document Results**: Keep track of performance improvements over time

## Load Testing Strategy

### Test Types

1. **Smoke Tests**: Quick validation with minimal load
2. **Load Tests**: Normal expected load levels
3. **Stress Tests**: Beyond normal load to find breaking points
4. **Spike Tests**: Sudden increases in traffic
5. **Endurance Tests**: Sustained load over extended periods

### Test Planning

1. **Identify Critical Paths**: Focus on most important user journeys
2. **Define Success Criteria**: Clear performance targets
3. **Schedule Tests**: Coordinate with team to avoid conflicts
4. **Prepare Environment**: Ensure test environment is ready
5. **Monitor Systems**: Watch application and infrastructure during tests

---

## Maintenance

- Update test data generators to reflect realistic user behavior
- Adjust load levels based on actual traffic patterns
- Review and update performance targets regularly
- Keep test scenarios aligned with current user journeys
