// Session key management service
// Handles user-controlled encryption keys, key rotation, and secure key derivation

import {
  decryptData,
  deriveKey,
  encryptData,
  generateChecksum,
  generateIV,
  generateSalt,
  verifyChecksum
} from '../lib/encryption.js';
import prisma from '../lib/prisma.js';
import type { EncryptionKey, KeyMetadata, KeyRotationOptions } from '../types/session.js';

// Key management configuration
const KEY_MANAGEMENT_CONFIG = {
  // PBKDF2 configuration for key derivation
  keyDerivation: {
    algorithm: 'PBKDF2' as const,
    iterations: 210000, // OWASP recommended minimum
    keyLength: 32, // 256 bits for AES-256
    hash: 'SHA-256' as const,
    saltLength: 32 // 256 bits
  },
  // AES encryption configuration
  encryption: {
    algorithm: 'AES-GCM' as const,
    keyLength: 256, // bits
    ivLength: 12 // 96 bits for GCM
  },
  // Key rotation policies
  rotation: {
    maxKeyAge: 90, // days
    minKeyAge: 30, // days
    maxKeysPerUser: 10,
    autoRotate: false
  },
  // Security policies
  security: {
    minPasswordLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    preventCommonPasswords: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15 // minutes
  }
};

/**
 * User encryption key information
 */
export interface UserEncryptionKey {
  id: string;
  userId: string;
  keyId: string;
  keyName: string;
  encryptedKey: string; // Master key encrypted with user password
  salt: string;
  algorithm: string;
  iterations: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  metadata: KeyMetadata;
}

/**
 * Key derivation request
 */
export interface KeyDerivationRequest {
  userId: string;
  password: string;
  keyName: string;
  description?: string;
  tags?: string[];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Key rotation request
 */
export interface KeyRotationRequest {
  userId: string;
  oldKeyId: string;
  newPassword?: string;
  options?: KeyRotationOptions;
  preserveOldKey?: boolean;
}

/**
 * Key validation result
 */
export interface KeyValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isNearExpiry: boolean;
  daysUntilExpiry?: number;
  keyId?: string;
  lastUsedAt?: Date;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  warnings: string[];
  errors: string[];
}

/**
 * Session key management service class
 */
export class SessionKeyManagementService {
  private config: typeof KEY_MANAGEMENT_CONFIG;

  /**
   *
   * @param config
   */
  constructor(config?: Partial<typeof KEY_MANAGEMENT_CONFIG>) {
    this.config = {
      ...KEY_MANAGEMENT_CONFIG,
      ...config
    };
  }

