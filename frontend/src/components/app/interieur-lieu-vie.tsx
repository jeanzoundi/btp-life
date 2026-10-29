'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { qualiteMemorisee } from '@/lib/fluidite-monde';
import { lieuVieOuvert, type LieuVie } from '@/lib/lieux-vie';
import type { Assise, Point } from '@/lib/navigation-plan';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { FluiditeMonde } from './fluidite-monde';
import { CroixDirections, decalageCamera } from './joueur-interieur';
import { heureLisible } from './panneau-programme-lieu';
import { RefletsMonde } from './reflets-monde';
import { useEcranTactile } from '@/lib/ecran-tactile';
import { CAMERAS_PLAN, ScenePlan, usePlanInterieur, type HoteScene } from './scene-plan';

/** Ce qu'un lieu peut demander au joueur : aller à un poste, ou enchaîner un parcours (le footing, le match). */
export interface CommandesLieu { aller: (station: string) => void; parcourir: (points: Point[]) => void }

/** Intérieur d'un lieu de vie (maquis, café) : on y marche entre comptoir et tables, l'hôte sert, la scène vit selon l'heure. */
export function InterieurLieuVie({ lieu, heure, decor, hote, postes: postesRecus, assise, statut, libelleHote, commandes, onPoste, onSortir, onEchap, onAttendre, children }: {
  lieu: Pick<LieuVie, 'nom' | 'accroche' | 'hote' | 'horaires' | 'plan'>; heure: number; decor: ReactNode; hote: HoteScene;
  /** Postes à signaler d'une balise (plat servi, collègues présents…). */
  postes: string[]; assise: Assise | null;
  /** Ligne d'état sous le titre : ce qui se passe maintenant dans le lieu. */
  statut: ReactNode;
  /** Bouton de l'en-tête qui mène à l'hôte (par défaut : la carte). */
  libelleHote?: string;
  /** Rempli par l'intérieur : un panneau peut envoyer le joueur vers un poste, ou sur un parcours. */
  commandes?: MutableRefObject<CommandesLieu | null>;
  onPoste: (station: string) => void; onSortir: () => void; onEchap: () => boolean; onAttendre: () => void;
  children?: ReactNode;
}) {
  const postes = useMemo(() => postesRecus, [postesRecus.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const { plan } = lieu, camera = CAMERAS_PLAN[plan.ambiance];
  const [qualite] = useState(qualiteMemorisee);
  // Entre le bouton de l'hôte et l'arrivée au comptoir, le personnage marche : le bouton le dit tout de suite.
  const [versHote, setVersHote] = useState(false);
  const tactile = useEcranTactile();
  const rappels = useRef({ onPoste, onSortir, onEchap });
  rappels.current = { onPoste: (station: string) => { setVersHote(false); onPoste(station); }, onSortir, onEchap };
  const { directions, nav, position, route, visee, aller, marcherVers, arrivee } = usePlanInterieur(plan, rappels);
  if (commandes) commandes.current = {
    aller,
    parcourir: points => {
      directions.clear(); visee.current = null;
      const trajet: Point[] = [];
      let depuis = position.current;
      for (const point of points) { const morceau = nav.chemin(depuis, point); trajet.push(...morceau); if (morceau.length) depuis = morceau.at(-1)!; }
      route.current = trajet;
    },
  };
  const decalage = decalageCamera(camera);
  const ouvert = lieuVieOuvert(lieu, heure);
  return <section className={`fixed inset-0 z-[100] bg-[#2a2219] ${POLICES_JEU} hud-texte`} aria-label={`Dans ${lieu.nom}`}>
    <Canvas shadows dpr={1} camera={{ position: [plan.depart[0] + decalage[0], decalage[1], plan.depart[1] + decalage[2]], fov: 46, near: .1, far: 260 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <FluiditeMonde qualite={qualite} actif rayonOcclusion={.5} />
      <RefletsMonde intensite={plan.ambiance === 'interieur' ? .3 : .45} />
      <ScenePlan plan={plan} decor={decor} hote={hote} postes={ouvert ? postes : []} assise={assise} casque={false}
        directions={directions} position={position} route={route} visee={visee} avancer={nav.avancer} camera={camera} onArrivee={arrivee} onPoste={aller} onSol={point => { setVersHote(false); marcherVers(point); }} />
    </Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="hud-verre pointer-events-auto min-w-0 max-w-[min(430px,calc(100%-112px))] px-4 py-3">
        <span className="hud-legende text-jeu-or">{ouvert ? `Ouvert · ${heureLisible(lieu.horaires.ouverture)} – ${heureLisible(lieu.horaires.fermeture)}` : 'Fermé pour l’instant'}</span>
        <h2 className="hud-titre truncate text-lg leading-tight sm:text-2xl">{lieu.nom}</h2>
        <p className="mt-0.5 text-[12px] leading-snug text-jeu-ivoire/70">{lieu.accroche}</p>
        <div className="mt-2 text-[12.5px] font-semibold text-jeu-ivoire/90">{ouvert ? statut : `Ouverture à ${heureLisible(lieu.horaires.ouverture)}.`}</div>
        {!ouvert && <button onClick={onAttendre} className="hud-bouton hud-bouton-verre mt-2 w-full px-3 py-2 text-[12.5px]">⏭ Attendre l’ouverture · {heureLisible(lieu.horaires.ouverture)}</button>}
        {ouvert && <button onClick={() => { setVersHote(true); aller('mentor'); }} aria-live="polite" className="hud-bouton hud-bouton-verre mt-2 px-3 py-1.5 text-[12px]">{versHote ? `🚶 Tu rejoins ${lieu.hote.nom}…` : libelleHote ?? `🧾 Voir la carte · ${lieu.hote.nom}`}</button>}
      </div>
      <button onClick={onSortir} className="hud-bouton hud-bouton-principal pointer-events-auto shrink-0 px-4 py-3 text-sm">🚪 Sortir</button>
    </header>
    <CroixDirections directions={directions} />
    <p className="hud-verre pointer-events-none absolute bottom-5 right-5 hidden rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 sm:block">{tactile ? 'Touche le sol ou une balise pour y aller' : 'Clique le sol ou une balise · ZQSD / flèches · Échap pour sortir'}</p>
    {children}
  </section>;
}
