/**
 * K6 Load Test Script for Skip Onboarding Functionality
 *
 * This script tests the performance of the skip onboarding flow
 * where users choose to skip the guided setup and get default workspace.
 *
 * Performance Targets:
 * - Skip flow completion: < 3 seconds
 * - Default workspace creation: < 2 seconds
 * - Error rate: < 1%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export let errorRate = new Rate('errors');
export let skipFlowDuration = new Trend('skip_flow_duration');
export let workspaceCreationTime = new Trend('workspace_creation_time');

export let options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function skipOnboardingFlow(token) {
  const startTime = Date.now();
  let success = true;

  group('Skip Onboarding Flow', function () {
    // Step 1: Initiate skip onboarding
    const skipStartTime = Date.now();

    const skipResponse = http.post(
      `${BASE_URL}/api/workspaces`,
      JSON.stringify({
        userType: 'solo',
        workspaceName: 'My Workspace',
        workspaceTemplate: 'Custom',
        workspaceDescription: 'Default workspace created when skipping onboarding',
        preferredAITools: []
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    workspaceCreationTime.add(Date.now() - skipStartTime);

    const skipOk = check(skipResponse, {
      'skip workspace creation successful': r => r.status === 201,
      'skip response time < 2s': r => r.timings.duration < 2000,
      'default workspace created correctly': r => {
        const data = r.json();
        return (
          data.workspace &&
          data.workspace.name === 'My Workspace' &&
          data.workspace.template === 'Custom' &&
          data.workspace.description === 'Default workspace created when skipping onboarding'
        );
      },
      'workspace ID generated': r => {
        const data = r.json();
        return data.workspace && data.workspace.id;
      }
    });

    success = success && skipOk;
    if (!skipOk) errorRate.add(1);

    sleep(1); // Think time after workspace creation

    // Step 2: Verify dashboard redirect works
    const dashboardResponse = http.get(`${BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      redirects: 0 // Don't follow redirects to check redirect status
    });

    const dashboardOk = check(dashboardResponse, {
      'dashboard redirect status': r => r.status === 302 || r.status === 200,
      'dashboard response time < 1s': r => r.timings.duration < 1000
    });

    success = success && dashboardOk;
    if (!dashboardOk) errorRate.add(1);

    sleep(0.5);
  });

  skipFlowDuration.add(Date.now() - startTime);
  return success;
}

export default function () {
  // For skip onboarding test, we'll use a mock token
  // In real scenario, users would be authenticated
  const mockToken = 'mock-jwt-token-for-load-testing';

  const success = skipOnboardingFlow(mockToken);

  if (!success) {
    console.error('Skip onboarding flow failed');
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'skip-onboarding-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}
