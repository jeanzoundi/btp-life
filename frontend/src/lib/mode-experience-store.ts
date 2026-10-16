'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModeExperience = 'monde' | 'classique';

interface ModeExperienceState {
  mode: ModeExperience;
  hasHydrated: boolean;
  setMode: (mode: ModeExperience) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useModeExperienceStore = create<ModeExperienceState>()(
  persist(
    (set) => ({
      // Le monde vivant est l'expérience principale. Le tableau classique reste disponible.
      mode: 'monde',
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
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
