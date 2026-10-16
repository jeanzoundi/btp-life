'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { avancerResidence, cheminResidence, PLAN_RESIDENCE as PLAN, POINTS_RESIDENCE } from '@/lib/plan-residence';
import type { PointInterieur } from '@/lib/navigation-interieur';
import { VieInterieure } from './vie-interieure';

type V3 = [number, number, number];
function Bloc({ p, s, c, doux = false, metal = 0 }: { p: V3; s: V3; c: string; doux?: boolean; metal?: number }) {
  const material = <meshStandardMaterial color={c} roughness={metal ? .25 : .82} metalness={metal} />;
  return doux ? <RoundedBox position={p} args={s} radius={.04} smoothness={2} castShadow receiveShadow>{material}</RoundedBox> :
    <mesh position={p} castShadow receiveShadow><boxGeometry args={s} />{material}</mesh>;
}
function Tube({ p, r, h, c }: { p: V3; r: number; h: number; c: string }) {
  return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[r, r, h, 16]} /><meshStandardMaterial color={c} roughness={.6} /></mesh>;
}
function Plante({ p }: { p: V3 }) {
  return <group position={p}><Tube p={[0, .22, 0]} r={.22} h={.44} c="#aa7454" />{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * .18, .65 + i % 3 * .13, Math.cos(i * 2.4) * .18]} rotation={[0, i, .3]} scale={[.16, .45, .09]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#49684a' : '#63844d'} /></mesh>)}</group>;
}
function Lampe({ p }: { p: V3 }) {
  return <group position={p}><Tube p={[0, .025, 0]} r={.15} h={.05} c="#3b3936" /><Tube p={[0, .22, 0]} r={.025} h={.4} c="#ad8655" /><mesh position={[0, .46, 0]}><coneGeometry args={[.24, .3, 24, 1, true]} /><meshStandardMaterial color="#f6dfb3" emissive="#e8b16b" emissiveIntensity={.35} side={THREE.DoubleSide} /></mesh><pointLight position={[0, .4, 0]} color="#ffd8a0" intensity={2} distance={3} /></group>;
}

