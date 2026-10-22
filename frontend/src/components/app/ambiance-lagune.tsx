'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Une seule géométrie animée pour toute la lagune, sans lumières supplémentaires. */
export function EauLagune({ pause }: { pause: boolean }) {
  const temps=useMemo(()=>({value:0}),[]);
  const material=useMemo(()=>{
    const m=new THREE.MeshPhysicalMaterial({color:'#246771',metalness:.25,roughness:.18,clearcoat:1,clearcoatRoughness:.1});
    m.onBeforeCompile=shader=>{
      shader.uniforms.uWaterTime=temps;
      shader.vertexShader='uniform float uWaterTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        transformed.z += sin(position.x*.7+uWaterTime)*.09 + cos(position.y*1.5+uWaterTime*.7)*.045;`);
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        objectNormal=normalize(vec3(-.063*cos(position.x*.7+uWaterTime),.0675*sin(position.y*1.5+uWaterTime*.7),1.));`);
    };
    return m;
  },[temps]);
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame((_,delta)=>{if(!pause)temps.value+=Math.min(delta,.1);});
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 82]} receiveShadow material={material}>
    <planeGeometry args={[300, 30, 180, 30]} />
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
