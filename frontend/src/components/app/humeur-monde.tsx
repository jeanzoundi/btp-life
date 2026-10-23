'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import type { Humeur } from './besoins';
import type { Pensee } from '@/lib/pensees-monde';

const COULEURS_HUMEUR: Record<Humeur, string> = { bien: '#5fd13a', moyen: '#f2c230', mal: '#e5483f' };

/** Losange façon Sims au-dessus du joueur, coloré par son humeur et rendu lumineux par le halo. */
export function Plumbob3D({ humeur, hauteur = 2.85 }: { humeur: Humeur; hauteur?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.6;
    ref.current.position.y = hauteur + Math.sin(clock.elapsedTime * 2.2) * .06;
  });
  const couleur = COULEURS_HUMEUR[humeur];
  return <group ref={ref} position={[0, hauteur, 0]}>
    {/* Dessiné en dernier et sans test de profondeur : le joueur reste repérable derrière un toit. */}
    <mesh scale={[.19, .34, .19]} renderOrder={10} userData={{ sansOcclusion: true }}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={couleur} emissive={couleur} emissiveIntensity={1.35} roughness={.25} metalness={.1} flatShading transparent depthTest={false} />
    </mesh>
  </group>;
}

/** Montre une pensée 4,5 s par cycle. L'état ne change qu'aux transitions, pas à chaque image. */
export function usePenseePeriodique(calculer: (graine: number) => Pensee | null, actif: boolean, decalage = 0, periode = 18, condition?: () => boolean) {
  const [pensee, setPensee] = useState<Pensee | null>(null);
  const temps = useRef(-decalage), graine = useRef(0), visible = useRef(false);
  const calculerRef = useRef(calculer), conditionRef = useRef(condition);
  useEffect(() => { calculerRef.current = calculer; conditionRef.current = condition; });
  useFrame((_, delta) => {
    temps.current += Math.min(delta, .1);
    const cycle = ((temps.current % periode) + periode) % periode;
    const montrer = actif && temps.current >= 0 && cycle < 4.5 && (conditionRef.current?.() ?? true);
    if (montrer === visible.current) return;
    visible.current = montrer;
    if (montrer) graine.current++;
    setPensee(montrer ? calculerRef.current(graine.current) : null);
  });
  return pensee;
}

export function BullePensee({ pensee, hauteur = 3.45 }: { pensee: Pensee | null; hauteur?: number }) {
  if (!pensee) return null;
  return <Html position={[0, hauteur, 0]} center distanceFactor={14} zIndexRange={[5, 0]} pointerEvents="none">
    <div className="bulle-pensee pointer-events-none select-none" role="img" aria-label={`Pensée : ${pensee.texte}`}>
      <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-slate-800 shadow-lg">
        <span className="text-2xl leading-none">{pensee.icone}</span>
        <span className="text-xs font-semibold">{pensee.texte}</span>
      </div>
      <span className="ml-5 mt-1 block h-2.5 w-2.5 rounded-full border border-slate-200 bg-white/95 shadow" />
      <span className="ml-3 mt-0.5 block h-1.5 w-1.5 rounded-full border border-slate-200 bg-white/95" />
    </div>
  </Html>;
}
