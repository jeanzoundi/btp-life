'use client';

import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import * as THREE from 'three';
import { qualiteMemorisee } from '@/lib/fluidite-monde';
import { POLICES_JEU } from '@/lib/polices-jeu';
import type { PlanLieu, ProgrammeLieu, SeanceLieu } from '@/lib/programme-lieu';
import { FluiditeMonde } from './fluidite-monde';
import { CroixDirections, decalageCamera } from './joueur-interieur';
import { FriseLieu, heureLisible, PastilleTache, type StatutSeance } from './panneau-programme-lieu';
import { RefletsMonde } from './reflets-monde';
import { CAMERAS_PLAN, ScenePlan, usePlanInterieur, type ModeleHote } from './scene-plan';

/** Ce que le décor d'un lieu reçoit : les étapes déjà validées du cycle en cours (l'intérieur évolue avec elles) et le numéro du cycle. */
export interface ProprietesDecor { faites: number; cycle: number }

export interface ProprietesLieuProgramme {
  nom: string; href: string; programme: ProgrammeLieu; plan: PlanLieu; decor: ComponentType<ProprietesDecor>; mentor: ModeleHote;
  faites: number; cycle: number; seance: SeanceLieu | null; statut: StatutSeance;
  /** Postes à signaler : tâches restantes, ou le mentor pour commencer et faire le bilan. */
  postes: string[]; demo: boolean;
  onPoste: (station: string) => void; onSortir: () => void; onProgramme: () => void; onEchap: () => boolean;
  /** Fermé ou séance du jour faite : passer le temps jusqu'à la prochaine ouverture. */
  onAttendre: () => void;
  /** Le fil rouge passe par ce lieu : le chapitre à proposer, ou la séance de ce chapitre, en cours ici. */
  filRouge?: { titre: string; seance: SeanceLieu | null; bilan: boolean; onOuvrir: () => void } | null;
  children?: ReactNode;
}

