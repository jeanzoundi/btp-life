'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { HAUTEUR_CAMPUS as H, SALLES_CAMPUS, MURS_CAMPUS, mobilierCampus, libreCampus, hauteurEscalier, trajetCampus, type SalleCampus, type PointCampus, type NiveauCampus, type MeubleCampus } from '@/lib/campus-universitaire';

type V=[number,number,number];
function Box({p,s,c='#e5e0d5',metal=0}:{p:V;s:V;c?:string;metal?:number}){return <mesh position={p} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={metal?.4:.85} metalness={metal}/></mesh>;}
function Inscription({p,texte,taille=.3,c='#284851'}:{p:V;texte:string;taille?:number;c?:string}){return <Text position={p} fontSize={taille} color={c} maxWidth={9} textAlign="center" anchorY="middle">{texte}</Text>;}

function Personne({p,index=0,prof=false,assis=false,marche=false,rotation=0,onClick}:{p:V;index?:number;prof?:boolean;assis?:boolean;marche?:boolean;rotation?:number;onClick?:()=>void}){
  const bras=useRef<THREE.Group>(null),jambes=useRef<THREE.Group>(null);
  useFrame(({clock})=>{const t=clock.elapsedTime*3+index;if(bras.current)bras.current.rotation.x=prof?-.45+Math.sin(t)*.14:marche?Math.sin(t*2)*.45:Math.sin(t)*.05;if(jambes.current)jambes.current.rotation.x=marche?-Math.sin(t*2)*.35:0;});
  const peau=['#81533d','#593829','#aa7755','#6e4736'][index%4],chemise=prof?'#e5ddd1':['#567b91','#b1755e','#698470','#b0a17a','#676d94'][index%5];
  return <group position={p} rotation={[0,rotation,0]} onClick={e=>{if(onClick){e.stopPropagation();onClick();}}}>
    <group position={[0,assis?-.48:0,0]}>
      <mesh position={[0,1.12,0]} castShadow><capsuleGeometry args={[.22,.45,4,8]}/><meshStandardMaterial color={chemise}/></mesh>
      <mesh position={[0,1.72,0]} castShadow><sphereGeometry args={[.23,12,10]}/><meshStandardMaterial color={peau}/></mesh>
      <mesh position={[0,1.87,-.025]} scale={[1,.5,1]}><sphereGeometry args={[.24,10,8]}/><meshStandardMaterial color="#242020"/></mesh>
      {[-.075,.075].map(x=><mesh key={x} position={[x,1.75,.213]}><sphereGeometry args={[.023,6,6]}/><meshStandardMaterial color="#221b18"/></mesh>)}
      <group ref={bras} position={[.3,1.35,0]}><Box p={[0,-.2,0]} s={[.13,.43,.16]} c={chemise}/><Box p={[0,-.46,0]} s={[.11,.16,.12]} c={peau}/></group>
      <Box p={[-.3,1.12,0]} s={[.13,.48,.16]} c={chemise}/>
      {!prof&&<Box p={[0,1.15,-.23]} s={[.32,.43,.15]} c="#3d4d51"/>}
      {prof&&<><Box p={[0,1.25,.225]} s={[.045,.33,.025]} c="#354e61"/><Box p={[.12,1.3,.23]} s={[.09,.13,.02]} c="#d9b96c"/></>}
    </group>
    <group ref={jambes}>{[-.12,.12].map(x=><group key={x}>{assis?<><Box p={[x,.48,.18]} s={[.17,.17,.48]} c="#344554"/><Box p={[x,.25,.4]} s={[.15,.48,.17]} c="#344554"/><Box p={[x,.05,.49]} s={[.18,.1,.33]} c="#292d30"/></>:<><Box p={[x,.43,0]} s={[.17,.72,.19]} c="#344554"/><Box p={[x,.07,.07]} s={[.19,.14,.34]} c="#292d30"/></>}</group>)}</group>
  </group>;
}
function Chaise({p}:{p:V}){return <group position={p}><Box p={[0,.46,0]} s={[.54,.09,.52]} c="#557778"/><Box p={[0,.78,-.24]} s={[.54,.62,.06]} c="#557778"/>{[-.21,.21].map(x=><Box key={x} p={[x,.22,0]} s={[.04,.44,.43]} c="#414d53"/>)}</group>;}
function Meuble({m,usage}:{m:MeubleCampus;usage:SalleCampus['usage']}){
  const {w,d,h}=m;
  return <group position={[m.x,0,m.z]}>
    {m.typeMeuble==='table'?<><Box p={[0,h,0]} s={[w,.09,d]} c={m.couleur}/>{[-w/2+.15,w/2-.15].map(x=><Box key={x} p={[x,h/2,0]} s={[.065,h,d-.15]} c="#455861"/>)}<Chaise p={[0,0,.95]}/>
      {usage==='bim'?<><Box p={[0,h+.36,-.22]} s={[1,.62,.06]} c="#253b43"/><mesh position={[0,h+.36,-.18]}><planeGeometry args={[.89,.5]}/><meshStandardMaterial color="#85bac3" emissive="#467f92" emissiveIntensity={.35}/></mesh><Box p={[0,h+.07,.22]} s={[.75,.04,.24]} c="#364850"/>{[0,1,2].map(i=><Box key={i} p={[-.25+i*.22,h+.35,-.13]} s={[.13,.12+i*.07,.025]} c="#c5e2d2"/>)}</>:<><Box p={[-.3,h+.06,0]} s={[.65,.035,.4]} c="#ece7da"/><Box p={[.4,h+.06,.1]} s={[.32,.06,.42]} c="#416f7b"/></>}
    </>:m.typeMeuble==='rayon'?<><Box p={[0,h/2,-d/2]} s={[w,h,.08]} c="#8d7359"/>{[0,.7,1.4,2.1].filter(v=>v<h).map(y=><group key={y}><Box p={[0,y,0]} s={[w,.08,d]} c="#a98a66"/>{Array.from({length:8},(_,i)=><Box key={i} p={[-w/2+.2+i*(w-.3)/8,y+.28,0]} s={[.18,.45+(i%3)*.04,d*.75]} c={['#557e83','#b57f5c','#d3b984','#728365'][i%4]}/>)}</group>)}</>:m.typeMeuble==='plante'?<><Box p={[0,.25,0]} s={[w,.5,d]} c="#a9997e"/><mesh position={[0,1.4,0]}><cylinderGeometry args={[.13,.21,2,8]}/><meshStandardMaterial color="#80634c"/></mesh>{[-.6,0,.6].map((x,i)=><mesh key={x} position={[x,2.4+(i%2)*.6,0]} castShadow><icosahedronGeometry args={[1.1,1]}/><meshStandardMaterial color={i%2?'#6c8956':'#527653'} roughness={1}/></mesh>)}</>:m.typeMeuble==='lit'?<><Box p={[0,.32,0]} s={[w,.35,d]} c="#b6cbc8"/><Box p={[0,.55,-.8]} s={[w*.8,.2,.6]} c="#faf7eb"/></>:m.typeMeuble==='lavabo'?<><Box p={[0,.45,0]} s={[w,.9,d]} c="#e6e7df"/><Box p={[0,.93,0]} s={[w*.7,.04,d*.7]} c="#718f94"/><Box p={[0,1.1,-.2]} s={[.04,.3,.1]} c="#81979d" metal={.7}/></>:<><Box p={[0,h/2,0]} s={[w,h,d]} c={m.couleur}/>{m.typeMeuble==='comptoir'&&<Box p={[0,h+.04,0]} s={[w+.1,.1,d+.1]} c="#d8c7a6"/>}{m.typeMeuble==='casier'&&<><Box p={[0,h*.5,d/2+.03]} s={[.05,h*.85,.02]} c="#475e67"/><Box p={[.3,1,d/2+.05]} s={[.05,.2,.04]} c="#ddd6c2"/></>}</>}
  </group>;
}

