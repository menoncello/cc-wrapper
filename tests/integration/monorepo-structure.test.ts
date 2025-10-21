/**
 * Integration Tests for Monorepo Structure (AC1)
 *
 * Verifies:
 * - packages/ directory exists for shared libraries
 * - services/ directory exists for backend microservices
 * - apps/ directory exists for frontend applications
 * - Workspace configuration in package.json
 * - Individual workspace package.json files
 */

import { describe, expect, test } from 'bun:test';

import { projectFixture } from '../fixtures/project-fixtures';

describe('Monorepo Structure (AC1) [P0]', () => {
  test('0.2-AC1-001: should have packages/ directory for shared libraries', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if packages directory exists
    const exists = project.hasFile('packages');

    // THEN: packages/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC1-002: should have services/ directory for backend microservices', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if services directory exists
    const exists = project.hasFile('services');

    // THEN: services/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC1-003: should have apps/ directory for frontend applications', () => {
    // GIVEN: Project root directory
    const project = projectFixture();

    // WHEN: Checking if apps directory exists
    const exists = project.hasFile('apps');

    // THEN: apps/ directory should exist
    expect(exists).toBe(true);
  });

  test('0.2-AC1-004: should have Bun workspaces configured in root package.json', () => {
    // GIVEN: Root package.json file
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking workspaces configuration
    const hasWorkspaces = packageJson.workspaces !== undefined;

    // THEN: Workspaces should be configured
    expect(hasWorkspaces).toBe(true);
  });

  test('0.2-AC1-005: should include packages/* in workspaces configuration', () => {
    // GIVEN: Root package.json with workspaces
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking if packages/* is in workspaces
    const hasPackagesWorkspace = packageJson.workspaces?.includes('packages/*');

    // THEN: packages/* should be in workspaces array
    expect(hasPackagesWorkspace).toBe(true);
  });

  test('0.2-AC1-006: should include services/* in workspaces configuration', () => {
    // GIVEN: Root package.json with workspaces
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking if services/* is in workspaces
    const hasServicesWorkspace = packageJson.workspaces?.includes('services/*');

    // THEN: services/* should be in workspaces array
    expect(hasServicesWorkspace).toBe(true);
  });

  test('0.2-AC1-007: should include apps/* in workspaces configuration', () => {
    // GIVEN: Root package.json with workspaces
    const project = projectFixture();
    const packageJson = project.getPackageJson();

    // WHEN: Checking if apps/* is in workspaces
    const hasAppsWorkspace = packageJson.workspaces?.includes('apps/*');

    // THEN: apps/* should be in workspaces array
    expect(hasAppsWorkspace).toBe(true);
  });

  test('0.2-AC1-008: should have at least one package in packages/ directory', () => {
    // GIVEN: packages directory exists
    const project = projectFixture();

    // WHEN: Listing packages
    const packages = project.getSubdirectories('packages');

    // THEN: At least one package should exist
    expect(packages.length).toBeGreaterThan(0);
  });

  test('0.2-AC1-009: should have valid package.json in each workspace package', () => {
    // GIVEN: packages directory with subdirectories
    const project = projectFixture();
    const packages = project.getSubdirectories('packages');

    if (packages.length === 0) {
      throw new Error('packages/ directory does not exist or is empty');
    }

    // WHEN: Checking each package for package.json
    const invalidPackages: string[] = [];
    packages.forEach(pkg => {
      const packageJsonPath = `packages/${pkg}/package.json`;
      if (!project.hasFile(packageJsonPath)) {
        invalidPackages.push(pkg);
      } else {
        try {
          JSON.parse(project.readFile(packageJsonPath));
        } catch {
          invalidPackages.push(pkg);
        }
      }
    });

    // THEN: All packages should have valid package.json
    expect(invalidPackages).toEqual([]);
  });
});
