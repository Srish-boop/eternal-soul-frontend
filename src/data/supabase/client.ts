import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../types/errors';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new DatabaseError('Supabase configuration is missing');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}

// Helper function to check if an error is from Supabase
export function isSupabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'message' in error && typeof (error as { message: unknown }).message === 'string';
}

// Wrapper for error handling
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  try {
    const { data, error } = await operation();
    if (error) {
      const message = isSupabaseError(error) ? (error as { message: string }).message : 'Unknown database error';
      throw new DatabaseError(message);
    }
    if (!data) throw new DatabaseError('No data returned');
    return data;
  } catch (error) {
    if (isSupabaseError(error)) {
      throw new DatabaseError((error as { message: string }).message);
    }
    throw new DatabaseError('An unexpected error occurred');
  }
} 