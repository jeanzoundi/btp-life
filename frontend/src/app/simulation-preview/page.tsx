'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const Quartier = dynamic(() => import('@/components/app/quartier-3d').then(m => m.Quartier3D), {
  ssr: false,
  loading: () => <div className="flex h-[86vh] items-center justify-center text-white">Ouverture du quartier…</div>,
});

export default function SimulationPreviewPage() {
  return <main className="min-h-screen bg-[#142a2d] p-2 sm:p-4">
    <Quartier nomJoueur="Jean" demo besoins={{ energie: 78, moral: 82, faim: 64, social: 70 }} />
    <footer className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs text-white/60">
      <span>Aperçu jouable · Données de démonstration · Progression non sauvegardée</span>
      <Link className="rounded-full bg-[#e5bb6c] px-5 py-2 font-bold text-[#142a2d]" href="/app/monde">Rejoindre ma partie →</Link>
    </footer>
  </main>;
}
