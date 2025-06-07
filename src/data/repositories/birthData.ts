import { BirthData } from '@/data/types/index';
import { getSupabaseClient, withSupabaseErrorHandling } from '@/data/supabase/client';
import { cacheService } from '@/data/services/cache';
import { ValidationError } from '@/data/types/errors';

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const CACHE_KEY_PREFIX = 'birth_data_';

export class BirthDataRepository {
  async save(data: BirthData): Promise<BirthData> {
    this.validateBirthData(data);
    
    const saved = await withSupabaseErrorHandling<BirthData>(async () => {
      return getSupabaseClient()
        .from('birth_data')
        .upsert(data)
        .select()
        .single();
    });

    // Update cache
    if (saved) {
      cacheService.set(`${CACHE_KEY_PREFIX}${saved.user_id}`, saved, CACHE_TTL);
    }

    return saved;
  }

  async getByUserId(userId: string): Promise<BirthData | null> {
    // Try cache first
    const cached = cacheService.get<BirthData>(`${CACHE_KEY_PREFIX}${userId}`);
    if (cached) return cached;

    // If not in cache, get from database
    const data = await withSupabaseErrorHandling<BirthData | null>(async () => {
      return getSupabaseClient()
        .from('birth_data')
        .select('*')
        .eq('user_id', userId)
        .single();
    });

    // Update cache
    if (data) {
      cacheService.set(`${CACHE_KEY_PREFIX}${userId}`, data, CACHE_TTL);
    }

    return data;
  }

  private validateBirthData(data: BirthData): void {
    if (!data.name) throw new ValidationError('Name is required');
    if (!data.birthdate) throw new ValidationError('Birth date is required');
    if (!data.birthtime) throw new ValidationError('Birth time is required');
    if (!data.location) throw new ValidationError('Location is required');
    if (!data.timezone) throw new ValidationError('Timezone is required');
    if (!data.user_id) throw new ValidationError('User ID is required');
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthdate)) {
      throw new ValidationError('Birth date must be in YYYY-MM-DD format');
    }

    // Validate time format
    if (!/^\d{2}:\d{2}:\d{2}$/.test(data.birthtime)) {
      throw new ValidationError('Birth time must be in HH:MM:SS format');
    }

    // Validate location
    if (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
      throw new ValidationError('Location must have valid latitude and longitude');
    }
  }
}

// Create a singleton instance
export const birthDataRepository = new BirthDataRepository(); 