/**
 * E2E Tests: Onboarding - Guided Tour
 * Story 1.1 - AC4: Guided tour functionality after onboarding completion
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('Guided Tour', () => {
  test(
    'should launch guided tour after onboarding completion',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-018' },
      tag: ['@P1', '@onboarding', '@tour']
    },
    async ({ page, authenticatedUser }) => {
      // Network-first: Setup interception before navigation
      await page.route('**/api/**', route => route.continue());

      // GIVEN: User completes onboarding wizard
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');
      await page.click('[data-testid="user-type-solo"]');
      await page.click('[data-testid="onboarding-next-button"]');
      await page.click('[data-testid="onboarding-next-button"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Test Workspace');
      await page.click('[data-testid="onboarding-complete-button"]');

      // WHEN: Dashboard loads
      // THEN: Guided tour overlay appears
      await expect(page.locator('[data-testid="tour-overlay"]')).toBeVisible();
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText(
        'Welcome to CC Wrapper'
      );
    }
  );

  test(
    'should display all tour steps in sequence',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-019' },
      tag: ['@P1', '@onboarding', '@tour', '@steps']
    },
    async ({ page, authenticatedUser }) => {
      // Network-first: Setup interception before navigation
      await page.route('**/api/**', route => route.continue());

      // GIVEN: User starts guided tour
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/dashboard?tour=start');

      // WHEN: User progresses through tour steps
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText(
        'Welcome to CC Wrapper'
      );
      await page.click('[data-testid="tour-next-button"]');

      // THEN: Tour highlights Terminal panel
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText('Terminal Panel');
      await expect(page.locator('[data-testid="tour-spotlight"]')).toHaveAttribute(
        'data-target',
        'terminal-panel'
      );
      await page.click('[data-testid="tour-next-button"]');

      // AND: Tour highlights Browser panel
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText('Browser Panel');
      await page.click('[data-testid="tour-next-button"]');

      // AND: Tour highlights AI Context panel
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText('AI Context Panel');
      await page.click('[data-testid="tour-next-button"]');

      // AND: Tour highlights Wait-Time Optimization features
      await expect(page.locator('[data-testid="tour-step-title"]')).toHaveText(
        'Wait-Time Optimization'
      );
    }
  );

  test(
    'should allow skipping guided tour',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-020' },
      tag: ['@P2', '@onboarding', '@tour', '@skip']
    },
    async ({ page, authenticatedUser }) => {
      // Network-first: Setup interception before navigation
      await page.route('**/api/**', route => route.continue());

      // GIVEN: User is on guided tour
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/dashboard?tour=start');

      // WHEN: User clicks "Skip Tour" button
      await page.click('[data-testid="tour-skip-button"]');

      // THEN: Confirmation dialog appears
      await expect(page.locator('[data-testid="tour-skip-confirmation"]')).toBeVisible();

      // WHEN: User confirms skip
      await page.click('[data-testid="tour-skip-confirm-button"]');

      // THEN: Tour closes and dashboard is accessible
      await expect(page.locator('[data-testid="tour-overlay"]')).not.toBeVisible();
    }
  );

  test(
    'should store tour completion status in user preferences',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-021' },
      tag: ['@P1', '@onboarding', '@tour', '@persistence']
    },
    async ({ page, authenticatedUser }) => {
      // Network-first: Setup interception before navigation
      await page.route('**/api/**', route => route.continue());

      // GIVEN: User completes guided tour
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/dashboard?tour=start');
      await page.click('[data-testid="tour-next-button"]');
      await page.click('[data-testid="tour-next-button"]');
      await page.click('[data-testid="tour-next-button"]');
      await page.click('[data-testid="tour-next-button"]');
      await page.click('[data-testid="tour-complete-button"]');

      // WHEN: User navigates away and returns to dashboard
      await page.goto('/settings');
      await page.goto('/dashboard');

      // THEN: Tour does not appear again
      await expect(page.locator('[data-testid="tour-overlay"]')).not.toBeVisible();
    }
  );
});
