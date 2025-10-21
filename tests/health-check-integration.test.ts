/**
 * Integration tests for Health Check System - Additional Coverage
 *
 * Tests cover:
 * - Complete workflow execution
 * - Report generation and display
 * - Status icon mapping
 * - Constructor initialization
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { HealthChecker } from '../scripts/health-check';

// Type definitions for test interfaces
interface HealthCheckItem {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'degraded';
  message?: string;
}

interface HealthCheckerInstance {
  checks: HealthCheckItem[];
  displayReport(): void;
}

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe.skip('Health Check Integration - Complete Workflow', () => {
  beforeEach(() => {
    console.log = mock(() => {});
    console.error = mock(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Complete Workflow - P0 Critical Integration', () => {
    test('3.1-E2E-001: should execute complete health check workflow', async () => {
      const checker = new HealthChecker();

      // Verify constructor initializes correctly
      expect(checker).toBeDefined();

      // Run complete workflow
      const report = await checker.run();

      // Verify report structure
      expect(report.overall).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(Array.isArray(report.checks)).toBe(true);
      expect(report.checks.length).toBeGreaterThan(0);

      // Verify summary structure
      expect(report.summary.total).toBeGreaterThan(0);
      expect(typeof report.summary.healthy).toBe('number');
      expect(typeof report.summary.unhealthy).toBe('number');
      expect(typeof report.summary.unknown).toBe('number');
      expect(typeof report.summary.degraded).toBe('number');
    });

    test('3.1-E2E-002: should handle workflow with mixed service states', async () => {
      const checker = new HealthChecker();

      // Run workflow (will have mixed states in test environment)
      const report = await checker.run();

      // Should handle mixed states gracefully
      expect(['healthy', 'unhealthy', 'degraded']).toContain(report.overall);
      expect(report.checks.length).toBeGreaterThan(0);

      // Should have both healthy and unhealthy checks in test environment
      const healthyChecks = report.checks.filter(c => c.status === 'healthy');
      const unhealthyChecks = report.checks.filter(c => c.status === 'unhealthy');

      expect(healthyChecks.length + unhealthyChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation - P1 High Priority Reporting', () => {
    test('3.2-E2E-001: should generate report with all required fields', async () => {
      const checker = new HealthChecker();

      // Add some health checks first
      await checker.checkBun();
      await checker.checkTypeScript();

      const report = checker.generateReport();

      // Verify all required fields exist
      expect(report.overall).toMatch(/^(healthy|unhealthy|degraded)$/);
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(Array.isArray(report.checks)).toBe(true);

      // Verify summary has all required fields
      expect(report.summary).toHaveProperty('total');
      expect(report.summary).toHaveProperty('healthy');
      expect(report.summary).toHaveProperty('unhealthy');
      expect(report.summary).toHaveProperty('unknown');
      expect(report.summary).toHaveProperty('degraded');

      // Verify summary calculations
      expect(report.summary.total).toBe(report.checks.length);
      expect(
        report.summary.healthy +
          report.summary.unhealthy +
          report.summary.unknown +
          report.summary.degraded
      ).toBe(report.summary.total);
    });

    test('3.2-E2E-002: should calculate overall status correctly for all scenarios', async () => {
      // Test all healthy scenario
      const healthyChecker = new HealthChecker();
      (healthyChecker as HealthCheckerInstance).checks = [
        { status: 'healthy', name: 'Service 1' },
        { status: 'healthy', name: 'Service 2' }
      ];
      let report = healthyChecker.generateReport();
      expect(report.overall).toBe('healthy');

      // Test unhealthy scenario
      const unhealthyChecker = new HealthChecker();
      (unhealthyChecker as HealthCheckerInstance).checks = [
        { status: 'healthy', name: 'Service 1' },
        { status: 'unhealthy', name: 'Service 2' }
      ];
      report = unhealthyChecker.generateReport();
      expect(report.overall).toBe('unhealthy');

      // Test degraded scenario (unknown services)
      const degradedChecker = new HealthChecker();
      (degradedChecker as HealthCheckerInstance).checks = [
        { status: 'healthy', name: 'Service 1' },
        { status: 'unknown', name: 'Service 2' }
      ];
      report = degradedChecker.generateReport();
      expect(report.overall).toBe('degraded');

      // Test degraded scenario (not all healthy)
      const degradedChecker2 = new HealthChecker();
      (degradedChecker2 as HealthCheckerInstance).checks = [
        { status: 'healthy', name: 'Service 1' },
        { status: 'degraded', name: 'Service 2' }
      ];
      report = degradedChecker2.generateReport();
      expect(report.overall).toBe('degraded');
    });
  });

  describe('Status Icon Mapping - P2 Medium Priority UX', () => {
    test('3.3-E2E-001: should return correct icons for all status types', async () => {
      // Test all status types through the display report method
      // We can't test getStatusIcon directly since it's private, but we can infer behavior

      // Create checker with known status checks
      const testChecker = new HealthChecker();
      (testChecker as HealthCheckerInstance).checks = [
        { name: 'Healthy Service', status: 'healthy', message: 'All good' },
        { name: 'Unhealthy Service', status: 'unhealthy', message: 'Service down' },
        { name: 'Unknown Service', status: 'unknown', message: 'Status unclear' },
        { name: 'Degraded Service', status: 'degraded', message: 'Partial issues' }
      ];

      testChecker.generateReport();

      // Display report will call getStatusIcon internally
      // If it doesn't throw errors, the icon mapping is working
      expect(() => {
        (testChecker as HealthCheckerInstance).displayReport();
      }).not.toThrow();
    });
  });

  describe('Constructor and Initialization - P1 High Priority Setup', () => {
    test('3.4-E2E-001: should initialize HealthChecker with correct default state', () => {
      const checker = new HealthChecker();

      // Should be properly initialized
      expect(checker).toBeDefined();
      expect(typeof checker.run).toBe('function');
      expect(typeof checker.checkBun).toBe('function');
      expect(typeof checker.checkTypeScript).toBe('function');
      expect(typeof checker.checkDocker).toBe('function');
      expect(typeof checker.generateReport).toBe('function');
    });

    test('3.4-E2E-002: should handle multiple checker instances independently', async () => {
      const checker1 = new HealthChecker();
      const checker2 = new HealthChecker();

      // Both should work independently
      await checker1.checkBun();
      await checker2.checkTypeScript();

      const report1 = checker1.generateReport();
      const report2 = checker2.generateReport();

      // Should have different numbers of checks
      expect(report1.checks.length).toBeGreaterThan(0);
      expect(report2.checks.length).toBeGreaterThan(0);
      expect(report1.checks.length).not.toEqual(report2.checks.length);
    });
  });
});
