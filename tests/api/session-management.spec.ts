/**
 * API Tests: Session Management CRUD Operations
 * Story 1.2 - AC1,2,3: Session management basic operations
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '@playwright/test';

import { createSessionApiData } from '../factories/session.factory';

test.describe('Session API - Session Management', () => {
  test('POST /api/sessions - should create new session with encrypted data', async ({ request }) => {
    // GIVEN: Valid session data from factory
    const sessionData = createSessionApiData();

    // WHEN: Creating new session
    const response = await request.post('/api/sessions', {
      data: sessionData
    });

    // THEN: Session created successfully
    expect(response.status()).toBe(201);
    const createdSession = await response.json();

    expect(createdSession).toMatchObject({
      id: expect.any(String),
      user_id: expect.any(String),
      encrypted: true,
      workspace_state: expect.objectContaining({
        files: expect.any(Array),
        terminal: expect.any(Object),
        browser: expect.any(Object),
        aiConversations: expect.any(Object)
      }),
      created_at: expect.any(String),
      updated_at: expect.any(String)
    });
  });

  test('GET /api/sessions/:id - should retrieve session metadata', async ({ request }) => {
    // GIVEN: Create session first
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    // WHEN: Retrieving session
    const response = await request.get(`/api/sessions/${session.id}`);

    // THEN: Session metadata returned
    expect(response.status()).toBe(200);
    const retrievedSession = await response.json();

    expect(retrievedSession).toMatchObject({
      id: session.id,
      encrypted: true,
      workspace_state: expect.any(Object),
      created_at: expect.any(String),
      updated_at: expect.any(String)
    });
  });

  test('PUT /api/sessions/:id - should update existing session', async ({ request }) => {
    // GIVEN: Create session and prepare update data
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const updateData = createSessionApiData({
      workspace_state: {
        files: [
          { path: 'updated.js', content: 'console.log("updated");', lastModified: new Date().toISOString() }
        ],
        terminal: { history: ['npm run build'], currentDirectory: '/dist', activeProcesses: [] },
        browser: { openTabs: [], activeTab: '', bookmarks: [] },
        aiConversations: { messages: [], context: 'build session', totalTokens: 0 }
      }
    });

    // WHEN: Updating session
    const response = await request.put(`/api/sessions/${session.id}`, {
      data: updateData
    });

    // THEN: Session updated successfully
    expect(response.status()).toBe(200);
    const updatedSession = await response.json();

    expect(updatedSession.id).toBe(session.id);
    expect(updatedSession.updated_at).not.toBe(session.updated_at);
  });

  test('DELETE /api/sessions/:id - should delete session permanently', async ({ request }) => {
    // GIVEN: Create session
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    // WHEN: Deleting session
    const response = await request.delete(`/api/sessions/${session.id}`);

    // THEN: Session deleted
    expect(response.status()).toBe(204);

    // Verify session no longer exists
    const getResponse = await request.get(`/api/sessions/${session.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('GET /api/sessions - should list user sessions with pagination', async ({ request }) => {
    // GIVEN: Create multiple sessions
    const sessionIds = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/sessions', {
        data: createSessionApiData()
      });
      const session = await response.json();
      sessionIds.push(session.id);
    }

    // WHEN: Listing sessions
    const response = await request.get('/api/sessions?limit=3&offset=0');

    // THEN: Sessions returned with pagination
    expect(response.status()).toBe(200);
    const result = await response.json();

    expect(result).toMatchObject({
      sessions: expect.any(Array),
      pagination: expect.objectContaining({
        limit: 3,
        offset: 0,
        total: expect.any(Number),
        hasMore: expect.any(Boolean)
      })
    });

    expect(result.sessions).toHaveLength(3);
    expect(result.sessions[0]).toMatchObject({
      id: expect.any(String),
      encrypted: true,
      created_at: expect.any(String)
    });

    // Cleanup
    for (const sessionId of sessionIds) {
      await request.delete(`/api/sessions/${sessionId}`);
    }
  });
});