'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import type { IdentitePersonnage } from '@/lib/identites-personnages';
import { commande } from '@/lib/lieux-programme/depot';
import { tableauLaboratoire } from '@/lib/lieux-programme/laboratoire';
import { fr } from '@/lib/programme-lieu';
import { BlocsInstances } from './blocs-instances';
import { Bungalow, CamionLivraison } from './chantier-vivant';
import { HumainMonde } from './humain-monde';
import type { ProprietesDecor } from './interieur-lieu-programme';
import { MateriauMonde } from './materiaux-monde';

// Décors des lieux à programme, fidèles au métier de chaque bâtiment, qui évoluent avec les étapes validées.
// La caméra regarde depuis le sud-sud-est : enseignes, tableaux et façades des équipements sont tournés vers le sud.

export function Boite({ p, s, c, r = 0, metal = 0, rugosite = .75, emissif }: { p: V3; s: V3; c: string; r?: number; metal?: number; rugosite?: number; emissif?: string }) {
  return <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} metalness={metal} roughness={rugosite} emissive={emissif ?? '#000000'} emissiveIntensity={emissif ? .9 : 0} /></mesh>;
}
export function Cyl({ p, r, h, c, haut, rot, metal = 0, segments = 18 }: { p: V3; r: number; h: number; c: string; haut?: number; rot?: V3; metal?: number; segments?: number }) {
  return <mesh position={p} rotation={rot ?? [0, 0, 0]} castShadow receiveShadow><cylinderGeometry args={[haut ?? r, r, h, segments]} /><meshStandardMaterial color={c} metalness={metal} roughness={metal ? .35 : .7} /></mesh>;
}
export function Verre({ p, s, c = '#BFD8E2', opacite = .18 }: { p: V3; s: V3; c?: string; opacite?: number }) {
  return <mesh position={p} userData={{ sansOcclusion: true }}><boxGeometry args={s} /><meshPhysicalMaterial color={c} transparent opacity={opacite} roughness={.05} metalness={.1} depthWrite={false} /></mesh>;
}
export function Mur({ p, s, c }: { p: V3; s: V3; c: string }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><MateriauMonde type="painted_plaster_wall" couleur={c} echelle={2.6} relief={.4} rugosite={.95} /></mesh>;
}
export function Sol({ largeur, profondeur, c, echelle = 3, rugosite = .85 }: { largeur: number; profondeur: number; c: string; echelle?: number; rugosite?: number }) {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[largeur, profondeur]} /><MateriauMonde type="concrete_floor" couleur={c} echelle={echelle} relief={.5} rugosite={rugosite} /></mesh>;
}
/** Sol carrelé et ciré : grands carreaux clairs, joints fins en blocs instanciés. */
export function SolCarrele({ largeur, profondeur, c, joint, pas = .8 }: { largeur: number; profondeur: number; c: string; joint: string; pas?: number }) {
  const joints = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    for (let x = -largeur / 2 + pas; x < largeur / 2 - .01; x += pas) blocs.push({ position: [x, .002, 0], taille: [.03, .002, profondeur], couleur: joint, rotation: 0 });
    for (let z = -profondeur / 2 + pas; z < profondeur / 2 - .01; z += pas) blocs.push({ position: [0, .002, z], taille: [largeur, .002, .03], couleur: joint, rotation: 0 });
    return blocs;
  }, [largeur, profondeur, joint, pas]);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[largeur, profondeur]} /><meshStandardMaterial color={c} roughness={.3} /></mesh>
    <BlocsInstances blocs={joints} interactif={false} />
  </>;
}
export function Enseigne({ p, r = 0, largeur, hauteur, fond, texte, couleur = '#FFFFFF', taille = .18 }: { p: V3; r?: number; largeur: number; hauteur: number; fond: string; texte: string; couleur?: string; taille?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    <mesh castShadow><boxGeometry args={[largeur, hauteur, .05]} /><meshStandardMaterial color={fond} roughness={.6} /></mesh>
    <Text position={[0, 0, .03]} fontSize={taille} color={couleur} anchorX="center" anchorY="middle" maxWidth={largeur - .12} textAlign="center" lineHeight={1.25}>{texte}</Text>
  </group>;
}
export function Personne({ p, r = 0, identite, assis = false }: { p: V3; r?: number; identite?: IdentitePersonnage; assis?: boolean }) {
  return <group position={p} rotation={[0, r, 0]}><HumainMonde prof identite={identite} assis={assis} /></group>;
}
/** Murs d'un intérieur vu en coupe : nord et côtés pleins, sud bas avec la porte, pour voir dedans depuis la caméra. */
export function MursCoupe({ hx, hz, hauteur, c, porte = 3 }: { hx: number; hz: number; hauteur: number; c: string; porte?: number }) {
  const segment = hx - porte / 2;
  return <>
    <Mur p={[0, hauteur / 2, -hz - .1]} s={[hx * 2 + .4, hauteur, .2]} c={c} />
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * (hx + .1), hauteur / 2, 0]} s={[.2, hauteur, hz * 2 + .4]} c={c} />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * (porte / 2 + segment / 2), .45, hz + .1]} s={[segment + .2, .9, .2]} c={c} />)}
  </>;
}
export function Plafonniers({ points, couleur = '#FFF6E2' }: { points: V3[]; couleur?: string }) {
  return <>{points.map((p, i) => <group key={i}>
    <Boite p={p} s={[1.6, .06, .3]} c="#F4F2EC" emissif={couleur} />
    {i % 2 === 0 && <pointLight position={[p[0], p[1] - .3, p[2]]} intensity={5} distance={13} decay={2} color={couleur} />}
  </group>)}</>;
}

