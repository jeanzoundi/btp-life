'use client';

import { memo, useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { BlocsInstances } from './blocs-instances';
import { ToitTuiles } from './toits-monde';
import { HumainMonde } from './humain-monde';
import type { BlocArchitecture } from '@/lib/architecture-ville';
import { BOUTIQUES_PALMIERS } from '@/lib/place-palmiers';

type V = [number, number, number];
type Boutique = (typeof BOUTIQUES_PALMIERS)[number];
const MAT = { bois: '#886044', sombre: '#294238', creme: '#f3dec1' };

function Enseigne({ titre, detail, largeur, couleur, p }: { titre: string; detail: string; largeur: number; couleur: string; p: V }) {
  return <group position={p}>
    <mesh castShadow><boxGeometry args={[largeur, .84, .18]} /><meshStandardMaterial color={couleur} roughness={.8} /></mesh>
    <Text position={[0, .13, .105]} fontSize={largeur * .058} letterSpacing={.035} maxWidth={largeur - .25} anchorX="center" color="#fff2d3">{titre}</Text>
    <Text position={[0, -.2, .107]} fontSize={largeur * .025} letterSpacing={.06} color="#f3cf87">{detail}</Text>
  </group>;
}

/** Détails regroupés par matériau : menuiseries, volets, rayonnages et objets de vitrine. */
function Devanture({ b }: { b: Boutique }) {
  const blocs = useMemo(() => {
    const list: BlocArchitecture[] = [];
    const add = (position: V, taille: V, couleur: string, rotation = 0) => list.push({ position, taille, couleur, rotation });
    const w = b.largeur, h = b.hauteur;
    add([0, .13, .25], [w + .6, .26, 5.7], '#ba906b');
    add([0, 1.5, -2.45], [w, 3, .18], '#826547');
    for (const x of [-w / 2 + .2, w / 2 - .2]) add([x, h / 2, 0], [.4, h, 5], b.mur);
    add([0, h / 2 + 1.5, 0], [w, h - 3, 5], b.mur);
    add([0, 1.35, 2.42], [.35, 2.7, .22], b.mur);
    for (const s of [-1, 1]) {
      add([s * w * .25, 1.46, 2.48], [w * .44, 2.65, .09], b.accent);
      add([s * w * .25, 1.46, 2.55], [w * .38, 2.38, .07], '#263f39');
      // Comptoir ouvert, cadres et présentoirs, à l'avant du fond de boutique sombre.
      add([s * w * .25, .6, 2.7], [w * .38, 1.05, .25], b.id === 'maquis' ? '#b96843' : b.mur);
      add([s * w * .25, 1.15, 2.8], [w * .4, .13, .55], MAT.bois);
      for (const y of [1.48, 1.94]) add([s * w * .25, y, 2.69], [w * .35, .07, .25], '#bb8c59');
      for (let k = 0; k < 8; k++) {
        const x = s * w * .25 - w * .14 + k * w * .038;
        const col = ['#eeaf35', '#cd5c4b', '#5d9d9a', '#f2dbc0'][k % 4];
        add([x, 1.66 + (k % 2) * .03, 2.69], [.16, .28 + (k % 3) * .035, .18], col);
      }
    }
    add([0, 2.96, 2.5], [w + .2, .16, .3], '#f5dfb6');
    // Auvent rayé avec lambrequin, supports et bandes de peinture sur les soubassements.
    for (let j = 0; j < 16; j++) {
      const x = (j - 7.5) * (w + .55) / 16, c = j % 2 ? '#f4dfb6' : b.accent;
      add([x, 2.85, 3.1], [(w + .55) / 16, .095, 1.45], c);
      add([x, 2.69, 3.79], [(w + .55) / 16, .3, .07], c);
    }
    add([0, .36, 2.55], [w, .18, .12], b.accent);
    if (h > 5) {
      for (const x of [-w * .25, w * .25]) {
        add([x, 4.66, 2.53], [1.46, 1.64, .16], MAT.creme);
        add([x, 4.66, 2.63], [1.2, 1.4, .07], '#385a62');
        add([x, 4.66, 2.69], [.065, 1.4, .06], MAT.creme);
        for (const s of [-1, 1]) {
          add([x + s * .86, 4.66, 2.67], [.42, 1.5, .12], b.accent, s * .12);
          for (let k = 0; k < 9; k++) add([x + s * .86, 4.06 + k * .15, 2.75], [.36, .037, .06], '#34665d');
        }
        add([x, 3.81, 2.94], [1.8, .12, .9], '#e7c49a');
        add([x, 4.2, 3.32], [1.8, .065, .06], '#3f5650');
        for (const dx of [-.8, -.4, 0, .4, .8]) add([x + dx, 4, 3.32], [.04, .44, .04], '#3f5650');
      }
      add([w / 2 - .72, h - .55, 2.76], [1, .5, .48], '#e1d9c2');
      for (let j = 0; j < 5; j++) add([w / 2 - 1.1 + j * .18, h - .55, 3.015], [.045, .34, .02], '#697874');
    }
    // Gouttière, descente, chaînage et une zone d'enduit reprise.
    add([w / 2 - .1, h / 2, 2.7], [.08, h, .08], '#776b59');
    add([0, h - .12, 2.6], [w, .12, .14], MAT.creme);
    add([-w / 2 + .24, .9, 2.62], [.28, .55, .015], '#d3a16c');
    return list;
  }, [b]);
  return <group position={[b.x, 0, b.z]}>
    <BlocsInstances blocs={blocs} interactif={false} />
    <ToitTuiles toit={{ largeur: b.largeur + .65, profondeur: 5.6, hauteur: 1.2, y: b.hauteur, couleur: b.toit }} />
    <Enseigne titre={b.nom} detail={b.sousTitre} largeur={b.largeur - .3} couleur={b.accent} p={[0, 3.38, 2.7]} />
    {b.id === 'couture' && <group position={[-1.5, .04, 3.2]}><mesh position={[0, 1.45, 0]} castShadow><cylinderGeometry args={[.25, .48, 1.3, 12]} /><meshStandardMaterial color="#b9395c" roughness={.9} /></mesh><mesh position={[0, .4, 0]}><cylinderGeometry args={[.035, .035, .8, 8]} /><meshStandardMaterial color="#4f4032" /></mesh><mesh position={[0, .08, 0]}><cylinderGeometry args={[.3, .3, .08, 16]} /><meshStandardMaterial color="#4f4032" /></mesh></group>}
    <PotFleuri p={[-b.largeur / 2 - .05, 0, 3.2]} /><PotFleuri p={[b.largeur / 2, 0, 3.2]} />
  </group>;
}

function PotFleuri({ p, taille = 1 }: { p: V; taille?: number }) {
  const feuilles = useMemo<BlocArchitecture[]>(() => Array.from({ length: 20 }, (_, i) => {
    const a = i * 2.39996, r = .14 + (i % 4) * .07;
    return { position: [Math.sin(a) * r, .72 + (i % 3) * .12, Math.cos(a) * r], taille: [.42, .26, .4], couleur: ['#30734d', '#568d3f', '#749747', '#d6a43a'][i % 4], rotation: a };
  }), []);
  return <group position={p} scale={taille}>
    <mesh position={[0, .32, 0]} castShadow><cylinderGeometry args={[.37, .25, .64, 12]} /><meshStandardMaterial color="#bf744f" roughness={.9} /></mesh>
    <mesh position={[0, .62, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.35, .045, 6, 16]} /><meshStandardMaterial color="#dc9866" /></mesh>
    <BlocsInstances blocs={feuilles} arrondi interactif={false} />
  </group>;
}

function ParasolRaye({ p, couleur = '#be4936' }: { p: V; couleur?: string }) {
  return <group position={p}>
    <mesh position={[0, 1.35, 0]} castShadow><cylinderGeometry args={[.04, .04, 2.7, 8]} /><meshStandardMaterial color="#755438" /></mesh>
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, 2.65, 0]} castShadow><coneGeometry args={[1.6, .55, 1, 1, true, i * Math.PI / 4, Math.PI / 4]} /><meshStandardMaterial color={i % 2 ? '#fff0ce' : couleur} side={THREE.DoubleSide} roughness={.9} /></mesh>)}
    <mesh position={[0, .77, 0]} castShadow><cylinderGeometry args={[.65, .65, .08, 20]} /><meshStandardMaterial color="#bd8e54" /></mesh>
    {[-1, 1].map(s => <group key={s} position={[s * .91, 0, 0]} rotation={[0, -s * Math.PI / 2, 0]}><mesh position={[0, .43, 0]}><boxGeometry args={[.42, .08, .43]} /><meshStandardMaterial color={couleur} /></mesh><mesh position={[0, .72, -.2]}><boxGeometry args={[.42, .56, .06]} /><meshStandardMaterial color={couleur} /></mesh>{[-.17, .17].flatMap(x => [-.17, .17].map(z => <mesh key={`${x}-${z}`} position={[x, .21, z]}><boxGeometry args={[.05, .42, .05]} /><meshStandardMaterial color="#53605a" /></mesh>))}</group>)}
    <mesh position={[.16, .87, 0]}><cylinderGeometry args={[.12, .12, .06, 16]} /><meshStandardMaterial color="#eee6cb" /></mesh>
    <mesh position={[-.18, .94, .1]}><cylinderGeometry args={[.045, .035, .23, 12]} /><meshStandardMaterial color="#ad433b" /></mesh>
  </group>;
}

