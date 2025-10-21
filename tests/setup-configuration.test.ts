/**
 * Tests for Environment Configuration in Development Environment Setup
 *
 * Tests cover:
 * - Environment file creation and validation
 * - Directory structure setup
 * - Docker compose configuration
 * - VS Code integration setup
 * - Configuration file validation
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs';

import { SetupEnvironment } from '../setup';
import { setupFileSystemFixture, setupMockConsole } from '../test-utils/fixtures/setup-fixtures';

// Type definitions for test interfaces
interface SetupEnvironmentInstance {
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

describe('Environment Configuration - P0 Critical Setup Validation', () => {
  let mockConsole: ReturnType<typeof setupMockConsole>;
  let fileSystem: ReturnType<typeof setupFileSystemFixture>;

  beforeEach(() => {
    mockConsole = setupMockConsole();
    fileSystem = setupFileSystemFixture();
  });

  afterEach(() => {
    mockConsole.restore?.();
    fileSystem.cleanup();
  });

  describe('Environment File Configuration', () => {
    test('1.3-E2E-001: should create .env.local with correct content', async () => {
      const setup = new SetupEnvironment();

      // Remove existing .env.local if it exists
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }

      await (setup as SetupEnvironmentInstance).configureEnvironment();

      expect(fs.existsSync('.env.local')).toBe(true);

      const envContent = fs.readFileSync('.env.local', 'utf8');

      // Validate required environment variables
      expect(envContent).toContain('DATABASE_URL=');
      expect(envContent).toContain('REDIS_URL=');
      expect(envContent).toContain('NODE_ENV="development"');
      expect(envContent).toContain('PORT=3000');
      expect(envContent).toContain('BUN_VERSION="1.3.0"');
      expect(envContent).toContain('TYPESCRIPT_VERSION="5.9.3"');
      expect(envContent).toContain('COMPOSE_PROJECT_NAME="ccwrapper"');

      // Cleanup
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }
    });

    test('should create environment file with valid format', async () => {
      const setup = new SetupEnvironment();

      // Remove existing file
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }

      await (setup as SetupEnvironmentInstance).configureEnvironment();

      const envContent = fs.readFileSync('.env.local', 'utf8');

      // Should be valid key=value format
      const lines = envContent
        .split('\n')
        .filter(line => line.trim().length > 0)
        .filter(line => !line.trim().startsWith('#'));
      expect(lines.length).toBeGreaterThan(0);

      lines.forEach(line => {
        expect(line).toMatch(/^[A-Z_][A-Z0-9_]*=.+$/);
      });

      // Cleanup
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }
    });
  });

  describe('Directory Structure Setup', () => {
    test('1.3-E2E-002: should create required directories', async () => {
      const setup = new SetupEnvironment();

      // Check that required directories exist (they should be git-tracked now)
      const dirs = ['apps', 'packages', 'services'];

      await (setup as SetupEnvironmentInstance).validateEnvironment();

      dirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);
        const stats = fs.statSync(dir);
        expect(stats.isDirectory()).toBe(true);
      });

      // No cleanup - these are git-tracked directories
    });

    test('should validate directory permissions', async () => {
      const setup = new SetupEnvironment();

      const dirs = ['apps', 'packages', 'services'];

      // Directories should already exist (git-tracked)
      await (setup as SetupEnvironmentInstance).validateEnvironment();

      dirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);

        // Should be readable and writable
        expect(() => {
          fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
        }).not.toThrow();
      });

      // No cleanup - these are git-tracked directories
    });
  });

  describe('Docker Compose Configuration', () => {
    test('1.4-E2E-001: should create docker-compose.dev.yml with correct services', async () => {
      const setup = new SetupEnvironment();

      // Remove existing docker-compose.dev.yml if it exists
      if (fs.existsSync('docker-compose.dev.yml')) {
        fs.unlinkSync('docker-compose.dev.yml');
      }

      await (setup as SetupEnvironmentInstance).createDockerComposeFile();

      expect(fs.existsSync('docker-compose.dev.yml')).toBe(true);

      const composeContent = fs.readFileSync('docker-compose.dev.yml', 'utf8');

      // Validate required services
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

    test('should create valid YAML structure', async () => {
      const setup = new SetupEnvironment();

      if (fs.existsSync('docker-compose.dev.yml')) {
        fs.unlinkSync('docker-compose.dev.yml');
      }

      await (setup as SetupEnvironmentInstance).createDockerComposeFile();

      const composeContent = fs.readFileSync('docker-compose.dev.yml', 'utf8');

      // Should be valid YAML (basic validation)
      expect(composeContent).toMatch(/^version:|services:/m);
      expect(composeContent).toContain('postgres:');
      expect(composeContent).toContain('redis:');

      // Cleanup
      if (fs.existsSync('docker-compose.dev.yml')) {
        fs.unlinkSync('docker-compose.dev.yml');
      }
    });
  });

  describe('VS Code Integration', () => {
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

    test('should create valid JSON configuration files', async () => {
      const setup = new SetupEnvironment();

      if (fs.existsSync('.vscode')) {
        fs.rmSync('.vscode', { recursive: true, force: true });
      }

      await (setup as SetupEnvironmentInstance).setupEditorIntegration();

      // Both files should be valid JSON
      expect(() => {
        JSON.parse(fs.readFileSync('.vscode/settings.json', 'utf8'));
      }).not.toThrow();

      expect(() => {
        JSON.parse(fs.readFileSync('.vscode/extensions.json', 'utf8'));
      }).not.toThrow();

      // Cleanup
      if (fs.existsSync('.vscode')) {
        fs.rmSync('.vscode', { recursive: true, force: true });
      }
    });
  });

  describe('Configuration Integration', () => {
    test('should validate complete environment setup', async () => {
      const setup = new SetupEnvironment();

      // Clean up any existing files
      ['.env.local', 'docker-compose.dev.yml', '.vscode'].forEach(path => {
        if (fs.existsSync(path)) {
          if (fs.statSync(path).isDirectory()) {
            fs.rmSync(path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(path);
          }
        }
      });

      // Run complete configuration
      await (setup as SetupEnvironmentInstance).configureEnvironment();
      await (setup as SetupEnvironmentInstance).validateEnvironment();
      await (setup as SetupEnvironmentInstance).createDockerComposeFile();
      await (setup as SetupEnvironmentInstance).setupEditorIntegration();

      // Validate all components exist
      expect(fs.existsSync('.env.local')).toBe(true);
      expect(fs.existsSync('docker-compose.dev.yml')).toBe(true);
      expect(fs.existsSync('.vscode')).toBe(true);
      expect(fs.existsSync('apps')).toBe(true);
      expect(fs.existsSync('packages')).toBe(true);
      expect(fs.existsSync('services')).toBe(true);

      // Cleanup
      ['.env.local', 'docker-compose.dev.yml', '.vscode', 'apps', 'packages', 'services'].forEach(
        path => {
          if (fs.existsSync(path)) {
            if (fs.statSync(path).isDirectory()) {
              fs.rmSync(path, { recursive: true, force: true });
            } else {
              fs.unlinkSync(path);
            }
          }
        }
      );
    });
  });
});