// ─── Laboratoire des matériaux ───

/** Malaxeur de laboratoire : la cuve tourne doucement. */
function Malaxeur({ p }: { p: V3 }) {
  const cuve = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (cuve.current) cuve.current.rotation.y += Math.min(delta, .05) * 1.6; });
  return <group position={p}>
    <Boite p={[0, .35, 0]} s={[1, .7, .8]} c="#3C5A73" />
    <group position={[0, .95, 0]} rotation={[0, 0, .5]}><mesh ref={cuve} castShadow><cylinderGeometry args={[.28, .42, .7, 16, 1, true]} /><meshStandardMaterial color="#C9CDD0" metalness={.6} roughness={.35} side={THREE.DoubleSide} /></mesh></group>
  </group>;
}

export function DecorLaboratoire({ faites, cycle }: ProprietesDecor) {
  const t = useMemo(() => tableauLaboratoire(cycle), [cycle]);
  const eprouvettes = faites >= 6 ? 2 : faites >= 4 ? 5 : faites >= 3 ? 6 : 0;
  const casses = faites >= 6 ? 4 : faites >= 4 ? 1 : 0;
  const lignes = [
    ['Affaissement', faites >= 2 ? t.affaissement : '—'], ['Résistance à 7 jours', faites >= 4 ? t.fc7 : '—'],
    ['Passant à 2 mm', faites >= 5 ? t.passant : '—'], ['Résistance à 28 jours', faites >= 6 ? t.fc28 : '—'],
  ];
  return <>
    {/* Sol en résine claire et lumière froide : un laboratoire, pas un entrepôt. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[22, 16]} /><meshStandardMaterial color="#BFCBC8" roughness={.36} /></mesh>
    <MursCoupe hx={11} hz={8} hauteur={3.6} c="#EEF2EF" />
    {[-8.6, 5.2, 8.8].map(x => <Boite key={x} p={[x, 2.75, -7.98]} s={[2.6, .8, .04]} c="#A9CFE0" emissif="#7FB2C8" />)}
    <Plafonniers couleur="#EEF5FF" points={[[-6, 3.35, -3], [0, 3.35, -3], [6, 3.35, -3], [-6, 3.35, 3], [0, 3.35, 3], [6, 3.35, 3]]} />
    {/* Réception des échantillons : comptoir, glacière, registre, éprouvettes enregistrées. */}
    <Boite p={[-7, .5, 4.7]} s={[4.4, 1, 1.2]} c="#7C8C8F" /><Boite p={[-7, 1.03, 4.7]} s={[4.6, .06, 1.35]} c="#ECE9E2" />
    <Boite p={[-7, .6, 5.33]} s={[4.4, .1, .02]} c="#2F7E78" />
    <Enseigne p={[-7, 2.75, 4.7]} largeur={3.4} hauteur={.42} fond="#2F5D6E" texte="RÉCEPTION DES ÉCHANTILLONS" taille={.17} />
    <Boite p={[-8.5, 1.27, 4.6]} s={[.62, .42, .42]} c="#2F6E8E" /><Boite p={[-7.7, 1.07, 4.9]} s={[.36, .03, .26]} c="#7A2E26" />
    {faites >= 1 && [0, 1, 2].map(i => <group key={i}><Cyl p={[-6.4 + i * .28, 1.22, 4.55]} r={.08} h={.32} c="#CFCAC0" /><Cyl p={[-6.4 + i * .28, 1.24, 4.55]} r={.082} h={.05} c="#F4D35E" /></group>)}
    <Personne p={[-7, 0, 3.6]} identite="koffi" />
    {/* Bacs de conservation à 20 °C et éprouvettes immergées. */}
    {[-2.9, -.6].map((z, k) => <group key={z}>
      <Boite p={[-9.4, .45, z]} s={[2.4, .9, 1.4]} c="#8E9A9C" />
      <mesh position={[-9.4, .86, z]}><boxGeometry args={[2.2, .02, 1.2]} /><meshStandardMaterial color="#5FA8C8" transparent opacity={.8} roughness={.1} /></mesh>
      {[0, 1, 2].filter(i => k * 3 + i < eprouvettes).map(i => <Cyl key={i} p={[-10.1 + i * .7, .74, z]} r={.08} h={.32} c="#E1DDD3" />)}
    </group>)}
    <Enseigne p={[-9.4, 1.35, 1.3]} largeur={2.1} hauteur={.34} fond="#F6F6F2" texte="CONSERVATION · EAU À 20 °C" couleur="#24383B" taille={.13} />
    {/* Presse d'écrasement, sa console, la cage de protection, le bac des éprouvettes rompues. */}
    <group position={[-5, 0, -6.5]}>
      <Boite p={[0, .4, 0]} s={[1.6, .8, 1.2]} c="#3C5A73" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x * .55, 1.35, z * .35]} r={.06} h={1.9} c="#B8BDC0" metal={.7} />)}
      <Boite p={[0, 2.3, 0]} s={[1.6, .3, 1.2]} c="#3C5A73" />
      <Cyl p={[0, .87, 0]} r={.22} h={.06} c="#9AA1A5" metal={.6} /><Cyl p={[0, 1.63, 0]} r={.22} h={.06} c="#9AA1A5" metal={.6} />
      <Cyl p={[0, 1.06, 0]} r={.08} h={.32} c="#E1DDD3" />
      <Verre p={[0, 1.25, 0]} s={[1.95, 2.3, 1.5]} />
      <Boite p={[1.25, .75, -.4]} s={[.7, 1.5, .55]} c="#2B3A44" /><Boite p={[1.25, 1.2, -.12]} s={[.5, .32, .02]} c="#0E2A20" emissif="#1F7A52" />
      <Text position={[1.25, 1.2, -.1]} fontSize={.09} color="#B9F5D0" anchorX="center" anchorY="middle">{faites >= 6 ? t.fc28 : faites >= 4 ? t.fc7 : '0,0 kN'}</Text>
      <Boite p={[-1.25, .25, .9]} s={[.6, .5, .5]} c="#596570" />
      {Array.from({ length: casses }, (_, i) => <Cyl key={i} p={[-1.35 + (i % 2) * .2, .56, .8 + Math.floor(i / 2) * .2]} r={.08} h={.14} c="#BDB8AE" rot={[.5 + i * .3, 0, .4]} />)}
    </group>
    {/* Paillasse centrale : balance, béchers, moules (pendant la confection), étagère à réactifs. */}
    <Boite p={[0, .45, -1]} s={[6.4, .9, 1.6]} c="#8A9599" /><Boite p={[0, .93, -1]} s={[6.6, .06, 1.8]} c="#F0F0EA" />
    {[-2.8, 0, 2.8].map(x => <Boite key={x} p={[x, 1.3, -1.75]} s={[.05, .7, .05]} c="#B8BDC0" metal={.6} />)}<Boite p={[0, 1.65, -1.75]} s={[6, .05, .4]} c="#D9DCDD" />
    <Boite p={[-2.2, 1.02, -.8]} s={[.42, .1, .36]} c="#D9DCDD" /><Boite p={[-2.2, 1.09, -.8]} s={[.3, .02, .3]} c="#9AA1A5" metal={.6} />
    {[-1.2, -.9, -.6].map((x, i) => <Verre key={x} p={[x, 1.08 + i * .02, -1.3]} s={[.14, .22 + i * .04, .14]} c="#DCEFF5" opacite={.35} />)}
    {faites === 2 && Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[.4 + (i % 3) * .3, 1.13, -1.05 + Math.floor(i / 3) * .3]} r={.09} h={.34} c="#1F1F1F" />)}
    {faites >= 3 && Array.from({ length: 4 }, (_, i) => <Cyl key={i} p={[-1.6 + i * .32, 1.85, -1.75]} r={.09} h={.34} c="#262626" />)}
    {/* Granulométrie : tamiseuse et colonne de tamis, balance, étuve ; portions de sable après l'essai. */}
    <Boite p={[6.4, .45, -6.6]} s={[6.2, .9, 1.4]} c="#8A9599" /><Boite p={[6.4, .93, -6.6]} s={[6.4, .06, 1.5]} c="#F0F0EA" />
    <Boite p={[4.4, 1.05, -6.6]} s={[.6, .2, .6]} c="#3C5A73" />
    {Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[4.4, 1.2 + i * .075, -6.6]} r={.22} h={.07} c="#C9CDD0" metal={.6} />)}
    <Boite p={[6, 1.02, -6.6]} s={[.42, .1, .36]} c="#D9DCDD" />
    {faites >= 5 && ['#E6D2A6', '#D9C29A', '#C9AE80', '#B39466'].map((c, i) => <group key={c}><Boite p={[6.9 + i * .45, .99, -6.5]} s={[.38, .06, .3]} c="#B8BDC0" metal={.5} /><Boite p={[6.9 + i * .45, 1.04, -6.5]} s={[.3, .04 + (3 - i) * .01, .22]} c={c} /></group>)}
    <Boite p={[10, .9, -6.75]} s={[1.1, 1.8, .9]} c="#C9CDD0" metal={.5} /><Boite p={[10, 1.1, -6.29]} s={[.7, .5, .02]} c="#3A1A08" emissif="#E0793A" />
    <Text position={[10, 1.62, -6.28]} fontSize={.1} color="#2B2B2E" anchorX="center">ÉTUVE 105 °C</Text>
    <Personne p={[5.2, 0, -5.1]} r={Math.PI} identite="koffi" />
    {/* Bureau et tableau des résultats de la campagne, au mur nord. */}
    <Boite p={[0, .74, -7.05]} s={[4.6, .06, 1.2]} c="#A8835A" />
    {[-2.1, 2.1].map(x => <Boite key={x} p={[x, .37, -7.05]} s={[.06, .74, 1.1]} c="#7E6244" />)}
    <Boite p={[.9, 1.02, -7.35]} s={[.62, .38, .04]} c="#1F2A30" emissif="#2E5A78" /><Boite p={[.9, .45, -6.3]} s={[.5, .5, .5]} c="#2B2B2E" />
    <Boite p={[0, 2.05, -7.97]} s={[4.8, 1.9, .04]} c="#7E6244" /><Boite p={[0, 2.05, -7.94]} s={[4.6, 1.75, .02]} c="#F7F7F3" />
    <Text position={[0, 2.78, -7.92]} fontSize={.15} color="#24383B" anchorX="center" anchorY="middle">{`CAMPAGNE C25/30 · RÉSIDENCE LAGUNE II · N° ${cycle + 1}`}</Text>
    {lignes.map(([libelle, valeur], i) => <group key={libelle}>
      <Text position={[-2.1, 2.45 - i * .32, -7.92]} fontSize={.15} color="#33464A" anchorX="left" anchorY="middle">{libelle}</Text>
      <Text position={[2.1, 2.45 - i * .32, -7.92]} fontSize={.16} color={valeur === '—' ? '#9AA1A5' : '#1F5F8B'} anchorX="right" anchorY="middle">{valeur}</Text>
    </group>)}
    {faites >= 7 && <Text position={[1.2, 1.3, -7.91]} rotation={[0, 0, .12]} fontSize={.26} color={t.conforme ? '#2F8F5B' : '#C1502E'} anchorX="center" anchorY="middle" outlineWidth={.01} outlineColor="#FFFFFF">{t.conforme ? 'CONFORME' : 'NON CONFORME'}</Text>}
    {/* Armoires à échantillons, mur est. */}
    <Boite p={[10.5, .5, 0]} s={[.8, 1, 6.2]} c="#B9C2C5" />
    {/* Essais sur béton frais : plaque, cône d'Abrams (puis le béton affaissé), malaxeur, brouette. */}
    <Boite p={[6.8, .02, 5]} s={[.7, .02, .7]} c="#9BA3A6" metal={.6} />
    {faites >= 2 ? <>
      <Cyl p={[6.75, .13, 5]} r={.24} haut={.1} h={.22} c="#8E8A84" />
      <Cyl p={[7.25, .15, 4.75]} r={.05} haut={.1} h={.3} c="#B8BDC0" metal={.6} rot={[Math.PI, 0, 0]} />
      <Boite p={[6.3, .3, 5.15]} s={[.03, .6, .03]} c="#E8B04A" />
    </> : <Cyl p={[6.8, .17, 5]} r={.1} haut={.05} h={.3} c="#B8BDC0" metal={.6} />}
    <Malaxeur p={[9.1, 0, 5]} />
    <Enseigne p={[2.8, 1.5, 7.2]} largeur={1.5} hauteur={.9} fond="#1F5F8B" texte={'PORT DES EPI\nOBLIGATOIRE\nblouse · lunettes · gants'} taille={.12} />
    <Boite p={[2.8, .55, 7.2]} s={[.06, 1.1, .06]} c="#6A6F72" />
    <Cyl p={[-1.9, .35, 7.55]} r={.12} h={.6} c="#C1272D" />
  </>;
}

