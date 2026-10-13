'use client';

import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, MapControls, Sky, Text } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '@/lib/api';
import type { JoueurActif } from './autres-joueurs';
import { Architecture, PaysageLagune } from './ville-lagune';
import { InteractionLieu } from './interaction-lieu';
import { DialoguePersonnage, HABITANTS } from './dialogue-personnage';
import { LIMITES_VILLE, QUARTIERS } from '@/lib/ville';
import { PanneauModesJeu } from './panneau-modes-jeu';
import { avancerMode, MODES_JEU, type ModeJeuId } from '@/lib/modes-jeu';
import { useAuthStore } from '@/lib/auth-store';
import { appliquerTempsEcoule, chargerEtatMondeLocal, choisirEtatMondeRecent, sauvegarderEtatMondeLocal, type EtatMonde } from '@/lib/sauvegarde-monde';

type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
type PointMonde = [number, number];

export interface BesoinsJoueur { energie: number; moral: number; faim: number; social: number; }
interface Batiment3D {
  slug: string; nom: string; href: string;
  position: [number, number, number]; taille: [number, number, number]; couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

const BATIMENTS: Batiment3D[] = [
  { slug: 'universite', nom: 'Université BTP', href: '/app/academie', position: [-29, 4, -23], taille: [17, 8, 12], couleur: '#d8c092', type: 'campus' },
  { slug: 'entreprise', nom: 'Tour BTP Life', href: '/app/entreprise', position: [29, 9, -24], taille: [13, 18, 11], couleur: '#53677a', type: 'tour' },
  { slug: 'chantier', nom: 'Grand chantier', href: '/app/chantiers', position: [31, 2, 22], taille: [21, 4, 15], couleur: '#d97706', type: 'chantier' },
  { slug: 'residence', nom: 'Résidence Lagune', href: '/app/lieu/residence', position: [-31, 4, 22], taille: [15, 8, 12], couleur: '#b45309', type: 'maison' },
  { slug: 'maquis', nom: 'Le Maquis', href: '/app/lieu/maquis', position: [-11, 2.3, 31], taille: [10, 4.6, 8], couleur: '#be563c', type: 'commerce' },
  { slug: 'cafe', nom: 'Café social', href: '/app/lieu/cafe', position: [10, 2.3, -34], taille: [10, 4.6, 8], couleur: '#6b7a3f', type: 'commerce' },
  { slug: 'banque', nom: 'Banque BTL', href: '/app/lieu/banque', position: [-41, 4, -1], taille: [12, 8, 10], couleur: '#d6bd75', type: 'campus' },
  { slug: 'fournisseur', nom: 'Dépôt matériaux', href: '/app/fournisseur', position: [42, 3.5, -1], taille: [14, 7, 11], couleur: '#8e785e', type: 'commerce' },
  { slug: 'mairie', nom: 'Hôtel de ville', href: '/app/lieu/mairie', position: [-26, 4.5, -91], taille: [18, 9, 13], couleur: '#d8ccb2', type: 'campus' },
  { slug: 'laboratoire', nom: 'Laboratoire des matériaux', href: '/app/lieu/laboratoire', position: [28, 3, -91], taille: [16, 6, 12], couleur: '#98b8ae', type: 'campus' },
  { slug: 'bureau-etudes', nom: 'Maison des ingénieurs', href: '/app/competences', position: [0, 6, -114], taille: [16, 12, 10], couleur: '#6e8e99', type: 'tour' },
  { slug: 'jardins-residence', nom: 'Résidences des Jardins', href: '/app/lieu/residence', position: [-88, 3, -33], taille: [14, 6, 12], couleur: '#d7b58b', type: 'maison' },
  { slug: 'marche', nom: 'Marché des Jardins', href: '/app/lieu/maquis', position: [-88, 2, 22], taille: [16, 4, 10], couleur: '#b65d45', type: 'commerce' },
  { slug: 'atelier', nom: 'Atelier de formation', href: '/app/logiciels', position: [87, 3, -33], taille: [18, 6, 12], couleur: '#b1aa82', type: 'campus' },
  { slug: 'logistique', nom: 'Plateforme logistique', href: '/app/depot', position: [88, 3, 22], taille: [22, 6, 14], couleur: '#788d99', type: 'campus' },
  { slug: 'agence', nom: 'Agence des talents', href: '/app/offres', position: [-88, 4.5, -88], taille: [14, 9, 12], couleur: '#a2b5a1', type: 'tour' },
  { slug: 'construction-nord', nom: 'Chantier du Plateau', href: '/app/chantiers', position: [87, 2, -88], taille: [20, 4, 16], couleur: '#c39b64', type: 'chantier' },
  { slug: 'centre-azur', nom: 'Centre commercial Azur', href: '/app/inventaire', position: [-84, 5, 24], taille: [28, 10, 18], couleur: '#88aeb2', type: 'commerce' },
  { slug: 'galerie-palmiers', nom: 'Galerie des Palmiers', href: '/app/inventaire', position: [84, 4, 25], taille: [26, 8, 18], couleur: '#c0936f', type: 'commerce' },
  { slug: 'marina', nom: 'Marina BTP Life', href: '/app/lieu/cafe', position: [89, 2.5, 55], taille: [18, 5, 10], couleur: '#4b858c', type: 'commerce' },
  { slug: 'sports', nom: 'Complexe sportif', href: '/app/recompenses', position: [-89, 3, 55], taille: [20, 6, 10], couleur: '#6f8f55', type: 'campus' },
];

const ROUTES_PNJ: PointMonde[][] = [
  [[-4, -38], [-4, 36], [4, 36], [4, -38]],
  [[-47, -4], [47, -4], [47, 4], [-47, 4]],
  [[-22, 13], [-4, 13], [-4, -13], [22, -13], [22, 13]],
  [[14, 36], [4, 25], [4, 4], [34, 4], [34, 28]],
  [[-42, 6], [-20, 6], [-4, 18], [-4, 35], [-28, 35]],
];
const ROUTES_PASSANTS: PointMonde[][] = [
  [[-112, -12], [-62, -12], [-62, 36], [-110, 36]],
  [[62, -12], [112, -12], [112, 37], [62, 37]],
  [[-42, -73], [-42, -113], [42, -113], [42, -73]],
  [[-108, 44], [-58, 44], [-58, 63], [-108, 63]],
  [[58, 44], [108, 44], [108, 63], [58, 63]],
  [[-48, -58], [48, -58], [48, -74], [-48, -74]],
];

const TOUCHES: Record<string, Direction | undefined> = {
  KeyW: 'avant', KeyZ: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere',
  KeyA: 'gauche', KeyQ: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite',
};


function Batiment({ batiment, selectionne, onSelect }: { batiment: Batiment3D; selectionne: boolean; onSelect: (b: Batiment3D) => void }) {
  return <group position={[batiment.position[0], 0, batiment.position[2]]} onClick={(e) => { e.stopPropagation(); if (e.delta < 5) onSelect(batiment); }}>
    <Architecture width={batiment.taille[0]} height={batiment.taille[1]} depth={batiment.taille[2]} color={batiment.couleur} kind={batiment.type} />
    <Billboard position={[0, Math.max(batiment.taille[1], batiment.type === 'chantier' ? 14 : 0) + 2, 0]}>
      <mesh><planeGeometry args={[Math.max(9, batiment.nom.length * 0.55), 1.8]} /><meshBasicMaterial color={selectionne ? '#9b6422' : '#152b30'} transparent opacity={0.93} /></mesh>
      <Text position={[0, 0, 0.02]} fontSize={0.65} color="#fff0ce" anchorX="center" anchorY="middle">{batiment.nom}</Text>
    </Billboard>
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}><ringGeometry args={[Math.max(...[batiment.taille[0], batiment.taille[2]]) * 0.65, Math.max(batiment.taille[0], batiment.taille[2]) * 0.65 + 0.25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
}

function Personnage({ nom, couleur = '#c1502e', marche = false, casque = false }: { nom?: string; couleur?: string; marche?: boolean; casque?: boolean }) {
  const corps = useRef<THREE.Group>(null);
  const brasG = useRef<THREE.Group>(null); const brasD = useRef<THREE.Group>(null);
  const jambeG = useRef<THREE.Group>(null); const jambeD = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 8;
    if (corps.current) corps.current.position.y = marche ? Math.abs(Math.sin(phase)) * 0.07 : Math.sin(clock.elapsedTime * 2) * 0.018;
    const balancement = marche ? Math.sin(phase) * 0.55 : 0;
    if (brasG.current) brasG.current.rotation.x = balancement;
    if (brasD.current) brasD.current.rotation.x = -balancement;
    if (jambeG.current) jambeG.current.rotation.x = -balancement;
    if (jambeD.current) jambeD.current.rotation.x = balancement;
  });
  const peau = '#8d5524';
  return <group ref={corps} scale={0.9}>
    <group position={[0, 1.55, 0]}>
      <mesh castShadow><capsuleGeometry args={[0.39, 0.72, 6, 12]} /><meshStandardMaterial color={couleur} roughness={0.8} /></mesh>
      <mesh castShadow position={[0, -0.08, 0.38]}><boxGeometry args={[0.52, 0.48, 0.08]} /><meshStandardMaterial color="#f4c430" /></mesh>
    </group>
    <group ref={brasG} position={[-0.52, 1.86, 0]}><mesh castShadow position={[0, -0.43, 0]}><capsuleGeometry args={[0.13, 0.58, 5, 8]} /><meshStandardMaterial color={peau} /></mesh></group>
    <group ref={brasD} position={[0.52, 1.86, 0]}><mesh castShadow position={[0, -0.43, 0]}><capsuleGeometry args={[0.13, 0.58, 5, 8]} /><meshStandardMaterial color={peau} /></mesh></group>
    <group ref={jambeG} position={[-0.22, 1.05, 0]}><mesh castShadow position={[0, -0.48, 0]}><capsuleGeometry args={[0.16, 0.68, 5, 8]} /><meshStandardMaterial color="#26364a" /></mesh><mesh castShadow position={[0, -0.95, 0.1]}><boxGeometry args={[0.3, 0.2, 0.52]} /><meshStandardMaterial color="#342820" /></mesh></group>
    <group ref={jambeD} position={[0.22, 1.05, 0]}><mesh castShadow position={[0, -0.48, 0]}><capsuleGeometry args={[0.16, 0.68, 5, 8]} /><meshStandardMaterial color="#26364a" /></mesh><mesh castShadow position={[0, -0.95, 0.1]}><boxGeometry args={[0.3, 0.2, 0.52]} /><meshStandardMaterial color="#342820" /></mesh></group>
    <mesh castShadow position={[0, 2.45, 0]} scale={[0.88, 1.12, 0.95]}><sphereGeometry args={[0.4, 18, 18]} /><meshStandardMaterial color={peau} roughness={0.9} /></mesh>
    {[-0.14, 0.14].map(x => <group key={x} position={[x, 2.5, 0.35]}>
      <mesh scale={[1, 0.65, 0.4]}><sphereGeometry args={[0.078, 10, 8]} /><meshStandardMaterial color="#f5e8d5" /></mesh>
      <mesh position={[0, 0, 0.03]}><sphereGeometry args={[0.036, 8, 8]} /><meshStandardMaterial color="#25201e" /></mesh>
      <mesh position={[0, 0.11, -0.01]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><boxGeometry args={[0.17, 0.035, 0.055]} /><meshStandardMaterial color="#34231c" /></mesh>
    </group>)}
    <mesh position={[0, 2.38, 0.4]} scale={[0.7, 1, 0.9]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color={peau} /></mesh>
    <mesh position={[0, 2.24, 0.35]}><boxGeometry args={[0.17, 0.025, 0.04]} /><meshStandardMaterial color="#633c2b" /></mesh>
    <mesh castShadow position={[0, 2.7, -0.08]} scale={[1.02, 0.48, 1.02]}><sphereGeometry args={[0.41, 16, 16]} /><meshStandardMaterial color="#1f1714" roughness={1} /></mesh>
    {casque && <group position={[0, 2.8, 0]}><mesh castShadow scale={[1.08, 0.48, 1.08]}><sphereGeometry args={[0.46, 16, 12]} /><meshStandardMaterial color="#f4c430" /></mesh><mesh position={[0, -0.08, 0.31]}><boxGeometry args={[0.65, 0.08, 0.26]} /><meshStandardMaterial color="#e3aa16" /></mesh></group>}
    <mesh castShadow position={[0, 3.22, 0]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.24]} /><meshStandardMaterial color="#6fbd45" emissive="#315c16" emissiveIntensity={0.3} /></mesh>
    {nom && <Billboard position={[0, 3.62, 0]}><Text fontSize={0.34} color="#2b2b2e" outlineWidth={0.045} outlineColor="white" anchorX="center" anchorY="middle">{nom}</Text></Billboard>}
  </group>;
}

function Joueur({ nom, directions, destination, positionRef, pause, positionInitiale, onPosition }: { nom?: string; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; positionRef: React.MutableRefObject<THREE.Vector3>; pause: boolean; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void }) {
  const ref = useRef<THREE.Group>(null);
  const delaiSignal = useRef(0);
  const [marche, setMarche] = useState(false);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!ref.current || !positionInitiale) return;
    ref.current.position.set(positionInitiale[0], 0, positionInitiale[1]);
    positionRef.current.copy(ref.current.position);
  }, [positionInitiale?.[0], positionInitiale?.[1], positionRef]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (pause) { if (marche) setMarche(false); return; }
    const mouvement = new THREE.Vector3();
    if (directions.size) {
      const avant = new THREE.Vector3(); camera.getWorldDirection(avant); avant.y = 0; avant.normalize();
      const droite = new THREE.Vector3(-avant.z, 0, avant.x);
      mouvement.addScaledVector(avant, Number(directions.has('avant')) - Number(directions.has('arriere')));
      mouvement.addScaledVector(droite, Number(directions.has('droite')) - Number(directions.has('gauche')));
      destination.current = null;
    } else if (destination.current) {
      mouvement.set(destination.current[0] - ref.current.position.x, 0, destination.current[1] - ref.current.position.z);
      if (mouvement.lengthSq() < 0.08) { destination.current = null; mouvement.set(0, 0, 0); }
    }
    const actif = mouvement.lengthSq() > 0.001;
    if (actif) {
      mouvement.normalize();
      const prochain = ref.current.position.clone().addScaledVector(mouvement, 7 * Math.min(delta, 0.05));
      const bloque = BATIMENTS.some(b => Math.abs(prochain.x - b.position[0]) < b.taille[0] / 2 + 0.7 && Math.abs(prochain.z - b.position[2]) < b.taille[2] / 2 + 0.7);
      if (!bloque) ref.current.position.copy(prochain);
      else destination.current = null;
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, LIMITES_VILLE.minX, LIMITES_VILLE.maxX);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ);
      ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z);
    }
    positionRef.current.copy(ref.current.position);
    delaiSignal.current += delta;
    if (actif && delaiSignal.current >= 1.5) { delaiSignal.current = 0; onPosition?.([ref.current.position.x, ref.current.position.z]); }
    if (actif !== marche) { if (!actif) onPosition?.([ref.current.position.x, ref.current.position.z]); setMarche(actif); }
  });
  return <group ref={ref}><Personnage nom={nom} marche={marche} casque /></group>;
}

