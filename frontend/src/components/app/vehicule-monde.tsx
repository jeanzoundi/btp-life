'use client';
import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Les voitures des rues d'Abidjan, en mètres (l'échelle de la ville s'applique autour) : avant vers +x, côté droit vers +z.
// La carrosserie est une silhouette de profil extrudée sur la largeur, passages de roues compris ; les vitres sont des
// panneaux encastrés qui laissent les montants dans la couleur de la caisse ; portières, poignées, rétroviseurs,
// pare-chocs, calandre, plaques et feux complètent. Trois gabarits : la berline, la citadine à hayon et le pick-up.

export type ModeleVoiture = 'berline' | 'citadine' | 'pickup';
export type Point = [number, number];

interface Gabarit {
  /** Silhouette de profil (x le long de la voiture, y la hauteur), du pare-chocs arrière au pare-chocs avant, dans le sens
   * horaire vu du côté droit : le bas est fermé par les passages de roues. */
  profil: Point[];
  /** Les panneaux vitrés latéraux (chaque quadrilatère, dans le plan du profil). */
  vitres: Point[][];
  /** Pare-brise et lunette : bas et haut de la vitre inclinée. */
  pareBrise: [Point, Point]; lunette?: [Point, Point];
  longueur: number; largeur: number; roues: [number, number]; rayonRoue: number;
  /** Portières : abscisse des jointures (une ou deux par côté) et des poignées. */
  jointures: number[]; poignees: number[];
  /** Pick-up : la benne ouverte à l'arrière (de xArriere à xCabine), hauteur de ridelle. */
  benne?: { de: number; a: number; haut: number; plancher: number };
}

const GABARITS: Record<ModeleVoiture, Gabarit> = {
  berline: {
    longueur: 4.1, largeur: 1.75, roues: [1.32, -1.28], rayonRoue: .34,
    profil: [[-2.05, .5], [-2.02, .78], [-1.86, .92], [-1.3, .97], [-.72, 1.36], [.2, 1.38], [.72, .9], [1.5, .78], [1.98, .7], [2.05, .5], [2.02, .32], [-2.02, .32]],
    vitres: [[[.6, .92], [.16, 1.3], [-.3, 1.31], [-.3, .95]], [[-.4, .95], [-.4, 1.31], [-.76, 1.3], [-1.24, .98]]],
    pareBrise: [[.68, .92], [.18, 1.33]], lunette: [[-.74, 1.33], [-1.26, .98]],
    jointures: [-.35, .64], poignees: [-.05, .95],
  },
  citadine: {
    longueur: 3.7, largeur: 1.68, roues: [1.12, -1.12], rayonRoue: .32,
    profil: [[-1.85, .5], [-1.82, .9], [-1.7, 1.28], [-1.4, 1.4], [.12, 1.42], [.62, .98], [1.3, .84], [1.78, .74], [1.85, .5], [1.82, .32], [-1.82, .32]],
    vitres: [[[.5, 1], [.1, 1.34], [-.35, 1.35], [-.35, 1.02]], [[-.45, 1.02], [-.45, 1.35], [-1.36, 1.34], [-1.52, 1.05]]],
    pareBrise: [[.6, .99], [.12, 1.37]], lunette: [[-1.42, 1.38], [-1.72, 1.02]],
    jointures: [-.4, .55], poignees: [-.1, .85],
  },
  pickup: {
    longueur: 4.4, largeur: 1.8, roues: [1.42, -1.42], rayonRoue: .38,
    profil: [[-2.2, .52], [-2.2, .62], [-.62, .62], [-.62, 1.02], [-.58, 1.48], [.26, 1.5], [.78, 1.04], [1.6, .9], [2.15, .8], [2.2, .55], [2.17, .34], [-2.17, .34]],
    vitres: [[[.66, 1.06], [.22, 1.42], [-.5, 1.43], [-.52, 1.08]]],
    pareBrise: [[.74, 1.05], [.24, 1.45]],
    jointures: [.1], poignees: [-.2],
    benne: { de: -2.18, a: -.64, haut: 1.08, plancher: .66 },
  },
};

/** La silhouette fermée par le bas, avec un passage de roue creusé au-dessus de chaque essieu. Le profil va du pare-chocs
 * arrière au pare-chocs avant par le dessus, puis donne le dessous avant et le dessous arrière. */
