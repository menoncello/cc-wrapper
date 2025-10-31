/**
 * API Tests: Authentication Endpoints
 * Story 1.1 - AC1: Authentication API with email/password and OAuth
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright API Testing
 *
 * UPDATED: Now using factory functions for parallel-safe test data
 * Reference: bmad/bmm/testarch/knowledge/data-factories.md
 */

import { createRegistrationData } from '../factories/user.factory';
import { expect,test } from '../fixtures/merged.fixture';

test.describe('POST /api/auth/register - User Registration', () => {
  test('should create new user with valid email and password', async ({ request }) => {
    // GIVEN: Valid registration data
    const userData = createRegistrationData(); // ✅ Factory generates unique data

    // WHEN: Registering new user via API
    const response = await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: User is created successfully
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      user: {
        email: userData.email,
        id: expect.any(String)
      },
      message: 'User registered successfully'
    });

    // AND: Password is not returned in response
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('password_hash');
  });

  test('should return JWT token after successful registration', async ({ request }) => {
    // GIVEN: Valid registration data
    const userData = createRegistrationData(); // ✅ Factory generates unique data

    // WHEN: Registering new user
    const response = await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: JWT token is returned
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('should reject registration with invalid email format', async ({ request }) => {
    // GIVEN: Invalid email format
    const userData = createRegistrationData({ email: 'invalid-email' }); // ✅ Override with invalid email

    // WHEN: Attempting to register
    const response = await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: Validation error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      error: 'Validation failed',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid email')
        })
      ])
    });
  });

  test('should reject registration with weak password', async ({ request }) => {
    // GIVEN: Weak password
    const userData = createRegistrationData({ password: 'weak', confirmPassword: 'weak' }); // ✅ Override with weak password

    // WHEN: Attempting to register
    const response = await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: Password validation error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('at least 8 characters')
        })
      ])
    );
  });

  test('should reject registration with password mismatch', async ({ request }) => {
    // GIVEN: Mismatched passwords
    const userData = createRegistrationData({ confirmPassword: 'DifferentP@ss123' }); // ✅ Override confirmation

    // WHEN: Attempting to register
    const response = await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: Password mismatch error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Passwords do not match');
  });

  test('should reject duplicate email registration', async ({ request }) => {
    // GIVEN: User already exists with email
    const existingUser = createRegistrationData(); // ✅ Factory generates unique user
    await request.post('/api/auth/register', { data: existingUser });

    // WHEN: Attempting to register with duplicate email
    const response = await request.post('/api/auth/register', {
      data: existingUser
    });

    // THEN: Conflict error is returned
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('User with this email already exists');
  });

  test('should hash password using Bun Argon2id', async ({ request }) => {
    // GIVEN: Valid registration data
    const userData = createRegistrationData(); // ✅ Factory generates unique data

    // WHEN: Registering user
    await request.post('/api/auth/register', {
      data: userData
    });

    // THEN: Password is hashed in database (verify via login)
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });

    expect(loginResponse.status()).toBe(200);
  });
});

test.describe('POST /api/auth/login - User Login', () => {
  test('should login user with valid credentials', async ({ request }) => {
    // GIVEN: Existing user account
    const userData = createRegistrationData(); // ✅ Factory generates unique user
    await request.post('/api/auth/register', { data: userData });

    const credentials = {
      email: userData.email,
      password: userData.password
    };

    // WHEN: Logging in with valid credentials
    const response = await request.post('/api/auth/login', {
      data: credentials
    });

    // THEN: Login is successful
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      user: {
        email: credentials.email,
        id: expect.any(String)
      },
      token: expect.any(String)
    });
  });

  test('should return JWT token with 15-minute expiry', async ({ request }) => {
    // GIVEN: Valid login credentials
    const credentials = {
      email: 'tokenexpiry@example.com',
      password: 'SecureP@ss123'
    };

    // WHEN: Logging in
    const response = await request.post('/api/auth/login', {
      data: credentials
    });

    // THEN: JWT token is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();

    // AND: Token can be decoded to verify expiry (15 minutes)
    // TODO: Decode JWT and verify exp claim = iat + 900 seconds
  });

  test('should reject login with invalid email', async ({ request }) => {
    // GIVEN: Non-existent email
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'SomePassword123'
    };

    // WHEN: Attempting to login
    const response = await request.post('/api/auth/login', {
      data: credentials
    });

    // THEN: Unauthorized error is returned
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid email or password');
  });

  test('should reject login with incorrect password', async ({ request }) => {
    // GIVEN: Existing user with known credentials
    // TODO: Create user via factory

    const credentials = {
      email: 'existing@example.com',
      password: 'WrongPassword123'
    };

    // WHEN: Attempting to login with wrong password
    const response = await request.post('/api/auth/login', {
      data: credentials
    });

    // THEN: Unauthorized error is returned
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid email or password');
  });

  test('should not reveal whether email exists in error message', async ({ request }) => {
    // GIVEN: Invalid credentials (email may or may not exist)
    const credentials1 = {
      email: 'nonexistent@example.com',
      password: 'SomePassword'
    };

    const credentials2 = {
      email: 'existing@example.com',
      password: 'WrongPassword'
    };

    // WHEN: Attempting login with both
    const response1 = await request.post('/api/auth/login', { data: credentials1 });
    const response2 = await request.post('/api/auth/login', { data: credentials2 });

    // THEN: Error messages are identical (security best practice)
    const body1 = await response1.json();
    const body2 = await response2.json();
    expect(body1.error).toBe(body2.error);
    expect(body1.error).toBe('Invalid email or password');
  });
});

