/**
 * Unit tests for session-utils filterCheckpoints function
 * Tests for filtering checkpoints by search queries and tags
 */

import { describe, expect, test } from 'bun:test';

import { filterCheckpoints } from './session-utils';

describe('filterCheckpoints - Basic Filtering', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should return all checkpoints when no filters provided', () => {
    const filtered = filterCheckpoints(checkpoints);

    expect(filtered).toEqual(checkpoints);
  });

  test('should return all checkpoints when empty filters provided', () => {
    const filtered = filterCheckpoints(checkpoints, '', []);

    expect(filtered).toEqual(checkpoints);
  });

  test('should handle empty checkpoint array', () => {
    const filtered = filterCheckpoints([], 'test', ['tag']);

    expect(filtered).toEqual([]);
  });
});

describe('filterCheckpoints - Search Filtering - Basic', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should filter by name search query', () => {
    const filtered = filterCheckpoints(checkpoints, 'database');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Database Migration');
  });

  test('should filter by description search query', () => {
    const filtered = filterCheckpoints(checkpoints, 'dashboard');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('UI Update');
  });

  test('should be case-insensitive for search', () => {
    const filtered = filterCheckpoints(checkpoints, 'DATABASE');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Database Migration');
  });

  test('should filter by partial matches', () => {
    const filtered = filterCheckpoints(checkpoints, 'auth');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Bug Fix');
  });
});

describe('filterCheckpoints - Search Filtering - Edge Cases', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should handle checkpoints without description', () => {
    const filtered = filterCheckpoints(checkpoints, 'security');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Security Patch');
  });

  test('should return empty array for non-matching search', () => {
    const filtered = filterCheckpoints(checkpoints, 'nonexistent');

    expect(filtered).toEqual([]);
  });

  test('should handle search query with empty tags array', () => {
    const filtered = filterCheckpoints(checkpoints, 'ui', []);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('UI Update');
  });
});

describe('filterCheckpoints - Search Filtering - Special Cases', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should handle special characters in search', () => {
    const specialCheckpoints = [
      { name: 'Test@Special#Chars', description: 'Special characters test', tags: ['test'] }
    ];

    const filtered = filterCheckpoints(specialCheckpoints, '@Special#');

    expect(filtered).toHaveLength(1);
  });

  test('should handle undefined tags array', () => {
    const filtered = filterCheckpoints(checkpoints, 'database');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Database Migration');
  });
});

describe('filterCheckpoints - Tag Filtering - Single Tag', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should filter by single tag', () => {
    const filtered = filterCheckpoints(checkpoints, '', ['database']);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].name).toBe('Database Migration');
    expect(filtered[1].name).toBe('Performance');
  });

  test('should filter by multiple tags (AND logic)', () => {
    const filtered = filterCheckpoints(checkpoints, '', ['database', 'migration']);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Database Migration');
  });
});

describe('filterCheckpoints - Tag Filtering - Edge Cases', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should filter by tags that require all matches', () => {
    const filtered = filterCheckpoints(checkpoints, '', ['critical']);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].name).toBe('Database Migration');
    expect(filtered[1].name).toBe('Security Patch');
  });

  test('should return empty array for non-matching tags', () => {
    const filtered = filterCheckpoints(checkpoints, '', ['nonexistent']);

    expect(filtered).toEqual([]);
  });

  test('should handle empty search query with tags', () => {
    const filtered = filterCheckpoints(checkpoints, '', ['ui']);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('UI Update');
  });
});

describe('filterCheckpoints - Combined Filtering', () => {
  const checkpoints = [
    {
      name: 'Database Migration',
      description: 'Schema update for users table',
      tags: ['database', 'migration', 'critical']
    },
    {
      name: 'UI Update',
      description: 'New dashboard design',
      tags: ['ui', 'frontend']
    },
    {
      name: 'Bug Fix',
      description: 'Fixed authentication issue',
      tags: ['bug', 'auth', 'hotfix']
    },
    {
      name: 'Performance',
      description: 'Optimized queries',
      tags: ['performance', 'database']
    },
    {
      name: 'Security Patch',
      description: null as unknown as string,
      tags: ['security', 'critical']
    }
  ];

  test('should filter by search query and tags combined', () => {
    const filtered = filterCheckpoints(checkpoints, 'update', ['database']);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Database Migration');
  });
});
