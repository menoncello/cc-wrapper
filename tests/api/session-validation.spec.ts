/**
 * API Tests: Session Validation & Security
 * Story 1.2 - AC1,6: Session validation and encryption requirements
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '@playwright/test';

import { createSessionApiData } from '../factories/session.factory';

test.describe('Session API - Validation & Security', () => {
  test('POST /api/sessions - should validate session data structure', async ({ request }) => {
    // WHEN: Creating session with invalid structure
    const response = await request.post('/api/sessions', {
      data: {
        invalid_field: 'invalid',
        workspace_state: null,
        encryption: 'invalid-encryption'
      }
    });

    // THEN: Validation error
    expect(response.status()).toBe(400);
    const error = await response.json();

    expect(error).toMatchObject({
      error: 'Validation failed',
      details: expect.objectContaining({
        workspace_state: expect.stringContaining('required'),
        encryption: expect.stringContaining('object')
      })
    });
  });

  test('POST /api/sessions - should enforce session size limits', async ({ request }) => {
    // GIVEN: Create session data exceeding size limits
    const largeFiles = Array.from({ length: 1000 }, (_, i) => ({
      path: `file-${i}.js`,
      content: 'x'.repeat(10000), // 10KB per file
      lastModified: new Date().toISOString()
    }));

    const oversizedData = createSessionApiData({
      workspace_state: {
        files: largeFiles,
        terminal: { history: [], currentDirectory: '/', activeProcesses: [] },
        browser: { openTabs: [], activeTab: '', bookmarks: [] },
        aiConversations: { messages: [], context: '', totalTokens: 0 }
      }
    });

    // WHEN: Creating oversized session
    const response = await request.post('/api/sessions', {
      data: oversizedData
    });

    // THEN: Size limit enforced
    expect(response.status()).toBe(413);
    const error = await response.json();

    expect(error).toMatchObject({
      error: 'Session too large',
      maxSize: expect.any(String),
      actualSize: expect.any(String)
    });
  });

  test('POST /api/sessions - should validate encryption requirements', async ({ request }) => {
    // WHEN: Creating session with invalid encryption
    const response = await request.post('/api/sessions', {
      data: createSessionApiData({
        encryption: {
          algorithm: 'WEAK-ALGORITHM', // Invalid algorithm
          keyDerivation: 'INVALID-KEY-DERIVATION' // Invalid derivation
        }
      })
    });

    // THEN: Encryption validation error
    expect(response.status()).toBe(400);
    const error = await response.json();

    expect(error).toMatchObject({
      error: 'Invalid encryption configuration',
      details: expect.objectContaining({
        algorithm: expect.stringContaining('AES-256-GCM'),
        keyDerivation: expect.stringContaining('Argon2id')
      })
    });
  });

  test('API endpoints should require authentication', async ({ request }) => {
    // Test various endpoints without authentication
    const endpoints = [
      { method: 'GET', path: '/api/sessions' },
      { method: 'GET', path: '/api/sessions/test-id' },
      { method: 'POST', path: '/api/sessions' },
      { method: 'PUT', path: '/api/sessions/test-id' },
      { method: 'DELETE', path: '/api/sessions/test-id' },
      { method: 'POST', path: '/api/sessions/restore' },
      { method: 'GET', path: '/api/sessions/test-id/checkpoints' },
      { method: 'POST', path: '/api/sessions/test-id/checkpoints' }
    ];

    for (const endpoint of endpoints) {
      // WHEN: Making request without authentication
      const response = await request[endpoint.method.toLowerCase()](endpoint.path, {
        data: endpoint.method === 'POST' ? createSessionApiData() : undefined
      });

      // THEN: Authentication required
      expect(response.status()).toBe(401);
      const error = await response.json();
      expect(error).toMatchObject({
        error: 'Authentication required'
      });
    }
  });

  test('POST /api/sessions - should sanitize input data', async ({ request }) => {
    // GIVEN: Session data with potentially malicious content
    const maliciousData = createSessionApiData({
      workspace_state: {
        files: [
          {
            path: '../../../etc/passwd',
            content: '<script>alert("xss")</script>',
            lastModified: new Date().toISOString()
          }
        ],
        terminal: {
          history: ['rm -rf /', 'curl malicious.com'],
          currentDirectory: '/root',
          activeProcesses: []
        },
        browser: {
          openTabs: [{ url: 'javascript:alert("xss")', title: '<img src=x onerror=alert("xss")>', active: true }],
          activeTab: 'javascript:alert("xss")',
          bookmarks: []
        },
        aiConversations: {
          messages: [
            { role: 'user', content: '<script>document.body.innerHTML="hacked"</script>', timestamp: new Date().toISOString() },
            { role: 'assistant', content: 'Response with HTML: <b>Bold</b>', timestamp: new Date().toISOString() }
          ],
          context: 'Context with <script>alert("xss")</script> tags',
          totalTokens: 100
        }
      }
    });

    // WHEN: Creating session with malicious data
    const response = await request.post('/api/sessions', {
      data: maliciousData
    });

    // THEN: Data sanitized and stored safely
    expect(response.status()).toBe(201);
    const session = await response.json();

    // Verify dangerous content is sanitized
    expect(session.workspace_state.files[0].path).not.toContain('../');
    expect(session.workspace_state.files[0].content).not.toContain('<script>');
  });

  test('GET /api/sessions/:id - should prevent session enumeration', async ({ request }) => {
    // WHEN: Attempting to access random session IDs
    const randomIds = [
      'non-existent-id',
      '00000000-0000-0000-0000-000000000000',
      'admin-session',
      '../../../etc/passwd'
    ];

    for (const sessionId of randomIds) {
      const response = await request.get(`/api/sessions/${sessionId}`);

      // THEN: Consistent error messages (no information disclosure)
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toMatchObject({
        error: 'Session not found'
      });
      // Should not reveal if session exists or not
      expect(error).not.toHaveProperty('exists');
      expect(error).not.toHaveProperty('userId');
    }
  });

  test('Rate limiting should be enforced', async ({ request }) => {
    // WHEN: Making rapid requests to rate-limited endpoint
    const responses = [];
    for (let i = 0; i < 20; i++) {
      const response = await request.post('/api/sessions', {
        data: createSessionApiData(),
        headers: {
          'X-Test-Client': 'rate-limit-test'
        }
      });
      responses.push(response);
    }

    // THEN: Rate limiting enforced after threshold
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    const rateLimitError = await rateLimitedResponses[0].json();
    expect(rateLimitError).toMatchObject({
      error: 'Rate limit exceeded',
      retryAfter: expect.any(Number)
    });
  });
});