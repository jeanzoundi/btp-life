'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';

function Immeuble({ position, taille, couleur }: { position: [number, number, number]; taille: [number, number, number]; couleur: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow><boxGeometry args={taille} /><meshStandardMaterial color={couleur} roughness={0.72} /></mesh>
      <mesh position={[0, 0, taille[2] / 2 + 0.02]}><boxGeometry args={[taille[0] * 0.62, Math.max(0.55, taille[1] * 0.14), 0.06]} /><meshStandardMaterial color="#9ed8ee" emissive="#164e63" emissiveIntensity={0.12} /></mesh>
    </group>
  );
}

function ApercuVille() {
  return (
    <>
      <Sky sunPosition={[20, 20, 8]} />
      <ambientLight intensity={1.3} />
      <directionalLight castShadow position={[8, 15, 10]} intensity={2.2} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 24]} /><meshStandardMaterial color="#789564" /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[4, 24]} /><meshStandardMaterial color="#48494d" /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.03, 0]}><planeGeometry args={[4, 30]} /><meshStandardMaterial color="#48494d" /></mesh>
      <Immeuble position={[-6, 2, -5]} taille={[5, 4, 4]} couleur="#d9b382" />
      <Immeuble position={[6, 3.5, -5]} taille={[4, 7, 4]} couleur="#708090" />
      <Immeuble position={[-6, 1.5, 5]} taille={[5, 3, 4]} couleur="#b85b42" />
      <Immeuble position={[6, 1.8, 5]} taille={[5, 3.6, 4]} couleur="#d5c28d" />
      <mesh castShadow position={[0, 1.25, 1]}><capsuleGeometry args={[0.42, 1.15, 6, 12]} /><meshStandardMaterial color="#c1502e" /></mesh>
      <mesh castShadow position={[0, 2.5, 1]}><sphereGeometry args={[0.46, 18, 18]} /><meshStandardMaterial color="#8d5524" /></mesh>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6} minPolarAngle={0.8} maxPolarAngle={1.25} />
    </>
  );
}

export function MondeTeaser() {
  return (
    <div className="h-[320px] w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-sky-200 shadow-2xl" aria-label="Apercu 3D du quartier BTP Life">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [15, 12, 17], fov: 42 }}>
        <ApercuVille />
      </Canvas>
    </div>
  );
}
