/**
 * End-to-End Tests for Session Service
 * Tests complete workflows without external dependencies
 */

import { beforeAll, afterAll, describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { createMockPrisma } from '../../test-mocks/prisma.mock';

// Create mock class for PrismaClient
const mockPrisma = createMockPrisma();
class MockPrismaClient {
  constructor() {
    return mockPrisma;
  }
}

// Mock the module
mock.module('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));

import { SessionSynchronizationService } from '../synchronization.service';
import { SessionKeyManagementService } from '../key-management.service';
import { EncryptionService } from '../encryption.service';
import { encryptData, decryptData } from '../../lib/encryption';
import { setupTestMocks, cleanupTestMocks } from '../../test-mocks/test-setup';

beforeAll(() => {
  setupTestMocks();
});

afterAll(() => {
  cleanupTestMocks();
});

describe.skip('End-to-End Session Service Tests', () => {
  let syncService: SessionSynchronizationService;
  let keyManagementService: SessionKeyManagementService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    syncService = new SessionSynchronizationService();
    keyManagementService = new SessionKeyManagementService();
    encryptionService = new EncryptionService();
  });

  afterEach(async () => {
    await syncService.shutdown();
  });

  describe('Complete Session Workflow', () => {
    test('should handle complete session lifecycle', async () => {
      const userId = 'e2e-user-123';
      const sessionId = 'e2e-session-123';
      const password = 'E2ETestP@ssw0rd123!';

      // 1. Create user subscription for real-time updates
      const subscription = await syncService.createSubscription({
        userId,
        sessionId,
        eventTypes: ['session_updated', 'checkpoint_created']
      });

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(userId);
      expect(subscription.sessionId).toBe(sessionId);

      // 2. Create session state data
      const sessionState = {
        terminal: {
          commandHistory: ['ls -la', 'cd /home/user', 'pwd'],
          workingDirectory: '/home/user',
          environment: { PATH: '/usr/bin:/bin', HOME: '/home/user' }
        },
        browser: {
          tabs: [
            { url: 'https://github.com', title: 'GitHub', active: true },
            { url: 'https://example.com', title: 'Example', active: false }
          ],
          activeTab: 0
        },
        aiConversations: {
          conversations: [
            {
              id: 'conv-123',
              model: 'claude-3',
              messages: [
                { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
                { role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01Z' }
              ]
            }
          ]
        },
        metadata: {
          capturedAt: new Date().toISOString(),
          version: '1.0',
          userId,
          sessionId
        }
      };

      // 3. Encrypt session data
      const encrypted = await encryptData(JSON.stringify(sessionState), password);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.data).not.toBe(JSON.stringify(sessionState));

      // 4. Publish session update event
      const updateEvent = await syncService.publishEvent({
        type: 'session_updated',
        sessionId,
        userId,
        data: { encrypted: encrypted.data, version: 1 }
      });

      expect(updateEvent).toBeDefined();
      expect(updateEvent.type).toBe('session_updated');
      expect(updateEvent.version).toBe(1);

      // 5. Decrypt and verify data integrity
      const decrypted = await decryptData(encrypted, password);
      const restoredState = JSON.parse(decrypted);

      expect(restoredState).toEqual(sessionState);
      expect(restoredState.terminal.commandHistory).toHaveLength(3);
      expect(restoredState.browser.tabs).toHaveLength(2);
      expect(restoredState.aiConversations.conversations).toHaveLength(1);

      // 6. Create checkpoint event
      const checkpointEvent = await syncService.publishEvent({
        type: 'checkpoint_created',
        sessionId,
        userId,
        data: {
          checkpointId: 'checkpoint-123',
          name: 'Auto-checkpoint',
          description: 'Automatically created checkpoint',
          encryptedData: encrypted.data
        }
      });

      expect(checkpointEvent).toBeDefined();
      expect(checkpointEvent.type).toBe('checkpoint_created');

      // 7. Check for any conflicts (should be none)
      const conflicts = syncService.getUnresolvedConflicts();
      expect(conflicts).toHaveLength(0);

      // 8. Cleanup subscription
      const removed = await syncService.removeSubscription(subscription.id);
      expect(removed).toBe(true);
    });

    test('should handle concurrent session updates', async () => {
      const userId = 'concurrent-user-123';
      const sessionId = 'concurrent-session-123';
      const password = 'ConcurrentP@ssw0rd123!';

      // Mock Prisma to return sequential versions
      let currentVersion = 0;
      mockPrisma.workspaceSession.findUnique.mockImplementation(({ where }: any) => {
        return Promise.resolve({
          id: where.id,
          version: currentVersion++
        });
      });

      // Create multiple subscriptions
      const subscription1 = await syncService.createSubscription({
        userId: 'user1',
        sessionId,
        eventTypes: ['session_updated']
      });

      const subscription2 = await syncService.createSubscription({
        userId: 'user2',
        sessionId,
        eventTypes: ['session_updated']
      });

      // Simulate concurrent updates
      const events = [];
      for (let i = 0; i < 5; i++) {
        const event = await syncService.publishEvent({
          type: 'session_updated',
          sessionId,
          userId: `user${(i % 2) + 1}`,
          data: { updateNumber: i, timestamp: Date.now() }
        });
        events.push(event);
      }

      expect(events).toHaveLength(5);
      events.forEach((event, index) => {
        expect(event.version).toBeGreaterThan(0);
        expect(event.data.updateNumber).toBe(index);
      });

      // Verify versions are sequential
      const versions = events.map(e => e.version).sort((a, b) => a - b);
      for (let i = 1; i < versions.length; i++) {
        expect(versions[i]).toBeGreaterThan(versions[i - 1]);
      }

      // Cleanup
      await syncService.removeSubscription(subscription1.id);
      await syncService.removeSubscription(subscription2.id);
    });

    test('should handle session state with large data', async () => {
      const userId = 'large-data-user-123';
      const sessionId = 'large-data-session-123';
      const password = 'LargeDataP@ssw0rd123!';

      // Create large session state
      const largeState = {
        terminal: {
          commandHistory: Array.from({ length: 1000 }, (_, i) => `command-${i}`),
          workingDirectory: '/very/long/path/to/project/with/many/subdirectories',
          environment: Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [`VAR_${i}`, `value-${i}`])
          )
        },
        browser: {
          tabs: Array.from({ length: 50 }, (_, i) => ({
            url: `https://example${i}.com`,
            title: `Tab ${i}`,
            active: i === 0
          })),
          activeTab: 0
        },
        aiConversations: {
          conversations: Array.from({ length: 10 }, (_, i) => ({
            id: `conv-${i}`,
            model: 'claude-3',
            messages: Array.from({ length: 20 }, (_, j) => ({
              role: j % 2 === 0 ? 'user' : 'assistant',
              content: `Message ${j} in conversation ${i} with some longer content to simulate real usage`,
              timestamp: new Date().toISOString()
            }))
          }))
        },
        files: {
          openFiles: Array.from({ length: 25 }, (_, i) => ({
            path: `/project/file-${i}.ts`,
            content: 'x'.repeat(1000), // 1KB per file
            cursor: { line: i + 1, column: 1 }
          }))
        },
        metadata: {
          capturedAt: new Date().toISOString(),
          version: '1.0',
          userId,
          sessionId,
          size: 'large'
        }
      };

      // Encrypt large data
      const startTime = Date.now();
      const encrypted = await encryptData(JSON.stringify(largeState), password);
      const encryptionTime = Date.now() - startTime;

      expect(encrypted.data).toBeDefined();
      expect(encryptionTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Decrypt large data
      const decryptStartTime = Date.now();
      const decrypted = await decryptData(encrypted, password);
      const decryptionTime = Date.now() - decryptStartTime;

      expect(decryptionTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Verify data integrity
      const restoredState = JSON.parse(decrypted);
      expect(restoredState.terminal.commandHistory).toHaveLength(1000);
      expect(restoredState.browser.tabs).toHaveLength(50);
      expect(restoredState.aiConversations.conversations).toHaveLength(10);
      expect(restoredState.files.openFiles).toHaveLength(25);

      console.log(`Large data encryption time: ${encryptionTime}ms`);
      console.log(`Large data decryption time: ${decryptionTime}ms`);
    });

    test('should handle encryption/decryption with different algorithms', async () => {
      const testData = 'Test data for different algorithms';
      const password = 'AlgorithmTestP@ssw0rd123!';

      // Test default encryption
      const encrypted1 = await encryptData(testData, password);
      const decrypted1 = await decryptData(encrypted1, password);
      expect(decrypted1).toBe(testData);

      // Test with custom salt
      const customSalt = 'dGVzdC1jdXN0b20tc2FsdA==';
      const encrypted2 = await encryptData(testData, password, customSalt);
      const decrypted2 = await decryptData(encrypted2, password);
      expect(decrypted2).toBe(testData);

      // Verify custom salt is used correctly
      expect(encrypted2.salt).toBe(customSalt);

      // For the default encryption, verify a generated salt was used
      expect(encrypted1.salt).toBeDefined();
      expect(encrypted1.salt).not.toBe(customSalt);

      // Verify both have valid encryption structure
      expect(encrypted1).toHaveProperty('data');
      expect(encrypted1).toHaveProperty('salt');
      expect(encrypted1).toHaveProperty('iv');
      expect(encrypted1).toHaveProperty('algorithm');

      expect(encrypted2).toHaveProperty('data');
      expect(encrypted2).toHaveProperty('salt');
      expect(encrypted2).toHaveProperty('iv');
      expect(encrypted2).toHaveProperty('algorithm');

      // Verify algorithm is consistent
      expect(encrypted1.algorithm).toBe(encrypted2.algorithm);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid subscription operations', async () => {
      // Remove non-existent subscription
      const removed = await syncService.removeSubscription('non-existent-id');
      expect(removed).toBe(false);

      // Create subscription with invalid event types
      const subscription = await syncService.createSubscription({
        userId: 'test-user',
        eventTypes: ['invalid_event_type']
      });

      expect(subscription).toBeDefined();
      expect(subscription.eventTypes).toContain('invalid_event_type');

      await syncService.removeSubscription(subscription.id);
    });

    test('should handle malformed event data', async () => {
      const subscription = await syncService.createSubscription({
        userId: 'test-user',
        eventTypes: ['session_updated']
      });

      // Event with missing required fields should still be created
      const event = await syncService.publishEvent({
        type: 'session_updated',
        sessionId: '',
        userId: 'test-user',
        data: null
      });

      expect(event).toBeDefined();
      expect(event.version).toBeGreaterThan(0);

      await syncService.removeSubscription(subscription.id);
    });

    test('should handle encryption errors gracefully', async () => {
      const invalidPassword = '';
      const testData = 'Test data';

      // Should handle empty password
      expect(() => encryptData(testData, invalidPassword)).not.toThrow();
    });

    test('should handle subscription cleanup', async () => {
      // Create multiple subscriptions
      const subscriptions = [];
      for (let i = 0; i < 5; i++) {
        const subscription = await syncService.createSubscription({
          userId: `cleanup-user-${i}`,
          eventTypes: ['session_updated']
        });
        subscriptions.push(subscription);
      }

      expect(syncService.getActiveSubscriptions()).toHaveLength(5);

      // Remove all subscriptions
      for (const subscription of subscriptions) {
        await syncService.removeSubscription(subscription.id);
      }

      expect(syncService.getActiveSubscriptions()).toHaveLength(0);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high-frequency events', async () => {
      const subscription = await syncService.createSubscription({
        userId: 'perf-user',
        eventTypes: ['session_updated']
      });

      const eventCount = 100;
      const startTime = Date.now();

      const events = [];
      for (let i = 0; i < eventCount; i++) {
        const event = await syncService.publishEvent({
          type: 'session_updated',
          sessionId: 'perf-session',
          userId: 'perf-user',
          data: { iteration: i, timestamp: Date.now() }
        });
        events.push(event);
      }

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / eventCount;

      expect(events).toHaveLength(eventCount);
      expect(averageTime).toBeLessThan(50); // Should average less than 50ms per event
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`High-frequency events: ${eventCount} events in ${totalTime}ms (avg: ${averageTime}ms)`);

      await syncService.removeSubscription(subscription.id);
    });

    test('should maintain consistent version numbers', async () => {
      const sessionId = 'version-test-session';

      // Mock Prisma to return sequential versions
      let currentVersion = 0;
      mockPrisma.workspaceSession.findUnique.mockImplementation(({ where }: any) => {
        return Promise.resolve({
          id: where.id,
          version: currentVersion++
        });
      });

      const events = [];

      // Create events from multiple users
      for (let i = 0; i < 20; i++) {
        const event = await syncService.publishEvent({
          type: 'session_updated',
          sessionId,
          userId: `user-${(i % 3) + 1}`, // Rotate between 3 users
          data: { iteration: i }
        });
        events.push(event);
      }

      // Verify all events have sequential versions
      const versions = events.map(e => e.version).sort((a, b) => a - b);
      for (let i = 1; i < versions.length; i++) {
        expect(versions[i]).toBe(versions[i - 1] + 1);
      }

      // Verify version starts from 1
      expect(versions[0]).toBe(1);
      expect(versions[versions.length - 1]).toBe(20);
    });

    test('should handle memory efficiently', async () => {
      const initialMemory = process.memoryUsage();

      // Create many subscriptions and events
      const subscriptions = [];
      for (let i = 0; i < 10; i++) {
        const subscription = await syncService.createSubscription({
          userId: `memory-user-${i}`,
          eventTypes: ['session_updated', 'checkpoint_created']
        });
        subscriptions.push(subscription);
      }

      // Create many events
      for (let i = 0; i < 50; i++) {
        await syncService.publishEvent({
          type: i % 2 === 0 ? 'session_updated' : 'checkpoint_created',
          sessionId: 'memory-session',
          userId: `memory-user-${i % 10}`,
          data: { largeData: 'x'.repeat(1000) } // 1KB per event
        });
      }

      const afterCreationMemory = process.memoryUsage();

      // Cleanup
      for (const subscription of subscriptions) {
        await syncService.removeSubscription(subscription.id);
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterCleanupMemory = process.memoryUsage();

      // Memory usage should not grow excessively
      const memoryIncrease = afterCreationMemory.heapUsed - initialMemory.heapUsed;
      const memoryAfterCleanup = afterCleanupMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024)}KB`);
      console.log(`Memory after cleanup: ${Math.round(memoryAfterCleanup / 1024)}KB`);

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });
});