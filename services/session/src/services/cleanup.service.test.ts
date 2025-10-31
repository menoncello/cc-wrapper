import { describe, expect, it, beforeEach, afterEach } from 'bun:test';

import { createSessionCleanupService,SessionCleanupService } from './cleanup.service.js';

// Mock Prisma client for testing
const mockPrisma = {
  workspaceSession: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    deleteMany: () => Promise.resolve({ count: 0 }),
  },
  sessionCheckpoint: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    deleteMany: () => Promise.resolve({ count: 0 }),
  },
  $disconnect: () => Promise.resolve(),
};

// Set up global mock
(globalThis as any).prisma = mockPrisma;

describe('Session cleanup service', () => {
  beforeEach(() => {
    // Reset mock functions to their default state
    mockPrisma.workspaceSession.count = () => Promise.resolve(0);
    mockPrisma.sessionCheckpoint.count = () => Promise.resolve(0);
    mockPrisma.workspaceSession.findMany = () => Promise.resolve([]);
    mockPrisma.sessionCheckpoint.findMany = () => Promise.resolve([]);
  });
  describe('constructor and configuration', () => {
    it('should use default retention periods when no config provided', () => {
      const service = new SessionCleanupService();
      const periods = service.getRetentionPeriods();

      expect(periods.autoSavedSessions).toBe(30);
      expect(periods.checkpoints).toBe(90);
      expect(periods.inactiveSessions).toBe(7);
    });

    it('should use custom retention periods when provided', () => {
      const customPeriods = {
        autoSavedSessions: 60,
        checkpoints: 120,
        inactiveSessions: 14
      };

      const service = new SessionCleanupService(customPeriods);
      const periods = service.getRetentionPeriods();

      expect(periods.autoSavedSessions).toBe(60);
      expect(periods.checkpoints).toBe(120);
      expect(periods.inactiveSessions).toBe(14);
    });

    it('should merge partial config with defaults', () => {
      const partialPeriods = {
        autoSavedSessions: 45
      };

      const service = new SessionCleanupService(partialPeriods);
      const periods = service.getRetentionPeriods();

      expect(periods.autoSavedSessions).toBe(45); // Custom
      expect(periods.checkpoints).toBe(90); // Default
      expect(periods.inactiveSessions).toBe(7); // Default
    });
  });

  describe('createSessionCleanupService factory function', () => {
    it('should create service with default config', () => {
      const service = createSessionCleanupService();
      expect(service).toBeInstanceOf(SessionCleanupService);
    });

    it('should create service with custom config', () => {
      const customPeriods = {
        autoSavedSessions: 15,
        checkpoints: 30
      };

      const service = createSessionCleanupService(customPeriods);
      const periods = service.getRetentionPeriods();

      expect(periods.autoSavedSessions).toBe(15);
      expect(periods.checkpoints).toBe(30);
      expect(periods.inactiveSessions).toBe(7); // Default
    });
  });

  describe('getCleanupStatistics', () => {
    it('should return cleanup statistics structure', async () => {
      const service = new SessionCleanupService();

      // Mock the count calls to return specific values
      let callCount = 0;
      mockPrisma.workspaceSession.count = () => {
        callCount++;
        switch (callCount) {
          case 1: return Promise.resolve(10); // totalSessions
          case 2: return Promise.resolve(5);  // activeSessions
          case 3: return Promise.resolve(2);  // expiredSessions
          default: return Promise.resolve(0);
        }
      };

      mockPrisma.sessionCheckpoint.count = () => Promise.resolve(3); // oldCheckpoints

      const stats = await service.getCleanupStatistics();

      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('expiredSessions');
      expect(stats).toHaveProperty('oldCheckpoints');
      expect(stats).toHaveProperty('estimatedSpaceToFree');
      expect(stats).toHaveProperty('recommendations');

      expect(typeof stats.totalSessions).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.expiredSessions).toBe('number');
      expect(typeof stats.oldCheckpoints).toBe('number');
      expect(typeof stats.estimatedSpaceToFree).toBe('number');
      expect(Array.isArray(stats.recommendations)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle cleanup statistics gracefully', async () => {
      const service = new SessionCleanupService();

      // Mock the count calls to return zero values (no data scenario)
      let callCount = 0;
      mockPrisma.workspaceSession.count = () => {
        callCount++;
        return Promise.resolve(0); // All calls return 0
      };

      mockPrisma.sessionCheckpoint.count = () => Promise.resolve(0); // oldCheckpoints

      // This should not throw an error even with no data
      await expect(service.getCleanupStatistics()).resolves.toBeDefined();
    });
  });
});

describe('Session cleanup service edge cases', () => {
  it('should handle zero retention periods', () => {
    const service = new SessionCleanupService({
      autoSavedSessions: 0,
      checkpoints: 0,
      inactiveSessions: 0
    });

    const periods = service.getRetentionPeriods();
    expect(periods.autoSavedSessions).toBe(0);
    expect(periods.checkpoints).toBe(0);
    expect(periods.inactiveSessions).toBe(0);
  });

  it('should handle very large retention periods', () => {
    const service = new SessionCleanupService({
      autoSavedSessions: 365, // 1 year
      checkpoints: 730, // 2 years
      inactiveSessions: 90 // 3 months
    });

    const periods = service.getRetentionPeriods();
    expect(periods.autoSavedSessions).toBe(365);
    expect(periods.checkpoints).toBe(730);
    expect(periods.inactiveSessions).toBe(90);
  });
});