/**
 * Cryptographic utilities for secure random number generation
 */

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random ID
 * @param prefix Optional prefix for the ID
 * @param length Number of random bytes to use (default: 16)
 * @returns Secure random string ID
 */
export function generateSecureId(prefix: string = '', length: number = 16): string {
  const bytes = randomBytes(length);
  const randomString = bytes.toString('hex');
  return prefix ? `${prefix}_${randomString}` : randomString;
}

/**
 * Generate a cryptographically secure random ID with URL-safe characters
 * @param prefix Optional prefix for the ID
 * @param length Number of random bytes to use (default: 12)
 * @returns URL-safe secure random string ID
 */
export function generateSecureUrlId(prefix: string = '', length: number = 12): string {
  const bytes = randomBytes(length);
  const randomString = bytes
    .toString('base64')
    .replace(/[+/]/g, '') // Remove URL-unsafe characters
    .substring(0, length * 1.5); // Approximate length
  return prefix ? `${prefix}_${randomString}` : randomString;
}

/**
 * Generate a subscription ID with timestamp and random hex string
 * @param prefix Optional prefix for the ID (default: 'sub')
 * @returns Subscription ID in format: prefix_timestamp_hex
 */
export function generateSubscriptionId(prefix: string = 'sub'): string {
  const timestamp = Date.now();
  const bytes = randomBytes(4); // 4 bytes = 8 hex characters
  const randomHex = bytes.toString('hex');
  return `${prefix}_${timestamp}_${randomHex}`;
}

/**
 * Generate a cryptographically secure random number within a range
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Secure random number
 */
export function generateSecureRandom(min: number = 0, max: number = 256): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const bytes = randomBytes(bytesNeeded);

  // Convert bytes to number and ensure it's within range
  let randomValue = 0;
  for (let i = 0; i < bytesNeeded; i++) {
    randomValue = randomValue * 256 + bytes[i];
  }

  return min + (randomValue % range);
}