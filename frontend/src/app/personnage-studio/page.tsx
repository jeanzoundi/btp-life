'use client';

import dynamic from 'next/dynamic';

const Studio = dynamic(() => import('@/components/app/studio-personnage'), {
  ssr: false,
  loading: () => <main className="grid min-h-screen place-items-center bg-[#12282a] text-white">Ouverture du studio…</main>,
});

export default function Page() { return <Studio />; }
