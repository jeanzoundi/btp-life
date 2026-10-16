'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Une seule géométrie animée pour toute la lagune, sans lumières supplémentaires. */
export function EauLagune({ pause }: { pause: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const temps = useRef(0);
  useFrame((_, delta) => {
    if (!mesh.current || pause) return;
    temps.current += Math.min(delta, 0.1);
    const positions = mesh.current.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.18 + temps.current * 1.2) * 0.13 + Math.cos(y * 0.65 + temps.current) * 0.07);
    }
    positions.needsUpdate = true;
    mesh.current.geometry.computeVertexNormals();
  });
  return <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 82]} receiveShadow>
    <planeGeometry args={[300, 30, 90, 12]} />
    <meshStandardMaterial color="#367e88" metalness={0.45} roughness={0.23} />
  </mesh>;
}

export function JardinsUrbains() {
  const arbres = useMemo(() => [-112, -65, 65, 112].flatMap(x => [-115, -95, -45, -25, 35].map(z => [x, z])), []);
  return <group>
    {arbres.map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]} receiveShadow><cylinderGeometry args={[2.1, 2.3, 0.5, 8]} /><meshStandardMaterial color="#ada78f" /></mesh>
      <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.18, 0.28, 3.2, 7]} /><meshStandardMaterial color="#79583f" /></mesh>
      {[[-0.8, 3.7, 0], [0.9, 4, 0.3], [0, 4.9, -0.2]].map((p, j) => <mesh key={j} position={p as [number, number, number]} castShadow scale={[1.5, 1.1, 1.3]}><icosahedronGeometry args={[1.3, 1]} /><meshStandardMaterial color={['#557744', '#668553', '#43673d'][(i + j) % 3]} roughness={1} /></mesh>)}
    </group>)}
    {[-100, -60, -20, 20, 60, 100].map(x => <group key={x} position={[x, 0, 43]}>
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[3.2, 0.8, 1]} /><meshStandardMaterial color="#bcaa89" /></mesh>
      {[-1, 0, 1].map((o, i) => <mesh key={o} position={[o, 0.95, 0]}><icosahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color={i === 1 ? '#c97183' : '#739255'} /></mesh>)}
    </group>)}
  </group>;
}