  /**
   * Create a new user encryption key derived from password
   * @param request
   */
  async createUserKey(request: KeyDerivationRequest): Promise<UserEncryptionKey> {
    try {
      // Validate input
      this.validateKeyDerivationRequest(request);

      // Check if key name already exists for user
      const existingKey = await prisma.userEncryptionKey.findFirst({
        where: {
          userId: request.userId,
          keyName: request.keyName,
          isActive: true
        }
      });

      if (existingKey) {
        throw new Error(`Key with name '${request.keyName}' already exists for this user`);
      }

      // Check user's existing keys count
      const keyCount = await prisma.userEncryptionKey.count({
        where: {
          userId: request.userId,
          isActive: true
        }
      });

      if (keyCount >= this.config.rotation.maxKeysPerUser) {
        throw new Error(`Maximum number of keys (${this.config.rotation.maxKeysPerUser}) reached for this user`);
      }

      // Generate salt for key derivation
      const salt = generateSalt();

      // Derive master key from password
      const masterKey = await this.deriveMasterKey(request.password, salt);

      // Generate a random key ID
      const keyId = this.generateKeyId();

      // Generate a random session key (this will be used for actual encryption)
      const sessionKey = this.generateSessionKey();

      // Encrypt the session key with the master key
      const encryptedSessionKey = await this.encryptWithMasterKey(sessionKey, masterKey);

      // Calculate expiration
      const expiresAt = request.expiresAt ||
        new Date(Date.now() + (this.config.rotation.maxKeyAge * 24 * 60 * 60 * 1000));

      // Store key metadata
      const keyMetadata: KeyMetadata = {
        keyId,
        algorithm: this.config.encryption.algorithm,
        keyLength: this.config.encryption.keyLength,
        ivLength: this.config.encryption.ivLength,
        derivationIterations: this.config.keyDerivation.iterations,
        derivationHash: this.config.keyDerivation.hash,
        createdAt: new Date().toISOString(),
        lastRotated: new Date().toISOString(),
        ...request.metadata
      };

      // Create database record
      const userKey = await prisma.userEncryptionKey.create({
        data: {
          userId: request.userId,
          keyId,
          keyName: request.keyName,
          encryptedKey: encryptedSessionKey.data,
          salt: salt,
          iv: encryptedSessionKey.iv,
          algorithm: this.config.encryption.algorithm,
          iterations: this.config.keyDerivation.iterations,
          isActive: true,
          createdAt: new Date(),
          expiresAt,
          description: request.description || null,
          tags: request.tags || [],
          metadata: keyMetadata
        }
      });

      return this.mapToUserEncryptionKey(userKey);
    } catch (error) {
      throw new Error(`Failed to create user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's encryption keys
   * @param userId
   * @param includeInactive
   */
  async getUserKeys(userId: string, includeInactive = false): Promise<UserEncryptionKey[]> {
    try {
      const where: any = { userId };
      if (!includeInactive) {
        where.isActive = true;
      }

      const keys = await prisma.userEncryptionKey.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return keys.map(key => this.mapToUserEncryptionKey(key));
    } catch (error) {
      throw new Error(`Failed to get user keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific user key by ID
   * @param userId
   * @param keyId
   */
  async getUserKey(userId: string, keyId: string): Promise<UserEncryptionKey> {
    try {
      const key = await prisma.userEncryptionKey.findFirst({
        where: {
          userId,
          keyId,
          isActive: true
        }
      });

      if (!key) {
        throw new Error('Encryption key not found');
      }

      return this.mapToUserEncryptionKey(key);
    } catch (error) {
      throw new Error(`Failed to get user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get key information by ID
   * @param keyId
   * @param userId
   */
  async getKeyInfo(keyId: string, userId: string): Promise<UserEncryptionKey | null> {
    try {
      const key = await prisma.userEncryptionKey.findFirst({
        where: {
          keyId,
          userId,
          isActive: true
        }
      });

      return key ? this.mapToUserEncryptionKey(key) : null;
    } catch (error) {
      throw new Error(`Failed to get key info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate user key
   * @param userId
   * @param keyId
   * @param password
   */
  async validateUserKey(userId: string, keyId: string, password: string): Promise<KeyValidationResult> {
    const result: KeyValidationResult = {
      isValid: false,
      isExpired: false,
      isNearExpiry: false,
      strength: 'weak',
      warnings: [],
      errors: []
    };

    try {
      const key = await prisma.userEncryptionKey.findFirst({
        where: {
          userId,
          keyId,
          isActive: true
        }
      });

      if (!key) {
        result.errors.push('Encryption key not found');
        return result;
      }

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(key.expiresAt!);

      if (now > expiresAt) {
        result.isExpired = true;
        result.errors.push('Key has expired');
      }

      // Check near expiry (within 7 days)
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      if (expiresAt <= sevenDaysFromNow && !result.isExpired) {
        result.isNearExpiry = true;
        result.warnings.push('Key expires soon');
      }

      // Try to derive master key and decrypt session key to validate password
      try {
        const masterKey = await this.deriveMasterKey(password, key.salt);

        // Try to decrypt the stored session key to verify the password is correct
        const keyData = {
          data: key.encryptedKey,
          iv: key.iv || '',
          algorithm: key.algorithm,
          salt: key.salt
        };

        await decryptData(keyData, masterKey);
        result.isValid = true;
      } catch {
        result.errors.push('Invalid password or corrupted key');
      }

      // Add key metadata to result
      result.keyId = key.keyId;
      result.lastUsedAt = key.lastUsedAt;

      // Calculate key strength
      result.strength = this.calculateKeyStrength(password, key.iterations);

      // Add recommendations
      if (key.iterations < this.config.keyDerivation.iterations) {
        result.warnings.push('Key derivation iterations below recommended minimum');
      }

      if (result.isValid && !result.isExpired) {
        // Update last used timestamp
        await prisma.userEncryptionKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() }
        });
        result.lastUsedAt = new Date();
      }

      return result;
    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Rotate user key
   * @param request
   */
  async rotateUserKey(request: KeyRotationRequest): Promise<{
    newKey: UserEncryptionKey;
    oldKeyDeactivated: boolean;
    migrationRequired: boolean;
  }> {
    try {
      // Get the old key
      const oldKey = await prisma.userEncryptionKey.findFirst({
        where: {
          userId: request.userId,
          keyId: request.oldKeyId,
          isActive: true
        }
      });

      if (!oldKey) {
        throw new Error('Old key not found');
      }

      // Check if key is old enough for rotation
      const minRotationAge = new Date(oldKey.createdAt.getTime() +
        (this.config.rotation.minKeyAge * 24 * 60 * 60 * 1000));

      if (new Date() < minRotationAge) {
        throw new Error(`Key must be at least ${this.config.rotation.minKeyAge} days old before rotation`);
      }

      // Determine password for new key
      const newPassword = request.newPassword || ''; // In production, this would require user re-authentication

      // Create new key
      const salt = generateSalt();
      const masterKey = await this.deriveMasterKey(newPassword, salt);
      const sessionKey = this.generateSessionKey();
      const encryptedSessionKey = await this.encryptWithMasterKey(sessionKey, masterKey);

      const newKeyId = this.generateKeyId();
      const expiresAt = new Date(Date.now() + (this.config.rotation.maxKeyAge * 24 * 60 * 60 * 1000));

      const newKeyMetadata: KeyMetadata = {
        keyId: newKeyId,
        algorithm: this.config.encryption.algorithm,
        keyLength: this.config.encryption.keyLength,
        ivLength: this.config.encryption.ivLength,
        derivationIterations: this.config.keyDerivation.iterations,
        derivationHash: this.config.keyDerivation.hash,
        createdAt: new Date().toISOString(),
        lastRotated: new Date().toISOString(),
        previousKeyId: oldKey.keyId,
        rotationReason: request.options?.reason || 'manual_rotation'
      };

      // Create new key record
      const newKey = await prisma.userEncryptionKey.create({
        data: {
          userId: request.userId,
          keyId: newKeyId,
          keyName: `${oldKey.keyName} (rotated)`,
          encryptedKey: encryptedSessionKey.data,
          salt: salt,
          iv: encryptedSessionKey.iv,
          algorithm: this.config.encryption.algorithm,
          iterations: this.config.keyDerivation.iterations,
          isActive: true,
          createdAt: new Date(),
          expiresAt,
          description: request.options?.description || `Rotated from ${oldKey.keyName}`,
          tags: oldKey.tags || [],
          metadata: newKeyMetadata
        }
      });

      // Deactivate old key if requested
      let oldKeyDeactivated = false;
      if (!request.preserveOldKey) {
        await prisma.userEncryptionKey.update({
          where: { id: oldKey.id },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedReason: 'key_rotation'
          }
        });
        oldKeyDeactivated = true;
      }

      return {
        newKey: this.mapToUserEncryptionKey(newKey),
        oldKeyDeactivated,
        migrationRequired: true
      };
    } catch (error) {
      throw new Error(`Failed to rotate user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user key
   * @param userId
   * @param keyId
   * @param password
   */
  async deleteUserKey(userId: string, keyId: string, password: string): Promise<void> {
    try {
      // Validate password
      const validation = await this.validateUserKey(userId, keyId, password);
      if (!validation.isValid) {
        throw new Error('Invalid password');
      }

      // Check if this is the user's only active key
      const activeKeysCount = await prisma.userEncryptionKey.count({
        where: {
          userId,
          isActive: true
        }
      });

      if (activeKeysCount === 1) {
        throw new Error('Cannot delete the only active encryption key. Create a new key first.');
      }

      // Delete the key
      await prisma.userEncryptionKey.deleteMany({
        where: {
          userId,
          keyId
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt data using user key
   * @param userId
   * @param keyId
   * @param password
   * @param data
   */
  async encryptWithUserKey(
    userId: string,
    keyId: string,
    password: string,
    data: string
  ): Promise<EncryptionKey> {
    try {
      // Get the user key
      const key = await this.getUserKey(userId, keyId);

      // Derive master key
      const masterKey = await this.deriveMasterKey(password, key.salt);

      // Decrypt session key
      const encryptedData = {
        data: key.encryptedKey,
        iv: key.iv || '', // Assuming IV is stored with encrypted key
        algorithm: key.algorithm,
        salt: key.salt
      };

      const sessionKey = await decryptData(encryptedData, masterKey);

      // Encrypt the actual data with session key
      const encryptedResult = await encryptData(data, sessionKey);

      return {
        ...encryptedResult,
        keyId,
        userId,
        algorithm: key.algorithm,
        createdAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to encrypt with user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using user key
   * @param userId
   * @param keyId
   * @param password
   * @param encryptedData
   */
  async decryptWithUserKey(
    userId: string,
    keyId: string,
    password: string,
    encryptedData: EncryptionKey
  ): Promise<string> {
    try {
      // Get the user key
      const key = await this.getUserKey(userId, keyId);

      // Derive master key
      const masterKey = await this.deriveMasterKey(password, key.salt);

      // Decrypt session key
      const keyData = {
        data: key.encryptedKey,
        iv: key.iv || '',
        algorithm: key.algorithm,
        salt: key.salt
      };

      const sessionKey = await decryptData(keyData, masterKey);

      // Decrypt the actual data with session key
      return await decryptData(encryptedData, sessionKey);
    } catch (error) {
      throw new Error(`Failed to decrypt with user key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get key statistics
   * @param userId
   */
  async getKeyStatistics(userId: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    expiringSoon: number;
    averageAge: number;
    oldestKey?: Date;
    newestKey?: Date;
    keysByAlgorithm: Record<string, number>;
  }> {
    try {
      const keys = await prisma.userEncryptionKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const stats = {
        totalKeys: keys.length,
        activeKeys: keys.filter(k => k.isActive).length,
        expiredKeys: keys.filter(k => k.expiresAt && new Date(k.expiresAt) < now).length,
        expiringSoon: keys.filter(k => k.expiresAt && new Date(k.expiresAt) <= sevenDaysFromNow && new Date(k.expiresAt) >= now).length,
        averageAge: 0,
        keysByAlgorithm: {} as Record<string, number>
      };

      // Calculate average age
      if (keys.length > 0) {
        const totalAge = keys.reduce((sum, key) =>
          sum + (now.getTime() - key.createdAt.getTime()), 0);
        stats.averageAge = totalAge / keys.length;
        stats.oldestKey = keys[0].createdAt;
        stats.newestKey = keys[keys.length - 1].createdAt;
      }

      // Count by algorithm
      for (const key of keys) {
        stats.keysByAlgorithm[key.algorithm] = (stats.keysByAlgorithm[key.algorithm] || 0) + 1;
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get key statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<{
    deletedCount: number;
    deletedKeys: Array<{ id: string; keyName: string; userId: string }>;
  }> {
    try {
      const now = new Date();
      const expiredKeys = await prisma.userEncryptionKey.findMany({
        where: {
          expiresAt: { lt: now },
          isActive: true
        },
        select: {
          id: true,
          keyName: true,
          userId: true
        }
      });

      let deletedCount = 0;
      const deletedKeys: Array<{ id: string; keyName: string; userId: string }> = [];

      for (const key of expiredKeys) {
        try {
          await prisma.userEncryptionKey.update({
            where: { id: key.id },
            data: {
              isActive: false,
              deactivatedAt: now,
              deactivatedReason: 'expired'
            }
          });
          deletedCount++;
          deletedKeys.push(key);
        } catch (error) {
          console.error(`Failed to cleanup key ${key.id}:`, error);
        }
      }

      return { deletedCount, deletedKeys };
    } catch (error) {
      throw new Error(`Failed to cleanup expired keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper methods
   * @param request
   */
  private validateKeyDerivationRequest(request: KeyDerivationRequest): void {
    if (!request.userId || typeof request.userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!request.password || typeof request.password !== 'string') {
      throw new Error('Password is required');
    }

    if (request.password.length < this.config.security.minPasswordLength) {
      throw new Error(`Password must be at least ${this.config.security.minPasswordLength} characters long`);
    }

    if (this.config.security.requireUppercase && !/[A-Z]/.test(request.password)) {
      throw new Error('Password must contain uppercase letters');
    }

    if (this.config.security.requireNumbers && !/\d/.test(request.password)) {
      throw new Error('Password must contain numbers');
    }

    if (this.config.security.requireSpecialChars && !/[!"#$%&()*,.:<>?@^{|}]/.test(request.password)) {
      throw new Error('Password must contain special characters');
    }

    if (!request.keyName || typeof request.keyName !== 'string') {
      throw new Error('Key name is required');
    }

    if (request.keyName.length > 100) {
      throw new Error('Key name must be less than 100 characters');
    }
  }

  /**
   *
   * @param password
   * @param salt
   */
  private async deriveMasterKey(password: string, salt: string): Promise<string> {
    const key = await deriveKey(password, salt);
    // Convert CryptoKey to base64 string for storage
    return Buffer.from(await globalThis.crypto.subtle.exportKey('raw', key)).toString('base64');
  }

  /**
   *
   */
  private generateKeyId(): string {
    const array = new Uint8Array(16);
    globalThis.crypto.getRandomValues(array);
    return Buffer.from(array).toString('hex');
  }

  /**
   *
   */
  private generateSessionKey(): string {
    const array = new Uint8Array(32); // 256 bits
    globalThis.crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
  }

  /**
   *
   * @param data
   * @param masterKey
   */
  private async encryptWithMasterKey(data: string, masterKey: string): Promise<{ data: string; iv: string }> {
    // The masterKey is already a base64 string that can be used as a password
    // by the encryptData function
    const iv = generateIV();
    const encrypted = await encryptData(data, masterKey);

    return {
      data: encrypted.data,
      iv: encrypted.iv
    };
  }

  /**
   *
   * @param password
   * @param iterations
   */
  private calculateKeyStrength(password: string, iterations: number): 'weak' | 'fair' | 'good' | 'strong' {
    let score = 0;

    // Length scoring
    if (password.length >= 12) {
score += 1;
}
    if (password.length >= 16) {
score += 1;
}
    if (password.length >= 20) {
score += 1;
}

    // Character variety scoring
    if (/[a-z]/.test(password)) {
score += 1;
} // lowercase
    if (/[A-Z]/.test(password)) {
score += 1;
} // uppercase
    if (/\d/.test(password)) {
score += 1;
} // numbers
    if (/[!"#$%&()*,.:<>?@^{|}]/.test(password)) {
score += 1;
} // special chars

    // Iteration scoring
    if (iterations >= 100000) {
score += 1;
}
    if (iterations >= 200000) {
score += 1;
}

    if (score <= 2) {
return 'weak';
}
    if (score <= 4) {
return 'fair';
}
    if (score <= 6) {
return 'good';
}
    return 'strong';
  }

  /**
   *
   * @param key
   */
  private mapToUserEncryptionKey(key: any): UserEncryptionKey {
    return {
      id: key.id,
      userId: key.userId,
      keyId: key.keyId,
      keyName: key.keyName,
      encryptedKey: key.encryptedKey,
      salt: key.salt,
      algorithm: key.algorithm,
      iterations: key.iterations,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      deactivatedAt: key.deactivatedAt,
      deactivatedReason: key.deactivatedReason,
      metadata: key.metadata
    };
  }

  /**
   * List all user keys with pagination info
   */
  async listUserKeys(userId: string, includeInactive = false): Promise<{
    keys: UserEncryptionKey[];
    total: number;
  }> {
    const keys = await this.getUserKeys(userId, includeInactive);
    return {
      keys,
      total: keys.length
    };
  }

  /**
   * Deactivate a user key
   */
  async deactivateKey(keyId: string, userId: string, reason?: string): Promise<UserEncryptionKey> {
    try {
      const deactivatedKey = await prisma.userEncryptionKey.update({
        where: {
          id: keyId,
          userId: userId
        },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedReason: reason || 'Manual deactivation'
        }
      });

      return this.mapToUserEncryptionKey(deactivatedKey);
    } catch (error) {
      throw new Error(`Failed to deactivate key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform a security audit on user's keys
   */
  async performSecurityAudit(userId: string): Promise<{
    userId: string;
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    weakKeys: number;
    oldKeys: number;
    securityScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const now = new Date();
      const keys = await prisma.userEncryptionKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const activeKeys = keys.filter(key => key.isActive);
      const expiredKeys = keys.filter(key => key.expiresAt < now);
      const oldKeys = keys.filter(key => {
        const ageInDays = (now.getTime() - key.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays > 60; // Keys older than 60 days
      });

      // Simple heuristic for weak keys (based on iterations)
      const weakKeys = keys.filter(key => key.iterations < 100000);

      const recommendations: string[] = [];

      if (expiredKeys.length > 0) {
        recommendations.push(`Remove ${expiredKeys.length} expired key(s)`);
      }
      if (weakKeys.length > 0) {
        recommendations.push(`Upgrade ${weakKeys.length} weak key(s) with stronger encryption`);
      }
      if (oldKeys.length > 0) {
        recommendations.push(`Consider rotating ${oldKeys.length} old key(s)`);
      }
      if (activeKeys.length > 5) {
        recommendations.push('Consider deactivating unused keys to reduce attack surface');
      }

      // Calculate security score (0-100)
      let securityScore = 100;
      const issues: string[] = [];

      if (expiredKeys.length > 0) {
        securityScore -= expiredKeys.length * 20;
        issues.push(`${expiredKeys.length} expired key(s) found`);
      }
      if (weakKeys.length > 0) {
        securityScore -= weakKeys.length * 15;
        issues.push(`${weakKeys.length} weak key(s) found`);
      }
      if (oldKeys.length > 0) {
        securityScore -= oldKeys.length * 10;
        issues.push(`${oldKeys.length} old key(s) found`);
      }
      if (activeKeys.length > 5) {
        securityScore -= 10;
        issues.push('Too many active keys');
      }

      securityScore = Math.max(0, securityScore);

      return {
        userId,
        totalKeys: keys.length,
        activeKeys: activeKeys.length,
        expiredKeys: expiredKeys.length,
        weakKeys: weakKeys.length,
        oldKeys: oldKeys.length,
        securityScore,
        issues,
        recommendations
      };
    } catch (error) {
      throw new Error(`Failed to perform security audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Default key management service instance
 */
export const sessionKeyManagementService = new SessionKeyManagementService();

/**
 * Create a new key management service instance with custom configuration
 * @param config
 */
export function createSessionKeyManagementService(
  config?: Partial<typeof KEY_MANAGEMENT_CONFIG>
): SessionKeyManagementService {
  return new SessionKeyManagementService(config);
}