/** Intérieur d'un lieu à programme : on y marche entre les postes du métier, le mentor guide, le décor évolue avec le programme. */
export function InterieurLieuProgramme({ nom, href, programme, plan, decor: Decor, mentor, faites, cycle, seance, statut, postes: postesRecus, demo, onPoste, onSortir, onProgramme, onEchap, onAttendre, filRouge, children }: ProprietesLieuProgramme) {
  // La liste arrive recalculée à chaque rendu de la ville : on garde la même tant que son contenu ne change pas, la scène ne se redessine pas pour rien.
  const postes = useMemo(() => postesRecus, [postesRecus.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const camera = CAMERAS_PLAN[plan.ambiance];
  const [qualite] = useState(qualiteMemorisee);
  const rappels = useRef({ onPoste, onSortir, onEchap });
  rappels.current = { onPoste, onSortir, onEchap };
  const { directions, nav, position, route, visee, aller, marcherVers, arrivee } = usePlanInterieur(plan, rappels);
  const decor = useMemo(() => <Decor faites={faites} cycle={cycle} />, [Decor, faites, cycle]);
  const hote = useMemo(() => ({ ...mentor, nom: programme.mentor.nom }), [mentor, programme.mentor.nom]);
  const decalage = decalageCamera(camera);
  const etapeEnCours = seance?.slug === programme.slug ? seance.etape : Math.min(faites, programme.etapes.length - 1);
  const libelleMentor = plan.libelles.mentor ?? programme.mentor.nom;
  return <section className={`fixed inset-0 z-[100] bg-[#2a2219] ${POLICES_JEU} hud-texte`} aria-label={`Dans ${nom}`}>
    <Canvas shadows dpr={1} camera={{ position: [plan.depart[0] + decalage[0], decalage[1], plan.depart[1] + decalage[2]], fov: 46, near: .1, far: 260 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <FluiditeMonde qualite={qualite} actif rayonOcclusion={.5} />
      <RefletsMonde intensite={plan.ambiance === 'interieur' ? .3 : .45} />
      <ScenePlan plan={plan} decor={decor} hote={hote} postes={postes}
        directions={directions} position={position} route={route} visee={visee} avancer={nav.avancer} camera={camera} onArrivee={arrivee} onPoste={aller} onSol={marcherVers} />
    </Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="hud-verre pointer-events-auto min-w-0 max-w-[min(430px,calc(100%-112px))] px-4 py-3">
        <span className="hud-legende text-jeu-or">{nom} · {programme.titre}</span>
        <h2 className="hud-titre truncate text-lg leading-tight sm:text-2xl">{programme.etapes[etapeEnCours].nom}</h2>
        <p className="text-[12px] text-jeu-ivoire/70">Étape {etapeEnCours + 1} sur {programme.etapes.length} · {programme.cycle} {cycle + 1}</p>
        <FriseLieu programme={programme} etape={etapeEnCours} />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button onClick={onProgramme} className="hud-bouton hud-bouton-verre px-3 py-1.5 text-[12px]">📋 Programme</button>
          {filRouge && <button onClick={filRouge.onOuvrir} className="hud-bouton hud-bouton-or px-3 py-1.5 text-[12px]">📜 Fil rouge</button>}
          {!demo && <Link href={href} className="hud-bouton hud-bouton-verre px-3 py-1.5 text-[12px]">Services du lieu →</Link>}
        </div>
      </div>
      <button onClick={onSortir} className="hud-bouton hud-bouton-principal pointer-events-auto shrink-0 px-4 py-3 text-sm">🚪 Sortir</button>
    </header>
    <aside aria-label="Séance du jour" className="hud-verre absolute left-3 top-[188px] hidden w-[300px] p-3.5 sm:left-5 sm:block">
      {filRouge?.seance ? <>
        <p className="hud-legende text-jeu-or">Fil rouge · {filRouge.titre}</p>
        <ol className="mt-2 space-y-1">{filRouge.seance.taches.map(t => {
          const faite = filRouge.seance!.scores[t.id] !== undefined;
          return <li key={t.id}><button disabled={faite} onClick={() => aller(t.zone)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${faite ? 'text-jeu-ivoire/50' : 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40 hover:bg-jeu-or/20'}`}>
            <PastilleTache score={filRouge.seance!.scores[t.id]} petite />
            <span className="min-w-0 flex-1 truncate">{t.titre}</span><span className="shrink-0 text-[10.5px] font-medium text-jeu-ivoire/45">{plan.libelles[t.zone]}</span>
          </button></li>;
        })}
          <li><button disabled={!filRouge.bilan} onClick={() => aller('mentor')} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${filRouge.bilan ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'text-jeu-ivoire/40'}`}><span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]" />Bilan avec {libelleMentor}</button></li>
        </ol>
      </> : seance?.slug === programme.slug ? <>
        <p className="hud-legende text-jeu-or">Séance · {programme.etapes[seance.etape].nom}</p>
        <ol className="mt-2 space-y-1">{seance.taches.map(t => {
          const faite = seance.scores[t.id] !== undefined;
          return <li key={t.id}><button disabled={faite} onClick={() => aller(t.zone)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${faite ? 'text-jeu-ivoire/50' : 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40 hover:bg-jeu-or/20'}`}>
            <PastilleTache score={seance.scores[t.id]} petite />
            <span className="min-w-0 flex-1 truncate">{t.titre}</span><span className="shrink-0 text-[10.5px] font-medium text-jeu-ivoire/45">{plan.libelles[t.zone]}</span>
          </button></li>;
        })}
          <li><button disabled={statut !== 'bilan'} onClick={() => aller('mentor')} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${statut === 'bilan' ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'text-jeu-ivoire/40'}`}><span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]" />Bilan avec {libelleMentor}</button></li>
        </ol>
      </> : <p className="text-[12.5px] leading-relaxed text-jeu-ivoire/75">
        {statut === 'disponible' ? <>Pas de séance en cours. <button onClick={() => aller('mentor')} className="font-bold text-jeu-or underline">Va voir {libelleMentor}</button> pour commencer l’étape du jour.</> : statut === 'repos' ? 'Séance du jour terminée : reviens demain pour l’étape suivante. Tu peux visiter librement.' : `Fermé pour l’instant : les séances ont lieu de ${heureLisible(programme.horaires.ouverture)} à ${heureLisible(programme.horaires.fermeture)}. Tu peux visiter librement.`}
        {(statut === 'repos' || statut === 'ferme') && <button onClick={onAttendre} className="hud-bouton hud-bouton-verre mt-2.5 w-full px-3 py-2 text-[12.5px]">⏭ {statut === 'repos' ? 'Revenir demain' : 'Attendre l’ouverture'} · {heureLisible(programme.horaires.ouverture)}</button>}
      </p>}
      {filRouge && !filRouge.seance && <div className="mt-3 rounded-xl bg-jeu-or/[.12] p-2.5 text-[12.5px] ring-1 ring-jeu-or/40">
        <p className="hud-legende text-jeu-or">Fil rouge · Résidence Akwaba</p>
        <p className="mt-1 font-semibold">{filRouge.titre}</p>
        <button onClick={filRouge.onOuvrir} className="mt-1 font-bold text-jeu-or underline">Ouvrir le chapitre</button>
      </div>}
    </aside>
    <CroixDirections directions={directions} />
    <p className="hud-verre pointer-events-none absolute bottom-5 right-5 hidden rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 sm:block">Clique le sol ou une balise · ZQSD / flèches · Échap pour sortir</p>
    {children}
  </section>;
}
