'use client';

import { useFrame, ThreeEvent } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import { LIMITES_VILLE, QUARTIERS } from '@/lib/ville';
import { EauLagune, JardinsUrbains } from './ambiance-lagune';
import { SurfaceBloc } from './materiaux-monde';
import { VoitureMonde } from './vehicule-monde';
import { phaseSignal } from '@/lib/itineraire-ville';
import { ParcsMonde } from './parcs-monde';
import { aDevanture, FacadeAbidjan } from './facades-abidjan';
import { construireArchitecture } from '@/lib/architecture-ville';
import { BlocsInstances } from './blocs-instances';
import { avancerTrafic } from '@/lib/fluidite-monde';

type V = [number, number, number];
function Bloc({ p, s, c, r = 0, e }: { p: V; s: V; c: string; r?: number; e?: string }) {
  return <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow><boxGeometry args={s} />{e?<meshStandardMaterial color={c} emissive={e} emissiveIntensity={.65}/>:<SurfaceBloc dimensions={s} couleur={c}/>}</mesh>;
}

function VoitureStationnee({ p, r = 0, c }: { p: V; r?: number; c: string }) {
  return <group position={p} rotation={[0,r,0]}><VoitureMonde couleur={c}/></group>;
}
function VoitureStationneeAncienne({ p, r = 0, c }: { p: V; r?: number; c: string }) {
  return <group position={p} rotation={[0, r, 0]}>
    <Bloc p={[0, 0.52, 0]} s={[3.5, 0.58, 1.65]} c={c} />
    <mesh position={[-0.25, 1.05, 0]} castShadow><boxGeometry args={[1.8, 0.55, 1.42]} /><meshPhysicalMaterial color="#28434d" roughness={0.18} metalness={0.2} clearcoat={0.7} /></mesh>
    {[-1.05, 1.05].flatMap(x => [-0.84, 0.84].map(z => <mesh key={`${x}-${z}`} position={[x, 0.28, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.34, 0.34, 0.2, 16]} /><meshStandardMaterial color="#171b1d" roughness={0.95} /></mesh>))}
    {[-0.5, 0.5].map(z => <mesh key={z} position={[1.77, 0.58, z]}><boxGeometry args={[0.04, 0.2, 0.34]} /><meshStandardMaterial color="#fff1bf" emissive="#f2d077" emissiveIntensity={0.35} /></mesh>)}
  </group>;
}

function PanneauRue({ p, texte }: { p: V; texte: string }) {
  return <group position={p}><Bloc p={[0, 1.35, 0]} s={[0.1, 2.7, 0.1]} c="#344449" /><mesh position={[0, 2.65, 0]}><boxGeometry args={[3.2, 0.72, 0.12]} /><meshStandardMaterial color="#1d5558" roughness={0.55} /></mesh><Text position={[0, 2.65, 0.08]} fontSize={0.27} color="#fff3d2" anchorX="center" anchorY="middle">{texte}</Text></group>;
}
function PanneauAffichage({ p, titre, texte, r = 0, couleur = '#d89b3e' }: { p: V; titre: string; texte: string; r?: number; couleur?: string }) {
  return <group position={p} rotation={[0, r, 0]}>
    {[-1.65, 1.65].map(x => <Bloc key={x} p={[x, 1.3, 0]} s={[.13, 2.6, .13]} c="#344348" />)}
    <Bloc p={[0, 2.6, 0]} s={[4, 2.3, .22]} c="#25373d" />
    <Bloc p={[0, 2.6, .13]} s={[3.62, 1.92, .04]} c={couleur} e={couleur} />
    <Text position={[0, 2.93, .17]} fontSize={.3} maxWidth={3.2} textAlign="center" color="#17272c" anchorX="center">{titre}</Text>
    <Text position={[0, 2.42, .17]} fontSize={.17} maxWidth={3.1} textAlign="center" lineHeight={1.25} color="#fff6df" anchorX="center">{texte}</Text>
    <Bloc p={[0, 1.25, 0]} s={[4.4, .15, .7]} c="#706354" />
  </group>;
}
function Palmier({ p, scale = 1 }: { p: V; scale?: number }) {
  return <group position={p} scale={scale}>
    <mesh position={[0, 2.5, 0]} rotation={[0, 0, -0.08]} castShadow><cylinderGeometry args={[0.13, 0.26, 5, 12]} /><meshStandardMaterial color="#887053" roughness={1} /></mesh>
    <FeuillagePalmier />
    {[-.17, .17].map(x => <mesh key={x} position={[x + .2, 4.8, .12]} castShadow><sphereGeometry args={[.18, 8, 6]} /><meshStandardMaterial color="#697341" roughness={1} /></mesh>)}
  </group>;
}

