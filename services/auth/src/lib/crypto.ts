// Bun-native cryptography utilities for authentication
// Uses Bun.password.hash (Argon2id) and Web Crypto API for JWT

import type { JWTPayload } from '../types/jwt.js';

// Password hashing configuration using Bun's Argon2id implementation
const PASSWORD_HASH_OPTIONS = {
  algorithm: 'argon2id' as const,
  memoryCost: 65536, // 64 MB
  timeCost: 3
};

// Constants for time calculations and encoding
const MILLISECONDS_PER_SECOND = 1000;
const HEX_BASE = 16;
const HEX_PAD_LENGTH = 2;
const JWT_PARTS_COUNT = 3;
const BASE64_PADDING_LENGTH = 4;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const SECONDS_PER_MINUTE = MINUTES_PER_HOUR;
const SECONDS_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = HOURS_PER_DAY * SECONDS_PER_HOUR;

/**
 * Hash a password using Bun's native Argon2id implementation
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, PASSWORD_HASH_OPTIONS);
}

/**
 * Verify a password against its hash using Bun's native Argon2id
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} True if the password matches the hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Generate a secure random token for sessions
 * @param {number} [length=32] - The length of the token to generate
 * @returns {string} A secure random token in hexadecimal format
 */
export function generateRandomToken(length = 32): string {
  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(HEX_BASE).padStart(HEX_PAD_LENGTH, '0')).join('');
}

/**
 * Generate JWT token using Bun's Web Crypto API
 * No external dependencies - pure Bun implementation
 * @param {JWTPayload} payload - The JWT payload to encode
 * @param {string} secret - The secret key for signing
 * @param {string} [expiresIn='15m'] - The expiration time (e.g., '15m', '1h', '7d')
 * @returns {Promise<string>} The generated JWT token
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
  const exp = Math.floor((Date.now() + expiryMs) / MILLISECONDS_PER_SECOND);

  const jwtPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / MILLISECONDS_PER_SECOND)
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
 * Parse JWT token into its components
 * @param {string} token - The JWT token to parse
 * @returns {{encodedHeader: string, encodedPayload: string, signature: string} | null} The parsed components or null if invalid
 */
function parseJWTToken(
  token: string
): { encodedHeader: string; encodedPayload: string; signature: string } | null {
  const parts = token.split('.');
  if (parts.length !== JWT_PARTS_COUNT) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  return { encodedHeader, encodedPayload, signature };
}

/**
 * Decode and validate JWT payload
 * @param {string} encodedPayload - The Base64URL encoded payload
 * @returns {JWTPayload | null} The decoded payload or null if invalid
 */
function decodeJWTPayload(encodedPayload: string): JWTPayload | null {
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload & {
      exp: number;
      iat: number;
    };

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / MILLISECONDS_PER_SECOND)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify JWT signature
 * @param {string} encodedHeader - The Base64URL encoded header
 * @param {string} encodedPayload - The Base64URL encoded payload
 * @param {string} signature - The signature to verify
 * @param {string} secret - The secret key for verification
 * @returns {Promise<boolean>} True if signature is valid, false otherwise
 */
async function verifyJWTSignature(
  encodedHeader: string,
  encodedPayload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await sign(message, secret);
  return signature === expectedSignature;
}

/**
 * Verify and decode JWT token using Bun's Web Crypto API
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key for verification
 * @returns {Promise<JWTPayload | null>} The decoded payload or null if invalid
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parsedToken = parseJWTToken(token);
    if (!parsedToken) {
      return null;
    }

    const { encodedHeader, encodedPayload, signature } = parsedToken;

    // Verify signature
    const isSignatureValid = await verifyJWTSignature(
      encodedHeader,
      encodedPayload,
      signature,
      secret
    );
    if (!isSignatureValid) {
      return null;
    }

    // Decode and validate payload
    return decodeJWTPayload(encodedPayload);
  } catch {
    return null;
  }
}

/**
 * Create HMAC-SHA256 signature using Web Crypto API
 * @param {string} message - The message to sign
 * @param {string} secret - The secret key for signing
 * @returns {Promise<string>} The HMAC-SHA256 signature in Base64URL format
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
 * @param {string | ArrayBuffer} data - The data to encode
 * @returns {string} The Base64URL encoded string
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
 * @param {string} base64url - The Base64URL encoded string
 * @returns {string} The decoded string
 */
function base64UrlDecode(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat(
    (BASE64_PADDING_LENGTH - (base64.length % BASE64_PADDING_LENGTH)) % BASE64_PADDING_LENGTH
  );
  return globalThis.atob(base64 + padding);
}

/**
 * Parse expiry string to milliseconds
 * Supports: 15m, 1h, 7d, etc.
 * @param {string} expiry - The expiry string to parse (e.g., '15m', '1h', '7d')
 * @returns {number} The expiry time in milliseconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: MILLISECONDS_PER_SECOND,
    m: SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
    h: SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND,
    d: SECONDS_PER_DAY * MILLISECONDS_PER_SECOND
  };

  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error(`Invalid time unit: ${unit}`);
  }

  return value * multiplier;
}
