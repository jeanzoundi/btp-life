'use client';

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { aLArret, boucler, distanceLibre, ecartDevant, type Circuit, type Sens } from '@/lib/circulation';
import { ECHELLE_PERSONNAGES, GABARITS_VEHICULES } from '@/lib/echelle-monde';
import { avancerTrafic } from '@/lib/fluidite-monde';
import { phaseSignal } from '@/lib/itineraire-ville';
import { vehiculesEnCirculation } from '@/lib/vie-urbaine';
import { HumainMonde } from './humain-monde';
import { VoitureMonde } from './vehicule-monde';
import { BusMonde, GbakaMonde, MotoMonde, TaxiMonde } from './vehicules-abidjan';

// La rue d'Abidjan autour du joueur : la circulation à droite, le bus qui marque ses arrêts, les gbakas et les taxis,
// la gare des gbakas, les poteaux électriques et leurs fils, les étals du trottoir. Tout est à l'échelle des personnages.

type TypeCirculant = 'voiture' | 'taxi' | 'gbaka' | 'bus';
interface Voie {
  id: string; axe: 'x' | 'z';
  /** Coordonnée fixe de la voie (z pour une voie est-ouest, x pour une voie nord-sud). */
  ligne: number; sens: Sens; circuit: Circuit; stops: readonly number[];
  /** Arrêts de bus : position du centre du bus quand sa porte avant est devant l'abri. */
  arrets?: readonly number[];
}

const EST_OUEST: Circuit = { debut: -125, longueur: 250 };
const NORD_SUD: Circuit = { debut: -126, longueur: 172 };
// On roule à droite : vers l'est (+x), la voie du côté +z ; vers le sud (+z), celle du côté −x.
const VOIES: Record<string, Voie> = {
  'avenue-est': { id: 'avenue-est', axe: 'x', ligne: -8.5, sens: 1, circuit: EST_OUEST, stops: [-58.5, 49.5] },
  'avenue-ouest': { id: 'avenue-ouest', axe: 'x', ligne: -11.5, sens: -1, circuit: EST_OUEST, stops: [58.5, -49.5] },
  'lagune-est': { id: 'lagune-est', axe: 'x', ligne: 11.5, sens: 1, circuit: EST_OUEST, stops: [-58.5, 49.5] },
  'lagune-ouest': { id: 'lagune-ouest', axe: 'x', ligne: 8.5, sens: -1, circuit: EST_OUEST, stops: [58.5, -49.5] },
  // Le bus s'arrête porte avant face aux abris de l'avenue du Plateau (x = ±30, ville-lagune.tsx) : son centre 4,7 m en retrait.
  'plateau-est': { id: 'plateau-est', axe: 'x', ligne: -64.5, sens: 1, circuit: EST_OUEST, stops: [-58.5, 49.5], arrets: [-34.7, 25.3] },
  'plateau-ouest': { id: 'plateau-ouest', axe: 'x', ligne: -67.5, sens: -1, circuit: EST_OUEST, stops: [58.5, -49.5] },
  'ouest-sud': { id: 'ouest-sud', axe: 'z', ligne: -55.5, sens: 1, circuit: NORD_SUD, stops: [-71, -15, 5] },
  'ouest-nord': { id: 'ouest-nord', axe: 'z', ligne: -52.5, sens: -1, circuit: NORD_SUD, stops: [-61, -5, 15] },
  'est-sud': { id: 'est-sud', axe: 'z', ligne: 52.5, sens: 1, circuit: NORD_SUD, stops: [-71, -15, 5] },
  'est-nord': { id: 'est-nord', axe: 'z', ligne: 55.5, sens: -1, circuit: NORD_SUD, stops: [-61, -5, 15] },
};
/** Les véhicules en circulation : voie, position de départ, type, couleur. */
const CIRCULATION: { voie: string; depart: number; type: TypeCirculant; couleur?: string }[] = [
  { voie: 'avenue-est', depart: 0, type: 'taxi' }, { voie: 'avenue-est', depart: -70, type: 'voiture', couleur: '#a45340' },
  { voie: 'avenue-ouest', depart: 30, type: 'gbaka' }, { voie: 'avenue-ouest', depart: -90, type: 'voiture', couleur: '#e0d8c4' },
  { voie: 'lagune-est', depart: -30, type: 'voiture', couleur: '#416f84' }, { voie: 'lagune-ouest', depart: 70, type: 'taxi' },
  { voie: 'plateau-est', depart: -110, type: 'bus' }, { voie: 'plateau-ouest', depart: 20, type: 'voiture', couleur: '#cc8b42' },
  { voie: 'ouest-sud', depart: -95, type: 'voiture', couleur: '#d5a42d' }, { voie: 'ouest-nord', depart: -25, type: 'taxi' },
  { voie: 'est-sud', depart: -65, type: 'gbaka', couleur: '#2F6FB3' }, { voie: 'est-nord', depart: 20, type: 'voiture', couleur: '#b65d45' },
];

