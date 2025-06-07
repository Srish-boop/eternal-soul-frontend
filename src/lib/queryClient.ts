// ========================================
// REACT QUERY CLIENT - ASTROLOGY APP
// ========================================

import { QueryClient } from '@tanstack/react-query';
import { cacheManager } from './cache';

// ========================================
// QUERY CLIENT CONFIGURATION
// ========================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🎯 Smart caching strategy based on data type
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true, // Refetch when coming back online
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

// ========================================
// QUERY KEYS - ORGANIZED & TYPED
// ========================================

export const queryKeys = {
  // User-related queries
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    chartData: (userId: string) => ['user', 'chartData', userId] as const,
    reflections: (userId: string) => ['user', 'reflections', userId] as const,
  },
  
  // Astrology calculations
  astrology: {
    natal: (birthData: any) => ['astrology', 'natal', JSON.stringify(birthData)] as const,
    transit: (natal: any, transit: any) => ['astrology', 'transit', JSON.stringify({natal, transit})] as const,
    compatibility: (userA: any, userB: any) => ['astrology', 'compatibility', JSON.stringify({userA, userB})] as const,
  },
  
  // AI-generated content
  ai: {
    insights: (chartData: any) => ['ai', 'insights', JSON.stringify(chartData)] as const,
    reflections: (scores: any) => ['ai', 'reflections', JSON.stringify(scores)] as const,
  },
} as const;

// ========================================
// CACHE INTEGRATION WITH REACT QUERY
// ========================================

// Custom query client with cache integration
export class CachedQueryClient {
  private client: QueryClient;

  constructor(client: QueryClient) {
    this.client = client;
  }

  // Enhanced query with cache fallback
  async getCachedData<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: {
      staleTime?: number;
      cacheKey?: string;
      cacheTTL?: number;
    }
  ): Promise<T> {
    const cacheKey = options?.cacheKey || queryKey.join('_');
    
    // 1. Try React Query cache first
    const cachedData = this.client.getQueryData<T>(queryKey);
    if (cachedData !== undefined) {
      return cachedData;
    }
    
    // 2. Try our custom cache
    const customCachedData = await cacheManager.apiResponse.getApiResponse(
      queryKey[0] as string,
      queryKey.slice(1)
    );
    if (customCachedData) {
      // Put it back in React Query cache
      this.client.setQueryData(queryKey, customCachedData);
      return customCachedData;
    }
    
    // 3. Fetch fresh data
    const freshData = await queryFn();
    
    // 4. Cache in both systems
    this.client.setQueryData(queryKey, freshData);
    await cacheManager.apiResponse.cacheApiResponse(
      queryKey[0] as string,
      queryKey.slice(1),
      freshData,
      options?.cacheTTL
    );
    
    return freshData;
  }

  // Invalidate both caches
  async invalidateQuery(queryKey: readonly unknown[]): Promise<void> {
    await this.client.invalidateQueries({ queryKey });
    // Note: Custom cache invalidation would need more complex key matching
  }

  // Prefetch with cache awareness
  async prefetchQuery<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: {
      staleTime?: number;
      cacheKey?: string;
    }
  ): Promise<void> {
    // Check if we already have recent data
    const existingData = this.client.getQueryData(queryKey);
    if (existingData) return;

    // Check custom cache
    const cachedData = await cacheManager.apiResponse.getApiResponse(
      queryKey[0] as string,
      queryKey.slice(1)
    );
    
    if (cachedData) {
      this.client.setQueryData(queryKey, cachedData);
      return;
    }

    // Prefetch fresh data
    await this.client.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime,
    });
  }
}

export const cachedQueryClient = new CachedQueryClient(queryClient);

// ========================================
// CACHE WARMING STRATEGIES
// ========================================

export const cacheWarming = {
  // Warm cache for user after login
  async warmUserCache(userId: string): Promise<void> {
    try {
      // Preload user profile
      await cachedQueryClient.prefetchQuery(
        queryKeys.user.profile(userId),
        async () => {
          const { profile } = await cacheManager.getUserData(userId);
          return profile;
        }
      );

      // Preload chart data if available
      const { profile } = await cacheManager.getUserData(userId);
      if (profile?.birthData) {
        await cachedQueryClient.prefetchQuery(
          queryKeys.astrology.natal(profile.birthData),
          async () => {
            const chartData = await cacheManager.chartData.getChartData(profile.birthData!);
            return chartData;
          }
        );
      }

      console.log('🔥 Cache warmed for user:', userId);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },

  // Warm cache for astrology calculations
  async warmAstrologyCache(birthData: any): Promise<void> {
    try {
      await cachedQueryClient.prefetchQuery(
        queryKeys.astrology.natal(birthData),
        async () => {
          return await cacheManager.chartData.getChartData(birthData);
        }
      );
    } catch (error) {
      console.warn('Astrology cache warming failed:', error);
    }
  },
};

// ========================================
// OFFLINE/NETWORK STRATEGIES
// ========================================

export const offlineStrategies = {
  // Handle offline scenarios
  enableOfflineMode(): void {
    queryClient.setDefaultOptions({
      queries: {
        networkMode: 'offlineFirst', // Use cache first when offline
        retry: false, // Don't retry when offline
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: false,
      },
    });
  },

  // Re-enable online mode
  enableOnlineMode(): void {
    queryClient.setDefaultOptions({
      queries: {
        networkMode: 'online',
        retry: 3,
      },
      mutations: {
        networkMode: 'online',
        retry: 1,
      },
    });
  },

  // Background sync when coming back online
  async syncWhenOnline(): Promise<void> {
    await queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  },
};

// ========================================
// CACHE PERFORMANCE MONITORING
// ========================================

export const cacheMetrics = {
  getStats() {
    const reactQueryStats = {
      queries: queryClient.getQueryCache().getAll().length,
      mutations: queryClient.getMutationCache().getAll().length,
    };

    const customCacheStats = cacheManager.getStats();

    return {
      reactQuery: reactQueryStats,
      customCache: customCacheStats,
      timestamp: Date.now(),
    };
  },

  logStats() {
    const stats = this.getStats();
    console.log('📊 Cache Statistics:', stats);
    return stats;
  },

  // Detect cache hit/miss patterns
  monitorCachePerformance() {
    let hits = 0;
    let misses = 0;

    const originalGet = queryClient.getQueryData.bind(queryClient);
    queryClient.getQueryData = function(queryKey: any) {
      const result = originalGet(queryKey);
      if (result !== undefined) {
        hits++;
      } else {
        misses++;
      }
      return result;
    };

    // Log stats every 5 minutes
    setInterval(() => {
      const hitRate = hits / (hits + misses) * 100;
      console.log(`📈 Cache Hit Rate: ${hitRate.toFixed(1)}% (${hits} hits, ${misses} misses)`);
      hits = 0;
      misses = 0;
    }, 5 * 60 * 1000);
  },
};

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  cacheMetrics.monitorCachePerformance();
} 