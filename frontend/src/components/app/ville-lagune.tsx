'use client';

import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import { LIMITES_VILLE, QUARTIERS } from '@/lib/ville';

type V = [number, number, number];
const ivoire = '#e8d9bd';
function Bloc({ p, s, c, r = 0 }: { p: V; s: V; c: string; r?: number }) {
  return <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={0.78} /></mesh>;
}
function Palmier({ p, scale = 1 }: { p: V; scale?: number }) {
  return <group position={p} scale={scale}>
    <mesh position={[0, 2.5, 0]} rotation={[0, 0, -0.08]} castShadow><cylinderGeometry args={[0.13, 0.28, 5, 7]} /><meshStandardMaterial color="#8b6242" /></mesh>
    {Array.from({ length: 7 }, (_, i) => <group key={i} position={[0.2, 5, 0]} rotation={[0, i * Math.PI * 2 / 7, 0]}>
      <mesh position={[0, -0.2, 1.25]} rotation={[0.2, 0, 0]} scale={[0.52, 0.14, 1.8]} castShadow><sphereGeometry args={[1, 7, 5]} /><meshStandardMaterial color={i % 2 ? '#496548' : '#65894e'} roughness={1} /></mesh>
    </group>)}
  </group>;
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
export function Architecture({ width: w, height: h, depth: d, kind, color }: { width: number; height: number; depth: number; kind: string; color: string }) {
  if (kind === 'chantier') return <group>
    <Bloc p={[0, 0.18, 0]} s={[w, 0.36, d]} c="#a89980" />
    {[0, 3.3, 6.6].map(y => <group key={y}>
      <Bloc p={[0, y + 0.3, 0]} s={[w * 0.85, 0.3, d * 0.8]} c="#b2b0a7" />
      {[-1, 1].flatMap(x => [-1, 0, 1].map(z => <Bloc key={`${x}-${z}`} p={[x * w * 0.38, y + 1.8, z * d * 0.34]} s={[0.45, 3, 0.45]} c="#aaa99c" />))}
    </group>)}
    <Bloc p={[w / 2 - 1, 7, 0]} s={[0.6, 14, 0.6]} c="#edb43c" />
    <Bloc p={[w / 2 - 6, 14, 0]} s={[17, 0.5, 0.5]} c="#edb43c" />
    <Bloc p={[-3, 10.5, 0]} s={[0.06, 7, 0.06]} c="#35434c" />
    {[-1, 0, 1].map(x => <Bloc key={x} p={[x * 3, 0.7, d / 2 + 2]} s={[2.2, 1.4, 1.4]} c="#bf744e" />)}
  </group>;
  const floors = Math.max(1, Math.floor(h / 3));
  const commercial = kind === 'commerce';
  return <group>
    <Bloc p={[0, h / 2, 0]} s={[w, h, d]} c={color} />
    <Bloc p={[0, 0.22, 0]} s={[w + 1.2, 0.44, d + 1.2]} c="#c7c0ad" />
    {Array.from({ length: floors }, (_, f) => <group key={f}>
      <Bloc p={[0, f * 3 + 0.35, 0]} s={[w + 0.6, 0.24, d + 0.6]} c={ivoire} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r, side) => {
        const span = side % 2 ? d : w;
        const offset = side % 2 ? w / 2 : d / 2;
        const count = Math.max(2, Math.floor(span / 2.5));
        return <group key={side} rotation={[0, r, 0]}>
          {Array.from({ length: count }, (_, k) => <group key={k} position={[(k - (count - 1) / 2) * (span / count), f * 3 + 1.8, offset + 0.05]}>
            <Bloc p={[0, 0, 0]} s={[1.6, 2.1, 0.15]} c="#e9ddc5" />
            <Bloc p={[0, 0, 0.09]} s={[1.35, 1.85, 0.1]} c={kind === 'tour' ? '#345763' : '#41686a'} />
            <Bloc p={[0, 0, 0.16]} s={[0.065, 1.85, 0.05]} c="#bfc3b8" />
            {f > 0 && kind !== 'tour' && <>
              <Bloc p={[0, -1.12, 0.47]} s={[1.95, 0.16, 1.1]} c={ivoire} />
              <Bloc p={[0, -0.45, 0.95]} s={[1.9, 0.06, 0.06]} c="#35464a" />
              {[-0.85, 0, 0.85].map(x => <Bloc key={x} p={[x, -0.8, 0.95]} s={[0.055, 0.7, 0.055]} c="#35464a" />)}
            </>}
          </group>)}
        </group>;
      })}
    </group>)}
    <Bloc p={[0, h + 0.1, 0]} s={[w + 0.8, 0.3, d + 0.8]} c={ivoire} />
    <Bloc p={[0, h + 0.4, 0]} s={[w - 0.8, 0.3, d - 0.8]} c="#697268" />
    <Bloc p={[w * 0.25, h + 0.9, 0]} s={[2, 0.7, 1.4]} c="#aeb6ae" />
    <Bloc p={[0, 1.25, d / 2 + 0.18]} s={[2, 2.5, 0.25]} c="#233e45" />
    {commercial && <>
      {Array.from({ length: 10 }, (_, i) => <Bloc key={i} p={[(i - 4.5) * w / 10, 2.95, d / 2 + 1]} s={[w / 10, 0.18, 2]} c={i % 2 ? '#f6e7c6' : color} />)}
      <Parasol p={[-3, 0, d / 2 + 4]} c="#db9e54" /><Parasol p={[3, 0, d / 2 + 4]} c="#f1ddab" />
    </>}
    {kind === 'campus' && [-w * 0.35, w * 0.35].map(x => <Bloc key={x} p={[x, 1.7, d / 2 + 1]} s={[0.6, 3.4, 0.6]} c={ivoire} />)}
  </group>;
}

