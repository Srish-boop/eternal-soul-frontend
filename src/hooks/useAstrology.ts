// ========================================
// ASTROLOGY HOOKS WITH CACHING
// ========================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys, cacheWarming } from '@/lib/queryClient';
import { cacheManager, ChartData, UserProfile } from '@/lib/cache';
import { useCallback, useEffect } from 'react';

// ========================================
// 1. NATAL CHART HOOK
// ========================================

export function useNatalChart(birthData: any, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.astrology.natal(birthData),
    queryFn: async (): Promise<ChartData> => {
      // Check cache first
      const cachedData = await cacheManager.chartData.getChartData(birthData);
      if (cachedData) {
        console.log('🎯 Natal chart loaded from cache');
        return cachedData;
      }

      // Fetch from API
      console.log('🌐 Fetching natal chart from API');
      const response = await apiClient.post('/score-natal', birthData);
      
      // Create chart data structure
      const chartData: ChartData = {
        planets: response.planets || [],
        scores: response.scores || {},
        insights: response.insights || [],
        calculatedAt: Date.now(),
        userId: response.userId || 'unknown'
      };

      // Cache the result
      await cacheManager.chartData.cacheChartData(birthData, chartData);
      
      return chartData;
    },
    enabled: options?.enabled !== false && !!birthData,
    staleTime: 30 * 60 * 1000, // 30 minutes - natal charts rarely change
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory longer
    retry: 2,
  });
}

// ========================================
// 2. TRANSIT SCORING HOOK
// ========================================

export function useTransitScoring(natalData: any, transitData: any, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.astrology.transit(natalData, transitData),
    queryFn: async () => {
      console.log('🌐 Fetching transit scores from API');
      const response = await apiClient.post('/score-transit', {
        natal: natalData,
        transit: transitData
      });
      
      // Cache API response
      await cacheManager.apiResponse.cacheApiResponse(
        'score-transit',
        { natal: natalData, transit: transitData },
        response,
        60 * 60 * 1000 // 1 hour TTL for transit data
      );
      
      return response;
    },
    enabled: options?.enabled !== false && !!natalData && !!transitData,
    staleTime: 10 * 60 * 1000, // 10 minutes - transits change more frequently
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
  });
}

// ========================================
// 3. COMPATIBILITY HOOK
// ========================================

export function useCompatibility(userA: any, userB: any, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.astrology.compatibility(userA, userB),
    queryFn: async () => {
      console.log('🌐 Fetching compatibility analysis from API');
      const response = await apiClient.post('/compare-users', {
        userA,
        userB
      });
      
      // Cache compatibility result
      await cacheManager.apiResponse.cacheApiResponse(
        'compare-users',
        { userA, userB },
        response,
        4 * 60 * 60 * 1000 // 4 hours TTL for compatibility
      );
      
      return response;
    },
    enabled: options?.enabled !== false && !!userA && !!userB,
    staleTime: 60 * 60 * 1000, // 1 hour - compatibility is relatively stable
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });
}

// ========================================
// 4. AI INSIGHTS HOOK
// ========================================

export function useAIInsights(chartData: ChartData, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ai.insights(chartData),
    queryFn: async () => {
      console.log('🌐 Fetching AI insights from API');
      const response = await apiClient.post('/generate-reflections', {
        chartData: chartData
      });
      
      // Cache AI insights
      await cacheManager.apiResponse.cacheApiResponse(
        'generate-reflections',
        { chartData },
        response,
        2 * 60 * 60 * 1000 // 2 hours TTL for AI content
      );
      
      return response;
    },
    enabled: options?.enabled !== false && !!chartData,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    retry: 1, // AI calls are expensive, limit retries
  });
}

// ========================================
// 5. USER PROFILE HOOK
// ========================================

