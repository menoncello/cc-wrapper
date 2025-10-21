/**
 * Test Suite Index for CC Wrapper
 *
 * This file exports all test modules and provides organized imports
 * for the different test categories in the development environment setup.
 */

// Platform detection tests
export * from './setup-platform-detection.test';

// Dependency validation tests
export * from './setup-dependencies.test';

// Environment configuration tests
export * from './setup-configuration.test';

// Health check system tests
export * from './health-check.test';

// Health check integration tests
export * from './health-check-integration.test';

// Performance and SLA tests
export * from './setup-performance.test';

// Integration workflow tests
export * from './setup-integration.test';

// Error handling and edge case tests
export * from './setup-error-handling.test';

// Re-export test utilities for external use
export * from '../test-utils/factories/setup-factory';
export * from '../test-utils/fixtures/setup-fixtures';
