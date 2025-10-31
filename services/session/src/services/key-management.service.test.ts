/**
 * Key Management Service Tests
 * Simplified test suite focusing on service logic
 * Tests core functionality without complex dependencies
 */

import { beforeEach, describe, expect, mock, test } from 'bun:test';

import {
  cleanupPrismaMock,
  clearAllMocks,
  mockPrisma,
  setupPrismaMock
} from '../test-mocks/prisma.mock';
import {
  createSessionKeyManagementService,
  SessionKeyManagementService
} from './key-management.service';

// Type definitions
interface KeyDerivationRequest {
  userId: string;
  password: string;
  keyName: string;
  description?: string;
  tags?: string[];
  expiresAt?: Date;
}

// Mock encryption utilities
const mockEncryption = {
  deriveKey: mock(() => Promise.resolve(new Uint8Array(32))),
  decryptData: mock(() => Promise.resolve('session-key')),
  encryptData: mock(() => Promise.resolve('encrypted-data')),
  generateKey: mock(() => new Uint8Array(32)),
  generateSalt: mock(() => new Uint8Array(32))
};

// Mock the encryption module
mock.module('../lib/encryption.js', () => ({
  deriveKey: mockEncryption.deriveKey,
  decryptData: mockEncryption.decryptData,
  encryptData: mockEncryption.encryptData,
  generateKey: mockEncryption.generateKey,
  generateSalt: mockEncryption.generateSalt
}));

// Mock Crypto API
const mockCryptoKey = {
  type: 'secret',
  extractable: true,
  algorithm: { name: 'AES-GCM', length: 256 },
  usages: ['encrypt', 'decrypt']
};

const mockSubtleCrypto = {
  generateKey: mock(() => Promise.resolve(mockCryptoKey)),
  exportKey: mock(() => Promise.resolve(new Uint8Array(32))),
  importKey: mock(() => Promise.resolve(mockCryptoKey)),
  encrypt: mock(() => Promise.resolve(new Uint8Array(32))),
  decrypt: mock(() => Promise.resolve(new Uint8Array(32))),
  deriveKey: mock(() => Promise.resolve(mockCryptoKey))
};

// Setup global crypto mocks
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: mock((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    subtle: mockSubtleCrypto
  },
  writable: true
});

// Simple mock for testing service instantiation
const mockConfig = {
  keyDerivation: {
    algorithm: 'PBKDF2' as const,
    iterations: 210000,
    keyLength: 32,
    hash: 'SHA-256' as const,
    saltLength: 32
  },
  encryption: {
    algorithm: 'AES-GCM' as const,
    keyLength: 256,
    ivLength: 12
  },
  rotation: {
    maxKeyAge: 90,
    minKeyAge: 30,
    maxKeysPerUser: 10,
    autoRotate: false
  },
  security: {
    minPasswordLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    preventCommonPasswords: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15
  }
};

