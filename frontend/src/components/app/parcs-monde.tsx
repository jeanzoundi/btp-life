'use client';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

const ILOTS=[[-22,-51],[22,-51],[-29,44],[29,44],[-114,-92],[114,-92]];
const ARBRES=ILOTS.flatMap(([x,z])=>[[-5,-4],[5,-4],[-5,4]].map(([dx,dz])=>[x+dx,z+dz]));
/** Hundreds of leaves in one draw call; planted islands stay off roads and building doors. */
export function ParcsMonde(){
  const feuillage=useRef<THREE.InstancedMesh>(null),troncs=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const o=new THREE.Object3D(),color=new THREE.Color();
    ARBRES.forEach(([x,z],i)=>{
      o.position.set(x,1.5,z);o.rotation.set(0,0,.025*Math.sin(i));o.scale.set(.18,3,.18);o.updateMatrix();troncs.current?.setMatrixAt(i,o.matrix);
      for(let j=0;j<40;j++){
        const a=j*2.39996,r=1.65*Math.sqrt((j+.5)/40),y=3.3+1.8*(1-r/2)+Math.sin(j*3.1)*.2;
        o.position.set(x+Math.cos(a)*r,y,z+Math.sin(a)*r);o.rotation.set(Math.sin(j)*.4,a,Math.cos(j)*.35);o.scale.set(.55,.23,.7);o.updateMatrix();
        feuillage.current?.setMatrixAt(i*40+j,o.matrix);color.set(['#355c3f','#466b43','#607d48','#274a39'][(i+j)%4]);feuillage.current?.setColorAt(i*40+j,color);
      }
    });
    if(feuillage.current){feuillage.current.instanceMatrix.needsUpdate=true;if(feuillage.current.instanceColor)feuillage.current.instanceColor.needsUpdate=true;feuillage.current.computeBoundingSphere();}
    if(troncs.current){troncs.current.instanceMatrix.needsUpdate=true;troncs.current.computeBoundingSphere();}
  },[]);
  return <group>
    {ILOTS.map(([x,z],i)=><group key={i} position={[x,.13,z]}>
      <mesh receiveShadow><boxGeometry args={[14,.16,12]}/><meshStandardMaterial color="#73836a" roughness={1}/></mesh>
      <mesh position={[0,.085,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[13.6,11.6]}/><meshStandardMaterial color="#536b48" roughness={1}/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*6.9,.04,0]}><boxGeometry args={[.15,.2,12]}/><meshStandardMaterial color="#bcbcaf"/></mesh>)}
    </group>)}
    <instancedMesh ref={troncs} args={[undefined,undefined,ARBRES.length]} castShadow><cylinderGeometry args={[.7,1,1,8]}/><meshStandardMaterial color="#65523b" roughness={.95}/></instancedMesh>
    <instancedMesh ref={feuillage} args={[undefined,undefined,ARBRES.length*40]} castShadow receiveShadow><sphereGeometry args={[1,8,6]}/><meshStandardMaterial roughness={.92}/></instancedMesh>
  </group>;
}
