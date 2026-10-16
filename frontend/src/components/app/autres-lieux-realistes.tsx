'use client';

import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { Habitant } from './residence-realiste';
import { familleLieu, navigationLieu, OBSTACLES_LIEU, stationsLieu, type FamilleLieu } from '@/lib/plan-autres-lieux';
import { VieInterieure } from './vie-interieure';

type V = [number, number, number];
function Bloc({ p, s, c, rond = false, metal = 0 }: { p: V; s: V; c: string; rond?: boolean; metal?: number }) {
  const mat = <meshStandardMaterial color={c} roughness={metal ? .3 : .75} metalness={metal} />;
  return rond ? <RoundedBox args={s} position={p} radius={.04} smoothness={2} castShadow receiveShadow>{mat}</RoundedBox> : <mesh position={p} castShadow receiveShadow><boxGeometry args={s} />{mat}</mesh>;
}
function Cyl({ p, r, h, c }: { p: V; r: number; h: number; c: string }) { return <mesh position={p} castShadow><cylinderGeometry args={[r, r, h, 16]} /><meshStandardMaterial color={c} roughness={.7} /></mesh>; }

const STYLE: Record<FamilleLieu, { mur: string; sol: string; accent: string; titre: string }> = {
  formation: { mur: '#e6e1d5', sol: '#a9a69d', accent: '#47717b', titre: 'FORMATION & PRATIQUE' },
  restauration: { mur: '#ead7bd', sol: '#9f7759', accent: '#b6573f', titre: 'CUISINE & CONVIVIALITÉ' },
  commerce: { mur: '#e2ddd0', sol: '#aaa59a', accent: '#4d7d7d', titre: 'BOUTIQUES & SERVICES' },
  institution: { mur: '#e9e4d7', sol: '#a8a397', accent: '#536c84', titre: 'ACCUEIL & DÉMARCHES' },
  laboratoire: { mur: '#e3e9e6', sol: '#a7b1ad', accent: '#628d86', titre: 'ESSAIS & CONTRÔLE' },
  chantier: { mur: '#d7d0c1', sol: '#9a907e', accent: '#db9c29', titre: 'CHANTIER & SÉCURITÉ' },
  logistique: { mur: '#d7d9d5', sol: '#929b9c', accent: '#687d87', titre: 'STOCK & LOGISTIQUE' },
  loisirs: { mur: '#dae1d2', sol: '#9aaa8c', accent: '#4e8583', titre: 'ACTIVITÉS & DÉTENTE' },
};