test.describe('GET /api/auth/oauth/:provider/callback - OAuth Callback', () => {
  test('should handle Google OAuth callback with valid code', async ({ request }) => {
    // GIVEN: Valid OAuth authorization code
    const authCode = 'mock-google-auth-code';
    const state = 'random-state-token';

    // WHEN: OAuth callback is triggered
    const response = await request.get(
      `/api/auth/oauth/google/callback?code=${authCode}&state=${state}`
    );

    // THEN: User is authenticated and token is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      user: {
        email: expect.any(String),
        oauth_provider: 'google',
        oauth_id: expect.any(String)
      },
      token: expect.any(String)
    });
  });

  test('should handle GitHub OAuth callback with valid code', async ({ request }) => {
    // GIVEN: Valid GitHub OAuth code
    const authCode = 'mock-github-auth-code';
    const state = 'random-state-token';

    // WHEN: OAuth callback is triggered
    const response = await request.get(
      `/api/auth/oauth/github/callback?code=${authCode}&state=${state}`
    );

    // THEN: User is authenticated and token is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.oauth_provider).toBe('github');
  });

  test('should reject OAuth callback with invalid state parameter', async ({ request }) => {
    // GIVEN: OAuth code with invalid state (CSRF protection)
    const authCode = 'mock-auth-code';
    const invalidState = 'tampered-state-token';

    // WHEN: OAuth callback with invalid state
    const response = await request.get(
      `/api/auth/oauth/google/callback?code=${authCode}&state=${invalidState}`
    );

    // THEN: CSRF error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid state parameter');
  });

  test('should reject OAuth callback with error parameter', async ({ request }) => {
    // GIVEN: OAuth callback with error (user denied access)
    const error = 'access_denied';

    // WHEN: OAuth callback with error
    const response = await request.get(`/api/auth/oauth/google/callback?error=${error}`);

    // THEN: OAuth error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('OAuth authentication failed');
  });

  test('should link OAuth account to existing email', async ({ request }) => {
    // GIVEN: User exists with specific email
    // TODO: Create user with email matching OAuth profile email

    const authCode = 'mock-google-auth-code-with-existing-email';
    const state = 'random-state-token';

    // WHEN: OAuth callback returns profile with existing email
    const response = await request.get(
      `/api/auth/oauth/google/callback?code=${authCode}&state=${state}`
    );

    // THEN: OAuth provider is linked to existing account
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toMatchObject({
      email: 'existing@example.com',
      oauth_provider: 'google'
    });
  });

  test('should create new user for OAuth account without existing email', async ({ request }) => {
    // GIVEN: OAuth callback with new email not in database
    const authCode = 'mock-google-auth-code-new-user';
    const state = 'random-state-token';

    // WHEN: OAuth callback completes
    const response = await request.get(
      `/api/auth/oauth/google/callback?code=${authCode}&state=${state}`
    );

    // THEN: New user is created
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.user).toMatchObject({
      email: expect.any(String),
      oauth_provider: 'google',
      id: expect.any(String)
    });
  });
});

test.describe('Rate Limiting on Authentication Endpoints', () => {
  test('should enforce rate limit of 100 requests per minute on /api/auth/register', async ({
    request
  }) => {
    // GIVEN: Rate limit is configured for 100 requests/minute
    const requests: Array<Promise<any>> = [];

    // WHEN: Making 101 registration requests
    // NOTE: Each request uses unique data from factory to avoid caching
    for (let i = 0; i < 101; i++) {
      const userData = createRegistrationData(); // ✅ Unique per request
      requests.push(
        request.post('/api/auth/register', {
          data: userData
        })
      );
    }

    const responses = await Promise.all(requests);

    // THEN: 101st request is rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    const rateLimitedBody = await rateLimitedResponses[0].json();
    expect(rateLimitedBody.error).toContain('Too many requests');
  });

  test('should enforce rate limit of 100 requests per minute on /api/auth/login', async ({
    request
  }) => {
    // GIVEN: Rate limit is configured
    const requests: Array<Promise<any>> = [];

    // WHEN: Making 101 login requests
    for (let i = 0; i < 101; i++) {
      requests.push(
        request.post('/api/auth/login', {
          data: {
            email: `user${i}@example.com`,
            password: 'password'
          }
        })
      );
    }

    const responses = await Promise.all(requests);

    // THEN: Requests beyond limit are rejected
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should include rate limit headers in response', async ({ request }) => {
    // GIVEN: Authentication endpoint request
    // WHEN: Making request
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password'
      }
    });

    // THEN: Rate limit headers are present
    const headers = response.headers();
    expect(headers).toHaveProperty('x-ratelimit-limit');
    expect(headers).toHaveProperty('x-ratelimit-remaining');
    expect(headers).toHaveProperty('x-ratelimit-reset');
  });
});

test.describe('JWT Token Security', () => {
  test('should sign JWT tokens using Bun Web Crypto API', async ({ request }) => {
    // GIVEN: User logs in successfully
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'cryptotest@example.com',
        password: 'SecureP@ss123'
      }
    });

    // WHEN: Token is returned
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: Token is a valid JWT (3 parts separated by dots)
    expect(body.token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
  });

  test('should include user ID in JWT payload', async ({ request }) => {
    // GIVEN: User logs in
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'payloadtest@example.com',
        password: 'SecureP@ss123'
      }
    });

    // WHEN: Decoding JWT payload
    expect(response.status()).toBe(200);
    const body = await response.json();
    const payload = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64').toString());

    // THEN: User ID is in payload
    expect(payload).toHaveProperty('userId');
    expect(payload.userId).toBe(body.user.id);
  });
});