/** Feathered fronds, batched into one draw call per palm instead of solid paddles. */
function FeuillagePalmier() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0, -.11, -.04, .42, 0, .035, .55,
      0, .035, .55, -.11, -.04, .42, 0, -.2, 1,
      0, 0, 0, 0, .035, .55, .11, -.04, .42,
      0, .035, .55, 0, -.2, 1, .11, -.04, .42,
    ], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Object3D();
    let index = 0;
    for (let frond = 0; frond < 9; frond++) {
      const angle = frond * Math.PI * 2 / 9;
      for (let leaf = 0; leaf < 12; leaf++) {
        const t = (leaf + .5) / 12, radius = t * 2.8;
        for (const side of [-1, 1]) {
          m.position.set(.2 + Math.sin(angle) * radius, 5.1 + Math.sin(t * Math.PI) * .55 - t * t * 1.2, Math.cos(angle) * radius);
          m.rotation.set(.18 + t * .6, angle + side * .95, 0);
          m.scale.setScalar(.9 * (1 - t * .65));
          m.updateMatrix();
          ref.current.setMatrixAt(index, m.matrix);
          ref.current.setColorAt(index++, new THREE.Color(frond % 3 === 0 ? '#657b39' : '#3e6336'));
        }
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, []);
  return <instancedMesh ref={ref} args={[geometry, undefined, 216]} castShadow receiveShadow>
    <meshStandardMaterial roughness={.92} side={THREE.DoubleSide} />
  </instancedMesh>;
}
function Banc({ p, r = 0 }: { p: V; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    {[0, 0.23, 0.46].map(z => <Bloc key={z} p={[0, 0.55, z]} s={[2.2, 0.12, 0.18]} c="#9b603c" />)}
    <Bloc p={[0, 0.98, -0.05]} s={[2.2, 0.55, 0.12]} c="#9b603c" />
    {[-0.8, 0.8].map(x => <Bloc key={x} p={[x, 0.25, 0.2]} s={[0.12, 0.5, 0.6]} c="#344449" />)}
  </group>;
}
function Parasol({ p, c }: { p: V; c: string }) {
  return <group position={p}>
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 3, 8]} /><meshStandardMaterial color="#796447" /></mesh>
    <mesh position={[0, 3, 0]} castShadow><coneGeometry args={[1.85, 0.65, 8]} /><meshStandardMaterial color={c} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.8, 0.8, 0.12, 12]} /><meshStandardMaterial color="#c18b53" /></mesh>
    {[-1, 1].map(x => <Bloc key={x} p={[x, 0.45, 0]} s={[0.5, 0.9, 0.5]} c="#eee0c3" />)}
  </group>;
}
function Lampadaire({ p }: { p: V }) {
  return <group position={p}><Bloc p={[0, 1.8, 0]} s={[0.12, 3.6, 0.12]} c="#29383d" /><mesh position={[0, 3.65, 0]} castShadow><sphereGeometry args={[0.26, 10, 8]} /><meshStandardMaterial color="#fff2bd" emissive="#ffd76a" emissiveIntensity={1.1} /></mesh></group>;
}
function ArretBus({ p, r = 0 }: { p: V; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    <Bloc p={[0, 1.25, 0]} s={[3.5, 0.12, 1.5]} c="#d4ddd8" />
    <Bloc p={[0, 2.55, 0]} s={[3.8, 0.18, 1.7]} c="#304b54" />
    {[-1.65, 1.65].map(x => <Bloc key={x} p={[x, 1.3, 0]} s={[0.1, 2.5, 0.1]} c="#304b54" />)}
    <Bloc p={[0, 0.55, 0.15]} s={[2.7, 0.16, 0.55]} c="#b67a49" />
    <Bloc p={[0, 1.45, -0.7]} s={[3.2, 2.1, 0.08]} c="#78a6aa" />
  </group>;
}
function Kiosque({ p }: { p: V }) {
  return <group position={p}><Bloc p={[0, 1.1, 0]} s={[3.6, 2.2, 2.8]} c="#c86e43" /><Bloc p={[0, 2.45, 0]} s={[4.2, 0.25, 3.4]} c="#f0d07c" /><Bloc p={[0, 1.25, 1.43]} s={[2.3, 1.05, 0.08]} c="#33555b" /><Textile p={[0, 2.25, 1.7]} /></group>;
}
function Textile({ p }: { p: V }) { return <group position={p}>{[-1.5, -0.5, 0.5, 1.5].map((x, i) => <Bloc key={x} p={[x, 0, 0]} s={[1, 0.18, 0.9]} c={i % 2 ? '#efe3bf' : '#3e7666'} />)}</group>; }

/** Original modular architecture: recessed glass, wraparound balconies and shopfronts. */
export const Architecture = memo(function Architecture({ width: w, height: h, depth: d, kind, color, nuit = false, slug = '' }: { width: number; height: number; depth: number; kind: string; color: string; nuit?: boolean; slug?: string }) {
  const devanture = aDevanture(slug);
  const plan = useMemo(() => construireArchitecture(w, h, d, kind, color, devanture, nuit), [w, h, d, kind, color, devanture, nuit]);
  return <group>
    <BlocsInstances blocs={plan.solides} interactif={false} />
    <BlocsInstances blocs={plan.vitres} matiere="vitre" interactif={false} />
    <BlocsInstances blocs={plan.lumieres} matiere="lumiere" interactif={false} />
    {/* Simple click volume: no per-window intersection work when moving the mouse. */}
    <mesh position={[0, (kind === 'chantier' ? 7 : h) / 2, 0]}>
      <boxGeometry args={[w, kind === 'chantier' ? 7 : h, d]} /><meshBasicMaterial visible={false} />
    </mesh>
    {devanture && <FacadeAbidjan slug={slug} largeur={w} profondeur={d} nuit={nuit} />}
    {kind === 'commerce' && <>
      <Parasol p={[-3, 0, d / 2 + 4]} c="#db9e54" /><Parasol p={[3, 0, d / 2 + 4]} c="#f1ddab" />
    </>}
  </group>;
});

function Traffic({ offset, color, pause }: { offset: number; color: string; pause: boolean }) {
  const car = useRef<THREE.Group>(null);
  const vitesse = useRef(3);
  useFrame(({ clock }, delta) => {
    if (!car.current) return;
    if (pause) { vitesse.current = 0; return; }
    const feuRouge = phaseSignal(clock.elapsedTime,'horizontal')!=='vert';
    const x = car.current.position.x;
    const distance = Math.min(...[-58.5, 49.5].map(stop => stop-x).filter(d => d >= -.001), Infinity);
    const mouvement = avancerTrafic(vitesse.current, distance, feuRouge, delta);
    vitesse.current = mouvement.vitesse;
    car.current.position.x = ((x + mouvement.deplacement + 60) % 120) - 60;
  });
  return <group ref={car} position={[offset, 0, -10.5]}>
    <VoitureMonde couleur={color} roulage={vitesse}/>
  </group>;
}
function TrafficVertical({ x, offset, color, pause, inverse = false }: { x: number; offset: number; color: string; pause: boolean; inverse?: boolean }) {
  const car = useRef<THREE.Group>(null);
  const vitesse = useRef(2.8);
  useFrame((_, delta) => {
    if (!car.current) return;
    if (pause) { vitesse.current = 0; return; }
    const feuRouge = phaseSignal(_.clock.elapsedTime,'vertical')!=='vert';
    const z = car.current.position.z;
    const stops = inverse ? [-61, -5, 15] : [-71, -15, 5];
    const sens = inverse ? -1 : 1;
    const distance = Math.min(...stops.map(stop => (stop-z)*sens).filter(d => d >= -.001), Infinity);
    const mouvement = avancerTrafic(vitesse.current, distance, feuRouge, delta, 2.8);
    vitesse.current = mouvement.vitesse;
    car.current.position.z = ((z + mouvement.deplacement * sens + 120) % 240) - 120;
  });
  return <group ref={car} position={[x, 0, offset]} rotation={[0, inverse?Math.PI/2:-Math.PI/2, 0]}>
    <VoitureMonde couleur={color} roulage={vitesse}/>
  </group>;
}
function Bus({ pause }: { pause: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!ref.current || pause) return;
    const x = ref.current.position.x;
    const feuRouge = phaseSignal(clock.elapsedTime,'horizontal')!=='vert';
    if (!feuRouge || ![-58.5, 49.5].some(stop => Math.abs(x - stop) < 0.9)) ref.current.position.x = ((x + Math.min(delta, 0.05) * 2.1 + 118) % 236) - 118;
  });
  return <group ref={ref} position={[-80, 0, -66]}><Bloc p={[0, 1.25, 0]} s={[6.5, 2.3, 2.2]} c="#e4b43d" /><Bloc p={[0.4, 1.6, 1.12]} s={[4.6, 0.75, 0.08]} c="#274957" />{[-2.1, 2.1].flatMap(x => [-1.12, 1.12].map(z => <mesh key={`${x}-${z}`} position={[x, 0.35, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.48, 0.48, 0.22, 12]} /><meshStandardMaterial color="#20272b" /></mesh>))}</group>;
}
function Bateau({ pause, offset }: { pause: boolean; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current && !pause) ref.current.position.x = ((ref.current.position.x + Math.min(delta, 0.05) * 1.5 + 130) % 260) - 130; });
  return <group ref={ref} position={[offset, 0.3, 82]}><mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}><coneGeometry args={[1.6, 6, 4]} /><meshStandardMaterial color="#f3eee0" /></mesh><Bloc p={[0, 1, 0]} s={[2.8, 1.2, 1.8]} c="#3e7781" /><Bloc p={[0, 2.6, 0]} s={[0.12, 4, 0.12]} c="#614d3e" /><mesh position={[0, 3.2, 0.05]}><planeGeometry args={[3.4, 2.4]} /><meshStandardMaterial color="#f0dba7" side={THREE.DoubleSide} /></mesh></group>;
}
function Oiseaux({ pause }: { pause: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current && !pause) ref.current.rotation.y += delta * 0.09; });
  return <group ref={ref}>{Array.from({ length: 7 }, (_, i) => <group key={i} position={[28 + i * 4, 19 + i % 3, 15 + i * 3]} rotation={[0, i, 0]}><mesh rotation={[0, 0, 0.4]}><boxGeometry args={[1.1, 0.05, 0.22]} /><meshBasicMaterial color="#25393b" /></mesh><mesh rotation={[0, 0, -0.4]}><boxGeometry args={[1.1, 0.05, 0.22]} /><meshBasicMaterial color="#25393b" /></mesh></group>)}</group>;
}
function Fontaine() {
  return <group position={[0, 0, -52]}><mesh position={[0, 0.4, 0]}><cylinderGeometry args={[4.2, 4.5, 0.8, 32]} /><meshStandardMaterial color="#b5b4a5" /></mesh><mesh position={[0, 0.8, 0]}><cylinderGeometry args={[3.6, 3.6, 0.18, 32]} /><meshStandardMaterial color="#55a6b2" /></mesh>{[-1.8, 0, 1.8].map(x => <mesh key={x} position={[x, 2, 0]}><cylinderGeometry args={[0.08, 0.14, 2.5, 8]} /><meshStandardMaterial color="#9adbea" transparent opacity={0.75} /></mesh>)}</group>;
}

