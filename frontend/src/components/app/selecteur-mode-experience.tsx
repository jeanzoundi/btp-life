'use client';

import { usePathname, useRouter } from 'next/navigation';
import { adresseMonde, lieuDuMonde, pageClassique } from '@/lib/liens-modes';
import { routeAccueilPourMode, useModeExperienceStore, type ModeExperience } from '@/lib/mode-experience-store';

export function SelecteurModeExperience({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const chemin = usePathname();
  const mode = useModeExperienceStore((state) => state.mode);
  const setMode = useModeExperienceStore((state) => state.setMode);
  const lieuMonde = useModeExperienceStore((state) => state.lieuMonde);

  // On change de mode sans changer d'endroit : la banque du monde ouvre la page de la banque, les offres d'emploi
  // ouvrent l'Agence des talents dans le monde.
  function choisir(prochainMode: ModeExperience) {
    setMode(prochainMode);
    const dansLeMonde = chemin?.startsWith('/app/monde');
    if (prochainMode === 'classique') router.push(dansLeMonde && lieuMonde ? pageClassique(lieuMonde) : routeAccueilPourMode('classique'));
    else router.push(dansLeMonde ? routeAccueilPourMode('monde') : adresseMonde(lieuDuMonde(chemin)));
  }

  return (
    <div
      className={`flex items-center rounded-2xl border p-1 shadow-lg backdrop-blur-xl ${
        compact ? 'border-white/20 bg-[#10262b]/90' : 'border-pierre bg-white/90'
      }`}
      role="group"
      aria-label="Mode d’expérience"
    >
      <button
        type="button"
        onClick={() => choisir('monde')}
        aria-label="Mode Monde vivant"
        aria-pressed={mode === 'monde'}
        className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
          mode === 'monde'
            ? 'bg-terracotta text-white shadow-md'
            : compact
              ? 'text-white/65 hover:bg-white/10 hover:text-white'
              : 'text-graphite/55 hover:bg-pierre/60 hover:text-graphite'
        }`}
      >
        🌍 <span className={compact ? 'hidden sm:inline' : ''}>Monde vivant</span>
      </button>
      <button
        type="button"
        onClick={() => choisir('classique')}
        aria-label="Mode Classique"
        aria-pressed={mode === 'classique'}
        className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
          mode === 'classique'
            ? 'bg-graphite text-white shadow-md'
            : compact
              ? 'text-white/65 hover:bg-white/10 hover:text-white'
              : 'text-graphite/55 hover:bg-pierre/60 hover:text-graphite'
        }`}
      >
        ▦ <span className={compact ? 'hidden sm:inline' : ''}>Classique</span>
      </button>
    </div>
  );
}
