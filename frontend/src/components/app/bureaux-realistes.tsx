'use client';

import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { Habitant } from './residence-realiste';
import { MOBILIER_BUREAUX, STATIONS_BUREAUX, navigationBureau, type TypeBureau, type MobilierBureau } from '@/lib/plan-bureaux';
import { VieInterieure } from './vie-interieure';

type V3 = [number, number, number];
function Bloc({ p, s, c, arrondi = false }: { p: V3; s: V3; c: string; arrondi?: boolean }) {
  const mat = <meshStandardMaterial color={c} roughness={.72} />;
  return arrondi ? <RoundedBox args={s} position={p} radius={.035} smoothness={2} castShadow receiveShadow>{mat}</RoundedBox> : <mesh position={p} castShadow receiveShadow><boxGeometry args={s} />{mat}</mesh>;
}
function Pied({ x, z, h = .72 }: { x: number; z: number; h?: number }) {
  return <Bloc p={[x, h / 2, z]} s={[.05, h, .05]} c="#424d52" />;
}
function Chaise({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
    <Bloc p={[0, .47, 0]} s={[.47, .1, .45]} c="#4d6570" arrondi />
    <Bloc p={[0, .76, .2]} s={[.47, .55, .08]} c="#4d6570" arrondi />
    {[-.18, .18].flatMap(a => [-.16, .16].map(b => <Pied key={`${a},${b}`} x={a} z={b} h={.43} />))}
  </group>;
}
function PlanPapier({ p, miniature = false }: { p: V3; miniature?: boolean }) {
  return <group position={p}>
    <Bloc p={[0, 0, 0]} s={[1.3, .015, .85]} c="#f6f0dc" />
    {/* Explicit drafting lines and room boundaries rather than a blank plane. */}
    {[-.5, 0, .5].map(x => <Bloc key={x} p={[x, .012, 0]} s={[.018, .008, .62]} c="#386271" />)}
    {[-.3, .3].map(z => <Bloc key={z} p={[0, .012, z]} s={[1.02, .008, .018]} c="#386271" />)}
    <Bloc p={[.24, .012, 0]} s={[.5, .008, .018]} c="#386271" />
    {miniature && <><Bloc p={[-.25, .12, 0]} s={[.4, .23, .5]} c="#d5d3c8" /><Bloc p={[.26, .2, -.1]} s={[.35, .4, .3]} c="#c0c8c8" /></>}
  </group>;
}
function Ecran({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return <group position={[x, .78, z]}>
    <Bloc p={[0, .01, 0]} s={[.35, .035, .23]} c="#38464b" />
    <Bloc p={[0, .22, -.06]} s={[.05, .4, .05]} c="#38464b" />
    <Bloc p={[0, .49, -.07]} s={[.95, .55, .06]} c="#24383d" />
    <Bloc p={[0, .49, -.031]} s={[.88, .48, .01]} c="#567b85" />
    <Bloc p={[-.15, .48, -.02]} s={[.36, .22, .015]} c="#b2c8bf" />
    <Bloc p={[.26, .58, -.02]} s={[.16, .02, .015]} c="#d5b478" />
    <Bloc p={[.26, .48, -.02]} s={[.16, .02, .015]} c="#d5b478" />
    <Bloc p={[0, .025, .38]} s={[.58, .035, .19]} c="#4c5657" />
  </group>;
}
function Meuble({ meuble, etudes }: { meuble: MobilierBureau; etudes: boolean }) {
  const { type, largeur: l, profondeur: d } = meuble;
  return <group position={[meuble.x, 0, meuble.z]}>
    {type === 'accueil' && <>
      <Bloc p={[0, .5, 0]} s={[l, 1, d]} c={etudes ? '#516d72' : '#415c69'} />
      <Bloc p={[0, 1.04, 0]} s={[l + .04, .08, d + .04]} c="#bba17c" />
      <Bloc p={[0, .6, d / 2 + .01]} s={[l - .25, .035, .02]} c="#d8bb84" />
      <Text position={[0, .75, d / 2 + .025]} fontSize={.15} color="#f2e6c7">{etudes ? 'ÉTUDES & CONCEPTION' : 'ACCUEIL · BTP LIFE'}</Text>
      <Bloc p={[-.5, 1.13, 0]} s={[.35, .1, .25]} c="#e8e0d1" />
    </>}
    {type === 'poste' && <>
      <Bloc p={[0, .75, -.32]} s={[l, .07, .95]} c="#b79b78" arrondi />
      {[-l / 2 + .12, l / 2 - .12].flatMap(x => [-.68, .02].map(z => <Pied key={`${x},${z}`} x={x} z={z} />))}
      <Ecran z={-.45} />{etudes && <Ecran x={.88} z={-.45} />}
      <Chaise x={0} z={.56} />
      <Bloc p={[-l / 2 + .3, .37, -.3]} s={[.45, .68, .75]} c="#a8aaa2" />
      {[.3, .55].map(y => <Bloc key={y} p={[-l / 2 + .3, y, .085]} s={[.15, .025, .02]} c="#465153" />)}
    </>}
    {(type === 'reunion' || type === 'plans') && <>
      <Bloc p={[0, .78, 0]} s={[l - .5, .08, d - .95]} c={etudes ? '#c9b38e' : '#a98e6d'} arrondi />
      {[-l / 2 + .4, l / 2 - .4].flatMap(x => [-d / 2 + .6, d / 2 - .6].map(z => <Pied key={`${x},${z}`} x={x} z={z} h={.74} />))}
      <PlanPapier p={[0, .835, 0]} miniature={type === 'plans'} />
      {type === 'reunion' && [-.85, .85].flatMap(x => [-.94, .94].map(z => <Chaise key={`${x},${z}`} x={x} z={z} rotation={z < 0 ? Math.PI : 0} />))}
      {type === 'plans' && <Bloc p={[.95, .87, 0]} s={[.035, .025, .6]} c="#bd7735" />}
    </>}
    {type === 'archives' && <>
      <Bloc p={[.3, 1.05, 0]} s={[.07, 2.1, d]} c="#7a6954" />
      {[-d / 2, d / 2].map(z => <Bloc key={z} p={[0, 1.05, z]} s={[l, 2.1, .06]} c="#7a6954" />)}
      {[.12, .72, 1.32, 1.98].map(y => <Bloc key={y} p={[0, y, 0]} s={[l, .05, d]} c="#aa9477" />)}
      {[.42, 1.02, 1.62].flatMap((y, row) => Array.from({ length: 7 }, (_, i) => <Bloc key={`${row},${i}`} p={[-.08, y, -.9 + i * .29]} s={[.42, etudes ? .15 + i % 3 * .07 : .4, .19]} c={['#566f79', '#c1a97c', '#839285', '#b9b8ab'][(row + i) % 4]} />))}
    </>}
    {type === 'cloison' && <>
      <Bloc p={[0, .34, 0]} s={[l, .68, d]} c="#c9d1cc" />
      <mesh position={[0, 1.1, 0]}><boxGeometry args={[l, .85, .025]} /><meshPhysicalMaterial color="#b9d5d4" transparent opacity={.18} roughness={.1} depthWrite={false} /></mesh>
      {[-l / 2, 0, l / 2].map(x => <Bloc key={x} p={[x, .8, 0]} s={[.045, 1.6, .06]} c="#4e6267" />)}
    </>}
  </group>;
}

export function BureauxRealistes({ type, directions, destination, onArrivee }: { type: TypeBureau; directions: Set<string>; destination: number | null; onArrivee: (message: string) => void }) {
  const { camera, size } = useThree();
  const navigation = useMemo(() => navigationBureau(type), [type]);
  const etudes = type === 'bureau-etudes';
  useEffect(() => {
    const recul = Math.max(1, 1.2 / (size.width / size.height));
    camera.position.set(0, 12 * recul, 12 * recul); camera.lookAt(0, 0, 0);
  }, [camera, size.width, size.height]);
  return <>
    <color attach="background" args={['#28383d']} /><hemisphereLight args={['#eaf4fa', '#736450', 1.3]} /><ambientLight intensity={.45} />
    <directionalLight position={[-4, 8, -2]} intensity={2.6} color="#fff1d9" castShadow shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.035} />
    <directionalLight position={[3, 5, 7]} intensity={.65} color="#c7e6f0" />
    <Bloc p={[0, -.14, 0]} s={[12, .28, 10]} c="#a8aaa2" />
    {Array.from({ length: 11 }, (_, i) => <Bloc key={i} p={[-5 + i, .006, 0]} s={[.012, .01, 9.6]} c="#8b918b" />)}
    {Array.from({ length: 9 }, (_, i) => <Bloc key={i} p={[0, .006, -4 + i]} s={[11.6, .01, .012]} c="#8b918b" />)}
    <Bloc p={[0, 1.4, -4.8]} s={[12, 2.8, .18]} c="#e4e1d6" />
    {[-5.8, 5.8].map(x => <Bloc key={x} p={[x, .42, 0]} s={[.18, .84, 9.6]} c="#d6d9d1" />)}
    <Bloc p={[0, .08, -4.66]} s={[11.6, .16, .04]} c="#657472" />
    {[-3.7, 3.7].map(x => <group key={x} position={[x, 1.8, -4.68]}>
      <Bloc p={[0, 0, 0]} s={[2.8, 1.4, .05]} c="#87adb4" />
      {[-1.4, 0, 1.4].map(a => <Bloc key={a} p={[a, 0, .06]} s={[.05, 1.5, .06]} c="#f0efe5" />)}
      {[-.73, .73].map(y => <Bloc key={y} p={[0, y, .06]} s={[2.9, .05, .08]} c="#f0efe5" />)}
      <Bloc p={[0, -.8, .15]} s={[3, .09, .35]} c="#c1b397" />
    </group>)}
    <Text position={[0, 2.2, -4.66]} fontSize={.22} maxWidth={2} textAlign="center" color="#34515b">{etudes ? 'CONCEPTION\n& INGÉNIERIE' : 'PROJETS\n& COORDINATION'}</Text>
    <Bloc p={[0, 1.12, -4.65]} s={[1.6, .9, .05]} c="#f3f0df" />
    {[-.5, 0, .5].map((x, i) => <Bloc key={x} p={[x, 1.12, -4.61]} s={[.35, .12 + i * .14, .02]} c={etudes ? '#6c9297' : '#bda16a'} />)}
    <Bloc p={[-3.5, .02, -2.5]} s={[3.4, .025, 2.7]} c="#788787" />
    {MOBILIER_BUREAUX[type].map(m => <Meuble key={m.id} meuble={m} etudes={etudes} />)}<VieInterieure type="bureau" />
    <Habitant key={type} directions={directions} destination={destination} onArrivee={onArrivee} points={STATIONS_BUREAUX[type]} avancer={navigation.avancer} calculerChemin={navigation.chemin} />
  </>;
}
