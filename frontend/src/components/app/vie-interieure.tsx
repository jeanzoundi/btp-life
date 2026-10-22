'use client';

import { useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { positionsVieInterieure, PROFILS_INTERIEURS, type TypeVieInterieure } from '@/lib/vie-interieure';
import { HumainMonde } from './humain-monde';

function Figurante({type,index,depart,role}:{type:TypeVieInterieure;index:number;depart:[number,number];role:string}){
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock},dt)=>{if(!ref.current||index!==0)return;const x=depart[0]+Math.sin(clock.elapsedTime*.2)*.7;const dx=x-ref.current.position.x;ref.current.position.x+=THREE.MathUtils.clamp(dx,-dt*.45,dt*.45);ref.current.rotation.y=dx>=0?Math.PI/2:-Math.PI/2;});
  return <group ref={ref} position={[depart[0],0,depart[1]]}><HumainMonde variante={index+2} couleur={PROFILS_INTERIEURS[type].couleur} marche={index===0} casque={type==='chantier'} prof={index>0} nom={role}/></group>;
}
function FiguranteAncienne({ type, index, depart, role }: { type: TypeVieInterieure; index: number; depart: [number, number]; role: string }) {
  const groupe = useRef<THREE.Group>(null), brasG = useRef<THREE.Group>(null), brasD = useRef<THREE.Group>(null);
  const profil = PROFILS_INTERIEURS[type];
  useFrame(({ clock }, delta) => {
    if (!groupe.current) return;
    const t = clock.elapsedTime * profil.rythme + index * 2.1;
    if (index === 0) {
      const cibleX = Math.sin(t * .55) * 2.1;
      const dx = cibleX - groupe.current.position.x;
      groupe.current.position.x += THREE.MathUtils.clamp(dx, -delta * .7, delta * .7);
      groupe.current.rotation.y = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
      const marche = Math.sin(t * 8) * .28; if (brasG.current) brasG.current.rotation.x = marche; if (brasD.current) brasD.current.rotation.x = -marche;
    } else {
      groupe.current.position.y = Math.sin(t * 2) * .012;
      if (brasG.current) brasG.current.rotation.x = -.35 + Math.sin(t * 2.8) * .08;
      if (brasD.current) brasD.current.rotation.x = -.35 - Math.sin(t * 2.8) * .08;
    }
  });
  const peau = ['#71452f', '#9a6547', '#5d3829'][index % 3], pantalon = ['#2f414b', '#554c43', '#344b45'][index % 3];
  return <group ref={groupe} position={[depart[0], 0, depart[1]]} scale={.78}>
    <mesh position={[0, 1.2, 0]} castShadow><capsuleGeometry args={[.28,.7,5,8]} /><meshStandardMaterial color={profil.couleur} roughness={.85} /></mesh>
    <mesh position={[0, 2.05, 0]} castShadow><sphereGeometry args={[.31,14,12]} /><meshStandardMaterial color={peau} roughness={.9} /></mesh>
    <mesh position={[0, 2.27,-.04]} scale={[1,.5,1]} castShadow><sphereGeometry args={[.32,12,10]} /><meshStandardMaterial color="#29211d" roughness={1} /></mesh>
    <group ref={brasG} position={[-.36,1.5,0]}><mesh position={[0,-.35,0]} castShadow><capsuleGeometry args={[.1,.48,4,7]} /><meshStandardMaterial color={peau} /></mesh></group>
    <group ref={brasD} position={[.36,1.5,0]}><mesh position={[0,-.35,0]} castShadow><capsuleGeometry args={[.1,.48,4,7]} /><meshStandardMaterial color={peau} /></mesh></group>
    {[-.14,.14].map(x=><mesh key={x} position={[x,.48,0]} castShadow><capsuleGeometry args={[.12,.58,4,7]} /><meshStandardMaterial color={pantalon} /></mesh>)}
    {type === 'chantier' && <group position={[0,2.37,0]}><mesh scale={[1,.45,1]}><sphereGeometry args={[.36,12,8]} /><meshStandardMaterial color="#f2bd2e" /></mesh><mesh position={[0,-.06,.25]}><boxGeometry args={[.5,.06,.22]} /><meshStandardMaterial color="#d99c19" /></mesh></group>}
    {index > 0 && <Billboard position={[0,2.7,0]}><Text fontSize={.18} color="#fff7e3" outlineColor="#26383c" outlineWidth={.035}>{role}</Text></Billboard>}
  </group>;
}

function ElementsAnimes({ type }: { type: TypeVieInterieure }) {
  const ventilateur = useRef<THREE.Group>(null), ecran = useRef<THREE.MeshStandardMaterial>(null), aiguille = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (ventilateur.current) ventilateur.current.rotation.y += delta * 2.8;
    if (ecran.current) ecran.current.emissiveIntensity = .25 + Math.sin(clock.elapsedTime * 1.7) * .08;
    if (aiguille.current) aiguille.current.rotation.z = -clock.elapsedTime * .08;
  });
  return <>
    <group position={[0,3.2,0]} ref={ventilateur}><mesh><cylinderGeometry args={[.08,.08,.25,10]} /><meshStandardMaterial color="#4b5557" /></mesh>{[0,Math.PI/2].map(r=><mesh key={r} rotation={[0,r,0]}><boxGeometry args={[3,.05,.22]} /><meshStandardMaterial color="#667271" /></mesh>)}</group>
    <group position={[0,1.95,-4.66]}><mesh><circleGeometry args={[.38,24]} /><meshStandardMaterial color="#f2ead7" /></mesh><group ref={aiguille} position={[0,0,.02]}><mesh position={[0,.13,0]}><boxGeometry args={[.025,.26,.02]} /><meshStandardMaterial color="#39484c" /></mesh></group></group>
    <mesh position={[2.65,1.65,-4.64]}><boxGeometry args={[1.6,.75,.04]} /><meshStandardMaterial ref={ecran} color="#365d68" emissive="#376e7a" emissiveIntensity={.3} /></mesh>
    <Text position={[2.65,1.65,-4.61]} fontSize={.14} maxWidth={1.35} textAlign="center" color="#d9f0e8">{type === 'chantier' ? 'SÉCURITÉ · EPI' : type === 'restauration' ? 'SERVICE EN COURS' : 'BTP LIFE · BIENVENUE'}</Text>
  </>;
}

export function VieInterieure({ type }: { type: TypeVieInterieure }) {
  return <><ElementsAnimes type={type} />{positionsVieInterieure(type).map((p,i)=><Figurante key={p.id} type={type} index={i} {...p} />)}</>;
}
