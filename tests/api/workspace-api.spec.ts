/**
 * API Tests: Workspace Management
 * Story 1.1 - AC3: Workspace creation and configuration
 *
 * Status: RED (failing - awaiting implementation)
 * Test Framework: Playwright API Testing
 */

import { test, expect } from '@playwright/test';

test.describe('POST /api/workspaces - Create Workspace', () => {
  test('should create workspace with valid data', async ({ request }) => {
    // GIVEN: Authenticated user with valid workspace data
    // TODO: Use auth token from fixture

    const workspaceData = {
      name: 'My New Workspace',
      description: 'Testing workspace creation',
      template: 'react',
      userType: 'solo'
    };

    // WHEN: Creating workspace via API
    const response = await request.post('/api/workspaces', {
      data: workspaceData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Workspace is created successfully
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      workspace: {
        id: expect.any(String),
        name: workspaceData.name,
        description: workspaceData.description,
        template: workspaceData.template,
        userId: expect.any(String)
      }
    });
  });

  test('should generate workspace configuration based on template', async ({ request }) => {
    // GIVEN: Workspace data with React template
    const workspaceData = {
      name: 'React Project',
      template: 'react',
      userType: 'solo'
    };

    // WHEN: Creating workspace
    const response = await request.post('/api/workspaces', {
      data: workspaceData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Workspace includes React-specific configuration
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.workspace.configuration).toMatchObject({
      framework: 'react',
      packageManager: 'bun',
      typescript: true
    });
  });

  test('should set workspace as default when user has no workspaces', async ({ request }) => {
    // GIVEN: New user creating first workspace
    const workspaceData = {
      name: 'First Workspace',
      template: 'nodejs',
      userType: 'solo'
    };

    // WHEN: Creating workspace
    const response = await request.post('/api/workspaces', {
      data: workspaceData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Workspace is set as default
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.workspace.isDefault).toBe(true);
  });

  test('should reject workspace creation without authentication', async ({ request }) => {
    // GIVEN: Workspace data without auth token
    const workspaceData = {
      name: 'Unauthorized Workspace',
      template: 'react'
    };

    // WHEN: Attempting to create workspace
    const response = await request.post('/api/workspaces', {
      data: workspaceData
    });

    // THEN: Unauthorized error is returned
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Authentication required');
  });

  test('should validate required workspace name', async ({ request }) => {
    // GIVEN: Workspace data without name
    const workspaceData = {
      template: 'react',
      userType: 'solo'
    };

    // WHEN: Attempting to create workspace
    const response = await request.post('/api/workspaces', {
      data: workspaceData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Validation error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'name',
          message: expect.stringContaining('required')
        })
      ])
    );
  });

  test('should validate workspace template value', async ({ request }) => {
    // GIVEN: Workspace data with invalid template
    const workspaceData = {
      name: 'Test Workspace',
      template: 'invalid-template',
      userType: 'solo'
    };

    // WHEN: Attempting to create workspace
    const response = await request.post('/api/workspaces', {
      data: workspaceData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Validation error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'template',
          message: expect.stringContaining('Invalid template')
        })
      ])
    );
  });
});

