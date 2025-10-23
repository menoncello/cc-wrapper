/**
 * E2E Tests: User Registration & Authentication
 * Story 1.1 - AC1: User can create account with email/password or social login
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 *
 * UPDATED: Now using factory functions for parallel-safe test data
 * Reference: bmad/bmm/testarch/knowledge/data-factories.md
 */

import { createLoginCredentials,createRegistrationData } from '../factories/user.factory';
import { expect,test } from '../fixtures/merged.fixture';

test.describe('User Registration with Email/Password', () => {
  test('should successfully register new user with valid credentials', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-001' },
    tag: ['@P0', '@smoke', '@auth', '@registration']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/register', route => route.continue());

    // GIVEN: User is on registration page
    const userData = createRegistrationData(); // ✅ Factory generates unique data
    await page.goto('/auth/register');

    // WHEN: User fills registration form with valid data
    await page.fill('[data-testid="register-email-input"]', userData.email);
    await page.fill('[data-testid="register-password-input"]', userData.password);
    await page.fill('[data-testid="register-confirm-password-input"]', userData.confirmPassword);
    await page.click('[data-testid="register-submit-button"]');

    // THEN: User is redirected to onboarding wizard
    await expect(page).toHaveURL('/onboarding');
  });

  test('should display error for invalid email format', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-002' },
    tag: ['@P1', '@auth', '@validation']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/register', route => route.continue());

    // GIVEN: User is on registration page
    const userData = createRegistrationData({ email: 'invalid-email' }); // ✅ Override specific field
    await page.goto('/auth/register');

    // WHEN: User enters invalid email format
    await page.fill('[data-testid="register-email-input"]', userData.email);
    await page.fill('[data-testid="register-password-input"]', userData.password);
    await page.fill('[data-testid="register-confirm-password-input"]', userData.confirmPassword);
    await page.click('[data-testid="register-submit-button"]');

    // THEN: Email validation error is displayed
    await expect(page.locator('[data-testid="email-error-message"]')).toHaveText(
      'Please enter a valid email address'
    );
  });

  test('should display error for weak password', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-003' },
    tag: ['@P1', '@auth', '@validation']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/register', route => route.continue());

    // GIVEN: User is on registration page
    const userData = createRegistrationData({ password: 'weak', confirmPassword: 'weak' }); // ✅ Override with weak password
    await page.goto('/auth/register');

    // WHEN: User enters weak password
    await page.fill('[data-testid="register-email-input"]', userData.email);
    await page.fill('[data-testid="register-password-input"]', userData.password);
    await page.fill('[data-testid="register-confirm-password-input"]', userData.confirmPassword);
    await page.click('[data-testid="register-submit-button"]');

    // THEN: Password strength error is displayed
    await expect(page.locator('[data-testid="password-error-message"]')).toContainText(
      'Password must be at least 8 characters'
    );
  });

  test('should display error for password mismatch', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-004' },
    tag: ['@P1', '@auth', '@validation']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/register', route => route.continue());

    // GIVEN: User is on registration page
    const userData = createRegistrationData({ confirmPassword: 'Different123' }); // ✅ Mismatch confirmation
    await page.goto('/auth/register');

    // WHEN: User enters mismatched passwords
    await page.fill('[data-testid="register-email-input"]', userData.email);
    await page.fill('[data-testid="register-password-input"]', userData.password);
    await page.fill('[data-testid="register-confirm-password-input"]', userData.confirmPassword);
    await page.click('[data-testid="register-submit-button"]');

    // THEN: Password mismatch error is displayed
    await expect(page.locator('[data-testid="confirm-password-error-message"]')).toHaveText(
      'Passwords do not match'
    );
  });

  test('should display error for duplicate email registration', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-005' },
    tag: ['@P1', '@auth', '@validation']
  }, async ({ page, request }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/register', route => route.continue());

    // GIVEN: User with email already exists
    const existingUser = createRegistrationData(); // ✅ Unique existing user
    await request.post('/api/auth/register', { data: existingUser });

    await page.goto('/auth/register');

    // WHEN: User attempts to register with existing email
    await page.fill('[data-testid="register-email-input"]', existingUser.email);
    await page.fill('[data-testid="register-password-input"]', existingUser.password);
    await page.fill('[data-testid="register-confirm-password-input"]', existingUser.confirmPassword);
    await page.click('[data-testid="register-submit-button"]');

    // THEN: Duplicate email error is displayed
    await expect(page.locator('[data-testid="registration-error-message"]')).toHaveText(
      'An account with this email already exists'
    );
  });
});

