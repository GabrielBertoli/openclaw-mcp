/**
 * Simple in-memory sliding-window rate limiter.
 * Configurable via RATE_LIMIT_PER_MIN env var (default: 60).
 */

const DEFAULT_RATE_LIMIT = 60;

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private timestamps: number[] = [];

  constructor(maxRequests?: number, windowMs: number = 60_000) {
    this.maxRequests =
      maxRequests ?? parseInt(process.env.RATE_LIMIT_PER_MIN || String(DEFAULT_RATE_LIMIT), 10);
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed. Returns true if allowed, false if rate-limited.
   */
  check(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    // Prune old timestamps
    this.timestamps = this.timestamps.filter((t) => t > cutoff);

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }
}