export function useUserProfile(userId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: async (): Promise<UserProfile | null> => {
      // Check cache first
      const cachedProfile = await cacheManager.userProfile.getUserProfile(userId);
      if (cachedProfile) {
        console.log('🎯 User profile loaded from cache');
        return cachedProfile;
      }

      // Fetch from Supabase (this would be implemented in your existing auth system)
      console.log('🌐 Fetching user profile from database');
      // This would integrate with your existing Supabase queries
      
      return null; // Placeholder - integrate with your existing user fetching
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Cache warm-up effect
  useEffect(() => {
    if (query.data && userId) {
      cacheManager.userProfile.cacheUserProfile(query.data);
    }
  }, [query.data, userId]);

  return query;
}

// ========================================
// 6. OPTIMISTIC MUTATIONS
// ========================================

export function useSaveBirthData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birthData: any) => {
      // Save to database first
      const response = await apiClient.post('/save-birth-data', birthData);
      return response;
    },
    onMutate: async (newBirthData) => {
      // Optimistically update cache
      const userId = newBirthData.userId;
      if (userId) {
        const existingProfile = await cacheManager.userProfile.getUserProfile(userId);
        if (existingProfile) {
          const updatedProfile: UserProfile = {
            ...existingProfile,
            birthData: newBirthData
          };
          
          // Update cache immediately
          await cacheManager.userProfile.cacheUserProfile(updatedProfile);
          
          // Update React Query cache
          queryClient.setQueryData(queryKeys.user.profile(userId), updatedProfile);
        }
      }
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      const userId = variables.userId;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });
      }
    },
    onSuccess: (data, variables) => {
      // Warm cache for new astrology calculations
      if (variables.birthData) {
        cacheWarming.warmAstrologyCache(variables.birthData);
      }
    },
  });
}

// ========================================
// 7. CACHE MANAGEMENT HOOKS
// ========================================

export function useCacheStats() {
  const queryClient = useQueryClient();

  const getCacheStats = useCallback(() => {
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
  }, [queryClient]);

  const clearCache = useCallback(async () => {
    await queryClient.clear();
    cacheManager.clearAllCaches();
    console.log('🧹 All caches cleared');
  }, [queryClient]);

  const clearExpiredCache = useCallback(() => {
    cacheManager.clearExpiredCaches();
    console.log('🧹 Expired caches cleared');
  }, []);

  return {
    getCacheStats,
    clearCache,
    clearExpiredCache,
  };
}

// ========================================
// 8. CACHE PRELOADING HOOK
// ========================================

export function useCachePreloader() {
  const queryClient = useQueryClient();

  const preloadUserData = useCallback(async (userId: string) => {
    await cacheWarming.warmUserCache(userId);
  }, []);

  const preloadChartData = useCallback(async (birthData: any) => {
    await cacheWarming.warmAstrologyCache(birthData);
  }, []);

  const preloadCompatibility = useCallback(async (userA: any, userB: any) => {
    const queryKey = queryKeys.astrology.compatibility(userA, userB);
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const cachedResult = await cacheManager.apiResponse.getApiResponse(
          'compare-users',
          { userA, userB }
        );
        return cachedResult;
      },
    });
  }, [queryClient]);

  return {
    preloadUserData,
    preloadChartData,
    preloadCompatibility,
  };
}

// ========================================
// 9. SMART PREFETCHING
// ========================================

export function useSmartPrefetch() {
  const { preloadChartData, preloadCompatibility } = useCachePreloader();

  // Prefetch related data when user enters birth data
  const prefetchOnBirthData = useCallback(async (birthData: any) => {
    // Prefetch natal chart
    await preloadChartData(birthData);
    
    // Prefetch current transits (you'd implement this)
    const currentDate = new Date();
    const transitData = {
      date: currentDate.toISOString().split('T')[0],
      time: '12:00',
      lat: 0,
      lon: 0,
      timezone: '+00:00'
    };
    
    // This would trigger transit calculation prefetch
    console.log('🔮 Prefetching transit data for current date');
  }, [preloadChartData]);

  // Prefetch compatibility when viewing another user
  const prefetchCompatibilityForUser = useCallback(async (currentUser: any, targetUser: any) => {
    await preloadCompatibility(currentUser, targetUser);
  }, [preloadCompatibility]);

  return {
    prefetchOnBirthData,
    prefetchCompatibilityForUser,
  };
} 