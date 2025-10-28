/**
 * E2E Tests: Onboarding Wizard - Skip Functionality
 * Story 1.1b - AC-4: Skip onboarding and access basic functionality
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('Skip Onboarding Functionality', () => {
  test(
    'should allow skipping onboarding from any step',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-013' },
      tag: ['@P1', '@onboarding', '@skip']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding Step 1
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');

      // WHEN: User clicks "Skip for now" button
      await page.click('[data-testid="skip-onboarding-button"]');

      // THEN: User is redirected to dashboard with default workspace
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="welcome-banner"]')).toBeVisible();
    }
  );

  test(
    'should display confirmation dialog when skipping onboarding',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-014' },
      tag: ['@P2', '@onboarding', '@skip', '@ui']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User is on onboarding wizard
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');

      // WHEN: User clicks Skip button
      await page.click('[data-testid="skip-onboarding-button"]');

      // THEN: Confirmation dialog appears
      await expect(page.locator('[data-testid="skip-confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="skip-confirmation-message"]')).toContainText(
        'You can complete your profile setup later'
      );
    }
  );

  test(
    'should create default generic workspace when onboarding is skipped',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-015' },
      tag: ['@P1', '@onboarding', '@skip', '@workspace']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User skips onboarding
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');
      await page.click('[data-testid="skip-onboarding-button"]');
      await page.click('[data-testid="skip-confirm-button"]');

      // WHEN: User lands on dashboard
      // THEN: Default workspace is created
      await expect(page.locator('[data-testid="workspace-name"]')).toHaveText('My Workspace');
      await expect(page.locator('[data-testid="workspace-template-badge"]')).toHaveText('Custom');
    }
  );

  test(
    'should display reminder notification to complete profile setup',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-016' },
      tag: ['@P2', '@onboarding', '@skip', '@notification']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User skipped onboarding
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/onboarding');
      await page.click('[data-testid="skip-onboarding-button"]');
      await page.click('[data-testid="skip-confirm-button"]');

      // WHEN: User is on dashboard
      // THEN: Reminder notification is displayed
      await expect(page.locator('[data-testid="profile-setup-reminder"]')).toBeVisible();
      await expect(page.locator('[data-testid="profile-setup-reminder"]')).toContainText(
        'Complete your profile to unlock all features'
      );
    }
  );

  test(
    'should allow restarting onboarding from profile settings',
    {
      annotation: { type: 'test-id', description: 'E2E-ONB-017' },
      tag: ['@P2', '@onboarding', '@settings', '@restart']
    },
    async ({ page, authenticatedUser }) => {
      // GIVEN: User previously skipped onboarding and is on profile settings
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${authenticatedUser.token}`
      });
      await page.goto('/settings/profile');

      // WHEN: User clicks "Restart Onboarding" button
      await page.click('[data-testid="restart-onboarding-button"]');

      // THEN: User is redirected to onboarding wizard Step 1
      await expect(page).toHaveURL('/onboarding');
      await expect(page.locator('[data-testid="onboarding-step-title"]')).toHaveText(
        'Select Your User Type'
      );
    }
  );
});
