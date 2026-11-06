'use client';

import { useFrame } from '@react-three/fiber';
import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { coquePirogue, FORME_PIROGUE, MOTIFS_PIROGUES, sectionPirogue, type Rgb } from '@/lib/coque-pirogue';
import { PIROGUES_PLAGE } from '@/lib/decor-ville';

// Les pirogues de la plage des Sables : tirées sur le sable au bord de l'eau, ou au mouillage à quelques mètres, qui se
// balancent avec la houle. Chaque décoration est une seule géométrie (coque, bancs, filet roulé, pagaies, fanion) : les
// pirogues échouées se dessinent en une commande par décoration.

const L = FORME_PIROGUE.longueur;

function colorier(geometrie: THREE.BufferGeometry, couleur: Rgb) {
  const n = geometrie.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.set(couleur, i * 3);
  geometrie.setAttribute('color', new THREE.BufferAttribute(c, 3));
  geometrie.deleteAttribute('uv');
  return geometrie;
}
const fonce = (c: Rgb, f = .7): Rgb => [c[0] * f, c[1] * f, c[2] * f];

const cache = new Map<number, THREE.BufferGeometry>();
/** La pirogue complète d'une décoration, construite une fois et partagée. */
export function geometriePirogue(modele: number) {
  const index = ((modele % MOTIFS_PIROGUES.length) + MOTIFS_PIROGUES.length) % MOTIFS_PIROGUES.length;
  const enCache = cache.get(index);
  if (enCache) return enCache;
  const motif = MOTIFS_PIROGUES[index];
  const coque = coquePirogue(motif);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(coque.positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(coque.couleurs, 3));
  g.setIndex(new THREE.BufferAttribute(coque.indices, 1));
  g.computeVertexNormals();
  const pieces: THREE.BufferGeometry[] = [g.toNonIndexed()];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const poser = (geometrie: THREE.BufferGeometry, couleur: Rgb, [x, y, z]: [number, number, number], [rx, ry, rz]: [number, number, number] = [0, 0, 0], [sx, sy, sz]: [number, number, number] = [1, 1, 1]) => {
    geometrie.applyMatrix4(m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
    pieces.push(colorier(geometrie.index ? geometrie.toNonIndexed() : geometrie, couleur));
  };
  // Trois bancs en travers, posés sous le plat-bord.
  for (const u of [-.42, .02, .44]) {
    const { demiLargeur, platBord } = sectionPirogue(u);
    poser(new THREE.BoxGeometry(.22, .05, demiLargeur * 1.75), fonce(motif.bois, .85), [u * L / 2, platBord - .14, 0]);
  }
  // Le filet roulé à l'arrière, vert sombre et lesté de flotteurs orange.
  [[-1.75, .08, .1, .55], [-2.1, .02, -.1, .45], [-1.45, -.04, .02, .4]].forEach(([x, dz, rz, r]) => poser(new THREE.IcosahedronGeometry(r, 1), [.16, .26, .18], [x, .36, dz], [0, 0, rz], [1.25, .42, .85]));
  [[-1.6, .22], [-2.05, -.18], [-1.9, .3]].forEach(([x, z]) => poser(new THREE.SphereGeometry(.07, 6, 4), [.93, .45, .12], [x, .56, z]));
  // Deux pagaies couchées le long du bord.
  [.32, -.3].forEach((z, i) => {
    poser(new THREE.BoxGeometry(2.3, .04, .05), fonce(motif.bois, .6), [.6 + i * .3, .5, z], [0, i ? .06 : -.05, 0]);
    poser(new THREE.BoxGeometry(.5, .025, .18), fonce(motif.bois, .6), [-.65 + i * .3, .5, z], [0, i ? .06 : -.05, 0]);
  });
  // Le fanion de l'étrave, aux couleurs de la pirogue.
  const etrave = sectionPirogue(.97).platBord;
  poser(new THREE.CylinderGeometry(.02, .025, 1.1, 5), [.2, .16, .12], [L / 2 * .93, etrave + .4, 0]);
  poser(new THREE.BoxGeometry(.42, .26, .01), motif.haut, [L / 2 * .93 - .22, etrave + .8, 0]);
  poser(new THREE.BoxGeometry(.42, .09, .012), motif.milieu, [L / 2 * .93 - .22, etrave + .74, 0]);
  const fusion = mergeGeometries(pieces, false)!;
  fusion.computeBoundingSphere();
  cache.set(index, fusion);
  return fusion;
}

let materiau: THREE.MeshStandardMaterial | null = null;
/** Bois peint mat, partagé par toutes les pirogues. */
export function materiauPirogue() {
  materiau ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, metalness: 0 });
  return materiau;
}

/** Une pirogue seule (sur la lagune, avec son pêcheur, dans details-abidjan.tsx). */
export function CoquePirogue({ modele }: { modele: number }) {
  return <mesh geometry={geometriePirogue(modele)} material={materiauPirogue()} castShadow />;
}

/** Les pirogues au mouillage, à quelques mètres du bord : elles tanguent et roulent doucement. */
const AU_MOUILLAGE: { x: number; z: number; angle: number; modele: number }[] = [
  { x: -64, z: 70.5, angle: .4, modele: 2 }, { x: -30, z: 71.2, angle: -.25, modele: 0 },
  { x: 6, z: 70.8, angle: .15, modele: 3 }, { x: 31, z: 71.6, angle: -.5, modele: 1 },
];

export const BateauxPlage = memo(function BateauxPlage({ pause = false, rythme = 1 }: { pause?: boolean; rythme?: number }) {
  // Les pirogues échouées : une commande de dessin par décoration.
  const parModele = useMemo(() => MOTIFS_PIROGUES.map((_, modele) => PIROGUES_PLAGE.filter(p => p.modele === modele)).filter(l => l.length), []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    parModele.forEach((liste, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      liste.forEach(({ p: [x, z], angle }, k) => {
        // Enfoncée de quelques centimètres dans le sable, un peu couchée sur le flanc.
        o.position.set(x, .1, z); o.rotation.set(0, angle, (k % 2 ? 1 : -1) * .05); o.updateMatrix();
        mesh.setMatrixAt(k, o.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [parModele]);
  const mouillage = useRef<(THREE.Group | null)[]>([]);
  const temps = useRef(0);
  useFrame((_, delta) => {
    if (pause) return;
    temps.current += Math.min(delta, .05) * rythme;
    mouillage.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = .02 + Math.sin(temps.current * 1.1 + i * 1.7) * .06;
      g.rotation.x = Math.sin(temps.current * .9 + i) * .04;
      g.rotation.z = Math.sin(temps.current * .7 + i * 2.3) * .025;
    });
  });
  return <group>
    {parModele.map((liste, i) => <instancedMesh key={liste[0].modele} ref={m => { refs.current[i] = m; }} args={[geometriePirogue(liste[0].modele), materiauPirogue(), liste.length]} castShadow />)}
    {AU_MOUILLAGE.map(({ x, z, angle, modele }, i) => <group key={i} position={[x, .02, z]} rotation={[0, angle, 0]}>
      <group ref={g => { mouillage.current[i] = g; }}><CoquePirogue modele={modele} /></group>
      {/* La corde de l'ancre, qui plonge vers le fond. */}
      <mesh position={[-L / 2 - .5, .15, 0]} rotation={[0, 0, -1.1]}><cylinderGeometry args={[.015, .015, 1.4, 4]} /><meshStandardMaterial color="#c9b98f" roughness={1} /></mesh>
    </group>)}
  </group>;
});
