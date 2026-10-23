'use client';
import { Environment } from '@react-three/drei';

/** Éclairage d'ambiance et reflets tirés d'un vrai ciel photographié (HDRI Poly Haven, CC0, hébergé localement).
 * Le ciel visible reste celui du cycle jour/nuit : l'HDRI ne sert qu'à l'éclairage indirect et aux reflets. */
export function RefletsMonde({ intensite = .35 }: { intensite?: number }) {
  return <Environment files="/materials/ciel-kloofendal-1k.hdr" environmentIntensity={intensite} />;
}
