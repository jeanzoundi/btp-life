'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  pseudo?: string | null;
  role: string;
  adminSubRole?: string | null;
  plan: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'btp-life-auth' },
  ),
);
