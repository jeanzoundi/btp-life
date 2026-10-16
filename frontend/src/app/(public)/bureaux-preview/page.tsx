'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TypeBureau } from '@/lib/plan-bureaux';

const Interieur = dynamic(() => import('@/components/app/interieur-lieu-3d').then(m => m.InterieurLieu3D), { ssr: false, loading: () => <p className="p-8">Chargement des bureaux…</p> });

export default function BureauxPreview() {
  const [type, setType] = useState<TypeBureau>('entreprise');
  const router = useRouter();
  return <>
    <Interieur key={type} slug={type} nom={type === 'entreprise' ? 'Entreprise · visite libre' : 'Bureau d’études · visite libre'} onSortir={() => router.push('/simulation-preview')}>
      <div className="absolute bottom-36 right-4 max-w-xs rounded-xl bg-slate-950/95 p-5 text-sm text-white">Visite de démonstration sans sauvegarde. Retrouvez vos missions et activités dans votre partie.</div>
    </Interieur>
    <button className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-lg bg-amber-200 px-3 py-2 text-xs font-bold text-slate-950" onClick={() => setType(v => v === 'entreprise' ? 'bureau-etudes' : 'entreprise')}>{type === 'entreprise' ? 'Visiter le bureau d’études' : 'Visiter l’entreprise'}</button>
  </>;
}
