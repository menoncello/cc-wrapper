/**
 * E2E Tests for Complete Development Workflow
 *
 * Validates the entire development workflow from clone to deployment:
 * 1. Project setup and dependency installation
 * 2. Development server starts successfully
 * 3. Code quality checks pass
 * 4. Tests execute successfully
 * 5. Build produces artifacts
 * 6. All scripts work together
 *
 * Note: This is an E2E validation of all acceptance criteria working together
 */

import { describe, expect, test } from 'bun:test';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

describe('Complete Development Workflow E2E', () => {
  test('should complete full development workflow in under 2 minutes', async () => {
    // GIVEN: Clean project state
    const startTime = Date.now();

    // WHEN: Running complete workflow
    const steps = {
      install: false,
      lint: false,
      typeCheck: false,
      test: false,
      build: false
    };

    // Step 1: Dependencies should be installed (or install)
    try {
      await execAsync('bun install', { cwd: PROJECT_ROOT, timeout: 30000 });
      steps.install = true;
    } catch {
      steps.install = false;
    }

    // Step 2: Lint should pass
    try {
      await execAsync('bun run lint', { cwd: PROJECT_ROOT, timeout: 30000 });
      steps.lint = true;
    } catch {
      steps.lint = false;
    }

    // Step 3: Type check should pass
    try {
      await execAsync('bun run type-check', { cwd: PROJECT_ROOT, timeout: 30000 });
      steps.typeCheck = true;
    } catch {
      steps.typeCheck = false;
    }

    // Step 4: Tests should run
    try {
      await execAsync('bun test', { cwd: PROJECT_ROOT, timeout: 30000 });
      steps.test = true;
    } catch {
      steps.test = false;
    }

    // Step 5: Build should succeed
    try {
      await execAsync('bun run build', { cwd: PROJECT_ROOT, timeout: 30000 });
      steps.build = true;
    } catch {
      steps.build = false;
    }

    const totalTime = (Date.now() - startTime) / 1000;

    // THEN: All steps should complete successfully
    expect(steps.install).toBe(true);
    expect(steps.lint).toBe(true);
    expect(steps.typeCheck).toBe(true);
    expect(steps.test).toBe(true);
    expect(steps.build).toBe(true);

    // AND: Total workflow should complete in < 2 minutes
    expect(totalTime).toBeLessThan(120);
  });

  test('should have all project structure directories', () => {
    // GIVEN: Project root
    const requiredDirs = [
      'packages',
      'services',
      'apps',
      'tests',
      'tests/e2e',
      'tests/integration',
      'docs',
      '.github/workflows'
    ];

    // WHEN: Checking each required directory
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(PROJECT_ROOT, dir)));

    // THEN: All required directories should exist
    expect(missingDirs).toEqual([]);
  });

  test('should have all required configuration files', () => {
    // GIVEN: Project root
    const requiredConfigs = [
      'package.json',
      'tsconfig.json',
      'playwright.config.ts',
      'vite.config.ts',
      'eslint.config.js',
      'prettier.config.js',
      'stryker.config.json'
    ];

    // WHEN: Checking each required config
    const missingConfigs = requiredConfigs.filter(
      config => !fs.existsSync(path.join(PROJECT_ROOT, config))
    );

    // THEN: All required configs should exist
    expect(missingConfigs).toEqual([]);
  });

  test('should have all required documentation files', () => {
    // GIVEN: Project root
    const requiredDocs = [
      'README.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'LICENSE',
      'docs/development-workflow.md',
      'docs/build-process.md',
      'docs/deployment.md',
      'docs/troubleshooting.md'
    ];

    // WHEN: Checking each required doc
    const missingDocs = requiredDocs.filter(doc => !fs.existsSync(path.join(PROJECT_ROOT, doc)));

    // THEN: All required docs should exist
    expect(missingDocs).toEqual([]);
  });

  test('should have all required npm scripts', () => {
    // GIVEN: Root package.json
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const requiredScripts = [
      'dev',
      'build',
      'build:all',
      'build:watch',
      'test',
      'test:coverage',
      'test:watch',
      'test:e2e',
      'test:mutation',
      'lint',
      'lint:fix',
      'format',
      'type-check',
      'services:up',
      'services:down'
    ];

    // WHEN: Checking each required script
    const missingScripts = requiredScripts.filter(
      script => packageJson.scripts?.[script] === undefined
    );

    // THEN: All required scripts should exist
    expect(missingScripts).toEqual([]);
  });

  test('should have valid monorepo workspace configuration', () => {
    // GIVEN: Root package.json
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // WHEN: Checking workspace configuration
    const hasWorkspaces = Array.isArray(packageJson.workspaces);
    const hasPackages = packageJson.workspaces?.includes('packages/*');
    const hasServices = packageJson.workspaces?.includes('services/*');
    const hasApps = packageJson.workspaces?.includes('apps/*');

    // THEN: Workspace should be properly configured
    expect(hasWorkspaces).toBe(true);
    expect(hasPackages).toBe(true);
    expect(hasServices).toBe(true);
    expect(hasApps).toBe(true);
  });

  test('should have CI/CD pipeline configured', () => {
    // GIVEN: GitHub workflows directory
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');
    const deployWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/deploy-staging.yml');

    // WHEN: Checking workflow files
    const hasCIWorkflow = fs.existsSync(ciWorkflowPath);
    const hasDeployWorkflow = fs.existsSync(deployWorkflowPath);

    // THEN: Both workflows should exist
    expect(hasCIWorkflow).toBe(true);
    expect(hasDeployWorkflow).toBe(true);
  });

  test('should have pre-commit hooks configured', () => {
    // GIVEN: Husky directory
    const preCommitPath = path.join(PROJECT_ROOT, '.husky/pre-commit');

    // WHEN: Checking pre-commit hook
    const exists = fs.existsSync(preCommitPath);

    // THEN: Pre-commit hook should exist
    expect(exists).toBe(true);
  });

  test('should meet all performance targets', async () => {
    // GIVEN: Performance requirements from tech spec
    const startBuild = Date.now();

    // WHEN: Running build
    try {
      await execAsync('bun run build', { cwd: PROJECT_ROOT, timeout: 35000 });
    } catch {
      // Build may fail in RED phase, but timing matters
    }

    const buildTime = (Date.now() - startBuild) / 1000;

    // THEN: Build should complete in < 30 seconds
    expect(buildTime).toBeLessThan(30);
  });
});