function Salle({s,selectionner}:{s:SalleCampus;selectionner:(id:string)=>void}){
  const meubles=useMemo(()=>mobilierCampus(s),[s]);
  const enseignant=['cours','bim','atelier'].includes(s.usage);
  const postes=meubles.filter(m=>m.typeMeuble==='table').slice(0,4);
  return <group>
    <Box p={[s.cx,-.015,s.cz]} s={[s.largeur-.3,.08,s.profondeur-.3]} c={s.usage==='jardin'?'#cad2b5':s.usage==='cours'?'#c4bba5':'#d8d1bf'}/>
    {meubles.map((m,i)=><Meuble key={i} m={m} usage={s.usage}/>)}
    {s.usage!=='sanitaires'&&<Personne p={[s.x+(s.cx<0?-1.5:s.cx>0?1.5:2),0,s.z-1.8]} index={SALLES_CAMPUS.indexOf(s)+2} prof={enseignant||s.usage==='bureau'} onClick={()=>selectionner(s.id)}/>}
    {postes.map((m,i)=><Personne key={i} p={[m.x,0,m.z+.95]} index={i+SALLES_CAMPUS.indexOf(s)} assis rotation={Math.PI} onClick={()=>selectionner(s.id)}/>)}
    {s.usage!=='jardin'&&<>
      <Box p={[s.cx,2.1,s.cz-s.profondeur/2+.2]} s={[Math.min(7,s.largeur-2),1.5,.12]} c={enseignant?'#294c50':s.couleur}/>
      <Inscription p={[s.cx,2.1,s.cz-s.profondeur/2+.28]} texte={enseignant?`${s.label}\n${s.responsable}`:s.label} taille={.27} c="#fff3d8"/>
      {[-1,1].map(i=><group key={i}><Box p={[s.cx+i*(s.largeur/2-2),2.3,s.cz-s.profondeur/2+.17]} s={[2.2,1.9,.06]} c="#90b4bd"/><Box p={[s.cx+i*(s.largeur/2-2),2.3,s.cz-s.profondeur/2+.22]} s={[.05,1.9,.05]} c="#f1e9d7"/></group>)}
      <mesh position={[s.cx,3.65,s.cz]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[5,.22]}/><meshStandardMaterial color="#fff6d8" emissive="#fff0c1" emissiveIntensity={.7} side={THREE.DoubleSide}/></mesh>
    </>}
    <group position={[s.x,0,s.z]} onClick={e=>{e.stopPropagation();selectionner(s.id);}}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.07,0]}><ringGeometry args={[.7,.85,24]}/><meshBasicMaterial color={s.couleur} side={THREE.DoubleSide}/></mesh>
      <Inscription p={[0,2.8,0]} texte={s.label} taille={.22} c="#315365"/>
    </group>
  </group>;
}
function EtudiantMobile({index,etage,selectionner}:{index:number;etage:NiveauCampus;selectionner:(id:string)=>void}){
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{if(!ref.current)return;const t=(clock.elapsedTime*.65+index*5)%48,aller=t<24;ref.current.position.set(index%2?-5:5,0,aller?t-8:40-t);ref.current.rotation.y=aller?0:Math.PI;});
  return <group ref={ref}><Personne p={[0,0,0]} index={index} marche onClick={()=>selectionner(etage===0?'cour':'club')}/></group>;
}
function Escalier(){return <group>
  {Array.from({length:30},(_,i)=><Box key={i} p={[0,(i+1)*H/30-.08,5-(i+.5)/3]} s={[2.8,.16,.34]} c={i%2?'#b9b7aa':'#cecabb'}/>)}
  {[-1.5,1.5].map(x=><group key={x}>{Array.from({length:11},(_,i)=><Box key={i} p={[x,(i/10)*H+.55,5-i]} s={[.06,1.1,.06]} c="#445d64"/>)}<mesh position={[x,H/2+1.1,0]} rotation={[Math.atan(H/10),0,0]}><boxGeometry args={[.09,.09,Math.hypot(10,H)]}/><meshStandardMaterial color="#47616a" metalness={.5} roughness={.4}/></mesh></group>)}
  <Inscription p={[0,1.1,5.5]} texte="ÉTAGE 1 ↑" taille={.3}/>
  </group>;}

