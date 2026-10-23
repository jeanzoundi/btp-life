'use client';

import Link from 'next/link';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import { qualiteMemorisee } from '@/lib/fluidite-monde';
import { DECALAGE_OUVRAGE, DEPART, LIBELLES_STATIONS, PARCELLE, STATIONS, avancer, chemin, libre, type Point, type StationChantier } from '@/lib/interieur-chantier';
import { phaseJournee, TITRES_PHASES, type Journee } from '@/lib/journee-chantier';
import { planChantier } from '@/lib/plan-chantier';
import { POLICES_JEU } from '@/lib/polices-jeu';
import type { ChargementLivraison, EtapeVisuelle, EtatVisuel, Metier, Ouvrier } from '@/lib/programme-chantier';
import { BlocsInstances } from './blocs-instances';
import { Balise, Betonniere, Bungalow, CamionLivraison, Grue, MiniPelle, OuvrierEnBoucle, OuvrierPoste, Palissade, PanneauChantier, entreEtapes } from './chantier-vivant';
import { FluiditeMonde } from './fluidite-monde';
import { HumainMonde } from './humain-monde';
import { MateriauMonde } from './materiaux-monde';
import { RefletsMonde } from './reflets-monde';
import { FriseEtapes, type StatutJournee } from './panneau-journee-chantier';

type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
const TOUCHES: Record<string, Direction | undefined> = { KeyW: 'avant', KeyZ: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere', KeyA: 'gauche', KeyQ: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite' };
const AZIMUT = 32 * Math.PI / 180, INCLINAISON = 50 * Math.PI / 180, RECUL = 23;
const DECALAGE_CAMERA: V3 = [RECUL * Math.cos(INCLINAISON) * Math.sin(AZIMUT), RECUL * Math.sin(INCLINAISON), RECUL * Math.cos(INCLINAISON) * Math.cos(AZIMUT)];
const DALLE = 4.1, TOIT = 7.18;

export interface ProprietesChantierInterieur {
  nomChantier: string; etat: EtatVisuel; equipe: Ouvrier[]; journee: Journee | null; statut: StatutJournee;
  /** Postes à signaler par une balise (tâches du moment, ou Yao pour commencer et faire le bilan). */
  postes: StationChantier[]; livraison: ChargementLivraison | null; demo: boolean;
  /** Visite libre d'un autre chantier : pas de journée, pas de Yao. */
  visite?: boolean;
  onPoste: (station: StationChantier) => void; onSortir: () => void; onPlanning: () => void;
  /** Échap : ferme d'abord un panneau ouvert ; renvoie faux s'il n'y en avait pas, et l'on sort du chantier. */
  onEchap: () => boolean;
  children?: ReactNode;
}

