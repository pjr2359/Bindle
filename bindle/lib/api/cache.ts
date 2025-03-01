// lib/api/cache.ts
const cache = new Map<string, { data: any, expiry: number }>();

export function createCacheKey(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}:${value}`)
    .sort()
    .join('|');
}

export async function cachedApiRequest<T>(
  params: Record<string, any>,
  fetchFn: () => Promise<T>,
  ttl = 3600 // default TTL is 1 hour in seconds
): Promise<T> {
  const cacheKey = createCacheKey(params);
  const cachedItem = cache.get(cacheKey);

  // Return cached result if it exists and is not expired
  if (cachedItem && Date.now() < cachedItem.expiry) {
    return cachedItem.data;
  }

  // Execute the fetch function to get fresh data
  const result = await fetchFn();

  // Cache the result
  cache.set(cacheKey, {
    data: result,
    expiry: Date.now() + (ttl * 1000)
  });

  return result;
}

// Clean up expired items occasionally
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiry) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour