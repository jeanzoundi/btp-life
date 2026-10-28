'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SelecteurModeExperience } from './selecteur-mode-experience';

export interface RaccourciMonde { href: string; icon: string; label: string }

/** Sur téléphone, dans le monde vivant : un seul bouton en haut à gauche ouvre le choix du mode et les raccourcis, au lieu
 * d'un sélecteur et d'une barre posée sur la croix de déplacement. */
export function MenuMondeMobile({ raccourcis }: { raccourcis: readonly RaccourciMonde[] }) {
  const [ouvert, setOuvert] = useState(false);
  return <div className="absolute left-3 top-3 z-40 sm:hidden">
    <button type="button" aria-expanded={ouvert} aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOuvert(v => !v)}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-[#10262b]/90 text-lg text-white shadow-lg backdrop-blur-xl">
      <span aria-hidden="true">{ouvert ? '✕' : '☰'}</span>
    </button>
    {ouvert && <div className="mt-2 w-[230px] rounded-2xl border border-white/20 bg-[#10262b]/95 p-2 text-white shadow-2xl backdrop-blur-xl">
      <SelecteurModeExperience compact libelles />
      <nav aria-label="Centre de commande" className="mt-2 grid gap-0.5">
        {raccourcis.map(r => <Link key={r.href} href={r.href} onClick={() => setOuvert(false)} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
          <span aria-hidden="true" className="text-lg">{r.icon}</span>{r.label}
        </Link>)}
      </nav>
    </div>}
  </div>;
}