export function silhouetteVehicule(profil: Point[], roues: readonly number[], rayonRoue: number) {
  const s = new THREE.Shape();
  const p = profil, dernier = p[p.length - 1], avantDernier = p[p.length - 2];
  s.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length - 2; i++) s.lineTo(p[i][0], p[i][1]);
  // Dessous, de l'avant vers l'arrière : les deux arches de roue.
  s.lineTo(avantDernier[0], avantDernier[1]);
  const y = avantDernier[1], r = rayonRoue + .08;
  for (const x of [...roues].sort((a, b) => b - a)) {
    s.lineTo(x + r, y);
    s.absarc(x, y, r, 0, Math.PI, true);
  }
  s.lineTo(dernier[0], dernier[1]);
  s.closePath();
  return s;
}
const quad = (pts: Point[]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s; };

/** Une vitre inclinée entre deux points du profil, sur presque toute la largeur. */
function VitreInclinee({ de, a, largeur, recul = 0 }: { de: Point; a: Point; largeur: number; recul?: number }) {
  const dx = a[0] - de[0], dy = a[1] - de[1], long = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
  return <mesh position={[(de[0] + a[0]) / 2 + recul, (de[1] + a[1]) / 2, 0]} rotation={[0, 0, angle]} castShadow>
    <boxGeometry args={[long - .06, .05, largeur]} /><meshPhysicalMaterial color="#1b323d" metalness={.6} roughness={.1} clearcoat={1} />
  </mesh>;
}

