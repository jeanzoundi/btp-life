'use client';
import { useMemo } from 'react';
import * as THREE from 'three';

export function VoitureMonde({couleur='#ab704b'}:{couleur?:string}){
  const formes=useMemo(()=>{
    const forme=(points:number[][])=>{const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;};
    return {carrosserie:forme([[-2,.4],[-2,.67],[-1.75,.8],[.6,.82],[1.75,.68],[2,.52],[1.9,.35],[-1.85,.35]]),vitres:forme([[-1.15,.8],[-.7,1.35],[.55,1.35],[1.13,.8]])};
  },[]);
  return <group>
    <mesh position={[0,0,-.79]} castShadow receiveShadow><extrudeGeometry args={[formes.carrosserie,{depth:1.58,bevelEnabled:true,bevelSize:.07,bevelThickness:.07,bevelSegments:2,steps:1}]}/><meshPhysicalMaterial color={couleur} metalness={.55} roughness={.26} clearcoat={1} clearcoatRoughness={.15}/></mesh>
    <mesh position={[0,0,-.68]} castShadow><extrudeGeometry args={[formes.vitres,{depth:1.36,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1}]}/><meshPhysicalMaterial color="#1b323d" metalness={.65} roughness={.12} clearcoat={1}/></mesh>
    <mesh position={[-.1,1.39,0]} castShadow><boxGeometry args={[1.32,.06,1.38]}/><meshPhysicalMaterial color={couleur} metalness={.4} roughness={.3}/></mesh>
    {[-1.25,1.25].flatMap(x=>[-.84,.84].map(z=><group key={`${x}:${z}`} position={[x,.36,z]}>
      <mesh castShadow><torusGeometry args={[.26,.105,8,20]}/><meshStandardMaterial color="#1c2123" roughness={.94}/></mesh>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.21,.21,.16,16]}/><meshStandardMaterial color="#8d9ca4" metalness={.85} roughness={.25}/></mesh>
    </group>))}
    {[-1,1].map(sign=><group key={sign}>
      <mesh position={[.73,1,sign*.82]}><boxGeometry args={[.22,.13,.18]}/><meshStandardMaterial color={couleur} metalness={.4}/></mesh>
      <mesh position={[1.98,.57,sign*.55]}><boxGeometry args={[.045,.13,.35]}/><meshStandardMaterial color="#edecd8" emissive="#fff2c5" emissiveIntensity={1.5}/></mesh>
      <mesh position={[-1.98,.6,sign*.57]}><boxGeometry args={[.045,.15,.32]}/><meshStandardMaterial color="#972b26" emissive="#cd241a" emissiveIntensity={.6}/></mesh>
      <mesh position={[-.22,1.05,sign*.707]}><boxGeometry args={[.07,.55,.035]}/><meshStandardMaterial color="#18232a"/></mesh>
      <mesh position={[-.5,.75,sign*.855]}><boxGeometry args={[.22,.035,.025]}/><meshStandardMaterial color="#b6bcb7" metalness={.8}/></mesh>
    </group>)}
    <mesh position={[2.01,.42,0]}><boxGeometry args={[.025,.13,.55]}/><meshStandardMaterial color="#dfddcb"/></mesh>
  </group>;
}