function Comptoir({ p, fruits = false }: { p: V; fruits?: boolean }) {
  const blocs = useMemo(() => {
    const list: BlocArchitecture[] = [];
    const a = (position: V, taille: V, couleur: string) => list.push({ position, taille, couleur, rotation: 0 });
    a([0, .5, 0], [3, 1, 1.4], fruits ? '#237865' : '#b56b3f');
    for (const x of [-1.5, 1.5]) a([x, 1.3, 0], [.09, 2.6, .09], '#76563a');
    a([0, 1.02, 0], [3.3, .11, 1.55], '#d8ab6f');
    for (let i = 0; i < 10; i++) a([(i - 4.5) * .34, 2.5, 0], [.34, .1, 2], i % 2 ? '#f6dbab' : fruits ? '#24836b' : '#d87933');
    for (const x of [-.95, 0, .95]) { a([x, 1.16, 0], [.84, .2, 1.1], '#986e40'); for (const s of [-1, 1]) a([x + s * .4, 1.31, 0], [.06, .26, 1.1], '#c59357'); }
    return list;
  }, [fruits]);
  const produits = useMemo<BlocArchitecture[]>(() => Array.from({ length: 36 }, (_, i) => ({ position: [(Math.floor(i / 12) - 1) * .95 + ((i % 3) - 1) * .2, 1.4 + (i % 2) * .05, ((Math.floor(i / 3) % 4) - 1.5) * .22], taille: fruits ? [.22, .2, .23] : [.25, .14, .22], couleur: ['#db9e2b', '#ad4734', '#6e953b'][Math.floor(i / 12)], rotation: 0 })), [fruits]);
  return <group position={p}>
    <BlocsInstances blocs={blocs} interactif={false} /><BlocsInstances blocs={produits} interactif={false} arrondi />
    <Enseigne titre={fruits ? 'FRUITS DE SAISON' : 'PAUSE ATTIEKE'} detail={fruits ? 'MANGUES · BANANES · AVOCATS' : 'LE GOÛT DU QUARTIER'} largeur={3.1} couleur={fruits ? '#236d54' : '#a2482f'} p={[0, 2.13, 1.06]} />
    <group position={[0, 0, -1]}><HumainMonde identite={fruits ? 'fatou' : 'koffi'} /></group>
    <PotFleuri p={[1.85, 0, .6]} taille={.8} />
  </group>;
}