/** Intérieur du Grand chantier : on marche dans la parcelle, entre la base vie, le stock, les engins et l'ouvrage. */
export function InterieurChantier3D({ nomChantier, etat, equipe, journee, statut, postes, livraison, demo, visite = false, onPoste, onSortir, onPlanning, onEchap, children }: ProprietesChantierInterieur) {
  const directions = useMemo(() => new Set<Direction>(), []);
  const position = useRef<Point>([...DEPART]);
  const route = useRef<Point[]>([]);
  const visee = useRef<StationChantier | null>(null);
  const [qualite] = useState(qualiteMemorisee);
  const rappels = useRef({ onPoste, onSortir, onEchap });
  rappels.current = { onPoste, onSortir, onEchap };
  // Rappels stables : la scène (mémorisée) ne se redessine pas à chaque tic de l'horloge du monde.
  /** Va vers un poste : ouvre la tâche tout de suite si l'on y est, sinon y marche et l'ouvre à l'arrivée. */
  const aller = useCallback((station: StationChantier) => {
    const [sx, sz] = STATIONS[station], [x, z] = position.current;
    directions.clear();
    if (Math.hypot(sx - x, sz - z) < 1.6) { route.current = []; visee.current = null; rappels.current.onPoste(station); return; }
    const trajet = chemin(position.current, [sx, sz]);
    route.current = trajet; visee.current = trajet.length ? station : null;
  }, [directions]);
  const marcherVers = useCallback((point: Point) => {
    if (!libre(point, .2)) return;
    directions.clear(); visee.current = null; route.current = chemin(position.current, point);
  }, [directions]);
  const arrivee = useCallback((station: StationChantier) => rappels.current.onPoste(station), []);
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
  }, [directions]);
  const phase = journee ? phaseJournee(journee) : null;
  return <section className={`fixed inset-0 z-[100] bg-[#2a2219] ${POLICES_JEU} hud-texte`} aria-label={`Sur le chantier ${nomChantier}`}>
    <Canvas shadows dpr={1} camera={{ position: [DEPART[0] + DECALAGE_CAMERA[0], DECALAGE_CAMERA[1], DEPART[1] + DECALAGE_CAMERA[2]], fov: 46, near: .1, far: 260 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <FluiditeMonde qualite={qualite} actif rayonOcclusion={.6} />
      <RefletsMonde intensite={.45} />
      <SceneChantier etat={etat} equipe={equipe} postes={postes} livraison={livraison} visite={visite} nomChantier={nomChantier}
        directions={directions} position={position} route={route} visee={visee}
        onArrivee={arrivee} onPoste={aller} onSol={marcherVers} />
    </Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="hud-verre pointer-events-auto min-w-0 max-w-[min(430px,calc(100%-112px))] px-4 py-3">
        <span className="hud-legende text-jeu-or">{visite ? 'Visite de chantier' : 'Sur le chantier'} · {nomChantier}</span>
        <h2 className="hud-titre truncate text-lg leading-tight sm:text-2xl">{etat.nom}</h2>
        <p className="text-[12px] text-jeu-ivoire/70">{etat.etape === 'livre' ? 'Ouvrage terminé et réceptionné' : visite ? `Avancement ${etat.avancement} %` : `Jour ${etat.jour} sur ${etat.total} · ${etat.avancement} %`}</p>
        {!visite && <FriseEtapes etat={etat} />}
        {!visite && <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button onClick={onPlanning} className="hud-bouton hud-bouton-verre px-3 py-1.5 text-[12px]">📋 Planning et équipe</button>
          {!demo && <Link href="/app/chantiers" className="hud-bouton hud-bouton-verre px-3 py-1.5 text-[12px]">Mes chantiers →</Link>}
        </div>}
      </div>
      <button onClick={onSortir} className="hud-bouton hud-bouton-principal pointer-events-auto shrink-0 px-4 py-3 text-sm">🚪 Sortir</button>
    </header>
    {!visite && <aside aria-label="Journée de travail" className="hud-verre absolute left-3 top-[188px] hidden w-[300px] p-3.5 sm:left-5 sm:block">
      {journee && phase ? <>
        <p className="hud-legende text-jeu-or">Journée · {TITRES_PHASES[phase]}</p>
        <ol className="mt-2 space-y-1">{journee.taches.map(t => {
          const faite = journee.reponses[t.id] !== undefined, dispo = postes.includes(t.zone) && !faite;
          return <li key={t.id}><button disabled={!dispo} onClick={() => aller(t.zone)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${dispo ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40 hover:bg-jeu-or/20' : faite ? 'text-jeu-ivoire/50' : 'text-jeu-ivoire/40'}`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${faite ? 'bg-jeu-lagune text-[#14261F]' : dispo ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/10'}`}>{faite ? '✓' : ''}</span>
            <span className="min-w-0 flex-1 truncate">{t.titre}</span><span className="shrink-0 text-[10.5px] font-medium text-jeu-ivoire/45">{LIBELLES_STATIONS[t.zone]}</span>
          </button></li>;
        })}
          <li><button disabled={phase !== 'bilan'} onClick={() => aller('yao')} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${phase === 'bilan' ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'text-jeu-ivoire/40'}`}><span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]" />Bilan avec Yao</button></li>
        </ol>
      </> : <p className="text-[12.5px] leading-relaxed text-jeu-ivoire/75">
        {statut === 'disponible' ? <>Pas de journée en cours. <button onClick={() => aller('yao')} className="font-bold text-jeu-or underline">Va voir Yao</button>, devant la base vie, pour commencer.</> : statut === 'repos' ? 'Journée terminée : l’équipe reprend demain à 6 h. Tu peux visiter le chantier.' : 'Le chantier est fermé : les journées commencent entre 6 h et 18 h.'}
      </p>}
    </aside>}
    <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-1.5 sm:hidden"><span /><BoutonDirection d="avant" symbole="▲" directions={directions} /><span /><BoutonDirection d="gauche" symbole="◀" directions={directions} /><BoutonDirection d="arriere" symbole="▼" directions={directions} /><BoutonDirection d="droite" symbole="▶" directions={directions} /></div>
    <p className="hud-verre pointer-events-none absolute bottom-5 right-5 hidden rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 sm:block">Clique le sol ou une balise · ZQSD / flèches · Échap pour sortir</p>
    {children}
  </section>;
}

function BoutonDirection({ d, symbole, directions }: { d: Direction; symbole: string; directions: Set<Direction> }) {
  return <button aria-label={d} className="hud-verre hud-bouton h-11 w-11 rounded-xl text-lg" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); directions.add(d); }} onPointerUp={() => directions.delete(d)} onPointerCancel={() => directions.delete(d)}>{symbole}</button>;
}

/** Où travaille chaque métier selon l'étape : un poste fixe (éventuellement en hauteur) ou un aller-retour. */
interface PlaceOuvrier { poste?: V3; rotation?: number; boucle?: [Point, Point]; porte?: boolean; brouette?: boolean; hauteur?: number }
const ATELIER: PlaceOuvrier = { poste: [-11.8, 0, -2.5], rotation: Math.PI }, BOIS: PlaceOuvrier = { poste: [-12.4, 0, .6], rotation: Math.PI / 2 };
const PLACES: Partial<Record<EtapeVisuelle, Partial<Record<Metier, PlaceOuvrier>>>> = {
  implantation: { 'Chef d’équipe': { poste: [-8.9, 0, 1.4], rotation: 2.2 }, 'Maçon': { poste: [7.7, 0, 2.6], rotation: -2.4 }, 'Manœuvre': { boucle: [[-7.2, 6.4], [-6.9, 2.6]], porte: true }, 'Ferrailleur': ATELIER, 'Coffreur': BOIS },
  fouilles: { 'Chef d’équipe': { poste: [-4.6, 0, 2.3], rotation: 2.6 }, 'Maçon': { poste: [5.8, 0, 1.9], rotation: -2.6 }, 'Manœuvre': { boucle: [[-2.4, 1.6], [-8.2, .9]], porte: true }, 'Ferrailleur': ATELIER, 'Coffreur': BOIS },
  semelles: { 'Chef d’équipe': { poste: [0, 0, 2.5], rotation: Math.PI }, 'Ferrailleur': { poste: [-3, 0, 1.7], rotation: Math.PI }, 'Coffreur': { poste: [2.6, 0, 1.7], rotation: Math.PI }, 'Maçon': { poste: [10.9, 0, .7], rotation: -Math.PI / 2 }, 'Manœuvre': { boucle: [[9.2, 1.6], [4.6, 2]], brouette: true } },
  soubassement: { 'Chef d’équipe': { poste: [1.6, 0, 2.5], rotation: Math.PI }, 'Maçon': { poste: [-2, 0, 1.75], rotation: Math.PI }, 'Manœuvre': { boucle: [[-8.2, 7.1], [-3.6, 2]], porte: true }, 'Ferrailleur': ATELIER, 'Coffreur': { poste: [8.9, 0, -1.6], rotation: -Math.PI / 2 } },
  elevation: { 'Chef d’équipe': { poste: [3, 0, 2.6], rotation: Math.PI }, 'Maçon': { poste: [-1, 0, 1.75], rotation: Math.PI }, 'Manœuvre': { boucle: [[-8.2, 7.1], [-2.8, 2]], porte: true }, 'Ferrailleur': ATELIER, 'Coffreur': { poste: [8.9, 0, -1.6], rotation: -Math.PI / 2 } },
  dalle: { 'Chef d’équipe': { poste: [0, 0, 2.6], rotation: Math.PI }, 'Ferrailleur': { poste: [-1.5, DALLE, -3], rotation: .6 }, 'Coffreur': { poste: [2.5, DALLE, -1.8], rotation: -.8 }, 'Maçon': { poste: [10.9, 0, .7], rotation: -Math.PI / 2 }, 'Manœuvre': { boucle: [[9.2, 1.6], [4.8, 2.1]], brouette: true } },
  etage: { 'Chef d’équipe': { poste: [3, 0, 2.6], rotation: Math.PI }, 'Maçon': { poste: [-1.2, DALLE, .2], rotation: Math.PI }, 'Manœuvre': { boucle: [[-4.5, -5], [-1.5, -.6]], porte: true, hauteur: DALLE }, 'Ferrailleur': ATELIER, 'Coffreur': { poste: [2.8, DALLE, -4.6], rotation: .3 } },
  toiture: { 'Chef d’équipe': { poste: [3, 0, 2.6], rotation: Math.PI }, 'Maçon': { poste: [0, TOIT, -3.4], rotation: .4 }, 'Manœuvre': { boucle: [[-4, -5.5], [2, -1.5]], porte: true, hauteur: TOIT } },
  finitions: { 'Chef d’équipe': { poste: [4, 0, 2.6], rotation: Math.PI }, 'Maçon': { poste: [-3, 1.62, 2.55], rotation: Math.PI }, 'Peintre': { poste: [7.55, 1.62, -2.2], rotation: -Math.PI / 2 }, 'Électricien': { poste: [-1.3, 0, 1.75], rotation: Math.PI }, 'Plombier': { poste: [1.6, 0, 1.75], rotation: Math.PI }, 'Carreleur': { poste: [-7.6, 0, 4.4], rotation: -Math.PI / 2 } },
  reception: { 'Chef d’équipe': { poste: [.9, 0, 2.6], rotation: Math.PI } },
};

const SceneChantier = memo(function SceneChantier({ etat, equipe, postes, livraison, visite, nomChantier, directions, position, route, visee, onArrivee, onPoste, onSol }: {
  etat: EtatVisuel; equipe: Ouvrier[]; postes: StationChantier[]; livraison: ChargementLivraison | null; visite: boolean; nomChantier: string;
  directions: Set<Direction>; position: MutableRefObject<Point>; route: MutableRefObject<Point[]>; visee: MutableRefObject<StationChantier | null>;
  onArrivee: (s: StationChantier) => void; onPoste: (s: StationChantier) => void; onSol: (p: Point) => void;
}) {
  const plan = useMemo(() => planChantier(etat), [etat]);
  const stock = useMemo(() => blocsStock(), []);
  const etape = etat.etape;
  const sol = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 6) onSol([e.point.x, e.point.z]); };
  const libres = equipe.filter(o => !PLACES[etape]?.[o.metier]);
  return <>
    <color attach="background" args={['#AFCFE2']} /><fog attach="fog" args={['#CBDDE6', 48, 120]} />
    <hemisphereLight args={['#FFF4DE', '#7A5A3C', 1.05]} /><ambientLight intensity={.22} />
    <directionalLight castShadow position={[14, 24, 12]} intensity={2.7} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-.0004} />
    {/* Latérite compactée de la parcelle, cliquable pour marcher ; au-delà, la rue et le quartier. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={sol}><planeGeometry args={[PARCELLE.demiLargeur * 2, PARCELLE.demiProfondeur * 2]} /><MateriauMonde type="concrete_floor" couleur="#A46F50" echelle={5} relief={.9} rugosite={1} /></mesh>
    {[-1.1, 1.1].map(x => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, .006, 7.4]} receiveShadow><planeGeometry args={[.7, 9]} /><meshStandardMaterial color="#6E4A35" roughness={1} transparent opacity={.45} /></mesh>)}
    <Abords />
    <Palissade hx={PARCELLE.demiLargeur} hz={PARCELLE.demiProfondeur} portail={3.2} />
    <PanneauChantier position={[-5.5, 1.35, 10.2]} nom={nomChantier} etat={etat} />
    <group position={[0, 0, DECALAGE_OUVRAGE]}>
      <BlocsInstances blocs={plan.structure} interactif={false} />
      <BlocsInstances blocs={plan.echafaudage} interactif={false} />
      <BlocsInstances blocs={plan.vitres} matiere="vitre" interactif={false} />
    </group>
    <BaseVie />
    <BlocsInstances blocs={stock} interactif={false} />
    {[[-13, 8, 1.6, '#D9C29A'], [-9.8, 9.2, 1.3, '#9C978C']].map(([x, z, r, c]) => <mesh key={String(c)} position={[x as number, (r as number) * .42, z as number]} castShadow receiveShadow><coneGeometry args={[r as number, (r as number) * .85, 20]} /><meshStandardMaterial color={c as string} roughness={1} /></mesh>)}
    <Text position={[-11.5, 2.3, 6.4]} rotation={[0, .4, 0]} fontSize={.36} color="#2B2B2E" outlineColor="#FBF5EA" outlineWidth={.02}>ZONE DE STOCKAGE</Text>
    {etape !== 'livre' && etape !== 'reception' && <Grue position={[-11.5, 0, -9]} hauteurCharge={plan.hauteurTravail} pause={false} rythme={1} />}
    {entreEtapes(etape, 'semelles', 'finitions') && <Betonniere position={[10, 0, -.5]} pause={false} rythme={1} rotation={-1.2} />}
    {etape === 'fouilles' && <MiniPelle position={[-1.6, 0, -3.1]} rotation={.5} pause={false} rythme={1} />}
    <AccessoiresEtape etape={etape} />
    {livraison && <CamionLivraison position={[10, 0, 9.4]} chargement={livraison} />}
    {/* L'équipe recrutée, chacun à son poste selon l'étape ; les autres patientent près de la base vie. */}
    {etape !== 'livre' && equipe.map((o, i) => {
      const place = PLACES[etape]?.[o.metier];
      const nom = `${o.nom.split(' ')[0]} · ${o.metier}`;
      if (!place) { const rang = libres.indexOf(o); return <OuvrierPoste key={o.id} position={[3.6 + rang * 1.1, 0, 5.6]} rotation={Math.PI} variante={i % 5} nom={nom} />; }
      if (place.boucle) return <group key={o.id} position={[0, place.hauteur ?? 0, 0]}><OuvrierEnBoucle points={place.boucle} depart={i} variante={i % 5} porte={place.porte} brouette={place.brouette} pause={false} rythme={1} nom={nom} /></group>;
      return <OuvrierPoste key={o.id} position={place.poste!} rotation={place.rotation ?? 0} variante={i % 5} nom={nom} />;
    })}
    {!visite && etape === 'recrutement' && !equipe.length && [[12.3, -5.4], [13.3, -5.2], [14.3, -5.5]].map(([x, z], i) => <OuvrierPoste key={i} position={[x, 0, z]} rotation={Math.PI} variante={i + 1} nom="Candidat" />)}
    {!visite && <Yao onClick={() => onPoste('yao')} />}
    {postes.map(s => <Balise key={s} position={[STATIONS[s][0], 0, STATIONS[s][1]]} libelle={LIBELLES_STATIONS[s]} onClick={() => onPoste(s)} />)}
    <JoueurChantier directions={directions} position={position} route={route} visee={visee} onArrivee={onArrivee} />
  </>;
});

/** Le joueur : clavier relatif à la caméra, ou trajet calculé ; la caméra le suit de trois quarts. */
function JoueurChantier({ directions, position, route, visee, onArrivee }: { directions: Set<Direction>; position: MutableRefObject<Point>; route: MutableRefObject<Point[]>; visee: MutableRefObject<StationChantier | null>; onArrivee: (s: StationChantier) => void }) {
  const groupe = useRef<THREE.Group>(null), marcheRef = useRef(false);
  const [marche, setMarche] = useState(false);
  const camera = useThree(s => s.camera);
  const cible = useMemo(() => new THREE.Vector3(), []), voulue = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const g = groupe.current;
    if (!g) return;
    const dx = Number(directions.has('droite')) - Number(directions.has('gauche')), dz = Number(directions.has('arriere')) - Number(directions.has('avant'));
    let bouge = false;
    if (dx || dz) {
      route.current = []; visee.current = null;
      const mx = Math.cos(AZIMUT) * dx + Math.sin(AZIMUT) * dz, mz = -Math.sin(AZIMUT) * dx + Math.cos(AZIMUT) * dz;
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
    voulue.set(cible.x + DECALAGE_CAMERA[0], cible.y + DECALAGE_CAMERA[1], cible.z + DECALAGE_CAMERA[2]);
    camera.position.lerp(voulue, 1 - Math.exp(-4 * Math.min(delta, .1)));
    camera.lookAt(cible);
  });
  return <group ref={groupe} position={[DEPART[0], 0, DEPART[1]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .05, 0]} renderOrder={9}><ringGeometry args={[.55, .72, 36]} /><meshBasicMaterial color="#dff3f7" transparent opacity={.85} depthTest={false} depthWrite={false} /></mesh>
    <HumainMonde casque identite="batisseur" marche={marche} allure={3.4} />
  </group>;
}

/** Yao, chef de chantier, à l'angle de la base vie : le toucher ouvre la journée. */
function Yao({ onClick }: { onClick: () => void }) {
  return <group position={[9, 0, -7]} rotation={[0, -.5, 0]} onClick={e => { e.stopPropagation(); onClick(); }}>
    <mesh position={[0, 1, 0]}><cylinderGeometry args={[.6, .6, 2, 10]} /><meshBasicMaterial visible={false} /></mesh>
    <HumainMonde identite="yao" casque />
    <Billboard position={[0, 2.3, 0]}><Text fontSize={.22} color="#FFF4D9" outlineColor="#1C1511" outlineWidth={.03}>Yao · chef de chantier</Text></Billboard>
  </group>;
}

/** Base vie au nord-est, portes tournées vers le chantier : vestiaire et bureau, sanitaires, citerne ; consignes au portail. */
function BaseVie() {
  return <>
    <Bungalow position={[10.9, 0, -9.2]} taille={[3, 2.5, 2.8]} nuit={false} libelle="VESTIAIRE · EPI" />
    <Bungalow position={[13.9, 0, -9.2]} taille={[3, 2.5, 2.8]} nuit={false} libelle="BUREAU DE CHANTIER" casques={false} />
    <mesh position={[15, 1.15, -1.8]} castShadow><boxGeometry args={[1.1, 2.3, 1.1]} /><meshStandardMaterial color="#2F6E8E" roughness={.5} /></mesh>
    <mesh position={[15, .9, .2]} castShadow><cylinderGeometry args={[.75, .75, 1.8, 20]} /><meshStandardMaterial color="#1F2A30" roughness={.4} /></mesh>
    <group position={[-2.6, 0, 10.4]}>
      <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[2.4, 1.3, .06]} /><meshStandardMaterial color="#F7F2E8" /></mesh>
      <mesh position={[0, 1.9, .035]}><planeGeometry args={[2.4, .3]} /><meshBasicMaterial color="#2F7A4E" /></mesh>
      <Text position={[0, 1.9, .04]} fontSize={.15} color="#FFFFFF">CONSIGNES DE SÉCURITÉ</Text>
      <Text position={[0, 1.35, .04]} fontSize={.13} color="#2B2B2E" maxWidth={2.2} textAlign="center" lineHeight={1.3}>{'Casque, chaussures et gilet obligatoires\nNe pas stationner sous les charges\nSignaler tout danger au chef de chantier'}</Text>
      {[-1.1, 1.1].map(x => <mesh key={x} position={[x, .55, -.05]}><boxGeometry args={[.07, 1.1, .07]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
    </group>
  </>;
}

/** Stock et atelier : palette de ciment bâchée, palettes d'agglos, bottes d'aciers sur chevrons, planches, établi de ferraillage. */
function blocsStock(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  const bloc = (position: V3, taille: V3, couleur: string, rotation = 0) => blocs.push({ position, taille, couleur, rotation });
  bloc([-13.2, .08, 4.4], [1.5, .15, 1.2], '#8B6A45');
  for (let y = 0; y < 3; y++) for (let i = 0; i < 4; i++) bloc([-13.75 + i * .37, .27 + y * .2, 4.4], [.35, .18, .95], '#DCCFB2', (y + i) % 2 ? .04 : -.04);
  bloc([-13.2, .95, 4.4], [1.6, .05, 1.3], '#2F6E8E');
  for (const x of [-10.4, -8.9]) {
    bloc([x, .08, 5.6], [1.2, .15, 1.1], '#8B6A45');
    for (let y = 0; y < 4; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) bloc([x - .42 + i * .42, .3 + y * .22, 5.35 + k * .5], [.4, .2, .48], '#9E9A91');
  }
  for (const x of [-14.6, -12.6, -10.6]) bloc([x, .08, 1.8], [.15, .15, .9], '#6B5A45');
  for (let i = 0; i < 12; i++) bloc([-12.5, .2 + (i % 3) * .05, 1.55 + Math.floor(i / 3) * .12], [5, .035, .035], '#8A5A3C');
  for (let i = 0; i < 6; i++) bloc([-12.4, .1 + i * .05, -.4], [3.2, .045, .25 + (i % 2) * .05], '#B88A56', i % 2 ? .02 : -.02);
  // Établi de ferraillage : chevalets, plateau, cages d'armatures en cours de ligature.
  for (const x of [-13.4, -10.6]) bloc([x, .45, -3.5], [.12, .9, .9], '#6B5A45');
  bloc([-12, .92, -3.5], [3.6, .06, .9], '#8A6A4E');
  for (const z of [-3.75, -3.25]) bloc([-12, 1.1, z], [3.2, .03, .03], '#8A5A3C');
  for (let i = 0; i < 9; i++) bloc([-13.5 + i * .38, 1.1, -3.5], [.02, .25, .52], '#8A5A3C');
  return blocs;
}

/** Engins et accessoires propres à l'étape : théodolite, rubalise, brouette, auges, échelle, rouleaux d'étanchéité, pots de peinture, table de réception. */
function AccessoiresEtape({ etape }: { etape: EtapeVisuelle }) {
  const sud = 1.9, rubalise = entreEtapes(etape, 'fouilles', 'semelles');
  return <>
    {etape === 'implantation' && <group position={[-8.6, 0, 1.6]}>
      {[0, 2.1, 4.2].map(a => <mesh key={a} position={[Math.sin(a) * .25, .7, Math.cos(a) * .25]} rotation={[Math.cos(a) * .3, 0, -Math.sin(a) * .3]}><cylinderGeometry args={[.025, .025, 1.45, 6]} /><meshStandardMaterial color="#C9A13B" /></mesh>)}
      <mesh position={[0, 1.45, 0]} castShadow><boxGeometry args={[.22, .26, .18]} /><meshStandardMaterial color="#E8B23A" /></mesh>
    </group>}
    {rubalise && <>{[-7, -3.5, 0, 3.5, 7].map(x => <mesh key={x} position={[x, .5, sud + .3]}><cylinderGeometry args={[.03, .03, 1, 6]} /><meshStandardMaterial color="#C1502E" /></mesh>)}
      {[0, 1].map(k => <mesh key={k} position={[0, .75 - k * .25, sud + .3]}><boxGeometry args={[14, .05, .01]} /><meshStandardMaterial color={k ? '#F2F0EA' : '#D8402A'} /></mesh>)}</>}
    {entreEtapes(etape, 'semelles', 'dalle') && <group position={[8.4, 0, 2.2]} rotation={[0, .6, 0]}>
      <mesh position={[0, .5, 0]} castShadow><boxGeometry args={[.62, .3, .8]} /><meshStandardMaterial color="#4F7A8C" metalness={.4} roughness={.5} /></mesh>
      <mesh position={[0, .2, .45]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.18, .18, .1, 12]} /><meshStandardMaterial color="#2B2B2E" /></mesh>
    </group>}
    {entreEtapes(etape, 'soubassement', 'etage') && [-4.4, 2.2].map(x => <mesh key={x} position={[x, .18, sud + .2]} castShadow><cylinderGeometry args={[.42, .34, .36, 16]} /><meshStandardMaterial color="#1F1F1F" roughness={.8} /></mesh>)}
    {entreEtapes(etape, 'elevation', 'finitions') && <group position={[7.2, 0, 2.7]} rotation={[-.28, 0, 0]}>
      {[-.25, .25].map(x => <mesh key={x} position={[x, 2, 0]}><boxGeometry args={[.05, 4, .05]} /><meshStandardMaterial color="#B8BDC0" metalness={.6} /></mesh>)}
      {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[0, .3 + i * .35, 0]}><boxGeometry args={[.5, .04, .04]} /><meshStandardMaterial color="#B8BDC0" metalness={.6} /></mesh>)}
    </group>}
    {etape === 'toiture' && [-2, -1.2, -.4].map(x => <mesh key={x} position={[x, TOIT + .2, -5]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.2, .2, 1, 14]} /><meshStandardMaterial color="#26282A" roughness={.7} /></mesh>)}
    {etape === 'finitions' && <>{[4.6, 5.1, 5.5].map((x, i) => <mesh key={x} position={[x, .2, sud]} castShadow><cylinderGeometry args={[.16, .15, .38, 14]} /><meshStandardMaterial color={['#F1E4C8', '#E2653C', '#FBF5EA'][i]} /></mesh>)}
      <mesh position={[-7.6, .45, 5.4]} castShadow><boxGeometry args={[1.2, .9, .6]} /><meshStandardMaterial color="#8A6A4E" /></mesh></>}
    {(etape === 'reception' || etape === 'livre') && <group position={[3, 0, 2.6]}>
      <mesh position={[0, .75, 0]} castShadow><boxGeometry args={[1.4, .05, .7]} /><meshStandardMaterial color="#F2F0EA" /></mesh>
      {[[-.6, -.28], [.6, -.28], [-.6, .28], [.6, .28]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, .37, z]}><boxGeometry args={[.04, .74, .04]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
      <mesh position={[-.2, .79, 0]}><boxGeometry args={[.42, .02, .3]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
    </group>}
    {etape === 'livre' && [[-4, 2.2], [4.5, 2.4], [-7.2, -1]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, .5, z]} castShadow><sphereGeometry args={[.6, 12, 10]} /><meshStandardMaterial color="#5E8A43" roughness={.9} /></mesh>)}
  </>;
}

/** Ce qu'on aperçoit par-dessus la palissade : trottoir, chaussée, façades du quartier. */
function Abords() {
  const facades: [number, number, number, number, number, string][] = [
    [-26, -6, 9, 7, 14, '#E2D2B6'], [-26, 12, 9, 10, 12, '#D9C4A3'], [26, -10, 9, 9, 13, '#E8DCC6'], [26, 10, 9, 12, 12, '#CDB89A'],
    [-8, -26, 16, 11, 8, '#E5D5BC'], [12, -26, 14, 14, 8, '#D6C2A6'], [-14, 28, 14, 8, 8, '#E0CFB4'], [12, 28, 16, 10, 8, '#D2BEA2'],
  ];
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]} receiveShadow><planeGeometry args={[150, 150]} /><meshStandardMaterial color="#8C877D" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.01, 15]} receiveShadow><planeGeometry args={[60, 4]} /><meshStandardMaterial color="#5C5A57" roughness={.95} /></mesh>
    {facades.map(([x, z, l, h, p, c], i) => <mesh key={i} position={[x, h / 2, z]} castShadow receiveShadow><boxGeometry args={[l, h, p]} /><MateriauMonde type="painted_plaster_wall" couleur={c} echelle={3} /></mesh>)}
  </>;
}
