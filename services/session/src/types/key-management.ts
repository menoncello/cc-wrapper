/**
 * Key Management Types
 * Defines types for encryption key management and operations
 */

export interface EncryptionKey {
  data: string;
  iv: string;
  salt?: string;
  algorithm: string;
  keyId?: string;
  userId?: string;
  createdAt?: Date;
}

export interface KeyMetadata {
  keyId: string;
  algorithm: string;
  keyLength: number;
  ivLength: number;
  derivationIterations: number;
  derivationHash: string;
  createdAt: string;
  lastRotated: string;
  previousKeyId?: string;
  rotationReason?: string;
}

export interface KeyRotationOptions {
  reason?: string;
  description?: string;
  autoRotate?: boolean;
  preserveOldKey?: boolean;
}