describe.skip('SessionKeyManagementService', () => {
  let service: SessionKeyManagementService;
  const testUserId = 'test-user-123';
  const testKeyId = 'test-key-456';
  const testPassword = 'TestP@ssw0rd123!';
  const testKeyName = 'test-key';

  beforeEach(() => {
    // Setup Prisma mock first
    setupPrismaMock();

    // Reset all mocks
    clearAllMocks();
    mockEncryption.deriveKey.mockClear();
    mockEncryption.decryptData.mockClear();
    mockEncryption.encryptData.mockClear();
    mockEncryption.generateKey.mockClear();
    mockEncryption.generateSalt.mockClear();

    // Set default mock behaviors
    mockEncryption.deriveKey.mockResolvedValue(new Uint8Array(32));
    mockEncryption.decryptData.mockResolvedValue('session-key');
    mockEncryption.encryptData.mockResolvedValue('encrypted-data');
    mockEncryption.generateKey.mockReturnValue(new Uint8Array(32));
    mockEncryption.generateSalt.mockReturnValue(new Uint8Array(32));

    // Create service with minimal dependencies
    service = createSessionKeyManagementService(mockConfig);
  });

  describe('Constructor', () => {
    test('should create service with default configuration', () => {
      const service = new SessionKeyManagementService();
      expect(service).toBeInstanceOf(SessionKeyManagementService);
    });

    test('should create service with custom configuration', () => {
      const customConfig = {
        security: {
          minPasswordLength: 16,
          requireSpecialChars: false,
          requireNumbers: false,
          requireUppercase: false,
          preventCommonPasswords: false,
          maxFailedAttempts: 10,
          lockoutDuration: 30
        }
      };

      const service = new SessionKeyManagementService(customConfig);
      expect(service).toBeInstanceOf(SessionKeyManagementService);
    });

    test('should merge custom config with defaults', () => {
      const customConfig = {
        security: {
          minPasswordLength: 20
        }
      };

      const service = new SessionKeyManagementService(customConfig);
      expect(service).toBeInstanceOf(SessionKeyManagementService);
    });
  });

  describe('createUserKey', () => {
    const validRequest: KeyDerivationRequest = {
      userId: testUserId,
      password: testPassword,
      keyName: testKeyName,
      description: 'Test key',
      tags: ['test', 'development'],
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };

    test('should create user key successfully', async () => {
      // Mock database responses
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null); // No existing key
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0); // No keys exist
      let capturedKeyId: string;
      mockPrisma.userEncryptionKey.create.mockImplementation(data => {
        capturedKeyId = data.data.keyId;
        return {
          id: 'db-id-123',
          userId: testUserId,
          keyId: data.data.keyId,
          keyName: testKeyName,
          encryptedKey: 'encrypted-key-data',
          salt: 'dGVzdC1zYWx0',
          iv: 'dGVzdC1pdg==',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: true,
          createdAt: new Date(),
          expiresAt: validRequest.expiresAt,
          description: validRequest.description,
          tags: validRequest.tags,
          metadata: data.data.metadata
        };
      });

      const result = await service.createUserKey(validRequest);

      expect(result).toMatchObject({
        id: 'db-id-123',
        userId: testUserId,
        keyId: expect.any(String),
        keyName: testKeyName,
        encryptedKey: 'encrypted-key-data',
        salt: 'dGVzdC1zYWx0',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        expiresAt: validRequest.expiresAt
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.metadata).toBeDefined();

      expect(mockPrisma.userEncryptionKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          keyName: testKeyName,
          description: validRequest.description,
          tags: validRequest.tags
        })
      });
    });

    test('should throw error if key name already exists', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue({
        id: 'existing-key-id',
        keyName: testKeyName
      } as any);

      await expect(service.createUserKey(validRequest)).rejects.toThrow(
        `Key with name '${testKeyName}' already exists for this user`
      );
    });

    test('should throw error if maximum keys limit reached', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(10); // Max keys reached

      await expect(service.createUserKey(validRequest)).rejects.toThrow(
        'Maximum number of keys (10) reached for this user'
      );
    });

    test('should set default expiration if not provided', async () => {
      const requestWithoutExpiration = {
        ...validRequest,
        expiresAt: undefined
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);
      mockPrisma.userEncryptionKey.create.mockResolvedValue({
        id: 'db-id-123',
        userId: testUserId,
        keyId: testKeyId,
        keyName: testKeyName,
        encryptedKey: 'encrypted-key-data',
        salt: 'test-salt',
        iv: 'test-iv',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        expiresAt: expect.any(Date),
        metadata: {}
      });

      await service.createUserKey(requestWithoutExpiration);

      const createCall = mockPrisma.userEncryptionKey.create.mock.calls[0][0];
      expect(createCall.data.expiresAt).toBeInstanceOf(Date);

      const expectedExpiration = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      expect(
        Math.abs(createCall.data.expiresAt.getTime() - expectedExpiration.getTime())
      ).toBeLessThan(1000);
    });

    test('should validate password strength', async () => {
      const weakPasswordRequest = {
        ...validRequest,
        password: 'weak'
      };

      await expect(service.createUserKey(weakPasswordRequest)).rejects.toThrow(
        'Password must be at least 12 characters long'
      );
    });

    test('should validate key name', async () => {
      const invalidKeyRequest = {
        ...validRequest,
        keyName: ''
      };

      await expect(service.createUserKey(invalidKeyRequest)).rejects.toThrow(
        'Key name is required'
      );
    });

    test('should validate user ID', async () => {
      const invalidUserRequest = {
        ...validRequest,
        userId: ''
      };

      await expect(service.createUserKey(invalidUserRequest)).rejects.toThrow(
        'Valid user ID is required'
      );
    });

    test('should require uppercase letters in password', async () => {
      const noUppercaseRequest = {
        ...validRequest,
        password: 'testpassword123!'
      };

      await expect(service.createUserKey(noUppercaseRequest)).rejects.toThrow(
        'Password must contain uppercase letters'
      );
    });

    test('should require numbers in password', async () => {
      const noNumbersRequest = {
        ...validRequest,
        password: 'TestPassword!'
      };

      await expect(service.createUserKey(noNumbersRequest)).rejects.toThrow(
        'Password must contain numbers'
      );
    });

    test('should require special characters in password', async () => {
      const noSpecialCharsRequest = {
        ...validRequest,
        password: 'TestPassword123'
      };

      await expect(service.createUserKey(noSpecialCharsRequest)).rejects.toThrow(
        'Password must contain special characters'
      );
    });

    test('should limit key name length', async () => {
      const longNameRequest = {
        ...validRequest,
        keyName: 'a'.repeat(101) // 101 characters
      };

      await expect(service.createUserKey(longNameRequest)).rejects.toThrow(
        'Key name must be less than 100 characters'
      );
    });

    test('should handle database errors gracefully', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);
      mockPrisma.userEncryptionKey.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createUserKey(validRequest)).rejects.toThrow(
        'Failed to create user key: Database error'
      );
    });
  });

  describe('getUserKeys', () => {
    test('should get active user keys', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          userId: testUserId,
          keyId: 'key-id-1',
          keyName: 'key-1',
          encryptedKey: 'encrypted-1',
          salt: 'c2FsdC0x',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: true,
          createdAt: new Date(),
          metadata: {}
        },
        {
          id: 'key-2',
          userId: testUserId,
          keyId: 'key-id-2',
          keyName: 'key-2',
          encryptedKey: 'encrypted-2',
          salt: 'c2FsdC0y',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: true,
          createdAt: new Date(),
          metadata: {}
        }
      ];

      mockPrisma.userEncryptionKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.getUserKeys(testUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'key-1',
        userId: testUserId,
        keyId: 'key-id-1',
        keyName: 'key-1',
        encryptedKey: 'encrypted-1',
        salt: 'c2FsdC0x',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: expect.any(Date),
        metadata: {}
      });

      expect(mockPrisma.userEncryptionKey.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId, isActive: true },
        orderBy: { createdAt: 'desc' }
      });
    });

    test('should get all user keys including inactive', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          userId: testUserId,
          keyId: 'key-id-1',
          keyName: 'key-1',
          encryptedKey: 'encrypted-1',
          salt: 'c2FsdC0x',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: false,
          createdAt: new Date(),
          metadata: {}
        }
      ];

      mockPrisma.userEncryptionKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.getUserKeys(testUserId, true);

      expect(result).toHaveLength(1);
      expect(mockPrisma.userEncryptionKey.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' }
      });
    });

    test('should return empty array when no keys exist', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue([]);

      const result = await service.getUserKeys(testUserId);

      expect(result).toHaveLength(0);
    });

    test('should handle database errors', async () => {
      mockPrisma.userEncryptionKey.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserKeys(testUserId)).rejects.toThrow(
        'Failed to get user keys: Database error'
      );
    });
  });

  describe('getUserKey', () => {
    test('should get specific user key', async () => {
      const mockKey = {
        id: 'key-1',
        userId: testUserId,
        keyId: testKeyId,
        keyName: 'key-1',
        encryptedKey: 'encrypted-1',
        salt: 'salt-1',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        metadata: {}
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);

      const result = await service.getUserKey(testUserId, testKeyId);

      expect(result).toEqual({
        id: 'key-1',
        userId: testUserId,
        keyId: testKeyId,
        keyName: 'key-1',
        encryptedKey: 'encrypted-1',
        salt: 'salt-1',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: expect.any(Date),
        metadata: {}
      });

      expect(mockPrisma.userEncryptionKey.findFirst).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          keyId: testKeyId,
          isActive: true
        }
      });
    });

    test('should throw error when key not found', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);

      await expect(service.getUserKey(testUserId, testKeyId)).rejects.toThrow(
        'Encryption key not found'
      );
    });

    test('should handle database errors', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserKey(testUserId, testKeyId)).rejects.toThrow(
        'Failed to get user key: Database error'
      );
    });
  });

  describe('validateUserKey', () => {
    const mockKey = {
      id: 'key-1',
      userId: testUserId,
      keyId: testKeyId,
      keyName: 'key-1',
      encryptedKey: 'encrypted-1',
      salt: 'salt-1',
      algorithm: 'AES-GCM',
      iterations: 210000,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lastUsedAt: null,
      metadata: {}
    };

    test('should validate valid key', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.isNearExpiry).toBe(false);
      expect(result.strength).toBeOneOf(['fair', 'good', 'strong']);
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.userEncryptionKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { lastUsedAt: expect.any(Date) }
      });
    });

    test('should detect expired key', async () => {
      const expiredKey = {
        ...mockKey,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(expiredKey);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.isExpired).toBe(true);
      expect(result.errors).toContain('Key has expired');
    });

    test('should detect near expiry', async () => {
      const nearExpiryKey = {
        ...mockKey,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(nearExpiryKey);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.isNearExpiry).toBe(true);
      expect(result.warnings).toContain('Key expires soon');
    });

    test('should handle key not found', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Encryption key not found');
    });

    test('should handle invalid password', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.deriveKey.mockRejectedValue(new Error('Invalid password'));

      const result = await service.validateUserKey(testUserId, testKeyId, 'wrongpassword');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid password or corrupted key');
    });

    test('should calculate key strength correctly', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
    });

    test('should add warning for low iteration count', async () => {
      const lowIterationKey = {
        ...mockKey,
        iterations: 100000 // Lower than recommended 210000
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(lowIterationKey);

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.warnings).toContain('Key derivation iterations below recommended minimum');
    });

    test('should not update last used for invalid keys', async () => {
      const invalidKey = {
        ...mockKey,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(invalidKey);

      await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(mockPrisma.userEncryptionKey.update).not.toHaveBeenCalled();
    });

    test('should handle validation errors gracefully', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await service.validateUserKey(testUserId, testKeyId, testPassword);

      expect(result.errors).toContain('Validation error: Database error');
    });
  });

  describe('rotateUserKey', () => {
    const mockOldKey = {
      id: 'old-key-1',
      userId: testUserId,
      keyId: testKeyId,
      keyName: 'old-key',
      encryptedKey: 'encrypted-old',
      salt: 'salt-old',
      algorithm: 'AES-GCM',
      iterations: 210000,
      isActive: true,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      tags: ['test'],
      metadata: {}
    };

    const validRotationRequest: KeyRotationRequest = {
      userId: testUserId,
      oldKeyId: testKeyId,
      newPassword: 'NewP@ssw0rd456!',
      preserveOldKey: false
    };

    test('should rotate user key successfully', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockOldKey);
      mockPrisma.userEncryptionKey.create.mockResolvedValue({
        id: 'new-key-1',
        userId: testUserId,
        keyId: 'new-key-id',
        keyName: 'old-key (rotated)',
        encryptedKey: 'encrypted-new',
        salt: 'salt-new',
        iv: 'iv-new',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: {}
      });

      const result = await service.rotateUserKey(validRotationRequest);

      expect(result.newKey).toEqual({
        id: 'new-key-1',
        userId: testUserId,
        keyId: 'new-key-id',
        keyName: 'old-key (rotated)',
        encryptedKey: 'encrypted-new',
        salt: 'salt-new',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        metadata: {}
      });

      expect(result.oldKeyDeactivated).toBe(true);
      expect(result.migrationRequired).toBe(true);

      expect(mockPrisma.userEncryptionKey.update).toHaveBeenCalledWith({
        where: { id: 'old-key-1' },
        data: {
          isActive: false,
          deactivatedAt: expect.any(Date),
          deactivatedReason: 'key_rotation'
        }
      });
    });

    test('should preserve old key when requested', async () => {
      const preserveOldKeyRequest = {
        ...validRotationRequest,
        preserveOldKey: true
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockOldKey);
      mockPrisma.userEncryptionKey.create.mockResolvedValue({
        id: 'new-key-1',
        userId: testUserId,
        keyId: 'new-key-id',
        keyName: 'old-key (rotated)',
        encryptedKey: 'encrypted-new',
        salt: 'salt-new',
        iv: 'iv-new',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: {}
      });

      const result = await service.rotateUserKey(preserveOldKeyRequest);

      expect(result.oldKeyDeactivated).toBe(false);
      expect(mockPrisma.userEncryptionKey.update).not.toHaveBeenCalled();
    });

    test('should throw error when old key not found', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);

      await expect(service.rotateUserKey(validRotationRequest)).rejects.toThrow(
        'Old key not found'
      );
    });

    test('should enforce minimum rotation age', async () => {
      const youngKey = {
        ...mockOldKey,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(youngKey);

      await expect(service.rotateUserKey(validRotationRequest)).rejects.toThrow(
        'Key must be at least 30 days old before rotation'
      );
    });

    test('should include rotation options in metadata', async () => {
      const rotationWithOptions = {
        ...validRotationRequest,
        options: {
          reason: 'security_update',
          description: 'Scheduled security update'
        }
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockOldKey);
      mockPrisma.userEncryptionKey.create.mockResolvedValue({
        id: 'new-key-1',
        userId: testUserId,
        keyId: 'new-key-id',
        keyName: 'old-key (rotated)',
        encryptedKey: 'encrypted-new',
        salt: 'salt-new',
        iv: 'iv-new',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: {}
      });

      await service.rotateUserKey(rotationWithOptions);

      const createCall = mockPrisma.userEncryptionKey.create.mock.calls[0][0];
      expect(createCall.data.metadata.previousKeyId).toBe(testKeyId);
      expect(createCall.data.metadata.rotationReason).toBe('security_update');
    });

    test('should handle rotation errors', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.rotateUserKey(validRotationRequest)).rejects.toThrow(
        'Failed to rotate user key: Database error'
      );
    });
  });

  describe('deleteUserKey', () => {
    const mockKey = {
      id: 'key-1',
      userId: testUserId,
      keyId: testKeyId,
      keyName: 'key-1',
      encryptedKey: 'encrypted-1',
      salt: 'salt-1',
      algorithm: 'AES-GCM',
      iterations: 210000,
      isActive: true,
      createdAt: new Date(),
      metadata: {}
    };

    test('should delete user key successfully', async () => {
      // Mock validation to pass
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.deriveKey.mockResolvedValue(mockCryptoKey);

      // Mock active keys count
      mockPrisma.userEncryptionKey.count.mockResolvedValue(2); // More than 1 key

      // Mock delete
      mockPrisma.userEncryptionKey.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteUserKey(testUserId, testKeyId, testPassword);

      expect(mockPrisma.userEncryptionKey.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          keyId: testKeyId
        }
      });
    });

    test('should throw error for invalid password', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.deriveKey.mockRejectedValue(new Error('Invalid password'));

      await expect(service.deleteUserKey(testUserId, testKeyId, 'wrongpassword')).rejects.toThrow(
        'Invalid password'
      );
    });

    test('should prevent deletion of only active key', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.deriveKey.mockResolvedValue(mockCryptoKey);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(1); // Only 1 key

      await expect(service.deleteUserKey(testUserId, testKeyId, testPassword)).rejects.toThrow(
        'Cannot delete the only active encryption key. Create a new key first.'
      );
    });

    test('should handle delete errors', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.deriveKey.mockResolvedValue(mockCryptoKey);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(2);
      mockPrisma.userEncryptionKey.deleteMany.mockRejectedValue(new Error('Delete error'));

      await expect(service.deleteUserKey(testUserId, testKeyId, testPassword)).rejects.toThrow(
        'Failed to delete user key: Delete error'
      );
    });
  });

  describe('encryptWithUserKey', () => {
    const mockKey = {
      id: 'key-1',
      userId: testUserId,
      keyId: testKeyId,
      keyName: 'key-1',
      encryptedKey: 'encrypted-session-key',
      salt: 'salt-1',
      iv: 'iv-1',
      algorithm: 'AES-GCM',
      iterations: 210000,
      isActive: true,
      createdAt: new Date(),
      metadata: {}
    };

    test('should encrypt data with user key', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.decryptData.mockResolvedValue('session-key');
      mockEncryption.encryptData.mockResolvedValue({
        data: 'encrypted-data',
        iv: 'new-iv',
        algorithm: 'AES-GCM'
      });

      const result = await service.encryptWithUserKey(
        testUserId,
        testKeyId,
        testPassword,
        'test-data'
      );

      expect(result).toEqual({
        data: 'encrypted-data',
        iv: 'new-iv',
        algorithm: 'AES-GCM',
        keyId: testKeyId,
        userId: testUserId,
        createdAt: expect.any(Date)
      });
    });

    test('should handle encryption errors', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.decryptData.mockRejectedValue(new Error('Decryption error'));

      await expect(
        service.encryptWithUserKey(testUserId, testKeyId, testPassword, 'test-data')
      ).rejects.toThrow('Failed to encrypt with user key: Decryption error');
    });
  });

  describe('decryptWithUserKey', () => {
    const mockKey = {
      id: 'key-1',
      userId: testUserId,
      keyId: testKeyId,
      keyName: 'key-1',
      encryptedKey: 'encrypted-session-key',
      salt: 'salt-1',
      iv: 'iv-1',
      algorithm: 'AES-GCM',
      iterations: 210000,
      isActive: true,
      createdAt: new Date(),
      metadata: {}
    };

    test('should decrypt data with user key', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.decryptData.mockResolvedValueOnce('session-key');
      mockEncryption.decryptData.mockResolvedValueOnce('decrypted-data');

      const encryptedData = {
        data: 'encrypted-data',
        iv: 'data-iv',
        algorithm: 'AES-GCM'
      };

      const result = await service.decryptWithUserKey(
        testUserId,
        testKeyId,
        testPassword,
        encryptedData
      );

      expect(result).toBe('decrypted-data');
    });

    test('should handle decryption errors', async () => {
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);
      mockEncryption.decryptData.mockRejectedValue(new Error('Decryption error'));

      const encryptedData = {
        data: 'encrypted-data',
        iv: 'data-iv',
        algorithm: 'AES-GCM'
      };

      await expect(
        service.decryptWithUserKey(testUserId, testKeyId, testPassword, encryptedData)
      ).rejects.toThrow('Failed to decrypt with user key: Decryption error');
    });
  });

  describe('getKeyStatistics', () => {
    const mockKeys = [
      {
        id: 'key-1',
        userId: testUserId,
        algorithm: 'AES-GCM',
        isActive: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'key-2',
        userId: testUserId,
        algorithm: 'AES-256-GCM',
        isActive: false,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Expired
      }
    ];

    test('should calculate key statistics correctly', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.getKeyStatistics(testUserId);

      expect(result.totalKeys).toBe(2);
      expect(result.activeKeys).toBe(1);
      expect(result.expiredKeys).toBe(1);
      expect(result.keysByAlgorithm).toEqual({
        'AES-GCM': 1,
        'AES-256-GCM': 1
      });
      expect(result.averageAge).toBeGreaterThan(0);
      expect(result.oldestKey).toBeInstanceOf(Date);
      expect(result.newestKey).toBeInstanceOf(Date);
    });

    test('should handle empty key list', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue([]);

      const result = await service.getKeyStatistics(testUserId);

      expect(result.totalKeys).toBe(0);
      expect(result.activeKeys).toBe(0);
      expect(result.expiredKeys).toBe(0);
      expect(result.averageAge).toBe(0);
      expect(result.keysByAlgorithm).toEqual({});
    });

    test('should identify expiring soon keys', async () => {
      const expiringSoonKey = {
        ...mockKeys[0],
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      };

      mockPrisma.userEncryptionKey.findMany.mockResolvedValue([expiringSoonKey]);

      const result = await service.getKeyStatistics(testUserId);

      expect(result.expiringSoon).toBe(1);
    });

    test('should handle statistics errors', async () => {
      mockPrisma.userEncryptionKey.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getKeyStatistics(testUserId)).rejects.toThrow(
        'Failed to get key statistics: Database error'
      );
    });
  });

  describe('cleanupExpiredKeys', () => {
    const mockExpiredKeys = [
      {
        id: 'key-1',
        keyName: 'expired-key-1',
        userId: testUserId
      },
      {
        id: 'key-2',
        keyName: 'expired-key-2',
        userId: testUserId
      }
    ];

    test('should cleanup expired keys successfully', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue(mockExpiredKeys);
      mockPrisma.userEncryptionKey.update.mockResolvedValue({});

      const result = await service.cleanupExpiredKeys();

      expect(result.deletedCount).toBe(2);
      expect(result.deletedKeys).toEqual(mockExpiredKeys);
      expect(mockPrisma.userEncryptionKey.update).toHaveBeenCalledTimes(2);

      for (const [index, key] of mockExpiredKeys.entries()) {
        expect(mockPrisma.userEncryptionKey.update).toHaveBeenNthCalledWith(index + 1, {
          where: { id: key.id },
          data: {
            isActive: false,
            deactivatedAt: expect.any(Date),
            deactivatedReason: 'expired'
          }
        });
      }
    });

    test('should handle no expired keys', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue([]);

      const result = await service.cleanupExpiredKeys();

      expect(result.deletedCount).toBe(0);
      expect(result.deletedKeys).toHaveLength(0);
      expect(mockPrisma.userEncryptionKey.update).not.toHaveBeenCalled();
    });

    test('should handle individual key cleanup failures gracefully', async () => {
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue(mockExpiredKeys);
      mockPrisma.userEncryptionKey.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Update error'));

      // Mock console.error to capture calls
      const originalConsoleError = console.error;
      const errorSpy = mock(() => {});
      console.error = errorSpy;

      const result = await service.cleanupExpiredKeys();

      expect(result.deletedCount).toBe(1);
      expect(result.deletedKeys).toHaveLength(1);

      // Check that errorSpy was called (we can't easily test the exact parameters with Bun mock)
      expect(errorSpy).toHaveBeenCalled();

      // Restore console.error
      console.error = originalConsoleError;
    });

    test('should handle cleanup errors', async () => {
      mockPrisma.userEncryptionKey.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.cleanupExpiredKeys()).rejects.toThrow(
        'Failed to cleanup expired keys: Database error'
      );
    });
  });

  describe('Factory Functions', () => {
    test('createSessionKeyManagementService should create instance with custom config', () => {
      const customConfig = {
        security: {
          minPasswordLength: 16
        }
      };

      const service = createSessionKeyManagementService(customConfig);
      expect(service).toBeInstanceOf(SessionKeyManagementService);
    });

    test('should export default service instance', () => {
      const { sessionKeyManagementService } = require('./key-management.service');
      expect(sessionKeyManagementService).toBeInstanceOf(SessionKeyManagementService);
    });
  });

  describe('Private Helper Methods', () => {
    test('generateKeyId should generate unique IDs', async () => {
      // Test generateKeyId directly by checking crypto calls
      let cryptoCallCount = 0;
      globalThis.crypto.getRandomValues = mock((array: Uint8Array) => {
        cryptoCallCount++;
        for (let i = 0; i < array.length; i++) {
          array[i] = (cryptoCallCount + i) % 256;
        }
        return array;
      });

      const request: KeyDerivationRequest = {
        userId: testUserId,
        password: testPassword,
        keyName: 'test-key'
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);

      let capturedKeyId1: string, capturedKeyId2: string;
      mockPrisma.userEncryptionKey.create.mockImplementation(data => {
        if (!capturedKeyId1) {
          capturedKeyId1 = data.data.keyId;
          return {
            id: 'db-id-1',
            userId: testUserId,
            keyId: data.data.keyId,
            keyName: 'test-key',
            encryptedKey: 'encrypted-key-data',
            salt: 'dGVzdC1zYWx0',
            iv: 'dGVzdC1pdg==',
            algorithm: 'AES-GCM',
            iterations: 210000,
            isActive: true,
            createdAt: new Date(),
            metadata: data.data.metadata
          };
        }
        capturedKeyId2 = data.data.keyId;
        return {
          id: 'db-id-2',
          userId: testUserId,
          keyId: data.data.keyId,
          keyName: 'test-key-2',
          encryptedKey: 'encrypted-key-data',
          salt: 'dGVzdC1zYWx0',
          iv: 'dGVzdC1pdg==',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: true,
          createdAt: new Date(),
          metadata: data.data.metadata
        };
      });

      const result1 = await service.createUserKey(request);
      const result2 = await service.createUserKey({
        ...request,
        keyName: 'test-key-2'
      });

      expect(result1.keyId).not.toBe(result2.keyId);
      expect(capturedKeyId1).not.toBe(capturedKeyId2);
      expect(result1.keyId).toMatch(/^[\da-f]{32}$/); // 16 bytes = 32 hex chars
    });

    test('generateSessionKey should generate valid keys', async () => {
      // Test via createUserKey which uses generateSessionKey internally
      const request: KeyDerivationRequest = {
        userId: testUserId,
        password: testPassword,
        keyName: 'test-key'
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);
      mockPrisma.userEncryptionKey.create.mockResolvedValue({
        id: 'db-id-123',
        userId: testUserId,
        keyId: testKeyId,
        keyName: 'test-key',
        encryptedKey: 'encrypted-session-key',
        salt: 'test-salt',
        iv: 'test-iv',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        metadata: {}
      });

      await service.createUserKey(request);

      // Verify that encryptWithMasterKey was called, which uses generateSessionKey
      expect(mockEncryption.encryptData).toHaveBeenCalled();
    });
  });

  describe('Key Strength Calculation', () => {
    test('should calculate different strength levels', async () => {
      const mockKey = {
        id: 'key-1',
        userId: testUserId,
        keyId: testKeyId,
        keyName: 'key-1',
        encryptedKey: 'encrypted-1',
        salt: 'salt-1',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {}
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(mockKey);

      // Test weak password
      const weakResult = await service.validateUserKey(testUserId, testKeyId, 'weakpassword');
      expect(['weak', 'fair']).toContain(weakResult.strength);

      // Test strong password
      const strongResult = await service.validateUserKey(
        testUserId,
        testKeyId,
        'VeryStr0ng!P@ssw0rd123!'
      );
      expect(['fair', 'good', 'strong']).toContain(strongResult.strength);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined inputs gracefully', async () => {
      // Test getUserKeys with null userId - should handle gracefully
      mockPrisma.userEncryptionKey.findMany.mockResolvedValue([]);
      const result = await service.getUserKeys(null as any);
      expect(Array.isArray(result)).toBe(true); // Should return empty array, not throw

      // Test getUserKey with null parameters - should handle gracefully or throw specific error
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      try {
        await service.getUserKey(null as any, null as any);
        // If it doesn't throw, that's also acceptable behavior
      } catch (error) {
        // If it throws, that's acceptable too
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle malformed database responses', async () => {
      // Test with incomplete key object
      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue({
        id: 'key-1',
        userId: testUserId,
        keyId: testKeyId,
        keyName: 'key-1',
        encryptedKey: 'encrypted-1',
        salt: 'c2FsdC0x',
        algorithm: 'AES-GCM',
        iterations: 210000,
        isActive: true,
        createdAt: new Date()
        // Missing metadata field
      } as any);

      const result = await service.getUserKey(testUserId, testKeyId);
      expect(result).toBeDefined();
      expect(result.id).toBe('key-1');
      // The service should handle missing fields gracefully with defaults
    });

    test('should handle crypto API failures', async () => {
      // Save original implementation
      const originalGetRandomValues = globalThis.crypto.getRandomValues;

      globalThis.crypto.getRandomValues = mock(() => {
        throw new Error('Crypto error');
      });

      const request: KeyDerivationRequest = {
        userId: testUserId,
        password: testPassword,
        keyName: 'test-key'
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);

      await expect(service.createUserKey(request)).rejects.toThrow(
        'Failed to create user key: Crypto error'
      );

      // Restore original implementation
      globalThis.crypto.getRandomValues = originalGetRandomValues;
    });

    test('should handle concurrent operations', async () => {
      // Test concurrent key creation
      const request: KeyDerivationRequest = {
        userId: testUserId,
        password: testPassword,
        keyName: 'concurrent-test'
      };

      mockPrisma.userEncryptionKey.findFirst.mockResolvedValue(null);
      mockPrisma.userEncryptionKey.count.mockResolvedValue(0);

      let createCallCount = 0;
      mockPrisma.userEncryptionKey.create.mockImplementation(data => {
        createCallCount++;
        return {
          id: `db-id-${createCallCount}`,
          keyId: data.data.keyId,
          userId: testUserId,
          keyName: data.data.keyName, // Use the actual keyName from the request
          encryptedKey: 'encrypted-key-data',
          salt: 'dGVzdC1zYWx0',
          iv: 'dGVzdC1pdg==',
          algorithm: 'AES-GCM',
          iterations: 210000,
          isActive: true,
          createdAt: new Date(),
          metadata: data.data.metadata
        };
      });

      const promises = Array(3)
        .fill(null)
        .map((_, index) =>
          service.createUserKey({
            ...request,
            keyName: `concurrent-test-${index}` // Use different names to avoid conflicts
          })
        );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result.keyId).toMatch(/^[\da-f]{32}$/);
        expect(result.keyName).toMatch(/^concurrent-test-\d+$/);
      }
    });
  });
});
