/**
 * Tests for Dependency Version Checking in Development Environment Setup
 *
 * Tests cover:
 * - Version checking for all required tools
 * - Validation of version formats
 * - Handling of missing dependencies
 * - Required version validation
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { SetupEnvironment } from '../setup';
import { setupMockConsole } from '../test-utils/fixtures/setup-fixtures';

// Type definitions for test interfaces
interface SetupEnvironmentInstance {
  checkBun: () => Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkTypeScript: () => Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkDocker: () => Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkPostgreSQL: () => Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkRedis: () => Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
}

describe('Dependency Version Checking - P0 Critical Setup Validation', () => {
  let mockConsole: ReturnType<typeof setupMockConsole>;

  beforeEach(() => {
    mockConsole = setupMockConsole();
  });

  afterEach(() => {
    mockConsole.restore?.();
  });

  describe('Runtime Dependencies', () => {
    test('1.2-E2E-001: should check Bun version correctly', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkBun();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('1.3.0');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
        expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    test('1.2-E2E-002: should check TypeScript version correctly', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkTypeScript();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('5.9.3');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
        expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('Infrastructure Dependencies', () => {
    test('1.2-E2E-003: should check Docker version correctly', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkDocker();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('28.5.1');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
        expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    test('1.2-E2E-004: should check PostgreSQL version correctly', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkPostgreSQL();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('18.0');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
        expect(result.version).toMatch(/^\d+/);
      }
    });

    test('1.2-E2E-005: should check Redis version correctly', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkRedis();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('8.2.2');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
        expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('Version Check Structure Validation', () => {
    test('should return consistent structure for all dependency checks', async () => {
      const setup = new SetupEnvironment();

      const checkMethods = [
        'checkBun',
        'checkTypeScript',
        'checkDocker',
        'checkPostgreSQL',
        'checkRedis'
      ] as const;

      for (const method of checkMethods) {
        const result = await (setup as SetupEnvironmentInstance)[method]();

        // Validate structure
        expect(typeof result.installed).toBe('boolean');
        expect(typeof result.required).toBe('string');
        expect(result.required.length).toBeGreaterThan(0);

        // Version should be present if installed
        if (result.installed) {
          expect(typeof result.version).toBe('string');
          expect(result.version).toBeDefined();
          if (result.version) {
            expect(result.version.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should validate required versions are correctly set', async () => {
      const setup = new SetupEnvironment();

      const expectedVersions = {
        checkBun: '1.3.0',
        checkTypeScript: '5.9.3',
        checkDocker: '28.5.1',
        checkPostgreSQL: '18.0',
        checkRedis: '8.2.2'
      };

      for (const [method, expectedVersion] of Object.entries(expectedVersions)) {
        const result = await (setup as SetupEnvironmentInstance)[
          method as keyof SetupEnvironmentInstance
        ]();

        expect(result.required).toBe(expectedVersion);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dependencies gracefully', async () => {
      // This test validates that missing dependencies don't throw errors
      // but return proper result structures
      const setup = new SetupEnvironment();

      // All methods should complete without throwing
      const promises = [
        (setup as SetupEnvironmentInstance).checkBun(),
        (setup as SetupEnvironmentInstance).checkTypeScript(),
        (setup as SetupEnvironmentInstance).checkDocker(),
        (setup as SetupEnvironmentInstance).checkPostgreSQL(),
        (setup as SetupEnvironmentInstance).checkRedis()
      ];

      const results = await Promise.all(promises);

      // All results should have proper structure
      for (const result of results) {
        expect(typeof result.installed).toBe('boolean');
        expect(typeof result.required).toBe('string');
        expect(result.required.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Version Format Validation', () => {
    test('should validate semantic versioning format for installed tools', async () => {
      const setup = new SetupEnvironment();

      const semanticVersionTools = [
        'checkBun',
        'checkTypeScript',
        'checkDocker',
        'checkRedis'
      ] as const;

      for (const tool of semanticVersionTools) {
        const result = await (setup as SetupEnvironmentInstance)[tool]();

        if (result.installed && result.version) {
          // Should follow semantic versioning (x.y.z)
          expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
        }
      }
    });

    test('should validate major version format for PostgreSQL', async () => {
      const setup = new SetupEnvironment();
      const result = await (setup as SetupEnvironmentInstance).checkPostgreSQL();

      if (result.installed && result.version) {
        // PostgreSQL typically uses major version (e.g., 18, 17, 16)
        expect(result.version).toMatch(/^\d+/);
        const majorVersion = Number.parseInt(result.version);
        expect(majorVersion).toBeGreaterThan(0);
        expect(majorVersion).toBeLessThan(100); // Reasonable upper bound
      }
    });
  });
});
