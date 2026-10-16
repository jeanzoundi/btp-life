'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const THEMES: Record<string, { sol: string; mur: string; accent: string; objets: 'bureau' | 'chantier' | 'detente' | 'commerce' }> = {
  universite: { sol: '#c9bda7', mur: '#e7dcc8', accent: '#315f68', objets: 'bureau' },
  entreprise: { sol: '#9aa4a4', mur: '#d9dfdc', accent: '#31505c', objets: 'bureau' },
  'bureau-etudes': { sol: '#b9b6ad', mur: '#e8e4d9', accent: '#486b78', objets: 'bureau' },
  chantier: { sol: '#a99e88', mur: '#c9c2b2', accent: '#e5ad32', objets: 'chantier' },
  'construction-nord': { sol: '#a99e88', mur: '#c9c2b2', accent: '#e5ad32', objets: 'chantier' },
  residence: { sol: '#b79875', mur: '#eadcc9', accent: '#77906a', objets: 'detente' },
  'jardins-residence': { sol: '#b79875', mur: '#eadcc9', accent: '#77906a', objets: 'detente' },
  maquis: { sol: '#b27a55', mur: '#efd5b5', accent: '#c8563f', objets: 'detente' },
  cafe: { sol: '#8e745d', mur: '#e7d4be', accent: '#73864e', objets: 'detente' },
};

function Boite({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={0.72} /></mesh>;
}

export function InterieurLieu3D({ slug, nom }: { slug: string; nom: string }) {
  const theme = THEMES[slug] ?? { sol: '#b5aa98', mur: '#e5ddcf', accent: '#496c6b', objets: 'commerce' as const };
  return <div className="relative mt-3 h-52 overflow-hidden rounded-xl border border-white/15 bg-slate-900" aria-label={`Intérieur 3D : ${nom}`}>
    <Canvas shadows dpr={[1, 1.35]} camera={{ position: [8, 6, 9], fov: 48 }}>
      <color attach="background" args={['#23383d']} />
      <ambientLight intensity={1.25} />
      <directionalLight castShadow intensity={2.2} position={[4, 9, 5]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <group>
        <Boite p={[0, -0.2, 0]} s={[12, 0.4, 9]} c={theme.sol} />
        <Boite p={[0, 2.8, -4.3]} s={[12, 6, 0.3]} c={theme.mur} />
        <Boite p={[-5.8, 2.8, 0]} s={[0.3, 6, 9]} c={theme.mur} />
        {[-3, 0, 3].map(x => <group key={x} position={[x, 0, 0]}>
          {theme.objets === 'bureau' && <><Boite p={[0, 1, -1]} s={[2.4, 0.18, 1.2]} c={theme.accent} /><Boite p={[0, 1.7, -1.35]} s={[1.35, 1.05, 0.1]} c="#243f49" /><Boite p={[0, 0.55, 0.2]} s={[1.2, 1.1, 1]} c="#8b6b4b" /></>}
          {theme.objets === 'chantier' && <><Boite p={[0, 0.6, -0.8]} s={[1.5, 1.2, 1.5]} c="#b96d43" /><mesh position={[0, 1.75, -0.8]} castShadow><cylinderGeometry args={[0.65, 0.65, 0.15, 18]} /><meshStandardMaterial color={theme.accent} /></mesh><Boite p={[0, 1.3, 0.8]} s={[1.8, 0.12, 1]} c="#d8c38e" /></>}
          {theme.objets === 'detente' && <><Boite p={[0, 0.55, -0.8]} s={[2.6, 1.1, 1.3]} c={theme.accent} /><Boite p={[0, 0.95, -1.35]} s={[2.6, 1.2, 0.25]} c={theme.accent} /><mesh position={[0, 1.05, 1]} castShadow><cylinderGeometry args={[0.75, 0.75, 0.16, 20]} /><meshStandardMaterial color="#d3b37c" /></mesh></>}
          {theme.objets === 'commerce' && <><Boite p={[0, 1.3, -1]} s={[2.2, 2.6, 0.6]} c={theme.accent} /><Boite p={[0, 0.8, 1]} s={[2, 1.6, 1.1]} c="#b78d59" /></>}
        </group>)}
        <Text position={[0, 4.8, -4.05]} fontSize={0.65} color="#22373b" anchorX="center">{nom}</Text>
      </group>
      <OrbitControls enablePan={false} minDistance={7} maxDistance={15} minPolarAngle={0.65} maxPolarAngle={1.35} target={[0, 1.2, 0]} />
    </Canvas>
    <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2 py-1 text-[9px] text-white/70">Glisse pour regarder · molette pour zoomer</span>
  </div>;
}
