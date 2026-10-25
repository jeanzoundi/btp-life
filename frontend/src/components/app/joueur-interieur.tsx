'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { V3 } from '@/lib/architecture-ville';
import type { Assise, Point } from '@/lib/navigation-plan';
import { HumainJoueur } from './personnage-joueur';

// Joueur des intérieurs « à programme » (chantier, laboratoire, dépôt, mairie) : clavier relatif à la caméra,
// trajet calculé vers un point ou un poste, caméra de trois quarts qui suit.

export type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
const TOUCHES: Record<string, Direction | undefined> = { KeyW: 'avant', KeyZ: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere', KeyA: 'gauche', KeyQ: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite' };

export interface CameraSuivi { azimut: number; inclinaison: number; recul: number }
export const decalageCamera = ({ azimut, inclinaison, recul }: CameraSuivi): V3 => [recul * Math.cos(inclinaison) * Math.sin(azimut), recul * Math.sin(inclinaison), recul * Math.cos(inclinaison) * Math.cos(azimut)];

/** Clavier : ZQSD / flèches pour marcher, Échap ferme d'abord un panneau, puis fait sortir. */
export function useCommandesInterieur(directions: Set<Direction>, rappels: MutableRefObject<{ onEchap: () => boolean; onSortir: () => void }>) {
  useEffect(() => {
    const changer = (event: KeyboardEvent, actif: boolean) => { const d = TOUCHES[event.code]; if (!d) return; event.preventDefault(); if (actif) directions.add(d); else directions.delete(d); };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return;
      if (e.code === 'Escape') { if (!rappels.current.onEchap()) rappels.current.onSortir(); } else changer(e, true);
    };
    const up = (e: KeyboardEvent) => changer(e, false);
    const vider = () => directions.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', vider);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', vider); directions.clear(); };
  }, [directions, rappels]);
}

export function BoutonDirection({ d, symbole, directions }: { d: Direction; symbole: string; directions: Set<Direction> }) {
  return <button aria-label={d} className="hud-verre hud-bouton h-11 w-11 rounded-xl text-lg" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); directions.add(d); }} onPointerUp={() => directions.delete(d)} onPointerCancel={() => directions.delete(d)}>{symbole}</button>;
}

export function CroixDirections({ directions }: { directions: Set<Direction> }) {
  return <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-1.5 sm:hidden"><span /><BoutonDirection d="avant" symbole="▲" directions={directions} /><span /><BoutonDirection d="gauche" symbole="◀" directions={directions} /><BoutonDirection d="arriere" symbole="▼" directions={directions} /><BoutonDirection d="droite" symbole="▶" directions={directions} /></div>;
}

/** Le joueur : clavier relatif à la caméra, ou trajet calculé ; à la fin du trajet vers un poste visé, on prévient. */
export function JoueurInterieur<S extends string>({ directions, position, route, visee, onArrivee, avancer, depart, camera, casque = true, assise = null }: {
  directions: Set<Direction>; position: MutableRefObject<Point>; route: MutableRefObject<Point[]>; visee: MutableRefObject<S | null>;
  onArrivee: (s: S) => void; avancer: (p: Point, dx: number, dz: number, delta: number) => Point; depart: Point; camera: CameraSuivi;
  casque?: boolean; assise?: Assise | null;
}) {
  const groupe = useRef<THREE.Group>(null), marcheRef = useRef(false);
  const [marche, setMarche] = useState(false);
  const cam = useThree(s => s.camera);
  const decalage = useMemo(() => decalageCamera(camera), [camera]);
  const cible = useMemo(() => new THREE.Vector3(), []), voulue = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const g = groupe.current;
    if (!g) return;
    const dx = Number(directions.has('droite')) - Number(directions.has('gauche')), dz = Number(directions.has('arriere')) - Number(directions.has('avant'));
    let bouge = false;
    if (assise) {
      // Assis : le clavier et les trajets attendent ; la position logique reste celle du poste, pour repartir de là.
      route.current = []; visee.current = null;
      g.position.set(assise.position[0], 0, assise.position[1]); g.rotation.y = assise.rotation;
      if (marcheRef.current) { marcheRef.current = false; setMarche(false); }
      cible.set(assise.position[0], 1.1, assise.position[1]);
      voulue.set(cible.x + decalage[0], cible.y + decalage[1], cible.z + decalage[2]);
      cam.position.lerp(voulue, 1 - Math.exp(-4 * Math.min(delta, .1)));
      cam.lookAt(cible);
      return;
    }
    if (dx || dz) {
      route.current = []; visee.current = null;
      const a = camera.azimut, mx = Math.cos(a) * dx + Math.sin(a) * dz, mz = -Math.sin(a) * dx + Math.cos(a) * dz;
      const suivant = avancer(position.current, mx, mz, delta);
      bouge = suivant[0] !== position.current[0] || suivant[1] !== position.current[1];
      if (bouge) g.rotation.y = Math.atan2(mx, mz);
      position.current = suivant;
    } else if (route.current.length) {
      const [tx, tz] = route.current[0], [x, z] = position.current;
      const ex = tx - x, ez = tz - z, d = Math.hypot(ex, ez), pas = Math.min(delta, .05) * 3.4;
      position.current = d <= pas ? [tx, tz] : [x + ex / d * pas, z + ez / d * pas];
      if (d <= pas) route.current.shift();
      if (d > .01) g.rotation.y = Math.atan2(ex, ez);
      bouge = true;
      if (!route.current.length && visee.current) { const arrivee = visee.current; visee.current = null; onArrivee(arrivee); }
    }
    g.position.set(position.current[0], 0, position.current[1]);
    if (bouge !== marcheRef.current) { marcheRef.current = bouge; setMarche(bouge); }
    cible.set(position.current[0], 1.1, position.current[1]);
    voulue.set(cible.x + decalage[0], cible.y + decalage[1], cible.z + decalage[2]);
    cam.position.lerp(voulue, 1 - Math.exp(-4 * Math.min(delta, .1)));
    cam.lookAt(cible);
  });
  return <group ref={groupe} position={[depart[0], 0, depart[1]]}>
    <mesh visible={!assise} rotation={[-Math.PI / 2, 0, 0]} position={[0, .05, 0]} renderOrder={9}><ringGeometry args={[.55, .72, 36]} /><meshBasicMaterial color="#dff3f7" transparent opacity={.85} depthTest={false} depthWrite={false} /></mesh>
    <HumainJoueur casque={casque} marche={marche} allure={3.4} assis={Boolean(assise)} />
  </group>;
}