test.describe('User Login with Email/Password', () => {
  test('should successfully login with valid credentials', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-006' },
    tag: ['@P0', '@smoke', '@auth', '@login']
  }, async ({ page, request }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/login', route => route.continue());

    // GIVEN: User account exists
    const userData = createRegistrationData(); // ✅ Unique user data

    // Create user via API (fast setup)
    await request.post('/api/auth/register', { data: userData });

    await page.goto('/auth/login');

    // WHEN: User logs in with valid credentials
    await page.fill('[data-testid="login-email-input"]', userData.email);
    await page.fill('[data-testid="login-password-input"]', userData.password);
    await page.click('[data-testid="login-submit-button"]');

    // THEN: User is redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display error for invalid credentials', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-007' },
    tag: ['@P1', '@auth', '@login', '@validation']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/login', route => route.continue());

    // GIVEN: User is on login page
    const invalidCreds = createLoginCredentials(); // ✅ Unique invalid credentials
    await page.goto('/auth/login');

    // WHEN: User enters invalid credentials
    await page.fill('[data-testid="login-email-input"]', invalidCreds.email);
    await page.fill('[data-testid="login-password-input"]', invalidCreds.password);
    await page.click('[data-testid="login-submit-button"]');

    // THEN: Invalid credentials error is displayed
    await expect(page.locator('[data-testid="login-error-message"]')).toHaveText(
      'Invalid email or password'
    );
  });

  test('should disable submit button when fields are empty', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-008' },
    tag: ['@P2', '@auth', '@login', '@ui']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/login', route => route.continue());

    // GIVEN: User is on login page
    await page.goto('/auth/login');

    // WHEN: Form is initially rendered with empty fields
    const submitButton = page.locator('[data-testid="login-submit-button"]');

    // THEN: Submit button is disabled
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Social Login - Google OAuth', () => {
  test('should successfully authenticate via Google OAuth', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-009' },
    tag: ['@P1', '@auth', '@oauth', '@google']
  }, async ({ page, context }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/oauth/google/**', route => route.continue());

    // GIVEN: User is on login page with Google OAuth configured
    await page.goto('/auth/login');

    // WHEN: User clicks Google login button
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('[data-testid="google-login-button"]')
    ]);

    // THEN: OAuth popup opens with Google authorization URL
    await expect(popup).toHaveURL(/accounts\.google\.com/);

    // TODO: Mock OAuth callback with successful response
    // TODO: Verify user redirected to dashboard after OAuth
  });

  test('should display error when Google OAuth fails', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-010' },
    tag: ['@P2', '@auth', '@oauth', '@google', '@error']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/oauth/google/**', route => route.continue());

    // GIVEN: User is on login page
    await page.goto('/auth/login');

    // WHEN: OAuth fails (simulate via query parameter)
    await page.goto('/auth/oauth/google/callback?error=access_denied');

    // THEN: OAuth error message is displayed
    await expect(page.locator('[data-testid="oauth-error-message"]')).toHaveText(
      'Google authentication failed. Please try again.'
    );
  });
});

test.describe('Social Login - GitHub OAuth', () => {
  test('should successfully authenticate via GitHub OAuth', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-011' },
    tag: ['@P1', '@auth', '@oauth', '@github']
  }, async ({ page, context }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/oauth/github/**', route => route.continue());

    // GIVEN: User is on login page with GitHub OAuth configured
    await page.goto('/auth/login');

    // WHEN: User clicks GitHub login button
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('[data-testid="github-login-button"]')
    ]);

    // THEN: OAuth popup opens with GitHub authorization URL
    await expect(popup).toHaveURL(/github\.com\/login\/oauth/);

    // TODO: Mock OAuth callback with successful response
    // TODO: Verify user redirected to dashboard after OAuth
  });

  test('should handle OAuth account linking for existing email', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-012' },
    tag: ['@P2', '@auth', '@oauth', '@github', '@linking']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/oauth/github/**', route => route.continue());

    // GIVEN: User exists with email matching OAuth account
    // TODO: Use factory to create user with specific email

    await page.goto('/auth/login');

    // WHEN: User authenticates via GitHub with existing email
    // TODO: Mock OAuth callback returning existing email

    // THEN: Account is linked and user redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // TODO: Verify OAuth provider stored in user record
  });
});

test.describe('Authentication Rate Limiting', () => {
  test('should enforce rate limit after excessive login attempts', {
    annotation: { type: 'test-id', description: 'E2E-AUTH-013' },
    tag: ['@P1', '@auth', '@security', '@rate-limiting']
  }, async ({ page }) => {
    // Network-first: Setup interception before navigation
    await page.route('**/api/auth/login', route => route.continue());

    // GIVEN: User is on login page
    await page.goto('/auth/login');

    // WHEN: User makes 101 login attempts (exceeds 100/minute limit)
    // NOTE: Each attempt uses unique email from factory to avoid caching issues
    for (let i = 0; i < 101; i++) {
      const attemptCreds = createLoginCredentials(); // ✅ Unique per attempt
      await page.fill('[data-testid="login-email-input"]', attemptCreds.email);
      await page.fill('[data-testid="login-password-input"]', attemptCreds.password);
      await page.click('[data-testid="login-submit-button"]');

      if (i === 100) {
break;
} // Stop before last attempt to check error
    }

    // THEN: Rate limit error is displayed
    await expect(page.locator('[data-testid="rate-limit-error-message"]')).toContainText(
      'Too many login attempts. Please try again later.'
    );
  });
});
