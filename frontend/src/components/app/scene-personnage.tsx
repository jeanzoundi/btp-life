'use client';

import { useLayoutEffect, useRef, type PointerEvent as EvenementPointeur } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PERSONNAGES, type IdPersonnage } from '@/lib/personnages-joueur';
import { echelleGabarit, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { HumainMonde } from './humain-monde';

// Le personnage réaliste sur son plateau tournant, éclairé comme dans une cabine d'essayage : au créateur de
// l'inscription comme au choix du personnage dans le monde. On le fait tourner du doigt ou à la souris ; lâché,
// il reprend doucement sa rotation.

interface Rotation { angle: number; glisse: number | null; reprise: number }

/** Cadrage en pied, recalé à chaque changement de taille : le personnage occupe toute la hauteur du plateau. */
function CameraPlateau() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const vue = camera as THREE.PerspectiveCamera;
    vue.fov = 32; vue.position.set(0, 1.15, 3.7); vue.lookAt(0, .93, 0); vue.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function Plateau({ id, gabarit, couleurCasque, rotation }: { id: IdPersonnage; gabarit: GabaritPersonnage; couleurCasque?: string; rotation: { current: Rotation } }) {
  const groupe = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const r = rotation.current;
    if (r.glisse === null && performance.now() > r.reprise) r.angle += Math.min(delta, .05) * .45;
    if (groupe.current) groupe.current.rotation.y = r.angle;
  });
  const p = PERSONNAGES.find(x => x.id === id)!;
  const design = couleurCasque && p.casque ? { ...p.design, casque: couleurCasque } : p.design;
  return <>
    <CameraPlateau />
    <hemisphereLight args={['#fff4e2', '#3a2e24', 1.15]} />
    <directionalLight position={[2.5, 4, 3]} intensity={2.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-3, 2, -2]} intensity={.8} color="#9fd0e0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.1, 48]} /><meshStandardMaterial color="#2a3b3d" roughness={.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .005, 0]}><ringGeometry args={[1.04, 1.12, 64]} /><meshBasicMaterial color="#e8bd72" /></mesh>
    <group ref={groupe} scale={echelleGabarit(gabarit)}>
      <HumainMonde key={id} modele={p.modele} design={design} casque={p.casque} teinteCasque={p.casque ? couleurCasque : undefined} />
    </group>
  </>;
}

export function ScenePersonnage({ id, gabarit, couleurCasque, className = '' }: {
  id: IdPersonnage; gabarit: GabaritPersonnage; couleurCasque?: string; className?: string;
}) {
  const rotation = useRef<Rotation>({ angle: -.5, glisse: null, reprise: 0 });
  const saisir = (e: EvenementPointeur<HTMLDivElement>) => { rotation.current.glisse = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); };
  const tourner = (e: EvenementPointeur<HTMLDivElement>) => {
    const r = rotation.current;
    if (r.glisse === null) return;
    r.angle += (e.clientX - r.glisse) * .012; r.glisse = e.clientX;
  };
  const lacher = () => { rotation.current.glisse = null; rotation.current.reprise = performance.now() + 2500; };
  return <div className={`cursor-grab touch-pan-y active:cursor-grabbing ${className}`} onPointerDown={saisir} onPointerMove={tourner} onPointerUp={lacher} onPointerCancel={lacher}
    aria-label="Personnage en 3D : glisse pour le faire tourner" role="img">
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.3, 3.5], fov: 34, near: .1, far: 50 }} onCreated={({ camera }) => camera.lookAt(0, .92, 0)} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <Plateau id={id} gabarit={gabarit} couleurCasque={couleurCasque} rotation={rotation} />
    </Canvas>
  </div>;
}
