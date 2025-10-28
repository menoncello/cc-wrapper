import { describe, expect, it } from 'bun:test';

import {
  generateJWT,
  generateRandomToken,
  hashPassword,
  verifyJWT,
  verifyPassword
} from './crypto.js';

describe('Crypto utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password using Argon2id', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomToken', () => {
    it('should generate a random token of specified length', () => {
      const token = generateRandomToken(32);

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate different tokens each time', () => {
      const token1 = generateRandomToken(32);
      const token2 = generateRandomToken(32);

      expect(token1).not.toBe(token2);
    });
  });

  describe('JWT operations', () => {
    const secret = process.env.JWT_SECRET || 'test-key-placeholder-32-chars-minimum-length';

    it('should generate and verify valid JWT', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'DEVELOPER' as const
      };

      const token = await generateJWT(payload, secret, '15m');

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);

      const decoded = await verifyJWT(token, secret);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should reject JWT with invalid signature', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'DEVELOPER' as const
      };

      const token = await generateJWT(payload, secret, '15m');
      const wrongSecret = 'different-test-secret-key-32-chars-minimum';

      const decoded = await verifyJWT(token, wrongSecret);

      expect(decoded).toBeNull();
    });

    it('should reject expired JWT', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'DEVELOPER' as const
      };

      // Generate token with 1 second expiry
      const token = await generateJWT(payload, secret, '1s');

      // Wait for token to expire (add extra buffer for safe expiry)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const decoded = await verifyJWT(token, secret);

      expect(decoded).toBeNull();
    });

    it('should reject malformed JWT', async () => {
      const malformedToken = 'not.a.valid.jwt';

      const decoded = await verifyJWT(malformedToken, secret);

      expect(decoded).toBeNull();
    });

    it('should reject JWT with missing parts', async () => {
      const incompleteTok = 'header.payload'; // Missing signature

      const decoded = await verifyJWT(incompleteTok, secret);

      expect(decoded).toBeNull();
    });

    it('should reject JWT with empty parts', async () => {
      const emptyPartsToken = '.payload.signature'; // Empty header

      const decoded = await verifyJWT(emptyPartsToken, secret);

      expect(decoded).toBeNull();
    });

    it('should reject JWT with corrupted payload', async () => {
      // Create a JWT with invalid base64 in payload that will fail JSON.parse
      const invalidPayloadToken = 'header.!!!invalid-base64!!.signature';

      const decoded = await verifyJWT(invalidPayloadToken, secret);

      expect(decoded).toBeNull();
    });

    it('should throw error for invalid expiry format', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'DEVELOPER' as const
      };

      // Test invalid expiry formats
      await expect(async () => {
        await generateJWT(payload, secret, 'invalid');
      }).toThrow('Invalid expiry format');

      await expect(async () => {
        await generateJWT(payload, secret, '15');
      }).toThrow('Invalid expiry format');

      await expect(async () => {
        await generateJWT(payload, secret, 'x15m');
      }).toThrow('Invalid expiry format');
    });
  });
});
