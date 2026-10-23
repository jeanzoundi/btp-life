'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { avancerInterieur, MOBILIER_INTERIEUR } from '@/lib/navigation-interieur';
import * as THREE from 'three';
import { ResidenceRealiste } from './residence-realiste';
import { POINTS_RESIDENCE } from '@/lib/plan-residence';
import { BureauxRealistes } from './bureaux-realistes';
import { STATIONS_BUREAUX, type TypeBureau } from '@/lib/plan-bureaux';
import { FichePosteBureau } from './fiche-poste-bureau';
import { AutresLieuxRealistes, familleLieu, stationsLieu } from './autres-lieux-realistes';
import { UniversiteRealiste } from './universite-realiste';
import { POINTS_UNIVERSITE } from '@/lib/plan-universite';
import { AtelierCampus } from './atelier-campus';
import { CampusUniversitaire } from './campus-universitaire';
import { RefletsMonde } from './reflets-monde';
import { FluiditeMonde } from './fluidite-monde';
import { qualiteMemorisee } from '@/lib/fluidite-monde';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { SurfaceBloc } from './materiaux-monde';
import { ACTIVITES_UNIVERSITE, ETAT_CAMPUS_INITIAL, realiserActivite } from '@/lib/activites-universite';

type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
type Theme = { sol: string; mur: string; accent: string; objets: 'bureau' | 'chantier' | 'detente' | 'commerce' };

const THEMES: Record<string, Theme> = {
  universite: { sol: '#b7aa94', mur: '#e8ddc9', accent: '#315f68', objets: 'bureau' },
  entreprise: { sol: '#8d999b', mur: '#dce2df', accent: '#31505c', objets: 'bureau' },
  'bureau-etudes': { sol: '#aaa79e', mur: '#e8e4d9', accent: '#486b78', objets: 'bureau' },
  chantier: { sol: '#9b907a', mur: '#c9c2b2', accent: '#e5ad32', objets: 'chantier' },
  'construction-nord': { sol: '#9b907a', mur: '#c9c2b2', accent: '#e5ad32', objets: 'chantier' },
  residence: { sol: '#aa8968', mur: '#eadcc9', accent: '#77906a', objets: 'detente' },
  'jardins-residence': { sol: '#aa8968', mur: '#eadcc9', accent: '#77906a', objets: 'detente' },
  maquis: { sol: '#a86d49', mur: '#efd5b5', accent: '#c8563f', objets: 'detente' },
  cafe: { sol: '#806550', mur: '#e7d4be', accent: '#73864e', objets: 'detente' },
};

const TOUCHES: Record<string, Direction | undefined> = { KeyW: 'avant', KeyZ: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere', KeyA: 'gauche', KeyQ: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite' };

function Boite({ p, s, c, metal = 0 }: { p: [number, number, number]; s: [number, number, number]; c: string; metal?: number }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><SurfaceBloc dimensions={s} couleur={c} metal={metal}/></mesh>;
}

function Mobilier({ theme }: { theme: Theme }) {
  return <>{MOBILIER_INTERIEUR.map(({ x, z }) => <group key={x} position={[x, 0, z]}>
    {theme.objets === 'bureau' && <><Boite p={[0, 0.9, 0]} s={[2.7, 0.15, 1.3]} c="#9a754e" /><Boite p={[0, 1.65, -0.38]} s={[1.45, 1.05, 0.09]} c="#233e49" metal={0.18} /><Boite p={[0, 0.48, 1]} s={[1.1, 0.95, 1]} c={theme.accent} /></>}
    {theme.objets === 'chantier' && <><Boite p={[0, 0.62, 0]} s={[1.7, 1.24, 1.55]} c="#b96d43" /><mesh position={[0, 1.55, 0]} castShadow><cylinderGeometry args={[0.62, 0.62, 0.15, 20]} /><meshStandardMaterial color={theme.accent} /></mesh><Boite p={[0, 1.1, 1.6]} s={[2.1, 0.12, 1.1]} c="#d8c38e" /></>}
    {theme.objets === 'detente' && <><Boite p={[0, 0.5, 0]} s={[2.7, 1, 1.35]} c={theme.accent} /><Boite p={[0, 1, -0.58]} s={[2.7, 1.25, 0.22]} c={theme.accent} /><mesh position={[0, 0.95, 1.8]} castShadow><cylinderGeometry args={[0.8, 0.8, 0.15, 24]} /><meshStandardMaterial color="#d3b37c" /></mesh></>}
    {theme.objets === 'commerce' && <><Boite p={[0, 1.35, -0.8]} s={[2.35, 2.7, 0.65]} c={theme.accent} /><Boite p={[0, 0.75, 1.2]} s={[2.2, 1.5, 1.2]} c="#b78d59" /></>}
  </group>)}</>;
}

