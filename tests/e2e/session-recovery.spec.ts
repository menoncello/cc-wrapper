/**
 * E2E Tests: Session Recovery & Restoration
 * Story 1.2 - AC3,4: Session recovery after restart and corruption handling
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '../fixtures/session.fixture';

test.describe('Session Recovery & Restoration', () => {
  test(
    'should restore work exactly where left off after restart using Zustand state restoration',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-003' },
      tag: ['@P0', '@session', '@restoration', '@zustand']
    },
    async ({ page, browser, sessionWithAutoSave }) => {
      // GIVEN: User has active session with workspace state
      const { token } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Create workspace state
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-name"]', 'app.js');
      await page.fill('[data-testid="file-content"]', 'const app = "initialized";');
      await page.click('[data-testid="save-file"]');

      await page.click('[data-testid="open-terminal"]');
      await page.fill('[data-testid="terminal-input"]', 'git status');
      await page.press('[data-testid="terminal-input"]', 'Enter');

      // Force session save
      await page.click('[data-testid="save-session-button"]');

      // WHEN: Browser restarts (simulate restart)
      await page.close();
      const newPage = await browser.newPage();
      await newPage.setExtraHTTPHeaders({
        Authorization: `Bearer ${token}`
      });

      // Session restoration request
      const restorePromise = newPage.waitForResponse('**/api/sessions/restore');
      await newPage.goto('/dashboard');
      const restoreResponse = await restorePromise;

      // THEN: Workspace state restored exactly
      expect(restoreResponse.status()).toBe(200);

      // Verify file is open with same content
      await expect(newPage.locator('[data-testid="file-name"]')).toHaveValue('app.js');
      await expect(newPage.locator('[data-testid="file-content"]')).toHaveValue('const app = "initialized";');

      // Verify terminal state restored
      await expect(newPage.locator('[data-testid="terminal-history"]')).toContainText('git status');

      // Verify Zustand store state
      const storeState = await newPage.evaluate(() => {
        // Type-safe access to session store from window
        const sessionStore = (window as unknown as { sessionStore?: { getState: () => unknown } }).sessionStore;
        return sessionStore?.getState();
      });
      expect(storeState).toMatchObject({
        isActive: true,
        lastSaved: expect.any(String),
        workspaceState: expect.objectContaining({
          files: expect.any(Array),
          terminal: expect.any(Object)
        })
      });

      await newPage.close();
    }
  );

  test(
    'should detect and recover from corrupted sessions with minimal data loss',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-004' },
      tag: ['@P1', '@session', '@corruption-recovery', '@resilience']
    },
    async ({ page, corruptedSession }) => {
      // GIVEN: Session data is corrupted
      const { token } = corruptedSession;

      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${token}`
      });

      // Mock corrupted session response
      await page.route('**/api/sessions/restore', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            corrupted: true,
            recoverableData: {
              files: [{ path: 'app.js', content: 'partial content' }],
              terminal: { history: [] },
              partialState: true
            },
            message: 'Session partially corrupted, recovered available data'
          })
        });
      });

      // WHEN: User attempts to restore session
      await page.goto('/dashboard');

      // THEN: Recovery notification shown and partial state restored
      await expect(page.locator('[data-testid="recovery-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="recovery-message"]')).toContainText(
        'Session partially corrupted'
      );

      // Verify partial data recovered
      await expect(page.locator('[data-testid="file-content"]')).toHaveValue('partial content');
      await expect(page.locator('[data-testid="terminal-history"]')).toBeEmpty();

      // User can accept recovery
      await page.click('[data-testid="accept-recovery"]');
      await expect(page.locator('[data-testid="recovery-notice"]')).not.toBeVisible();
    }
  );

  test(
    'should handle complete session corruption gracefully',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-004-SEVERE' },
      tag: ['@P1', '@session', '@corruption-recovery', '@error-handling']
    },
    async ({ page, corruptedSession }) => {
      // GIVEN: Session is completely corrupted
      const { token } = corruptedSession;

      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${token}`
      });

      // Mock complete corruption response
      await page.route('**/api/sessions/restore', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            corrupted: true,
            recoverable: false,
            message: 'Session data is completely corrupted and cannot be recovered'
          })
        });
      });

      // WHEN: User attempts to restore session
      await page.goto('/dashboard');

      // THEN: Error notice shown with options
      await expect(page.locator('[data-testid="corruption-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'completely corrupted'
      );

      // User can start fresh session
      await page.click('[data-testid="start-fresh"]');
      await expect(page.locator('[data-testid="dashboard-empty"]')).toBeVisible();
      await expect(page.locator('[data-testid="corruption-error"]')).not.toBeVisible();
    }
  );

  test(
    'should validate session ownership during restoration',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-003-SECURITY' },
      tag: ['@P0', '@session', '@restoration', '@security']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User tries to access another user's session
      const { token } = sessionWithAutoSave;

      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${token}`
      });

      // Mock unauthorized session access
      await page.route('**/api/sessions/restore', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Access denied',
            message: 'You do not have permission to access this session'
          })
        });
      });

      // WHEN: Attempting to restore unauthorized session
      await page.goto('/dashboard');

      // THEN: Access denied error shown
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'permission to access'
      );

      // User is redirected to create new session
      await page.click('[data-testid="create-new-session"]');
      await expect(page.locator('[data-testid="dashboard-empty"]')).toBeVisible();
    }
  );

  test(
    'should provide merge conflict resolution when restoring with changes',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-003-CONFLICTS' },
      tag: ['@P1', '@session', '@restoration', '@conflict-resolution']
    },
    async ({ page }) => {
      // GIVEN: Session has conflicts (local changes vs saved state)

      await page.goto('/dashboard');

      // Create local changes
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-name"]', 'local.js');
      await page.fill('[data-testid="file-content"]', 'local changes');
      await page.click('[data-testid="save-file"]');

      // Mock conflict response
      await page.route('**/api/sessions/restore', (route) => {
        route.fulfill({
          status: 409, // Conflict status
          contentType: 'application/json',
          body: JSON.stringify({
            conflict: true,
            localChanges: {
              files: [{ path: 'local.js', content: 'local changes' }]
            },
            savedChanges: {
              files: [{ path: 'saved.js', content: 'saved changes' }]
            },
            message: 'Session has both local and saved changes'
          })
        });
      });

      // WHEN: User attempts to restore session with conflicts
      await page.click('[data-testid="restore-session"]');

      // THEN: Conflict resolution dialog shown
      await expect(page.locator('[data-testid="conflict-resolution"]')).toBeVisible();
      await expect(page.locator('[data-testid="conflict-message"]')).toContainText(
        'both local and saved changes'
      );

      // User can choose resolution strategy
      await expect(page.locator('[data-testid="keep-local"]')).toBeVisible();
      await expect(page.locator('[data-testid="use-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="merge-both"]')).toBeVisible();

      // Choose to keep local changes
      await page.click('[data-testid="keep-local"]');
      await expect(page.locator('[data-testid="conflict-resolution"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="file-content"]')).toHaveValue('local changes');
    }
  );
});