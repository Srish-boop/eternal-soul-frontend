'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('birth_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        router.push('/compass');
      } else {
        router.push('/birthdata');
      }
    };

    checkUser();
  }, []);

  return <p className="text-white text-center mt-20">🔄 Logging you in...</p>;
}
