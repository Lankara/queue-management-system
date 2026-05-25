'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function useAuthRedirect(requireAuth: boolean) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (requireAuth && !accessToken) {
      router.replace('/login');
    }

    if (!requireAuth && accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, requireAuth, router]);

  return { accessToken };
}
