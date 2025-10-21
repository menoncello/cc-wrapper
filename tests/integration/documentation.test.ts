/**
 * Integration Tests for Documentation Structure (AC7)
 *
 * Verifies:
 * - CONTRIBUTING.md with contribution guidelines
 * - CODE_OF_CONDUCT.md
 * - Development workflow documentation
 * - Build and deployment process documentation
 * - Troubleshooting guide
 * - README.md with project overview
 */

import { describe, expect, test } from 'bun:test';

import { expectedFiles, projectFixture } from '../fixtures/project-fixtures';

describe('Documentation Structure (AC7) [P3]', () => {
  test('0.2-AC7-001: should have README.md in project root', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if README exists
    const exists = project.hasFile('README.md');

    // THEN: README.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-002: should have CONTRIBUTING.md with contribution guidelines', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if CONTRIBUTING.md exists
    const exists = project.hasFile('CONTRIBUTING.md');

    // THEN: CONTRIBUTING.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-003: should have CODE_OF_CONDUCT.md', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if CODE_OF_CONDUCT.md exists
    const exists = project.hasFile('CODE_OF_CONDUCT.md');

    // THEN: CODE_OF_CONDUCT.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-004: should have docs/ directory for documentation', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if docs directory exists
    const exists = project.hasFile('docs');

    // THEN: docs/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-005: should have development workflow documentation', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if development workflow doc exists
    const exists = project.hasFile('docs/development-workflow.md');

    // THEN: development-workflow.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-006: should have build process documentation', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if build process doc exists
    const exists = project.hasFile('docs/build-process.md');

    // THEN: build-process.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-007: should have deployment documentation', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if deployment doc exists
    const exists = project.hasFile('docs/deployment.md');

    // THEN: deployment.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-008: should have troubleshooting guide', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if troubleshooting guide exists
    const exists = project.hasFile('docs/troubleshooting.md');

    // THEN: troubleshooting.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-009: should have non-empty README.md with project description', () => {
    // GIVEN: README.md file
    const project = projectFixture();

    if (!project.hasFile('README.md')) {
      throw new Error('README.md not found');
    }

    // WHEN: Reading README content
    const content = project.readFile('README.md');

    // THEN: README should contain project name and description
    expect(content.length).toBeGreaterThan(100);
    expect(content.toLowerCase()).toContain('cc wrapper');
  });

  test('0.2-AC7-010: should have non-empty CONTRIBUTING.md with guidelines', () => {
    // GIVEN: CONTRIBUTING.md file
    const project = projectFixture();

    if (!project.hasFile('CONTRIBUTING.md')) {
      throw new Error('CONTRIBUTING.md not found');
    }

    // WHEN: Reading CONTRIBUTING content
    const content = project.readFile('CONTRIBUTING.md');

    // THEN: CONTRIBUTING should have substantial content
    expect(content.length).toBeGreaterThan(200);
  });

  test('0.2-AC7-011: should have installation instructions in README', () => {
    // GIVEN: README.md file
    const project = projectFixture();

    if (!project.hasFile('README.md')) {
      throw new Error('README.md not found');
    }

    // WHEN: Reading README content
    const content = project.readFile('README.md').toLowerCase();

    // THEN: README should contain installation section
    const hasInstallation =
      content.includes('installation') ||
      content.includes('getting started') ||
      content.includes('setup');

    expect(hasInstallation).toBe(true);
  });

  test('0.2-AC7-012: should have usage examples in README', () => {
    // GIVEN: README.md file
    const project = projectFixture();

    if (!project.hasFile('README.md')) {
      throw new Error('README.md not found');
    }

    // WHEN: Reading README content
    const content = project.readFile('README.md').toLowerCase();

    // THEN: README should contain usage section
    const hasUsage = content.includes('usage') || content.includes('example');

    expect(hasUsage).toBe(true);
  });

  test('0.2-AC7-013: should document available scripts in CONTRIBUTING', () => {
    // GIVEN: CONTRIBUTING.md file
    const project = projectFixture();

    if (!project.hasFile('CONTRIBUTING.md')) {
      throw new Error('CONTRIBUTING.md not found');
    }

    // WHEN: Reading CONTRIBUTING content
    const content = project.readFile('CONTRIBUTING.md').toLowerCase();

    // THEN: CONTRIBUTING should mention development scripts
    const hasScripts =
      (content.includes('npm run') || content.includes('bun run')) &&
      (content.includes('build') || content.includes('test'));

    expect(hasScripts).toBe(true);
  });

  test('0.2-AC7-014: should have architecture documentation', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if architecture doc exists
    const exists = project.hasFile('docs/architecture.md');

    // THEN: architecture.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-015: should have testing documentation', () => {
    // GIVEN: docs directory
    const project = projectFixture();

    // WHEN: Checking if testing doc exists
    const exists = project.hasFile('docs/testing.md');

    // THEN: testing.md should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-016: should have LICENSE file', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if LICENSE exists
    const exists = project.hasFile('LICENSE');

    // THEN: LICENSE file should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC7-017: should have at least 7 documentation files', () => {
    // GIVEN: Project root and docs directory
    const project = projectFixture();
    const expected = expectedFiles();

    // WHEN: Counting markdown files
    const rootDocs = expected.root.filter(file => project.hasFile(file)).length;
    const docsDirFiles = project.hasFile('docs')
      ? project.findFiles('docs', '.md', true).length
      : 0;

    const totalDocs = rootDocs + docsDirFiles;

    // THEN: Should have at least 7 documentation files
    expect(totalDocs).toBeGreaterThanOrEqual(7);
  });
});
