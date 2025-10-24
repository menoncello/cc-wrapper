/**
 * K6 Load Test Script for Onboarding Wizard Flow
 *
 * This script simulates multiple users completing the onboarding wizard
 * to validate performance under concurrent load.
 *
 * Test Scenarios:
 * 1. Complete onboarding flow (user type → AI tools → workspace config)
 * 2. Skip onboarding functionality
 * 3. Profile settings access after onboarding
 *
 * Performance Targets:
 * - Response time: < 2 seconds for API calls
 * - Error rate: < 1%
 * - Throughput: Support 50 concurrent users
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for onboarding flow
export let errorRate = new Rate('errors');
export let onboardingDuration = new Trend('onboarding_duration');
export let apiResponseTime = new Trend('api_response_time');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 25 }, // Ramp up to 25 users
    { duration: '5m', target: 25 }, // Stay at 25 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users (peak load)
    { duration: '2m', target: 0 } // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    errors: ['rate<0.01'] // Custom error rate under 1%
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data generators
function generateRandomUser() {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);

  return {
    email: `testuser${randomId}@example.com`,
    password: 'TestPassword123!',
    username: `testuser${randomId}`,
    userType: ['solo', 'team', 'enterprise'][Math.floor(Math.random() * 3)],
    workspaceName: `Workspace ${randomId}`,
    workspaceTemplate: ['React', 'Node.js', 'Python', 'Custom'][Math.floor(Math.random() * 4)],
    aiTools: (() => {
      const tools = ['Claude', 'ChatGPT', 'Cursor', 'Windsurf', 'GitHub Copilot'];
      const numTools = Math.floor(Math.random() * 3) + 1; // 1-3 tools
      return tools.sort(() => 0.5 - Math.random()).slice(0, numTools);
    })()
  };
}

function authenticateUser(user) {
  // Simulate authentication - in real scenario, this would be actual login
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  check(loginResponse, {
    'login successful': r => r.status === 200,
    'login response time < 1s': r => r.timings.duration < 1000
  }) || errorRate.add(1);

  if (loginResponse.status === 200) {
    return loginResponse.json('token');
  }
  return null;
}

function completeOnboardingFlow(user, token) {
  const startTime = Date.now();
  let success = true;

  group('Onboarding Wizard Flow', function () {
    // Step 1: Select user type
    const userStepResponse = http.post(
      `${BASE_URL}/api/workspaces`,
      JSON.stringify({
        userType: user.userType,
        workspaceName: user.workspaceName,
        workspaceTemplate: user.workspaceTemplate,
        preferredAITools: user.aiTools
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    const userStepOk = check(userStepResponse, {
      'workspace creation successful': r => r.status === 201,
      'workspace response time < 2s': r => r.timings.duration < 2000,
      'workspace created with correct data': r => {
        const data = r.json();
        return (
          data.workspace &&
          data.workspace.name === user.workspaceName &&
          data.workspace.template === user.workspaceTemplate
        );
      }
    });

    apiResponseTime.add(userStepResponse.timings.duration);
    success = success && userStepOk;
    if (!userStepOk) errorRate.add(1);

    sleep(1); // Think time between steps

    // Step 2: Update profile with preferences
    const profileResponse = http.put(
      `${BASE_URL}/api/auth/profile`,
      JSON.stringify({
        preferredAITools: user.aiTools,
        notificationPreferences: {
          email: true,
          inApp: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    const profileOk = check(profileResponse, {
      'profile update successful': r => r.status === 200,
      'profile update time < 1s': r => r.timings.duration < 1000,
      'profile updated with AI tools': r => {
        const data = r.json();
        return (
          data.profile &&
          Array.isArray(data.profile.preferredAITools) &&
          data.profile.preferredAITools.length === user.aiTools.length
        );
      }
    });

    apiResponseTime.add(profileResponse.timings.duration);
    success = success && profileOk;
    if (!profileOk) errorRate.add(1);

    sleep(1); // Think time
  });

  const duration = Date.now() - startTime;
  onboardingDuration.add(duration);

  return success;
}

function skipOnboardingFlow(user, token) {
  const startTime = Date.now();
  let success = true;

  group('Skip Onboarding Flow', function () {
    // Skip onboarding and create default workspace
    const skipResponse = http.post(
      `${BASE_URL}/api/workspaces`,
      JSON.stringify({
        userType: 'solo',
        workspaceName: 'My Workspace',
        workspaceTemplate: 'Custom',
        preferredAITools: []
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    const skipOk = check(skipResponse, {
      'skip workspace creation successful': r => r.status === 201,
      'skip response time < 2s': r => r.timings.duration < 2000,
      'default workspace created': r => {
        const data = r.json();
        return (
          data.workspace &&
          data.workspace.name === 'My Workspace' &&
          data.workspace.template === 'Custom'
        );
      }
    });

    apiResponseTime.add(skipResponse.timings.duration);
    success = success && skipOk;
    if (!skipOk) errorRate.add(1);
  });

  const duration = Date.now() - startTime;
  onboardingDuration.add(duration);

  return success;
}

function accessProfileSettings(token) {
  let success = true;

  group('Profile Settings Access', function () {
    // Get user profile
    const profileResponse = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const profileOk = check(profileResponse, {
      'profile retrieval successful': r => r.status === 200,
      'profile retrieval time < 500ms': r => r.timings.duration < 500,
      'profile data complete': r => {
        const data = r.json();
        return data.user && data.user.id && data.user.profile;
      }
    });

    apiResponseTime.add(profileResponse.timings.duration);
    success = success && profileOk;
    if (!profileOk) errorRate.add(1);

    sleep(0.5); // Think time

    // Get workspaces
    const workspacesResponse = http.get(`${BASE_URL}/api/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const workspacesOk = check(workspacesResponse, {
      'workspaces retrieval successful': r => r.status === 200,
      'workspaces retrieval time < 1s': r => r.timings.duration < 1000,
      'workspaces array returned': r => {
        const data = r.json();
        return Array.isArray(data.workspaces);
      }
    });

    apiResponseTime.add(workspacesResponse.timings.duration);
    success = success && workspacesOk;
    if (!workspacesOk) errorRate.add(1);
  });

  return success;
}

export default function () {
  const user = generateRandomUser();

  // Simulate user authentication (in real scenario, users would be pre-registered)
  const token = authenticateUser(user);

  if (!token) {
    console.error('Failed to authenticate user');
    return;
  }

  // 70% of users complete full onboarding, 30% skip
  const completeOnboarding = Math.random() < 0.7;

  if (completeOnboarding) {
    const success = completeOnboardingFlow(user, token);
    if (success) {
      // Access profile settings after onboarding
      accessProfileSettings(token);
    }
  } else {
    const success = skipOnboardingFlow(user, token);
    if (success) {
      // Access profile settings to complete the flow
      accessProfileSettings(token);
    }
  }

  sleep(2); // End of test think time
}

export function handleSummary(data) {
  return {
    'onboarding-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}
