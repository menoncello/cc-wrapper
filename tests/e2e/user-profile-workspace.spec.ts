/**
 * E2E Tests: User Profile - Workspace & Validation
 * Story 1.1 - AC6: Default workspace selection and profile update validation
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('Default Workspace Selection', () => {
  test('should display list of available workspaces in dropdown', {
    annotation: { type: 'test-id', description: 'E2E-PROF-012' },
    tag: ['@P1', '@profile', '@workspace', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User has multiple workspaces
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User opens default workspace dropdown
    await page.click('[data-testid="default-workspace-select"]');

    // THEN: All user workspaces are listed
    await expect(page.locator('[data-testid="workspace-option-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-option-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-option-3"]')).toBeVisible();
  });

  test('should change default workspace selection', {
    annotation: { type: 'test-id', description: 'E2E-PROF-013' },
    tag: ['@P1', '@profile', '@workspace']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User has specific workspace set as default
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User selects different workspace
    await page.selectOption('[data-testid="default-workspace-select"]', 'workspace-2');

    // THEN: New workspace is selected in dropdown
    await expect(page.locator('[data-testid="default-workspace-select"]')).toHaveValue(
      'workspace-2'
    );
  });

  test('should save default workspace preference to backend', {
    annotation: { type: 'test-id', description: 'E2E-PROF-014' },
    tag: ['@P1', '@profile', '@workspace', '@persistence']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User changes default workspace
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.selectOption('[data-testid="default-workspace-select"]', 'workspace-3');

    // WHEN: User saves changes
    await page.click('[data-testid="save-profile-button"]');

    // THEN: Changes persist after reload
    await page.reload();
    await expect(page.locator('[data-testid="default-workspace-select"]')).toHaveValue(
      'workspace-3'
    );
  });

  test('should display default workspace name on dashboard', {
    annotation: { type: 'test-id', description: 'E2E-PROF-015' },
    tag: ['@P0', '@smoke', '@profile', '@workspace', '@dashboard']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User has set default workspace in profile
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.selectOption('[data-testid="default-workspace-select"]', 'workspace-2');
    await page.click('[data-testid="save-profile-button"]');

    // WHEN: User navigates to dashboard
    await page.goto('/dashboard');

    // THEN: Default workspace is loaded and displayed
    await expect(page.locator('[data-testid="active-workspace-name"]')).toHaveText(
      'My Second Workspace'
    );
  });
});

test.describe('Profile Update Validation', () => {
  test('should validate form before submission', {
    annotation: { type: 'test-id', description: 'E2E-PROF-016' },
    tag: ['@P1', '@profile', '@validation']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User is on profile settings
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User attempts to save with invalid data
    await page.fill('[data-testid="quiet-hours-start"]', 'invalid');

    // THEN: Validation error prevents submission
    await page.click('[data-testid="save-profile-button"]');
    await expect(page.locator('[data-testid="form-validation-error"]')).toBeVisible();
  });

  test('should display error message when save fails', {
    annotation: { type: 'test-id', description: 'E2E-PROF-017' },
    tag: ['@P2', '@profile', '@error']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User modifies profile settings
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.click('[data-testid="email-notifications-toggle"]');

    // WHEN: Backend save fails (mock network error)
    // TODO: Mock API endpoint to return error

    await page.click('[data-testid="save-profile-button"]');

    // THEN: Error message is displayed
    await expect(page.locator('[data-testid="save-error-message"]')).toHaveText(
      'Failed to update profile. Please try again.'
    );
  });

  test('should disable save button while save is in progress', {
    annotation: { type: 'test-id', description: 'E2E-PROF-018' },
    tag: ['@P2', '@profile', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User modifies profile
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.click('[data-testid="email-notifications-toggle"]');

    // WHEN: User clicks save
    await page.click('[data-testid="save-profile-button"]');

    // THEN: Save button is disabled during request
    await expect(page.locator('[data-testid="save-profile-button"]')).toBeDisabled();

    // AND: Save button re-enables after completion
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-profile-button"]')).toBeEnabled();
  });

  test('should discard changes when cancel button is clicked', {
    annotation: { type: 'test-id', description: 'E2E-PROF-019' },
    tag: ['@P2', '@profile', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/**', route => route.continue());

    // GIVEN: User modifies profile settings
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    const originalEmailToggleState = await page
      .locator('[data-testid="email-notifications-toggle"]')
      .isChecked();

    await page.click('[data-testid="email-notifications-toggle"]');

    // WHEN: User clicks Cancel button
    await page.click('[data-testid="cancel-changes-button"]');

    // THEN: Form is reset to original values
    const currentEmailToggleState = await page
      .locator('[data-testid="email-notifications-toggle"]')
      .isChecked();
    expect(currentEmailToggleState).toBe(originalEmailToggleState);
  });
});
