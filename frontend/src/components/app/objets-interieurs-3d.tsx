'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActionObjet, ObjetInterieur } from '@/lib/objets-interieurs';

export interface UsageObjet { objet: ObjetInterieur; action: ActionObjet; phase: 'trajet' | 'action'; debut: number }

/** Ce qu'une scène intérieure reçoit pour rendre ses meubles utilisables. */
export interface InteractionsInterieur {
  objets: ObjetInterieur[]; selection: string | null; usage: UsageObjet | null;
  onChoisir: (id: string) => void; onAccesAtteint: () => void; onAnnule: () => void;
}

/** Volumes cliquables posés sur les meubles ; le sol s'éclaire sous le meuble survolé ou choisi. */
export function ZonesObjets({ objets, selection, usage, onChoisir }: Pick<InteractionsInterieur, 'objets' | 'selection' | 'usage' | 'onChoisir'>) {
  const [survol, setSurvol] = useState<string | null>(null);
  useEffect(() => () => { document.body.style.cursor = 'default'; }, []);
  return <>{objets.map(o => {
    const actif = survol === o.id || selection === o.id || usage?.objet.id === o.id;
    return <group key={o.id} position={[o.zone.x, 0, o.zone.z]}>
      <mesh position={[0, o.zone.hauteur / 2, 0]}
        onClick={e => { e.stopPropagation(); if (e.delta < 6) onChoisir(o.id); }}
        onPointerOver={e => { e.stopPropagation(); setSurvol(o.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setSurvol(s => s === o.id ? null : s); document.body.style.cursor = 'default'; }}>
        <boxGeometry args={[o.zone.largeur + .1, o.zone.hauteur, o.zone.profondeur + .1]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {actif && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 0]} renderOrder={2} userData={{ sansOcclusion: true }}>
        <planeGeometry args={[o.zone.largeur + .4, o.zone.profondeur + .4]} />
        <meshBasicMaterial color="#E8B04A" transparent opacity={selection === o.id ? .32 : .2} depthWrite={false} />
      </mesh>}
    </group>;
  })}</>;
}

/** Particules simples animées sur le processeur (quelques dizaines de points, aucun coût notable).
 * Taille en mètres avec atténuation : vue de la caméra des intérieurs (environ 17 m), une taille de 0,26 reste lisible sans masquer le personnage. */
function Particules({ nombre, couleur, taille, opacite, initialiser, avancer }: {
  nombre: number; couleur: string; taille: number; opacite: number;
  initialiser: (i: number) => [number, number, number]; avancer: (p: Float32Array, i: number, dt: number) => void;
}) {
  const geometrie = useMemo(() => {
    const positions = new Float32Array(nombre * 3);
    for (let i = 0; i < nombre; i++) positions.set(initialiser(i), i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [nombre, initialiser]);
  useEffect(() => () => geometrie.dispose(), [geometrie]);
  const points = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    const attribut = geometrie.getAttribute('position') as THREE.BufferAttribute;
    const dt = Math.min(delta, .05);
    for (let i = 0; i < nombre; i++) avancer(attribut.array as Float32Array, i, dt);
    attribut.needsUpdate = true;
  });
  return <points ref={points} geometry={geometrie} frustumCulled={false}><pointsMaterial color={couleur} size={taille} transparent opacity={opacite} depthWrite={false} sizeAttenuation /></points>;
}

/** Jet de douche : gouttes qui tombent du pommeau jusqu'au receveur. */
export function JetDouche({ p }: { p: [number, number, number] }) {
  const initialiser = useMemo(() => (i: number): [number, number, number] => [(Math.random() - .5) * .35, Math.random() * 1.9, (Math.random() - .5) * .35 + (i % 2 ? .02 : -.02)], []);
  const avancer = useMemo(() => (a: Float32Array, i: number, dt: number) => {
    a[i * 3 + 1] -= dt * 4.2;
    if (a[i * 3 + 1] < 0) { a[i * 3] = (Math.random() - .5) * .35; a[i * 3 + 1] = 1.9; a[i * 3 + 2] = (Math.random() - .5) * .35; }
  }, []);
  return <group position={p}><Particules nombre={120} couleur="#74b0e0" taille={.26} opacite={.85} initialiser={initialiser} avancer={avancer} /></group>;
}

/** Vapeur qui monte de la casserole pendant la cuisson. */
export function Vapeur({ p }: { p: [number, number, number] }) {
  const initialiser = useMemo(() => (): [number, number, number] => [(Math.random() - .5) * .2, Math.random() * .8, (Math.random() - .5) * .2], []);
  const avancer = useMemo(() => (a: Float32Array, i: number, dt: number) => {
    a[i * 3 + 1] += dt * .45; a[i * 3] += Math.sin(a[i * 3 + 1] * 6 + i) * dt * .06;
    if (a[i * 3 + 1] > .8) { a[i * 3] = (Math.random() - .5) * .2; a[i * 3 + 1] = 0; a[i * 3 + 2] = (Math.random() - .5) * .2; }
  }, []);
  return <group position={p}><Particules nombre={36} couleur="#f4f1ea" taille={.45} opacite={.4} initialiser={initialiser} avancer={avancer} /></group>;
}
