/**
 * E2E Tests: Onboarding Wizard - Complete Flow
 * Story 1.1b - AC-1, AC-2: Complete onboarding flow and workspace creation
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('Onboarding Wizard - Complete Flow', () => {
  test(
    'should complete full onboarding wizard and create default workspace',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-001' },
      tag: ['@P0', '@smoke', '@onboarding', '@workspace']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: Authenticated user lands on onboarding wizard
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');

      // WHEN: User completes Step 1 - User Type Selection
      await page.click('[data-testid="user-type-solo"]');
      await page.click('[data-testid="onboarding-next-button"]');

      // AND: User completes Step 2 - AI Tools Selection
      await page.check('[data-testid="ai-tool-claude"]');
      await page.check('[data-testid="ai-tool-cursor"]');
      await page.click('[data-testid="onboarding-next-button"]');

      // AND: User completes Step 3 - Workspace Configuration
      await page.fill('[data-testid="workspace-name-input"]', 'My First Workspace');
      await page.fill('[data-testid="workspace-description-input"]', 'Testing CC Wrapper');
      await page.selectOption('[data-testid="workspace-template-select"]', 'react');
      await page.click('[data-testid="onboarding-complete-button"]');

      // THEN: User is redirected to dashboard with created workspace
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="workspace-name"]')).toHaveText('My First Workspace');
    }
  );

  test(
    'should display progress indicator showing current step',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-002' },
      tag: ['@P2', '@onboarding', '@ui']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding wizard Step 1
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');

      // WHEN: Viewing progress indicator
      const progressIndicator = page.locator('[data-testid="onboarding-progress"]');

      // THEN: Progress shows Step 1 of 3
      await expect(progressIndicator).toContainText('Step 1 of 3');
      await expect(page.locator('[data-testid="progress-percentage"]')).toHaveText('33%');
    }
  );

  test(
    'should allow navigation back to previous step',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-003' },
      tag: ['@P1', '@onboarding', '@navigation']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User is on Step 2 of onboarding
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');
      await page.click('[data-testid="user-type-solo"]');
      await page.click('[data-testid="onboarding-next-button"]');

      // WHEN: User clicks Back button
      await page.click('[data-testid="onboarding-back-button"]');

      // THEN: User returns to Step 1
      await expect(page.locator('[data-testid="onboarding-step-title"]')).toHaveText(
        'Select Your User Type'
      );
    }
  );

  test(
    'should preserve selections when navigating between steps',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-004' },
      tag: ['@P1', '@onboarding', '@state']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User selects options on Step 1
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');
      await page.click('[data-testid="user-type-team"]');
      await page.click('[data-testid="onboarding-next-button"]');

      // WHEN: User navigates back to Step 1
      await page.click('[data-testid="onboarding-back-button"]');

      // THEN: Previous selection is preserved
      await expect(page.locator('[data-testid="user-type-team"]')).toHaveAttribute(
        'aria-selected',
        'true'
      );
    }
  );
});
