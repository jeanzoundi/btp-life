'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { destinationUniversite, ESCALIER_UNIVERSITE, itineraireUniversite, POINTS_UNIVERSITE } from '@/lib/plan-universite';

type V = [number, number, number];
function Bloc({ p, s, c, rond = false, metal = 0 }: { p: V; s: V; c: string; rond?: boolean; metal?: number }) {
  const mat = <meshStandardMaterial color={c} roughness={metal ? .28 : .78} metalness={metal} />;
  return rond ? <RoundedBox args={s} position={p} radius={.035} smoothness={2} castShadow receiveShadow>{mat}</RoundedBox> : <mesh position={p} castShadow receiveShadow><boxGeometry args={s} />{mat}</mesh>;
}
function ChaiseCours({ p, c = '#496876' }: { p: V; c?: string }) {
  return <group position={p}><Bloc p={[0,.42,0]} s={[.45,.08,.42]} c={c} rond /><Bloc p={[0,.72,-.18]} s={[.45,.55,.07]} c={c} rond />{[-.17,.17].flatMap(x=>[-.14,.14].map(z=><Bloc key={`${x}${z}`} p={[x,.2,z]} s={[.035,.4,.035]} c="#3f494c" />))}</group>;
}
function TableCours({ p, largeur = 1.55 }: { p: V; largeur?: number }) {
  return <group position={p}><Bloc p={[0,.72,0]} s={[largeur,.07,.75]} c="#b89970" rond />{[-largeur/2+.12,largeur/2-.12].flatMap(x=>[-.27,.27].map(z=><Bloc key={`${x}${z}`} p={[x,.35,z]} s={[.045,.7,.045]} c="#445157" />))}</group>;
}
function EcranBim({ p }: { p: V }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => { if (mat.current) mat.current.emissiveIntensity = .28 + Math.sin(clock.elapsedTime * 1.4) * .08; });
  return <group position={p}><Bloc p={[0,.75,0]} s={[1.5,.07,.72]} c="#9a805f" /><Bloc p={[0,1.3,-.28]} s={[1.05,.7,.06]} c="#283c42" /><mesh position={[0,1.3,-.245]}><boxGeometry args={[.93,.58,.015]} /><meshStandardMaterial ref={mat} color="#47747c" emissive="#3b7480" /></mesh><Text position={[0,1.3,-.235]} fontSize={.11} color="#d8f0ea">MAQUETTE BIM</Text><ChaiseCours p={[0,0,.55]} c="#48616b" /></group>;
}
function PersonneUniversite({ p, professeur = false, index = 0, etage = 0 }: { p: V; professeur?: boolean; index?: number; etage?: number }) {
  const groupe = useRef<THREE.Group>(null), bras = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (!groupe.current) return; const t = clock.elapsedTime + index * 1.7; groupe.current.position.y = p[1] + Math.sin(t * 1.8) * .012; if (bras.current) bras.current.rotation.x = professeur ? -.55 + Math.sin(t * 2.2) * .18 : -.2 + Math.sin(t * 1.5) * .05; });
  const peau = ['#70442f','#986247','#5b3728','#af7656'][index%4];
  return <group ref={groupe} position={p} scale={.68}>
    <mesh position={[0,1.2,0]} castShadow><capsuleGeometry args={[.3,.74,5,8]} /><meshStandardMaterial color={professeur?'#334f60':['#5c8074','#9c684e','#596b8c'][index%3]} /></mesh>
    <mesh position={[0,2.08,0]} castShadow><sphereGeometry args={[.32,14,12]} /><meshStandardMaterial color={peau} /></mesh><mesh position={[0,2.29,-.04]} scale={[1,.48,1]}><sphereGeometry args={[.33,12,8]} /><meshStandardMaterial color="#29211d" /></mesh>
    <group ref={bras} position={[.38,1.55,0]}><mesh position={[0,-.35,0]}><capsuleGeometry args={[.1,.5,4,7]} /><meshStandardMaterial color={peau} /></mesh></group><mesh position={[-.38,1.2,0]}><capsuleGeometry args={[.1,.5,4,7]} /><meshStandardMaterial color={peau} /></mesh>
    {[-.14,.14].map(x=><mesh key={x} position={[x,.48,0]}><capsuleGeometry args={[.12,.58,4,7]} /><meshStandardMaterial color="#34434b" /></mesh>)}
    {professeur && <Text position={[0,2.72,0]} fontSize={.18} color="#fff1c9" outlineColor="#26383c" outlineWidth={.035}>Professeur · N{etage+1}</Text>}
  </group>;
}

