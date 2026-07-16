'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !accessToken) router.replace('/connexion');
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated || !accessToken) return null;
  return <>{children}</>;
}
