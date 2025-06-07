import { supabase } from './supabase';
import { BirthData } from '../types';

export async function saveBirthData(data: BirthData) {
  const { data: inserted, error } = await supabase
    .from('birth_data')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return inserted;
}

export async function getBirthData(user_id: string) {
  const { data, error } = await supabase
    .from('birth_data')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) throw error;
  return data;
}