function Escalier() {
  return <group position={[ESCALIER_UNIVERSITE.x,0,ESCALIER_UNIVERSITE.z]}>
    {Array.from({length:14},(_,i)=><Bloc key={i} p={[0,.14+i*.145,1.4-i*.2]} s={[1.65,.28,.28]} c={i%2?'#c4b79f':'#d0c4ad'} />)}
    {[-.92,.92].map(x=><group key={x}><Bloc p={[x,1.15,.15]} s={[.06,2.3,.06]} c="#42545a" metal={.4} /><mesh position={[x,1.85,.15]} rotation={[Math.atan2(2.05,2.8),0,0]}><cylinderGeometry args={[.035,.035,3.5,10]} /><meshStandardMaterial color="#42545a" metalness={.5} roughness={.3} /></mesh></group>)}
    <Text position={[0,.25,2]} fontSize={.16} color="#344b52">ESCALIER · ÉTAGE 1</Text>
  </group>;
}
function Accueil() { return <group position={[-3.8,0,2.2]}><Bloc p={[0,.5,0]} s={[2.8,1,.9]} c="#416b72" rond /><Bloc p={[0,1.05,0]} s={[2.9,.09,1]} c="#ba9d73" /><Text position={[0,.7,.47]} fontSize={.16} color="#fff0cf">ACCUEIL ÉTUDIANTS</Text><Bloc p={[-.6,1.14,0]} s={[.5,.08,.32]} c="#f0e7d5" /></group>; }
function Amphitheatre() { return <group position={[-3.2,0,-2.6]}><Bloc p={[0,.12,0]} s={[4.2,.24,2.8]} c="#81786b" />{[0,1,2].map(row=><group key={row} position={[0,.18+row*.18,.75-row*.75]}>{[-1.3,-.43,.43,1.3].map((x,i)=><group key={x}><ChaiseCours p={[x,0,0]} c={i%2?'#54707d':'#466472'} /><Bloc p={[x,.72,-.32]} s={[.72,.045,.3]} c="#b59670" /></group>)}</group>)}<Bloc p={[0,1.55,-1.52]} s={[3.8,1.55,.08]} c="#31585e" /><Text position={[0,1.6,-1.47]} fontSize={.18} color="#e4f1df">STRUCTURES · MATÉRIAUX · BIM</Text><PersonneUniversite p={[0,0,-.9]} professeur /></group>; }
function Administration() { return <group position={[3.8,0,2.3]}><Bloc p={[0,1,-.45]} s={[2.2,2,.55]} c="#8f7b60" />{[.35,1,1.65].map(y=><Bloc key={y} p={[0,y,-.16]} s={[1.9,.06,.5]} c="#c0a983" />)}<TableCours p={[0,0,.55]} largeur={2.2}/><ChaiseCours p={[0,0,1.15]} /><Text position={[0,2.25,-.47]} fontSize={.17} color="#344b52">SCOLARITÉ</Text></group>; }
function Classe({ y }: { y:number }) { return <group position={[-3.3,y,-2.5]}><Bloc p={[0,1.5,-1.5]} s={[4.2,1.3,.08]} c="#315a60" /><Text position={[0,1.55,-1.45]} fontSize={.17} color="#edf5df">TECHNOLOGIE DU BÂTIMENT</Text>{[-.9,.9].flatMap((x,i)=>[-.35,.75].map((z,j)=><group key={`${x}${z}`}><TableCours p={[x,0,z]} largeur={1.45}/><ChaiseCours p={[x,0,z+.55]} c={(i+j)%2?'#637d6e':'#4f6d79'} /><PersonneUniversite p={[x+.25,0,z+.48]} index={i*2+j+1} etage={1}/></group>))}<PersonneUniversite p={[0,0,-.9]} professeur index={4} etage={1}/></group>; }
function LaboratoireBim({ y }: { y:number }) { return <group position={[3.1,y,-2.5]}>{[-.8,.8].flatMap((x,i)=>[-.45,.8].map((z,j)=><group key={`${x}${z}`}><EcranBim p={[x,0,z]} /><PersonneUniversite p={[x+.32,0,z+.52]} index={i*2+j+5} etage={1}/></group>))}<Text position={[0,2.2,-1.5]} fontSize={.18} color="#35545d">LABORATOIRE BIM</Text></group>; }
function Bibliotheque({ y }: { y:number }) { return <group position={[3.8,y,2.4]}>{[-.8,0,.8].map((z,i)=><group key={z}><Bloc p={[0,1,z]} s={[2.6,2,.42]} c="#92785a" />{[.35,.9,1.45].map(h=><Bloc key={h} p={[-1.32,h,z]} s={[.08,.05,.4]} c="#c3a77e" />)}{[-.9,-.45,0,.45,.9].map((x,j)=><Bloc key={x} p={[x,.55+(j%3)*.4,z+.23]} s={[.25,.4,.12]} c={['#587787','#b06d55','#758f6c'][j%3]} />)}</group>)}<Text position={[0,2.25,-1.1]} fontSize={.18} color="#344b52">BIBLIOTHÈQUE TECHNIQUE</Text></group>; }

