'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
const Interieur = dynamic(() => import('@/components/app/interieur-lieu-3d').then(m => m.InterieurLieu3D), { ssr: false, loading: () => <p className="p-8">Chargement du campus…</p> });
export default function UniversitePreview() {
  const router = useRouter();
  return <Interieur slug="universite" nom="Université BTP · visite libre" onSortir={() => router.push('/simulation-preview')}><div className="absolute bottom-36 right-4 max-w-xs rounded-xl bg-slate-950/95 p-5 text-sm text-white">Visite architecturale sans sauvegarde. Les formations du compte restent accessibles depuis Services et activités.</div></Interieur>;
}