test.describe('GET /api/workspaces - List User Workspaces', () => {
  test('should return all workspaces for authenticated user', async ({ request }) => {
    // GIVEN: User has multiple workspaces
    // TODO: Create 3 workspaces via factory

    // WHEN: Fetching user workspaces
    const response = await request.get('/api/workspaces', {
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: All user workspaces are returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.workspaces).toHaveLength(3);
    expect(body.workspaces[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      template: expect.any(String)
    });
  });

  test('should return empty array when user has no workspaces', async ({ request }) => {
    // GIVEN: New user with no workspaces
    // WHEN: Fetching workspaces
    const response = await request.get('/api/workspaces', {
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Empty array is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.workspaces).toEqual([]);
  });

  test('should indicate which workspace is default', async ({ request }) => {
    // GIVEN: User has workspaces with one set as default
    // WHEN: Fetching workspaces
    const response = await request.get('/api/workspaces', {
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Default workspace is flagged
    expect(response.status()).toBe(200);
    const body = await response.json();
    const defaultWorkspaces = body.workspaces.filter((w: any) => w.isDefault);
    expect(defaultWorkspaces).toHaveLength(1);
  });
});

test.describe('PUT /api/auth/profile - Update User Profile', () => {
  test('should update preferred AI tools', async ({ request }) => {
    // GIVEN: Updated AI tools preferences
    const profileData = {
      preferredAiTools: ['claude', 'cursor', 'chatgpt']
    };

    // WHEN: Updating profile
    const response = await request.put('/api/auth/profile', {
      data: profileData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Profile is updated
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile.preferredAiTools).toEqual(profileData.preferredAiTools);
  });

  test('should update notification preferences', async ({ request }) => {
    // GIVEN: Updated notification preferences
    const profileData = {
      notificationPreferences: {
        email: false,
        inApp: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      }
    };

    // WHEN: Updating profile
    const response = await request.put('/api/auth/profile', {
      data: profileData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Notification preferences are saved
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile.notificationPreferences).toMatchObject(profileData.notificationPreferences);
  });

  test('should update default workspace', async ({ request }) => {
    // GIVEN: New default workspace ID
    const profileData = {
      defaultWorkspaceId: 'workspace-123'
    };

    // WHEN: Updating profile
    const response = await request.put('/api/auth/profile', {
      data: profileData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Default workspace is updated
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile.defaultWorkspaceId).toBe(profileData.defaultWorkspaceId);
  });

  test('should reject profile update without authentication', async ({ request }) => {
    // GIVEN: Profile data without auth token
    const profileData = {
      preferredAiTools: ['claude']
    };

    // WHEN: Attempting to update profile
    const response = await request.put('/api/auth/profile', {
      data: profileData
    });

    // THEN: Unauthorized error is returned
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Authentication required');
  });

  test('should validate workspace ownership when setting default workspace', async ({
    request
  }) => {
    // GIVEN: Workspace ID belonging to different user
    const profileData = {
      defaultWorkspaceId: 'other-user-workspace-id'
    };

    // WHEN: Attempting to set as default
    const response = await request.put('/api/auth/profile', {
      data: profileData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Forbidden error is returned
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('not authorized');
  });

  test('should validate AI tools array values', async ({ request }) => {
    // GIVEN: Invalid AI tool name
    const profileData = {
      preferredAiTools: ['claude', 'invalid-tool']
    };

    // WHEN: Attempting to update profile
    const response = await request.put('/api/auth/profile', {
      data: profileData,
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Validation error is returned
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'preferredAiTools',
          message: expect.stringContaining('Invalid AI tool')
        })
      ])
    );
  });
});

test.describe('GET /api/auth/profile - Get User Profile', () => {
  test('should return current user profile', async ({ request }) => {
    // GIVEN: Authenticated user with profile
    // WHEN: Fetching profile
    const response = await request.get('/api/auth/profile', {
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Profile data is returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile).toMatchObject({
      userId: expect.any(String),
      preferredAiTools: expect.any(Array),
      notificationPreferences: expect.any(Object),
      defaultWorkspaceId: expect.any(String)
    });
  });

  test('should not include sensitive data in profile response', async ({ request }) => {
    // GIVEN: User profile request
    // WHEN: Fetching profile
    const response = await request.get('/api/auth/profile', {
      headers: {
        Authorization: 'Bearer mock-jwt-token'
      }
    });

    // THEN: Password and OAuth secrets are not returned
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile).not.toHaveProperty('password');
    expect(body.profile).not.toHaveProperty('password_hash');
    expect(body.profile).not.toHaveProperty('oauth_secret');
  });
});