/** Positions courantes des véhicules de chaque voie, pour que chacun voie celui qui le précède. */
const FILES = new Map<string, Map<object, { position: number; longueur: number }>>();
const filePour = (id: string) => { let f = FILES.get(id); if (!f) { f = new Map(); FILES.set(id, f); } return f; };
const ATTENTE_ARRET = 4;

function VehiculeVoie({ voie, depart, type, couleur, pause, rythme }: { voie: Voie; depart: number; type: TypeCirculant; couleur?: string; pause: boolean; rythme: number }) {
  const ref = useRef<THREE.Group>(null);
  const vitesse = useRef(0), cle = useRef({}), attente = useRef(0), servi = useRef<number | null>(null);
  const longueur = GABARITS_VEHICULES[type].longueur * ECHELLE_PERSONNAGES;
  const maximum = type === 'bus' ? 2.4 : type === 'gbaka' ? 3.2 : 3;
  useEffect(() => {
    const file = filePour(voie.id), moi = cle.current;
    file.set(moi, { position: depart, longueur });
    return () => { file.delete(moi); };
  }, [voie.id, depart, longueur]);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    if (pause) { vitesse.current = 0; return; }
    const pas = delta * rythme;
    const position = voie.axe === 'x' ? ref.current.position.x : ref.current.position.z;
    if (attente.current > 0) { attente.current -= pas; vitesse.current = 0; return; }
    const file = filePour(voie.id);
    const autres = [...file.entries()].filter(([k]) => k !== cle.current).map(([, v]) => v);
    let { distance, contrainte } = distanceLibre({ position, longueur, sens: voie.sens, circuit: voie.circuit, stops: voie.stops, rouge: phaseSignal(clock.elapsedTime, voie.axe === 'x' ? 'horizontal' : 'vertical') !== 'vert', autres });
    // Le bus freine jusqu'à son prochain arrêt, s'y immobilise le temps de la montée, puis repart.
    if (voie.arrets) {
      if (servi.current !== null && Math.abs(position - servi.current) > 12) servi.current = null;
      const prochain = voie.arrets.filter(a => a !== servi.current).map(a => ecartDevant(position, a, voie.sens, voie.circuit)).filter(e => e <= 40);
      if (prochain.length) { distance = Math.min(distance, ...prochain); contrainte = true; }
      const arret = voie.arrets.find(a => a !== servi.current && aLArret(position, [a], .05));
      if (arret !== undefined) { servi.current = arret; attente.current = ATTENTE_ARRET; vitesse.current = 0; return; }
    }
    const m = avancerTrafic(vitesse.current, distance, contrainte, pas, maximum);
    vitesse.current = m.vitesse;
    const suivante = boucler(position + m.deplacement * voie.sens, voie.circuit);
    if (voie.axe === 'x') ref.current.position.x = suivante; else ref.current.position.z = suivante;
    file.set(cle.current, { position: suivante, longueur });
  });
  const rotation = voie.axe === 'x' ? (voie.sens > 0 ? 0 : Math.PI) : (voie.sens > 0 ? -Math.PI / 2 : Math.PI / 2);
  const position: [number, number, number] = voie.axe === 'x' ? [depart, 0, voie.ligne] : [voie.ligne, 0, depart];
  return <group ref={ref} position={position} rotation={[0, rotation, 0]}>
    <group scale={ECHELLE_PERSONNAGES}>
      {type === 'bus' ? <BusMonde roulage={vitesse} /> : type === 'gbaka' ? <GbakaMonde couleur={couleur} roulage={vitesse} /> : type === 'taxi' ? <TaxiMonde roulage={vitesse} /> : <VoitureMonde couleur={couleur} roulage={vitesse} />}
    </group>
  </group>;
}

/** Toute la circulation de la ville, selon l'heure : le bus de 5 h à 22 h, les autres véhicules plus ou moins nombreux. */
export const CirculationVille = memo(function CirculationVille({ pause, rythme, heure = 12 }: { pause: boolean; rythme: number; heure?: number }) {
  const autres = vehiculesEnCirculation(heure, CIRCULATION.length) - 1;
  let rang = 0;
  return <>{CIRCULATION.map((v, i) => {
    const present = v.type === 'bus' ? heure >= 5 && heure < 22 : rang++ < autres;
    return present ? <VehiculeVoie key={i} voie={VOIES[v.voie]} depart={v.depart} type={v.type} couleur={v.couleur} pause={pause} rythme={rythme} /> : null;
  })}</>;
});

/** Véhicule garé, à l'échelle de la ville. */
export function VehiculeGare({ p, r = 0, type, couleur }: { p: [number, number, number]; r?: number; type: TypeCirculant | 'moto'; couleur?: string }) {
  return <group position={p} rotation={[0, r, 0]}><group scale={ECHELLE_PERSONNAGES}>
    {type === 'moto' ? <MotoMonde couleur={couleur} /> : type === 'gbaka' ? <GbakaMonde couleur={couleur} /> : type === 'taxi' ? <TaxiMonde /> : type === 'bus' ? <BusMonde /> : <VoitureMonde couleur={couleur} />}
  </group></group>;
}