function AvatarInterieur({ directions }: { directions: Set<Direction> }) {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree(s => s.camera);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const dx = Number(directions.has('droite')) - Number(directions.has('gauche'));
    const dz = Number(directions.has('arriere')) - Number(directions.has('avant'));
    if (dx || dz) {
      const mouvement = new THREE.Vector3(dx, 0, dz).normalize();
      const prochain = avancerInterieur(ref.current.position, dx, dz, delta);
      ref.current.position.x = prochain.x;
      ref.current.position.z = prochain.z;
      ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z);
    }
    const cible = new THREE.Vector3(ref.current.position.x * 0.25, 9, 10);
    camera.position.lerp(cible, 1 - Math.exp(-4 * delta));
    camera.lookAt(ref.current.position.x, 1.25, ref.current.position.z);
  });
  return <group ref={ref} position={[0, 0, 3.5]}>
    <mesh position={[0, 1.3, 0]} castShadow><capsuleGeometry args={[0.32, 0.75, 6, 10]} /><meshStandardMaterial color="#d9a326" /></mesh>
    <mesh position={[0, 2.15, 0]} castShadow><sphereGeometry args={[0.34, 16, 12]} /><meshStandardMaterial color="#8d5524" /></mesh>
    <mesh position={[0, 2.42, -0.05]} scale={[1, 0.45, 1]} castShadow><sphereGeometry args={[0.35, 14, 10]} /><meshStandardMaterial color="#241711" /></mesh>
    {[-0.18, 0.18].map(x => <mesh key={x} position={[x, 0.48, 0]} castShadow><capsuleGeometry args={[0.13, 0.55, 5, 8]} /><meshStandardMaterial color="#27384b" /></mesh>)}
  </group>;
}

function Salle({ slug, nom, directions }: { slug: string; nom: string; directions: Set<Direction> }) {
  const theme = THEMES[slug] ?? { sol: '#aaa08f', mur: '#e5ddcf', accent: '#496c6b', objets: 'commerce' as const };
  return <><color attach="background" args={['#16282d']} /><fog attach="fog" args={['#16282d', 22, 42]} />
    <ambientLight intensity={0.75} /><hemisphereLight args={['#fff0d7', '#4c4036', 1.1]} /><directionalLight castShadow intensity={2.5} position={[4, 9, 6]} shadow-mapSize-width={1536} shadow-mapSize-height={1536} />
    <group><Boite p={[0, -0.18, 0]} s={[12, 0.36, 9]} c={theme.sol} /><Boite p={[0, 3, -4.35]} s={[12, 6, 0.3]} c={theme.mur} /><Boite p={[-5.85, 3, 0]} s={[0.3, 6, 9]} c={theme.mur} /><Boite p={[5.85, 3, 0]} s={[0.3, 6, 9]} c={theme.mur} />
      {[-3.6, 0, 3.6].map(x => <group key={x}><Boite p={[x, 3.1, -4.14]} s={[2.4, 1.7, 0.08]} c="#315866" metal={0.15} /><Boite p={[x, 3.1, -4.08]} s={[0.06, 1.7, 0.05]} c="#d7d3c8" /></group>)}
      <Mobilier theme={theme} /><Text position={[0, 5.1, -4.12]} fontSize={0.55} color="#24383b" anchorX="center">{nom}</Text>
      {/* Mur avant en coupe pour conserver la visibilité du personnage. */}
      <group position={[0, 0, 4.15]}><Boite p={[-2.8, 0.3, 0]} s={[4.2, 0.6, 0.25]} c={theme.mur} /><Boite p={[2.8, 0.3, 0]} s={[4.2, 0.6, 0.25]} c={theme.mur} /><Boite p={[0, 0.03, 0]} s={[1.4, 0.06, 0.5]} c="#d6b36d" /></group>
      <AvatarInterieur directions={directions} />
    </group>
  </>;
}

