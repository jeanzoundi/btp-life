'use client';

import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { GABARITS_VEHICULES } from '@/lib/echelle-monde';
import { VoitureMonde } from './vehicule-monde';

// Les véhicules des rues d'Abidjan, à leurs vraies dimensions (l'échelle de la ville s'applique autour) : le bus de ligne,
// le gbaka (minibus collectif), le taxi orange et la moto. Avant vers +x, côté droit (portes) vers +z.

type V = [number, number, number];
function Caisse({ p, s, c, metal = .35, rugosite = .4 }: { p: V; s: V; c: string; metal?: number; rugosite?: number }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} metalness={metal} roughness={rugosite} /></mesh>;
}
function Vitre({ p, s }: { p: V; s: V }) {
  return <mesh position={p}><boxGeometry args={s} /><meshPhysicalMaterial color="#1c3440" metalness={.6} roughness={.1} clearcoat={1} /></mesh>;
}

/** Roues d'un essieu, qui tournent selon la vitesse (m/s) quand elle est fournie. */
function Roues({ x, rayon, demiVoie, roulage }: { x: number[]; rayon: number; demiVoie: number; roulage?: MutableRefObject<number> }) {
  const roues = useRef<Array<THREE.Group | null>>([]);
  useFrame((_, delta) => { if (roulage) roues.current.forEach(r => { if (r) r.rotation.z -= roulage.current * Math.min(delta, .1) / rayon; }); });
  return <>{x.flatMap((px, i) => [-1, 1].map((cote, j) => <group key={`${px}:${cote}`} ref={g => { roues.current[i * 2 + j] = g; }} position={[px, rayon, cote * demiVoie]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[rayon, rayon, .3, 18]} /><meshStandardMaterial color="#181c1e" roughness={.95} /></mesh>
    <mesh position={[0, 0, cote * .16]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[rayon * .55, rayon * .55, .02, 14]} /><meshStandardMaterial color="#9aa5ab" metalness={.8} roughness={.3} /></mesh>
  </group>))}</>;
}

