'use client';

import { Sky, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Soleil continu et ombres centrées sur le joueur, sans ressource distante. */
export function EclairageMonde({ heure }: { heure: number }) {
  const soleil = useRef<THREE.DirectionalLight>(null);
  const cible = useMemo(() => new THREE.Object3D(), []);
  const angle = (heure - 6) / 24 * Math.PI * 2;
  const hauteur = Math.sin(angle);
  const jour = THREE.MathUtils.smoothstep(hauteur, -0.16, 0.3);
  const crepuscule = 1 - THREE.MathUtils.smoothstep(Math.abs(hauteur), 0.04, 0.4);
  const ciel = new THREE.Color('#111b35').lerp(new THREE.Color('#adcddd'), jour);
  ciel.lerp(new THREE.Color('#d0a18d'), crepuscule * 0.45);
  useFrame(({ controls }) => {
    const target = (controls as unknown as { target?: THREE.Vector3 })?.target;
    if (!soleil.current || !target) return;
    cible.position.copy(target);
    soleil.current.position.set(target.x + Math.cos(angle) * 70, target.y + Math.max(22, Math.abs(hauteur) * 100), target.z + 45);
    cible.updateMatrixWorld();
  });
  return <>
    <color attach="background" args={[ciel]} />
    <fog attach="fog" args={[ciel, 90, 280]} />
    {jour > 0.05 && <Sky sunPosition={[Math.cos(angle) * 100, hauteur * 100, 45]} turbidity={5 + crepuscule * 6} rayleigh={1.5 + crepuscule * 2} mieCoefficient={0.005} mieDirectionalG={0.8} />}
    {jour < 0.5 && <Stars radius={180} depth={70} count={1200} factor={3} saturation={0.15} fade speed={0.15} />}
    <hemisphereLight args={['#c5e0f1', '#75644f', 0.3 + jour * 1.05]} />
    <primitive object={cible} />
    <directionalLight ref={soleil} target={cible} castShadow color={jour < 0.1 ? '#aac5f5' : crepuscule > 0.3 ? '#ffbd7c' : '#fff0d6'} intensity={0.35 + jour * 2.8} position={[70, 90, 45]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-48} shadow-camera-right={48} shadow-camera-top={48} shadow-camera-bottom={-48} shadow-camera-near={1} shadow-camera-far={230} shadow-normalBias={0.06} shadow-bias={-0.00015} />
  </>;
}
