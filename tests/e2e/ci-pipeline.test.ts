/**
 * E2E Tests for CI/CD Pipeline (AC5)
 *
 * Verifies:
 * - GitHub Actions workflow file exists
 * - Workflow includes build job
 * - Workflow includes test job
 * - Workflow includes quality gate checks
 * - Workflow configured for automated deployment
 * - Status notifications configured
 *
 * Note: These tests use Playwright once framework is configured (AC3)
 */

import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

describe('CI/CD Pipeline (AC5)', () => {
  test('should have .github/workflows directory', () => {
    // GIVEN: Project root directory
    const workflowsDir = path.join(PROJECT_ROOT, '.github/workflows');

    // WHEN: Checking if workflows directory exists
    const exists = fs.existsSync(workflowsDir);

    // THEN: .github/workflows/ directory should exist
    expect(exists).toBe(true);
  });

  test('should have GitHub Actions workflow file for CI', () => {
    // GIVEN: Workflows directory
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    // WHEN: Checking if CI workflow exists
    const exists = fs.existsSync(ciWorkflowPath);

    // THEN: ci.yml workflow file should exist
    expect(exists).toBe(true);
  });

  test('should have build job in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking for build job
    const hasBuildJob = workflow.jobs?.build !== undefined;

    // THEN: Build job should exist
    expect(hasBuildJob).toBe(true);
  });

  test('should have test job in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking for test job
    const hasTestJob = workflow.jobs?.test !== undefined;

    // THEN: Test job should exist
    expect(hasTestJob).toBe(true);
  });

  test('should have lint job in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking for lint job
    const hasLintJob = workflow.jobs?.lint !== undefined;

    // THEN: Lint job should exist
    expect(hasLintJob).toBe(true);
  });

  test('should have type-check job in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking for type-check job
    const hasTypeCheckJob = workflow.jobs?.['type-check'] !== undefined;

    // THEN: Type-check job should exist
    expect(hasTypeCheckJob).toBe(true);
  });

  test('should trigger workflow on push to main branch', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking push trigger
    const hasPushTrigger =
      workflow.on?.push !== undefined &&
      (workflow.on.push.branches?.includes('main') ||
        workflow.on.push.branches?.includes('master'));

    // THEN: Workflow should trigger on push to main/master
    expect(hasPushTrigger).toBe(true);
  });

  test('should trigger workflow on pull requests', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking pull_request trigger
    const hasPRTrigger = workflow.on?.pull_request !== undefined;

    // THEN: Workflow should trigger on pull requests
    expect(hasPRTrigger).toBe(true);
  });

  test('should use Bun runtime in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');

    // WHEN: Checking for Bun setup
    const hasBunSetup =
      workflowContent.includes('bun') || workflowContent.includes('oven-sh/setup-bun');

    // THEN: Workflow should configure Bun runtime
    expect(hasBunSetup).toBe(true);
  });

  test('should cache dependencies in CI workflow', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');

    // WHEN: Checking for caching
    const hasCache = workflowContent.includes('cache') || workflowContent.includes('actions/cache');

    // THEN: Workflow should cache dependencies
    expect(hasCache).toBe(true);
  });

  test('should have deployment workflow for staging', () => {
    // GIVEN: Workflows directory
    const releaseWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/release.yml');

    // WHEN: Checking if deployment workflow exists
    const exists = fs.existsSync(releaseWorkflowPath);

    // THEN: release.yml workflow file should exist (handles staging and production deployment)
    expect(exists).toBe(true);
  });

  test('should run jobs in parallel for faster feedback', () => {
    // GIVEN: CI workflow file
    const ciWorkflowPath = path.join(PROJECT_ROOT, '.github/workflows/ci.yml');

    if (!fs.existsSync(ciWorkflowPath)) {
      throw new Error('ci.yml not found');
    }

    const workflowContent = fs.readFileSync(ciWorkflowPath, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    // WHEN: Checking job count (parallel execution)
    const jobCount = Object.keys(workflow.jobs || {}).length;

    // THEN: Should have multiple jobs that can run in parallel
    expect(jobCount).toBeGreaterThanOrEqual(3);
  });

  test('should have status badges in README for CI status', () => {
    // GIVEN: README.md file
    const readmePath = path.join(PROJECT_ROOT, 'README.md');

    if (!fs.existsSync(readmePath)) {
      throw new Error('README.md not found');
    }

    // WHEN: Reading README content
    const content = fs.readFileSync(readmePath, 'utf-8');

    // THEN: README should contain GitHub Actions badge
    const hasBadge =
      content.includes('github.com') &&
      (content.includes('badge') || content.includes('workflow') || content.includes('status'));

    expect(hasBadge).toBe(true);
  });
});
