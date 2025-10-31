/**
 * E2E Tests: Session Auto-Save Functionality
 * Story 1.2 - AC1: Auto-save every 30 seconds with encrypted storage
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '../fixtures/session.fixture';

test.describe('Session Auto-Save', () => {
  test(
    'should auto-save session state every 30 seconds with encrypted storage',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-001' },
      tag: ['@P0', '@session', '@autosave', '@encryption']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has session with deterministic auto-save capability
      const { session, autoSaveTrigger } = sessionWithAutoSave;

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Simulate workspace activity (open files, terminal work)
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-content"]', 'console.log("Hello World");');
      await page.click('[data-testid="save-file"]');

      // WHEN: Auto-save is triggered deterministically
      await autoSaveTrigger();

      // THEN: Session state is updated and encrypted
      const sessionResponse = await page.request.get(`/api/sessions/${session.id}`);
      expect(sessionResponse.status()).toBe(200);

      const sessionData = await sessionResponse.json();
      expect(sessionData).toMatchObject({
        id: session.id,
        encrypted: true,
        workspace_state: expect.any(Object)
      });
    }
  );

  test(
    'should capture complete workspace state including terminal, browser, AI conversations, and open files',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-002' },
      tag: ['@P0', '@session', '@workspace-state', '@autosave']
    },
    async ({ page, sessionWithAutoSave, workspaceState }) => {
      // GIVEN: User has active session with various workspace components
      const { autoSaveTrigger } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Create file with content
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-name"]', 'test.js');
      await page.fill('[data-testid="file-content"]', 'function test() {}');
      await page.click('[data-testid="save-file"]');

      // Open terminal and run commands
      await page.click('[data-testid="open-terminal"]');
      await page.fill('[data-testid="terminal-input"]', 'npm test');
      await page.press('[data-testid="terminal-input"]', 'Enter');

      // Open browser tabs
      await page.click('[data-testid="add-browser-tab"]');
      await page.fill('[data-testid="tab-url"]', 'http://localhost:3000');
      await page.press('[data-testid="tab-url"]', 'Enter');

      // Start AI conversation
      await page.click('[data-testid="ai-chat-button"]');
      await page.fill('[data-testid="ai-chat-input"]', 'Explain this test function');
      await page.click('[data-testid="ai-chat-send"]');

      // WHEN: Auto-save captures complete state
      await autoSaveTrigger();

      // THEN: All workspace components captured
      const sessionResponse = await page.request.get('/api/sessions/current');
      const sessionData = await sessionResponse.json();

      expect(sessionData.workspace_state).toMatchObject({
        files: expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('test.js'),
            content: expect.stringContaining('function test()')
          })
        ]),
        terminal: expect.objectContaining({
          history: expect.arrayContaining(['npm test']),
          activeProcesses: expect.any(Array)
        }),
        browser: expect.objectContaining({
          openTabs: expect.arrayContaining([
            expect.objectContaining({
              url: expect.stringContaining('localhost:3000'),
              active: true
            })
          ])
        }),
        aiConversations: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Explain this test function')
            })
          ])
        })
      });
    }
  );

  test(
    'should handle large workspace states efficiently',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-002-LARGE' },
      tag: ['@P1', '@session', '@autosave', '@performance']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has large workspace state
      const { autoSaveTrigger } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Create multiple files
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="create-new-file"]');
        await page.fill('[data-testid="file-name"]', `file-${i}.js`);
        await page.fill('[data-testid="file-content"]', `// File ${i}\n`.repeat(100));
        await page.click('[data-testid="save-file"]');
      }

      // Create extensive terminal history
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="open-terminal"]');
        await page.fill('[data-testid="terminal-input"]', `command-${i}`);
        await page.press('[data-testid="terminal-input"]', 'Enter');
      }

      // Multiple browser tabs
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-browser-tab"]');
        await page.fill('[data-testid="tab-url"]', `http://localhost:3000/page-${i}`);
        await page.press('[data-testid="tab-url"]', 'Enter');
      }

      // WHEN: Auto-save processes large state
      const startTime = Date.now();
      await autoSaveTrigger();
      const endTime = Date.now();

      // THEN: Performance within acceptable limits (<500ms)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(500);

      // Verify state was saved despite size
      const sessionResponse = await page.request.get('/api/sessions/current');
      const sessionData = await sessionResponse.json();

      expect(sessionData.workspace_state.files).toHaveLength(10);
      expect(sessionData.workspace_state.terminal.history.length).toBeGreaterThan(15);
      expect(sessionData.workspace_state.browser.openTabs).toHaveLength(5);
    }
  );

  test(
    'should encrypt auto-saved data with user keys',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-001-ENCRYPTION' },
      tag: ['@P0', '@session', '@autosave', '@encryption', '@security']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has session with encryption enabled
      const { session, autoSaveTrigger } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Create sensitive content
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-content"]', 'const API_KEY = "sk-sensitive-key-123";');
      await page.click('[data-testid="save-file"]');

      // WHEN: Auto-save triggers with encryption
      await autoSaveTrigger();

      // THEN: Data is encrypted at rest
      const sessionResponse = await page.request.get(`/api/sessions/${session.id}`);
      const sessionData = await sessionResponse.json();

      // Verify encryption metadata exists
      expect(sessionData).toMatchObject({
        encrypted: true,
        encryption_metadata: expect.objectContaining({
          algorithm: 'AES-256-GCM',
          keyDerivation: 'Argon2id',
          salt: expect.any(String),
          iv: expect.any(String)
        })
      });

      // Verify sensitive data is not in plaintext
      const responseText = await sessionResponse.text();
      expect(responseText).not.toContain('sk-sensitive-key-123');
    }
  );
});