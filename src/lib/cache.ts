// ========================================
// ETERNAL SOUL - COMPREHENSIVE CACHING SYSTEM
// ========================================

// 🎯 Multi-layer caching for optimal performance:
// 1. Memory Cache - Fastest, for current session
// 2. LocalStorage - Persistent, for user data
// 3. SessionStorage - Tab-specific, for calculations
// 4. IndexedDB - Large data, for chart data

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
}

export interface ChartData {
  planets: any[];
  scores: Record<string, number>;
  insights: any[];
  calculatedAt: number;
  userId: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  birthData?: {
    date: string;
    time: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  chartData?: ChartData;
}

// ========================================
// 1. MEMORY CACHE (Fastest - Current Session)
// ========================================

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Prevent memory bloat

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Default 5 minutes TTL
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs,
      version: '1.0.0'
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ========================================
// 2. LOCALSTORAGE CACHE (Persistent)
// ========================================

class LocalStorageCache {
  private prefix = 'eternal_soul_';
  private version = '1.0.0';

  set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    // Default 24 hours TTL
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttlMs,
        version: this.version
      };
      
      localStorage.setItem(
        this.prefix + key, 
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('LocalStorage cache write failed:', error);
      // Storage might be full, clear old entries
      this.clearExpired();
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check version compatibility
      if (entry.version !== this.version) {
        this.delete(key);
        return null;
      }
      
      // Check expiry
      if (Date.now() > entry.expiry) {
        this.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('LocalStorage cache read failed:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clearExpired(): void {
    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            if (Date.now() > entry.expiry || entry.version !== this.version) {
              keysToDelete.push(key);
            }
          }
        } catch {
          keysToDelete.push(key);
        }
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
  }

  clear(): void {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
  }
}

// ========================================
// 3. CHART DATA CACHE (Specialized)
// ========================================

class ChartDataCache {
  private memoryCache = new MemoryCache();
  private localStorage = new LocalStorageCache();

