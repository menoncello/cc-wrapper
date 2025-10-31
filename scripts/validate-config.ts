#!/usr/bin/env bun
/**
 * CC Wrapper Configuration Validation System
 *
 * Validates environment variables, dependencies, and project configuration.
 * Part of the configuration validation system (AC: 5).
 */

import { $ } from 'bun';
import { config } from 'dotenv';
import * as fs from 'fs';
// Import URL constructor
import { URL } from 'url';

interface ValidationRule {
  name: string;
  validate: () => Promise<ValidationResult>;
  critical: boolean;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

interface ValidationReport {
  overall: 'valid' | 'invalid' | 'warning';
  timestamp: string;
  results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    critical: number;
  };
}

/**
 *
 */
class ConfigValidator {
  private rules: ValidationRule[] = [];
  private envLoaded = false;

  /**
   *
   */
  constructor() {
    this.loadEnvironment();
    this.setupValidationRules();
  }

  /**
   *
   */
  private loadEnvironment(): void {
    try {
      // Load .env.local if it exists
      if (fs.existsSync('.env.local')) {
        config({ path: '.env.local' });
        this.envLoaded = true;
      }
    } catch {
      console.warn('Warning: Could not load .env.local file');
    }
  }

  /**
   *
   */
  private setupValidationRules(): void {
    // Environment variable validations
    this.rules.push({
      name: 'Database URL Validation',
      critical: true,
      validate: async () => this.validateDatabaseUrl()
    });

    this.rules.push({
      name: 'Redis URL Validation',
      critical: true,
      validate: async () => this.validateRedisUrl()
    });

    this.rules.push({
      name: 'Node Environment Validation',
      critical: false,
      validate: async () => this.validateNodeEnvironment()
    });

    this.rules.push({
      name: 'Port Configuration Validation',
      critical: false,
      validate: async () => this.validatePortConfiguration()
    });

    // Project structure validations
    this.rules.push({
      name: 'Required Directories Validation',
      critical: false,
      validate: async () => this.validateRequiredDirectories()
    });

    this.rules.push({
      name: 'Configuration Files Validation',
      critical: false,
      validate: async () => this.validateConfigurationFiles()
    });

    // Dependency validations
    this.rules.push({
      name: 'Required Dependencies Validation',
      critical: true,
      validate: async () => this.validateRequiredDependencies()
    });
  }

