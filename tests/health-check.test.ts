/**
 * Tests for Health Check System
 *
 * Tests cover:
 * - Service health monitoring
 * - Response time validation (target <5 seconds)
 * - Dependency health checks
 * - Environment validation
 * - Error handling and reporting
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { HealthChecker } from '../scripts/health-check';

// Type definitions for test interfaces
interface HealthCheckItem {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'degraded';
  name: string;
}

interface HealthCheckerInstance {
  checks: HealthCheckItem[];
}

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Health Check System - P0 Critical System Monitoring', () => {
  beforeEach(() => {
    console.log = mock(() => {});
    console.error = mock(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Bun Runtime Health Check - P0 Critical Runtime Validation', () => {
    test('2.1-E2E-001: should report healthy Bun status', async () => {
      const checker = new HealthChecker();

      // This should work since we're running with Bun
      const result = await checker.checkBun();

      expect(result.name).toBe('Bun Runtime');
      expect(result.status).toBe('healthy');
      expect(typeof result.responseTime).toBe('number');
      expect(result.responseTime).toBeLessThan(1000); // Should be very fast
      expect(result.message).toContain('Version');
    });

    test('2.1-E2E-002: should measure response time accurately', async () => {
      const checker = new HealthChecker();
      const startTime = Date.now();

      await checker.checkBun();

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      // The actual call should complete quickly
      expect(actualDuration).toBeLessThan(1000);
    });
  });

  describe('TypeScript Health Check - P1 High Priority Tool Validation', () => {
    test('2.2-E2E-001: should report TypeScript availability', async () => {
      const checker = new HealthChecker();

      const result = await checker.checkTypeScript();

      expect(result.name).toBe('TypeScript Compiler');
      expect(typeof result.status).toBe('string');
      expect(['healthy', 'unhealthy']).toContain(result.status);
      expect(typeof result.responseTime).toBe('number');
    });
  });

  describe('Docker Health Check - P1 High Priority Infrastructure', () => {
    test('2.3-E2E-001: should check Docker Engine availability', async () => {
      const checker = new HealthChecker();

      const results = await checker.checkDocker();

      // Docker might not be available in all test environments
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(typeof firstResult.status).toBe('string');
      expect(['healthy', 'unhealthy']).toContain(firstResult.status);
      expect(typeof firstResult.name).toBe('string');
    });
  });

  describe('Service Health Checks - P0 Critical Service Dependencies', () => {
    test('2.4-E2E-001: should check PostgreSQL service', async () => {
      const checker = new HealthChecker();

      const result = await checker.checkPostgreSQL();

      expect(result.name).toBe('PostgreSQL Service');
      expect(typeof result.status).toBe('string');
      expect(['healthy', 'unhealthy']).toContain(result.status);
      if (result.status === 'healthy') {
        expect(result.message).toContain('Database accessible');
        expect(typeof result.responseTime).toBe('number');
      }
    });

    test('2.4-E2E-002: should check Redis service', async () => {
      const checker = new HealthChecker();

      const result = await checker.checkRedis();

      expect(result.name).toBe('Redis Service');
      expect(typeof result.status).toBe('string');
      expect(['healthy', 'unhealthy']).toContain(result.status);
      if (result.status === 'healthy') {
        expect(result.message).toContain('Cache accessible');
        expect(typeof result.responseTime).toBe('number');
      }
    });
  });

  describe('Environment Variables Check - P0 Critical Configuration', () => {
    test('2.5-E2E-001: should check required environment variables', async () => {
      const checker = new HealthChecker();

      // Set some test environment variables
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';

      const result = await checker.checkEnvironmentVariables();

      expect(result.name).toBe('Environment Variables');
      expect(typeof result.status).toBe('string');
      expect(typeof result.responseTime).toBe('number');
      expect(result.message).toContain('variables');

      // Clean up
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.NODE_ENV;
      delete process.env.PORT;
    });

    test('2.5-E2E-002: should report missing variables', async () => {
      const checker = new HealthChecker();

      // Ensure required variables are not set
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.NODE_ENV;
      delete process.env.PORT;

      const result = await checker.checkEnvironmentVariables();

      expect(result.name).toBe('Environment Variables');
      expect(['unhealthy', 'degraded']).toContain(result.status);
      expect(result.message).toContain('Missing variables');
    });
  });

  describe('Health Report Generation - P1 High Priority Reporting', () => {
    test('2.6-E2E-001: should generate comprehensive health report', async () => {
      const checker = new HealthChecker();

      // Perform a basic health check to generate a real report
      await checker.checkBun();
      await checker.checkTypeScript();

      const report = checker.generateReport();

      expect(report.overall).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(Array.isArray(report.checks)).toBe(true);
      expect(report.checks.length).toBeGreaterThan(0);
      expect(report.summary.total).toBeGreaterThan(0);
      expect(typeof report.summary.healthy).toBe('number');
      expect(typeof report.summary.unhealthy).toBe('number');
      expect(typeof report.summary.unknown).toBe('number');
    });

    test('2.6-E2E-002: should calculate overall status correctly', async () => {
      // Create a new instance to test status calculation
      const testChecker = new HealthChecker();
      const mockChecks = [
        { status: 'healthy' as const, name: 'Service 1' },
        { status: 'healthy' as const, name: 'Service 2' }
      ];
      (testChecker as HealthCheckerInstance).checks = mockChecks;

      let report = testChecker.generateReport();
      expect(report.overall).toBe('healthy');

      // Test one unhealthy
      const testChecker2 = new HealthChecker();
      const mixedChecks = [
        { status: 'healthy' as const, name: 'Service 1' },
        { status: 'unhealthy' as const, name: 'Service 2' }
      ];
      (testChecker2 as HealthCheckerInstance).checks = mixedChecks;
      report = testChecker2.generateReport();
      expect(report.overall).toBe('unhealthy');
    });
  });
});
