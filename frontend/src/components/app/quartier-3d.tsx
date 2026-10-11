'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Sky } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '@/lib/api';
import type { JoueurActif } from './autres-joueurs';

type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';

interface Batiment3D {
  slug: string;
  nom: string;
  href: string;
  position: [number, number, number];
  taille: [number, number, number];
  couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

const BATIMENTS: Batiment3D[] = [
  { slug: 'universite', nom: 'Universite BTP', href: '/app/academie', position: [-16, 2.5, -13], taille: [10, 5, 8], couleur: '#d8c092', type: 'campus' },
  { slug: 'entreprise', nom: 'Entreprise BTP', href: '/app/entreprise', position: [15, 5, -14], taille: [8, 10, 7], couleur: '#64748b', type: 'tour' },
  { slug: 'chantier', nom: 'Chantier', href: '/app/chantiers', position: [17, 1.3, 12], taille: [12, 2.6, 9], couleur: '#d97706', type: 'chantier' },
  { slug: 'residence', nom: 'Ma residence', href: '/app/lieu/residence', position: [-17, 2, 13], taille: [8, 4, 7], couleur: '#b45309', type: 'maison' },
  { slug: 'maquis', nom: 'Le Maquis', href: '/app/lieu/maquis', position: [-5, 1.6, 17], taille: [6, 3.2, 5], couleur: '#be563c', type: 'commerce' },
  { slug: 'cafe', nom: 'Cafe social', href: '/app/lieu/cafe', position: [5, 1.6, -20], taille: [6, 3.2, 5], couleur: '#6b7a3f', type: 'commerce' },
  { slug: 'banque', nom: 'Banque BTL', href: '/app/lieu/banque', position: [-24, 2.5, -1], taille: [7, 5, 6], couleur: '#d6bd75', type: 'campus' },
  { slug: 'fournisseur', nom: 'Fournisseur', href: '/app/fournisseur', position: [25, 2, -1], taille: [8, 4, 7], couleur: '#a89170', type: 'commerce' },
];

const TOUCHES: Record<string, Direction | undefined> = {
  KeyW: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere',
  KeyA: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite',
};

function Fenetres({ taille }: { taille: [number, number, number] }) {
  const rangees = Math.max(1, Math.floor(taille[1] / 2));
  return (
    <group position={[0, 0, taille[2] / 2 + 0.01]}>
      {Array.from({ length: rangees }).map((_, i) => (
        <mesh key={i} position={[0, -taille[1] / 2 + 1.2 + i * 1.8, 0]}>
          <boxGeometry args={[taille[0] * 0.65, 0.7, 0.05]} />
          <meshStandardMaterial color="#9dd9ef" emissive="#164e63" emissiveIntensity={0.15} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Batiment({ batiment }: { batiment: Batiment3D }) {
  const router = useRouter();
  const [survole, setSurvole] = useState(false);
  const { position, taille } = batiment;
  return (
    <group position={position}>
      <mesh
        castShadow receiveShadow
        scale={survole ? 1.025 : 1}
        onPointerEnter={(e) => { e.stopPropagation(); setSurvole(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setSurvole(false); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); router.push(batiment.href); }}
      >
        <boxGeometry args={taille} />
        <meshStandardMaterial color={survole ? '#e6b566' : batiment.couleur} roughness={0.72} />
      </mesh>
      <Fenetres taille={taille} />
      {batiment.type === 'chantier' && (
        <group position={[0, taille[1] / 2 + 1.8, 0]}>
          <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[0.35, 4, 0.35]} /><meshStandardMaterial color="#f4b400" /></mesh>
          <mesh castShadow position={[2.7, 1.7, 0]}><boxGeometry args={[5.5, 0.28, 0.28]} /><meshStandardMaterial color="#f4b400" /></mesh>
        </group>
      )}
      <Html center position={[0, taille[1] / 2 + 0.8, 0]} distanceFactor={13} occlude>
        <div className="whitespace-nowrap rounded-full border border-white/50 bg-graphite/90 px-3 py-1 text-xs font-bold text-white shadow-lg">
          {batiment.nom}
        </div>
      </Html>
    </group>
  );
}

function Personnage({ nom, couleur = '#c1502e', position = [0, 0, 0] }: { nom?: string; couleur?: string; position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.15, 0]}><capsuleGeometry args={[0.38, 1.05, 6, 12]} /><meshStandardMaterial color={couleur} /></mesh>
      <mesh castShadow position={[0, 2.22, 0]}><sphereGeometry args={[0.42, 18, 18]} /><meshStandardMaterial color="#8d5524" /></mesh>
      <mesh castShadow position={[0, 2.95, 0]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.28]} /><meshStandardMaterial color="#7dbb3b" emissive="#315c16" emissiveIntensity={0.25} /></mesh>
      {nom && <Html center position={[0, 3.5, 0]} distanceFactor={12}><span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-graphite shadow">{nom}</span></Html>}
    </group>
  );
}

function Joueur({ nom, directions }: { nom?: string; directions: Set<Direction> }) {
  const ref = useRef<THREE.Group>(null);
  const vitesse = 7;
  const camera = useThree((s) => s.camera);
  const positionCamera = useRef(new THREE.Vector3(0, 6.5, 9));

  useFrame((_, delta) => {
    if (!ref.current) return;
    const mouvement = new THREE.Vector3(
      Number(directions.has('droite')) - Number(directions.has('gauche')),
      0,
      Number(directions.has('arriere')) - Number(directions.has('avant')),
    );
    if (mouvement.lengthSq() > 0) {
      mouvement.normalize().multiplyScalar(vitesse * Math.min(delta, 0.05));
      ref.current.position.add(mouvement);
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, -31, 31);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, -27, 27);
      ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z);
    }
    positionCamera.current.set(ref.current.position.x, 6.5, ref.current.position.z + 9);
    camera.position.lerp(positionCamera.current, 1 - Math.pow(0.002, delta));
    camera.lookAt(ref.current.position.x, 1.35, ref.current.position.z);
  });

