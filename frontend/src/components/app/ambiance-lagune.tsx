'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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

const FEUILLES_PAR_ARBRE = 56;
/** Deux essences des rues d'Abidjan : le manguier, couronne ronde et dense, et le flamboyant, parasol large fleuri de rouge. */
function ArbresAbidjan({ arbres }: { arbres: readonly [number, number][] }) {
  const troncs = useRef<THREE.InstancedMesh>(null), branches = useRef<THREE.InstancedMesh>(null), feuilles = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    arbres.forEach(([x, z], i) => {
      const flamboyant = i % 3 === 0, hauteurTronc = flamboyant ? 3.4 : 2.6;
      o.position.set(x, hauteurTronc / 2, z); o.rotation.set(0, 0, .03 * Math.sin(i * 2.1)); o.scale.set(flamboyant ? .32 : .42, hauteurTronc, flamboyant ? .32 : .42); o.updateMatrix();
      troncs.current?.setMatrixAt(i, o.matrix);
      // Trois maîtresses branches qui portent la couronne.
      for (let b = 0; b < 3; b++) {
        const a = b * 2.09 + i;
        o.position.set(x + Math.cos(a) * .7, hauteurTronc + .55, z + Math.sin(a) * .7); o.rotation.set(Math.sin(a) * .7, 0, -Math.cos(a) * .7); o.scale.set(.16, 1.7, .16); o.updateMatrix();
        branches.current?.setMatrixAt(i * 3 + b, o.matrix);
      }
      for (let j = 0; j < FEUILLES_PAR_ARBRE; j++) {
        const a = j * 2.39996 + i, t = (j + .5) / FEUILLES_PAR_ARBRE;
        const r = (flamboyant ? 3.5 : 2.5) * Math.sqrt(t);
        const y = flamboyant ? hauteurTronc + 1.2 + (1 - t) * .8 + Math.sin(j * 1.7) * .25 : hauteurTronc + 1.1 + (1 - r / 2.5) * 2.6 + Math.sin(j * 1.3) * .3;
        o.position.set(x + Math.cos(a) * r, y, z + Math.sin(a) * r); o.rotation.set(Math.sin(j) * .5, a, Math.cos(j) * .4);
        o.scale.set(flamboyant ? 1.05 : .95, flamboyant ? .32 : .62, flamboyant ? 1.15 : 1); o.updateMatrix();
        feuilles.current?.setMatrixAt(i * FEUILLES_PAR_ARBRE + j, o.matrix);
        const fleur = flamboyant && j % 5 !== 0;
        c.set(fleur ? ['#D9482B', '#E8742B', '#C4372A'][j % 3] : flamboyant ? '#4C7A3A' : ['#2F5A33', '#3B6A3A', '#26482E', '#46773F'][(i + j) % 4]);
        feuilles.current?.setColorAt(i * FEUILLES_PAR_ARBRE + j, c);
      }
    });
    for (const m of [troncs.current, branches.current, feuilles.current]) if (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); }
  }, [arbres]);
  return <group>
    <instancedMesh ref={troncs} args={[undefined, undefined, arbres.length]} castShadow><cylinderGeometry args={[.7, 1, 1, 9]} /><meshStandardMaterial color="#5E4A36" roughness={.95} /></instancedMesh>
    <instancedMesh ref={branches} args={[undefined, undefined, arbres.length * 3]} castShadow><cylinderGeometry args={[.6, 1, 1, 7]} /><meshStandardMaterial color="#5E4A36" roughness={.95} /></instancedMesh>
    <instancedMesh ref={feuilles} args={[undefined, undefined, arbres.length * FEUILLES_PAR_ARBRE]} castShadow receiveShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial roughness={.9} /></instancedMesh>
  </group>;
}

export function JardinsUrbains() {
  const arbres = useMemo(() => [-112, -65, 65, 112].flatMap(x => [-115, -95, -45, -25, 35].map(z => [x, z] as [number, number])), []);
  return <group>
    {arbres.map(([x, z], i) => <mesh key={i} position={[x, 0.25, z]} receiveShadow><cylinderGeometry args={[2.1, 2.3, 0.5, 8]} /><meshStandardMaterial color="#ada78f" /></mesh>)}
    <ArbresAbidjan arbres={arbres} />
    {[-100, -60, -20, 20, 60, 100].map(x => <group key={x} position={[x, 0, 43]}>
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[3.2, 0.8, 1]} /><meshStandardMaterial color="#bcaa89" /></mesh>
      {[-1, 0, 1].map((o, i) => <mesh key={o} position={[o, 0.95, 0]}><icosahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color={i === 1 ? '#c97183' : '#739255'} /></mesh>)}
    </group>)}
  </group>;
}