function FeuTricolore({ p, axe }: { p: V; axe: 'horizontal' | 'vertical' }) {
  const rouge = useRef<THREE.MeshStandardMaterial>(null);
  const orange = useRef<THREE.MeshStandardMaterial>(null);
  const vert = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const phase=phaseSignal(clock.elapsedTime,axe);
    if(rouge.current)rouge.current.emissiveIntensity=phase==='rouge'?2.2:.08;
    if(orange.current)orange.current.emissiveIntensity=phase==='orange'?2.4:.05;
    if(vert.current)vert.current.emissiveIntensity=phase==='vert'?2.2:.08;
  });
  return <group position={p}>
    <Bloc p={[0, 1.4, 0]} s={[0.12, 2.8, 0.12]} c="#2d393d" />
    <Bloc p={[0, 2.9, 0]} s={[0.42, 1.05, 0.32]} c="#202a2e" />
    {[[3.2, '#e95645', rouge], [2.9, '#eab83e', orange], [2.6, '#48b66f', vert]].map(([y, couleur, ref], i) => <mesh key={i} position={[0, y as number, 0.17]}><sphereGeometry args={[0.095, 10, 8]} /><meshStandardMaterial ref={ref as React.RefObject<THREE.MeshStandardMaterial>} color={couleur as string} emissive={couleur as string} emissiveIntensity={0.08} /></mesh>)}
  </group>;
}