  /**
   *
   */
  private async validateDatabaseUrl(): Promise<ValidationResult> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return {
        valid: false,
        message: 'DATABASE_URL environment variable is missing',
        details:
          'Set DATABASE_URL in .env.local file (e.g., postgresql://localhost:5432/ccwrapper_dev)'
      };
    }

    try {
      const url = new URL(databaseUrl);

      if (url.protocol !== 'postgresql:') {
        return {
          valid: false,
          message: 'DATABASE_URL must use postgresql:// protocol',
          details: `Current protocol: ${url.protocol}`
        };
      }

      if (!url.hostname) {
        return {
          valid: false,
          message: 'DATABASE_URL must include a valid hostname',
          details: 'Current hostname is empty'
        };
      }

      if (!url.pathname || url.pathname === '/') {
        return {
          valid: false,
          message: 'DATABASE_URL must include a database name',
          details:
            'Add database name after hostname (e.g., postgresql://localhost:5432/ccwrapper_dev)'
        };
      }

      return {
        valid: true,
        message: 'DATABASE_URL is properly configured',
        details: `Database: ${url.hostname}${url.pathname}`
      };
    } catch (error) {
      return {
        valid: false,
        message: 'DATABASE_URL format is invalid',
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   *
   */
  private async validateRedisUrl(): Promise<ValidationResult> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return {
        valid: false,
        message: 'REDIS_URL environment variable is missing',
        details: 'Set REDIS_URL in .env.local file (e.g., redis://localhost:6379)'
      };
    }

    try {
      const url = new URL(redisUrl);

      if (url.protocol !== 'redis:') {
        return {
          valid: false,
          message: 'REDIS_URL must use redis:// protocol',
          details: `Current protocol: ${url.protocol}`
        };
      }

      if (!url.hostname) {
        return {
          valid: false,
          message: 'REDIS_URL must include a valid hostname',
          details: 'Current hostname is empty'
        };
      }

      return {
        valid: true,
        message: 'REDIS_URL is properly configured',
        details: `Redis: ${url.hostname}:${url.port || '6379'}`
      };
    } catch (error) {
      return {
        valid: false,
        message: 'REDIS_URL format is invalid',
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   *
   */
  private async validateNodeEnvironment(): Promise<ValidationResult> {
    const nodeEnv = process.env.NODE_ENV;
    const validEnvironments = ['development', 'production', 'test'];

    if (!nodeEnv) {
      return {
        valid: false,
        message: 'NODE_ENV environment variable is missing',
        details: 'Set NODE_ENV in .env.local file (development, production, or test)'
      };
    }

    if (!validEnvironments.includes(nodeEnv)) {
      return {
        valid: false,
        message: 'NODE_ENV has invalid value',
        details: `Current: ${nodeEnv}, Valid: ${validEnvironments.join(', ')}`
      };
    }

    return {
      valid: true,
      message: 'NODE_ENV is properly configured',
      details: `Environment: ${nodeEnv}`
    };
  }

  /**
   *
   */
  private async validatePortConfiguration(): Promise<ValidationResult> {
    const port = process.env.PORT;
    const defaultPort = 3000;

    if (!port) {
      return {
        valid: true,
        message: 'PORT not set, using default',
        details: `Using default port: ${defaultPort}`
      };
    }

    const portNumber = Number.parseInt(port, 10);

    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return {
        valid: false,
        message: 'PORT must be a valid number between 1 and 65535',
        details: `Current value: ${port}`
      };
    }

    return {
      valid: true,
      message: 'PORT is properly configured',
      details: `Port: ${portNumber}`
    };
  }

  /**
   *
   */
  private async validateRequiredDirectories(): Promise<ValidationResult> {
    const requiredDirs = ['apps', 'packages', 'services'];
    const missingDirs: string[] = [];
    const existingDirs: string[] = [];

    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        existingDirs.push(dir);
      } else {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      return {
        valid: false,
        message: 'Some required directories are missing',
        details: `Missing: ${missingDirs.join(', ')}, Existing: ${existingDirs.join(', ')}`
      };
    }

    return {
      valid: true,
      message: 'All required directories exist',
      details: `Directories: ${existingDirs.join(', ')}`
    };
  }

  /**
   *
   */
  private async validateConfigurationFiles(): Promise<ValidationResult> {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'eslint.config.js',
      'prettier.config.js',
      'setup.ts'
    ];
    const missingFiles: string[] = [];
    const existingFiles: string[] = [];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        existingFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        valid: false,
        message: 'Some configuration files are missing',
        details: `Missing: ${missingFiles.join(', ')}, Existing: ${existingFiles.join(', ')}`
      };
    }

    return {
      valid: true,
      message: 'All configuration files exist',
      details: `Files: ${existingFiles.join(', ')}`
    };
  }

  /**
   *
   */
  private async validateRequiredDependencies(): Promise<ValidationResult> {
    const requiredCommands = [
      { name: 'Bun', command: 'bun --version' },
      { name: 'TypeScript', command: 'bunx tsc --version' },
      { name: 'Docker', command: 'docker --version' }
    ];

    const workingCommands: string[] = [];
    const failedCommands: string[] = [];

    for (const { name, command } of requiredCommands) {
      try {
        await $`${command}`.quiet();
        workingCommands.push(name);
      } catch {
        failedCommands.push(name);
      }
    }

    if (failedCommands.length > 0) {
      return {
        valid: false,
        message: 'Some required dependencies are not available',
        details: `Working: ${workingCommands.join(', ')}, Failed: ${failedCommands.join(', ')}`
      };
    }

    return {
      valid: true,
      message: 'All required dependencies are available',
      details: `Dependencies: ${workingCommands.join(', ')}`
    };
  }

  /**
   *
   */
  async run(): Promise<ValidationReport> {
    console.log('🔧 CC Wrapper Configuration Validation');
    console.log('━'.repeat(50));

    if (!this.envLoaded) {
      console.log('⚠️  Warning: .env.local file not loaded');
    }

    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.validate();
        results.push(result);

        const statusIcon = result.valid ? '✅' : '❌';
        const criticalFlag = rule.critical ? ' (CRITICAL)' : '';
        console.log(`  ${statusIcon} ${rule.name}${criticalFlag}`);

        if (!result.valid && result.details) {
          console.log(`    ${result.details}`);
        }
      } catch (error) {
        const errorResult: ValidationResult = {
          valid: false,
          message: `Validation failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        results.push(errorResult);
        console.log(`  ❌ ${rule.name} (CRITICAL)`);
        console.log(`    ${errorResult.message}`);
      }
    }

    const report = this.generateReport(results);
    this.displayReport(report);

    return report;
  }

  /**
   *
   * @param results
   */
  private generateReport(results: ValidationResult[]): ValidationReport {
    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      critical: 0 // Will be updated based on critical rules
    };

    let overall: ValidationReport['overall'] = 'valid';
    if (summary.invalid > 0) {
      overall = 'invalid';
    } else if (summary.valid < summary.total) {
      overall = 'warning';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      results,
      summary
    };
  }

  /**
   *
   * @param report
   */
  private displayReport(report: ValidationReport): void {
    console.log('\n📊 Validation Summary:');
    console.log(`  Total checks: ${report.summary.total}`);
    console.log(`  ✅ Valid: ${report.summary.valid}`);
    console.log(`  ❌ Invalid: ${report.summary.invalid}`);

    console.log(`\n🎯 Overall Status: ${report.overall.toUpperCase()}`);

    if (report.overall === 'valid') {
      console.log('\n🎉 All validations passed! Configuration is ready.');
    } else if (report.overall === 'warning') {
      console.log('\n⚠️  Some validations have warnings. Review the details above.');
    } else {
      console.log('\n❌ Critical validation failures detected. Please resolve the issues above.');
      process.exit(1);
    }
  }
}

// Export for testing
export { ConfigValidator };

// Run validation
if (import.meta.main) {
  const validator = new ConfigValidator();
  validator.run().catch(console.error);
}