function JoueurUniversite({ directions, destination, onArrivee }: { directions:Set<string>; destination:number|null; onArrivee:(message:string)=>void }) {
  const ref = useRef<THREE.Group>(null), route = useRef<ReturnType<typeof itineraireUniversite>>([]), etage = useRef<0|1>(0), cibleRef = useRef<number|null>(null), bras = useRef<THREE.Group>(null);
  const [niveau, setNiveau] = useState(0);
  useEffect(()=>{ if(destination===null||!ref.current)return; cibleRef.current=destination; const cible=destinationUniversite(destination); route.current=itineraireUniversite(etage.current,cible); },[destination]);
  useFrame((_,delta)=>{
    if(!ref.current)return;
    const p=ref.current.position;
    let dx=Number(directions.has('droite'))-Number(directions.has('gauche'));
    let dz=Number(directions.has('arriere'))-Number(directions.has('avant'));
    if(dx||dz) route.current=[];
    else if(route.current.length){const point=route.current[0];dx=point.x-p.x;dz=point.z-p.z;}
    const point=route.current[0];
    if(point?.escalier){
      const distance=Math.hypot(dx,dz),pas=Math.min(delta,.05)*1.25,cibleY=point.etage*3.65;
      if(distance>.04){p.x+=dx/distance*Math.min(pas,distance);p.z+=dz/distance*Math.min(pas,distance);ref.current.rotation.y=Math.atan2(dx,dz);}
      p.y=THREE.MathUtils.damp(p.y,cibleY,2.2,delta);
      if(distance<.08&&Math.abs(p.y-cibleY)<.05){p.y=cibleY;etage.current=point.etage;setNiveau(point.etage);route.current.shift();}
    }else if(dx||dz){
      const l=Math.hypot(dx,dz),pas=Math.min(delta,.05)*2.1;
      p.x=THREE.MathUtils.clamp(p.x+dx/l*Math.min(pas,l),-5.25,5.25);p.z=THREE.MathUtils.clamp(p.z+dz/l*Math.min(pas,l),-4.15,4.15);ref.current.rotation.y=Math.atan2(dx,dz);if(bras.current)bras.current.rotation.x=Math.sin(performance.now()*.012)*.35;
      if(point&&Math.hypot(point.x-p.x,point.z-p.z)<.08)route.current.shift();
    }
    if(!route.current.length&&cibleRef.current!==null){onArrivee(destinationUniversite(cibleRef.current).detail);cibleRef.current=null;}
  });
  return <group ref={ref} position={[0,0,3.8]}><mesh position={[0,1.2,0]} castShadow><capsuleGeometry args={[.28,.72,5,8]}/><meshStandardMaterial color="#c8a04f"/></mesh><mesh position={[0,2.05,0]}><sphereGeometry args={[.31,14,12]}/><meshStandardMaterial color="#8c583c"/></mesh><mesh position={[0,2.27,-.04]} scale={[1,.5,1]}><sphereGeometry args={[.32,12,8]}/><meshStandardMaterial color="#28201c"/></mesh><group ref={bras} position={[.37,1.5,0]}><mesh position={[0,-.35,0]}><capsuleGeometry args={[.1,.5,4,7]}/><meshStandardMaterial color="#8c583c"/></mesh></group>{[-.14,.14].map(x=><mesh key={x} position={[x,.48,0]}><capsuleGeometry args={[.12,.58,4,7]}/><meshStandardMaterial color="#304751"/></mesh>)}<Text position={[0,2.7,0]} fontSize={.18} color="#fff0c8" outlineColor="#26383c" outlineWidth={.03}>Joueur · niveau {niveau}</Text></group>;
}