function PnjAutonome({ nom, couleur, route, depart, pause, onParler }: { nom: string; couleur: string; route: PointMonde[]; depart: number; pause: boolean; onParler: (nom: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const index = useRef(depart % route.length);
  useFrame((_, delta) => {
    if (!ref.current || pause) return;
    const cible = route[index.current];
    const mouvement = new THREE.Vector3(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z);
    if (mouvement.lengthSq() < 0.18) index.current = (index.current + 1) % route.length;
    else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.8 * Math.min(delta, 0.05)); ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z); }
  });
  const point = route[depart % route.length];
  return <group ref={ref} position={[point[0], 0, point[1]]} onClick={e => { e.stopPropagation(); if (e.delta < 5) onParler(nom); }}><Personnage nom={`${nom} · Parler`} couleur={couleur} marche={!pause} /></group>;
}
function Passant({ route, depart, pause, couleur }: { route: PointMonde[]; depart: number; pause: boolean; couleur: string }) {
  const ref = useRef<THREE.Group>(null); const index = useRef(depart % route.length);
  useFrame((_, delta) => { if (!ref.current || pause) return; const cible = route[index.current]; const mouvement = new THREE.Vector3(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z); if (mouvement.lengthSq() < 0.2) index.current = (index.current + 1) % route.length; else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.5 * Math.min(delta, 0.05)); ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z); } });
  const point = route[depart % route.length];
  return <group ref={ref} position={[point[0], 0, point[1]]}><Personnage couleur={couleur} marche={!pause} casque={depart % 3 === 0} /></group>;
}

