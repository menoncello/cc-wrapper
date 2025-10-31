/**
 * Integration Tests for Code Quality Tools (AC4)
 *
 * Verifies:
 * - ESLint configured with TypeScript support
 * - Prettier configured for consistent formatting
 * - Pre-commit hooks configured for quality checks
 * - TypeScript strict mode enabled
 * - Zero inline ESLint disable comments (user preference)
 */

import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

import { projectFixture } from '../fixtures/project-fixtures';

describe('Code Quality Tools (AC4) [P2]', () => {
  test('0.2-AC4-001: should have ESLint installed', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for ESLint
    const hasESLint = project.hasDependency('eslint');

    // THEN: ESLint should be installed
    expect(hasESLint).toBe(true);
  });

  test('0.2-AC4-002: should have @typescript-eslint/parser for TypeScript support', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for TypeScript ESLint parser
    const hasParser = project.hasDependency('@typescript-eslint/parser');

    // THEN: TypeScript ESLint parser should be installed
    expect(hasParser).toBe(true);
  });

  test('0.2-AC4-003: should have @typescript-eslint/eslint-plugin installed', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for TypeScript ESLint plugin
    const hasPlugin = project.hasDependency('@typescript-eslint/eslint-plugin');

    // THEN: TypeScript ESLint plugin should be installed
    expect(hasPlugin).toBe(true);
  });

  test('0.2-AC4-004: should have eslint.config.js configuration file', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if ESLint config exists
    const exists = project.hasFile('eslint.config.js');

    // THEN: eslint.config.js should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC4-005: should have Prettier installed', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for Prettier
    const hasPrettier = project.hasDependency('prettier');

    // THEN: Prettier should be installed
    expect(hasPrettier).toBe(true);
  });

  test('0.2-AC4-006: should have Prettier configuration file', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if Prettier config exists (either format)
    const hasConfigJs = project.hasFile('prettier.config.js');
    const hasConfigJson = project.hasFile('.prettierrc.json');

    // THEN: prettier.config.js or .prettierrc.json should exist
    expect(hasConfigJs || hasConfigJson).toBe(true);
  });

  test('0.2-AC4-007: should have lint script in package.json', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for lint script
    const hasLintScript = project.hasScript('lint');

    // THEN: lint script should exist
    expect(hasLintScript).toBe(true);
  });

  test('0.2-AC4-008: should have lint:fix script for auto-fixing issues', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for lint:fix script
    const hasLintFixScript = project.hasScript('lint:fix');

    // THEN: lint:fix script should exist
    expect(hasLintFixScript).toBe(true);
  });

  test('0.2-AC4-009: should have format script for Prettier formatting', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for format script
    const hasFormatScript = project.hasScript('format');

    // THEN: format script should exist
    expect(hasFormatScript).toBe(true);
  });

  test('0.2-AC4-010: should have TypeScript strict mode enabled in tsconfig.json', () => {
    // GIVEN: TypeScript configuration
    const project = projectFixture();

    if (!project.hasFile('tsconfig.json')) {
      throw new Error('tsconfig.json not found');
    }

    const tsconfig = project.getTsConfig();

    // WHEN: Checking strict mode
    const strictEnabled = tsconfig.compilerOptions?.strict === true;

    // THEN: Strict mode should be enabled
    expect(strictEnabled).toBe(true);
  });

  test('0.2-AC4-011: should have Husky installed for Git hooks', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for Husky
    const hasHusky = project.hasDependency('husky');

    // THEN: Husky should be installed
    expect(hasHusky).toBe(true);
  });

  test('0.2-AC4-012: should have lint-staged for pre-commit hooks', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for lint-staged
    const hasLintStaged = project.hasDependency('lint-staged');

    // THEN: lint-staged should be installed
    expect(hasLintStaged).toBe(true);
  });

  test('0.2-AC4-013: should have .husky/pre-commit hook configured', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if pre-commit hook exists
    const exists = project.hasFile('.husky/pre-commit');

    // THEN: pre-commit hook should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC4-014: should have lint command configured correctly', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking lint script configuration
    const lintScript = packageJson.scripts?.lint;

    // THEN: Lint script should be properly configured
    expect(lintScript).toBeDefined();
    expect(lintScript).toContain('turbo run lint');
    // Actual lint execution validated in E2E or CI pipeline
  });

  test('0.2-AC4-015: should have format command configured correctly', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking format script configuration
    const formatScript = packageJson.scripts?.format;

    // THEN: Format script should be properly configured
    expect(formatScript).toBeDefined();
    expect(formatScript).toContain('turbo run format');
    // Actual format execution validated in E2E or CI pipeline
  });

  test('0.2-AC4-016: should have type-check script for TypeScript validation', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for type-check script
    const hasTypeCheckScript = project.hasScript('type-check');

    // THEN: type-check script should exist
    expect(hasTypeCheckScript).toBe(true);
  });

  test('0.2-AC4-017: should have zero ESLint inline disable comments in source files', () => {
    // GIVEN: Source files directory
    const project = projectFixture();
    const srcDir = path.join(project.projectRoot, 'src');

    if (!fs.existsSync(srcDir)) {
      // If src doesn't exist yet, skip this test
      expect(true).toBe(true);
      return;
    }

    // WHEN: Searching for eslint-disable comments
    const files = fs.readdirSync(srcDir, { recursive: true });
    const violations: string[] = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file.toString());
      if (fs.statSync(filePath).isFile() && filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('eslint-disable') || content.includes('eslint-disable-next-line')) {
          violations.push(filePath);
        }
      }
    }

    // THEN: No files should have eslint-disable comments
    expect(violations).toEqual([]);
  });
});
