/**
 * Encryption Service for Session Data
 * Handles data encryption at rest using user-controlled keys
 */

import { CryptoKey } from 'crypto';

import {
  decryptData,
  deriveKey,
  encryptData,
  generateEncryptionIV,
  generateKeyDerivationSalt,
  hashPassword
} from '../lib/encryption';
import { EncryptionKey } from '../types/key-management';
import { SessionKeyManagementService } from './key-management.service';

export interface EncryptionRequest {
  userId: string;
  keyId: string;
  password: string;
  data: string;
  metadata?: Record<string, any>;
}

export interface DecryptionRequest {
  userId: string;
  keyId: string;
  password: string;
  encryptedData: {
    encryptedData: string;
    iv: string;
    algorithm: string;
  };
}

export interface BatchEncryptionRequest {
  userId: string;
  keyId: string;
  password: string;
  items: Array<{
    id: string;
    data: string;
    metadata?: Record<string, any>;
  }>;
}

export interface BatchDecryptionRequest {
  userId: string;
  keyId: string;
  password: string;
  encryptedItems: Array<{
    id: string;
    encryptedData: {
      encryptedData: string;
      iv: string;
      algorithm: string;
    };
  }>;
}

export interface EncryptedItem {
  id: string;
  encryptedData: {
    encryptedData: string;
    iv: string;
    algorithm: string;
  };
  metadata?: Record<string, any>;
  encryptedAt: Date;
}

export interface DecryptedItem {
  id: string;
  data: string;
  metadata?: Record<string, any>;
  decryptedAt: Date;
}

export interface EncryptionMetrics {
  totalEncrypted: number;
  totalDecrypted: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  compressionRatio?: number;
  throughputBytesPerSecond: number;
}

/**
 *
 */
export class EncryptionService {
  private keyManagementService: SessionKeyManagementService;
  private metrics: Map<string, EncryptionMetrics> = new Map();

  /**
   *
   */
  constructor() {
    this.keyManagementService = new SessionKeyManagementService();
  }