function CameraSims({ joueur }: { joueur: React.MutableRefObject<THREE.Vector3> }) {
  const controles = useRef<ComponentRef<typeof MapControls>>(null);
  const cible = useMemo(() => new THREE.Vector3(), []);
  const camera = useThree(s => s.camera);
  useFrame((_, delta) => {
    if (!controles.current) return;
    cible.set(joueur.current.x, 1, joueur.current.z);
    cible.sub(controles.current.target).multiplyScalar(1 - Math.exp(-6 * delta));
    camera.position.add(cible); controles.current.target.add(cible); controles.current.update();
  });
  return <MapControls ref={controles} makeDefault enableDamping dampingFactor={0.08} minDistance={8} maxDistance={34} minPolarAngle={0.48} maxPolarAngle={1.25} enablePan={false} mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} />;
}


function MarqueurDestination({ destination }: { destination: React.MutableRefObject<PointMonde | null> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.visible = Boolean(destination.current);
    if (destination.current) { ref.current.position.set(destination.current[0], 0.12, destination.current[1]); ref.current.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 5) * 0.12); }
  });
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.35, 0.55, 24]} /><meshBasicMaterial color="#f4c430" transparent opacity={0.9} /></mesh>;
}

function Scene({ nomJoueur, joueurs, directions, destination, heure, pause, selection, objectif, onSelect, interlocuteur, onParler, positionInitiale, onPosition }: { nomJoueur?: string; joueurs: JoueurActif[]; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; heure: number; pause: boolean; selection: string | undefined; objectif?: string; onSelect: (b: Batiment3D) => void; interlocuteur: string | null; onParler: (nom: string) => void; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void }) {
  const joueur = useRef(new THREE.Vector3());
  const nuit = heure >= 19 || heure < 6;
  const noms = ['Awa', 'Yao', 'Mariam', 'Koffi', 'Fatou'];
  const choisirDestination = useCallback((point: PointMonde) => { destination.current = point; }, [destination]);
  return <>
    <color attach="background" args={[nuit ? '#11182d' : '#9fd7ef']} />
    {!nuit && <Sky sunPosition={[Math.cos((heure - 6) / 13 * Math.PI) * 60, 24, Math.sin((heure - 6) / 13 * Math.PI) * 60]} turbidity={8} rayleigh={2} />}
    <hemisphereLight args={['#d9e6e9', '#84664c', nuit ? 0.35 : 1.1]} />
    <directionalLight castShadow color="#ffe0ad" position={[-60, 140, 50]} intensity={nuit ? 0.4 : 3.2} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-170} shadow-camera-right={170} shadow-camera-top={170} shadow-camera-bottom={-170} shadow-camera-far={420} shadow-normalBias={0.04} />
    <fog attach="fog" args={[nuit ? '#11182d' : '#b9d9df', 110, 260]} />
    <PaysageLagune pause={pause} onDestination={choisirDestination} /><MarqueurDestination destination={destination} />
    {BATIMENTS.map((b) => <Batiment key={b.slug} batiment={b} selectionne={selection === b.slug || objectif === b.slug} onSelect={onSelect} />)}
    <Joueur nom={nomJoueur} directions={directions} destination={destination} positionRef={joueur} pause={pause || !!interlocuteur} positionInitiale={positionInitiale} onPosition={onPosition} />
    {noms.map((nom, i) => <PnjAutonome key={`${nom}-${i}`} nom={nom} couleur={HABITANTS[i].couleur} route={ROUTES_PNJ[i]} depart={i} pause={pause || interlocuteur === nom} onParler={onParler} />)}
    {ROUTES_PASSANTS.flatMap((route, i) => [0, 2].map((depart, j) => <Passant key={`passant-${i}-${j}`} route={route} depart={depart} pause={pause} couleur={['#5f7f68', '#b66e54', '#5d75a0', '#9670a0'][i % 4]} />))}
    <CameraSims joueur={joueur} />
  </>;
}

