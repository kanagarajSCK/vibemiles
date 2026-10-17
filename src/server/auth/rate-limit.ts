/**
 * In-memory sliding-window rate limiter for authentication endpoints.
 * Protects login and registration from brute-force credential stuffing attacks.
 */

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configuration: max 5 failed attempts per 15 minutes
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks if an identifier (e.g. IP + email or IP alone) has exceeded rate limits.
 * Returns { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number }
 */
export function checkRateLimit(key: string, maxAttempts = MAX_ATTEMPTS, _windowMs?: number): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.attempts,
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt for an identifier.
 */
export function recordFailedAttempt(key: string, windowMs = WINDOW_MS): void {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      attempts: 1,
      resetAt: now + windowMs,
    });
  } else {
    entry.attempts += 1;
  }
}

/**
 * Resets rate limit counters upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clean up expired rate limit entries periodically (memory leak prevention).
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}
