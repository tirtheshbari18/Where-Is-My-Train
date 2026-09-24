interface CacheItem<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Default TTL in seconds (configurable via CACHE_TTL_SECONDS env)
   */
  private defaultTtlSeconds: number;

  constructor() {
    this.defaultTtlSeconds = parseInt(
      process.env.CACHE_TTL_SECONDS || '60',
      10
    );
  }

  get<T>(key: string): { data: T | null; isStale: boolean; ageSeconds: number } {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return { data: null, isStale: false, ageSeconds: 0 };
    }

    const now = Date.now();
    const ageSeconds = Math.round((now - item.storedAt) / 1000);
    const isStale = now > item.expiresAt;

    this.hits++;
    return {
      data: item.value as T,
      isStale,
      ageSeconds,
    };
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + ttl * 1000,
      storedAt: now,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRatio: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    };
  }
}

export const cacheService = new CacheService();
