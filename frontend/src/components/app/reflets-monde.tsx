'use client';
import { use } from 'react';
import { Environment } from '@react-three/drei';
import { chargerCiel } from '@/lib/ciel-carte-de-gain';

/** Éclairage d'ambiance et reflets tirés d'un vrai ciel photographié (HDRI Poly Haven, CC0, hébergé localement en carte
 * de gain). Le ciel visible reste celui du cycle jour/nuit : l'HDRI ne sert qu'à l'éclairage indirect et aux reflets. */
export function RefletsMonde({ intensite = .35 }: { intensite?: number }) {
  return <Environment map={use(chargerCiel())} environmentIntensity={intensite} />;
}
