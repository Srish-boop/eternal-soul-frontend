'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/data/supabase/client';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Exchange the code for a session
        const { error } = await supabase.auth.getSession();
        
        if (error) throw error;

        // Redirect to birthdata page on successful login
        router.push('/birthdata');
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>Logging you in...</p>
      </div>
    </main>
  );
} 