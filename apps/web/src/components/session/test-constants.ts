/**
 * Test constants for session components
 * Centralizes all magic numbers and string literals used in testing
 */

// Base numeric constants
export const NUM_256 = 256;
export const NUM_512 = 512;
export const NUM_1024 = 1024;
export const NUM_30000 = 30000;
export const NUM_20 = 20;

// Size constants in bytes
export const BYTES_PER_KB = NUM_1024;
export const SIZE_256_KB = NUM_256 * BYTES_PER_KB;
export const SIZE_512_KB = NUM_512 * BYTES_PER_KB;
export const SIZE_1_MB = NUM_1024 * BYTES_PER_KB;

// Time constants in milliseconds
export const AUTO_SAVE_INTERVAL = NUM_30000;

// Filter constants
export const CHECKPOINT_FILTER_LIMIT = NUM_20;

// String literals for test data
export const DEFAULT_SESSION_ID = 'session-123';
export const DEFAULT_USER_ID = 'user-123';
export const DEFAULT_WORKSPACE_ID = 'workspace-123';
export const DEFAULT_CHECKPOINT_ID = 'cp1';
export const DEFAULT_CHECKPOINT_NAME = 'Test Checkpoint';
export const DEFAULT_CHECKPOINT_DESCRIPTION = 'A test checkpoint';
export const DEFAULT_TIMESTAMP = '2023-12-01T10:00:00Z';
export const TEST_TAG = 'test';
export const DEMO_TAG = 'demo';
