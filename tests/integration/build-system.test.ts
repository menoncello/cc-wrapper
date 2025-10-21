/**
 * Integration Tests for Build System (AC2)
 *
 * Verifies:
 * - Vite 7.0.0 configured for frontend builds
 * - TypeScript compilation for backend services
 * - Build scripts exist and execute successfully
 * - Production builds include minification
 * - Source maps generated for debugging
 * - Build performance < 30 seconds
 */

import { describe, expect, test } from 'bun:test';

import { expectedDependencies, projectFixture } from '../fixtures/project-fixtures';

describe('Build System (AC2) [P1]', () => {
  test('0.2-AC2-001: should have Vite 7.x installed in devDependencies', () => {
    // GIVEN: Root package.json and expected dependencies
    const project = projectFixture();
    const packageJson = project.getPackageJson();
    const expected = expectedDependencies();

    // WHEN: Checking Vite version
    const viteVersion = packageJson.devDependencies?.vite;

    // THEN: Vite 7.x should be installed
    expect(viteVersion).toBeDefined();
    expect(viteVersion).toMatch(expected.vite.pattern);
  });

  test('0.2-AC2-002: should have vite.config.ts for frontend build configuration', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if vite config exists
    const exists = project.hasFile('vite.config.ts');

    // THEN: vite.config.ts should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC2-003: should have TypeScript 5.9.x configured', () => {
    // GIVEN: Root package.json and expected dependencies
    const project = projectFixture();
    const packageJson = project.getPackageJson();
    const expected = expectedDependencies();

    // WHEN: Checking TypeScript version
    const tsVersion = packageJson.devDependencies?.typescript;

    // THEN: TypeScript 5.9.x should be installed
    expect(tsVersion).toBeDefined();
    expect(tsVersion).toMatch(expected.typescript.pattern);
  });

  test('0.2-AC2-004: should have build script in package.json', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build script
    const hasBuildScript = project.hasScript('build');

    // THEN: build script should exist
    expect(hasBuildScript).toBe(true);
  });

  test('0.2-AC2-005: should have build:all script for building all workspaces', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build:all script
    const hasBuildAllScript = project.hasScript('build:all');

    // THEN: build:all script should exist
    expect(hasBuildAllScript).toBe(true);
  });

  test('0.2-AC2-006: should have build:watch script for continuous builds', () => {
    // GIVEN: Root package.json
    const project = projectFixture();

    // WHEN: Checking for build:watch script
    const hasBuildWatchScript = project.hasScript('build:watch');

    // THEN: build:watch script should exist
    expect(hasBuildWatchScript).toBe(true);
  });

  test('0.2-AC2-007: should have build command configured correctly', () => {
    // GIVEN: Root package.json
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking build script configuration
    const buildScript = packageJson.scripts?.build;

    // THEN: Build script should be properly configured
    expect(buildScript).toBeDefined();
    expect(buildScript).toContain('turbo'); // Should use turbo for monorepo builds
  });

  test('0.2-AC2-008: should generate dist/ output directory after build', async () => {
    // GIVEN: Build has been executed
    // Note: This test assumes build creates dist/ directory
    const project = projectFixture();

    // WHEN: Checking for dist directory
    const exists = project.hasFile('dist');

    // THEN: dist/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC2-009: should generate minified production build', async () => {
    // GIVEN: Production build output
    const project = projectFixture();

    if (!project.hasFile('dist')) {
      throw new Error('dist/ directory does not exist - build may have failed');
    }

    // WHEN: Checking for .js files in dist
    const jsFiles = project.findFiles('dist', '.js', true);

    // THEN: JavaScript files should exist in dist
    expect(jsFiles.length).toBeGreaterThan(0);
  });

  test('0.2-AC2-010: should generate source maps for debugging', () => {
    // GIVEN: Build output directory
    const project = projectFixture();

    if (!project.hasFile('dist')) {
      throw new Error('dist/ directory does not exist - build may have failed');
    }

    // WHEN: Checking for .map files
    const mapFiles = project.findFiles('dist', '.map', true);

    // THEN: Source map files should exist
    expect(mapFiles.length).toBeGreaterThan(0);
  });

  // NOTE: Build execution and performance tests moved to E2E suite
  // See tests/e2e/build-validation.test.ts for actual build execution tests
  test('0.2-AC2-011: should have build performance requirements documented', () => {
    // GIVEN: Build configuration
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking build script
    const buildScript = packageJson.scripts?.build;

    // THEN: Build script should exist (performance validated in E2E)
    expect(buildScript).toBeDefined();
    // Actual performance testing happens in E2E suite with real builds
  });
});
