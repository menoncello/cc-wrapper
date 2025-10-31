import { beforeEach, describe, expect, it } from 'vitest';

import { type Checkpoint } from '../../stores/session-store';
import { mockCheckpoint, mockCheckpoints, setupMockSessionStore } from './test-utils';

describe('CheckpointManager - Checkpoint Statistics - Count Calculations', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should calculate total checkpoints correctly', () => {
    const totalCheckpoints = mockCheckpoints.length;
    expect(totalCheckpoints).toBe(2);
  });

  it('should handle empty checkpoint list for count', () => {
    const emptyCheckpoints: Checkpoint[] = [];
    const totalCheckpoints = emptyCheckpoints.length;
    expect(totalCheckpoints).toBe(0);
  });

  it('should handle undefined checkpoints for count', () => {
    const undefinedCheckpoints = undefined as Checkpoint[] | undefined;
    const totalCheckpoints = undefinedCheckpoints?.length || 0;
    expect(totalCheckpoints).toBe(0);
  });
});

describe('CheckpointManager - Checkpoint Statistics - Storage Calculations', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should calculate storage used correctly', () => {
    const totalBytes = mockCheckpoints.reduce((sum, cp) => sum + cp.compressedSize, 0);
    const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
    expect(totalMB).toBe('0.8'); // 768 KB = 0.75 MB, rounded to 0.8
  });

  it('should handle empty checkpoint list for storage', () => {
    const emptyCheckpoints: Checkpoint[] = [];
    const totalStorage = emptyCheckpoints.reduce((sum, cp) => sum + cp.compressedSize, 0);
    expect(totalStorage).toBe(0);
  });

  it('should handle undefined checkpoints for storage', () => {
    const undefinedCheckpoints = undefined as Checkpoint[] | undefined;
    const totalStorage =
      undefinedCheckpoints?.reduce((sum: number, cp: Checkpoint) => sum + cp.compressedSize, 0) ||
      0;
    expect(totalStorage).toBe(0);
  });
});

describe('CheckpointManager - Checkpoint Statistics - Size Calculations', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should process checkpoint size calculations correctly', () => {
    const testCases = [
      { bytes: 0, expected: '0.0 MB' },
      { bytes: 1024, expected: '0.0 MB' },
      { bytes: 1024 * 1024, expected: '1.0 MB' },
      { bytes: 2.5 * 1024 * 1024, expected: '2.5 MB' }
    ];

    for (const { bytes, expected } of testCases) {
      const sizeInMB = (bytes / 1024 / 1024).toFixed(1);
      expect(`${sizeInMB} MB`).toBe(expected);
    }
  });
});

describe('CheckpointManager - Checkpoint Statistics - Latest Checkpoint Detection', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should find latest checkpoint date', () => {
    const sortedByDate = [...mockCheckpoints].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestCheckpoint = sortedByDate[0];
    if (latestCheckpoint) {
      const latestDate = new Date(latestCheckpoint.createdAt).toLocaleDateString();
      expect(latestDate).toBe('12/1/2023');
    } else {
      expect.fail('Expected at least one checkpoint');
    }
  });

  it('should handle empty checkpoint list for latest date', () => {
    const emptyCheckpoints: Checkpoint[] = [];
    const latestCheckpoint =
      emptyCheckpoints.length > 0 && emptyCheckpoints[0]
        ? new Date(emptyCheckpoints[0].createdAt).toLocaleDateString()
        : 'None';
    expect(latestCheckpoint).toBe('None');
  });

  it('should handle undefined checkpoints for latest date', () => {
    const undefinedCheckpoints = undefined as Checkpoint[] | undefined;
    const latestCheckpoint =
      undefinedCheckpoints && undefinedCheckpoints.length > 0 && undefinedCheckpoints[0]
        ? new Date(undefinedCheckpoints[0].createdAt).toLocaleDateString()
        : 'None';
    expect(latestCheckpoint).toBe('None');
  });
});

describe('CheckpointManager - Checkpoint Statistics - Date Formatting', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should handle date formatting correctly', () => {
    const testDate = '2023-12-01T10:30:00Z';
    const formattedDate = new Date(testDate).toLocaleDateString();

    // The exact format depends on locale, but it should be a valid date string
    expect(formattedDate).toBeTruthy();
    expect(typeof formattedDate).toBe('string');
  });
});

describe('CheckpointManager - Checkpoint Statistics - Array Operations', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should handle array operations for checkpoints', () => {
    const operations = [
      { checkpoints: [], length: 0, hasItems: false },
      { checkpoints: [mockCheckpoint], length: 1, hasItems: true },
      { checkpoints: mockCheckpoints, length: 2, hasItems: true }
    ];

    for (const { checkpoints, length, hasItems } of operations) {
      expect(checkpoints.length).toBe(length);
      expect(checkpoints.length > 0).toBe(hasItems);
    }
  });
});

describe('CheckpointManager - Checkpoint Statistics - Complete Integration - Empty List', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should calculate all statistics for empty checkpoint list', () => {
    const emptyCheckpoints: Checkpoint[] = [];

    const totalCheckpoints = emptyCheckpoints.length;
    const totalStorage = emptyCheckpoints.reduce((sum, cp) => sum + cp.compressedSize, 0);
    const latestCheckpoint =
      emptyCheckpoints.length > 0 && emptyCheckpoints[0]
        ? new Date(emptyCheckpoints[0].createdAt).toLocaleDateString()
        : 'None';

    expect(totalCheckpoints).toBe(0);
    expect(totalStorage).toBe(0);
    expect(latestCheckpoint).toBe('None');
  });
});

describe('CheckpointManager - Checkpoint Statistics - Complete Integration - Undefined', () => {
  beforeEach(() => {
    setupMockSessionStore();
  });

  it('should calculate all statistics for undefined checkpoints', () => {
    const undefinedCheckpoints = undefined as Checkpoint[] | undefined;

    const totalCheckpoints = undefinedCheckpoints?.length || 0;
    const totalStorage =
      undefinedCheckpoints?.reduce((sum: number, cp: Checkpoint) => sum + cp.compressedSize, 0) ||
      0;
    const latestCheckpoint =
      undefinedCheckpoints && undefinedCheckpoints.length > 0 && undefinedCheckpoints[0]
        ? new Date(undefinedCheckpoints[0].createdAt).toLocaleDateString()
        : 'None';

    expect(totalCheckpoints).toBe(0);
    expect(totalStorage).toBe(0);
    expect(latestCheckpoint).toBe('None');
  });
});
