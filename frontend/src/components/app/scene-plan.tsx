'use client';

import { Billboard, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { memo, useCallback, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import type { IdentitePersonnage } from '@/lib/identites-personnages';
import { creerNavigation, type Assise, type PlanNavigable, type Point } from '@/lib/navigation-plan';
import type { PlanLieu } from '@/lib/programme-lieu';
import { Balise } from './chantier-vivant';
import { HumainMonde } from './humain-monde';
import { JoueurInterieur, useCommandesInterieur, type CameraSuivi, type Direction } from './joueur-interieur';
import { MateriauMonde } from './materiaux-monde';

// Ce que partagent tous les intérieurs dessinés sur un plan (laboratoire, dépôt, mairie, maquis, café, université…) :
// la marche entre les postes, l'hôte qu'on va voir, les balises, la rue autour, la caméra de trois quarts.

export const CAMERAS_PLAN: Record<PlanLieu['ambiance'], CameraSuivi> = {
  interieur: { azimut: 32 * Math.PI / 180, inclinaison: 56 * Math.PI / 180, recul: 18 },
  exterieur: { azimut: 32 * Math.PI / 180, inclinaison: 50 * Math.PI / 180, recul: 23 },
};

/** Marche dans un plan : clavier, trajet vers un poste (prévenu à l'arrivée), trajet vers un point du sol. */
export function usePlanInterieur(plan: PlanLieu, rappels: MutableRefObject<{ onPoste: (s: string) => void; onSortir: () => void; onEchap: () => boolean }>) {
  const directions = useMemo(() => new Set<Direction>(), []);
  const nav = useMemo(() => creerNavigation(plan), [plan]);
  const position = useRef<Point>([...plan.depart]);
  const route = useRef<Point[]>([]);
  const visee = useRef<string | null>(null);
  const aller = useCallback((station: string) => {
    const cible = plan.stations[station];
    if (!cible) return;
    directions.clear();
    if (Math.hypot(cible[0] - position.current[0], cible[1] - position.current[1]) < 1.6) { route.current = []; visee.current = null; rappels.current.onPoste(station); return; }
    const trajet = nav.chemin(position.current, cible);
    route.current = trajet; visee.current = trajet.length ? station : null;
  }, [directions, nav, plan, rappels]);
  const marcherVers = useCallback((point: Point) => {
    if (!nav.libre(point, .2)) return;
    directions.clear(); visee.current = null; route.current = nav.chemin(position.current, point);
  }, [directions, nav]);
  const arrivee = useCallback((station: string) => rappels.current.onPoste(station), [rappels]);
  useCommandesInterieur(directions, rappels);
  return { directions, nav, position, route, visee, aller, marcherVers, arrivee };
}

export interface HoteScene { identite?: IdentitePersonnage; prof?: boolean; variante?: number; casque?: boolean; nom: string }
/** Le personnage qui incarne un hôte ou un mentor : une identité du jeu, ou une tenue (bureau ou non) et une variante. */
export type ModeleHote = Omit<HoteScene, 'nom'>;

/** Rue et trottoir autour du lieu, plutôt qu'un vide. */
function Abords({ plan }: { plan: PlanNavigable }) {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, 0]} receiveShadow><planeGeometry args={[160, 160]} /><MateriauMonde type="asphalt_02" couleur="#77726B" echelle={6} relief={.3} rugosite={.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.01, plan.demiProfondeur + 1.6]} receiveShadow><planeGeometry args={[plan.demiLargeur * 2 + 4, 3.2]} /><MateriauMonde type="brick_pavement_02" couleur="#D9CFC0" echelle={1.6} relief={.5} rugosite={.9} /></mesh>
    <mesh position={[0, .03, plan.demiProfondeur + 3.3]} receiveShadow><boxGeometry args={[plan.demiLargeur * 2 + 4, .14, .2]} /><meshStandardMaterial color="#8E8578" roughness={.9} /></mesh>
  </>;
}

/** La scène d'un intérieur : lumière selon l'ambiance, abords, décor, hôte cliquable, balises des postes, joueur. */
export const ScenePlan = memo(function ScenePlan({ plan, decor, hote, postes, assise = null, casque, directions, position, route, visee, avancer, camera, onArrivee, onPoste, onSol }: {
  plan: PlanLieu; decor: ReactNode; hote: HoteScene; postes: string[]; assise?: Assise | null;
  /** Casque du joueur : par défaut, en plein air (cour du dépôt) ; jamais dans un lieu de vie, même à ciel ouvert. */
  casque?: boolean;
  directions: Set<Direction>; position: MutableRefObject<Point>; route: MutableRefObject<Point[]>; visee: MutableRefObject<string | null>;
  avancer: (p: Point, dx: number, dz: number, delta: number) => Point; camera: CameraSuivi;
  onArrivee: (s: string) => void; onPoste: (s: string) => void; onSol: (p: Point) => void;
}) {
  const sol = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 6) onSol([e.point.x, e.point.z]); };
  const [mx, mz] = plan.mentor.position;
  const interieur = plan.ambiance === 'interieur';
  return <>
    {interieur ? <>
      <color attach="background" args={['#241E19']} /><fog attach="fog" args={['#241E19', 34, 70]} />
      <hemisphereLight args={['#FFF6E6', '#5A4A3C', 1.15]} /><ambientLight intensity={.32} />
      <directionalLight castShadow position={[7, 15, 9]} intensity={2.1} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-.0004} />
    </> : <>
      <color attach="background" args={['#AFCFE2']} /><fog attach="fog" args={['#CBDDE6', 48, 120]} />
      <hemisphereLight args={['#FFF4DE', '#7A5A3C', 1.05]} /><ambientLight intensity={.22} />
      <directionalLight castShadow position={[14, 24, 12]} intensity={2.7} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-.0004} />
    </>}
    <Abords plan={plan} />
    {decor}
    {/* Plan de clic invisible sur tout le sol : on marche là où l'on touche. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .003, 0]} onClick={sol}><planeGeometry args={[plan.demiLargeur * 2, plan.demiProfondeur * 2]} /><meshBasicMaterial visible={false} /></mesh>
    <group position={[mx, 0, mz]} rotation={[0, plan.mentor.rotation, 0]} onClick={e => { e.stopPropagation(); onPoste('mentor'); }}>
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[.6, .6, 2, 10]} /><meshBasicMaterial visible={false} /></mesh>
      <HumainMonde identite={hote.identite} prof={hote.prof ?? true} variante={hote.variante} casque={hote.casque} />
      {/* Quand une balise le signale, son étiquette porte déjà le nom : on n'en superpose pas un second. */}
      {!postes.includes('mentor') && <Billboard position={[0, 2.3, 0]}><Text fontSize={.22} color="#FFF4D9" outlineColor="#1C1511" outlineWidth={.03}>{hote.nom}</Text></Billboard>}
    </group>
    {postes.filter(s => plan.stations[s]).map(s => <Balise key={s} position={[plan.stations[s][0], 0, plan.stations[s][1]]} libelle={plan.libelles[s] ?? s} onClick={() => onPoste(s)} />)}
    <JoueurInterieur directions={directions} position={position} route={route} visee={visee} onArrivee={onArrivee} avancer={avancer} depart={plan.depart} camera={camera} casque={casque ?? !interieur} assise={assise} />
  </>;
});
