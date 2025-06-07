import { Reflection, LifeArea } from '@/data/types/index';
import { getSupabaseClient, withSupabaseErrorHandling } from '@/data/supabase/client';
import { cacheService } from '@/data/services/cache';
import { ValidationError } from '@/data/types/errors';

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const CACHE_KEY_PREFIX = 'reflections_';

export class ReflectionsRepository {
  async save(reflections: Reflection[]): Promise<Reflection[]> {
    reflections.forEach(this.validateReflection);
    
    const saved = await withSupabaseErrorHandling<Reflection[]>(async () => {
      return getSupabaseClient()
        .from('reflections')
        .upsert(reflections)
        .select();
    });

    // Update cache for each user's reflections
    const userIds = [...new Set(reflections.map(r => r.user_id))];
    userIds.forEach(userId => {
      const userReflections = saved.filter(r => r.user_id === userId);
      cacheService.set(`${CACHE_KEY_PREFIX}${userId}`, userReflections, CACHE_TTL);
    });

    return saved;
  }

  async getByUserId(userId: string): Promise<Reflection[]> {
    // Try cache first
    const cached = cacheService.get<Reflection[]>(`${CACHE_KEY_PREFIX}${userId}`);
    if (cached) return cached;

    // If not in cache, get from database
    const data = await withSupabaseErrorHandling<Reflection[]>(async () => {
      return getSupabaseClient()
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    });

    // Update cache
    if (data) {
      cacheService.set(`${CACHE_KEY_PREFIX}${userId}`, data, CACHE_TTL);
    }

    return data;
  }

  async getByLifeArea(userId: string, lifeArea: LifeArea): Promise<Reflection[]> {
    const allReflections = await this.getByUserId(userId);
    return allReflections.filter(r => r.life_area === lifeArea);
  }

  private validateReflection(reflection: Reflection): void {
    if (!reflection.user_id) throw new ValidationError('User ID is required');
    if (!reflection.life_area) throw new ValidationError('Life area is required');
    if (!Object.values(LifeArea).includes(reflection.life_area)) {
      throw new ValidationError('Invalid life area');
    }
    if (typeof reflection.score !== 'number' || reflection.score < 0 || reflection.score > 10) {
      throw new ValidationError('Score must be a number between 0 and 10');
    }
    if (!reflection.insight) throw new ValidationError('Insight is required');
  }
}

// Create a singleton instance
export const reflectionsRepository = new ReflectionsRepository(); 