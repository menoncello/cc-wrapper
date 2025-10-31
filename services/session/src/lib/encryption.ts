// Session encryption utilities using Bun Web Crypto API
// Implements AES-256-GCM encryption with user-derived keys

import type { EncryptedData } from '../types/session.js';

// Key derivation configuration
const KEY_DERIVATION_CONFIG = {
  algorithm: 'PBKDF2' as const,
  hash: 'SHA-256' as const,
  iterations: 100000, // High iteration count for security
  keyLength: 32, // 256 bits for AES-256
  saltLength: 32 // 256 bits
};

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256, // bits
  ivLength: 12 // 96 bits for GCM (recommended)
};

/**
 * Generate a secure random salt for key derivation
 */
export function generateSalt(): string {
  const array = new Uint8Array(KEY_DERIVATION_CONFIG.saltLength);
  globalThis.crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Generate a secure random salt for key derivation (alias for compatibility)
 */
export function generateKeyDerivationSalt(): string {
  return generateSalt();
}

/**
 * Generate a secure random IV for encryption
 */
export function generateIV(): string {
  const array = new Uint8Array(ENCRYPTION_CONFIG.ivLength);
  globalThis.crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Generate a secure random IV for encryption (alias for compatibility)
 */
export function generateEncryptionIV(): string {
  return generateIV();
}

/**
 * Derive encryption key from user password using PBKDF2
 * @param password
 * @param salt
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const saltBuffer = Buffer.from(salt, 'base64');

  const importedKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await globalThis.crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_CONFIG.algorithm,
      salt: saltBuffer,
      iterations: KEY_DERIVATION_CONFIG.iterations,
      hash: KEY_DERIVATION_CONFIG.hash
    },
    importedKey,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt session data using AES-256-GCM
 * @param data
 * @param password
 * @param salt
 */
export async function encryptData(
  data: string,
  password: string,
  salt?: string
): Promise<EncryptedData> {
  try {
    // Generate or use provided salt
    const encryptionSalt = salt || generateSalt();

    // Derive encryption key
    const key = await deriveKey(password, encryptionSalt);

    // Generate IV
    const iv = generateIV();
    const ivBuffer = Buffer.from(iv, 'base64');

    // Encrypt data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: ivBuffer
      },
      key,
      dataBuffer
    );

    // Return encrypted data
    return {
      data: Buffer.from(encryptedBuffer).toString('base64'),
      iv,
      salt: encryptionSalt,
      algorithm: ENCRYPTION_CONFIG.algorithm
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt session data using AES-256-GCM
 * @param encryptedData
 * @param password
 */
export async function decryptData(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  try {
    // Validate algorithm
    if (encryptedData.algorithm !== ENCRYPTION_CONFIG.algorithm) {
      throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
    }

    // Derive decryption key
    const key = await deriveKey(password, encryptedData.salt);

    // Prepare buffers
    const ivBuffer = Buffer.from(encryptedData.iv, 'base64');
    const encryptedBuffer = Buffer.from(encryptedData.data, 'base64');

    // Decrypt data
    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a checksum for data integrity verification
 * @param data
 */
export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);

  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password for secure storage (alias for compatibility)
 * @param password
 */
export async function hashPassword(password: string): Promise<string> {
  return generateChecksum(password);
}

/**
 * Verify data integrity using checksum
 * @param data
 * @param expectedChecksum
 */
export async function verifyChecksum(data: string, expectedChecksum: string): Promise<boolean> {
  try {
    const actualChecksum = await generateChecksum(data);
    return actualChecksum === expectedChecksum.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Compress data using simple text compression fallback
 * Note: Using base64 encoding as a fallback since Bun's compression functions may not be available
 * @param data
 */
export async function compressData(data: string): Promise<string> {
  try {
    // For now, just return base64 encoded data as "compression"
    // In production, you'd use proper compression libraries
    return Buffer.from(data, 'utf8').toString('base64');
  } catch (error) {
    throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decompress data using simple text decompression fallback
 * @param compressedData
 */
export async function decompressData(compressedData: string): Promise<string> {
  try {
    // Decode the base64 "compressed" data
    return Buffer.from(compressedData, 'base64').toString('utf8');
  } catch (error) {
    throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get size information for compressed vs uncompressed data
 * @param original
 * @param compressed
 */
export function getDataSizeInfo(original: string, compressed: string): {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
} {
  const originalSize = Buffer.byteLength(original, 'utf8');
  const compressedSize = Buffer.byteLength(compressed, 'utf8');
  const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

  return {
    originalSize,
    compressedSize,
    compressionRatio
  };
}