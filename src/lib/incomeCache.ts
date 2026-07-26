// Shared in-memory cache for income API queries
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export function getCached(key: string) {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

export function setCache(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() });
}

export function clearUserCache(userId: string) {
  for (const key of queryCache.keys()) {
    if (key.endsWith('|' + userId)) queryCache.delete(key);
  }
}
