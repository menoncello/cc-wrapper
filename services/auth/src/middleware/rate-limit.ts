// Simple in-memory rate limiter for authentication endpoints
// Production should use Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

/**
 * Rate limit middleware for Elysia
 * Limits requests per IP address
 */
export function rateLimitMiddleware() {
  return async ({ request }: { request: Request }) => {
    // Get client IP from headers or connection
    const ip = getClientIP(request);

    // Clean up expired entries periodically
    cleanupExpiredEntries();

    // Get or create rate limit entry
    const now = Date.now();
    let entry = rateLimitStore.get(ip);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + WINDOW_MS
      };
      rateLimitStore.set(ip, entry);
      return;
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(ip, entry);

    if (entry.count > MAX_REQUESTS) {
      const resetIn = Math.ceil((entry.resetAt - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${resetIn} seconds.`);
    }
  };
}

/**
 * Extract client IP from request
 */
function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    return firstIP ? firstIP.trim() : 'unknown';
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to a default (in development)
  return 'unknown';
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
}