// ─── Dépôt matériaux ───

/** Chariot élévateur qui fait la navette sous le hangar, une palette sur les fourches à l'aller. */
function ChariotElevateur({ x, z1, z2 }: { x: number; z1: number; z2: number }) {
  const ref = useRef<THREE.Group>(null), palette = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.elapsedTime * .35) + 1) / 2;
    ref.current.position.z = z1 + (z2 - z1) * t;
    ref.current.rotation.y = Math.cos(clock.elapsedTime * .35) > 0 ? 0 : Math.PI;
    if (palette.current) palette.current.visible = Math.cos(clock.elapsedTime * .35) > 0;
  });
  return <group ref={ref} position={[x, 0, z1]}>
    <Boite p={[0, .55, 0]} s={[1.1, .8, 1.7]} c="#E8B23A" /><Boite p={[0, .6, -.7]} s={[1.1, .9, .4]} c="#4B4F52" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} p={[a * .55, .22, b * .55]} r={.22} h={.18} c="#202326" rot={[0, 0, Math.PI / 2]} />)}
    {[-1, 1].map(a => <Boite key={a} p={[a * .4, 1.5, -.2]} s={[.06, 1.9, .06]} c="#2B2B2E" />)}<Boite p={[0, 2.4, -.2]} s={[1, .06, 1.2]} c="#2B2B2E" />
    {[-.3, .3].map(a => <Boite key={a} p={[a, 1.2, 1.25]} s={[.12, 2.2, .08]} c="#4B4F52" />)}
    {[-.3, .3].map(a => <Boite key={`f${a}`} p={[a, .15, 1.8]} s={[.12, .05, 1.1]} c="#4B4F52" />)}
    <group ref={palette}><Boite p={[0, .25, 1.8]} s={[1.1, .14, 1]} c="#8B6A45" />{[0, 1, 2].map(k => <Boite key={k} p={[0, .45 + k * .2, 1.8]} s={[1, .18, .9]} c="#DCCFB2" />)}</group>
  </group>;
}