function Mobilier({ famille }: { famille: FamilleLieu }) {
  const s = STYLE[famille];
  return <>
    {/* Shared reception footprint */}
    <group position={[-3.5, 0, 2.2]}><Bloc p={[0, .48, 0]} s={[2.7, .96, .9]} c={s.accent} rond /><Bloc p={[0, 1, 0]} s={[2.8, .08, 1]} c="#c5aa7b" /><Text position={[0, .65, .47]} fontSize={.14} color="#fff3d8">ACCUEIL</Text></group>
    {/* Left work zone changes by activity. */}
    <group position={[-3.5, 0, -2.6]}>
      {famille === 'formation' && <><Bloc p={[0, .73, 0]} s={[2.5, .08, 1.3]} c="#a98a65" />{[-.8,0,.8].map(x => <Bloc key={x} p={[x,.82,0]} s={[.55,.03,.7]} c="#e8e0c9" />)}<Bloc p={[0,1.65,-.75]} s={[2.5,1.2,.08]} c="#315d66" /></>}
      {famille === 'restauration' && <><Bloc p={[0,.75,0]} s={[2.5,.08,1.25]} c="#9c744e" />{[-.8,0,.8].map(x => <group key={x}><Cyl p={[x,.43,.55]} r={.22} h={.78} c="#d7c4a1" /><Cyl p={[x,.82,0]} r={.23} h={.03} c="#eee3cf" /></group>)}</>}
      {famille === 'commerce' && <>{[-.8,0,.8].map(x => <group key={x}><Bloc p={[x,1,0]} s={[.62,2,1.3]} c="#b69d76" />{[.35,.95,1.55].map(y => <Bloc key={y} p={[x,y,.68]} s={[.48,.25,.18]} c={y===.95?'#cf7453':'#718f82'} />)}</group>)}</>}
      {famille === 'institution' && <><Bloc p={[0,.75,0]} s={[2.5,.08,1.25]} c="#a98c68" /><Bloc p={[0,1.32,-.3]} s={[1.1,.65,.06]} c="#294a55" /><Bloc p={[0,.45,.62]} s={[.55,.8,.5]} c="#5e7482" /></>}
      {famille === 'laboratoire' && <><Bloc p={[0,.82,0]} s={[2.5,.15,1.35]} c="#e8e7de" />{[-.75,0,.75].map(x => <Cyl key={x} p={[x,1.12,0]} r={.12} h={.55} c={x?'#7db4aa':'#d5a35e'} />)}<Bloc p={[0,.35,0]} s={[2.4,.7,1.2]} c="#9da8a5" /></>}
      {famille === 'chantier' && <><Bloc p={[0,.38,0]} s={[2.5,.76,1.4]} c="#b97645" />{[-.75,0,.75].map((x,i)=><mesh key={x} position={[x,1.1,0]}><sphereGeometry args={[.28,16,10]} /><meshStandardMaterial color={i===1?'#f1c334':'#e99032'} /></mesh>)}<Bloc p={[0,.84,.55]} s={[2.1,.06,.7]} c="#e7d39c" /></>}
      {famille === 'logistique' && <>{[-.8,0,.8].map((x,i)=><group key={x}>{[.35,.95,1.55].map(y=><Bloc key={y} p={[x,y,0]} s={[.68,.48,1.3]} c={i%2?'#9a7757':'#b5875e'} />)}</group>)}</>}
      {famille === 'loisirs' && <><Bloc p={[0,.42,0]} s={[2.6,.84,1.3]} c="#668a76" rond /><Bloc p={[0,.87,-.56]} s={[2.6,.7,.18]} c="#668a76" rond />{[-.65,.65].map(x=><Bloc key={x} p={[x,.73,0]} s={[.55,.14,.75]} c="#8eaa95" rond />)}</>}
    </group>
    {/* Main activity island */}
    <group position={[3.2, 0, -2.4]}>
      <Bloc p={[0,.72,0]} s={[2.8,.08,1.35]} c={famille==='chantier'?'#d7c18d':'#a98e69'} rond />
      {[-1.1,1.1].flatMap(x=>[-.5,.5].map(z=><Bloc key={`${x}${z}`} p={[x,.35,z]} s={[.08,.7,.08]} c="#445157" />))}
      {famille === 'laboratoire' && <><mesh position={[0,1,0]}><cylinderGeometry args={[.32,.32,.58,24]} /><meshStandardMaterial color="#b9c3c1" /></mesh><Bloc p={[0,1.42,0]} s={[1.1,.18,.5]} c="#39494c" /></>}
      {famille === 'chantier' && <><Bloc p={[0,.8,0]} s={[1.4,.025,.8]} c="#f3ead0" />{[-.45,0,.45].map(x=><Bloc key={x} p={[x,.815,0]} s={[.015,.008,.6]} c="#456b77" />)}</>}
      {famille === 'formation' && <><Bloc p={[0,.85,0]} s={[1.4,.04,.8]} c="#ece7d8" /><Bloc p={[.75,1.25,-.4]} s={[.8,.7,.06]} c="#31515a" /></>}
      {famille === 'restauration' && <>{[-.65,.65].map(x=><Cyl key={x} p={[x,.83,0]} r={.28} h={.04} c="#efe7d5" />)}</>}
    </group>
    {/* Storage / display wall */}
    <group position={[4.9,0,2.3]}><Bloc p={[0,1.1,0]} s={[.8,2.2,2.5]} c="#8a765d" />{[.35,1,1.65].map(y=><Bloc key={y} p={[-.42,y,0]} s={[.08,.05,2.35]} c="#d2bd96" />)}{[-.8,0,.8].map((z,i)=><Bloc key={z} p={[-.48,.65+i*.45,z]} s={[.12,.25,.48]} c={i%2?s.accent:'#d1aa67'} />)}</group>
    <group position={[-3.9,0,-.35]}><Bloc p={[0,.35,0]} s={[3.4,.7,.14]} c="#d8d8d0" /><mesh position={[0,1.12,0]}><boxGeometry args={[3.4,.85,.025]} /><meshPhysicalMaterial color="#b8d2d1" transparent opacity={.2} depthWrite={false} /></mesh></group>
  </>;
}

export function AutresLieuxRealistes({ slug, directions, destination, onArrivee }: { slug: string; directions: Set<string>; destination: number | null; onArrivee: (message: string) => void }) {
  const famille = familleLieu(slug)!;
  const points = useMemo(() => stationsLieu(famille), [famille]);
  const nav = useMemo(() => navigationLieu(), []);
  const style = STYLE[famille];
  const { camera, size } = useThree();
  useEffect(() => { const recul = Math.max(1, 1.2 / (size.width / size.height)); camera.position.set(0, 12 * recul, 12 * recul); camera.lookAt(0,0,0); }, [camera,size.width,size.height]);
  return <><color attach="background" args={['#29393b']} /><hemisphereLight args={['#edf6fb','#6d6150',1.25]} /><ambientLight intensity={.45} /><directionalLight position={[-4,8,-2]} intensity={2.7} castShadow shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
    <Bloc p={[0,-.14,0]} s={[12,.28,10]} c={style.sol} />{Array.from({length:11},(_,i)=><Bloc key={i} p={[-5+i,.005,0]} s={[.012,.01,9.6]} c="#7d827d" />)}
    <Bloc p={[0,1.4,-4.8]} s={[12,2.8,.18]} c={style.mur} />{[-5.8,5.8].map(x=><Bloc key={x} p={[x,.45,0]} s={[.18,.9,9.6]} c={style.mur} />)}
    {[-3.6,3.6].map(x=><group key={x} position={[x,1.75,-4.68]}><Bloc p={[0,0,0]} s={[2.7,1.35,.05]} c="#80aab0" />{[-1.35,0,1.35].map(a=><Bloc key={a} p={[a,0,.06]} s={[.05,1.45,.06]} c="#f0eee3" />)}</group>)}
    <Text position={[0,2,-4.67]} fontSize={.22} maxWidth={2.4} textAlign="center" color="#314d54">{style.titre}</Text><Bloc p={[0,1.22,-4.64]} s={[1.8,1,.04]} c="#f0eee1" />
    <Mobilier famille={famille} /><VieInterieure type={famille} /><Habitant directions={directions} destination={destination} onArrivee={onArrivee} points={points} avancer={nav.avancer} calculerChemin={nav.chemin} />
  </>;
}

export { familleLieu, stationsLieu };
