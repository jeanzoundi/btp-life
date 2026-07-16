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
  // zustand/persist rehydrate le localStorage de façon asynchrone : sur un premier rendu (donc
  // à chaque rechargement complet — systématique dans une PWA installée), accessToken vaut
  // encore null avant que ce flag ne passe à true. Sans lui, un garde de route qui redirige dès
  // que accessToken est absent renvoie un utilisateur connecté vers /connexion à chaque refresh.
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setSession: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'btp-life-auth',
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