/** Bus de ligne (11 m) : livrée blanche, bande orange et jupe verte, deux portes côté trottoir, girouette lumineuse. */
export function BusMonde({ ligne = '12 · PLATEAU ↔ LAGUNE', roulage }: { ligne?: string; roulage?: MutableRefObject<number> }) {
  const { longueur: l, largeur: w } = GABARITS_VEHICULES.bus, hx = l / 2, hz = w / 2;
  return <group>
    <Caisse p={[0, .8, 0]} s={[l, .9, w]} c="#3F8F4E" />
    <Caisse p={[0, 1.33, 0]} s={[l + .02, .18, w + .02]} c="#E8742B" />
    <Caisse p={[0, 1.42, 0]} s={[l, .06, w]} c="#F2EFE6" />
    <Vitre p={[-.3, 2.02, 0]} s={[l - 1.6, 1.15, w + .02]} />
    {Array.from({ length: 8 }, (_, i) => <Caisse key={i} p={[-hx + 1.15 + i * 1.18, 2.02, 0]} s={[.08, 1.16, w + .04]} c="#F2EFE6" />)}
    <Caisse p={[0, 2.8, 0]} s={[l, .42, w]} c="#F2EFE6" />
    <Caisse p={[0, 3.06, 0]} s={[l - .4, .12, w - .2]} c="#D9D6CC" />
    <Caisse p={[-1.2, 3.22, 0]} s={[2.8, .3, 1.6]} c="#C8C6BE" />
    {/* Pare-brise, girouette et phares à l'avant ; lunette et feux à l'arrière. */}
    <Vitre p={[hx + .01, 1.95, 0]} s={[.06, 1.45, w - .2]} />
    <mesh position={[hx + .04, 2.86, 0]}><boxGeometry args={[.04, .3, w - .4]} /><meshStandardMaterial color="#1A1208" emissive="#E8A23A" emissiveIntensity={.25} /></mesh>
    <Text position={[hx + .07, 2.86, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={.16} color="#FFC266" anchorX="center" anchorY="middle">{ligne}</Text>
    {[-1, 1].map(s => <mesh key={s} position={[hx + .02, .72, s * (hz - .3)]}><boxGeometry args={[.04, .16, .34]} /><meshStandardMaterial color="#EDECD8" emissive="#FFF2C5" emissiveIntensity={1.2} /></mesh>)}
    <Vitre p={[-hx - .01, 2.1, 0]} s={[.06, .9, w - .5]} />
    {[-1, 1].map(s => <mesh key={s} position={[-hx - .02, .9, s * (hz - .25)]}><boxGeometry args={[.04, .3, .22]} /><meshStandardMaterial color="#972B26" emissive="#CD241A" emissiveIntensity={.6} /></mesh>)}
    {/* Portes côté trottoir, rétroviseurs, passages de roue. */}
    {[hx - 1.2, -.6].map(x => <group key={x}>
      <Vitre p={[x, 1.55, hz + .02]} s={[1.1, 2.1, .04]} />
      <Caisse p={[x, 1.55, hz + .03]} s={[.04, 2.1, .04]} c="#2B2B2E" />
    </group>)}
    {[-1, 1].map(s => <Caisse key={s} p={[hx + .25, 2.35, s * (hz + .1)]} s={[.08, .45, .2]} c="#1F2426" />)}
    {[3.35, -2.95].flatMap(x => [-1, 1].map(s => <Caisse key={`${x}${s}`} p={[x, .62, s * (hz + .005)]} s={[1.25, .62, .02]} c="#1C1F21" metal={.1} rugosite={.9} />))}
    <Roues x={[3.35, -2.95]} rayon={.5} demiVoie={hz - .25} roulage={roulage} />
  </group>;
}

/** Gbaka : le minibus collectif, vert et jaune, galerie chargée de bagages et porte coulissante ouverte côté trottoir. */
export function GbakaMonde({ couleur = '#2F8F5B', roulage }: { couleur?: string; roulage?: MutableRefObject<number> }) {
  const { longueur: l, largeur: w } = GABARITS_VEHICULES.gbaka, hx = l / 2, hz = w / 2;
  return <group>
    <Caisse p={[-.15, .95, 0]} s={[l - .3, 1.2, w]} c={couleur} />
    <Caisse p={[-.15, 1.02, 0]} s={[l - .28, .16, w + .02]} c="#F2C230" />
    <Vitre p={[-.35, 1.78, 0]} s={[l - 1.3, .62, w + .02]} />
    <Caisse p={[-.3, 2.15, 0]} s={[l - .6, .2, w]} c={couleur} />
    {/* Nez plongeant et pare-brise incliné du minibus. */}
    <mesh position={[hx - .45, 1.55, 0]} rotation={[0, 0, -.5]} castShadow><boxGeometry args={[.9, .08, w - .1]} /><meshPhysicalMaterial color="#1c3440" metalness={.6} roughness={.1} clearcoat={1} /></mesh>
    <Caisse p={[hx - .25, .78, 0]} s={[.5, .86, w - .04]} c={couleur} />
    {[-1, 1].map(s => <mesh key={s} position={[hx + .01, .82, s * (hz - .3)]}><boxGeometry args={[.04, .14, .28]} /><meshStandardMaterial color="#EDECD8" emissive="#FFF2C5" emissiveIntensity={1.2} /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[-hx + .14, 1, s * (hz - .2)]}><boxGeometry args={[.04, .26, .18]} /><meshStandardMaterial color="#972B26" emissive="#CD241A" emissiveIntensity={.6} /></mesh>)}
    {/* Porte coulissante ouverte : l'entrée sombre, et la porte glissée vers l'arrière. */}
    <Caisse p={[.35, 1.25, hz + .01]} s={[1.05, 1.75, .02]} c="#17191A" metal={0} rugosite={1} />
    <Caisse p={[-.55, 1.25, hz + .07]} s={[1.05, 1.75, .05]} c={couleur} />
    {/* Galerie de toit et bagages ficelés. */}
    {[-1, 1].map(s => <Caisse key={s} p={[-.4, 2.33, s * (hz - .12)]} s={[l - 1.4, .05, .05]} c="#3B3F42" metal={.6} />)}
    {[[-1.3, '#7A4E2D', [.8, .4, .7]], [-.3, '#2F6FB3', [.7, .5, .9]], [.6, '#C1502E', [.6, .35, .6]]].map(([x, c, s]) =>
      <Caisse key={String(x)} p={[x as number, 2.33 + (s as number[])[1] / 2, 0]} s={s as V} c={c as string} metal={0} rugosite={.9} />)}
    <Roues x={[1.6, -1.55]} rayon={.34} demiVoie={hz - .2} roulage={roulage} />
  </group>;
}

/** Taxi « compteur » orange, lumineux de toit compris. */
export function TaxiMonde({ roulage }: { roulage?: MutableRefObject<number> }) {
  return <group>
    <VoitureMonde couleur="#E8742B" roulage={roulage} />
    <mesh position={[-.1, 1.55, 0]} castShadow><boxGeometry args={[.7, .22, .3]} /><meshStandardMaterial color="#FFF4D6" emissive="#F2C230" emissiveIntensity={.5} /></mesh>
    {[-1, 1].map(s => <Text key={s} position={[-.1, 1.55, s * .16]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} fontSize={.13} color="#2A1C0E" anchorX="center" anchorY="middle">TAXI</Text>)}
  </group>;
}

/** Moto garée sur sa béquille. */
export function MotoMonde({ couleur = '#B8322A' }: { couleur?: string }) {
  return <group rotation={[.06, 0, 0]}>
    {[.62, -.62].map(x => <mesh key={x} position={[x, .3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.26, .07, 8, 18]} /><meshStandardMaterial color="#181c1e" roughness={.95} /></mesh>)}
    <Caisse p={[0, .55, 0]} s={[.9, .3, .3]} c={couleur} />
    <Caisse p={[-.2, .78, 0]} s={[.75, .12, .3]} c="#1F2224" metal={.1} rugosite={.8} />
    <Caisse p={[.55, .82, 0]} s={[.08, .55, .08]} c="#3B3F42" metal={.7} />
    <Caisse p={[.6, 1.08, 0]} s={[.06, .05, .7]} c="#2B2E30" metal={.7} />
    <mesh position={[.66, .9, 0]}><boxGeometry args={[.06, .14, .16]} /><meshStandardMaterial color="#EDECD8" emissive="#FFF2C5" emissiveIntensity={.4} /></mesh>
  </group>;
}