function BoutonDirection({ direction, symbole, setDirection }: { direction: Direction; symbole: string; setDirection: (d: Direction, actif: boolean) => void }) {
  return <button type="button" aria-label={direction} className="flex h-11 w-11 select-none items-center justify-center rounded-xl border border-white/30 bg-graphite/80 text-lg font-bold text-white shadow-lg backdrop-blur active:scale-95 active:bg-terracotta" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection(direction, true); }} onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}>{symbole}</button>;
}

function JaugeBesoin({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  const niveau = Math.max(0, Math.min(100, valeur));
  return <div className="min-w-[88px] flex-1"><div className="mb-1 flex justify-between text-[10px] font-semibold text-white"><span>{label}</span><span>{Math.round(niveau)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full transition-all" style={{ width: `${niveau}%`, backgroundColor: couleur }} /></div></div>;
}

export function Quartier3D({ nomJoueur, besoins, demo = false }: { nomJoueur?: string; besoins?: BesoinsJoueur; demo?: boolean }) {
  const userId = useAuthStore((s) => s.user?.id);
  const directionsRef = useRef(new Set<Direction>());
  const destination = useRef<PointMonde | null>(null);
  const [, rafraichir] = useState(0);
  const [heure, setHeure] = useState(16);
  const [pause, setPause] = useState(false);
  const [selection, setSelection] = useState<Batiment3D | null>(null);
  const [interlocuteur, setInterlocuteur] = useState<string | null>(null);
  const [relations, setRelations] = useState<Record<string, number>>({});
  const parler = useCallback((nom: string) => { setInterlocuteur(nom); setSelection(null); directionsRef.current.clear(); destination.current = null; }, []);
  const [plan, setPlan] = useState(false);
  const [demoStats, setDemoStats] = useState(besoins ?? { energie: 78, moral: 82, faim: 64, social: 70 });
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<ModeJeuId>('libre');
  const [menuModes, setMenuModes] = useState(false);
  const [etapeMode, setEtapeMode] = useState(0);
  const [score, setScore] = useState(0);
  const [secondes, setSecondes] = useState<number | null>(null);
  const [positionInitiale, setPositionInitiale] = useState<PointMonde | undefined>();
  const [positionCourante, setPositionCourante] = useState<PointMonde>([0, 0]);
  const [etatSauvegarde, setEtatSauvegarde] = useState<'chargement' | 'sauvegarde' | 'sauvegarde-ok' | 'erreur'>(demo ? 'sauvegarde-ok' : 'chargement');
  const etatRef = useRef<EtatMonde | null>(null);
  const modifieRef = useRef(false);
  const pretRef = useRef(demo);
  const hydratationRef = useRef(false);
  const modeActif = MODES_JEU.find(m => m.id === mode)!;
  const quartierActuel = useMemo(() => [...QUARTIERS].sort((a, b) => Math.hypot(positionCourante[0] - a.x, positionCourante[1] - a.z) - Math.hypot(positionCourante[0] - b.x, positionCourante[1] - b.z))[0] ?? QUARTIERS[0], [positionCourante]);
  const choisir = useCallback((b: Batiment3D) => {
    setSelection(b); setPlan(false); directionsRef.current.clear(); destination.current = null;
    if (mode === 'libre' || secondes === 0) { setMessage(''); return; }
    const resultat = avancerMode(MODES_JEU.find(m => m.id === mode)!, etapeMode, b.slug);
    if (resultat.points) {
      setEtapeMode(resultat.etape); setScore(s => s + resultat.points);
      setMessage(resultat.termine ? `Mission accomplie ! +${resultat.points} points de session.` : `Objectif validé ! +${resultat.points} points.`);
    } else setMessage(`Ce lieu n'est pas l'objectif actuel. Consulte le panneau de mission.`);
  }, [mode, secondes, etapeMode]);
  const changerMode = useCallback((id: ModeJeuId) => {
    const nouveau = MODES_JEU.find(m => m.id === id)!;
    setMode(id); setEtapeMode(0); setScore(0); setSecondes(nouveau.duree); setMenuModes(false); setSelection(null); setMessage(id === 'libre' ? 'Exploration libre activée.' : `${nouveau.nom} lancé : suis les objectifs.`);
  }, []);
  const { data: joueurs = [] } = useQuery({ queryKey: ['carriere', 'joueurs-actifs'], queryFn: () => api.get<JoueurActif[]>('/carriere/joueurs-actifs'), staleTime: 45_000, refetchInterval: 45_000, enabled: !demo });
  const { data: etatMonde } = useQuery({
    queryKey: ['carriere', 'monde'],
    queryFn: () => api.get<EtatMonde>('/carriere/monde'),
    enabled: !demo,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const directions = useMemo(() => directionsRef.current, []);
  useEffect(() => {
    if (!etatMonde || demo || pretRef.current) return;
    const plusRecent = choisirEtatMondeRecent(etatMonde, chargerEtatMondeLocal(userId));
    if (!plusRecent) return;
    const etat = appliquerTempsEcoule(plusRecent);
    hydratationRef.current = true;
    setPositionInitiale([etat.position.x, etat.position.z]); setPositionCourante([etat.position.x, etat.position.z]);
    setRelations(etat.relations ?? {}); setMode(etat.mode); setEtapeMode(etat.etapeMode); setScore(etat.score); setSecondes(etat.secondes);
    setHeure(etat.heure); setPause(etat.pause);
    etatRef.current = etat;
    pretRef.current = true;
    if (etat !== etatMonde) modifieRef.current = true;
    setEtatSauvegarde('sauvegarde-ok');
  }, [etatMonde, demo, userId]);
  useEffect(() => {
    const quartier = [...QUARTIERS].sort((a, b) => Math.hypot(positionCourante[0] - a.x, positionCourante[1] - a.z) - Math.hypot(positionCourante[0] - b.x, positionCourante[1] - b.z))[0]?.nom ?? 'Les Palmiers';
    const etat: EtatMonde = { version: 3, position: { x: positionCourante[0], z: positionCourante[1] }, quartier, relations, mode, etapeMode, score, secondes, heure, pause, sauvegardeLe: new Date().toISOString() };
    etatRef.current = etat;
    if (pretRef.current && !demo) {
      sauvegarderEtatMondeLocal(userId, etat);
      if (hydratationRef.current) hydratationRef.current = false;
      else modifieRef.current = true;
    }
  }, [positionCourante, relations, mode, etapeMode, score, secondes, heure, pause, demo, userId]);
  useEffect(() => {
    if (demo) return;
    const sauvegarder = async () => {
      if (!pretRef.current || !modifieRef.current || !etatRef.current) return;
      modifieRef.current = false; setEtatSauvegarde('sauvegarde');
      try {
        const enregistre = await api.patch<EtatMonde>('/carriere/monde', { etat: etatRef.current });
        etatRef.current = enregistre;
        sauvegarderEtatMondeLocal(userId, enregistre);
        setEtatSauvegarde('sauvegarde-ok');
      }
      catch { modifieRef.current = true; setEtatSauvegarde('erreur'); }
    };
    const sauvegarderAvantSortie = () => {
      if (!pretRef.current || !modifieRef.current || !etatRef.current) return;
      sauvegarderEtatMondeLocal(userId, etatRef.current);
      void api.patchKeepalive('/carriere/monde', { etat: etatRef.current });
    };
    const surVisibilite = () => { if (document.visibilityState === 'hidden') sauvegarderAvantSortie(); };
    const timer = window.setInterval(sauvegarder, 2000);
    window.addEventListener('pagehide', sauvegarderAvantSortie);
    document.addEventListener('visibilitychange', surVisibilite);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', sauvegarderAvantSortie);
      document.removeEventListener('visibilitychange', surVisibilite);
      sauvegarderAvantSortie();
    };
  }, [demo, userId]);
  useEffect(() => {
    if (pause) return;
    const timer = window.setInterval(() => setHeure((h) => (h + 0.25) % 24), 15000);
    return () => window.clearInterval(timer);
  }, [pause]);
  useEffect(() => {
    if (pause || secondes === null || secondes <= 0 || etapeMode >= modeActif.etapes.length) return;
    const timer = window.setInterval(() => setSecondes(s => s === null ? null : Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pause, secondes, etapeMode, modeActif.etapes.length]);
  useEffect(() => {
    const changer = (code: string, actif: boolean) => { const direction = TOUCHES[code]; if (!direction) return; if (actif) directions.add(direction); else directions.delete(direction); };
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return; if (TOUCHES[e.code]) { e.preventDefault(); changer(e.code, true); } };
    const up = (e: KeyboardEvent) => changer(e.code, false);
    const clear = () => directions.clear();
    window.addEventListener('blur', clear);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', clear); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); document.body.style.cursor = 'default'; };
  }, [directions]);
  const setDirection = (d: Direction, actif: boolean) => { if (actif) directions.add(d); else directions.delete(d); rafraichir((v) => v + 1); };
  const minutes = Math.round((heure % 1) * 60);
  const affichageHeure = `${String(Math.floor(heure)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const stats = demo ? demoStats : besoins ?? { energie: 78, moral: 82, faim: 64, social: 70 };
  const libelleSauvegarde = demo ? 'Aperçu libre' : etatSauvegarde === 'chargement' ? 'Chargement de la partie…' : etatSauvegarde === 'sauvegarde' ? 'Sauvegarde…' : etatSauvegarde === 'erreur' ? 'Sauvegarde locale · serveur à reprendre' : '✓ Partie sauvegardée';
  return <div className="relative h-[86vh] min-h-[580px] w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl" data-testid="quartier-3d">
    <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [20, 22, 30], fov: 48, near: 0.1, far: 400 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}>
      <Scene nomJoueur={nomJoueur} joueurs={joueurs} directions={directions} destination={destination} heure={heure} pause={pause} selection={selection?.slug} objectif={modeActif.etapes[etapeMode]?.lieu} onSelect={b => { setInterlocuteur(null); choisir(b); }} interlocuteur={interlocuteur} onParler={parler} positionInitiale={positionInitiale} onPosition={setPositionCourante} />
    </Canvas>
    <div className="pointer-events-none absolute left-3 top-3 max-w-[200px] rounded-2xl border border-white/20 bg-[#182e32]/90 p-3 text-white shadow-xl backdrop-blur sm:max-w-[250px]">
      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#e2bf76]">BTP LIFE · EXPLORATION</span>
      <strong className="mt-1 block font-display text-2xl">Les Rives d’Abidjan</strong>
      <span className="mt-1 block text-xs text-white/60">{quartierActuel.nom} · Côte d’Ivoire</span>
      <div className="mt-3 border-t border-white/15 pt-3 text-[10px] leading-relaxed text-white/70">Sol : marcher · Bâtiment : interagir<br />Glisser : tourner · Molette : zoom<br />ZQSD / flèches : se déplacer</div>
    </div>
    <PanneauModesJeu ouvert={menuModes} mode={mode} etape={etapeMode} score={score} secondes={secondes} onToggle={() => setMenuModes(v => !v)} onMode={changerMode} />
    <div role="status" className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border px-3 py-1.5 text-[10px] font-bold shadow-lg backdrop-blur sm:hidden ${etatSauvegarde === 'erreur' ? 'border-amber-300/40 bg-amber-950/90 text-amber-100' : 'border-white/20 bg-[#182e32]/90 text-emerald-100'}`}>{libelleSauvegarde}</div>
    {interlocuteur && <DialoguePersonnage key={interlocuteur} nom={interlocuteur} affinite={relations[interlocuteur] ?? 0} onLien={() => setRelations(r => ({ ...r, [interlocuteur]: Math.min(100, (r[interlocuteur] ?? 0) + 1) }))} onLieu={slug => { setInterlocuteur(null); const lieu = BATIMENTS.find(b => b.slug === slug); if (lieu) { setSelection(lieu); setPlan(false); } }} onClose={() => { setInterlocuteur(null); directionsRef.current.clear(); destination.current = null; }} />}
    <button onClick={() => { setPlan(v => !v); setSelection(null); }} aria-expanded={plan} className="absolute right-3 top-16 rounded-xl border border-white/20 bg-[#182e32]/95 px-4 py-3 text-sm text-amber-100">Plan & lieux</button>
    {plan && <nav aria-label="Lieux du quartier" className="absolute right-3 top-32 z-10 max-h-[55%] w-72 max-w-[calc(100%_-_24px)] overflow-y-auto rounded-2xl border border-white/20 bg-[#182e32]/95 p-3 text-white shadow-xl">
      <h2 className="px-2 py-2 text-xs uppercase tracking-widest text-amber-200">5 quartiers · {BATIMENTS.length} lieux</h2>
      <div aria-label="Plan de la ville" className="relative my-2 h-44 rounded-xl border border-white/15 bg-[#56766d]">
        <span className="absolute left-2 top-1 text-[9px] text-white/70">N ↑</span>
        <div className="absolute bottom-0 h-3 w-full rounded-b-xl bg-cyan-700" />
        {QUARTIERS.map(q => <button key={q.nom} title={`Se déplacer vers ${q.nom}`} onClick={() => { destination.current = [q.x, q.z]; setPlan(false); setMessage(`Itinéraire vers ${q.nom}.`); }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-center text-[9px] ${q.nom === quartierActuel.nom ? 'bg-amber-300 font-bold text-slate-900' : 'bg-[#152b30]/90 hover:bg-emerald-700'}`} style={{ left: `${(q.x + 130) / 260 * 100}%`, top: `${(q.z + 130) / 190 * 100}%` }}>{q.nom}</button>)}
      </div>
      <p className="px-2 text-[10px] text-white/60">Cliquez un quartier sur la carte pour lancer l’itinéraire, ou choisissez directement un lieu.</p>
      {BATIMENTS.map((b, i) => <button key={b.slug} onClick={() => { setInterlocuteur(null); choisir(b); }} className="block w-full rounded-lg p-3 text-left text-sm hover:bg-white/10"><span className="mr-3 text-amber-200">{String(i + 1).padStart(2, '0')}</span>{b.nom}</button>)}
    </nav>}
    {selection && <InteractionLieu key={selection.slug} {...selection} demo={demo} onClose={() => setSelection(null)} onDemo={action => { const cible = action.besoin === 'repos' ? 'energie' : action.besoin === 'repas' ? 'faim' : 'social'; setDemoStats(s => ({ ...s, [cible]: 100, moral: Math.min(100, s.moral + (action.besoin === 'repos' ? 4 : action.besoin === 'repas' ? 3 : 6)) })); setMessage(`${action.label} : besoin restauré (démo, non sauvegardé).`); }} />}
    {message && <p role="status" className="absolute bottom-16 left-3 right-3 rounded-xl bg-emerald-950/95 p-3 text-center text-xs text-emerald-100">{message}</p>}
    <button type="button" onClick={() => setPause((v) => !v)} className="absolute right-3 top-3 rounded-xl border border-white/20 bg-graphite/85 px-3 py-2 text-sm font-bold text-white shadow backdrop-blur" aria-label={pause ? 'Reprendre le temps' : 'Mettre le temps en pause'}>{pause ? '▶' : 'Ⅱ'} {affichageHeure}</button>
    <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1 sm:hidden"><span /><BoutonDirection direction="avant" symbole="▲" setDirection={setDirection} /><span /><BoutonDirection direction="gauche" symbole="◀" setDirection={setDirection} /><BoutonDirection direction="arriere" symbole="▼" setDirection={setDirection} /><BoutonDirection direction="droite" symbole="▶" setDirection={setDirection} /></div>
    <div className="absolute bottom-3 left-3 right-3 hidden gap-3 rounded-xl border border-white/15 bg-graphite/85 p-3 shadow-xl backdrop-blur sm:flex">
      <JaugeBesoin label="Énergie" valeur={stats.energie} couleur="#60a5fa" /><JaugeBesoin label="Moral" valeur={stats.moral} couleur="#f4c430" /><JaugeBesoin label="Faim" valeur={stats.faim} couleur="#fb923c" /><JaugeBesoin label="Social" valeur={stats.social} couleur="#a78bfa" />
      <div className="border-l border-white/20 pl-3 text-right text-[10px] text-white/70"><strong className="block text-xs text-white">5 voisins</strong>{libelleSauvegarde}</div>
    </div>
  </div>;
}
