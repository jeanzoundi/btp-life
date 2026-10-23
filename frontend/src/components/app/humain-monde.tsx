'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Detailed, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BlocsInstances } from './blocs-instances';
import type { BlocArchitecture } from '@/lib/architecture-ville';
export { PersonnageStylise as HumainMonde } from './personnage-stylise';

type V=[number,number,number];
function Volume({p,s,c}:{p:V;s:V;c:string}){
  return <mesh position={p} scale={s} castShadow><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color={c} roughness={.82}/></mesh>;
}

/** Adult proportions, elbow/knee pivots and alternating gait, shared by every scene. */
export function HumainReference({variante=0,couleur='#456578',marche=false,assis=false,prof=false,casque=false,nom,scale=1}:{variante?:number;couleur?:string;marche?:boolean;assis?:boolean;prof?:boolean;casque?:boolean;nom?:string;scale?:number}){
  const corps=useRef<THREE.Group>(null),tete=useRef<THREE.Group>(null),etiquette=useRef<THREE.Group>(null);
  const membres=useRef<Array<THREE.Group|null>>([]),genoux=useRef<Array<THREE.Group|null>>([]);
  const world=useMemo(()=>new THREE.Vector3(),[]);
  const rythme=useRef(0), poidsMarche=useRef(0);
  const i=Math.abs(Math.floor(variante));
  const peau=['#68422e','#915d40','#b4815c','#503325','#a06947'][i%5];
  const cheveux=['#171512','#2d221b','#39332e'][i%3];
  const pantalon=['#26333e','#42423c','#354139','#493c36'][i%4];
  const profil=useMemo(()=>[new THREE.Vector2(.14,0),new THREE.Vector2(.17,.12),new THREE.Vector2(.205,.32),new THREE.Vector2(.22,.43),new THREE.Vector2(.14,.5),new THREE.Vector2(.08,.53)],[]);
  const silhouette=useMemo<BlocArchitecture[]>(()=>[
    {position:[0,assis?.95:1.2,0],taille:[.4,.55,.24],couleur,rotation:0},
    {position:[0,assis?1.38:1.68,0],taille:[.22,.29,.23],couleur:peau,rotation:0},
    ...[-1,1].flatMap(sign=>[
      {position:[sign*.25,assis?.85:1.06,0] as V,taille:[.1,.52,.12] as V,couleur,rotation:0},
      {position:[sign*.09,.45,assis?.24:0] as V,taille:[.14,.8,.15] as V,couleur:pantalon,rotation:0},
    ]),
  ],[couleur,peau,pantalon,assis]);
  useFrame(({clock,camera},delta)=>{
    if(etiquette.current){etiquette.current.getWorldPosition(world);etiquette.current.visible=camera.position.distanceTo(world)<18;}
    if(corps.current?.parent?.visible===false)return;
    const t=clock.elapsedTime,dt=Math.min(delta,.1);
    poidsMarche.current=THREE.MathUtils.damp(poidsMarche.current,marche?1:0,8,dt);
    rythme.current+=dt*7.2;
    const phase=rythme.current+i,poids=poidsMarche.current;
    if(corps.current){corps.current.position.y=(assis?-.38:0)+Math.abs(Math.sin(phase))*.018*poids+Math.sin(t*1.8+i)*.004;corps.current.rotation.z=Math.sin(phase)*.022*poids;}
    membres.current.forEach((m,j)=>{if(!m)return;const sign=j%2?1:-1;const repos=j<2?(prof?-.15+Math.sin(t*1.5+i)*.12:.05):0;const cible=assis?(j<2?-.65:-Math.PI/2):repos*(1-poids)+Math.sin(phase)*sign*(j<2?.4:.46)*poids;m.rotation.x=THREE.MathUtils.damp(m.rotation.x,cible,18,dt);});
    genoux.current.forEach((m,j)=>{if(m)m.rotation.x=THREE.MathUtils.damp(m.rotation.x,assis?Math.PI/2:Math.max(0,Math.sin(phase+(j?0:Math.PI)))*.65*poids,18,dt);});
    if(tete.current)tete.current.rotation.y=Math.sin(t*.4+i)*.08;
  });
  return <group scale={scale}>
    <Detailed distances={[0,50]} hysteresis={.12}>
    <group>
    <group ref={corps}>
      <mesh position={[0,.91,0]} scale={[1,1,.62]} castShadow><latheGeometry args={[profil,16]}/><meshStandardMaterial color={couleur} roughness={.9}/></mesh>
      <Volume p={[0,.91,0]} s={[.17,.13,.12]} c={pantalon}/>
      <Volume p={[0,1.47,0]} s={[.066,.09,.065]} c={peau}/>
      <group ref={tete} position={[0,1.66,0]}>
        <Volume p={[0,0,0]} s={[.115,.155,.113]} c={peau}/>
        <Volume p={[0,-.075,.035]} s={[.087,.078,.082]} c={peau}/>
        {[-1,1].map(sign=><group key={sign}>
          <Volume p={[sign*.115,-.013,0]} s={[.023,.041,.018]} c={peau}/>
          <Volume p={[sign*.043,.013,.102]} s={[.026,.012,.009]} c="#d6c5b4"/>
          <Volume p={[sign*.043,.013,.111]} s={[.009,.01,.004]} c="#221c16"/>
          <Volume p={[sign*.043,.037,.105]} s={[.031,.005,.009]} c={cheveux}/>
        </group>)}
        <Volume p={[0,-.02,.118]} s={[.018,.031,.028]} c={peau}/>
        <Volume p={[0,-.064,.105]} s={[.035,.006,.01]} c="#653f36"/>
        <Volume p={[0,.087,-.016]} s={[.12,i%3===2?.096:.075,.115]} c={cheveux}/>
        {i%3===2&&<Volume p={[0,.1,-.115]} s={[.07,.07,.06]} c={cheveux}/>}
        {prof&&[-.044,.044].map(x=><mesh key={x} position={[x,.015,.12]}><torusGeometry args={[.033,.003,4,16]}/><meshStandardMaterial color="#303431" metalness={.6}/></mesh>)}
        {casque&&<><Volume p={[0,.11,0]} s={[.14,.095,.14]} c="#e7b542"/><Volume p={[0,.06,.06]} s={[.15,.012,.15]} c="#d49b29"/></>}
      </group>
      {[-1,1].map((sign,j)=><group key={sign}>
        <group ref={v=>{membres.current[j]=v;}} position={[sign*.225,1.34,0]} rotation={[0,0,sign*.055]}>
          <Volume p={[0,-.12,0]} s={[.067,.17,.07]} c={couleur}/>
          <group position={[0,-.27,0]} rotation={[-.12,0,0]}><Volume p={[0,-.115,0]} s={[.045,.145,.048]} c={peau}/><Volume p={[0,-.26,.006]} s={[.042,.07,.025]} c={peau}/><Volume p={[-sign*.036,-.24,.02]} s={[.013,.037,.018]} c={peau}/></group>
        </group>
        <group ref={v=>{membres.current[j+2]=v;}} position={[sign*.09,.88,0]}>
          <Volume p={[0,-.19,0]} s={[.085,.24,.09]} c={pantalon}/>
          <group ref={v=>{genoux.current[j]=v;}} position={[0,-.4,0]}>
            <Volume p={[0,-.18,0]} s={[.061,.22,.066]} c={pantalon}/>
            <Volume p={[0,-.395,.055]} s={[.072,.065,.14]} c="#292a27"/>
            <mesh position={[0,-.44,.055]}><boxGeometry args={[.14,.024,.27]}/><meshStandardMaterial color="#101816"/></mesh>
          </group>
        </group>
      </group>)}
      {prof?<mesh position={[0,1.25,.131]} rotation={[0,0,.04]}><boxGeometry args={[.035,.31,.012]}/><meshStandardMaterial color="#293e50"/></mesh>:i%2===0&&<><Volume p={[0,1.18,-.13]} s={[.15,.22,.08]} c="#504b3a"/>{[-.135,.135].map(x=><Volume key={x} p={[x,1.25,.09]} s={[.019,.22,.018]} c="#504b3a"/>)}</>}
      {casque&&[-.09,.09].map(x=><mesh key={x} position={[x,1.21,.135]}><boxGeometry args={[.04,.33,.012]}/><meshStandardMaterial color="#e3e5ca"/></mesh>)}
    </group>
    </group>
    <group><BlocsInstances blocs={silhouette} arrondi/></group>
    </Detailed>
    {nom&&<group ref={etiquette}><Billboard position={[0,2.05,0]}><Text fontSize={.16} color="#f5edda" outlineColor="#17282d" outlineWidth={.015}>{nom}</Text></Billboard></group>}
  </group>;
}
