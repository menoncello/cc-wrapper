import { JWT_SECRET_MIN_LENGTH } from '../constants/auth.constants.js';
import { verifyJWT } from '../lib/crypto.js';
import type { JWTPayload } from '../types/jwt.js';

const BEARER_PREFIX_LENGTH = 7;

/**
 * Get and validate JWT_SECRET from environment
 * @returns {string} The validated JWT secret
 */
function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`);
  }

  return jwtSecret;
}

/**
 * Authentication middleware for protected routes
 * Verifies JWT token from Authorization header
 * @param {object} root0 - The middleware context object
 * @param {Request} root0.request - The incoming request object
 * @param {Record<string, unknown>} root0.set - Response status setter
 * @returns {Promise<JWTPayload>} The JWT payload if authentication succeeds
 */
export async function authMiddleware({
  request,
  set
}: {
  request: Request;
  set: Record<string, unknown>;
}): Promise<JWTPayload> {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(BEARER_PREFIX_LENGTH); // Remove 'Bearer ' prefix

  // Verify JWT token
  const payload = await verifyJWT(token, getJwtSecret());

  if (!payload) {
    set.status = 401;
    throw new Error('Invalid or expired token');
  }

  return payload;
}
