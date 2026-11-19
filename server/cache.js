// server/cache.js
/**
 * Simple in-memory cache with Time-To-Live (TTL) support.
 * Prevents redundant external calls to free APIs (Nominatim, Overpass, OCM).
 */
class MemoryCache {
  constructor(defaultTTLMs = 15 * 60 * 1000) { // default 15 minutes
    this.cache = new Map();
    this.defaultTTLMs = defaultTTLMs;

    // Periodically remove expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlMs = this.defaultTTLMs) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
      cachedAt: new Date().toISOString()
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 20)
    };
  }
}

export const globalCache = new MemoryCache();
