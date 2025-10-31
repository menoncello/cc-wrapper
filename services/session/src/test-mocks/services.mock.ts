/**
 * Mock Services for Testing
 * Provides consistent mocks for encryption, serialization, and other services
 */

import { mock } from 'bun:test';

// Mock encryption functions
export const mockEncryption = {
  encryptData: mock(),
  decryptData: mock(),
  generateChecksum: mock().mockResolvedValue('test-checksum'),
  verifyChecksum: mock().mockResolvedValue(true),
  generateSalt: mock().mockReturnValue('test-salt'),
  generateIV: mock().mockReturnValue('test-iv'),
  deriveKey: mock().mockResolvedValue('derived-key'),
};

// Mock serializer functions
const mockSerializerInstance = {
  serializeState: mock().mockReturnValue('serialized-state'),
  deserializeState: mock().mockImplementation((data, checksum, encryptionKey) => {
    // Return proper workspace state structure when called with encryption key
    if (encryptionKey) {
      return Promise.resolve({
        terminalState: [],
        browserTabs: [],
        aiConversations: [],
        openFiles: []
      });
    }
    return Promise.resolve({ test: 'data' });
  }),
  compressState: mock().mockResolvedValue('compressed-state'),
  decompressState: mock().mockResolvedValue('decompressed-state'),
  encryptState: mock().mockResolvedValue('encrypted-state'),
  decryptState: mock().mockResolvedValue('decrypted-state'),
  generateChecksum: mock().mockResolvedValue('serializer-checksum'),
};

export const mockSerializer = {
  ...mockSerializerInstance,
  createSerializer: mock().mockReturnValue(mockSerializerInstance),
};

// Mock key management service
export const mockKeyManagementService = {
  createUserKey: mock().mockResolvedValue({
    keyId: 'test-key-id',
    keyName: 'test-key',
    userId: 'test-user',
    algorithm: 'AES-256-GCM',
    keySize: 256,
    createdAt: new Date(),
    expiresAt: new Date(),
    isActive: true,
    metadata: {}
  }),
  getUserKeys: mock().mockResolvedValue([]),
  getUserKey: mock().mockResolvedValue({
    keyId: 'test-key-id',
    keyName: 'test-key',
    userId: 'test-user',
    algorithm: 'AES-256-GCM',
    keySize: 256,
    createdAt: new Date(),
    expiresAt: new Date(),
    isActive: true,
    metadata: {}
  }),
  validateUserKey: mock().mockResolvedValue({
    isValid: true,
    isExpired: false,
    isNearExpiry: false,
    strength: 'strong',
    warnings: [],
    errors: []
  }),
  rotateUserKey: mock().mockResolvedValue({
    oldKeyId: 'old-key-id',
    newKeyId: 'new-key-id',
    rotationDate: new Date(),
    success: true
  }),
  deleteUserKey: mock().mockResolvedValue(true),
  getKeyStatistics: mock().mockResolvedValue({
    totalKeys: 1,
    activeKeys: 1,
    expiredKeys: 0,
    expiringSoon: 0
  }),
  cleanupExpiredKeys: mock().mockResolvedValue({
    cleanedKeys: 1,
    errors: []
  }),
  encryptWithUserKey: mock().mockResolvedValue({
    data: 'encrypted-data',
    iv: 'test-iv',
    algorithm: 'AES-GCM'
  }),
  decryptWithUserKey: mock().mockResolvedValue('decrypted-data'),
};

// Mock encryption service
export const mockEncryptionService = {
  encryptSessionData: mock().mockResolvedValue({
    encryptedData: 'encrypted-session-data',
    iv: 'test-iv',
    salt: 'test-salt',
    algorithm: 'AES-256-GCM',
    checksum: 'test-checksum'
  }),
  decryptSessionData: mock().mockResolvedValue('decrypted-session-data'),
  encryptBatch: mock().mockResolvedValue({
    items: [
      {
        id: 'item-1',
        encryptedData: 'encrypted-data-1',
        iv: 'test-iv-1',
        salt: 'test-salt-1'
      }
    ]
  }),
  decryptBatch: mock().mockResolvedValue({
    items: [
      {
        id: 'item-1',
        data: 'decrypted-data-1'
      }
    ]
  }),
  testEncryption: mock().mockResolvedValue({
    success: true,
    algorithm: 'AES-256-GCM',
    keySize: 256,
    encryptionTime: 100,
    decryptionTime: 50
  }),
  validateEncryptionParameters: mock().mockReturnValue({
    isValid: true,
    recommendedKeySize: 256,
    issues: []
  }),
  getEncryptionMetrics: mock().mockReturnValue(null),
  getEncryptionStats: mock().mockReturnValue({
    totalEncryptions: 0,
    totalDecryptions: 0,
    averageLatency: 0,
    throughputBytesPerSecond: 0
  }),
  resetEncryptionMetrics: mock(),
  updateMetrics: mock(),
};

// Mock integration service
export const mockIntegrationService = {
  createWorkspaceState: mock().mockResolvedValue({
    terminalState: [
      { id: '1', command: 'ls -la', output: 'file1.txt\nfile2.txt', timestamp: '2025-01-01T10:00:00Z' }
    ],
    browserTabs: [
      { url: 'https://example.com', title: 'Example', isActive: true }
    ],
    aiConversations: [
      { id: '1', messages: [], timestamp: '2025-01-01T10:00:00Z' }
    ],
    files: [
      { path: '/test/file.txt', content: 'test content', modified: '2025-01-01T10:00:00Z' }
    ],
    metadata: {
      version: '1.0',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    }
  }),
  getTerminalState: mock().mockResolvedValue({
    sessions: [],
    activeSession: null
  }),
  getBrowserState: mock().mockResolvedValue({
    tabs: [],
    activeTab: null
  }),
  getAIConversations: mock().mockResolvedValue({
    conversations: []
  }),
  getWorkspaceFiles: mock().mockResolvedValue({
    files: []
  }),
  getServiceHealth: mock().mockResolvedValue([
    {
      service: 'terminal',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 10
    },
    {
      service: 'browser',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 15
    },
    {
      service: 'ai',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 20
    }
  ]),
};

// Setup global service mocks
export const setupServiceMocks = () => {
  globalThis.encryptData = mockEncryption.encryptData;
  globalThis.decryptData = mockEncryption.decryptData;
  globalThis.generateChecksum = mockEncryption.generateChecksum;
  globalThis.verifyChecksum = mockEncryption.verifyChecksum;
  globalThis.createSerializer = mockSerializer.createSerializer;
};

// Cleanup service mocks
export const cleanupServiceMocks = () => {
  const keys = ['encryptData', 'decryptData', 'generateChecksum', 'verifyChecksum', 'createSerializer'];
  keys.forEach(key => {
    if (typeof globalThis[key as keyof typeof globalThis] !== 'undefined') {
      delete globalThis[key as keyof typeof globalThis];
    }
  });
};

// Helper to clear all service mocks
export const clearAllServiceMocks = () => {
  const clearMockGroup = (group: any) => {
    if (group && typeof group === 'object') {
      Object.values(group).forEach((method: any) => {
        if (method && typeof method.mockClear === 'function') {
          method.mockClear();
        }
      });
    }
  };

  clearMockGroup(mockEncryption);
  clearMockGroup(mockSerializer);
  clearMockGroup(mockKeyManagementService);
  clearMockGroup(mockEncryptionService);
  clearMockGroup(mockIntegrationService);
};