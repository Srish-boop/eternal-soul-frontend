import { CacheItem } from '@/data/types/index';
import { CacheError } from '@/data/types/errors';

export class CacheService {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage = typeof window !== 'undefined' ? window.localStorage : null as any, prefix = 'soul_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const item: CacheItem<T> = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : null,
    };
    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      if (error instanceof Error) {
        throw new CacheError(`Failed to set cache item: ${error.message}`);
      }
      throw new CacheError('Failed to set cache item');
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item) as CacheItem<T>;
      
      if (parsed.expiry && Date.now() > parsed.expiry) {
        this.remove(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      if (error instanceof Error) {
        throw new CacheError(`Failed to get cache item: ${error.message}`);
      }
      throw new CacheError('Failed to get cache item');
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(this.prefix + key);
    } catch (error) {
      if (error instanceof Error) {
        throw new CacheError(`Failed to remove cache item: ${error.message}`);
      }
      throw new CacheError('Failed to remove cache item');
    }
  }

  clear(): void {
    try {
      Object.keys(this.storage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new CacheError(`Failed to clear cache: ${error.message}`);
      }
      throw new CacheError('Failed to clear cache');
    }
  }
}

// Create a singleton instance
export const cacheService = new CacheService(); 