export type PositionCampus=PointCampus & {y:number};
export type VueCampus='joueur'|'plan';
type SceneProps={directions:Set<string>;destination:{id:string;serie:number}|null;vue:VueCampus;angle:number;niveauPlan:NiveauCampus;onPosition:(p:PositionCampus)=>void;onProximite:(id:string|null)=>void;onMessage:(s:string)=>void;selectionner:(id:string)=>void};

function Joueur({directions,destination,vue,angle,onPosition,onProximite,onMessage}:SceneProps){
  const ref=useRef<THREE.Group>(null),route=useRef<PointCampus[]>([]),position=useRef<PositionCampus>({x:0,z:10,y:0,etage:0}),temps=useRef(0),proche=useRef<string|null>(null);
  const {camera}=useThree();const [marche,setMarche]=useState(false);const marchait=useRef(false);
  useEffect(()=>{if(!destination)return;const salle=SALLES_CAMPUS.find(s=>s.id===destination.id);if(!salle)return;route.current=trajetCampus(position.current,salle);onMessage(route.current.length?`En route vers ${salle.label}…`:'Approchez le palier pour démarrer le trajet.');},[destination,onMessage]);
  useFrame((_,dt)=>{
    const p=position.current,d=Math.min(dt,.05),point=route.current[0];
    let dx=Number(directions.has('droite'))-Number(directions.has('gauche')),dz=Number(directions.has('arriere'))-Number(directions.has('avant'));
    const manuel=Boolean(dx||dz);
    if(manuel){route.current=[];const a=angle,old=dx;dx=dx*Math.cos(a)+dz*Math.sin(a);dz=dz*Math.cos(a)-old*Math.sin(a);}
    else if(point){dx=point.x-p.x;dz=point.z-p.z;}
    const bouge=Math.hypot(dx,dz)>.02;
    if(bouge){const l=Math.hypot(dx,dz),v=d*(directions.has('courir')?6:3.6),pas=Math.min(v,l);
      let nx=p.x+dx/l*pas,nz=p.z+dz/l*pas;
      const surEscalier=hauteurEscalier(p.x,p.z)!==null&&p.y>.05&&p.y<H-.05;
      if(surEscalier)nx=THREE.MathUtils.clamp(nx,-1.1,1.1);
      // Stair guards prevent side-entry at an incompatible height.
      const peut=(x:number,z:number)=>{const h=hauteurEscalier(x,z);return libreCampus(x,z,p.etage)&&(h===null||Math.abs(h-p.y)<.32);};
      if(peut(nx,p.z))p.x=nx;if(peut(p.x,nz))p.z=nz;
      const hauteur=hauteurEscalier(p.x,p.z);p.y=hauteur??p.etage*H;
      if(p.y>H-.12)p.etage=1;else if(p.y<.12)p.etage=0;
      if(ref.current)ref.current.rotation.y=Math.atan2(dx,dz);
      if(!manuel&&point&&Math.hypot(point.x-p.x,point.z-p.z)<.12){route.current.shift();if(!route.current.length)onMessage('Vous êtes arrivé. Approchez un personnage ou choisissez une activité.');}
    }
    if(marchait.current!==bouge){marchait.current=bouge;setMarche(bouge);}
    if(ref.current)ref.current.position.set(p.x,p.y,p.z);
    temps.current+=d;if(temps.current>.15){temps.current=0;onPosition({...p});const salle=SALLES_CAMPUS.find(s=>s.etage===p.etage&&Math.hypot(s.x-p.x,s.z-p.z)<3);const id=salle?.id??null;if(id!==proche.current){proche.current=id;onProximite(id);}}
    if(vue==='joueur'){const offset=new THREE.Vector3(Math.sin(angle)*6,p.y+3.7,Math.cos(angle)*6);camera.position.lerp(new THREE.Vector3(p.x+offset.x,offset.y,p.z+offset.z),1-Math.exp(-5*d));camera.lookAt(p.x,p.y+1.2,p.z);}
  });
  return <group ref={ref} position={[0,0,10]}><Personne p={[0,0,0]} index={3} marche={marche}/><mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.4,.48,24]}/><meshBasicMaterial color="#e4b65c"/></mesh></group>;
}

