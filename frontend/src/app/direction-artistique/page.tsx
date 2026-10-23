'use client';

import dynamic from 'next/dynamic';

const Atelier = dynamic(() => import('@/components/app/atelier-direction-artistique'), { ssr: false });

export default function DirectionArtistiquePage() {
  return <Atelier />;
}