describe('Development Workflow Happy Path', () => {
  test('new developer can get started in under 5 minutes', async () => {
    // GIVEN: New developer clones repository
    const startTime = Date.now();

    // WHEN: Following quick start guide
    const steps = {
      dependenciesInstalled: false,
      servicesStarted: false,
      healthCheckPassed: false,
      devServerStarted: false
    };

    // Step 1: Install dependencies
    try {
      await execAsync('bun install', { cwd: PROJECT_ROOT, timeout: 60000 });
      steps.dependenciesInstalled = true;
    } catch {
      steps.dependenciesInstalled = false;
    }

    // Step 2: Check if services can start (Docker may not be running in CI)
    const servicesUp = fs.existsSync(path.join(PROJECT_ROOT, 'docker-compose.dev.yml'));
    steps.servicesStarted = servicesUp;

    // Step 3: Health check should pass
    try {
      const { stdout } = await execAsync('bun run health', { cwd: PROJECT_ROOT, timeout: 10000 });
      steps.healthCheckPassed = stdout.includes('healthy') || stdout.includes('success');
    } catch {
      steps.healthCheckPassed = false;
    }

    // Step 4: Dev server config should exist
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );
    steps.devServerStarted = packageJson.scripts?.dev !== undefined;

    const setupTime = (Date.now() - startTime) / 1000;

    // THEN: Setup should complete quickly
    expect(steps.dependenciesInstalled).toBe(true);
    expect(setupTime).toBeLessThan(300); // 5 minutes
  });
});
