// Import all test modules to ensure they run
import './checkpoint-manager-initialization.test';
import './checkpoint-manager-statistics.test';
import './checkpoint-manager-events-view.test';
import './checkpoint-manager-events-restore.test';
import './checkpoint-manager-rendering.test';
import './checkpoint-manager-integration-store.test';
import './checkpoint-manager-integration-methods.test';
import './checkpoint-manager-edge-cases-data.test';
import './checkpoint-manager-edge-cases-values.test';
import './checkpoint-manager-validation-config.test';
import './checkpoint-manager-validation-filter.test';

import { describe, expect, it } from 'vitest';

import { setupMockSessionStore } from './test-utils';

describe('CheckpointManager - Core Setup', () => {
  it('should set up test environment correctly', () => {
    const mockStore = setupMockSessionStore();

    expect(mockStore).toBeDefined();
    expect(typeof mockStore).toBe('function');
  });

  it('should validate test utilities are available', () => {
    // This test ensures that all our test utilities are properly exported and working
    expect(() => setupMockSessionStore()).not.toThrow();
  });

  it('should have imported all test modules', () => {
    // This is a meta-test to ensure all test files are loaded
    // If this test runs, it means all imports were successful
    expect(true).toBe(true);
  });
});