/** Poteaux électriques en béton et leurs fils détendus, comme le long des rues d'Abidjan. Les fils tiennent en un seul trait. */
export function LigneElectrique({ z, poteaux }: { z: number; poteaux: readonly number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null), traverses = useRef<THREE.InstancedMesh>(null);
  const hauteur = 7.5;
  const fils = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < poteaux.length - 1; i++) {
      const a = poteaux[i], b = poteaux[i + 1];
      if (b - a > 26) continue;
      for (const dz of [-.55, 0, .55]) for (let k = 0; k < 12; k++) {
        const t0 = k / 12, t1 = (k + 1) / 12, fleche = (t: number) => 4 * .55 * t * (1 - t);
        points.push(a + (b - a) * t0, hauteur - .15 - fleche(t0), z + dz, a + (b - a) * t1, hauteur - .15 - fleche(t1), z + dz);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, [poteaux, z]);
  useEffect(() => () => fils.dispose(), [fils]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    poteaux.forEach((x, i) => {
      o.position.set(x, hauteur / 2, z); o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); ref.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, hauteur - .1, z); o.updateMatrix(); traverses.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [ref.current, traverses.current]) if (m) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
  }, [poteaux, z]);
  return <group>
    <instancedMesh ref={ref} args={[undefined, undefined, poteaux.length]} castShadow><cylinderGeometry args={[.11, .17, hauteur, 8]} /><meshStandardMaterial color="#A8A49B" roughness={.9} /></instancedMesh>
    <instancedMesh ref={traverses} args={[undefined, undefined, poteaux.length]} castShadow><boxGeometry args={[.12, .12, 1.5]} /><meshStandardMaterial color="#6E6A63" roughness={.8} /></instancedMesh>
    <lineSegments geometry={fils}><lineBasicMaterial color="#1E2224" /></lineSegments>
  </group>;
}

const PRODUITS = ['#E8742B', '#F2C230', '#4E8A3A', '#C1352A', '#7A4E2D'];
/** Étal du trottoir : table, parasol, fruits et légumes en tas, et la vendeuse assise à l'ombre. */
export function EtalRue({ p, r = 0, couleur = '#D4664F', vendeuse = 0 }: { p: [number, number, number]; r?: number; couleur?: string; vendeuse?: number }) {
  const tas = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!tas.current) return;
    const o = new THREE.Object3D(), c = new THREE.Color();
    let i = 0;
    for (let pile = 0; pile < 5; pile++) for (let k = 0; k < 9; k++) {
      const x = -.65 + pile * .33 + (k % 3 - 1) * .07, y = .95 + Math.floor(k / 3) * .06, zz = (k % 2 ? .1 : -.1) + (Math.floor(k / 3) - 1) * .05;
      o.position.set(x, y, zz); o.scale.setScalar(.075 - Math.floor(k / 3) * .01); o.updateMatrix();
      tas.current.setMatrixAt(i, o.matrix); tas.current.setColorAt(i++, c.set(PRODUITS[(pile + vendeuse) % PRODUITS.length]));
    }
    tas.current.instanceMatrix.needsUpdate = true;
    if (tas.current.instanceColor) tas.current.instanceColor.needsUpdate = true;
    tas.current.computeBoundingSphere();
  }, [vendeuse]);
  return <group position={p} rotation={[0, r, 0]}><group scale={ECHELLE_PERSONNAGES}>
    <mesh position={[0, .86, 0]} castShadow receiveShadow><boxGeometry args={[1.8, .06, .8]} /><meshStandardMaterial color="#8B6A45" roughness={.9} /></mesh>
    {[-.8, .8].flatMap(x => [-.32, .32].map(z => <mesh key={`${x}${z}`} position={[x, .42, z]}><boxGeometry args={[.05, .84, .05]} /><meshStandardMaterial color="#5E4A34" /></mesh>))}
    <instancedMesh ref={tas} args={[undefined, undefined, 45]} castShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial roughness={.7} /></instancedMesh>
    <mesh position={[0, 1.4, -.55]}><cylinderGeometry args={[.025, .025, 2.8, 6]} /><meshStandardMaterial color="#6B5A45" /></mesh>
    <mesh position={[0, 2.7, -.3]} rotation={[.12, 0, 0]} castShadow><coneGeometry args={[1.35, .45, 8, 1, true]} /><meshStandardMaterial color={couleur} side={THREE.DoubleSide} roughness={.8} /></mesh>
    <mesh position={[.2, .22, -.78]} castShadow><boxGeometry args={[.36, .44, .36]} /><meshStandardMaterial color="#3E6F8E" roughness={.7} /></mesh>
    <group position={[.2, 0, -.78]}><HumainMonde assis variante={vendeuse * 2 + 1} sansCasque /></group>
  </group></group>;
}