export function UniversiteRealiste({ directions,destination,onArrivee }:{ directions:Set<string>;destination:number|null;onArrivee:(message:string)=>void }){
  const {camera,size}=useThree();
  useEffect(()=>{const portrait=Math.max(1,1.3/(size.width/size.height));camera.position.set(12*portrait,10*portrait,15*portrait);camera.lookAt(0,2.1,0);},[camera,size.width,size.height]);
  const y=3.65;
  return <><color attach="background" args={['#26383c']}/><hemisphereLight args={['#eaf5fb','#685c4d',1.25]}/><ambientLight intensity={.5}/><directionalLight position={[-5,10,5]} intensity={2.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/>
    <Bloc p={[0,-.15,0]} s={[12,.3,9]} c="#aca89d"/><Bloc p={[0,1.4,-4.35]} s={[12,2.8,.18]} c="#e7e0d2"/>{[-5.85,5.85].map(x=><Bloc key={x} p={[x,.55,0]} s={[.18,1.1,9]} c="#ddd8cc"/>)}
    <Accueil/><Amphitheatre/><Administration/><Escalier/>
    <Bloc p={[-3.4,y-.13,0]} s={[5.2,.26,9]} c="#b7b2a7"/><Bloc p={[3.4,y-.13,0]} s={[5.2,.26,9]} c="#b7b2a7"/><Bloc p={[0,y+1.4,-4.35]} s={[12,2.8,.18]} c="#e5dfd3"/>{[-5.85,5.85].map(x=><Bloc key={x} p={[x,y+.55,0]} s={[.18,1.1,9]} c="#ddd8cc"/>)}
    <Bloc p={[0,y+.55,-.6]} s={[.16,1.1,7.4]} c="#ddd8cc"/><Classe y={y}/><LaboratoireBim y={y}/><Bibliotheque y={y}/>
    {[-3.6,3.6].map(x=><group key={x}>{[0,y].map(n=><group key={n} position={[x,n+1.85,-4.24]}><Bloc p={[0,0,0]} s={[2.8,1.4,.05]} c="#7ba4ad"/>{[-1.4,0,1.4].map(a=><Bloc key={a} p={[a,0,.05]} s={[.05,1.5,.05]} c="#f0eee4"/>)}</group>)}</group>)}
    <Text position={[0,6.2,-4.22]} fontSize={.28} color="#31535c">UNIVERSITÉ BTP · CAMPUS DES BÂTISSEURS</Text><JoueurUniversite directions={directions} destination={destination} onArrivee={onArrivee}/>
  </>;
}
