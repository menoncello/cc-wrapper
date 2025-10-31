#!/usr/bin/env bun
/**
 * CC Wrapper Development Environment Health Check
 *
 * Validates that all development services are running and accessible.
 * Part of the service health check system (AC: 3).
 */

import { $ } from 'bun';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'degraded';
  responseTime?: number;
  message?: string;
  dependencies?: string[];
}

interface HealthReport {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    degraded: number;
  };
}

/**
 *
 */
class HealthChecker {
  private checks: HealthCheck[] = [];

  /**
   *
   */
  async run(): Promise<HealthReport> {
    console.log('🏥 CC Wrapper Development Environment Health Check');
    console.log('━'.repeat(50));

    // Check development tools
    await this.checkBun();
    await this.checkTypeScript();
    await this.checkDocker();

    // Check services
    await this.checkPostgreSQL();
    await this.checkRedis();

    // Check environment configuration
    await this.checkEnvironmentVariables();

    const report = this.generateReport();
    this.displayReport(report);

    return report;
  }

  /**
   *
   */
  async checkBun(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const result = await $`bun --version`.quiet();
      const responseTime = Date.now() - start;
      const version = result.stdout.toString().trim();

      const healthCheck: HealthCheck = {
        name: 'Bun Runtime',
        status: 'healthy',
        responseTime,
        message: `Version ${version}`
      };
      this.checks.push(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        name: 'Bun Runtime',
        status: 'unhealthy',
        message: `Bun not accessible: ${error}`
      };
      this.checks.push(healthCheck);
      return healthCheck;
    }
  }

  /**
   *
   */
  async checkTypeScript(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const result = await $`bunx tsc --version`.quiet();
      const responseTime = Date.now() - start;
      const version = result.stdout.toString().trim();

      const healthCheck: HealthCheck = {
        name: 'TypeScript Compiler',
        status: 'healthy',
        responseTime,
        message: version
      };
      this.checks.push(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        name: 'TypeScript Compiler',
        status: 'unhealthy',
        message: `TypeScript not accessible: ${error}`
      };
      this.checks.push(healthCheck);
      return healthCheck;
    }
  }

  /**
   *
   */
  async checkDocker(): Promise<HealthCheck[]> {
    const start = Date.now();
    const results: HealthCheck[] = [];
    try {
      const dockerResult = await $`docker --version`.quiet();
      const composeResult = await $`docker compose version`.quiet();
      const responseTime = Date.now() - start;

      const dockerVersion = dockerResult.stdout.toString().trim();
      const composeVersion = composeResult.stdout.toString().trim();

      const dockerCheck: HealthCheck = {
        name: 'Docker Engine',
        status: 'healthy',
        responseTime,
        message: dockerVersion
      };

      const composeCheck: HealthCheck = {
        name: 'Docker Compose',
        status: 'healthy',
        responseTime,
        message: composeVersion
      };

      this.checks.push(dockerCheck, composeCheck);
      results.push(dockerCheck, composeCheck);
    } catch (error) {
      const dockerCheck: HealthCheck = {
        name: 'Docker',
        status: 'unhealthy',
        message: `Docker not accessible: ${error}`
      };
      this.checks.push(dockerCheck);
      results.push(dockerCheck);
    }
    return results;
  }

  /**
   *
   */
  async checkPostgreSQL(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Try to connect via Docker Compose first
      await $`docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U ccwrapper`.quiet();
      const responseTime = Date.now() - start;

      const healthCheck: HealthCheck = {
        name: 'PostgreSQL Service',
        status: 'healthy',
        responseTime,
        message: 'Database accessible via Docker'
      };
      this.checks.push(healthCheck);
      return healthCheck;
    } catch (dockerError) {
      try {
        // Fallback to local PostgreSQL
        await $`pg_isready`.quiet();
        const responseTime = Date.now() - start;

        const healthCheck: HealthCheck = {
          name: 'PostgreSQL Service',
          status: 'healthy',
          responseTime,
          message: 'Database accessible locally'
        };
        this.checks.push(healthCheck);
        return healthCheck;
      } catch (localError) {
        const healthCheck: HealthCheck = {
          name: 'PostgreSQL Service',
          status: 'unhealthy',
          message: `PostgreSQL not accessible: Docker: ${dockerError}, Local: ${localError}`
        };
        this.checks.push(healthCheck);
        return healthCheck;
      }
    }
  }

  /**
   *
   */
  async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Try to connect via Docker Compose first
      await $`docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping`.quiet();
      const responseTime = Date.now() - start;

      const healthCheck: HealthCheck = {
        name: 'Redis Service',
        status: 'healthy',
        responseTime,
        message: 'Cache accessible via Docker'
      };
      this.checks.push(healthCheck);
      return healthCheck;
    } catch (dockerError) {
      try {
        // Fallback to local Redis
        await $`redis-cli ping`.quiet();
        const responseTime = Date.now() - start;

        const healthCheck: HealthCheck = {
          name: 'Redis Service',
          status: 'healthy',
          responseTime,
          message: 'Cache accessible locally'
        };
        this.checks.push(healthCheck);
        return healthCheck;
      } catch (localError) {
        const healthCheck: HealthCheck = {
          name: 'Redis Service',
          status: 'unhealthy',
          message: `Redis not accessible: Docker: ${dockerError}, Local: ${localError}`
        };
        this.checks.push(healthCheck);
        return healthCheck;
      }
    }
  }

  /**
   *
   */
  async checkEnvironmentVariables(): Promise<HealthCheck> {
    const start = Date.now();
    const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'NODE_ENV', 'PORT'];

    const missingVars: string[] = [];
    const presentVars: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        presentVars.push(envVar);
      } else {
        missingVars.push(envVar);
      }
    }

    const responseTime = Date.now() - start;

    if (missingVars.length === 0) {
      const healthCheck: HealthCheck = {
        name: 'Environment Variables',
        status: 'healthy',
        responseTime,
        message: `All required variables set: ${presentVars.join(', ')}`
      };
      this.checks.push(healthCheck);
      return healthCheck;
    } 
      const healthCheck: HealthCheck = {
        name: 'Environment Variables',
        status: 'degraded',
        responseTime,
        message: `Missing variables: ${missingVars.join(', ')}, Present: ${presentVars.join(', ')}`
      };
      this.checks.push(healthCheck);
      return healthCheck;
    
  }

  /**
   *
   */
  generateReport(): HealthReport {
    const summary = {
      total: this.checks.length,
      healthy: this.checks.filter(c => c.status === 'healthy').length,
      unhealthy: this.checks.filter(c => c.status === 'unhealthy').length,
      unknown: this.checks.filter(c => c.status === 'unknown').length,
      degraded: this.checks.filter(c => c.status === 'degraded').length
    };

    let overall: HealthReport['overall'] = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.unknown > 0 || summary.healthy < summary.total) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      checks: this.checks,
      summary
    };
  }

  /**
   *
   * @param report
   */
  private displayReport(report: HealthReport): void {
    console.log(`\n📊 Overall Status: ${report.overall.toUpperCase()}`);
    console.log(`📅 Checked: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`⏱️  Total Checks: ${report.summary.total}`);

    console.log('\n📋 Service Details:');
    for (const check of report.checks) {
      const statusIcon = this.getStatusIcon(check.status);
      const responseTime = check.responseTime ? ` (${check.responseTime}ms)` : '';
      const message = check.message ? ` - ${check.message}` : '';
      console.log(`  ${statusIcon} ${check.name}${responseTime}${message}`);
    }

    console.log('\n📈 Summary:');
    console.log(`  ✅ Healthy: ${report.summary.healthy}`);
    console.log(`  ⚠️  Unhealthy: ${report.summary.unhealthy}`);
    console.log(`  ❓ Unknown: ${report.summary.unknown}`);

    if (report.overall === 'healthy') {
      console.log('\n🎉 All systems operational! Development environment is ready.');
    } else if (report.overall === 'degraded') {
      console.log('\n⚠️  Some services may not be fully operational. Check the details above.');
    } else {
      console.log('\n❌ Critical issues detected. Please resolve the unhealthy services.');
      process.exit(1);
    }
  }

  /**
   *
   * @param status
   */
  private getStatusIcon(status: HealthCheck['status']): string {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'unhealthy':
        return '❌';
      case 'unknown':
        return '❓';
      case 'degraded':
        return '⚠️';
      default:
        return '❓';
    }
  }
}

// Export for testing
export { HealthChecker };

// Run health check
if (import.meta.main) {
  const checker = new HealthChecker();
  checker.run().catch(console.error);
}
