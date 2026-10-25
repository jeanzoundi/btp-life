'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModeExperience = 'monde' | 'classique';

interface ModeExperienceState {
  mode: ModeExperience;
  hasHydrated: boolean;
  /** Le lieu du monde vivant où se trouve le joueur (dedans, ou devant avec sa fiche ouverte) : la bascule vers le
   * mode classique ouvre sa page. Non sauvegardé. */
  lieuMonde: string | null;
  setMode: (mode: ModeExperience) => void;
  setHasHydrated: (value: boolean) => void;
  setLieuMonde: (slug: string | null) => void;
}

export const useModeExperienceStore = create<ModeExperienceState>()(
  persist(
    (set) => ({
      // Le monde vivant est l'expérience principale. Le tableau classique reste disponible.
      mode: 'monde',
      hasHydrated: false,
      lieuMonde: null,
      setMode: (mode) => set({ mode }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setLieuMonde: (lieuMonde) => set({ lieuMonde }),
    }),
    {
      name: 'btp-life-mode-experience',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

export function routeAccueilPourMode(mode: ModeExperience) {
  return mode === 'monde' ? '/app/monde' : '/app';
}
