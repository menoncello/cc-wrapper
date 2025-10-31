/**
 * E2E Tests: Session Security & Encryption
 * Story 1.2 - AC6: Session encryption with user-controlled keys
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '../fixtures/session.fixture';

test.describe('Session Security & Encryption', () => {
  test(
    'should encrypt session data with user-controlled keys',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-006' },
      tag: ['@P0', '@session', '@encryption', '@security']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User sets up session encryption
      const { session, token } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Access security settings
      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');

      // Enable encryption with user-controlled key
      await page.check('[data-testid="enable-encryption"]');
      await page.fill('[data-testid="encryption-password"]', 'MySecureP@ss123!');
      await page.fill('[data-testid="encryption-password-confirm"]', 'MySecureP@ss123!');

      // Select strong encryption settings
      await page.selectOption('[data-testid="encryption-algorithm"]', 'AES-256-GCM');
      await page.selectOption('[data-testid="key-derivation"]', 'Argon2id');

      await page.click('[data-testid="save-security-settings"]');

      // THEN: Encryption setup successful
      await expect(page.locator('[data-testid="encryption-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Encryption enabled'
      );

      // Create sensitive content
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-content"]', 'const SECRET_KEY = "sk-live-sensitive-api-key-12345";');
      await page.click('[data-testid="save-file"]');

      // Force session save
      await page.click('[data-testid="save-session-button"]');

      // WHEN: Checking encrypted data
      const sessionResponse = await page.request.get(`/api/sessions/${session.id}`);
      const sessionData = await sessionResponse.json();

      // THEN: Data is encrypted at rest
      expect(sessionData.encrypted).toBe(true);
      expect(sessionData.encryption_metadata).toMatchObject({
        algorithm: 'AES-256-GCM',
        keyDerivation: 'Argon2id',
        salt: expect.any(String),
        iv: expect.any(String)
      });

      // Verify sensitive content is encrypted
      const responseText = await sessionResponse.text();
      expect(responseText).not.toContain('sk-live-sensitive-api-key-12345');
      expect(responseText).not.toContain('SECRET_KEY');
    }
  );

  test(
    'should require password for encrypted session access',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-006-ACCESS' },
      tag: ['@P0', '@session', '@encryption', '@authentication']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has encrypted session
      const { session, token } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Set up encryption
      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');
      await page.check('[data-testid="enable-encryption"]');
      await page.fill('[data-testid="encryption-password"]', 'TestP@ss123!');
      await page.fill('[data-testid="encryption-password-confirm"]', 'TestP@ss123!');
      await page.click('[data-testid="save-security-settings"]');

      // Create some content
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-content"]', 'Encrypted content');
      await page.click('[data-testid="save-file"]');

      // Simulate browser restart (clear session storage)
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });

      // WHEN: User returns without encryption password
      await page.goto('/dashboard');

      // THEN: Password prompt shown
      await expect(page.locator('[data-testid="encryption-password-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="prompt-message"]')).toContainText(
        'Enter encryption password'
      );

      // User cannot access session without password
      await expect(page.locator('[data-testid="workspace-area"]')).not.toBeVisible();

      // WHEN: User provides correct password
      await page.fill('[data-testid="encryption-password-input"]', 'TestP@ss123!');
      await page.click('[data-testid="unlock-session"]');

      // THEN: Session unlocked and accessible
      await expect(page.locator('[data-testid="unlock-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="workspace-area"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-content"]')).toHaveValue('Encrypted content');
    }
  );

  test(
    'should handle wrong encryption password gracefully',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-006-ERRORS' },
      tag: ['@P1', '@session', '@encryption', '@error-handling']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has encrypted session
      const { token } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Set up encryption
      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');
      await page.check('[data-testid="enable-encryption"]');
      await page.fill('[data-testid="encryption-password"]', 'CorrectP@ss123!');
      await page.fill('[data-testid="encryption-password-confirm"]', 'CorrectP@ss123!');
      await page.click('[data-testid="save-security-settings"]');

      // Clear session to force password prompt
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });
      await page.goto('/dashboard');

      // WHEN: User provides wrong password
      await page.fill('[data-testid="encryption-password-input"]', 'WrongPassword');
      await page.click('[data-testid="unlock-session"]');

      // THEN: Error shown with retry options
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Incorrect password'
      );

      // Password attempt counter shown
      await expect(page.locator('[data-testid="attempt-counter"]')).toContainText('1');
      await expect(page.locator('[data-testid="remaining-attempts"]')).toContainText('2');

      // WHEN: User exhausts password attempts
      await page.fill('[data-testid="encryption-password-input"]', 'Wrong2');
      await page.click('[data-testid="unlock-session"]');

      await page.fill('[data-testid="encryption-password-input"]', 'Wrong3');
      await page.click('[data-testid="unlock-session"]');

      // THEN: Session locked for security
      await expect(page.locator('[data-testid="session-locked"]')).toBeVisible();
      await expect(page.locator('[data-testid="lock-message"]')).toContainText(
        'Too many failed attempts'
      );
      await expect(page.locator('[data-testid="lock-duration"]')).toBeVisible();

      // Recovery options shown
      await expect(page.locator('[data-testid="recovery-options"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
    }
  );

  test(
    'should support key rotation for encrypted sessions',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-006-ROTATION' },
      tag: ['@P1', '@session', '@encryption', '@key-rotation']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User has encrypted session with old key
      const { session, token } = sessionWithAutoSave;

      await page.goto('/dashboard');

      // Set up initial encryption
      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');
      await page.check('[data-testid="enable-encryption"]');
      await page.fill('[data-testid="encryption-password"]', 'OldP@ss123!');
      await page.fill('[data-testid="encryption-password-confirm"]', 'OldP@ss123!');
      await page.click('[data-testid="save-security-settings"]');

      // Create content with old encryption
      await page.click('[data-testid="create-new-file"]');
      await page.fill('[data-testid="file-content"]', 'Content encrypted with old key');
      await page.click('[data-testid="save-file"]');

      // WHEN: Initiating key rotation
      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');
      await page.click('[data-testid="rotate-encryption-key"]');

      // THEN: Key rotation wizard shown
      await expect(page.locator('[data-testid="key-rotation-wizard"]')).toBeVisible();
      await expect(page.locator('[data-testid="rotation-step-1"]')).toBeVisible();

      // Step 1: Verify current password
      await page.fill('[data-testid="current-password"]', 'OldP@ss123!');
      await page.click('[data-testid="verify-current-password"]');

      // Step 2: Set new password
      await expect(page.locator('[data-testid="rotation-step-2"]')).toBeVisible();
      await page.fill('[data-testid="new-encryption-password"]', 'NewSecureP@ss456!');
      await page.fill('[data-testid="new-encryption-password-confirm"]', 'NewSecureP@ss456!');
      await page.click('[data-testid="proceed-rotation"]');

      // Step 3: Re-encryption progress
      await expect(page.locator('[data-testid="rotation-step-3"]')).toBeVisible();
      await expect(page.locator('[data-testid="re-encryption-progress"]')).toBeVisible();

      // Wait for re-encryption to complete
      await expect(page.locator('[data-testid="rotation-complete"]')).toBeVisible({
        timeout: 30000
      });

      // Verify session is accessible with new password
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });
      await page.goto('/dashboard');

      await page.fill('[data-testid="encryption-password-input"]', 'NewSecureP@ss456!');
      await page.click('[data-testid="unlock-session"]');

      // THEN: Session accessible with new key, old content preserved
      await expect(page.locator('[data-testid="workspace-area"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-content"]')).toHaveValue(
        'Content encrypted with old key'
      );

      // Verify new encryption metadata
      const sessionResponse = await page.request.get(`/api/sessions/${session.id}`);
      const sessionData = await sessionResponse.json();

      expect(sessionData.encryption_metadata.keyVersion).toBeGreaterThan(0);
      expect(sessionData.encryption_metadata.rotatedAt).toBeDefined();
    }
  );

  test(
    'should validate encryption password strength',
    {
      annotation: { type: 'test-id', description: 'E2E-SES-006-VALIDATION' },
      tag: ['@P1', '@session', '@encryption', '@validation']
    },
    async ({ page, sessionWithAutoSave }) => {
      // GIVEN: User tries to set weak encryption password
      await page.goto('/dashboard');

      await page.click('[data-testid="session-settings"]');
      await page.click('[data-testid="security-tab"]');
      await page.check('[data-testid="enable-encryption"]');

      // WHEN: Entering weak passwords
      const weakPasswords = [
        '123', // Too short
        'password', // Common password
        'aaaaaa', // No complexity
        'NoNumbers', // No numbers
        'nospecial123' // No special characters
      ];

      for (const weakPassword of weakPasswords) {
        await page.fill('[data-testid="encryption-password"]', weakPassword);
        await page.fill('[data-testid="encryption-password-confirm"]', weakPassword);
        await page.click('[data-testid="save-security-settings"]');

        // THEN: Password strength validation shown
        await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
        await expect(page.locator('[data-testid="strength-requirements"]')).toBeVisible();
        await expect(page.locator('[data-testid="save-security-settings"]')).toBeDisabled();
      }

      // WHEN: Entering strong password
      await page.fill('[data-testid="encryption-password"]', 'StrongP@ss123!');
      await page.fill('[data-testid="encryption-password-confirm"]', 'StrongP@ss123!');

      // THEN: Password accepted
      await expect(page.locator('[data-testid="password-strength"]')).toContainText('Strong');
      await expect(page.locator('[data-testid="save-security-settings"]')).toBeEnabled();

      await page.click('[data-testid="save-security-settings"]');
      await expect(page.locator('[data-testid="encryption-success"]')).toBeVisible();
    }
  );
});