function Guirlande() {
  const courbe = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-7, 5, -17), new THREE.Vector3(0, 4.2, -17), new THREE.Vector3(7, 5, -17)]), []);
  const geo = useMemo(() => new THREE.TubeGeometry(courbe, 30, .018, 5, false), [courbe]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <group>
    <mesh geometry={geo}><meshStandardMaterial color="#504734" /></mesh>
    {Array.from({ length: 13 }, (_, i) => { const p = courbe.getPoint(i / 12); return <mesh key={i} position={[p.x, p.y - .11, p.z]}><sphereGeometry args={[.065, 8, 6]} /><meshStandardMaterial color="#fff2c3" emissive="#e9aa4e" emissiveIntensity={.5} /></mesh>; })}
    {[-7, 7].map(x => <mesh key={x} position={[x, 2.5, -17]} castShadow><cylinderGeometry args={[.05, .06, 5, 8]} /><meshStandardMaterial color="#615643" /></mesh>)}
  </group>;
}

export const PlacePalmiers = memo(function PlacePalmiers() {
  return <group>
    {BOUTIQUES_PALMIERS.map(b => <Devanture key={b.id} b={b} />)}
    <Guirlande />
    <Comptoir p={[-23, 0, 0]} fruits /><Comptoir p={[23, 0, 0]} />
    <ParasolRaye p={[-12, .2, 1.7]} couleur="#247c76" /><ParasolRaye p={[12, .2, 1.7]} />
    {[-9, 9].flatMap(x => [-3.8, 3.8].map(z => <PotFleuri key={`${x}-${z}`} p={[x, .78, z]} taille={1.5} />))}
    <group position={[10.7, 0, -15.8]} rotation={[0, -.35, 0]}><HumainMonde identite="mariam" /></group>
    <group position={[-11, 0, -15.8]} rotation={[0, .2, 0]}><HumainMonde identite="awa" /></group>
    {/* Motif central construit dans le sol, laissant le point de départ entièrement libre. */}
    <mesh position={[0, .175, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]} receiveShadow><circleGeometry args={[5.25, 8]} /><meshStandardMaterial color="#ce9b69" roughness={.95} /></mesh>
    <mesh position={[0, .18, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}><ringGeometry args={[4.9, 5.07, 8]} /><meshStandardMaterial color="#f6dfb3" /></mesh>
    <mesh position={[0, .185, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}><ringGeometry args={[1.9, 2.1, 8]} /><meshStandardMaterial color="#30796c" /></mesh>
  </group>;
});
