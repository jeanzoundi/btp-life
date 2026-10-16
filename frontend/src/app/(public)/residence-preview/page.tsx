'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const Interieur = dynamic(() => import('@/components/app/interieur-lieu-3d').then(m => m.InterieurLieu3D), {
  ssr: false,
  loading: () => <p className="p-8 text-white">Chargement de la résidence…</p>,
});

/** Lightweight showroom: no account, game mutations or city renderer. */
export default function ResidencePreview() {
  const router = useRouter();
  return <Interieur slug="residence" nom="Résidence Lagune · visite libre" onSortir={() => router.push('/simulation-preview')}>
    <div className="absolute bottom-36 right-4 max-w-xs rounded-xl bg-slate-950/95 p-5 text-sm text-white">
      Aperçu architectural : utilisez les pièces pour circuler. Les services et les effets sur les besoins restent disponibles dans votre partie.
    </div>
  </Interieur>;
}
