/**
 * E2E Tests: User Profile Settings
 * Story 1.1 - AC6: Profile settings with AI tools, notifications, and default workspace
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('User Profile Settings Page', () => {
  test('should display all profile settings sections', {
    annotation: { type: 'test-id', description: 'E2E-PROF-001' },
    tag: ['@P1', '@profile', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: Authenticated user navigates to profile settings
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: Viewing profile settings page
    // THEN: All sections are visible
    await expect(page.locator('[data-testid="ai-tools-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-preferences-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="default-workspace-section"]')).toBeVisible();
  });

  test('should load current user profile data on page load', {
    annotation: { type: 'test-id', description: 'E2E-PROF-002' },
    tag: ['@P1', '@profile', '@data']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User has existing profile with preferences
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: Page loads
    // THEN: Current preferences are displayed
    await expect(page.locator('[data-testid="selected-ai-tools"]')).toContainText('Claude');
    await expect(page.locator('[data-testid="email-notifications-toggle"]')).toBeChecked();
  });
});

test.describe('Preferred AI Tools Management', () => {
  test('should add new AI tool to preferred list', {
    annotation: { type: 'test-id', description: 'E2E-PROF-003' },
    tag: ['@P1', '@profile', '@ai-tools']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on profile settings with current AI tools
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User clicks "Add AI Tool" button
    await page.click('[data-testid="add-ai-tool-button"]');

    // AND: User selects new tool from dropdown
    await page.selectOption('[data-testid="ai-tool-dropdown"]', 'chatgpt');
    await page.click('[data-testid="confirm-add-tool-button"]');

    // THEN: New tool appears in preferred list
    await expect(page.locator('[data-testid="ai-tool-chatgpt"]')).toBeVisible();
  });

  test('should remove AI tool from preferred list', {
    annotation: { type: 'test-id', description: 'E2E-PROF-004' },
    tag: ['@P2', '@profile', '@ai-tools']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User has multiple preferred AI tools
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User clicks remove button on specific tool
    await page.click('[data-testid="remove-ai-tool-cursor"]');

    // THEN: Tool is removed from list
    await expect(page.locator('[data-testid="ai-tool-cursor"]')).not.toBeVisible();
  });

  test('should prevent removing all AI tools', {
    annotation: { type: 'test-id', description: 'E2E-PROF-005' },
    tag: ['@P1', '@profile', '@ai-tools', '@validation']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User has only one preferred AI tool
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User attempts to remove the last tool
    await page.click('[data-testid="remove-ai-tool-claude"]');

    // THEN: Validation error is displayed
    await expect(page.locator('[data-testid="ai-tools-error"]')).toHaveText(
      'At least one AI tool must be selected'
    );

    // AND: Tool remains in list
    await expect(page.locator('[data-testid="ai-tool-claude"]')).toBeVisible();
  });

  test('should save AI tools changes to backend', {
    annotation: { type: 'test-id', description: 'E2E-PROF-006' },
    tag: ['@P1', '@profile', '@ai-tools', '@persistence']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User modifies AI tools list
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.click('[data-testid="add-ai-tool-button"]');
    await page.selectOption('[data-testid="ai-tool-dropdown"]', 'github-copilot');
    await page.click('[data-testid="confirm-add-tool-button"]');

    // WHEN: User clicks "Save Changes" button
    await page.click('[data-testid="save-profile-button"]');

    // THEN: Success notification is displayed
    await expect(page.locator('[data-testid="save-success-message"]')).toHaveText(
      'Profile updated successfully'
    );

    // AND: Changes persist after page reload
    await page.reload();
    await expect(page.locator('[data-testid="ai-tool-github-copilot"]')).toBeVisible();
  });
});

test.describe('Notification Preferences', () => {
  test('should toggle email notifications on/off', {
    annotation: { type: 'test-id', description: 'E2E-PROF-007' },
    tag: ['@P1', '@profile', '@notifications']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on profile settings with email notifications enabled
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User toggles email notifications off
    await page.click('[data-testid="email-notifications-toggle"]');

    // THEN: Toggle reflects disabled state
    await expect(page.locator('[data-testid="email-notifications-toggle"]')).not.toBeChecked();
  });

  test('should toggle in-app notifications on/off', {
    annotation: { type: 'test-id', description: 'E2E-PROF-008' },
    tag: ['@P1', '@profile', '@notifications']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on profile settings
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User toggles in-app notifications on
    await page.click('[data-testid="in-app-notifications-toggle"]');

    // THEN: Toggle reflects enabled state
    await expect(page.locator('[data-testid="in-app-notifications-toggle"]')).toBeChecked();
  });

  test('should configure quiet hours for notifications', {
    annotation: { type: 'test-id', description: 'E2E-PROF-009' },
    tag: ['@P2', '@profile', '@notifications']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on notification preferences section
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');

    // WHEN: User enables quiet hours
    await page.click('[data-testid="quiet-hours-toggle"]');

    // AND: User sets quiet hours time range
    await page.fill('[data-testid="quiet-hours-start"]', '22:00');
    await page.fill('[data-testid="quiet-hours-end"]', '08:00');

    // THEN: Quiet hours configuration is saved
    await page.click('[data-testid="save-profile-button"]');
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
  });

  test('should validate quiet hours time range', {
    annotation: { type: 'test-id', description: 'E2E-PROF-010' },
    tag: ['@P1', '@profile', '@notifications', '@validation']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is configuring quiet hours
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.click('[data-testid="quiet-hours-toggle"]');

    // WHEN: User sets invalid time range (end before start in same day)
    await page.fill('[data-testid="quiet-hours-start"]', '10:00');
    await page.fill('[data-testid="quiet-hours-end"]', '08:00');

    // THEN: Validation error is displayed
    await expect(page.locator('[data-testid="quiet-hours-error"]')).toContainText(
      'End time must be after start time'
    );
  });

  test('should save notification preferences to backend', {
    annotation: { type: 'test-id', description: 'E2E-PROF-011' },
    tag: ['@P1', '@profile', '@notifications', '@persistence']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User modifies notification preferences
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/settings/profile');
    await page.click('[data-testid="email-notifications-toggle"]');
    await page.click('[data-testid="in-app-notifications-toggle"]');

    // WHEN: User saves changes
    await page.click('[data-testid="save-profile-button"]');

    // THEN: Changes are persisted
    await page.reload();
    await expect(page.locator('[data-testid="email-notifications-toggle"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="in-app-notifications-toggle"]')).toBeChecked();
  });
});