/** Une voiture : `nuit` allume phares et feux, `roulage` (m/s) fait tourner les roues et avive les feux stop au ralenti. */
export function VoitureMonde({ couleur = '#ab704b', roulage, modele = 'berline', nuit = false }: { couleur?: string; roulage?: MutableRefObject<number>; modele?: ModeleVoiture; nuit?: boolean }) {
  const g = GABARITS[modele];
  const roues = useRef<Array<THREE.Group | null>>([]);
  const feux = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  useFrame((_, delta) => {
    if (!roulage) return;
    roues.current.forEach(r => { if (r) r.rotation.z -= roulage.current * Math.min(delta, .1) / g.rayonRoue; });
    const stop = roulage.current < 1 ? 1.6 : 0;
    feux.current.forEach(f => { if (f) f.emissiveIntensity = (nuit ? .9 : .25) + stop; });
  });
  const formes = useMemo(() => ({ caisse: silhouetteVehicule(g.profil, g.roues, g.rayonRoue), vitres: g.vitres.map(quad) }), [g]);
  const hz = g.largeur / 2, demiVoie = hz - .12;
  const sombre = '#1d2224', chrome = '#b9c0c4';
  return <group>
    {/* Caisse */}
    <mesh position={[0, 0, -hz]} castShadow receiveShadow>
      <extrudeGeometry args={[formes.caisse, { depth: g.largeur, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 2, steps: 1, curveSegments: 10 }]} />
      <meshPhysicalMaterial color={couleur} metalness={.5} roughness={.28} clearcoat={1} clearcoatRoughness={.14} />
    </mesh>
    {/* Vitres latérales, encastrées : les montants restent dans la couleur de la caisse. */}
    {[-1, 1].map(cote => formes.vitres.map((v, i) => <mesh key={`${cote}${i}`} position={[0, 0, cote > 0 ? hz + .01 : -hz - .05]} castShadow>
      <extrudeGeometry args={[v, { depth: .04, bevelEnabled: false }]} /><meshPhysicalMaterial color="#1b323d" metalness={.6} roughness={.1} clearcoat={1} />
    </mesh>))}
    <VitreInclinee de={g.pareBrise[0]} a={g.pareBrise[1]} largeur={g.largeur - .3} recul={.02} />
    {g.lunette && <VitreInclinee de={g.lunette[0]} a={g.lunette[1]} largeur={g.largeur - .4} recul={-.02} />}
    {/* Portières : jointures et poignées. */}
    {[-1, 1].map(cote => <group key={cote}>
      {g.jointures.map(x => <mesh key={x} position={[x, .66, cote * (hz + .03)]}><boxGeometry args={[.018, .62, .012]} /><meshStandardMaterial color="#20262a" /></mesh>)}
      {g.poignees.map(x => <mesh key={x} position={[x, .86, cote * (hz + .05)]}><boxGeometry args={[.16, .03, .03]} /><meshStandardMaterial color={chrome} metalness={.8} roughness={.3} /></mesh>)}
      {/* Rétroviseur : coque dans la couleur de la caisse, miroir sombre. */}
      <mesh position={[g.pareBrise[0][0] + .12, g.pareBrise[0][1] + .12, cote * (hz + .1)]} castShadow><boxGeometry args={[.2, .12, .2]} /><meshStandardMaterial color={couleur} metalness={.4} roughness={.35} /></mesh>
      <mesh position={[g.pareBrise[0][0] + .01, g.pareBrise[0][1] + .12, cote * (hz + .1)]}><boxGeometry args={[.01, .09, .16]} /><meshStandardMaterial color="#27333a" metalness={.7} roughness={.15} /></mesh>
      {/* Phares et feux arrière. */}
      <mesh position={[g.longueur / 2 + .005, .62, cote * (hz - .32)]}><boxGeometry args={[.04, .16, .4]} /><meshStandardMaterial color="#e9ecd9" emissive="#fff1c4" emissiveIntensity={nuit ? 2.4 : .12} /></mesh>
      <mesh position={[-g.longueur / 2 - .005, .72, cote * (hz - .3)]}><boxGeometry args={[.04, .14, .34]} /><meshStandardMaterial ref={v => { feux.current[cote > 0 ? 1 : 0] = v; }} color="#9a2a24" emissive="#d22a1e" emissiveIntensity={nuit ? .9 : .25} /></mesh>
    </group>)}
    {/* Pare-chocs, calandre, plaques. */}
    <mesh position={[g.longueur / 2 - .04, .42, 0]} castShadow><boxGeometry args={[.14, .2, g.largeur - .1]} /><meshStandardMaterial color={sombre} roughness={.7} /></mesh>
    <mesh position={[-g.longueur / 2 + .04, .44, 0]} castShadow><boxGeometry args={[.14, .2, g.largeur - .1]} /><meshStandardMaterial color={sombre} roughness={.7} /></mesh>
    <mesh position={[g.longueur / 2 + .005, .64, 0]}><boxGeometry args={[.03, .14, .5]} /><meshStandardMaterial color="#2a3034" metalness={.5} roughness={.5} /></mesh>
    <mesh position={[g.longueur / 2 + .03, .4, 0]}><boxGeometry args={[.02, .11, .46]} /><meshStandardMaterial color="#efeee4" /></mesh>
    <mesh position={[-g.longueur / 2 - .03, .54, 0]}><boxGeometry args={[.02, .11, .46]} /><meshStandardMaterial color="#efeee4" /></mesh>
    {/* Roues : pneu, jante, moyeu. */}
    {g.roues.flatMap((x, i) => [-1, 1].map((cote, j) => <group key={`${x}:${cote}`} ref={v => { roues.current[i * 2 + j] = v; }} position={[x, g.rayonRoue, cote * demiVoie]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[g.rayonRoue, g.rayonRoue, .24, 18]} /><meshStandardMaterial color="#1b1f21" roughness={.95} /></mesh>
      <mesh position={[0, 0, cote * .125]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[g.rayonRoue * .62, g.rayonRoue * .62, .02, 12]} /><meshStandardMaterial color="#9aa5ab" metalness={.85} roughness={.25} /></mesh>
      <mesh position={[0, 0, cote * .14]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[g.rayonRoue * .18, g.rayonRoue * .18, .02, 8]} /><meshStandardMaterial color="#3a4449" metalness={.6} /></mesh>
    </group>))}
    {/* Pick-up : la benne ouverte, ses ridelles et son hayon ; des sacs de ciment dedans. */}
    {g.benne && <group>
      <mesh position={[(g.benne.de + g.benne.a) / 2, g.benne.plancher, 0]} receiveShadow><boxGeometry args={[g.benne.a - g.benne.de, .04, g.largeur - .16]} /><meshStandardMaterial color="#2d3134" roughness={.9} /></mesh>
      {[-1, 1].map(cote => <mesh key={cote} position={[(g.benne!.de + g.benne!.a) / 2, (g.benne!.plancher + g.benne!.haut) / 2, cote * (hz - .05)]} castShadow><boxGeometry args={[g.benne!.a - g.benne!.de, g.benne!.haut - g.benne!.plancher, .08]} /><meshStandardMaterial color={couleur} metalness={.5} roughness={.3} /></mesh>)}
      <mesh position={[g.benne.de + .04, (g.benne.plancher + g.benne.haut) / 2, 0]} castShadow><boxGeometry args={[.08, g.benne.haut - g.benne.plancher, g.largeur - .1]} /><meshStandardMaterial color={couleur} metalness={.5} roughness={.3} /></mesh>
      {[[-1.9, .3], [-1.45, -.25], [-1.0, .2]].map(([x, z], i) => <mesh key={i} position={[x, g.benne!.plancher + .14, z]} rotation={[0, i * .5, 0]} castShadow><boxGeometry args={[.5, .26, .34]} /><meshStandardMaterial color={i % 2 ? '#c9b48a' : '#8f8878'} roughness={1} /></mesh>)}
    </group>}
  </group>;
}
