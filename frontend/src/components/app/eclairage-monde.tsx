'use client';

import { Sky, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ambianceMeteo, type Meteo } from '@/lib/meteo-monde';
import { RefletsMonde } from './reflets-monde';

/** Soleil continu et ombres centrées sur le joueur, sans ressource distante. La météo voile le ciel et rapproche le brouillard. */
export function EclairageMonde({ heure, meteo = 'soleil' }: { heure: number; meteo?: Meteo }) {
  const soleil = useRef<THREE.DirectionalLight>(null);
  const ambiante = useRef<THREE.HemisphereLight>(null);
  const eclair = useRef(0);
  const cible = useMemo(() => new THREE.Object3D(), []);
  const ambiance = ambianceMeteo(meteo);
  const angle = (heure - 6) / 24 * Math.PI * 2;
  const hauteur = Math.sin(angle);
  const jour = THREE.MathUtils.smoothstep(hauteur, -0.16, 0.3);
  const crepuscule = 1 - THREE.MathUtils.smoothstep(Math.abs(hauteur), 0.04, 0.4);
  const ciel = new THREE.Color('#111b35').lerp(new THREE.Color('#adcddd'), jour);
  ciel.lerp(new THREE.Color('#d0a18d'), crepuscule * 0.45);
  ciel.lerp(new THREE.Color(ambiance.teinte).multiplyScalar(.2 + .8 * jour), ambiance.melange);
  const couvert = ambiance.melange > .5;
  const intensiteAmbiante = 0.2 + jour * .65;
  useFrame(({ controls }, delta) => {
    if (ambiance.eclairs && Math.random() < Math.min(delta, .1) * .12) eclair.current = 1;
    eclair.current = Math.max(0, eclair.current - delta * 5);
    if (ambiante.current) ambiante.current.intensity = intensiteAmbiante + eclair.current * (Math.random() > .3 ? 3 : 1);
    const target = (controls as unknown as { target?: THREE.Vector3 })?.target;
    if (!soleil.current || !target) return;
    cible.position.copy(target);
    soleil.current.position.set(target.x + Math.cos(angle) * 70, target.y + Math.max(22, Math.abs(hauteur) * 100), target.z + 45);
    cible.updateMatrixWorld();
  });
  return <>
    <RefletsMonde/>
    <color attach="background" args={[ciel]} />
    <fog attach="fog" args={[ciel, ambiance.brouillardProche, ambiance.brouillardLoin]} />
    {jour > 0.05 && !couvert && <Sky sunPosition={[Math.cos(angle) * 100, hauteur * 100, 45]} turbidity={Math.max(ambiance.turbidite, 5 + crepuscule * 6)} rayleigh={1.5 + crepuscule * 2} mieCoefficient={0.005} mieDirectionalG={0.8} />}
    {jour < 0.5 && !couvert && <Stars radius={180} depth={70} count={1200} factor={3} saturation={0.15} fade speed={0.15} />}
    <hemisphereLight ref={ambiante} args={['#c5e0f1', '#75644f', intensiteAmbiante]} />
    <primitive object={cible} />
    <directionalLight ref={soleil} target={cible} castShadow color={jour < 0.1 ? '#aac5f5' : crepuscule > 0.3 ? '#ffbd7c' : meteo === 'harmattan' ? '#ffd9a8' : '#fff0d6'} intensity={0.35 + jour * 2.8 * ambiance.soleil} position={[70, 90, 45]} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-48} shadow-camera-right={48} shadow-camera-top={48} shadow-camera-bottom={-48} shadow-camera-near={1} shadow-camera-far={230} shadow-normalBias={0.06} shadow-bias={-0.00015} />
  </>;
}
