'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ToitArchitecture } from '@/lib/architecture-ville';
import { useCartesPBR } from './materiaux-monde';

/** Teinte moyenne de la photo de tuiles : la couleur voulue est obtenue en multipliant par couleur / moyenne. */
const MOYENNE_TUILES = new THREE.Color('rgb(145,80,43)');
const TUILE_METRES = 3.5;

/** Toit à quatre pans, faîtage selon la plus grande longueur. Les UV suivent la pente : un mètre de toit = une demi-tuile de texture. */
function geometrieToit(longueur: number, largeur: number, hauteur: number) {
  const L = longueur / 2, l = largeur / 2, f = Math.max(0, L - l);
  const pente = (dx: number, y: number) => Math.hypot(dx, y);
  const positions: number[] = [], uvs: number[] = [];
  const face = (points: [number, number, number][], uv: [number, number][]) => { points.forEach(p => positions.push(...p)); uv.forEach(u => uvs.push(u[0] / TUILE_METRES, u[1] / TUILE_METRES)); };
  // Long pans (avant et arrière), en deux triangles chacun.
  const sAvant = pente(l, hauteur);
  face([[-L, 0, l], [L, 0, l], [f, hauteur, 0]], [[-L, 0], [L, 0], [f, sAvant]]);
  face([[-L, 0, l], [f, hauteur, 0], [-f, hauteur, 0]], [[-L, 0], [f, sAvant], [-f, sAvant]]);
  face([[L, 0, -l], [-L, 0, -l], [-f, hauteur, 0]], [[L, 0], [-L, 0], [-f, sAvant]]);
  face([[L, 0, -l], [-f, hauteur, 0], [f, hauteur, 0]], [[L, 0], [-f, sAvant], [f, sAvant]]);
  // Croupes (côtés), triangulaires.
  const sCote = pente(L - f, hauteur);
  face([[-L, 0, -l], [-L, 0, l], [-f, hauteur, 0]], [[-l, 0], [l, 0], [0, sCote]]);
  face([[L, 0, l], [L, 0, -l], [f, hauteur, 0]], [[-l, 0], [l, 0], [0, sCote]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

export const ToitTuiles = memo(function ToitTuiles({ toit }: { toit: ToitArchitecture }) {
  const tourne = toit.profondeur > toit.largeur;
  const longueur = Math.max(toit.largeur, toit.profondeur), largeur = Math.min(toit.largeur, toit.profondeur);
  const geometrie = useMemo(() => geometrieToit(longueur, largeur, toit.hauteur), [longueur, largeur, toit.hauteur]);
  useEffect(() => () => geometrie.dispose(), [geometrie]);
  const faitage = Math.max(.4, longueur - largeur);
  const [couleur, relief, rugosite] = useCartesPBR('clay_roof_tiles_02');
  const teinte = useMemo(() => { const c = new THREE.Color(toit.couleur); return new THREE.Color(c.r / MOYENNE_TUILES.r, c.g / MOYENNE_TUILES.g, c.b / MOYENNE_TUILES.b); }, [toit.couleur]);
  return <group position={[0, toit.y, 0]} rotation={[0, tourne ? Math.PI / 2 : 0, 0]}>
    {/* Tuiles canal photographiques (Poly Haven, CC0), dans le sens de la pente. */}
    <mesh geometry={geometrie} castShadow receiveShadow>
      <meshStandardMaterial color={teinte} map={couleur} normalMap={relief} normalScale={[1.1, 1.1]} roughnessMap={rugosite} roughness={1} />
    </mesh>
    <mesh position={[0, toit.hauteur + .02, 0]} castShadow>
      <boxGeometry args={[faitage + .3, .16, .3]} />
      <meshStandardMaterial color={toit.couleur} roughness={.8} />
    </mesh>
  </group>;
});