/** Palettes de sacs, bottes d'aciers, piles d'agglos : en blocs instanciés, une seule commande de dessin par famille. */
function blocsDepot(faites: number): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  const bloc = (position: V3, taille: V3, couleur: string, rotation = 0) => blocs.push({ position, taille, couleur, rotation });
  const paletteSacs = (x: number, z: number, couches: number) => { bloc([x, .07, z], [1.2, .14, 1], '#8B6A45'); for (let k = 0; k < couches; k++) for (let i = 0; i < 2; i++) bloc([x - .27 + i * .54, .24 + k * .19, z], [.52, .17, .95], '#DCCFB2', (k + i) % 2 ? .04 : -.04); };
  const pileAgglos = (x: number, z: number, couches: number) => { bloc([x, .07, z], [1.2, .14, 1], '#8B6A45'); for (let k = 0; k < couches; k++) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) bloc([x - .4 + i * .4, .25 + k * .21, z - .25 + j * .5], [.39, .2, .48], '#9E9A91'); };
  // Ciment à l'abri, sous le hangar.
  for (const [x, z] of [[-11.6, -6.2], [-10, -6.2], [-8.4, -6.2], [-11.6, -4], [-10, -4], [-8.4, -4], [-6.6, -5.2]]) paletteSacs(x, z, 6);
  // Aciers sur les bras des racks, au fond.
  for (const y of [.68, 1.38, 2.08]) for (let i = 0; i < 6; i++) bloc([-8, y, -9.75 + i * .1], [10.2, .04, .04], '#8A5A3C');
  // Agglos stockés dans la cour.
  for (const [x, z] of [[-13.6, -.1], [-12.1, -.1], [-10.6, -.1], [-13.6, 1.8], [-12.1, 1.8], [-10.6, 1.8]]) pileAgglos(x, z, 5);
  // Commande préparée, en attente du camion.
  if (faites === 3) { paletteSacs(1.7, 0, 4); pileAgglos(4.4, .5, 4); for (const z of [-.9, -.3]) bloc([3.1, .08, z], [.12, .12, .9], '#6B5A45', Math.PI / 2); for (let i = 0; i < 8; i++) bloc([3.1, .2 + (i % 3) * .05, -.6], [4, .04, .04], '#8A5A3C'); }
  return blocs;
}