  // Generate cache key from birth data
  private generateKey(birthData: any): string {
    const { date, time, lat, lon, timezone } = birthData;
    return `chart_${date}_${time}_${lat}_${lon}_${timezone}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  async cacheChartData(birthData: any, chartData: ChartData): Promise<void> {
    const key = this.generateKey(birthData);
    
    // Cache in memory for immediate access
    this.memoryCache.set(key, chartData, 30 * 60 * 1000); // 30 minutes
    
    // Cache in localStorage for persistence
    this.localStorage.set(key, chartData, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  async getChartData(birthData: any): Promise<ChartData | null> {
    const key = this.generateKey(birthData);
    
    // Try memory first (fastest)
    let chartData = this.memoryCache.get<ChartData>(key);
    if (chartData) return chartData;
    
    // Try localStorage
    chartData = this.localStorage.get<ChartData>(key);
    if (chartData) {
      // Re-cache in memory for next access
      this.memoryCache.set(key, chartData, 30 * 60 * 1000);
      return chartData;
    }
    
    return null;
  }

  clearUserChartData(userId: string): void {
    // This is more complex with current key structure
    // Consider implementing if needed
    this.memoryCache.clear();
  }
}

// ========================================
// 4. USER PROFILE CACHE
// ========================================

class UserProfileCache {
  private localStorage = new LocalStorageCache();
  private memoryCache = new MemoryCache();

  async cacheUserProfile(profile: UserProfile): Promise<void> {
    const key = `user_profile_${profile.id}`;
    
    // Cache in memory for immediate access
    this.memoryCache.set(key, profile, 60 * 60 * 1000); // 1 hour
    
    // Cache in localStorage for persistence
    this.localStorage.set(key, profile, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const key = `user_profile_${userId}`;
    
    // Try memory first
    let profile = this.memoryCache.get<UserProfile>(key);
    if (profile) return profile;
    
    // Try localStorage
    profile = this.localStorage.get<UserProfile>(key);
    if (profile) {
      // Re-cache in memory
      this.memoryCache.set(key, profile, 60 * 60 * 1000);
      return profile;
    }
    
    return null;
  }

  clearUserProfile(userId: string): void {
    const key = `user_profile_${userId}`;
    this.localStorage.delete(key);
    this.memoryCache.clear(); // Clear all memory cache for simplicity
  }
}

// ========================================
// 5. API RESPONSE CACHE
// ========================================

class ApiResponseCache {
  private memoryCache = new MemoryCache();
  private localStorage = new LocalStorageCache();

  async cacheApiResponse(endpoint: string, params: any, response: any, ttlMs: number = 10 * 60 * 1000): Promise<void> {
    const key = this.generateApiKey(endpoint, params);
    
    // Short-term memory cache
    this.memoryCache.set(key, response, ttlMs);
    
    // Longer-term localStorage cache for expensive operations
    if (endpoint.includes('score-natal') || endpoint.includes('generate-reflections')) {
      this.localStorage.set(key, response, 2 * 60 * 60 * 1000); // 2 hours
    }
  }

  async getApiResponse(endpoint: string, params: any): Promise<any | null> {
    const key = this.generateApiKey(endpoint, params);
    
    // Try memory first
    let response = this.memoryCache.get(key);
    if (response) return response;
    
    // Try localStorage for expensive operations
    if (endpoint.includes('score-natal') || endpoint.includes('generate-reflections')) {
      response = this.localStorage.get(key);
      if (response) {
        // Re-cache in memory
        this.memoryCache.set(key, response, 10 * 60 * 1000);
        return response;
      }
    }
    
    return null;
  }

  private generateApiKey(endpoint: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = this.simpleHash(endpoint + paramString);
    return `api_${endpoint.replace(/\//g, '_')}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// ========================================
// 6. UNIFIED CACHE MANAGER
// ========================================

export class CacheManager {
  public chartData = new ChartDataCache();
  public userProfile = new UserProfileCache();
  public apiResponse = new ApiResponseCache();
  private localStorage = new LocalStorageCache();
  private memoryCache = new MemoryCache();

  // Quick access methods
  async cacheUserData(userId: string, profile: UserProfile, chartData?: ChartData): Promise<void> {
    await this.userProfile.cacheUserProfile(profile);
    
    if (chartData && profile.birthData) {
      await this.chartData.cacheChartData(profile.birthData, chartData);
    }
  }

  async getUserData(userId: string): Promise<{ profile: UserProfile | null, chartData: ChartData | null }> {
    const profile = await this.userProfile.getUserProfile(userId);
    let chartData: ChartData | null = null;
    
    if (profile?.birthData) {
      chartData = await this.chartData.getChartData(profile.birthData);
    }
    
    return { profile, chartData };
  }

  // Cache statistics and management
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      chartDataKeys: [],
      userProfileKeys: [],
      timestamp: Date.now()
    };
  }

  clearAllCaches(): void {
    this.memoryCache.clear();
    this.localStorage.clear();
  }

  clearExpiredCaches(): void {
    this.localStorage.clearExpired();
  }

  // Preload critical data
  async preloadUserData(userId: string): Promise<void> {
    try {
      const { profile, chartData } = await this.getUserData(userId);
      
      if (profile) {
        console.log('✅ User profile loaded from cache');
      }
      
      if (chartData) {
        console.log('✅ Chart data loaded from cache');
      }
    } catch (error) {
      console.warn('Preload user data failed:', error);
    }
  }
}

// ========================================
// 7. GLOBAL CACHE INSTANCE
// ========================================

export const cacheManager = new CacheManager();

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  // Clean expired caches on app load
  cacheManager.clearExpiredCaches();
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(() => {
    cacheManager.clearExpiredCaches();
  }, 30 * 60 * 1000);
  
  // Clean up caches when tab is being closed
  window.addEventListener('beforeunload', () => {
    cacheManager.clearExpiredCaches();
  });
} 