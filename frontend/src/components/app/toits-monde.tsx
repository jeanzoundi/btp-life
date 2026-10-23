'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ToitArchitecture } from '@/lib/architecture-ville';

let tuiles: THREE.DataTexture | null = null;

/** Tuiles canal en niveaux de gris (la teinte vient du matériau) : rangées décalées, ombre sous chaque recouvrement. Partagée par tous les toits. */
function textureTuiles() {
  if (tuiles) return tuiles;
  const taille = 128, rangees = 4, colonnes = 5;
  const data = new Uint8Array(taille * taille * 4);
  const hRang = taille / rangees, lTuile = taille / colonnes;
  for (let y = 0; y < taille; y++) {
    const rang = Math.floor(y / hRang), dansRang = (y % hRang) / hRang;
    for (let x = 0; x < taille; x++) {
      const xd = (x + (rang % 2) * lTuile / 2) % taille;
      const col = Math.floor(xd / lTuile), dansTuile = (xd % lTuile) / lTuile;
      // Galbe de la tuile (plus claire au sommet de la courbe), ombre portée en bas du rang, joint sombre entre tuiles.
      const galbe = .82 + Math.sin(dansTuile * Math.PI) * .2;
      const recouvrement = dansRang > .86 ? .55 : 1 - dansRang * .12;
      const joint = dansTuile < .04 || dansTuile > .96 ? .7 : 1;
      const nuance = 1 + (((col * 31 + rang * 17) % 7) - 3) * .025 + ((x * 13 + y * 7) % 5) * .006;
      const v = Math.max(0, Math.min(255, Math.round(232 * galbe * recouvrement * joint * nuance)));
      data.set([v, v, v, 255], (y * taille + x) * 4);
    }
  }
  tuiles = new THREE.DataTexture(data, taille, taille);
  tuiles.wrapS = tuiles.wrapT = THREE.RepeatWrapping;
  tuiles.colorSpace = THREE.SRGBColorSpace;
  tuiles.magFilter = THREE.LinearFilter; tuiles.minFilter = THREE.LinearMipmapLinearFilter;
  tuiles.generateMipmaps = true; tuiles.anisotropy = 4; tuiles.needsUpdate = true;
  return tuiles;
}

/** Toit à quatre pans, faîtage selon la plus grande longueur. Les UV suivent la pente : un mètre de toit = une demi-tuile de texture. */
function geometrieToit(longueur: number, largeur: number, hauteur: number) {
  const L = longueur / 2, l = largeur / 2, f = Math.max(0, L - l);
  const pente = (dx: number, y: number) => Math.hypot(dx, y);
  const positions: number[] = [], uvs: number[] = [];
  const face = (points: [number, number, number][], uv: [number, number][]) => { points.forEach(p => positions.push(...p)); uv.forEach(u => uvs.push(u[0] * .5, u[1] * .5)); };
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
  return <group position={[0, toit.y, 0]} rotation={[0, tourne ? Math.PI / 2 : 0, 0]}>
    <mesh geometry={geometrie} castShadow receiveShadow>
      <meshStandardMaterial color={toit.couleur} map={textureTuiles()} roughness={.82} />
    </mesh>
    <mesh position={[0, toit.hauteur + .02, 0]} castShadow>
      <boxGeometry args={[faitage + .3, .16, .3]} />
      <meshStandardMaterial color={toit.couleur} roughness={.8} />
    </mesh>
  </group>;
});
