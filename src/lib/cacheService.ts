/**
 * Simple in-memory cache for dataset queries
 * Reduces repeated Firestore reads for the same user
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Set a cache entry with optional TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a cached entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists in cache and is still valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for debugging
   */
  size(): number {
    return this.cache.size;
  }
}

// Create global singleton instance
export const queryCache = new QueryCache();

/**
 * Generate a cache key for dataset queries
 */
export function getDatasetsCacheKey(userId: string, pageSize?: number): string {
  return `datasets_${userId}_${pageSize || 'all'}`;
}

/**
 * Generate a cache key for filtered dataset queries
 */
export function getFilteredDatasetsCacheKey(userId: string, filterType: string): string {
  return `datasets_${userId}_${filterType}`;
}
