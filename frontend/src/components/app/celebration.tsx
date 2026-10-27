'use client';

import { useCallback, useEffect, useState } from 'react';
import { jouerSon } from '@/lib/sons';

// Les moments gratifiants : niveau gagné, promotion, certificat, équipe formée, premiers pas terminés. N'importe quel
// écran annonce une célébration (celebrer) ; la ville la montre en grand, avec un son, des confettis et de quoi la
// partager. Plusieurs célébrations à la suite passent l'une après l'autre.

export interface Celebration {
  icone: string; titre: string; sousTitre?: string;
  /** Texte à partager (réseaux, messagerie) ; sans lui, pas de bouton de partage. */
  partage?: string;
  son?: 'niveau' | 'badge' | 'succes';
}
const EVENEMENT = 'btp-celebration';
export const DUREE_CELEBRATION_MS = 6_000;

/** Annonce une célébration à la ville (sans effet si elle n'est pas affichée). */
export function celebrer(celebration: Celebration) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<Celebration>(EVENEMENT, { detail: celebration }));
}

/** Ce qui mérite d'être célébré entre deux états du joueur (au chargement, l'état précédent est inconnu : rien). */
export function celebrationsEntre(avant: { niveau?: number; poste?: string; coequipiers?: number } | null, apres: { niveau?: number; poste?: string; coequipiers?: number; avec?: string[] }): Celebration[] {
  if (!avant) return [];
  const liste: Celebration[] = [];
  if (apres.niveau && avant.niveau && apres.niveau > avant.niveau) {
    liste.push({ icone: '⭐', titre: `Niveau ${apres.niveau} !`, sousTitre: 'De nouvelles missions et de nouvelles offres s’ouvrent à toi.', partage: `J’ai atteint le niveau ${apres.niveau} sur BTP Life 🏗️`, son: 'niveau' });
  }
  if (apres.poste && avant.poste && apres.poste !== avant.poste) {
    liste.push({ icone: '🎖️', titre: 'Promotion !', sousTitre: `Te voilà ${apres.poste}.`, partage: `Promu ${apres.poste} sur BTP Life 🏗️`, son: 'badge' });
  }
  if ((apres.coequipiers ?? 0) >= 2 && (avant.coequipiers ?? 0) < 2) {
    liste.push({ icone: '🤝', titre: 'Équipe formée !', sousTitre: `${apres.avec?.length ? `Avec ${apres.avec.join(', ')}. ` : ''}À deux dans le même lieu, chaque séance rapporte +10 % d’XP.`, son: 'succes' });
  }
  return liste;
}

/** La file des célébrations reçues : la première s'affiche, puis la suivante quand elle se ferme (ou au bout de six secondes). */
export function useCelebrations() {
  const [file, setFile] = useState<Celebration[]>([]);
  useEffect(() => {
    const recevoir = (e: Event) => setFile(f => [...f, (e as CustomEvent<Celebration>).detail]);
    window.addEventListener(EVENEMENT, recevoir);
    return () => window.removeEventListener(EVENEMENT, recevoir);
  }, []);
  const fermer = useCallback(() => setFile(f => f.slice(1)), []);
  return { courante: file[0] ?? null, fermer };
}

const COULEURS = ['#E8B84A', '#E8742B', '#3F8F4E', '#5BB5C4', '#F2EFE6', '#C1502E'];

/** L'écran de célébration : grand titre, confettis (sauf si les animations sont réduites), son, partage. */
export function EcranCelebration({ celebration, onFermer }: { celebration: Celebration; onFermer: () => void }) {
  const [copie, setCopie] = useState(false);
  useEffect(() => {
    if (celebration.son) jouerSon(celebration.son);
    const id = window.setTimeout(onFermer, DUREE_CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [celebration, onFermer]);
  const partager = async () => {
    if (!celebration.partage) return;
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: 'BTP Life', text: celebration.partage, url });
      else { await navigator.clipboard.writeText(`${celebration.partage} ${url}`); setCopie(true); }
    } catch { /* Partage annulé ou refusé : rien à faire. */ }
  };
  return <div role="status" aria-live="polite" className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
    <style>{`@keyframes btp-confetti { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(540deg); opacity: .7 } }
      @media (prefers-reduced-motion: reduce) { .btp-confetti { display: none } }`}</style>
    {Array.from({ length: 36 }, (_, i) => <span key={i} aria-hidden className="btp-confetti absolute top-0 block h-2.5 w-1.5 rounded-sm"
      style={{ left: `${(i * 37) % 100}%`, background: COULEURS[i % COULEURS.length], animation: `btp-confetti ${2.6 + (i % 5) * .35}s linear ${(i % 9) * .18}s forwards` }} />)}
    <div className="hud-verre pointer-events-auto w-[340px] max-w-[calc(100%-24px)] rounded-2xl p-5 text-center text-jeu-ivoire">
      <p aria-hidden className="text-[44px] leading-none">{celebration.icone}</p>
      <h2 className="hud-titre mt-2 text-[22px] text-jeu-or">{celebration.titre}</h2>
      {celebration.sousTitre && <p className="mt-1.5 text-[13px] leading-snug text-jeu-ivoire/80">{celebration.sousTitre}</p>}
      <div className="mt-4 flex justify-center gap-2">
        {celebration.partage && <button type="button" onClick={() => void partager()} className="rounded-lg bg-jeu-or/20 px-3 py-1.5 text-[12.5px] font-bold text-jeu-or hover:bg-jeu-or/30">{copie ? 'Copié !' : 'Partager'}</button>}
        <button type="button" onClick={onFermer} className="hud-bouton hud-bouton-principal px-4 py-1.5 text-[12.5px]">Continuer</button>
      </div>
    </div>
  </div>;
}