function Traffic({ offset, color, pause }: { offset: number; color: string; pause: boolean }) {
  const car = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (car.current && !pause) car.current.position.x = ((car.current.position.x + Math.min(delta, 0.05) * 3 + 60) % 120) - 60; });
  return <group ref={car} position={[offset, 0, -10.5]}>
    <Bloc p={[0, 0.65, 0]} s={[3.6, 0.65, 1.7]} c={color} />
    <Bloc p={[-0.2, 1.16, 0]} s={[1.9, 0.55, 1.5]} c="#344b59" />
    <Bloc p={[-0.2, 1.49, 0]} s={[2, 0.12, 1.6]} c={color} />
    {[-1.1, 1.1].flatMap(x => [-0.86, 0.86].map(z => <mesh key={`${x}-${z}`} position={[x, 0.4, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.38, 0.38, 0.2, 12]} /><meshStandardMaterial color="#222b31" /></mesh>))}
    {[-0.55, 0.55].map(z => <Bloc key={z} p={[1.81, 0.7, z]} s={[0.05, 0.23, 0.4]} c="#fff0c3" />)}
  </group>;
}
function Bus({ pause }: { pause: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current && !pause) ref.current.position.x = ((ref.current.position.x + Math.min(delta, 0.05) * 2.1 + 118) % 236) - 118; });
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
  return <group position={[0, 0, -66]}><mesh position={[0, 0.4, 0]}><cylinderGeometry args={[4.2, 4.5, 0.8, 32]} /><meshStandardMaterial color="#b5b4a5" /></mesh><mesh position={[0, 0.8, 0]}><cylinderGeometry args={[3.6, 3.6, 0.18, 32]} /><meshStandardMaterial color="#55a6b2" /></mesh>{[-1.8, 0, 1.8].map(x => <mesh key={x} position={[x, 2, 0]}><cylinderGeometry args={[0.08, 0.14, 2.5, 8]} /><meshStandardMaterial color="#9adbea" transparent opacity={0.75} /></mesh>)}</group>;
}

/** A pedestrian square, tree-lined boulevards and a lagoon promenade. */
export function PaysageLagune({ onDestination, pause = false }: { onDestination: (p: [number, number]) => void; pause?: boolean }) {
  const sol = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 5) onDestination([THREE.MathUtils.clamp(e.point.x, LIMITES_VILLE.minX, LIMITES_VILLE.maxX), THREE.MathUtils.clamp(e.point.z, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]); };
  const texture = useMemo(() => {
    const data = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < 64 * 64; i++) {
      const seam = i % 64 % 16 === 0 || Math.floor(i / 64) % 16 === 0;
      const v = seam ? 145 : 190 + ((i * 73) % 17);
      data.set([v, v, v, 255], i * 4);
    }
    const t = new THREE.DataTexture(data, 64, 64); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(36, 33); t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group onClick={sol}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]} receiveShadow><planeGeometry args={[300, 260]} /><meshStandardMaterial color="#829079" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -40]} receiveShadow><planeGeometry args={[240, 176]} /><meshStandardMaterial color="#d4c7ad" map={texture} roughness={1} /></mesh>
    {[-66, -10, 10].map(z => <group key={z}>
      <Bloc p={[0, 0.05, z]} s={[240, 0.04, 6]} c="#555d60" />
      {Array.from({ length: 56 }, (_, i) => <Bloc key={i} p={[(i - 27.5) * 4.3, 0.08, z]} s={[2, 0.015, 0.1]} c="#e6dcbf" />)}
      {[-3.15, 3.15].map(o => <Bloc key={o} p={[0, 0.12, z + o]} s={[240, 0.2, 0.25]} c="#ede2c8" />)}
    </group>)}
    {[-54, 54].map(x => <Bloc key={x} p={[x, 0.075, -40]} s={[6, 0.035, 176]} c="#555d60" />)}
    {QUARTIERS.slice(1).map(q => <group key={q.nom} position={[q.x, 0, q.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}><circleGeometry args={[6, 32]} /><meshStandardMaterial color="#a8b292" /></mesh>
      <Billboard position={[0, 5.5, 0]}><Text fontSize={0.8} color="#183c3d" outlineColor="#fff0d3" outlineWidth={0.07}>{q.nom}</Text></Billboard>
      {[-5, 5].map(x => <group key={x}><Palmier p={[x, 0, 2]} /><Banc p={[x, 0, -2]} /><Lampadaire p={[x, 0, -5]} /></group>)}
    </group>)}
    {[-108, -72, 72, 108].flatMap(x => [-55, -110].map(z => <Palmier key={`${x}-${z}`} p={[x, 0, z]} />))}
    {[-86, 86].map(x => <ArretBus key={x} p={[x, 0.1, -61]} />)}
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
  </group>;
}
function ArchitectureBlock({ i }: { i: number }) {
  const h = 9 + (i * 7 % 20);
  return <group position={[(i - 5.5) * 20, 0, -145 - i % 3 * 7]}>
    <Bloc p={[0, h / 2, 0]} s={[8, h, 9]} c={['#9ea9a1', '#98a5a2', '#b8b6a4'][i % 3]} />
    {Array.from({ length: Math.floor(h / 3) }, (_, f) => <Bloc key={f} p={[0, f * 3 + 2, 4.55]} s={[7, 0.9, 0.08]} c="#6d898a" />)}
  </group>;
}
