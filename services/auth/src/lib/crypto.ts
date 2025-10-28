// Bun-native cryptography utilities for authentication
// Uses Bun.password.hash (Argon2id) and Web Crypto API for JWT

import type { JWTPayload } from '../types/jwt.js';

// Password hashing configuration using Bun's Argon2id implementation
const PASSWORD_HASH_OPTIONS = {
  algorithm: 'argon2id' as const,
  memoryCost: 65536, // 64 MB
  timeCost: 3
};

/**
 * Hash a password using Bun's native Argon2id implementation
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, PASSWORD_HASH_OPTIONS);
}

/**
 * Verify a password against its hash using Bun's native Argon2id
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Generate a secure random token for sessions
 */
export function generateRandomToken(length = 32): string {
  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate JWT token using Bun's Web Crypto API
 * No external dependencies - pure Bun implementation
 */
export async function generateJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn = '15m'
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Calculate expiration timestamp
  const expiryMs = parseExpiry(expiresIn);
  const exp = Math.floor((Date.now() + expiryMs) / 1000);

  const jwtPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };

  // Base64URL encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));

  // Create signature using Web Crypto API
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(message, secret);

  return `${message}.${signature}`;
}

/**
 * Verify and decode JWT token using Bun's Web Crypto API
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const encodedHeader = parts[0];
    const encodedPayload = parts[1];
    const signature = parts[2];

    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const message = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const expectedSignature = await sign(message, secret);
    if (signature !== expectedSignature) {
      return null;
    }

    // Decode and validate payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload & {
      exp: number;
      iat: number;
    };

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Create HMAC-SHA256 signature using Web Crypto API
 */
async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message));

  return base64UrlEncode(signature);
}

/**
 * Base64URL encode a string or ArrayBuffer
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const base64 =
    typeof data === 'string'
      ? globalThis.btoa(data)
      : globalThis.btoa(String.fromCharCode(...new Uint8Array(data)));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL decode to string
 */
function base64UrlDecode(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return globalThis.atob(base64 + padding);
}

/**
 * Parse expiry string to milliseconds
 * Supports: 15m, 1h, 7d, etc.
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error(`Invalid time unit: ${unit}`);
  }

  return value * multiplier;
}