function Bouton({ d, symbole, directions }: { d: Direction; symbole: string; directions: Set<Direction> }) {
  const [, actualiser] = useState(0);
  return <button aria-label={d} className="hud-bouton h-11 w-11 bg-creme text-lg text-encre" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); directions.add(d); actualiser(v => v + 1); }} onPointerUp={() => { directions.delete(d); actualiser(v => v + 1); }} onPointerCancel={() => { directions.delete(d); actualiser(v => v + 1); }}>{symbole}</button>;
}

export function InterieurLieu3D(props: { slug: string; nom: string; onSortir: () => void; children?: ReactNode }) {
  if(props.slug==='universite')return <CampusUniversitaire onSortir={props.onSortir}>{props.children}</CampusUniversitaire>;
  return <InterieurStandard {...props}/>;
}

function InterieurStandard({ slug, nom, onSortir, children }: { slug: string; nom: string; onSortir: () => void; children?: ReactNode }) {
  const directions = useMemo(() => new Set<Direction>(), []);
  const [activites, setActivites] = useState(false);
  const residence = slug === 'residence' || slug === 'jardins-residence';
  const universite = slug === 'universite';
  const bureau: TypeBureau | null = slug === 'entreprise' || slug === 'bureau-etudes' ? slug : null;
  const autreFamille = familleLieu(slug);
  const points = universite ? POINTS_UNIVERSITE : bureau ? STATIONS_BUREAUX[bureau] : autreFamille ? stationsLieu(autreFamille) : POINTS_RESIDENCE;
  const [fiche, setFiche] = useState(false);
  const [cameraLibre, setCameraLibre] = useState(false);
  const [etatCampus, setEtatCampus] = useState(ETAT_CAMPUS_INITIAL);
  const [destination, setDestination] = useState<number | null>(null);
  const [description, setDescription] = useState('Choisissez une pièce pour vous y rendre.');
  const [qualite] = useState(qualiteMemorisee);
  const stationArrivee = (universite || bureau || autreFamille) ? points.find(p => p.detail === description) : undefined;
  const sortirRef = useRef(onSortir);
  sortirRef.current = onSortir;
  useEffect(() => {
    const changer = (event: KeyboardEvent, actif: boolean) => { const d = TOUCHES[event.code]; if (!d) return; event.preventDefault(); actif ? directions.add(d) : directions.delete(d); };
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return; if (e.code === 'Escape') sortirRef.current(); else changer(e, true); };
    const up = (e: KeyboardEvent) => changer(e, false);
    const clear = () => directions.clear();
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); directions.clear(); };
  }, [directions]);
  return <section className={`fixed inset-0 z-[100] bg-[#2a2219] ${POLICES_JEU} hud-texte`} aria-label={`Dans ${nom}`}>
    <Canvas shadows dpr={1} camera={{ position: [5.8, 5.5, 10.3], fov: 52 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}><FluiditeMonde qualite={qualite} actif rayonOcclusion={.45} /><RefletsMonde/>{universite ? <UniversiteRealiste directions={directions} destination={destination} onArrivee={setDescription} /> : bureau ? <BureauxRealistes type={bureau} directions={directions} destination={destination} onArrivee={setDescription} /> : residence ? <ResidenceRealiste directions={directions} destination={destination} onArrivee={setDescription} /> : autreFamille ? <AutresLieuxRealistes slug={slug} directions={directions} destination={destination} onArrivee={setDescription} /> : <Salle slug={slug} nom={nom} directions={directions} />}</Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5"><div className="hud-carte pointer-events-auto min-w-0 px-3 py-2"><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-mangue">Intérieur visitable</span><h2 className="hud-titre truncate text-lg font-normal leading-tight sm:text-2xl">{nom}</h2><p className="text-[11px] font-bold text-encre/70">Déplacez-vous librement dans le bâtiment</p></div><button onClick={onSortir} className="hud-bouton pointer-events-auto shrink-0 bg-mangue px-4 py-3 text-sm text-encre">🚪 Sortir</button></header>
    <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-1.5"><span /><Bouton d="avant" symbole="▲" directions={directions} /><span /><Bouton d="gauche" symbole="◀" directions={directions} /><Bouton d="arriere" symbole="▼" directions={directions} /><Bouton d="droite" symbole="▶" directions={directions} /></div>
    <button onClick={() => { directions.clear(); setActivites(v => !v); }} aria-expanded={activites} className="hud-bouton absolute right-4 top-28 bg-foret px-4 py-3 text-sm text-creme">{activites ? 'Fermer les activités' : 'Services et activités'}</button>
    {universite && <button className="hud-bouton absolute right-4 top-44 bg-white px-3 py-3 text-sm text-encre" onClick={()=>{setCameraLibre(v=>!v);window.dispatchEvent(new Event('campus-camera'));}}>{cameraLibre ? 'Revenir au joueur' : 'Caméra libre · tourner / zoomer'}</button>}
    {activites && children}
    {!activites && <div className="absolute left-3 right-3 top-44 max-h-[calc(100dvh-20rem)] overflow-y-auto rounded-[14px] border-[2.4px] border-encre bg-encre/95 p-3 text-creme shadow-[4px_4px_0_0_rgba(11,46,31,.45)] sm:left-5 sm:right-auto sm:top-32 sm:max-h-[calc(100dvh-16rem)] sm:w-64">
      <p className="hud-titre text-xs font-normal tracking-wider text-mangue">{universite ? 'Campus · 2 niveaux' : bureau ? 'Espaces de travail' : autreFamille ? 'Espaces du bâtiment' : 'Votre appartement'}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">{points.map((piece, index) => <button key={piece.id} className="rounded-[10px] border-2 border-encre bg-creme px-3 py-2 text-left text-sm font-extrabold text-encre shadow-[2px_2px_0_0_rgba(0,0,0,.35)] hover:bg-[#ffe3bd]" onClick={() => { directions.clear(); setFiche(false); setDestination(v => v === null ? index : (Math.floor(v / points.length) + 1) * points.length + index); setDescription(`En route vers : ${piece.label.toLowerCase()}…`); }}>{piece.label}</button>)}</div>
      <p role="status" className="mt-2 text-xs leading-relaxed text-creme/75">{description}</p>
      {universite && <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]"><span>XP<br/><b className="text-amber-200">{etatCampus.xp}</b></span><span>Focus<br/><b className="text-emerald-300">{etatCampus.concentration}%</b></span><span>Social<br/><b className="text-sky-300">{etatCampus.social}%</b></span></div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/70">{etatCampus.derniereAction}</p>
      </div>}
      {universite && stationArrivee && <AtelierCampus key={stationArrivee.id} station={stationArrivee.id} onReussite={() => setEtatCampus(etat => ({...realiserActivite(etat, stationArrivee.id), derniereAction: 'Exercice réussi : réponse validée avec le responsable.'}))} />}
      {!universite && stationArrivee && !fiche && <button className="hud-bouton mt-3 w-full bg-mangue p-2 text-sm text-encre" onClick={() => setFiche(true)}>Consulter la fiche du poste</button>}
      {!universite && stationArrivee && fiche && <FichePosteBureau key={stationArrivee.id} station={stationArrivee.id} onFermer={() => setFiche(false)} />}
    </div>}
    <p className="hud-pastille pointer-events-none absolute bottom-5 right-5 hidden text-xs sm:inline-flex">ZQSD / flèches · Échap pour sortir</p>
  </section>;
}
