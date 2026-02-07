/**
 * Performance Optimization Utilities
 * Implements caching strategies, request deduplication, and data batching
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly requestTimeout = 30000; // 30 seconds

  /**
   * Execute a request only once, return cached promise for duplicate requests
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { timeout?: number }
  ): Promise<T> {
    const now = Date.now();
    const timeout = options?.timeout || this.requestTimeout;

    // Check if there's already a pending request
    const pending = this.pendingRequests.get(key);
    if (pending && now - pending.timestamp < timeout) {
      console.log(`📌 Returning cached promise for request: ${key}`);
      return pending.promise;
    }

    // Remove expired pending request
    if (pending && now - pending.timestamp >= timeout) {
      this.pendingRequests.delete(key);
    }

    // Execute new request
    const promise = fn();
    this.pendingRequests.set(key, { promise, timestamp: now });

    try {
      const result = await promise;
      return result;
    } catch (error) {
      // Remove failed request from cache so it can be retried
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Clear a specific pending request
   */
  clear(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Batch multiple Firestore queries to reduce latency
 */
export class BatchQueryExecutor {
  private batch: Array<{ key: string; fn: () => Promise<any> }> = [];
  private executing = false;
  private batchDelay = 10; // milliseconds
  private maxBatchSize = 10;

  add<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({
        key,
        fn: async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
      });

      // Execute batch if it reaches max size or hasn't been scheduled
      if (this.batch.length >= this.maxBatchSize && !this.executing) {
        this.executeBatch();
      } else if (!this.executing && this.batch.length === 1) {
        // Schedule batch execution
        setTimeout(() => this.executeBatch(), this.batchDelay);
      }
    });
  }

  private async executeBatch(): Promise<void> {
    if (this.executing || this.batch.length === 0) return;

    this.executing = true;
    const currentBatch = this.batch.splice(0, this.maxBatchSize);

    try {
      await Promise.all(currentBatch.map((item) => item.fn()));
    } finally {
      this.executing = false;

      // Execute next batch if there are more items
      if (this.batch.length > 0) {
        setTimeout(() => this.executeBatch(), this.batchDelay);
      }
    }
  }
}

/**
 * LRU Cache with automatic expiration
 */
export class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    // Remove old entry to re-insert it (for LRU ordering)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, { value, timestamp: Date.now() });

    // Remove oldest entry if cache exceeds max size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global instances
export const requestDeduplicator = new RequestDeduplicator();
export const batchQueryExecutor = new BatchQueryExecutor();

/**
 * Debounce function calls to reduce unnecessary executions
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Progressive data loading - load initial set then more on demand
 */
export async function progressiveLoad<T>(
  fetchFn: (limit: number, offset: number) => Promise<T[]>,
  initialLimit: number = 20,
  onProgress?: (items: T[], isInitial: boolean) => void
): Promise<T[]> {
  try {
    // Load initial batch
    const initial = await fetchFn(initialLimit, 0);
    if (onProgress) {
      onProgress(initial, true);
    }

    // Load remaining in background if needed
    if (initial.length === initialLimit) {
      // Schedule background load
      setTimeout(async () => {
        try {
          const remaining = await fetchFn(initialLimit * 2, initialLimit);
          if (onProgress && remaining.length > 0) {
            onProgress(remaining, false);
          }
        } catch (error) {
          console.warn('Background load failed:', error);
        }
      }, 100);
    }

    return initial;
  } catch (error) {
    console.error('Progressive load failed:', error);
    throw error;
  }
}
