/**
 * E2E Tests: Session Checkpoint Management
 * Story 1.2 - AC5: Manual checkpoint system via API endpoints
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '../fixtures/session.fixture';

test.describe('Session Checkpoint Management', () => {
  test(
    'should create manual checkpoint with metadata',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005' },
      tag: ['@P0', '@session', '@checkpoints', '@manual']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: User has active session
      const { session, token } = sessionWithCheckpoints;

      await page.goto('/dashboard');

      // Create some workspace state to checkpoint
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-name"]', 'feature.js');
      await page.fill('[data-testid="file-content"]', 'function newFeature() { return "working"; }');
      await page.click('[data-testid="save-file"]');

      // WHEN: Creating manual checkpoint
      await page.click('[data-testid="create-checkpoint-button"]');

      // Fill checkpoint metadata
      await page.fill('[data-testid="checkpoint-name"]', 'Before refactoring');
      await page.fill('[data-testid="checkpoint-description"]', 'Checkpoint before refactoring authentication module');
      await page.fill('[data-testid="checkpoint-tags"]', 'refactor,auth,before');
      await page.selectOption('[data-testid="checkpoint-priority"]', 'high');

      // Enable encryption for checkpoint
      await page.check('[data-testid="checkpoint-encryption"]');
      await page.fill('[data-testid="checkpoint-password"]', 'SecureP@ss123');

      await page.click('[data-testid="save-checkpoint"]');

      // THEN: Checkpoint created successfully
      await expect(page.locator('[data-testid="checkpoint-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Checkpoint created successfully'
      );

      // Verify checkpoint appears in list
      await page.click('[data-testid="view-checkpoints"]');
      await expect(page.locator('[data-testid="checkpoint-list"]')).toContainText('Before refactoring');
      await expect(page.locator('[data-testid="checkpoint-item"]')).toContainText('refactor,auth,before');
      await expect(page.locator('[data-testid="checkpoint-item"]')).toContainText('high priority');
    }
  );

  test(
    'should list and filter checkpoints',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005-LIST' },
      tag: ['@P0', '@session', '@checkpoints', '@filtering']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: Session has multiple checkpoints (created by fixture)
      const { checkpoints } = sessionWithCheckpoints;

      await page.goto('/dashboard');
      await page.click('[data-testid="view-checkpoints"]');

      // WHEN: Viewing all checkpoints
      await expect(page.locator('[data-testid="checkpoint-list"]')).toBeVisible();

      // THEN: All checkpoints displayed sorted by creation date
      const checkpointItems = page.locator('[data-testid="checkpoint-item"]');
      await expect(checkpointItems).toHaveCount(checkpoints.length);

      // Verify sorting (newest first)
      const firstCheckpoint = checkpointItems.first();
      await expect(firstCheckpoint.locator('[data-testid="checkpoint-name"]')).toBeVisible();
      await expect(firstCheckpoint.locator('[data-testid="checkpoint-date"]')).toBeVisible();

      // WHEN: Filtering by tag
      await page.fill('[data-testid="checkpoint-filter"]', 'feature');
      await page.click('[data-testid="apply-filter"]');

      // THEN: Only matching checkpoints shown
      const filteredItems = page.locator('[data-testid="checkpoint-item"]');
      expect(await filteredItems.count()).toBeGreaterThan(0);
      expect(await filteredItems.count()).toBeLessThanOrEqual(checkpoints.length);

      // Verify all filtered items contain the tag
      for (let i = 0; i < await filteredItems.count(); i++) {
        const item = filteredItems.nth(i);
        await expect(item.locator('[data-testid="checkpoint-tags"]')).toContainText('feature');
      }
    }
  );

  test(
    'should restore from specific checkpoint',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005-RESTORE' },
      tag: ['@P0', '@session', '@checkpoints', '@restoration']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: Session has checkpoints
      const { checkpoints, token } = sessionWithCheckpoints;
      const targetCheckpoint = checkpoints[0]; // Use first checkpoint

      await page.goto('/dashboard');

      // Make some changes that will be overwritten
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-name"]', 'temporary.js');
      await page.fill('[data-testid="file-content"]', 'temporary content');
      await page.click('[data-testid="save-file"]');

      // WHEN: Restoring from checkpoint
      await page.click('[data-testid="view-checkpoints"]');

      // Find and click restore on target checkpoint
      const checkpointItem = page.locator(`[data-testid="checkpoint-${targetCheckpoint.id}"]`);
      await checkpointItem.locator('[data-testid="restore-checkpoint"]').click();

      // Confirm restore
      await page.click('[data-testid="confirm-restore"]');

      // THEN: Session restored to checkpoint state
      await expect(page.locator('[data-testid="restore-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Session restored from checkpoint'
      );

      // Verify temporary file is gone
      await expect(page.locator('[data-testid="file-name"][value="temporary.js"]')).not.toBeVisible();

      // Verify checkpoint state is restored
      await expect(page.locator('[data-testid="workspace-state"]')).toContainText(
        targetCheckpoint.name
      );
    }
  );

  test(
    'should delete checkpoints with confirmation',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005-DELETE' },
      tag: ['@P0', '@session', '@checkpoints', '@deletion']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: Session has checkpoints
      const { checkpoints } = sessionWithCheckpoints;
      const checkpointToDelete = checkpoints[checkpoints.length - 1]; // Delete last checkpoint

      await page.goto('/dashboard');
      await page.click('[data-testid="view-checkpoints"]');

      // Count initial checkpoints
      const initialCount = await page.locator('[data-testid="checkpoint-item"]').count();

      // WHEN: Deleting checkpoint
      const checkpointItem = page.locator(`[data-testid="checkpoint-${checkpointToDelete.id}"]`);
      await checkpointItem.locator('[data-testid="delete-checkpoint"]').click();

      // Confirmation dialog shown
      await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-message"]')).toContainText(
        checkpointToDelete.name
      );

      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');

      // THEN: Checkpoint deleted successfully
      await expect(page.locator('[data-testid="delete-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Checkpoint deleted'
      );

      // Verify checkpoint list updated
      const finalCount = await page.locator('[data-testid="checkpoint-item"]').count();
      expect(finalCount).toBe(initialCount - 1);

      // Verify deleted checkpoint not in list
      await expect(page.locator(`[data-testid="checkpoint-${checkpointToDelete.id}"]`)).not.toBeVisible();
    }
  );

  test(
    'should handle checkpoint creation errors gracefully',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005-ERRORS' },
      tag: ['@P1', '@session', '@checkpoints', '@error-handling']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: User attempts to create checkpoint with invalid data
      await page.goto('/dashboard');

      // WHEN: Creating checkpoint with missing required fields
      await page.click('[data-testid="create-checkpoint-button"]');

      // Don't fill name (required field)
      await page.click('[data-testid="save-checkpoint"]');

      // THEN: Validation error shown
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('name is required');

      // WHEN: Creating checkpoint with duplicate name
      await page.fill('[data-testid="checkpoint-name"]', 'duplicate-name');
      await page.fill('[data-testid="checkpoint-description"]', 'Test description');
      await page.click('[data-testid="save-checkpoint"]');

      // Mock duplicate name error
      await page.route('**/api/sessions/*/checkpoints', (route) => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Checkpoint name already exists',
            message: 'A checkpoint with this name already exists for this session'
          })
        });
      });

      await page.click('[data-testid="save-checkpoint"]');

      // THEN: Duplicate error shown
      await expect(page.locator('[data-testid="duplicate-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'already exists'
      );

      // User can still create checkpoint with different name
      await page.fill('[data-testid="checkpoint-name"]', 'unique-name');
      await page.unroute('**/api/sessions/*/checkpoints');
      await page.click('[data-testid="save-checkpoint"]');

      await expect(page.locator('[data-testid="checkpoint-success"]')).toBeVisible();
    }
  );

  test(
    'should show checkpoint statistics and information',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-005-STATS' },
      tag: ['@P1', '@session', '@checkpoints', '@statistics']
    },
    async ({ page, sessionWithCheckpoints }) => {
      // GIVEN: Session has multiple checkpoints
      const { checkpoints } = sessionWithCheckpoints;

      await page.goto('/dashboard');
      await page.click('[data-testid="view-checkpoints"]');

      // WHEN: Viewing checkpoint statistics
      await page.click('[data-testid="checkpoint-stats"]');

      // THEN: Statistics displayed
      await expect(page.locator('[data-testid="stats-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-checkpoints"]')).toContainText(
        checkpoints.length.toString()
      );
      await expect(page.locator('[data-testid="total-size"]')).toBeVisible();
      await expect(page.locator('[data-testid="oldest-checkpoint"]')).toBeVisible();
      await expect(page.locator('[data-testid="newest-checkpoint"]')).toBeVisible();

      // WHEN: Viewing individual checkpoint details
      const firstCheckpoint = page.locator('[data-testid="checkpoint-item"]').first();
      await firstCheckpoint.locator('[data-testid="checkpoint-details"]').click();

      // THEN: Detailed checkpoint information shown
      await expect(page.locator('[data-testid="checkpoint-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoint-size"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoint-files-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoint-creation-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="checkpoint-encryption-status"]')).toBeVisible();

      // Close details modal
      await page.click('[data-testid="close-details"]');
      await expect(page.locator('[data-testid="checkpoint-detail-modal"]')).not.toBeVisible();
    }
  );
});