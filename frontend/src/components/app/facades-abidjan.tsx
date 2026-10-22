'use client';

import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const VARIANTES: Record<string, number> = {
  cafe: 0, fournisseur: 1, 'bureau-etudes': 2, maquis: 3,
  marche: 1, 'centre-azur': 0, 'galerie-palmiers': 3, marina: 3, agence: 2,
};

export const aDevanture = (slug: string) => slug in VARIANTES;

/** Shared atlas, cropped through geometry UVs: one texture upload for every shop. */
export function FacadeAbidjan({ slug, largeur, profondeur, nuit }: {
  slug: string; largeur: number; profondeur: number; nuit: boolean;
}) {
  const atlas = useTexture('/materials/facades-abidjan-v1.png');
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 4;
  const variante = VARIANTES[slug] ?? 0;
  const baies = Math.max(1, Math.ceil((largeur - 1) / 7));
  const largeurBaie = (largeur - 1) / baies;
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(largeurBaie, 3.15);
    const uv = plane.attributes.uv;
    // Leave two pixels inside each quadrant to prevent filtering into its neighbour.
    const marge = .002;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (variante % 2) * .5 + marge + uv.getX(i) * (.5 - marge * 2),
        (variante < 2 ? .5 : 0) + marge + uv.getY(i) * (.5 - marge * 2));
    }
    return plane;
  }, [largeurBaie, variante]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const cadre = ['#264f4a', '#96582f', '#243a49', '#694a37'][variante];
  return <group position={[0, 0, profondeur / 2 + .32]}>
    {Array.from({ length: baies }, (_, i) => <mesh key={i}
      position={[(i - (baies - 1) / 2) * largeurBaie, 1.975, 0]}
      geometry={geometry} receiveShadow>
      <meshStandardMaterial map={atlas} roughness={.76} emissiveMap={atlas}
        emissive={nuit ? '#ffe0af' : '#000000'} emissiveIntensity={.32} />
    </mesh>)}
    {Array.from({ length: baies + 1 }, (_, i) => <mesh key={i}
      position={[(i - baies / 2) * largeurBaie, 1.98, .09]} castShadow receiveShadow>
      <boxGeometry args={[.16, 3.3, .25]} /><meshStandardMaterial color={cadre} roughness={.7} />
    </mesh>)}
    {[.37, 3.6].map(y => <mesh key={y} position={[0, y, .1]} castShadow receiveShadow>
      <boxGeometry args={[largeur - .65, .16, .35]} /><meshStandardMaterial color={cadre} roughness={.65} />
    </mesh>)}
    <mesh position={[0, .23, .2]} receiveShadow><boxGeometry args={[largeur, .18, .65]} />
      <meshStandardMaterial color="#bcb19b" roughness={.95} /></mesh>
  </group>;
}
