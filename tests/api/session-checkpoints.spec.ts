/**
 * API Tests: Session Checkpoint Management
 * Story 1.2 - AC5: Manual checkpoint system
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright 1.56.0
 */

import { expect,test } from '@playwright/test';

import { createCheckpoint,createSessionApiData } from '../factories/session.factory';

test.describe('Session API - Checkpoint Management', () => {
  test('POST /api/sessions/checkpoints - should create manual checkpoint', async ({ request }) => {
    // GIVEN: Create session first
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const checkpointData = {
      name: 'Before major refactoring',
      description: 'Checkpoint created before refactoring user authentication module',
      tags: ['refactor', 'auth', 'before'],
      priority: 'high',
      workspace_state: createSessionApiData().workspace_state
    };

    // WHEN: Creating checkpoint
    const response = await request.post(`/api/sessions/${session.id}/checkpoints`, {
      data: checkpointData
    });

    // THEN: Checkpoint created successfully
    expect(response.status()).toBe(201);
    const checkpoint = await response.json();

    expect(checkpoint).toMatchObject({
      id: expect.any(String),
      session_id: session.id,
      name: checkpointData.name,
      description: checkpointData.description,
      tags: checkpointData.tags,
      priority: checkpointData.priority,
      created_at: expect.any(String),
      size_bytes: expect.any(Number)
    });

    // Cleanup
    await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}`);
    await request.delete(`/api/sessions/${session.id}`);
  });

  test('GET /api/sessions/checkpoints - should list session checkpoints', async ({ request }) => {
    // GIVEN: Create session with multiple checkpoints
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const checkpointIds = [];
    for (let i = 0; i < 3; i++) {
      const checkpointResponse = await request.post(`/api/sessions/${session.id}/checkpoints`, {
        data: {
          name: `Checkpoint ${i + 1}`,
          description: `Test checkpoint number ${i + 1}`,
          tags: [`tag${i + 1}`],
          priority: i === 0 ? 'high' : 'medium',
          workspace_state: createSessionApiData().workspace_state
        }
      });
      const checkpoint = await checkpointResponse.json();
      checkpointIds.push(checkpoint.id);
    }

    // WHEN: Listing checkpoints
    const response = await request.get(`/api/sessions/${session.id}/checkpoints`);

    // THEN: Checkpoints returned sorted by creation date
    expect(response.status()).toBe(200);
    const result = await response.json();

    expect(result).toMatchObject({
      checkpoints: expect.any(Array),
      pagination: expect.objectContaining({
        limit: expect.any(Number),
        offset: expect.any(Number),
        total: expect.any(Number)
      })
    });

    expect(result.checkpoints).toHaveLength(3);
    expect(result.checkpoints[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      created_at: expect.any(String)
    });

    // Verify sorting (newest first)
    const dates = result.checkpoints.map(cp => new Date(cp.created_at));
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
    }

    // Cleanup
    for (const checkpointId of checkpointIds) {
      await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpointId}`);
    }
    await request.delete(`/api/sessions/${session.id}`);
  });

  test('GET /api/sessions/checkpoints - should filter checkpoints by tags', async ({ request }) => {
    // GIVEN: Create session with tagged checkpoints
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const checkpointIds = [];
    const tags = ['feature', 'bugfix', 'refactor'];

    for (let i = 0; i < 3; i++) {
      const checkpointResponse = await request.post(`/api/sessions/${session.id}/checkpoints`, {
        data: {
          name: `Checkpoint ${i + 1}`,
          tags: [tags[i]],
          priority: 'medium',
          workspace_state: createSessionApiData().workspace_state
        }
      });
      const checkpoint = await checkpointResponse.json();
      checkpointIds.push(checkpoint.id);
    }

    // WHEN: Filtering by tag
    const response = await request.get(`/api/sessions/${session.id}/checkpoints?tags=feature`);

    // THEN: Only checkpoints with matching tag returned
    expect(response.status()).toBe(200);
    const result = await response.json();

    expect(result.checkpoints).toHaveLength(1);
    expect(result.checkpoints[0].tags).toContain('feature');

    // Cleanup
    for (const checkpointId of checkpointIds) {
      await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpointId}`);
    }
    await request.delete(`/api/sessions/${session.id}`);
  });

  test('POST /api/sessions/checkpoints/:id/restore - should restore from specific checkpoint', async ({ request }) => {
    // GIVEN: Create session and checkpoint
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const checkpointResponse = await request.post(`/api/sessions/${session.id}/checkpoints`, {
      data: {
        name: 'Restore Test Checkpoint',
        description: 'Checkpoint for testing restore functionality',
        tags: ['test'],
        priority: 'high',
        workspace_state: createSessionApiData().workspace_state
      }
    });
    const checkpoint = await checkpointResponse.json();

    // WHEN: Restoring from checkpoint
    const response = await request.post(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}/restore`);

    // THEN: Session restored from checkpoint
    expect(response.status()).toBe(200);
    const result = await response.json();

    expect(result).toMatchObject({
      session_id: session.id,
      checkpoint_id: checkpoint.id,
      restored: true,
      restored_at: expect.any(String),
      workspace_state: expect.any(Object)
    });

    // Cleanup
    await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}`);
    await request.delete(`/api/sessions/${session.id}`);
  });

  test('DELETE /api/sessions/checkpoints/:id - should delete checkpoint', async ({ request }) => {
    // GIVEN: Create session and checkpoint
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    const checkpointResponse = await request.post(`/api/sessions/${session.id}/checkpoints`, {
      data: {
        name: 'To Be Deleted',
        description: 'Checkpoint for testing deletion',
        tags: ['delete-test'],
        priority: 'low',
        workspace_state: createSessionApiData().workspace_state
      }
    });
    const checkpoint = await checkpointResponse.json();

    // WHEN: Deleting checkpoint
    const response = await request.delete(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}`);

    // THEN: Checkpoint deleted
    expect(response.status()).toBe(204);

    // Verify checkpoint no longer exists
    const getResponse = await request.get(`/api/sessions/${session.id}/checkpoints/${checkpoint.id}`);
    expect(getResponse.status()).toBe(404);

    // Cleanup
    await request.delete(`/api/sessions/${session.id}`);
  });

  test('POST /api/sessions/checkpoints - should validate checkpoint data', async ({ request }) => {
    // GIVEN: Create session
    const createResponse = await request.post('/api/sessions', {
      data: createSessionApiData()
    });
    const session = await createResponse.json();

    // WHEN: Creating checkpoint with invalid data
    const response = await request.post(`/api/sessions/${session.id}/checkpoints`, {
      data: {
        name: '', // Empty name (invalid)
        description: 'Test checkpoint',
        tags: ['test'],
        priority: 'invalid-priority', // Invalid priority
        workspace_state: null // Invalid workspace state
      }
    });

    // THEN: Validation error
    expect(response.status()).toBe(400);
    const error = await response.json();

    expect(error).toMatchObject({
      error: 'Validation failed',
      details: expect.objectContaining({
        name: expect.stringContaining('required'),
        priority: expect.stringContaining('valid'),
        workspace_state: expect.stringContaining('required')
      })
    });

    // Cleanup
    await request.delete(`/api/sessions/${session.id}`);
  });
});