  /**
   * Encrypt session data using user-controlled key
   * @param request
   */
  async encryptSessionData(request: EncryptionRequest): Promise<{
    encryptedData: EncryptionKey;
    keyId: string;
    algorithm: string;
    encryptedAt: Date;
  }> {
    const startTime = Date.now();

    try {
      // Use key management service to encrypt data
      const encryptedKey = await this.keyManagementService.encryptWithUserKey(
        request.userId,
        request.keyId,
        request.password,
        request.data
      );

      const encryptedAt = new Date();
      const duration = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(request.userId, {
        totalEncrypted: 1,
        totalDecrypted: 0,
        averageEncryptionTime: duration,
        averageDecryptionTime: 0,
        throughputBytesPerSecond: request.data.length / (duration / 1000)
      });

      return {
        encryptedData: encryptedKey,
        keyId: request.keyId,
        algorithm: encryptedKey.algorithm,
        encryptedAt
      };
    } catch (error) {
      console.error('Failed to encrypt session data:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt session data using user-controlled key
   * @param request
   */
  async decryptSessionData(request: DecryptionRequest): Promise<{
    data: string;
    keyId: string;
    decryptedAt: Date;
    integrityVerified: boolean;
  }> {
    const startTime = Date.now();

    try {
      // Use key management service to decrypt data
      const decryptedData = await this.keyManagementService.decryptWithUserKey(
        request.userId,
        request.keyId,
        request.password,
        request.encryptedData
      );

      const decryptedAt = new Date();
      const duration = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(request.userId, {
        totalEncrypted: 0,
        totalDecrypted: 1,
        averageEncryptionTime: 0,
        averageDecryptionTime: duration,
        throughputBytesPerSecond: decryptedData.length / (duration / 1000)
      });

      return {
        data: decryptedData,
        keyId: request.keyId,
        decryptedAt,
        integrityVerified: true // AES-GCM provides authenticated encryption
      };
    } catch (error) {
      console.error('Failed to decrypt session data:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt multiple items in batch
   * @param request
   */
  async encryptBatch(request: BatchEncryptionRequest): Promise<{
    items: EncryptedItem[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalTime: number;
    };
  }> {
    const startTime = Date.now();
    const items: EncryptedItem[] = [];
    let successful = 0;
    let failed = 0;

    for (const item of request.items) {
      try {
        const result = await this.encryptSessionData({
          userId: request.userId,
          keyId: request.keyId,
          password: request.password,
          data: item.data,
          metadata: item.metadata
        });

        items.push({
          id: item.id,
          encryptedData: result.encryptedData,
          metadata: item.metadata,
          encryptedAt: result.encryptedAt
        });

        successful++;
      } catch (error) {
        console.error(`Failed to encrypt item ${item.id}:`, error);
        failed++;

        // Add failed item with error indicator
        items.push({
          id: item.id,
          encryptedData: {
            encryptedData: '',
            iv: '',
            algorithm: 'ERROR'
          },
          metadata: { ...item.metadata, error: error instanceof Error ? error.message : 'Unknown error' },
          encryptedAt: new Date()
        });
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      items,
      summary: {
        total: request.items.length,
        successful,
        failed,
        totalTime
      }
    };
  }

  /**
   * Decrypt multiple items in batch
   * @param request
   */
  async decryptBatch(request: BatchDecryptionRequest): Promise<{
    items: DecryptedItem[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalTime: number;
    };
  }> {
    const startTime = Date.now();
    const items: DecryptedItem[] = [];
    let successful = 0;
    let failed = 0;

    for (const item of request.encryptedItems) {
      try {
        const result = await this.decryptSessionData({
          userId: request.userId,
          keyId: request.keyId,
          password: request.password,
          encryptedData: item.encryptedData
        });

        items.push({
          id: item.id,
          data: result.data,
          metadata: { integrityVerified: result.integrityVerified },
          decryptedAt: result.decryptedAt
        });

        successful++;
      } catch (error) {
        console.error(`Failed to decrypt item ${item.id}:`, error);
        failed++;

        // Add failed item with error indicator
        items.push({
          id: item.id,
          data: '',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
          decryptedAt: new Date()
        });
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      items,
      summary: {
        total: request.encryptedItems.length,
        successful,
        failed,
        totalTime
      }
    };
  }

  /**
   * Rotate encryption for existing encrypted data
   * @param userId
   * @param currentKeyId
   * @param currentPassword
   * @param newKeyId
   * @param newPassword
   * @param encryptedItems
   */
  async rotateEncryption(
    userId: string,
    currentKeyId: string,
    currentPassword: string,
    newKeyId: string,
    newPassword: string,
    encryptedItems: Array<{ id: string; encryptedData: EncryptionKey }>
  ): Promise<{
    items: EncryptedItem[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const items: EncryptedItem[] = [];
    let successful = 0;
    let failed = 0;

    for (const item of encryptedItems) {
      try {
        // Decrypt with current key
        const decryptedData = await this.decryptSessionData({
          userId,
          keyId: currentKeyId,
          password: currentPassword,
          encryptedData: item.encryptedData
        });

        // Re-encrypt with new key
        const reEncrypted = await this.encryptSessionData({
          userId,
          keyId: newKeyId,
          password: newPassword,
          data: decryptedData.data
        });

        items.push({
          id: item.id,
          encryptedData: reEncrypted.encryptedData,
          encryptedAt: reEncrypted.encryptedAt
        });

        successful++;
      } catch (error) {
        console.error(`Failed to rotate encryption for item ${item.id}:`, error);
        failed++;
      }
    }

    return {
      items,
      summary: {
        total: encryptedItems.length,
        successful,
        failed
      }
    };
  }

  /**
   * Get encryption metrics for a user
   * @param userId
   */
  getEncryptionMetrics(userId: string): EncryptionMetrics | null {
    return this.metrics.get(userId) || null;
  }

  /**
   * Reset encryption metrics for a user
   * @param userId
   */
  resetEncryptionMetrics(userId: string): void {
    this.metrics.delete(userId);
  }

  /**
   * Get encryption statistics for monitoring
   */
  getEncryptionStats(): {
    totalUsers: number;
    totalEncryptions: number;
    totalDecryptions: number;
    averageLatency: number;
  } {
    let totalEncryptions = 0;
    let totalDecryptions = 0;
    let totalLatency = 0;
    let operationCount = 0;

    for (const metrics of this.metrics.values()) {
      totalEncryptions += metrics.totalEncrypted;
      totalDecryptions += metrics.totalDecrypted;
      totalLatency += metrics.averageEncryptionTime + metrics.averageDecryptionTime;
      operationCount += metrics.totalEncrypted + metrics.totalDecrypted;
    }

    return {
      totalUsers: this.metrics.size,
      totalEncryptions,
      totalDecryptions,
      averageLatency: operationCount > 0 ? totalLatency / operationCount : 0
    };
  }

  /**
   * Test encryption/decryption functionality
   * @param userId
   * @param keyId
   * @param password
   */
  async testEncryption(userId: string, keyId: string, password: string): Promise<{
    success: boolean;
    testResult: {
      testData: string;
      encrypted: boolean;
      decrypted: boolean;
      dataIntegrity: boolean;
      latencyMs: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    const testData = `Test data for encryption validation at ${new Date().toISOString()}`;

    try {
      // Test encryption
      const encrypted = await this.encryptSessionData({
        userId,
        keyId,
        password,
        data: testData
      });

      // Test decryption
      const decrypted = await this.decryptSessionData({
        userId,
        keyId,
        password,
        encryptedData: encrypted.encryptedData
      });

      const latency = Date.now() - startTime;
      const dataIntegrity = decrypted.data === testData;

      return {
        success: true,
        testResult: {
          testData,
          encrypted: true,
          decrypted: true,
          dataIntegrity,
          latencyMs: latency
        }
      };
    } catch (error) {
      return {
        success: false,
        testResult: {
          testData,
          encrypted: false,
          decrypted: false,
          dataIntegrity: false,
          latencyMs: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate encryption algorithm and parameters
   * @param algorithm
   * @param keySize
   */
  validateEncryptionParameters(algorithm: string, keySize?: number): {
    isValid: boolean;
    supportedAlgorithms: string[];
    recommendedKeySize: number;
    issues: string[];
  } {
    const supportedAlgorithms = ['AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM'];
    const recommendedKeySize = 256;
    const issues: string[] = [];

    let isValid = true;

    if (!supportedAlgorithms.includes(algorithm)) {
      isValid = false;
      issues.push(`Unsupported algorithm: ${algorithm}`);
    }

    if (keySize && keySize < 128) {
      isValid = false;
      issues.push(`Key size too small: ${keySize} bits (minimum 128)`);
    }

    if (keySize && keySize > 256) {
      issues.push(`Key size larger than recommended: ${keySize} bits (recommended ${recommendedKeySize})`);
    }

    return {
      isValid,
      supportedAlgorithms,
      recommendedKeySize,
      issues
    };
  }

  /**
   * Update internal metrics
   * @param userId
   * @param update
   */
  private updateMetrics(userId: string, update: Partial<EncryptionMetrics>): void {
    const existing = this.metrics.get(userId) || {
      totalEncrypted: 0,
      totalDecrypted: 0,
      averageEncryptionTime: 0,
      averageDecryptionTime: 0,
      throughputBytesPerSecond: 0
    };

    // Update averages with exponential moving average
    const alpha = 0.1; // Smoothing factor

    if (update.averageEncryptionTime) {
      existing.averageEncryptionTime = existing.averageEncryptionTime * (1 - alpha) + update.averageEncryptionTime * alpha;
    }

    if (update.averageDecryptionTime) {
      existing.averageDecryptionTime = existing.averageDecryptionTime * (1 - alpha) + update.averageDecryptionTime * alpha;
    }

    if (update.totalEncrypted) {
      existing.totalEncrypted += update.totalEncrypted;
    }

    if (update.totalDecrypted) {
      existing.totalDecrypted += update.totalDecrypted;
    }

    if (update.throughputBytesPerSecond) {
      existing.throughputBytesPerSecond = existing.throughputBytesPerSecond * (1 - alpha) + update.throughputBytesPerSecond * alpha;
    }

    this.metrics.set(userId, existing);
  }
}