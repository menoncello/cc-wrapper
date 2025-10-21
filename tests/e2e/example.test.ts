/**
 * End-to-End (E2E) Test Example
 *
 * E2E tests verify complete user workflows from start to finish.
 * They test the system as a whole, including all integrations and infrastructure.
 *
 * Best Practices:
 * - Test critical user journeys
 * - Use realistic data and scenarios
 * - Test across different environments
 * - Include error recovery scenarios
 * - Keep tests maintainable and readable
 * - Use page objects or similar patterns for UI tests
 */

import { $ } from 'bun';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Example: Project Setup E2E Workflow
 * Tests the complete workflow of setting up a new project
 */
describe('Project Setup - E2E Workflow', () => {
  const testProjectPath = path.join(process.cwd(), 'temp-e2e-project');

  beforeAll(async () => {
    // Create test project directory
    await fs.mkdir(testProjectPath, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test project
    await fs.rm(testProjectPath, { recursive: true, force: true });
  });

  test('E2E-001: Complete project initialization workflow', async () => {
    /**
     * This test validates the entire project setup process:
     * 1. Create project structure
     * 2. Initialize package.json
     * 3. Create configuration files
     * 4. Verify project is ready to use
     */

    // Step 1: Create project directories
    const directories = ['src', 'tests', 'docs'];
    for (const dir of directories) {
      const dirPath = path.join(testProjectPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
      const exists = await fs
        .access(dirPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    }

    // Step 2: Create package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      type: 'module',
      scripts: {
        test: 'bun test',
        build: 'bun build src/index.ts --outdir dist'
      }
    };

    const packageJsonPath = path.join(testProjectPath, 'package.json');
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const packageJsonExists = await fs
      .access(packageJsonPath)
      .then(() => true)
      .catch(() => false);
    expect(packageJsonExists).toBe(true);

    // Step 3: Create source file
    const sourceCode = `
/**
 * Main entry point
 */
export function main(): string {
  return 'Hello from test project!';
}

if (import.meta.main) {
  console.log(main());
}
`;

    const srcPath = path.join(testProjectPath, 'src', 'index.ts');
    await fs.writeFile(srcPath, sourceCode);

    const srcExists = await fs
      .access(srcPath)
      .then(() => true)
      .catch(() => false);
    expect(srcExists).toBe(true);

    // Step 4: Create test file
    const testCode = `
import { test, expect } from 'bun:test';
import { main } from '../src/index';

test('main returns greeting', () => {
  expect(main()).toBe('Hello from test project!');
});
`;

    const testPath = path.join(testProjectPath, 'tests', 'index.test.ts');
    await fs.writeFile(testPath, testCode);

    const testExists = await fs
      .access(testPath)
      .then(() => true)
      .catch(() => false);
    expect(testExists).toBe(true);

    // Step 5: Verify project structure
    const files = await fs.readdir(testProjectPath);
    expect(files).toContain('src');
    expect(files).toContain('tests');
    expect(files).toContain('docs');
    expect(files).toContain('package.json');

    // Step 6: Verify package.json content
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    expect(pkg.name).toBe('test-project');
    expect(pkg.scripts.test).toBe('bun test');
  });

  test('E2E-002: Verify project can run tests', async () => {
    /**
     * This test verifies that the project setup is functional
     * by running actual tests
     */

    // Change to test project directory
    const originalCwd = process.cwd();
    process.chdir(testProjectPath);

    try {
      // Create a simple test
      const testCode = `
import { test, expect } from 'bun:test';

test('addition works', () => {
  expect(1 + 1).toBe(2);
});

test('string concatenation works', () => {
  expect('hello' + ' ' + 'world').toBe('hello world');
});
`;

      await fs.writeFile('tests/basic.test.ts', testCode);

      // Run tests (this will execute in the test project directory)
      const result = await $`bun test tests/basic.test.ts`.quiet();

      // Verify tests ran successfully
      expect(result.exitCode).toBe(0);
    } finally {
      // Restore original directory
      process.chdir(originalCwd);
    }
  });

  test('E2E-003: Verify project can be built', async () => {
    /**
     * This test verifies the build process works correctly
     */

    const originalCwd = process.cwd();
    process.chdir(testProjectPath);

    try {
      // Run build command
      const buildResult = await $`bun build src/index.ts --outdir dist`.quiet();

      // Build should complete successfully
      expect(buildResult.exitCode).toBe(0);

      // Note: Bun build might create files directly in dist or with specific names
      // We verify the build succeeded by checking exit code
      // In a real project, you'd check for specific output files
    } finally {
      process.chdir(originalCwd);
    }
  });
});

/**
 * Example: Configuration Management E2E
 * Tests configuration file creation and validation
 */
describe('Configuration Management - E2E', () => {
  const configTestPath = path.join(process.cwd(), 'temp-config-test');

  beforeAll(async () => {
    await fs.mkdir(configTestPath, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(configTestPath, { recursive: true, force: true });
  });

  test('E2E-004: Create and validate multiple configuration files', async () => {
    const originalCwd = process.cwd();
    process.chdir(configTestPath);

    try {
      // Create TypeScript config
      const tsConfig = {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          strict: true
        }
      };

      await fs.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));

      // Create package.json
      const packageJson = {
        name: 'config-test',
        version: '1.0.0',
        type: 'module'
      };

      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));

      // Create .gitignore
      const gitignore = `
node_modules/
dist/
coverage/
*.log
`;

      await fs.writeFile('.gitignore', gitignore);

      // Verify all files exist
      const files = await fs.readdir('.');
      expect(files).toContain('tsconfig.json');
      expect(files).toContain('package.json');
      expect(files).toContain('.gitignore');

      // Verify file contents
      const tsConfigContent = await fs.readFile('tsconfig.json', 'utf-8');
      const parsedTsConfig = JSON.parse(tsConfigContent);
      expect(parsedTsConfig.compilerOptions.strict).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