function Appartement() {
  const veinage = useMemo(() => {
    const largeur = 128, hauteur = 256;
    const pixels = new Uint8Array(largeur * hauteur * 4);
    for (let y = 0; y < hauteur; y++) for (let x = 0; x < largeur; x++) {
      const fibre = Math.sin(x * .85 + Math.sin(y * .025) * 2 + Math.sin(x * .11) * 3);
      const grain = Math.sin(x * 19.17 + y * 71.39) * 5;
      const teinte = Math.round(222 + fibre * 16 + grain);
      const i = (y * largeur + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = teinte; pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, largeur, hauteur);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => veinage.dispose(), [veinage]);
  // Instanced boards: varied oak tones and seams without hundreds of draw calls.
  const parquet = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!parquet.current) return;
    const transform = new THREE.Object3D();
    let n = 0;
    for (let x = 0; x < 24; x++) for (let z = 0; z < 10; z++) {
      transform.position.set(-5.75 + x * .5, -.015, -4.5 + z);
      transform.updateMatrix(); parquet.current.setMatrixAt(n, transform.matrix);
      parquet.current.setColorAt(n++, new THREE.Color(['#a58a69', '#b49977', '#bfa482', '#ad916e'][(x * 7 + z * 3) % 4]));
    }
    parquet.current.instanceMatrix.needsUpdate = true;
    if (parquet.current.instanceColor) parquet.current.instanceColor.needsUpdate = true;
  }, []);
  return <>
    <Bloc p={[0, -.2, 0]} s={[12, .3, 10]} c="#52483d" />
    <instancedMesh ref={parquet} args={[undefined, undefined, 240]} receiveShadow><boxGeometry args={[.492, .08, .988]} /><meshStandardMaterial map={veinage} bumpMap={veinage} bumpScale={.008} roughness={.68} /></instancedMesh>
    <Bloc p={[0, 1.4, -4.8]} s={[12, 2.8, .18]} c="#e4ddd0" />
    <Bloc p={[-5.8, .5, 0]} s={[.18, 1, 9.6]} c="#e4ddd0" /><Bloc p={[5.8, .5, 0]} s={[.18, 1, 9.6]} c="#e4ddd0" />
    <Bloc p={[0, .07, -4.67]} s={[11.5, .14, .04]} c="#f1ece1" />
    {[PLAN.cloisonGauche, PLAN.cloisonDroite, PLAN.separation].map((o, i) => <group key={i}>
      <Bloc p={[o.x, .47, o.z]} s={[o.largeur, .94, o.profondeur]} c="#e1d9c9" />
      <Bloc p={[o.x, .97, o.z]} s={[o.largeur + .02, .06, o.profondeur + .03]} c="#f4eee3" />
    </group>)}
    {/* Windows with frames, sill, glazing and curtains; no remote assets. */}
    {[-3.5, 3].map(x => <group key={x} position={[x, 1.8, -4.67]}>
      <Bloc p={[0, 0, 0]} s={[2.1, 1.45, .1]} c="#6f9ba2" />
      {[-1.05, 0, 1.05].map(v => <Bloc key={v} p={[v, 0, .08]} s={[.06, 1.55, .1]} c="#f5f0e5" />)}
      {[-.75, .75].map(v => <Bloc key={v} p={[0, v, .08]} s={[2.2, .06, .1]} c="#f5f0e5" />)}
      <Bloc p={[0, -.8, .15]} s={[2.35, .09, .4]} c="#d4c9b6" />
      {[-1.3, 1.3].map(side => <group key={side}>{Array.from({ length: 5 }, (_, i) => <Tube key={i} p={[side + (i - 2) * .07, -.1, .2]} r={.055} h={2.15} c={i % 2 ? '#d0c3ac' : '#e1d6bf'} />)}</group>)}
    </group>)}
    {/* Bedroom: bed frame, mattress, duvet, pillows and bedside cabinets. */}
    <group position={[PLAN.lit.x, 0, PLAN.lit.z]}>
      <Bloc p={[0, .22, 0]} s={[2, .35, 2.4]} c="#725b45" doux />
      <Bloc p={[0, .49, 0]} s={[1.94, .22, 2.32]} c="#eee8d8" doux />
      <Bloc p={[0, .65, .35]} s={[1.98, .15, 1.63]} c="#a9b4a0" doux />
      <Bloc p={[0, .75, -1.13]} s={[2.1, 1.2, .13]} c="#8b745c" doux />
      {[-.49, .49].map(x => <Bloc key={x} p={[x, .69, -.77]} s={[.78, .19, .44]} c="#f5f0e4" doux />)}
      <Bloc p={[0, .74, .84]} s={[2, .06, .48]} c="#6c7e77" />
      <Bloc p={[-1.35, .3, -.6]} s={[.55, .6, .5]} c="#8c7154" /><Lampe p={[-1.35, .6, -.6]} />
    </group>
    {/* Living room: upholstered cushions, legs, rug and coffee table. */}
    <Bloc p={[-3.65, .045, 2.8]} s={[3.7, .025, 2.8]} c="#d1c6af" />
    <group position={[PLAN.canape.x, 0, PLAN.canape.z]}>
      <Bloc p={[0, .32, 0]} s={[2.7, .42, 1]} c="#667b70" doux />
      <Bloc p={[0, .78, -.43]} s={[2.7, .66, .22]} c="#71867a" doux />
      {[-1.25, 1.25].map(x => <Bloc key={x} p={[x, .62, 0]} s={[.2, .4, 1]} c="#71867a" doux />)}
      {[-.78, 0, .78].map(x => <Bloc key={x} p={[x, .57, .02]} s={[.72, .16, .75]} c="#83958a" doux />)}
      {[-.9, .9].map(x => <group key={x}><Bloc p={[x, .83, -.2]} s={[.4, .4, .16]} c={x < 0 ? '#c5ad86' : '#ddd4bd'} doux /><Tube p={[x, .09, .25]} r={.045} h={.18} c="#4e4035" /></group>)}
    </group>
    <Bloc p={[PLAN.table.x, .45, PLAN.table.z]} s={[1.5, .09, .65]} c="#795c42" doux />
    {[-4.2, -3.1].map(x => <Tube key={x} p={[x, .22, 3.3]} r={.035} h={.44} c="#3d403c" />)}
    <Bloc p={[-3.8, .52, 3.3]} s={[.35, .04, .25]} c="#c4a267" /><Tube p={[-3.2, .56, 3.25]} r={.07} h={.13} c="#e6d9c0" />
    <Plante p={[-5, 0, .1]} /><Plante p={[1, 0, -4.2]} />
    {/* Fitted kitchen: cabinet seams, worktop, sink, cooker and utensils. */}
    <group position={[PLAN.cuisine.x, 0, PLAN.cuisine.z]}>
      <Bloc p={[0, .43, 0]} s={[1.2, .86, 4]} c="#ded5c2" />
      <Bloc p={[0, .9, 0]} s={[1.24, .08, 4.04]} c="#454b47" />
      {[-1.5, -.5, .5, 1.5].map(z => <group key={z}><Bloc p={[-.61, .44, z]} s={[.03, .78, .96]} c="#b9b4a4" /><Bloc p={[-.64, .73, z]} s={[.025, .035, .3]} c="#484b45" metal={.6} /></group>)}
      <Bloc p={[0, .95, -1]} s={[.75, .015, .65]} c="#161e22" />
      <Bloc p={[0, .97, -1]} s={[.58, .015, .48]} c="#7b8e8e" metal={.8} />
      <Tube p={[.35, 1.1, -1]} r={.025} h={.3} c="#c1c9c7" />
      <Bloc p={[.22, 1.25, -1]} s={[.28, .04, .04]} c="#c1c9c7" metal={.8} />
      <Bloc p={[0, .96, 1]} s={[.8, .025, .8]} c="#23292a" />
      {[-.2, .2].flatMap(x => [-.2, .2].map(z => <Tube key={`${x},${z}`} p={[x, .98, 1 + z]} r={.13} h={.015} c="#676c6c" />))}
      <Tube p={[0, 1.06, 1.2]} r={.17} h={.16} c="#9ba4a3" />
      <Bloc p={[0, 1, 0]} s={[.45, .025, .6]} c="#bfa077" />
    </group>
    <Bloc p={[2.5, .76, 2.6]} s={[1, .08, 1.5]} c="#a58a67" doux />
    {[2.15, 2.85].flatMap(x => [2.05, 3.15].map(z => <Tube key={`${x},${z}`} p={[x, .36, z]} r={.04} h={.72} c="#665544" />))}
    <Tube p={[2.5, .82, 2.6]} r={.23} h={.02} c="#f0ece2" /><Tube p={[2.5, .9, 3]} r={.07} h={.16} c="#bed0d1" />
    {/* Wet room: tile joints, mirror, ceramic basin and glazed shower. */}
    {Array.from({ length: 8 }, (_, x) => Array.from({ length: 7 }, (_, z) => <Bloc key={`${x},${z}`} p={[1.7 + x * .5, .055, -4.35 + z * .5]} s={[.487, .025, .487]} c={(x + z) % 3 ? '#b5beb9' : '#c2c9c3'} />))}
    <Bloc p={[2.7, .48, -4.2]} s={[1.4, .86, .6]} c="#806c55" />
    <Bloc p={[2.7, .96, -4.2]} s={[1.42, .1, .64]} c="#e9e6d9" doux />
    <Bloc p={[2.7, 1.8, -4.66]} s={[1.3, 1.05, .04]} c="#a3bdc1" metal={.7} />
    <Tube p={[2.7, 1.08, -4.4]} r={.025} h={.22} c="#b8c4c2" />
    <Bloc p={[4.65, .12, -3.6]} s={[1.5, .15, 1.5]} c="#e4e7dd" />
    <mesh position={[3.9, 1.15, -3.6]}><boxGeometry args={[.025, 2.1, 1.5]} /><meshPhysicalMaterial color="#d4e8e4" transparent opacity={.22} roughness={.08} depthWrite={false} /></mesh>
    <Tube p={[3.9, 1.15, -2.85]} r={.025} h={2.1} c="#84908c" />
    <Tube p={[4.65, 1.65, -4.45]} r={.025} h={1.15} c="#b9c5c2" />
    <Bloc p={[4.65, 2.23, -4.25]} s={[.25, .035, .45]} c="#adb8b5" metal={.8} />
  </>;
}

