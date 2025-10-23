/**
 * E2E Tests: Onboarding Wizard - Step Validation
 * Story 1.1b - AC-1, AC-2: Step-by-step validation for user type, AI tools, and workspace configuration
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect, test } from '../fixtures/merged.fixture';

test.describe('Onboarding Step 1 - User Type Selection', () => {
  test('should display three user type options', {
    annotation: { type: 'test-id', description: 'E2E-ONB-005' },
    tag: ['@P1', '@onboarding', '@step1', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on onboarding Step 1
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');

    // WHEN: Viewing user type options
    // THEN: All three options are visible
    await expect(page.locator('[data-testid="user-type-solo"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-type-team"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-type-enterprise"]')).toBeVisible();
  });

  test('should disable Next button until user type is selected', {
    annotation: { type: 'test-id', description: 'E2E-ONB-006' },
    tag: ['@P1', '@onboarding', '@step1', '@validation']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on onboarding Step 1
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');

    // WHEN: No user type is selected
    const nextButton = page.locator('[data-testid="onboarding-next-button"]');

    // THEN: Next button is disabled
    await expect(nextButton).toBeDisabled();

    // WHEN: User selects a user type
    await page.click('[data-testid="user-type-solo"]');

    // THEN: Next button becomes enabled
    await expect(nextButton).toBeEnabled();
  });
});

test.describe('Onboarding Step 2 - AI Tools Selection', () => {
  test('should display available AI tools with checkboxes', {
    annotation: { type: 'test-id', description: 'E2E-ONB-007' },
    tag: ['@P1', '@onboarding', '@step2', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on Step 2
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: Viewing AI tools selection
    // THEN: All AI tool options are visible
    await expect(page.locator('[data-testid="ai-tool-claude"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-tool-chatgpt"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-tool-cursor"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-tool-windsurf"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-tool-github-copilot"]')).toBeVisible();
  });

  test('should allow multiple AI tool selections', {
    annotation: { type: 'test-id', description: 'E2E-ONB-008' },
    tag: ['@P1', '@onboarding', '@step2']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on AI tools selection step
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User selects multiple AI tools
    await page.check('[data-testid="ai-tool-claude"]');
    await page.check('[data-testid="ai-tool-cursor"]');
    await page.check('[data-testid="ai-tool-chatgpt"]');

    // THEN: All three checkboxes are checked
    await expect(page.locator('[data-testid="ai-tool-claude"]')).toBeChecked();
    await expect(page.locator('[data-testid="ai-tool-cursor"]')).toBeChecked();
    await expect(page.locator('[data-testid="ai-tool-chatgpt"]')).toBeChecked();
  });

  test('should allow proceeding with no AI tools selected', {
    annotation: { type: 'test-id', description: 'E2E-ONB-009' },
    tag: ['@P2', '@onboarding', '@step2', '@optional']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on AI tools step with no selections
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User clicks Next without selecting tools
    const nextButton = page.locator('[data-testid="onboarding-next-button"]');

    // THEN: Next button is enabled (AI tools are optional)
    await expect(nextButton).toBeEnabled();
  });
});

test.describe('Onboarding Step 3 - Workspace Configuration', () => {
  test('should validate required workspace name', {
    annotation: { type: 'test-id', description: 'E2E-ONB-010' },
    tag: ['@P1', '@onboarding', '@step3', '@validation']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on workspace configuration step
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User attempts to complete without workspace name
    await page.click('[data-testid="onboarding-complete-button"]');

    // THEN: Validation error is displayed
    await expect(page.locator('[data-testid="workspace-name-error"]')).toHaveText(
      'Workspace name is required'
    );
  });

  test('should display workspace template options', {
    annotation: { type: 'test-id', description: 'E2E-ONB-011' },
    tag: ['@P1', '@onboarding', '@step3', '@ui']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User is on workspace configuration step
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User opens template dropdown
    await page.click('[data-testid="workspace-template-select"]');

    // THEN: Template options are displayed
    await expect(page.locator('[data-testid="template-option-react"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-option-nodejs"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-option-python"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-option-custom"]')).toBeVisible();
  });

  test('should create workspace with selected template', {
    annotation: { type: 'test-id', description: 'E2E-ONB-012' },
    tag: ['@P0', '@smoke', '@onboarding', '@step3', '@workspace']
  }, async ({ page, authenticatedUser }) => {
    // GIVEN: User completes onboarding with specific template
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${authenticatedUser.token}`
    });
    await page.goto('/onboarding');
    await page.click('[data-testid="user-type-solo"]');
    await page.click('[data-testid="onboarding-next-button"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User selects React template and completes onboarding
    await page.fill('[data-testid="workspace-name-input"]', 'React Project');
    await page.selectOption('[data-testid="workspace-template-select"]', 'react');
    await page.click('[data-testid="onboarding-complete-button"]');

    // THEN: Workspace is created with React template configuration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="workspace-template-badge"]')).toHaveText('React');
  });
});
