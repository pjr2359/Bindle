// lib/api/rateLimiter.ts
/**
 * A simple rate limiter to prevent exceeding API rate limits
 */

interface RateLimiterOptions {
  maxRequests: number;  // Maximum number of requests allowed
  timeWindow: number;   // Time window in milliseconds
  queueTimeout?: number; // How long to wait before timing out queued requests
}

class RateLimiter {
  private queue: Array<{
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
    timerId: NodeJS.Timeout;
  }> = [];
  private requestTimestamps: number[] = [];
  private maxRequests: number;
  private timeWindow: number;
  private queueTimeout: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.timeWindow = options.timeWindow;
    this.queueTimeout = options.queueTimeout || 30000; // Default 30s timeout
  }

  /**
   * Acquire a permit to make an API request
   * @returns A promise that resolves when the request can be made
   */
  async acquire(): Promise<void> {
    // Clear old timestamps
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    // If we have capacity, allow the request immediately
    if (this.requestTimestamps.length < this.maxRequests) {
      this.requestTimestamps.push(now);
      return Promise.resolve();
    }

    // Otherwise, queue the request
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        // Remove from queue on timeout
        this.queue = this.queue.filter(item => item.timerId !== timerId);
        reject(new Error('Rate limit queue timeout'));
      }, this.queueTimeout);

      this.queue.push({ resolve, reject, timerId });
    });
  }

  /**
   * Release a permit, allowing the next queued request to proceed
   */
  release(): void {
    if (this.queue.length === 0) return;

    const { resolve, timerId } = this.queue.shift()!;
    clearTimeout(timerId);

    this.requestTimestamps.push(Date.now());
    resolve(undefined);
  }
}

// Create rate limiters for different API services
const rateLimiters: Record<string, RateLimiter> = {
  skyscanner: new RateLimiter({
    maxRequests: 5,   // Allow 5 requests
    timeWindow: 10000, // Per 10 seconds
    queueTimeout: 60000 // Wait up to 60s in queue
  }),
  here: new RateLimiter({
    maxRequests: 10,   // Allow 10 requests
    timeWindow: 10000, // Per 10 seconds
  })
};

/**
 * Execute a function with rate limiting
 * @param service The API service to rate limit
 * @param fn The function to execute
 * @returns The result of the function
 */
export async function withRateLimit<T>(service: string, fn: () => Promise<T>): Promise<T> {
  const limiter = rateLimiters[service] ||
    new RateLimiter({ maxRequests: 10, timeWindow: 10000 });

  try {
    // Wait for rate limit permit
    await limiter.acquire();

    // Execute the function
    return await fn();
  } finally {
    // Release the permit
    limiter.release();
  }
}