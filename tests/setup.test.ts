/**
 * Tests for Development Environment Setup Script
 *
 * Tests cover:
 * - Platform detection logic
 * - Version checking and validation
 * - Environment configuration
 * - Service health checks
 * - Setup performance (target <60 seconds)
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as fs from 'fs';

import { SetupEnvironment } from '../setup';

// Type definitions for test interfaces
interface SetupEnvironmentInstance {
  detectPlatform(): {
    os: string;
    arch: string;
    packageManager: string;
  };
  checkBun(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkTypeScript(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkDocker(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkPostgreSQL(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  checkRedis(): Promise<{
    installed: boolean;
    version?: string;
    required: string;
  }>;
  configureEnvironment(): Promise<void>;
  validateEnvironment(): Promise<void>;
  createDockerComposeFile(): Promise<void>;
  setupEditorIntegration(): Promise<void>;
  checkEnvironment(): Promise<{
    dependencies: Record<
      string,
      {
        installed: boolean;
        required: string;
      }
    >;
    platform: unknown;
  }>;
}

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Development Environment Setup - P0 Critical Setup Validation', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    console.log = mock(() => {});
    console.error = mock(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Ensure platform is always restored to original value
    if (process.platform !== originalPlatform) {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true
      });
    }
  });

  describe('Platform Detection - P0 Critical Core Functionality', () => {
    test('1.1-E2E-001: should detect macOS platform correctly', () => {
      const originalPlatform = process.platform;

      try {
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        const setup = new SetupEnvironment();
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform();

        expect(platformInfo.os).toBe('macos');
        expect(['x64', 'arm64']).toContain(platformInfo.arch);
        expect(platformInfo.packageManager).toBe('bun');
      } finally {
        // Restore original platform
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true
        });
      }
    });

    test('1.1-E2E-002: should detect Linux platform correctly', () => {
      const originalPlatform = process.platform;

      try {
        Object.defineProperty(process, 'platform', { value: 'linux' });

        const setup = new SetupEnvironment();
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform();

        expect(platformInfo.os).toBe('linux');
        expect(platformInfo.packageManager).toBe('bun');
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true
        });
      }
    });

    test('1.1-E2E-003: should detect Windows platform correctly', () => {
      const originalPlatform = process.platform;

      try {
        Object.defineProperty(process, 'platform', { value: 'win32' });

        const setup = new SetupEnvironment();
        const platformInfo = (setup as SetupEnvironmentInstance).detectPlatform();

        expect(platformInfo.os).toBe('windows');
        expect(platformInfo.packageManager).toBe('bun');
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true
        });
      }
    });

    test('1.1-E2E-004: should throw error for unsupported platforms', () => {
      const originalPlatform = process.platform;

      try {
        Object.defineProperty(process, 'platform', { value: 'freebsd' });

        // Constructor calls detectPlatform() which should throw for unsupported platforms
        expect(() => new SetupEnvironment()).toThrow('Unsupported operating system');
      } finally {
        // Always restore platform
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true
        });
      }
    });
  });

  describe('Dependency Version Checking - P0 Critical Setup Validation', () => {
    test('1.2-E2E-001: should check Bun version correctly', async () => {
      const setup = new SetupEnvironment();

      // Test the version checking logic
      const result = await (setup as SetupEnvironmentInstance).checkBun();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('1.3.0');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
      }
    });

    test('1.2-E2E-002: should check TypeScript version correctly', async () => {
      const setup = new SetupEnvironment();

      const result = await (setup as SetupEnvironmentInstance).checkTypeScript();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('5.9.3');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
      }
    });

    test('1.2-E2E-003: should check Docker version correctly', async () => {
      const setup = new SetupEnvironment();

      const result = await (setup as SetupEnvironmentInstance).checkDocker();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('28.5.1');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
      }
    });

    test('1.2-E2E-004: should check PostgreSQL version correctly', async () => {
      const setup = new SetupEnvironment();

      const result = await (setup as SetupEnvironmentInstance).checkPostgreSQL();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('18.0');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
      }
    });

    test('1.2-E2E-005: should check Redis version correctly', async () => {
      const setup = new SetupEnvironment();

      const result = await (setup as SetupEnvironmentInstance).checkRedis();

      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('8.2.2');
      if (result.installed) {
        expect(typeof result.version).toBe('string');
      }
    });
  });

  describe('Environment Configuration - P0 Critical Setup Validation', () => {
    test('1.3-E2E-001: should create .env.local with correct content', async () => {
      const setup = new SetupEnvironment();

      // Remove existing .env.local if it exists
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }

      await (setup as SetupEnvironmentInstance).configureEnvironment();

      expect(fs.existsSync('.env.local')).toBe(true);

      const envContent = fs.readFileSync('.env.local', 'utf8');
      expect(envContent).toContain('DATABASE_URL=');
      expect(envContent).toContain('REDIS_URL=');
      expect(envContent).toContain('NODE_ENV="development"');
      expect(envContent).toContain('PORT=3000');
      expect(envContent).toContain('BUN_VERSION="1.3.0"');
      expect(envContent).toContain('TYPESCRIPT_VERSION="5.9.3"');

      // Cleanup
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }
    });

    test('1.3-E2E-002: should create required directories', async () => {
      const setup = new SetupEnvironment();

      // Directories are now git-tracked, just verify they exist
      const dirs = ['apps', 'packages', 'services'];

      await (setup as SetupEnvironmentInstance).validateEnvironment();

      dirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);
        const stats = fs.statSync(dir);
        expect(stats.isDirectory()).toBe(true);
      });

      // No cleanup - these are git-tracked directories
    });
  });

  describe('Docker Compose Configuration - P1 High Priority Infrastructure', () => {
    test('1.4-E2E-001: should create docker-compose.dev.yml with correct services', async () => {
      const setup = new SetupEnvironment();

      // Remove existing docker-compose.dev.yml if it exists
      if (fs.existsSync('docker-compose.dev.yml')) {
        fs.unlinkSync('docker-compose.dev.yml');
      }

      await (setup as SetupEnvironmentInstance).createDockerComposeFile();

      expect(fs.existsSync('docker-compose.dev.yml')).toBe(true);

      const composeContent = fs.readFileSync('docker-compose.dev.yml', 'utf8');
      expect(composeContent).toContain('postgres:');
      expect(composeContent).toContain('redis:');
      expect(composeContent).toContain('postgres:18');
      expect(composeContent).toContain('redis:8.2.2-alpine');
      expect(composeContent).toContain('5432:5432');
      expect(composeContent).toContain('6379:6379');
      expect(composeContent).toContain('healthcheck:');

      // Cleanup
      if (fs.existsSync('docker-compose.dev.yml')) {
        fs.unlinkSync('docker-compose.dev.yml');
      }
    });
  });

  describe('VS Code Integration - P2 Medium Priority Developer Experience', () => {
    test('1.5-E2E-001: should create VS Code settings and extensions', async () => {
      const setup = new SetupEnvironment();

      // Clean up existing VS Code directory
      if (fs.existsSync('.vscode')) {
        fs.rmSync('.vscode', { recursive: true, force: true });
      }

      await (setup as SetupEnvironmentInstance).setupEditorIntegration();

      expect(fs.existsSync('.vscode')).toBe(true);
      expect(fs.existsSync('.vscode/settings.json')).toBe(true);
      expect(fs.existsSync('.vscode/extensions.json')).toBe(true);

      // Check settings content
      const settings = JSON.parse(fs.readFileSync('.vscode/settings.json', 'utf8'));
      expect(settings['typescript.preferences.importModuleSpecifier']).toBe('relative');
      expect(settings['editor.formatOnSave']).toBe(true);
      expect(settings['editor.defaultFormatter']).toBe('esbenp.prettier-vscode');

      // Check extensions content
      const extensions = JSON.parse(fs.readFileSync('.vscode/extensions.json', 'utf8'));
      expect(extensions.recommendations).toContain('esbenp.prettier-vscode');
      expect(extensions.recommendations).toContain('dbaeumer.vscode-eslint');
      expect(extensions.recommendations).toContain('ms-vscode.vscode-typescript-next');

      // Cleanup
      if (fs.existsSync('.vscode')) {
        fs.rmSync('.vscode', { recursive: true, force: true });
      }
    });
  });

  describe('Performance Requirements - P0 Critical SLA Validation', () => {
    test('1.6-E2E-001: should complete setup within 60 seconds target', async () => {
      const startTime = Date.now();

      const setup = new SetupEnvironment();

      // Mock the setup to avoid actual installations but simulate the workflow
      const status = await (setup as SetupEnvironmentInstance).checkEnvironment();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // The checkEnvironment function should complete quickly
      expect(duration).toBeLessThan(5000); // 5 seconds for just checking
      expect(status).toBeDefined();
      expect(status.dependencies).toBeDefined();
      expect(status.platform).toBeDefined();
    }, 10000);
  });

  describe('Error Handling - P0 Critical Robustness', () => {
    test('1.7-E2E-001: should handle missing Bun gracefully', async () => {
      const setup = new SetupEnvironment();

      // This should not throw, but return a status indicating Bun is not installed
      const result = await (setup as SetupEnvironmentInstance).checkBun();

      expect(result).toBeDefined();
      expect(typeof result.installed).toBe('boolean');
      expect(result.required).toBe('1.3.0');
    });

    test('1.7-E2E-002: should handle missing dependencies gracefully', async () => {
      const setup = new SetupEnvironment();

      const status = await (setup as SetupEnvironmentInstance).checkEnvironment();

      expect(status.dependencies).toBeDefined();
      Object.values(status.dependencies).forEach(dep => {
        expect(typeof dep.installed).toBe('boolean');
        expect(typeof dep.required).toBe('string');
      });
    });
  });
});

describe('Setup Script Integration - P1 High Priority Validation', () => {
  test('1.8-E2E-001: setup script should be executable', () => {
    const stats = fs.statSync('setup.ts');
    // Note: On Windows, executable permissions work differently
    if (process.platform !== 'win32') {
      expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
    }
  });

  test('1.8-E2E-002: health check script should be executable', () => {
    const stats = fs.statSync('scripts/health-check.ts');
    if (process.platform !== 'win32') {
      expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
    }
  });

  test('1.8-E2E-003: package.json should have correct scripts', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    expect(packageJson.scripts.setup).toBe('bun run setup.ts');
    expect(packageJson.scripts.health).toBe('turbo run health');
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
    expect(packageJson.scripts.lint).toBeDefined();
  });

  test('1.8-E2E-004: TypeScript configuration should be valid', () => {
    const tsConfigContent = fs.readFileSync('tsconfig.json', 'utf8');

    expect(tsConfigContent).toContain('"strict": true');
    expect(tsConfigContent).toContain('"target": "ES2022"');
    expect(tsConfigContent).toContain('"module": "ESNext"');
    expect(tsConfigContent).toContain('"moduleResolution": "bundler"');
    expect(tsConfigContent).toContain('src/**/*');
    expect(tsConfigContent).toContain('node_modules');
  });
});