export function DecorDepot({ faites, cycle }: ProprietesDecor) {
  const blocs = useMemo(() => blocsDepot(faites), [faites]);
  const c = commande(cycle);
  const charge = faites === 4;
  return <>
    <Sol largeur={30} profondeur={22} c="#A39C90" echelle={4} />
    <Boite p={[0, .01, -6.5]} s={[28, .02, 9]} c="#BDB9AF" />
    {/* Clôture en agglos enduits, portail au sud. */}
    <Mur p={[0, 1.2, -11.1]} s={[30.4, 2.4, .2]} c="#E3D5BC" />
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 15.1, 1.2, 0]} s={[.2, 2.4, 22.4]} c="#E3D5BC" />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * 8.65, 1.2, 11.1]} s={[12.9, 2.4, .2]} c="#E3D5BC" />)}
    {/* Hangar : poteaux, poutres, couverture en tôle au fond seulement (coupe pour voir dessous), bandeau d'enseigne. */}
    {[-13.5, -4.5, 4.5, 13.5].flatMap(x => [-2.2, -10.6].map(z => <Boite key={`${x}${z}`} p={[x, 3, z]} s={[.3, 6, .3]} c="#5E6B70" metal={.4} />))}
    {[-2.2, -10.6].map(z => <Boite key={z} p={[0, 6, z]} s={[27.4, .35, .3]} c="#5E6B70" metal={.4} />)}
    {[-13.5, -4.5, 4.5, 13.5].map(x => <Boite key={x} p={[x, 6.1, -6.4]} s={[.25, .3, 8.6]} c="#5E6B70" metal={.4} />)}
    <mesh position={[0, 6.35, -8.8]} castShadow receiveShadow><boxGeometry args={[28, .06, 4.6]} /><MateriauMonde type="corrugated_iron" couleur="#C9CDC4" echelle={1.6} relief={.9} rugosite={.6} metal={.4} /></mesh>
    <Boite p={[0, 5.55, -2.1]} s={[27.6, .9, .1]} c="#C1502E" />
    <Text position={[0, 5.55, -2.04]} fontSize={.5} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.06}>DÉPÔT MATÉRIAUX · BTP LIFE</Text>
    {/* Racks à aciers (bras en porte-à-faux) et racks à tubes et carrelage. */}
    {[-12.6, -9.2, -5.8, -3.2].map(x => <group key={x}><Boite p={[x, 1.25, -10.4]} s={[.16, 2.5, .16]} c="#2F6E8E" />{[.6, 1.3, 2].map(y => <Boite key={y} p={[x, y, -9.6]} s={[.1, .08, 1.7]} c="#2F6E8E" />)}</group>)}
    {[1, 3.5, 6].map(x => <group key={x}><Boite p={[x, 1.3, -10.4]} s={[.12, 2.6, .12]} c="#5E6B70" />{[.5, 1.3, 2.1].map(y => <Boite key={y} p={[x + 1.25, y, -9.6]} s={[2.5, .06, 1.6]} c="#8B6A45" />)}</group>)}
    {[.75, 1.55].map(y => Array.from({ length: 5 }, (_, i) => <Cyl key={`${y}${i}`} p={[3.5, y, -9.95 + i * .25]} r={.07} h={5} c={i % 2 ? '#E9E9E4' : '#B9C2C5'} rot={[0, 0, Math.PI / 2]} />))}
    {Array.from({ length: 6 }, (_, i) => <Boite key={i} p={[1.6 + i * .8, 2.35, -9.6]} s={[.6, .35, .6]} c="#C9B79A" />)}
    <BlocsInstances blocs={blocs} interactif={false} />
    <Enseigne p={[-4.3, 1.6, -3]} largeur={1.6} hauteur={.9} fond="#F6F2E8" texte={faites >= 2 ? 'STOCK CPJ 45\ninventaire à jour' : 'STOCK CPJ 45\ninventaire à faire'} couleur="#2B2B2E" taille={.13} />
    <Boite p={[-4.3, .6, -3]} s={[.06, 1.2, .06]} c="#6A6F72" />
    {/* Cases à granulats (sable, gravier 5/15, gravier 15/25) entre murs d'agglos. */}
    {[-.8, 1.8, 4.6, 8].map(z => <Boite key={z} p={[11.4, .75, z]} s={[6.8, 1.5, .25]} c="#9E9A91" />)}
    {[['#D9C29A', .5, 'SABLE'], ['#A8A49C', 3.2, 'GRAVIER 5/15'], ['#8F8C86', 6.3, 'GRAVIER 15/25']].map(([couleur, z, nom]) => <group key={String(nom)}>
      <mesh position={[12, .7, z as number]} castShadow receiveShadow><coneGeometry args={[1.5, 1.4, 20]} /><meshStandardMaterial color={couleur as string} roughness={1} /></mesh>
      <Enseigne p={[9, 1.15, (z as number) + 1.15]} largeur={1.7} hauteur={.34} fond="#2B3A44" texte={String(nom)} taille={.14} />
    </group>)}
    {/* Comptoir et caisse, guichet ouvert sur la cour ; tarifs du jour. */}
    <Bungalow position={[-13.1, 0, 6.1]} taille={[5, 2.5, 3.4]} nuit={false} rotation={Math.PI / 2} libelle="COMPTOIR · CAISSE" casques={false} />
    <Enseigne p={[-13.1, 1.7, 8.75]} largeur={2.6} hauteur={1.1} fond="#F6F2E8" texte={`CPJ 45 · ${fr(5200)} F le sac\nHA12 · ${fr(7600)} F la barre\nAgglo de 15 · ${fr(425)} F`} couleur="#2B2B2E" taille={.13} />
    {faites >= 5 && <Enseigne p={[-11.15, 1.5, 5.2]} r={Math.PI / 2} largeur={.9} hauteur={.5} fond="#2F8F5B" texte="FACTURE PAYÉE" taille={.1} />}
    {/* Camions : le fournisseur au premier jour, puis le plateau du client, chargé après la pesée. */}
    {faites === 0 && <CamionLivraison position={[-2.5, 0, .4]} chargement="ciment" rotation={0} />}
    {faites < 5 && <group><CamionLivraison position={[-2.5, 0, 4.5]} chargement={charge ? 'agglos' : null} rotation={0} />{charge && Array.from({ length: 6 }, (_, i) => <Boite key={i} p={[-3.4, 1.62 + (i % 2) * .05, 3.9 + i * .1]} s={[4.6, .04, .04]} c="#8A5A3C" />)}</group>}
    {/* Pont-bascule et sa borne. */}
    <Boite p={[7, .03, 9.7]} s={[8, .06, 2.8]} c="#6E767A" metal={.5} />
    <Boite p={[11.6, 1, 9.2]} s={[.6, 2, .4]} c="#2B3A44" /><Boite p={[11.6, 1.45, 9.41]} s={[.5, .3, .02]} c="#0E2A20" emissif="#1F7A52" />
    <Text position={[11.6, 1.45, 9.43]} fontSize={.11} color="#B9F5D0" anchorX="center" anchorY="middle">{charge ? `${fr(c.masse)} kg` : '0 kg'}</Text>
    <ChariotElevateur x={7.4} z1={-6.6} z2={-3.4} />
    <Personne p={[-8.6, 0, -2.4]} identite="koffi" />
  </>;
}

