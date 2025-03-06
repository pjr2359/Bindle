// lib/api/cache.ts
/**
 * Enhanced caching solution with LRU (Least Recently Used) cache eviction policy
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
  lastAccessed: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get an item from the cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time
    item.lastAccessed = Date.now();
    return item.data;
  }

  /**
   * Set an item in the cache
   */
  set(key: string, data: T, ttl: number): void {
    // Evict items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttl * 1000),
      lastAccessed: Date.now()
    });
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all expired items
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the least recently used item
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestKey = key;
        oldestTime = value.lastAccessed;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Create separate caches for different types of data
const caches: Record<string, LRUCache<any>> = {
  api: new LRUCache<any>(200),
  location: new LRUCache<any>(100),
  route: new LRUCache<any>(50)
};

/**
 * Create a consistent cache key from parameters
 */
export function createCacheKey(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .sort()
    .join('|');
}

/**
 * Execute an API request with caching
 * 
 * @param params Object with parameters to create the cache key
 * @param fetchFn Function that performs the actual API request
 * @param ttl Time-to-live in seconds (default: 1 hour)
 * @param cacheType Which cache to use (api, location, route)
 */
export async function cachedApiRequest<T>(
  params: Record<string, any>,
  fetchFn: () => Promise<T>,
  ttl = 3600, // default TTL is 1 hour in seconds
  cacheType = 'api'
): Promise<T> {
  // Get the appropriate cache
  const cache = caches[cacheType] || caches.api;

  // Create a cache key from params
  const cacheKey = createCacheKey(params);

  // Check if we have a cached result
  const cachedResult = cache.get(cacheKey);
  if (cachedResult !== null) {
    console.log(`Cache hit for ${cacheType}: ${cacheKey.substring(0, 50)}...`);
    return cachedResult;
  }

  console.log(`Cache miss for ${cacheType}: ${cacheKey.substring(0, 50)}...`);

  // Execute the fetch function to get fresh data
  try {
    const result = await fetchFn();

    // Cache the result
    cache.set(cacheKey, result, ttl);

    return result;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
}

// Schedule cleanup of expired entries
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

if (typeof window !== 'undefined') {
  // Only run in browser environment
  setInterval(() => {
    for (const cache of Object.values(caches)) {
      cache.clearExpired();
    }
  }, CLEANUP_INTERVAL);
}