export function Habitant({ directions, destination, onArrivee, points = POINTS_RESIDENCE, avancer = avancerResidence, calculerChemin = cheminResidence }: { directions: Set<string>; destination: number | null; onArrivee: (message: string) => void; points?: readonly (PointInterieur & { detail: string })[]; avancer?: typeof avancerResidence; calculerChemin?: typeof cheminResidence }) {
  const groupe = useRef<THREE.Group>(null);
  const jambes = useRef<THREE.Group>(null), bras = useRef<THREE.Group>(null);
  const chemin = useRef<PointInterieur[]>([]);
  const temps = useRef(0);
  const marcheManuelle = useRef(false);
  const notifier = useRef(onArrivee); notifier.current = onArrivee;
  useEffect(() => {
    if (destination === null) { chemin.current = []; return; }
    if (groupe.current) {
      const cible = points[destination % points.length];
      chemin.current = calculerChemin(groupe.current.position, cible);
      if (!chemin.current.length) notifier.current(Math.hypot(groupe.current.position.x - cible.x, groupe.current.position.z - cible.z) < .2 ? cible.detail : 'Passage inaccessible. Déplacez-vous puis réessayez.');
    }
  }, [destination, points, calculerChemin]);
  useFrame((_, delta) => {
    if (!groupe.current) return;
    const p = groupe.current.position;
    let dx = Number(directions.has('droite')) - Number(directions.has('gauche'));
    let dz = Number(directions.has('arriere')) - Number(directions.has('avant'));
    if (dx || dz) { if (!marcheManuelle.current) notifier.current('Déplacement manuel · choisissez une destination pour reprendre la visite.'); chemin.current = []; marcheManuelle.current = true; }
    else if (chemin.current.length) {
      const cible = chemin.current[0]; dx = cible.x - p.x; dz = cible.z - p.z;
      if (Math.hypot(dx, dz) < .06) {
        chemin.current.shift(); dx = dz = 0;
        if (!chemin.current.length && destination !== null) notifier.current(points[destination % points.length].detail);
      }
    }
    const prochain = avancer(p, dx, dz, delta);
    if (!directions.size) marcheManuelle.current = false;
    const bouge = Math.hypot(prochain.x - p.x, prochain.z - p.z) > .001;
    p.set(prochain.x, 0, prochain.z);
    if (bouge) groupe.current.rotation.y = Math.atan2(dx, dz);
    temps.current += Math.min(delta, .05) * 8;
    const balancement = bouge ? Math.sin(temps.current) * .45 : 0;
    jambes.current?.children.forEach((jambe, i) => { jambe.rotation.x = balancement * (i ? -1 : 1); });
    bras.current?.children.forEach((bras, i) => { bras.rotation.x = balancement * (i ? 1 : -1); });
  });
  return <group ref={groupe} position={[0, 0, 3.8]}>
    <Bloc p={[0, 1.17, 0]} s={[.4, .52, .24]} c="#c5a363" doux />
    <Tube p={[0, 1.5, 0]} r={.075} h={.13} c="#8b5a3c" />
    <mesh position={[0, 1.67, 0]} scale={[.85, 1.1, .9]} castShadow><sphereGeometry args={[.16, 20, 16]} /><meshStandardMaterial color="#925f41" roughness={.85} /></mesh>
    <mesh position={[0, 1.79, -.015]} scale={[1, .5, 1]} castShadow><sphereGeometry args={[.15, 16, 12]} /><meshStandardMaterial color="#29231e" /></mesh>
    {[-.055, .055].map(x => <mesh key={x} position={[x, 1.69, .13]}><sphereGeometry args={[.015, 8, 8]} /><meshStandardMaterial color="#29231e" /></mesh>)}
    <group ref={jambes}>{[-.11, .11].map(x => <group key={x} position={[x, .94, 0]}><Bloc p={[0, -.4, 0]} s={[.16, .77, .18]} c="#38494b" doux /><Bloc p={[0, -.86, .05]} s={[.18, .12, .3]} c="#42392e" doux /></group>)}</group>
    <group ref={bras}>{[-.27, .27].map(x => <group key={x} position={[x, 1.4, 0]}><Bloc p={[0, -.14, 0]} s={[.14, .3, .17]} c="#c5a363" doux /><Bloc p={[0, -.41, 0]} s={[.105, .28, .12]} c="#925f41" doux /></group>)}</group>
  </group>;
}

export function ResidenceRealiste({ directions, destination, onArrivee }: { directions: Set<string>; destination: number | null; onArrivee: (message: string) => void }) {
  const { camera, size } = useThree();
  const cible = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useEffect(() => {
    // Fit the complete apartment on portrait screens instead of clipping its rooms.
    const recul = Math.max(1, 1.2 / (size.width / size.height));
    camera.position.set(0, 12 * recul, 12 * recul); camera.lookAt(cible);
  }, [camera, size.width, size.height, cible]);
  return <>
    <color attach="background" args={['#343d3c']} />
    <hemisphereLight args={['#e6f0f4', '#7b6651', 1.3]} /><ambientLight intensity={.45} />
    <directionalLight position={[-3, 8, -3]} intensity={3} color="#fff1d5" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.035} />
    <directionalLight position={[2, 5, 8]} intensity={.7} color="#d4e5ee" />
    <Appartement /><VieInterieure type="habitation" /><Habitant directions={directions} destination={destination} onArrivee={onArrivee} />
  </>;
}