// ─── Hôtel de ville ───

/** Chaises de la salle d'attente : assise, dossier et pieds, en blocs instanciés. */
function blocsChaises(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  for (const z of [.5, 1.7, 2.9]) for (let x = -5.2; x <= 5.21; x += .75) {
    if (Math.abs(x) < 1.1) continue;
    blocs.push({ position: [x, .45, z], taille: [.48, .06, .46], couleur: '#2F5D6E', rotation: 0 }, { position: [x, .75, z + .22], taille: [.48, .55, .05], couleur: '#2F5D6E', rotation: 0 }, { position: [x, .22, z], taille: [.42, .44, .38], couleur: '#5E6B70', rotation: 0 });
  }
  return blocs;
}

export function DecorMairie({ faites, cycle }: ProprietesDecor) {
  const chaises = useMemo(() => blocsChaises(), []);
  const statut = faites >= 6 ? 'Conformité attestée' : faites >= 5 ? 'Permis accordé' : faites >= 4 ? 'Reçu · en instruction' : 'Pas encore déposé';
  return <>
    <SolCarrele largeur={24} profondeur={16} c="#E3D9C6" joint="#C9BCA4" />
    <Boite p={[0, .012, 1.4]} s={[2.2, .012, 12.6]} c="#7A2E26" rugosite={1} />
    <MursCoupe hx={12} hz={8} hauteur={4.4} c="#EFE6D2" />
    <Plafonniers points={[[-6, 4.1, -2], [0, 4.1, -2], [6, 4.1, -2], [-6, 4.1, 3.5], [0, 4.1, 3.5], [6, 4.1, 3.5]]} couleur="#FFF1D6" />
    {[[-7, -2], [7, -2], [-7, 4], [7, 4]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, 2.2, z]} r={.35} h={4.4} c="#F2EBDD" segments={24} /><Cyl p={[x, .1, z]} r={.45} h={.2} c="#D9CFBD" segments={24} /></group>)}
    {/* Drapeau national et titre du guichet unique, au mur nord. */}
    {['#F77F00', '#FFFFFF', '#009E60'].map((c, i) => <Boite key={c} p={[-.8 + i * .8, 3.35, -7.97]} s={[.8, 1.5, .03]} c={c} />)}
    <Text position={[0, 2.35, -7.96]} fontSize={.24} color="#5A3E2B" anchorX="center" anchorY="middle" letterSpacing={.05}>HÔTEL DE VILLE · GUICHET UNIQUE DE L’URBANISME</Text>
    {/* Guichet unique : comptoir en bois, vitrage, numéros des guichets, agents, et l'état du dossier. */}
    <Boite p={[0, .55, -5.4]} s={[18.8, 1.1, 1.6]} c="#8B5E3C" /><Boite p={[0, 1.13, -5.4]} s={[19, .06, 1.8]} c="#D9C7A5" />
    <Verre p={[0, 1.72, -5.95]} s={[18.8, 1.1, .03]} />
    {[[-6, '1 · Dépôt des dossiers'], [-2, '2 · Instruction'], [2, '3 · Retrait des permis'], [6, '4 · Caisse']].map(([x, texte]) => <Enseigne key={String(x)} p={[x as number, 2.45, -5.96]} largeur={2.6} hauteur={.4} fond="#1F3A4A" texte={String(texte)} taille={.14} />)}
    <Enseigne p={[-2, 3.05, -5.96]} largeur={3} hauteur={.62} fond="#0E2A20" texte={`Dossier PC-2026-${String(147 + cycle).padStart(4, '0')}\n${statut}`} couleur="#B9F5D0" taille={.15} />
    <Personne p={[-6, 0, -6.9]} identite="awa" /><Personne p={[2, 0, -6.9]} identite="koffi" />
    {/* Salle d'attente et distributeur de tickets. */}
    <BlocsInstances blocs={chaises} interactif={false} />
    <Personne p={[-3.7, 0, 1.7]} r={Math.PI} identite="fatou" assis /><Personne p={[2.95, 0, 2.9]} r={Math.PI} identite="koffi" assis /><Personne p={[4.45, 0, .5]} r={Math.PI} identite="awa" assis />
    <Boite p={[2.4, .6, 6.5]} s={[.3, 1.2, .3]} c="#2B3A44" /><Boite p={[2.4, 1.3, 6.5]} s={[.4, .3, .3]} c="#1F3A4A" emissif="#2E5A78" />
    {/* Domaines : bureau, agent, titres fonciers. */}
    <Boite p={[9.5, .75, .8]} s={[2.4, .06, 1.6]} c="#8B5E3C" /><Boite p={[9.5, .37, 1.55]} s={[2.4, .74, .06]} c="#7A5233" />
    {[0, 1, 2].map(i => <Boite key={i} p={[9.1, .8 + i * .03, .5]} s={[.34, .03, .25]} c={['#2F6E8E', '#C1502E', '#E8B04A'][i]} />)}
    <Personne p={[10.4, 0, .8]} r={-Math.PI / 2} identite="mariam" />
    <Enseigne p={[9.5, 2.6, 0]} largeur={2.4} hauteur={.4} fond="#5A3E2B" texte="DOMAINES · FONCIER" taille={.15} />
    {/* Urbanisme : table du plan de la ville, maquette de la parcelle, plan d'urbanisme affiché. */}
    <Boite p={[9.1, .8, -3.05]} s={[3.2, .06, 1.9]} c="#D9CFBD" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Boite key={`${a}${b}`} p={[9.1 + a * 1.45, .4, -3.05 + b * .8]} s={[.08, .8, .08]} c="#7A5233" />)}
    <Boite p={[9.1, .84, -3.05]} s={[3, .01, 1.7]} c="#EDE7D8" />
    {[[8.2, -3.5, '#C8D9B4'], [9.8, -2.6, '#E6C9A8'], [8.6, -2.5, '#B9CBD9']].map(([x, z, c]) => <Boite key={String(c)} p={[x as number, .85, z as number]} s={[.8, .01, .5]} c={c as string} />)}
    {faites >= 3 && <><Boite p={[9.6, .86, -3.4]} s={[.9, .02, .7]} c="#7FA36B" /><Boite p={[9.6, .96, -3.42]} s={[.36, .18, .24]} c="#F2EBDD" /></>}
    {faites >= 6 && <><Cyl p={[10.05, 1.06, -3.2]} r={.01} h={.4} c="#5E6B70" /><Boite p={[10.12, 1.2, -3.2]} s={[.14, .08, .01]} c="#2F8F5B" /></>}
    <Enseigne p={[9.1, 1.75, -4.35]} largeur={3} hauteur={1.3} fond="#F2EEE4" texte={'PLAN D’URBANISME\nzone d’habitat · emprise 60 % au plus\nrecul sur voie 5 m minimum · R+2 au plus'} couleur="#5A3E2B" taille={.13} />
    {/* Table de rédaction : le dossier grossit au fil des étapes. */}
    <Boite p={[-9, .75, 3.8]} s={[3, .06, 1.4]} c="#8B5E3C" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Boite key={`${a}${b}`} p={[-9 + a * 1.35, .37, 3.8 + b * .55]} s={[.07, .74, .07]} c="#7A5233" />)}
    {faites >= 1 && <Boite p={[-9.5, .8, 3.8]} s={[.32, .03, .24]} c="#2F6E8E" />}
    {faites >= 2 && <><Boite p={[-8.7, .85, 3.75]} s={[.34, .13, .26]} c="#F6F2E8" /><Boite p={[-8.7, .92, 3.75]} s={[.36, .01, .28]} c="#C1502E" /></>}
    {/* Affichage légal, tourné vers la salle : l'avis du permis apparaît à la délivrance. */}
    <Boite p={[-9, 1.5, -.3]} s={[2.7, 1.5, .06]} c="#B98B58" />
    {[-10.1, -7.9].map(x => <Boite key={x} p={[x, .75, -.3]} s={[.07, 1.5, .07]} c="#5A3E2B" />)}
    {[[-9.8, 1.8], [-9.3, 1.3], [-8.4, 1.75]].map(([x, y]) => <Boite key={`${x}${y}`} p={[x, y, -.26]} s={[.4, .52, .01]} c="#F6F2E8" />)}
    {faites >= 5 && <Enseigne p={[-8.9, 1.35, -.25]} largeur={.9} hauteur={.62} fond="#F4D35E" texte={`AVIS\nPERMIS DE CONSTRUIRE\nPC-2026-${String(147 + cycle).padStart(4, '0')}`} couleur="#2B2B2E" taille={.07} />}
    {/* Archives et plantes. */}
    <Boite p={[-10.6, 1.2, -2.8]} s={[2.2, 2.4, 2.6]} c="#8E7A5E" />
    {[[-10, 6.6], [10, 6.6], [-7.8, -3.3], [7.8, 5]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .3, z]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[x, 1.15, z]} castShadow><coneGeometry args={[.55, 1.3, 7]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>)}
  </>;
}

