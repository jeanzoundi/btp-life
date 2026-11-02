'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture } from '@/lib/architecture-ville';
import { COULEURS_CHAISES, siegeTerrasse, TABLES_TERRASSE } from '@/lib/terrasse-maquis';
import { BlocsInstances } from './blocs-instances';

// Les détails qui font Abidjan dans le quartier pilote : pirogues sur la lagune, terrasse de chaises plastique devant le
// maquis, enseignes peintes à la main, et, la nuit, les flaques de lumière des lampadaires sur la chaussée.

type V = [number, number, number];

/** Un dégradé radial chaud, dessiné une fois : la tache de lumière d'un lampadaire sur le sol. */
let texteLumiere: THREE.Texture | null = null;
function textureTacheLumiere() {
  if (texteLumiere || typeof document === 'undefined') return texteLumiere;
  const toile = document.createElement('canvas');
  toile.width = toile.height = 128;
  const c = toile.getContext('2d');
  if (!c) return null;
  const degrade = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  degrade.addColorStop(0, 'rgba(255,214,140,1)'); degrade.addColorStop(.45, 'rgba(255,190,110,.45)'); degrade.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = degrade; c.fillRect(0, 0, 128, 128);
  texteLumiere = new THREE.CanvasTexture(toile);
  texteLumiere.colorSpace = THREE.SRGBColorSpace;
  return texteLumiere;
}

