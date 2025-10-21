/**
 * Integration Tests for Test Framework Configuration (AC3)
 *
 * Verifies:
 * - Bun Test configured for unit testing
 * - Playwright 1.56.0 installed and configured for E2E tests
 * - playwright.config.ts exists with proper configuration
 * - Sample tests can execute successfully
 * - Test coverage reporting configured
 * - Watch mode available for continuous testing
 */

import { describe, expect, test } from 'bun:test';

import { expectedDependencies, projectFixture } from '../fixtures/project-fixtures';

describe('Test Framework Configuration (AC3) [P1]', () => {
  test('0.2-AC3-001: should have Bun Test available (bun:test)', () => {
    // GIVEN: Bun runtime environment
    // WHEN: Importing from bun:test
    const bunTestAvailable = typeof describe !== 'undefined' && typeof test !== 'undefined';

    // THEN: Bun Test should be available
    expect(bunTestAvailable).toBe(true);
  });

  test('0.2-AC3-002: should have Playwright 1.56.x installed', () => {
    // GIVEN: Root package.json and expected dependencies
    const project = projectFixture();
    const packageJson = project.getPackageJson();
    const expected = expectedDependencies();

    // WHEN: Checking Playwright version
    const playwrightVersion = packageJson.devDependencies?.playwright;

    // THEN: Playwright 1.56.x should be installed
    expect(playwrightVersion).toBeDefined();
    expect(playwrightVersion).toMatch(expected.playwright.pattern);
  });

  test('0.2-AC3-003: should have @playwright/test installed', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking @playwright/test
    const hasDep = project.hasDependency('@playwright/test');

    // THEN: @playwright/test should be installed
    expect(hasDep).toBe(true);
  });

  test('0.2-AC3-004: should have playwright.config.ts configuration file', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if playwright config exists
    const exists = project.hasFile('playwright.config.ts');

    // THEN: playwright.config.ts should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC3-005: should have tests/ directory with test files', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking tests directory
    const exists = project.hasFile('tests');

    // THEN: tests/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC3-006: should have e2e/ subdirectory in tests/', () => {
    // GIVEN: tests directory
    const project = projectFixture();

    // WHEN: Checking e2e directory
    const exists = project.hasFile('tests/e2e');

    // THEN: tests/e2e/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC3-007: should have integration/ subdirectory in tests/', () => {
    // GIVEN: tests directory
    const project = projectFixture();

    // WHEN: Checking integration directory
    const exists = project.hasFile('tests/integration');

    // THEN: tests/integration/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC3-008: should have test script in package.json', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test script
    const hasTestScript = project.hasScript('test');

    // THEN: test script should exist
    expect(hasTestScript).toBe(true);
  });

  test('0.2-AC3-009: should have test:coverage script for coverage reporting', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:coverage script
    const hasTestCoverageScript = project.hasScript('test:coverage');

    // THEN: test:coverage script should exist
    expect(hasTestCoverageScript).toBe(true);
  });

  test('0.2-AC3-010: should have test:watch script for continuous testing', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:watch script
    const hasTestWatchScript = project.hasScript('test:watch');

    // THEN: test:watch script should exist
    expect(hasTestWatchScript).toBe(true);
  });

  test('0.2-AC3-011: should have test:e2e script for Playwright tests', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:e2e script
    const hasE2EScript = project.hasScript('test:e2e');

    // THEN: test:e2e script should exist
    expect(hasE2EScript).toBe(true);
  });

  test('0.2-AC3-012: should have at least one sample test file', () => {
    // GIVEN: tests directory
    const project = projectFixture();

    if (!project.hasFile('tests')) {
      throw new Error('tests/ directory does not exist');
    }

    // WHEN: Counting test files
    const testFiles = project.findFiles('tests', '.test.ts', true);
    const specFiles = project.findFiles('tests', '.spec.ts', true);

    // THEN: At least one test file should exist
    expect(testFiles.length + specFiles.length).toBeGreaterThan(0);
  });

  test('0.2-AC3-013: should have test script configured for Bun Test', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking test script configuration
    const testScript = packageJson.scripts?.test;

    // THEN: Test script should use turbo to run tests
    expect(testScript).toBeDefined();
    expect(testScript).toContain('turbo run test');
    // Actual test execution validated in E2E suite
  });

  test('0.2-AC3-014: should have Stryker mutation testing configured', () => {
    // GIVEN: Project dependencies
    const project = projectFixture();

    // WHEN: Checking for Stryker
    const hasStryker = project.hasDependency('@stryker-mutator/core');

    // THEN: Stryker should be installed
    expect(hasStryker).toBe(true);
  });

  test('0.2-AC3-015: should have stryker.config.json for mutation testing', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if Stryker config exists
    const exists = project.hasFile('stryker.config.json');

    // THEN: stryker.config.json should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC3-016: should have test:mutation script for running Stryker', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:mutation script
    const hasMutationScript = project.hasScript('test:mutation');

    // THEN: test:mutation script should exist
    expect(hasMutationScript).toBe(true);
  });
});
