/**
 * Server-only in-memory LRU/TTL cache with in-flight request deduplication.
 * Eliminates redundant outbound HTTP roundtrips to JioSaavn, YouTube, and Deezer,
 * and shields against upstream rate limits or transient network latency.
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry as CacheEntry<unknown>);
    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Fetches data with transparent caching and concurrent promise deduplication.
   * If 5 requests arrive at the same time for the same key, only 1 outbound
   * fetch is performed and all 5 share the result.
   */
  async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const pending = this.inFlight.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        if (result !== null && result !== undefined) {
          this.set(key, result, ttlSeconds);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise as Promise<unknown>);
    return fetchPromise;
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }
}

// Global singleton to persist across HMR re-evaluations in development
const globalRef = globalThis as typeof globalThis & {
  __sonaraServerCache__?: MemoryCache;
};

export const serverCache = (globalRef.__sonaraServerCache__ ??= new MemoryCache(600));

/** Predefined cache TTL windows in seconds */
export const CACHE_TTL = {
  ALBUM_DETAILS: 3600,       // 1 hour: album tracklists are fixed
  STREAM_URL: 7200,          // 2 hours: CDN URLs stay valid
  ARTIST_PROFILE: 1800,      // 30 minutes: follower count, bio, albums
  SEARCH_RESULTS: 300,       // 5 minutes: track / album searches
  SUGGESTIONS: 600,          // 10 minutes: query completions
  TRENDING: 900,             // 15 minutes: charts & featured rails
};
