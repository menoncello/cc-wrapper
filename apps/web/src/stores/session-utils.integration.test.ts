/**
 * Integration tests for session-utils functions
 * Tests for createCheckpointSummary, isCheckpointExpired, formatCheckpointSize and integration scenarios
 */

import { describe, expect, test } from 'bun:test';

import type { CheckpointPriority } from './session-types';
import {
  createCheckpointSummary,
  createDefaultCheckpointFilter,
  filterCheckpoints,
  formatCheckpointSize,
  isCheckpointExpired,
  normalizeFilterForApi,
  sortCheckpoints,
  validateCheckpointName,
  validateCheckpointPriority,
  validateCheckpointTags
} from './session-utils';

describe('isCheckpointExpired - Basic Expiration', () => {
  test('should identify non-expired checkpoints', () => {
    // Create a checkpoint that's very recent (1 minute ago)
    const now = new Date();
    const recentCheckpoint = {
      createdAt: new Date(now.getTime() - 60 * 1000).toISOString() // 1 minute ago
    };

    expect(isCheckpointExpired(recentCheckpoint)).toBe(false);
  });

  test('should identify very old checkpoints as expired', () => {
    // Create a checkpoint that's very old (100 days ago)
    const now = new Date();
    const oldCheckpoint = {
      createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString() // 100 days ago
    };

    expect(isCheckpointExpired(oldCheckpoint)).toBe(true);
  });
});

