/**
 * K6 Load Test Script for Profile Settings Performance
 *
 * This script tests the performance of profile settings access and updates
 * under concurrent load, simulating users updating their preferences.
 *
 * Performance Targets:
 * - Profile retrieval: < 500ms
 * - Profile update: < 1 second
 * - Workspace listing: < 1 second
 * - Error rate: < 1%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export let errorRate = new Rate('errors');
export let profileAccessTime = new Trend('profile_access_time');
export let profileUpdateTime = new Trend('profile_update_time');
export let workspaceListTime = new Trend('workspace_list_time');

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '3m', target: 25 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Generate random AI tools selection
function generateRandomAITools() {
  const tools = ['Claude', 'ChatGPT', 'Cursor', 'Windsurf', 'GitHub Copilot'];
  const numTools = Math.floor(Math.random() * 4); // 0-3 tools
  return tools.sort(() => 0.5 - Math.random()).slice(0, numTools);
}

// Generate random notification preferences
function generateRandomNotificationPrefs() {
  return {
    email: Math.random() > 0.3, // 70% enable email notifications
    inApp: Math.random() > 0.1, // 90% enable in-app notifications
    quietHours: {
      enabled: Math.random() > 0.7, // 30% enable quiet hours
      start: ['22:00', '23:00', '00:00'][Math.floor(Math.random() * 3)],
      end: ['06:00', '07:00', '08:00'][Math.floor(Math.random() * 3)]
    }
  };
}

function accessProfileSettings(token) {
  let success = true;

  group('Profile Settings Access', function () {
    // Get user profile
    const profileStartTime = Date.now();

    const profileResponse = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    profileAccessTime.add(Date.now() - profileStartTime);

    const profileOk = check(profileResponse, {
      'profile retrieval successful': r => r.status === 200,
      'profile retrieval time < 500ms': r => r.timings.duration < 500,
      'profile data complete': r => {
        const data = r.json();
        return (
          data.user &&
          data.user.id &&
          data.user.profile &&
          data.user.profile.preferredAITools !== undefined
        );
      }
    });

    success = success && profileOk;
    if (!profileOk) errorRate.add(1);

    sleep(0.5);

    // Get workspaces list
    const workspaceStartTime = Date.now();

    const workspacesResponse = http.get(`${BASE_URL}/api/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    workspaceListTime.add(Date.now() - workspaceStartTime);

    const workspacesOk = check(workspacesResponse, {
      'workspaces retrieval successful': r => r.status === 200,
      'workspaces retrieval time < 1s': r => r.timings.duration < 1000,
      'workspaces array returned': r => {
        const data = r.json();
        return Array.isArray(data.workspaces) && data.workspaces.length >= 0;
      }
    });

    success = success && workspacesOk;
    if (!workspacesOk) errorRate.add(1);
  });

  return success;
}

function updateProfileSettings(token) {
  let success = true;

  group('Profile Settings Update', function () {
    const updateStartTime = Date.now();

    const aiTools = generateRandomAITools();
    const notificationPrefs = generateRandomNotificationPrefs();

    const updateResponse = http.put(
      `${BASE_URL}/api/auth/profile`,
      JSON.stringify({
        preferredAITools: aiTools,
        notificationPreferences: notificationPrefs
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    profileUpdateTime.add(Date.now() - updateStartTime);

    const updateOk = check(updateResponse, {
      'profile update successful': r => r.status === 200,
      'profile update time < 1s': r => r.timings.duration < 1000,
      'profile updated with correct AI tools': r => {
        const data = r.json();
        return (
          data.profile &&
          Array.isArray(data.profile.preferredAITools) &&
          JSON.stringify(data.profile.preferredAITools.sort()) === JSON.stringify(aiTools.sort())
        );
      },
      'profile updated with correct notification prefs': r => {
        const data = r.json();
        return (
          data.profile &&
          data.profile.notificationPreferences &&
          data.profile.notificationPreferences.email === notificationPrefs.email &&
          data.profile.notificationPreferences.inApp === notificationPrefs.inApp
        );
      }
    });

    success = success && updateOk;
    if (!updateOk) errorRate.add(1);

    sleep(1); // Think time after update
  });

  return success;
}

export default function () {
  const mockToken = 'mock-jwt-token-for-load-testing';

  // 60% of users just access profile settings, 40% update them
  const updateProfile = Math.random() < 0.4;

  const accessSuccess = accessProfileSettings(mockToken);

  if (accessSuccess && updateProfile) {
    const updateSuccess = updateProfileSettings(mockToken);
    if (!updateSuccess) {
      console.error('Profile update failed');
    }
  } else if (!accessSuccess) {
    console.error('Profile access failed');
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'profile-settings-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}