export function CampusScene(props:SceneProps){
  const {camera,size}=useThree();const [position,setPosition]=useState<PositionCampus>({x:0,z:10,y:0,etage:0});
  const niveau=props.vue==='plan'?props.niveauPlan:position.etage;
  const recevoir=(p:PositionCampus)=>{setPosition(p);props.onPosition(p);};
  useEffect(()=>{if(props.vue==='plan'){const ratio=Math.max(1,1.25/(size.width/size.height));camera.position.set(35*ratio,48*ratio,52*ratio);camera.lookAt(0,props.niveauPlan*H,6);}},[props.vue,props.niveauPlan,camera,size.width,size.height]);
  return <>
    <color attach="background" args={['#b6c6c7']}/><fog attach="fog" args={['#b6c6c7',65,150]}/>
    <hemisphereLight args={['#fff8e5','#7c8b82',1.8]}/><ambientLight intensity={.5}/>
    <directionalLight position={[15,28,18]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={40} shadow-camera-bottom={-30} shadow-bias={-.0003}/>
    <Box p={[0,-.5,7]} s={[62,.5,67]} c="#899e7f"/>
    {([0,1] as const).map(n=><group key={n} position={[0,n*H,0]} visible={n<=niveau}>
      {/* The upper level has an actual staircase opening. */}
      {n===0?<Box p={[0,-.15,7]} s={[49,.3,53]} c="#bcbcac"/>:<><Box p={[-13,-.15,7]} s={[23,.3,53]} c="#bcbcac"/><Box p={[13,-.15,7]} s={[23,.3,53]} c="#bcbcac"/><Box p={[0,-.15,-12]} s={[3,.3,14]} c="#bcbcac"/><Box p={[0,-.15,19.5]} s={[3,.3,29]} c="#bcbcac"/></>}
      {[-6,6].map(x=><Box key={x} p={[x,.025,7]} s={[.12,.03,51]} c="#c6a56c"/>)}
      {MURS_CAMPUS.filter(m=>m.etage===n).map((m,i)=><Box key={i} p={[m.x,props.vue==='plan'?.65:m.h/2,m.z]} s={[m.w,props.vue==='plan'?1.3:m.h,m.d]} c={m.couleur}/>)}
      {SALLES_CAMPUS.filter(s=>s.etage===n).map(s=><Salle key={s.id} s={s} selectionner={props.selectionner}/>)}
      {[0,1,2,3,4,5].map(i=><EtudiantMobile key={i} index={i} etage={n} selectionner={props.selectionner}/>)}
      {[-1.6,1.6].map(x=><Box key={x} p={[x,.55,0]} s={[.08,1.1,9.6]} c="#516c71"/>)}
      <Inscription p={[0,3.7,30]} texte={n===0?'UNIVERSITÉ DES BÂTISSEURS':'ÉTAGE 1 · ENSEIGNEMENT & RECHERCHE'} taille={.48}/>
    </group>)}
    <Escalier/>
    <Joueur {...props} onPosition={recevoir}/>
    {props.vue==='plan'&&<OrbitControls makeDefault target={[0,niveau*H,7]} minDistance={15} maxDistance={120} maxPolarAngle={Math.PI*.48}/>}
  </>;
}