describe('isCheckpointExpired - Custom Max Age', () => {
  test('should handle custom max age', () => {
    const now = new Date();
    const checkpoint = {
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    // With 1 hour max age, should be expired
    expect(isCheckpointExpired(checkpoint, 60 * 60 * 1000)).toBe(true);

    // With 2 days max age, should not be expired
    expect(isCheckpointExpired(checkpoint, 2 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});

describe('isCheckpointExpired - Edge Cases', () => {
  test('should handle edge cases', () => {
    const now = new Date();
    const exactlyMaxAgeCheckpoint = {
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() // Exactly 30 days ago
    };

    // Should not be expired (age equals max age)
    expect(isCheckpointExpired(exactlyMaxAgeCheckpoint, 30 * 24 * 60 * 60 * 1000)).toBe(false);

    // One millisecond more should make it expired
    const oneMsOlder = {
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 1).toISOString()
    };
    expect(isCheckpointExpired(oneMsOlder, 30 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  test('should handle invalid dates', () => {
    const checkpoint = {
      createdAt: 'invalid-date'
    };

    // Should handle invalid date gracefully
    const result = isCheckpointExpired(checkpoint);
    expect(typeof result).toBe('boolean');
  });
});

describe('formatCheckpointSize - Basic Formatting', () => {
  test('should format bytes correctly', () => {
    expect(formatCheckpointSize(0)).toBe('0.0 B');
    expect(formatCheckpointSize(512)).toBe('512.0 B');
    expect(formatCheckpointSize(1023)).toBe('1023.0 B');
  });

  test('should format kilobytes correctly', () => {
    expect(formatCheckpointSize(1024)).toBe('1.0 KB');
    expect(formatCheckpointSize(1536)).toBe('1.5 KB');
    expect(formatCheckpointSize(1024 * 1023)).toBe('1023.0 KB');
  });

  test('should format megabytes correctly', () => {
    expect(formatCheckpointSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatCheckpointSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  test('should format gigabytes correctly', () => {
    expect(formatCheckpointSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatCheckpointSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});

describe('formatCheckpointSize - Edge Cases', () => {
  test('should handle very large numbers', () => {
    const veryLarge = 1024 * 1024 * 1024 * 1024; // 1 TB
    expect(formatCheckpointSize(veryLarge)).toBe('1024.0 GB'); // Should cap at GB
  });

  test('should handle decimal precision', () => {
    expect(formatCheckpointSize(1234)).toBe('1.2 KB'); // Should round to 1 decimal place
    expect(formatCheckpointSize(1.05 * 1024)).toBe('1.1 KB'); // Should round up
  });

  test('should handle negative values', () => {
    // Let's check what the actual behavior is for negative values
    const result = formatCheckpointSize(-1024);
    // Based on the implementation, negative values stay in bytes
    expect(result).toBe('-1024.0 B');
  });
});

describe('createCheckpointSummary - Basic Creation', () => {
  const baseCheckpoint = {
    name: 'Test Checkpoint',
    description: 'A test checkpoint',
    tags: ['test', 'demo'],
    createdAt: '2024-01-15T10:30:00Z',
    compressedSize: 1024 * 1024, // 1 MB
    priority: 'high' as CheckpointPriority
  };

  test('should create summary with all fields', () => {
    const summary = createCheckpointSummary(baseCheckpoint);

    expect(summary).toContain('Test Checkpoint');
    expect(summary).toContain('(A test checkpoint)');
    expect(summary).toContain('[test, demo]');
    expect(summary).toContain('1.0 MB');
    expect(summary).toContain('(high priority)');
    expect(summary).toContain('Created:');
  });
});

describe('createCheckpointSummary - Missing Fields', () => {
  const baseCheckpoint = {
    name: 'Test Checkpoint',
    description: 'A test checkpoint',
    tags: ['test', 'demo'],
    createdAt: '2024-01-15T10:30:00Z',
    compressedSize: 1024 * 1024, // 1 MB
    priority: 'high' as CheckpointPriority
  };

  test('should create summary without description', () => {
    const checkpoint = { ...baseCheckpoint, description: undefined };
    const summary = createCheckpointSummary(checkpoint);

    expect(summary).toContain('Test Checkpoint');
    expect(summary).not.toContain('()');
    expect(summary).toContain('[test, demo]');
  });

  test('should create summary without tags', () => {
    const checkpoint = { ...baseCheckpoint, tags: [] };
    const summary = createCheckpointSummary(checkpoint);

    expect(summary).toContain('Test Checkpoint');
    expect(summary).not.toContain('[]');
  });

  test('should handle empty description', () => {
    const checkpoint = { ...baseCheckpoint, description: '' };
    const summary = createCheckpointSummary(checkpoint);

    expect(summary).toContain('Test Checkpoint');
    expect(summary).not.toContain('()');
  });
});

describe('createCheckpointSummary - Formatting', () => {
  const baseCheckpoint = {
    name: 'Test Checkpoint',
    description: 'A test checkpoint',
    tags: ['test', 'demo'],
    createdAt: '2024-01-15T10:30:00Z',
    compressedSize: 1024 * 1024, // 1 MB
    priority: 'high' as CheckpointPriority
  };

  test('should format date correctly', () => {
    // We can't easily mock toLocaleDateString in Bun, so let's just check that it includes the date
    const summary = createCheckpointSummary(baseCheckpoint);

    expect(summary).toContain('Created:');
    // The exact format will depend on the locale, but it should include some date representation
    expect(summary).toMatch(/Created: (?:\d{1,2}\/){2}\d{4}/);
  });

  test('should handle different priority levels', () => {
    const lowPriority = { ...baseCheckpoint, priority: 'low' as CheckpointPriority };
    const mediumPriority = { ...baseCheckpoint, priority: 'medium' as CheckpointPriority };

    expect(createCheckpointSummary(lowPriority)).toContain('(low priority)');
    expect(createCheckpointSummary(mediumPriority)).toContain('(medium priority)');
  });

  test('should handle special characters in name and description', () => {
    const checkpoint = {
      ...baseCheckpoint,
      name: 'Test & Special "Characters"',
      description: 'Description with @ symbols #hashtags'
    };

    const summary = createCheckpointSummary(checkpoint);

    expect(summary).toContain('Test & Special "Characters"');
    expect(summary).toContain('(Description with @ symbols #hashtags)');
  });
});

describe('Integration Tests - Filter and Sort', () => {
  test('should work together: filter and sort checkpoints', () => {
    const checkpoints = [
      {
        createdAt: '2024-01-10T10:00:00Z',
        name: 'Database Migration',
        description: 'Schema update',
        tags: ['database'],
        compressedSize: 2048,
        priority: 'high' as CheckpointPriority
      },
      {
        createdAt: '2024-01-12T15:30:00Z',
        name: 'UI Update',
        description: 'New design',
        tags: ['ui'],
        compressedSize: 1024,
        priority: 'medium' as CheckpointPriority
      },
      {
        createdAt: '2024-01-11T09:15:00Z',
        name: 'Database Fix',
        description: 'Database repair',
        tags: ['database', 'fix'],
        compressedSize: 512,
        priority: 'low' as CheckpointPriority
      }
    ];

    // First filter by database tag, then sort by name
    const filtered = filterCheckpoints(checkpoints, '', ['database']);
    const sorted = sortCheckpoints(
      filtered as unknown as Array<{
        createdAt: string;
        name: string;
        compressedSize: number;
        priority: CheckpointPriority;
      }>,
      'name',
      'asc'
    );

    expect(sorted).toHaveLength(2);
    expect(sorted[0].name).toBe('Database Fix');
    expect(sorted[1].name).toBe('Database Migration');
  });
});

describe('Integration Tests - Validation and Filter Creation', () => {
  test('should work together: validation and filter creation', () => {
    // Validate inputs first
    expect(validateCheckpointName('Test Checkpoint')).toBe(true);
    expect(validateCheckpointPriority('high')).toBe(true);
    expect(validateCheckpointTags(['test', 'important'])).toBe(true);

    // Create filter with validated data
    const filter = createDefaultCheckpointFilter({
      priority: 'high',
      tags: ['test', 'important'],
      limit: 5
    });

    // Normalize for API
    const params = normalizeFilterForApi(filter);

    expect(params.get('priority')).toBe('high');
    expect(params.getAll('tags')).toEqual(['test', 'important']);
    expect(params.get('limit')).toBe('5');
  });
});

describe('Integration Tests - Checkpoint Creation and Summary', () => {
  test('should work together: checkpoint creation and summary', () => {
    const checkpoint = {
      name: 'Critical Update',
      description: 'Security and performance improvements',
      tags: ['security', 'performance', 'critical'],
      createdAt: '2024-01-15T10:30:00Z',
      compressedSize: 2.5 * 1024 * 1024, // 2.5 MB
      priority: 'high' as CheckpointPriority
    };

    // Validate checkpoint data
    expect(validateCheckpointName(checkpoint.name)).toBe(true);
    expect(validateCheckpointTags(checkpoint.tags)).toBe(true);
    expect(validateCheckpointPriority(checkpoint.priority)).toBe(true);

    // Create summary
    const summary = createCheckpointSummary(checkpoint);

    expect(summary).toContain('Critical Update');
    expect(summary).toContain('2.5 MB');
    expect(summary).toContain('(high priority)');
    expect(summary).toContain('[security, performance, critical]');
  });
});