  return <group ref={ref}><Personnage nom={nom} /></group>;
}

function SolEtRoutes() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[72, 64]} /><meshStandardMaterial color="#7f9b65" roughness={1} /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><planeGeometry args={[9, 64]} /><meshStandardMaterial color="#45464a" roughness={0.95} /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.035, 0]}><planeGeometry args={[9, 72]} /><meshStandardMaterial color="#45464a" roughness={0.95} /></mesh>
      {[-2, 2].map((x) => <mesh key={`v${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.045, 0]}><planeGeometry args={[0.12, 64]} /><meshBasicMaterial color="#f7d154" /></mesh>)}
      {[-2, 2].map((z) => <mesh key={`h${z}`} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.055, z]}><planeGeometry args={[0.12, 72]} /><meshBasicMaterial color="#f7d154" /></mesh>)}
      {Array.from({ length: 20 }).map((_, i) => (
        <group key={i} position={[-32 + (i % 10) * 7, 0, i < 10 ? -29 : 29]}>
          <mesh castShadow position={[0, 1.4, 0]}><cylinderGeometry args={[0.16, 0.22, 2.8, 8]} /><meshStandardMaterial color="#60452d" /></mesh>
          <mesh castShadow position={[0, 3, 0]}><sphereGeometry args={[1.15, 10, 10]} /><meshStandardMaterial color="#3f713e" /></mesh>
        </group>
      ))}
    </group>
  );
}

function Scene({ nomJoueur, joueurs, directions }: { nomJoueur?: string; joueurs: JoueurActif[]; directions: Set<Direction> }) {
  const heure = new Date().getHours();
  const nuit = heure >= 19 || heure < 6;
  const positions: [number, number, number][] = [[-4, 0, -5], [7, 0, 6], [11, 0, -5], [-8, 0, 7], [2, 0, 12], [-11, 0, -10], [20, 0, 2]];
  return (
    <>
      <color attach="background" args={[nuit ? '#11182d' : '#9fd7ef']} />
      {!nuit && <Sky sunPosition={[60, 30, 20]} turbidity={8} rayleigh={2} />}
      <ambientLight intensity={nuit ? 0.45 : 1.25} />
      <directionalLight castShadow position={[18, 28, 12]} intensity={nuit ? 0.45 : 2.2} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <fog attach="fog" args={[nuit ? '#11182d' : '#b9d9df', 38, 78]} />
      <SolEtRoutes />
      {BATIMENTS.map((b) => <Batiment key={b.slug} batiment={b} />)}
      <Joueur nom={nomJoueur} directions={directions} />
      {joueurs.slice(0, positions.length).map((j, i) => <Personnage key={j.userId} nom={j.nom} couleur={i % 2 ? '#4f76a1' : '#d99b45'} position={positions[i]} />)}
      {!nuit && <Suspense fallback={null}><Environment preset="city" environmentIntensity={0.25} /></Suspense>}
    </>
  );
}

function BoutonDirection({ direction, symbole, setDirection }: { direction: Direction; symbole: string; setDirection: (d: Direction, actif: boolean) => void }) {
  return <button type="button" aria-label={direction} className="flex h-11 w-11 select-none items-center justify-center rounded-xl border border-white/30 bg-graphite/80 text-lg font-bold text-white shadow-lg backdrop-blur active:scale-95 active:bg-terracotta" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection(direction, true); }} onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}>{symbole}</button>;
}

export function Quartier3D({ nomJoueur }: { nomJoueur?: string }) {
  const directionsRef = useRef(new Set<Direction>());
  const [, rafraichir] = useState(0);
  const { data: joueurs = [] } = useQuery({ queryKey: ['carriere', 'joueurs-actifs'], queryFn: () => api.get<JoueurActif[]>('/carriere/joueurs-actifs'), staleTime: 45_000, refetchInterval: 45_000 });
  const directions = useMemo(() => directionsRef.current, []);

  useEffect(() => {
    const changer = (code: string, actif: boolean) => {
      const direction = TOUCHES[code];
      if (!direction) return;
      if (actif) directions.add(direction); else directions.delete(direction);
    };
    const down = (e: KeyboardEvent) => { if (TOUCHES[e.code]) { e.preventDefault(); changer(e.code, true); } };
    const up = (e: KeyboardEvent) => changer(e.code, false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); document.body.style.cursor = 'default'; };
  }, [directions]);

  const setDirection = (d: Direction, actif: boolean) => { if (actif) directions.add(d); else directions.delete(d); rafraichir((v) => v + 1); };

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl" data-testid="quartier-3d">
      <Canvas shadows dpr={[1, 1.6]} camera={{ position: [0, 6.5, 9], fov: 58, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Scene nomJoueur={nomJoueur} joueurs={joueurs} directions={directions} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-graphite/80 px-3 py-2 text-xs text-white shadow backdrop-blur">
        <strong className="block text-sm">Quartier Abidjan Foundation</strong>
        Deplace-toi avec ZQSD, WASD ou les commandes tactiles. Clique un batiment pour entrer.
      </div>
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1 sm:hidden">
        <span /><BoutonDirection direction="avant" symbole="▲" setDirection={setDirection} /><span />
        <BoutonDirection direction="gauche" symbole="◀" setDirection={setDirection} /><BoutonDirection direction="arriere" symbole="▼" setDirection={setDirection} /><BoutonDirection direction="droite" symbole="▶" setDirection={setDirection} />
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-olive/90 px-3 py-1.5 text-xs font-bold text-white shadow">● Monde connecte · {joueurs.length + 1} personnage{joueurs.length ? 's' : ''}</div>
    </div>
  );
}
