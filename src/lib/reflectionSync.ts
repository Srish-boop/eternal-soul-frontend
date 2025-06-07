import { supabase } from './supabase';
import { Reflection } from '../types';

export async function saveReflections(reflections: Reflection[], user_id: string) {
  const reflectionsWithUser = reflections.map(r => ({
    ...r,
    user_id,
    score: typeof r.score === 'string' ? parseInt(r.score) : r.score, // ✅ Force integer
  }));

  const { data, error } = await supabase
    .from('reflections')
    .insert(reflectionsWithUser);

  if (error) throw error;
  return data;
}

export async function getReflections(user_id: string) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', user_id);

  if (error) throw error;
  return data;
}
