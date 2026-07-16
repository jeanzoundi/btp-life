'use client';

// Personnage 3D low-poly maison — aucune dépendance à un service tiers (Ready Player Me a fermé
// son avatar creator public le 31/01/2026). Construit à partir de primitives three.js, piloté par
// la même AvatarConfig que l'avatar SVG (avatar-btp.tsx) : mêmes catégories, mêmes couleurs, même
// système de dressing/déblocage — uniquement une nouvelle couche de rendu.
//
// Simplifications assumées pour cette première passe (voir le plan) : les 4 expressions de visage
// (sourire/grand-sourire/neutre/determine) ne sont pas encore modélisées en 3D — seul un visage
// neutre avec des yeux est rendu, quelle que soit `expression`. Seule l'animation "repos" (idle)
// est câblée ; marche/lecture-plan/tablette/célébration restent à faire dans une passe suivante.

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import { configDepuis, type AnimationAvatar, type AvatarConfig } from './avatar-btp';

function Personnage({ config }: { config: AvatarConfig }) {
  const racine = useRef<Group>(null);
  const dephasage = useMemo(() => Math.random() * 10, []);

  useFrame((state) => {
    if (!racine.current) return;
    const t = state.clock.getElapsedTime() + dephasage;
    // Idle : respiration verticale légère + léger balancement — commun à toute animation tant que
    // les 4 animations dédiées ne sont pas encore modélisées en 3D.
    racine.current.position.y = -0.98 + Math.sin(t * 1.1) * 0.02;
    racine.current.rotation.y = Math.sin(t * 0.35) * 0.1;
  });

  const casqueVisible = config.casqueStyle !== 'aucun';
  const couleurCasque = config.casqueStyle === 'aucun' ? config.couleurCheveux : config.casque;

  return (
    <group ref={racine} position={[0, -0.98, 0]}>
      {/* Jambes */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
        <meshStandardMaterial color="#2B2B2E" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
        <meshStandardMaterial color="#2B2B2E" roughness={0.8} />
      </mesh>

      {/* Chaussures */}
      <mesh position={[-0.15, 0.16, 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.24]} />
        <meshStandardMaterial color="#1A1A1C" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.16, 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.24]} />
        <meshStandardMaterial color="#1A1A1C" roughness={0.9} />
      </mesh>

      {/* Torse */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.48, 4, 8]} />
        <meshStandardMaterial color={config.couleurTenue} roughness={0.7} />
      </mesh>

      {/* Détail gilet : bandes réfléchissantes si typeTenue === 'gilet' */}
      {config.typeTenue === 'gilet' && (
        <>
          <mesh position={[0, 1.32, 0.24]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.32, 0.05, 0.02]} />
            <meshStandardMaterial color="#D9B382" emissive="#D9B382" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 1.02, 0.24]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.32, 0.05, 0.02]} />
            <meshStandardMaterial color="#D9B382" emissive="#D9B382" emissiveIntensity={0.15} />
          </mesh>
        </>
      )}

      {/* Écusson de poitrine */}
      {config.ecusson !== 'aucun' && (
        <mesh position={[0.12, 1.28, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.015, 12]} />
          <meshStandardMaterial color="#B87333" metalness={0.4} roughness={0.4} />
        </mesh>
      )}

      {/* Bras */}
      <mesh position={[-0.4, 1.18, 0]} rotation={[0, 0, 0.18]} castShadow>
        <capsuleGeometry args={[0.085, 0.46, 4, 8]} />
        <meshStandardMaterial color={config.peau} roughness={0.6} />
      </mesh>
      <mesh position={[0.4, 1.18, 0]} rotation={[0, 0, -0.18]} castShadow>
        <capsuleGeometry args={[0.085, 0.46, 4, 8]} />
        <meshStandardMaterial color={config.peau} roughness={0.6} />
      </mesh>

      {/* Outil tenu en main (droite) */}
      {config.outil !== 'aucun' && (
        <group position={[0.52, 0.94, 0.08]} rotation={[0.3, 0, -0.2]}>
          {(config.outil === 'tablette' || config.outil === 'plan') && (
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.16, 0.02]} />
              <meshStandardMaterial color={config.outil === 'tablette' ? '#2B2B2E' : '#F5F0E6'} roughness={0.5} />
            </mesh>
          )}
          {(config.outil === 'marteau' || config.outil === 'cle') && (
            <mesh castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
              <meshStandardMaterial color="#4A342A" roughness={0.8} />
            </mesh>
          )}
          {config.outil === 'metre' && (
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.1, 0.05]} />
              <meshStandardMaterial color="#C1502E" roughness={0.6} />
            </mesh>
          )}
        </group>
      )}

      {/* Tête */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.25, 20, 20]} />
        <meshStandardMaterial color={config.peau} roughness={0.55} />
      </mesh>

      {/* Yeux */}
      <mesh position={[-0.09, 1.74, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={config.yeux} />
      </mesh>
      <mesh position={[0.09, 1.74, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={config.yeux} />
      </mesh>

      {/* Lunettes */}
      {config.lunettes !== 'aucune' && (
        <mesh position={[0, 1.74, 0.235]}>
          <boxGeometry args={[0.24, 0.05, 0.015]} />
          <meshStandardMaterial
            color={config.lunettes === 'soleil' ? '#2B2B2E' : '#8A8680'}
            transparent
            opacity={config.lunettes === 'soleil' ? 0.85 : 0.35}
            metalness={0.3}
          />
        </mesh>
      )}

      {/* Pilosité faciale */}
      {config.pilosite !== 'aucune' && (
        <mesh position={[0, 1.6, 0.2]}>
          <boxGeometry args={[config.pilosite === 'barbe' ? 0.2 : 0.14, config.pilosite === 'barbe' ? 0.12 : 0.03, 0.05]} />
          <meshStandardMaterial color={config.couleurCheveux} roughness={0.9} />
        </mesh>
      )}

      {/* Cheveux (visibles seulement sans casque) */}
      {!casqueVisible && config.cheveux !== 'chauve' && (
        <mesh position={[0, 1.84, -0.02]}>
          <sphereGeometry args={[0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <meshStandardMaterial color={config.couleurCheveux} roughness={0.95} />
        </mesh>
      )}

      {/* Casque */}
      {casqueVisible && (
        <>
          <mesh position={[0, 1.9, 0]} castShadow>
            <sphereGeometry args={[0.28, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
            <meshStandardMaterial color={couleurCasque} roughness={0.35} metalness={0.1} />
          </mesh>
          {config.casqueStyle === 'visiere' && (
            <mesh position={[0, 1.76, 0.24]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.26, 0.04, 0.02]} />
              <meshStandardMaterial color="#2B2B2E" metalness={0.4} roughness={0.3} />
            </mesh>
          )}
        </>
      )}

      {/* Cadre de prestige (socle) */}
      {config.cadre !== 'aucun' && (
        <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.48, 32]} />
          <meshStandardMaterial
            color={config.cadre === 'or' ? '#C9A227' : config.cadre === 'argent' ? '#8A8680' : '#B87333'}
            emissive={config.cadre === 'or' ? '#C9A227' : config.cadre === 'argent' ? '#8A8680' : '#B87333'}
            emissiveIntensity={0.4}
            side={2}
          />
        </mesh>
      )}
    </group>
  );
}

export function Avatar3DCanvas({
  config,
  taille = 96,
  className = '',
  // Accepté pour rester compatible avec l'API d'AvatarBtp — seule l'animation "repos" (idle,
  // câblée directement dans useFrame ci-dessus) existe en 3D pour l'instant ; les 4 autres
  // animations dédiées restent à modéliser dans une passe suivante.
  animation: _animation,
}: {
  config?: unknown;
  taille?: number;
  className?: string;
  animation?: AnimationAvatar;
}) {
  const c = useMemo(() => configDepuis(config), [config]);

  return (
    <div style={{ width: taille, height: taille }} className={`overflow-hidden rounded-2xl ${className}`}>
      <Canvas shadows camera={{ position: [0, 1.35, 3.1], fov: 30 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={[c.fond]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} castShadow />
        <directionalLight position={[-2, 2, -2]} intensity={0.3} />
        <Suspense fallback={null}>
          <Personnage config={c} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={2.2}
          maxDistance={4.2}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.9}
          target={[0, 1.2, 0]}
        />
      </Canvas>
    </div>
  );
}
