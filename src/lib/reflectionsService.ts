import { getSupabaseClient } from '@/data/supabase/client';
import { Reflection } from '@/data/types';

export async function saveReflections(reflections: Reflection[], user_id: string) {
  const { data, error } = await getSupabaseClient()
    .from('reflections')
    .insert(
      reflections.map(r => ({
        ...r,
        user_id,
        score: typeof r.score === 'string' ? parseInt(r.score) : r.score,
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

export async function getReflections(user_id: string) {
  const { data, error } = await getSupabaseClient()
    .from('reflections')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
} 