/** La nuit, chaque lampadaire pose une tache de lumière chaude sur la chaussée : une seule commande de dessin pour tous. */
export const FlaquesLumiere = memo(function FlaquesLumiere({ points, nuit }: { points: readonly [number, number][]; nuit: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const materiau = useMemo(() => new THREE.MeshBasicMaterial({
    map: textureTacheLumiere(), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), []);
  useEffect(() => () => materiau.dispose(), [materiau]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const o = new THREE.Object3D();
    points.forEach(([x, z], i) => { o.position.set(x, .12, z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.setScalar(4.6); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix); });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [points]);
  return <instancedMesh ref={ref} args={[undefined, materiau, points.length]} visible={nuit} renderOrder={2} userData={{ sansOcclusion: true }}>
    <planeGeometry args={[2, 2]} />
  </instancedMesh>;
});

/** Pirogue de pêcheur en bois, son pêcheur assis et sa pagaie. */
function Pirogue({ couleur = '#5b3a22', pecheur = true }: { couleur?: string; pecheur?: boolean }) {
  return <group>
    <mesh position={[0, .18, 0]} castShadow><boxGeometry args={[4.4, .38, .78]} /><meshStandardMaterial color={couleur} roughness={.85} /></mesh>
    {[-1, 1].map(s => <mesh key={s} position={[s * 2.55, .24, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><boxGeometry args={[.62, .36, .62]} /><meshStandardMaterial color={couleur} roughness={.85} /></mesh>)}
    <mesh position={[0, .38, 0]}><boxGeometry args={[4.1, .04, .62]} /><meshStandardMaterial color="#c9573a" roughness={.7} /></mesh>
    {pecheur && <group position={[.6, .38, 0]}>
      <mesh position={[0, .38, 0]} castShadow><capsuleGeometry args={[.17, .42, 4, 8]} /><meshStandardMaterial color="#d8b04a" roughness={.8} /></mesh>
      <mesh position={[0, .86, 0]} castShadow><sphereGeometry args={[.14, 10, 8]} /><meshStandardMaterial color="#4a2e1f" roughness={.7} /></mesh>
      <mesh position={[.25, .45, .36]} rotation={[.6, 0, -.5]}><cylinderGeometry args={[.025, .025, 1.7, 6]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
    </group>}
  </group>;
}

/** Trois pirogues glissent sur la lagune ; deux autres attendent, tirées sur le sable. */
function PiroguesLagune({ pause, rythme }: { pause: boolean; rythme: number }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const depart = useMemo(() => [{ x: -80, z: 74, v: .5 }, { x: 10, z: 79, v: -.35 }, { x: 70, z: 88, v: .3 }], []);
  useFrame(({ clock }, delta) => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      if (!pause) g.position.x = ((g.position.x + depart[i].v * Math.min(delta, .05) * rythme + 130) % 260 + 260) % 260 - 130;
      g.position.y = .12 + Math.sin(clock.elapsedTime * 1.3 + i) * .05;
      g.rotation.z = Math.sin(clock.elapsedTime * .9 + i * 2) * .03;
    });
  });
  return <group>
    {depart.map((p, i) => <group key={i} ref={g => { refs.current[i] = g; }} position={[p.x, .12, p.z]} rotation={[0, p.v < 0 ? Math.PI : 0, 0]}><Pirogue couleur={['#5b3a22', '#6b4a2a', '#4a3020'][i]} /></group>)}
    <group position={[-38, .05, 66.5]} rotation={[0, .5, 0]}><Pirogue pecheur={false} couleur="#2f6f8f" /></group>
    <group position={[33, .05, 66.8]} rotation={[0, -.35, 0]}><Pirogue pecheur={false} couleur="#7a3a2a" /></group>
  </group>;
}

/** Les chaises et tables en plastique de la terrasse du maquis, comme sous tous les maquis d'Abidjan ; les habitants s'y
 * assoient pour déjeuner et pour la soirée (lib/terrasse-maquis.ts). */
const TERRASSE: BlocArchitecture[] = TABLES_TERRASSE.flatMap(([x, z], t) => {
  const blocs: BlocArchitecture[] = [
    { position: [x, .72, z], taille: [.95, .05, .95], couleur: '#f1f0ea', rotation: 0 },
    { position: [x, .36, z], taille: [.1, .7, .1], couleur: '#f1f0ea', rotation: 0 },
  ];
  for (let c = 0; c < 4; c++) {
    const { position: [cx, cz], angle } = siegeTerrasse(t, c), couleur = COULEURS_CHAISES[(c + t) % 4];
    blocs.push({ position: [cx, .44, cz], taille: [.46, .05, .46], couleur, rotation: angle });
    blocs.push({ position: [x + (cx - x) * 1.27, .7, z + (cz - z) * 1.27], taille: [.46, .5, .05], couleur, rotation: angle });
    blocs.push({ position: [cx, .21, cz], taille: [.4, .42, .4], couleur, rotation: angle });
  }
  return blocs;
});

/** Enseigne peinte à la main sur une planche : lettres capitales, couleurs franches. */
function Enseigne({ p, r = 0, texte, fond, couleur = '#2b1d0e', largeur = 3.2 }: { p: V; r?: number; texte: string; fond: string; couleur?: string; largeur?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    <mesh castShadow><boxGeometry args={[largeur, .62, .07]} /><meshStandardMaterial color={fond} roughness={.85} /></mesh>
    <Text position={[0, 0, .05]} fontSize={.21} maxWidth={largeur - .25} textAlign="center" color={couleur} anchorX="center" anchorY="middle">{texte}</Text>
  </group>;
}

export const DetailsAbidjan = memo(function DetailsAbidjan({ pause = false, rythme = 1 }: { pause?: boolean; rythme?: number }) {
  return <group>
    <PiroguesLagune pause={pause} rythme={rythme} />
    <BlocsInstances blocs={TERRASSE} interactif={false} />
    <Enseigne p={[0, 2.95, 21.48]} texte="TRANSFERT D’ARGENT · RECHARGE" fond="#f2c230" />
    <Enseigne p={[-100, 2.95, 61.48]} texte="COIFFURE DAME AWA" fond="#e8742b" couleur="#fff6e6" largeur={3} />
    <Enseigne p={[-93, 2.95, 61.48]} texte="PRESSING DE LA LAGUNE" fond="#2f6fb3" couleur="#fff6e6" largeur={3} />
    <Enseigne p={[-86, 2.95, 61.48]} texte="ALLOCO · GARBA" fond="#3f8f4e" couleur="#fff6e6" largeur={3} />
    {/* Sur le pignon est du maquis, tourné vers la caméra, la carte peinte à même le mur. */}
    <group position={[-5.88, 2.7, 31]} rotation={[0, Math.PI / 2, 0]}>
      <mesh><boxGeometry args={[5, 1.3, .05]} /><meshStandardMaterial color="#efe0b8" roughness={.9} /></mesh>
      <Text position={[0, .22, .04]} fontSize={.34} color="#b83a2a" anchorX="center" anchorY="middle">GARBA · ATTIÉKÉ</Text>
      <Text position={[0, -.26, .04]} fontSize={.24} color="#2b1d0e" anchorX="center" anchorY="middle">Poisson braisé · Alloco · Bissap frais</Text>
    </group>
  </group>;
});