/** A pedestrian square, tree-lined boulevards and a lagoon promenade. */
export const PaysageLagune = memo(function PaysageLagune({ onDestination, pause = false }: { onDestination: (p: [number, number]) => void; pause?: boolean }) {
  const sol = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 5) onDestination([THREE.MathUtils.clamp(e.point.x, LIMITES_VILLE.minX, LIMITES_VILLE.maxX), THREE.MathUtils.clamp(e.point.z, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]); };
  const texture = useMemo(() => {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const y = Math.floor(i / size), row = Math.floor(y / 32);
      const x = (i % size + (row % 2) * 32) % size;
      const seam = x % 64 < 2 || y % 32 < 2;
      const tile = (Math.floor(x / 64) * 19 + row * 13) % 15;
      const v = seam ? 132 : 204 + tile + ((i * 73) % 9);
      data.set([v, v - 9, v - 23, 255], i * 4);
    }
    const t = new THREE.DataTexture(data, size, size); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(60, 44); t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group onClick={sol}>
    <EauLagune pause={pause} /><JardinsUrbains /><ParcsMonde/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]} receiveShadow><planeGeometry args={[300, 260]} /><meshStandardMaterial color="#829079" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -40]} receiveShadow><planeGeometry args={[240, 176]} /><meshStandardMaterial map={texture} roughness={.94}/></mesh>
    {[-66, -10, 10].map(z => <group key={z}>
      <Bloc p={[0, 0.05, z]} s={[240, 0.04, 6]} c="#555d60" />
      {Array.from({ length: 56 }, (_, i) => <Bloc key={i} p={[(i - 27.5) * 4.3, 0.08, z]} s={[2, 0.015, 0.1]} c="#e6dcbf" />)}
      {[-3.15, 3.15].map(o => <Bloc key={o} p={[0, 0.12, z + o]} s={[240, 0.2, 0.25]} c="#ede2c8" />)}
    </group>)}
    {[-54, 54].map(x => <Bloc key={x} p={[x, 0.075, -40]} s={[6, 0.035, 176]} c="#555d60" />)}
    {/* Passages piétons et marquages d'intersection : donnent une vraie échelle routière. */}
    {[-54, 54].flatMap(x => [-66, -10, 10].flatMap(z => Array.from({ length: 6 }, (_, i) => <Bloc key={`${x}-${z}-${i}`} p={[x + (i - 2.5) * 0.65, 0.15, z]} s={[0.38, 0.025, 4.2]} c="#eee8d7" />)))}
    {[-66, -10, 10].flatMap(z => [-54, 54].map(x => <FeuTricolore key={`signal-${x}-${z}`} p={[x + 3.8, 0, z + 3.8]} axe={x < 0 ? 'horizontal' : 'vertical'} />))}
    {QUARTIERS.slice(1).map(q => <group key={q.nom} position={[q.x, 0, q.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}><ringGeometry args={[4.7, 5.1, 40]} /><meshStandardMaterial color="#8d9b7e" /></mesh>
      <Billboard position={[0, 4.2, 0]}><Text fontSize={0.52} color="#183c3d" outlineColor="#fff0d3" outlineWidth={0.055}>{q.nom}</Text></Billboard>
      <Palmier p={[4.8, 0, 3.5]} scale={0.8} /><Lampadaire p={[-4.8, 0, -3.5]} />
    </group>)}
    {[-108, -72, 72, 108].flatMap(x => [-55, -110].map(z => <Palmier key={`${x}-${z}`} p={[x, 0, z]} />))}
    {[-86, 86].map(x => <ArretBus key={x} p={[x, 0.1, -61]} />)}
    <PanneauRue p={[-48, 0, -4]} texte="PLATEAU" /><PanneauRue p={[48, 0, 16]} texte="LAGUNE" />
    <PanneauAffichage p={[-18, 0, 7]} titre="BTP LIFE" texte={'Missions · Formations\nDécouvre la ville'} />
    <PanneauAffichage p={[18, 0, -7]} r={Math.PI} titre="SÉCURITÉ CHANTIER" texte={'Casque · Chaussures\nConsignes avant action'} couleur="#e9c94e" />
    <PanneauAffichage p={[-55, 0, -47]} r={Math.PI / 2} titre="QUARTIER DES JARDINS" texte={'Marché · Résidences\nZone musicale à proximité'} couleur="#68a979" />
    <PanneauAffichage p={[55, 0, -46]} r={-Math.PI / 2} titre="PLATEAU TECHNIQUE" texte={'Atelier · Logistique\nChantier du Plateau'} couleur="#5fa5b2" />
    <PanneauAffichage p={[72, 0, 48]} titre="MARINA" texte={'Promenade · Détente\nMusique lounge'} couleur="#589da6" />
    <Bloc p={[-31.5, 0.08, -15.2]} s={[17, 0.05, 3.2]} c="#666b69" />
    <Bloc p={[31.5, 0.08, -74]} s={[22, 0.05, 5.5]} c="#666b69" />
    <VoitureStationnee p={[-36, 0, -15.2]} c="#7e2831" /><VoitureStationnee p={[-27, 0, -15.2]} c="#d5c9aa" />
    <VoitureStationnee p={[26, 0, -74]} c="#416f84" /><VoitureStationnee p={[37, 0, -74]} c="#b88735" />
    {/* The square is pedestrian-only; road markings never cut across it. */}
    <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[5.8, 64]} /><meshStandardMaterial color="#b99471" /></mesh>
    <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.3, 5.5, 64]} /><meshStandardMaterial color="#eee2c3" /></mesh>
    {[-18, -9, 9, 18].flatMap(x => [-3.8, 3.8].map(z => <group key={`${x}-${z}`}>
      <Bloc p={[x, 0.35, z]} s={[3.8, 0.7, 2.6]} c="#adac92" />
      <Bloc p={[x, 0.73, z]} s={[3.5, 0.1, 2.3]} c="#596847" />
      <Palmier p={[x, 0.8, z]} scale={0.8} />
    </group>))}
    {[-12, 12].map(x => <Banc key={x} p={[x, 0.2, 1.8]} r={Math.PI} />)}
    {[-42, -28, -14, 14, 28, 42].flatMap(x => [-15, 15].map(z => <Lampadaire key={`${x}-${z}`} p={[x, 0, z]} />))}
    <ArretBus p={[-27, 0.1, -6.2]} /><ArretBus p={[27, 0.1, 6.2]} r={Math.PI} />
    <Kiosque p={[0, 0, 20]} />
    {[-46, -22, 22, 46].flatMap(x => [-16, 16].map(z => <Palmier key={`${x}-${z}`} p={[x, 0.1, z]} scale={1.15} />))}
    {/* Beach district, waterfront and timber promenade. */}
    <Bloc p={[0, 0.08, 58]} s={[240, 0.16, 20]} c="#e7cf92" />
    <Bloc p={[0, -0.06, 82]} s={[300, 0.1, 30]} c="#44878b" />
    <Bloc p={[0, 0.18, 47]} s={[240, 0.35, 5]} c="#a58c6d" />
    {Array.from({ length: 60 }, (_, i) => <group key={i}>
      <Bloc p={[(i - 29.5) * 4, 0.9, 49]} s={[0.12, 1.4, 0.12]} c="#e1dfca" />
      <Bloc p={[(i - 29.5) * 4, 1.55, 49]} s={[4, 0.08, 0.08]} c="#e1dfca" />
    </group>)}
    {[-42, -21, 0, 21, 42].map(x => <group key={x}><Palmier p={[x, 0, 44]} /><Banc p={[x + 3, 0.3, 46]} /></group>)}
    {[-70, -50, -30, -10, 10, 30, 50, 70].map((x, i) => <group key={x}><Parasol p={[x, 0.1, 57]} c={i % 2 ? '#d4664f' : '#f1d471'} /><Bloc p={[x + 2.2, 0.18, 59]} s={[2.4, 0.18, 0.75]} c="#55a1a2" r={-0.15} /></group>)}
    <group position={[0, 0.1, 57]}><Bloc p={[0, 0.08, 0]} s={[12, 0.12, 7]} c="#e8d5a4" />{[-6, 6].map(x => <Bloc key={x} p={[x, 1.4, 0]} s={[0.12, 2.8, 0.12]} c="#e8ece5" />)}<Bloc p={[0, 2.75, 0]} s={[12, 0.12, 0.12]} c="#e8ece5" /></group>
    <group position={[-93, 0, 60]}>{[-7, 0, 7].map((x, i) => <group key={x} position={[x, 0, 0]}><Kiosque p={[0, 0, 0]} />{i < 2 && <Parasol p={[3.3, 0, 2]} c="#efcf78" />}</group>)}</group>
    <Fontaine /><Bus pause={pause} /><Bateau pause={pause} offset={-60} /><Bateau pause={pause} offset={30} /><Oiseaux pause={pause} />
    {/* Skyline gives the playable district a wider urban context. */}
    {Array.from({ length: 12 }, (_, i) => <ArchitectureBlock key={i} i={i} />)}
    <Traffic offset={0} color="#cc8b42" pause={pause} /><Traffic offset={35} color="#a45340" pause={pause} /><Traffic offset={-35} color="#e0d8c4" pause={pause} />
    <TrafficVertical x={-52.5} offset={-95} color="#d5a42d" pause={pause} />
    <TrafficVertical x={-55.5} offset={-25} color="#577e97" pause={pause} inverse />
    <TrafficVertical x={52.5} offset={-65} color="#f0ece0" pause={pause} />
    <TrafficVertical x={55.5} offset={20} color="#b65d45" pause={pause} inverse />
  </group>;
});
function ArchitectureBlock({ i }: { i: number }) {
  const h = 9 + (i * 7 % 20);
  return <group position={[(i - 5.5) * 20, 0, -145 - i % 3 * 7]}>
    <Bloc p={[0, h / 2, 0]} s={[8, h, 9]} c={['#9ea9a1', '#98a5a2', '#b8b6a4'][i % 3]} />
    {Array.from({ length: Math.floor(h / 3) }, (_, f) => <Bloc key={f} p={[0, f * 3 + 2, 4.55]} s={[7, 0.9, 0.08]} c="#6d898a" />)}
  </group>;
}
