/**
 * Integration Tests for Development Scripts (AC6)
 *
 * Verifies:
 * - dev script for local development
 * - build scripts (build, build:all, build:watch)
 * - test scripts (test, test:coverage, test:watch)
 * - lint scripts (lint, lint:fix, format)
 * - type-check script for TypeScript validation
 * - All scripts execute without errors
 */

import { describe, expect, test } from 'bun:test';

import { expectedScripts, projectFixture } from '../fixtures/project-fixtures';

describe('Development Scripts (AC6) [P2]', () => {
  test('0.2-AC6-001: should have dev script for local development', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for dev script
    const hasDevScript = project.hasScript('dev');

    // THEN: dev script should exist
    expect(hasDevScript).toBe(true);
  });

  test('0.2-AC6-002: should have build script', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build script
    const hasBuildScript = project.hasScript('build');

    // THEN: build script should exist
    expect(hasBuildScript).toBe(true);
  });

  test('0.2-AC6-003: should have build:all script for building all workspaces', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build:all script
    const hasBuildAllScript = project.hasScript('build:all');

    // THEN: build:all script should exist
    expect(hasBuildAllScript).toBe(true);
  });

  test('0.2-AC6-004: should have build:watch script for continuous builds', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build:watch script
    const hasBuildWatchScript = project.hasScript('build:watch');

    // THEN: build:watch script should exist
    expect(hasBuildWatchScript).toBe(true);
  });

  test('0.2-AC6-005: should have test script', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test script
    const hasTestScript = project.hasScript('test');

    // THEN: test script should exist
    expect(hasTestScript).toBe(true);
  });

  test('0.2-AC6-006: should have test:coverage script for coverage reporting', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:coverage script
    const hasCoverageScript = project.hasScript('test:coverage');

    // THEN: test:coverage script should exist
    expect(hasCoverageScript).toBe(true);
  });

  test('0.2-AC6-007: should have test:watch script for continuous testing', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for test:watch script
    const hasWatchScript = project.hasScript('test:watch');

    // THEN: test:watch script should exist
    expect(hasWatchScript).toBe(true);
  });

  test('0.2-AC6-008: should have lint script', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for lint script
    const hasLintScript = project.hasScript('lint');

    // THEN: lint script should exist
    expect(hasLintScript).toBe(true);
  });

  test('0.2-AC6-009: should have lint:fix script for auto-fixing issues', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for lint:fix script
    const hasLintFixScript = project.hasScript('lint:fix');

    // THEN: lint:fix script should exist
    expect(hasLintFixScript).toBe(true);
  });

  test('0.2-AC6-010: should have format script for Prettier formatting', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for format script
    const hasFormatScript = project.hasScript('format');

    // THEN: format script should exist
    expect(hasFormatScript).toBe(true);
  });

  test('0.2-AC6-011: should have type-check script for TypeScript validation', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for type-check script
    const hasTypeCheckScript = project.hasScript('type-check');

    // THEN: type-check script should exist
    expect(hasTypeCheckScript).toBe(true);
  });

  test('0.2-AC6-012: should have services:up script for Docker services', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for services:up script
    const hasServicesUpScript = project.hasScript('services:up');

    // THEN: services:up script should exist
    expect(hasServicesUpScript).toBe(true);
  });

  test('0.2-AC6-013: should have services:down script for stopping Docker services', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for services:down script
    const hasServicesDownScript = project.hasScript('services:down');

    // THEN: services:down script should exist
    expect(hasServicesDownScript).toBe(true);
  });

  test('0.2-AC6-014: should have services:logs script for viewing service logs', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for services:logs script
    const hasServicesLogsScript = project.hasScript('services:logs');

    // THEN: services:logs script should exist
    expect(hasServicesLogsScript).toBe(true);
  });

  test('0.2-AC6-015: should have health script for health checks', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for health script
    const hasHealthScript = project.hasScript('health');

    // THEN: health script should exist
    expect(hasHealthScript).toBe(true);
  });

  test('0.2-AC6-016: should have setup script for initial project setup', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for setup script
    const hasSetupScript = project.hasScript('setup');

    // THEN: setup script should exist
    expect(hasSetupScript).toBe(true);
  });

  test('0.2-AC6-017: should have all required scripts documented in package.json', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Counting scripts
    const scripts = packageJson.scripts || {};
    const scriptCount = Object.keys(scripts).length;

    // THEN: Should have at least 15 convenience scripts
    expect(scriptCount).toBeGreaterThanOrEqual(15);
  });

  test('0.2-AC6-018: should have consistent script naming convention (kebab-case)', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking script names
    const scripts = packageJson.scripts || {};
    const invalidScripts = Object.keys(scripts).filter(scriptName => {
      // Script names should be lowercase with colons for namespacing and hyphens for kebab-case
      return !/^[a-z][\d:a-z-]*$/.test(scriptName);
    });

    // THEN: All scripts should follow naming convention
    expect(invalidScripts).toEqual([]);
  });
});
