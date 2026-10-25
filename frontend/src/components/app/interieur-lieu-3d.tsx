'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LIBELLES_JAUGES, type JaugeBesoin } from '@/lib/lieux-vie';
import { articleMaison } from '@/lib/lieux-vie/maison';
import { actionSelonHeure, avancement, COUTS_BESOINS, EFFETS_DEMO, objetsPour, type ActionObjet, type BesoinServeur, type EffetBesoins, type ObjetInterieur } from '@/lib/objets-interieurs';
import type { InteractionsInterieur, UsageObjet } from './objets-interieurs-3d';
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
  residence: { sol: '#aa8968', mur: '#eadcc9', accent: '#77906a', objets: 'detente' },
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
  return <button aria-label={d} className="hud-verre hud-bouton h-11 w-11 rounded-xl text-lg" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); directions.add(d); actualiser(v => v + 1); }} onPointerUp={() => { directions.delete(d); actualiser(v => v + 1); }} onPointerCancel={() => { directions.delete(d); actualiser(v => v + 1); }}>{symbole}</button>;
}

const JAUGE_BESOIN: Record<BesoinServeur, string> = { repos: 'Énergie', repas: 'Faim', social: 'Social', hygiene: 'Hygiène', divertissement: 'Loisirs' };

/** Ce que coûte et rapporte une action, affiché avant de la lancer (et le temps de jeu qu'elle prend). */
function effetAction(action: ActionObjet, demo: boolean) {
  if (!action.besoin) return 'Moment de vie · sans effet sur les jauges';
  const article = articleMaison(action.article);
  const prix = (cout: number) => cout ? `${cout.toLocaleString('fr-FR')} F` : 'Gratuit';
  const temps = action.heures ? ` · ${action.heures} h passe${action.heures > 1 ? 'nt' : ''}` : '';
  if (article) return `${prix(article.prix)} · ${(Object.entries(article.effets) as [JaugeBesoin, number][]).map(([j, n]) => `+${n} ${LIBELLES_JAUGES[j].nom}`).join(', ')}${temps}${demo ? ' (démo)' : ''}`;
  return `${prix(COUTS_BESOINS[action.besoin])} · ${JAUGE_BESOIN[action.besoin]} au maximum${temps}${demo ? ' (démo)' : ''}`;
}

export interface ProprietesInterieur {
  slug: string; nom: string; onSortir: () => void; children?: ReactNode; demo?: boolean; onDemo?: (effet: EffetBesoins) => void;
  /** Démonstration : un article de la maison payé et consommé, avec ses effets réels ; renvoie le motif d'un refus. */
  onDemoArticle?: (article: string) => string | null;
  /** Le joueur s'est réveillé dans son lit (la nuit, ou la sieste, peut passer). */
  onDormi?: () => void;
  /** Le soir venu, le lit offre la nuit complète ; le jour, une sieste. */
  nuit?: boolean;
  /** Une action a fait passer des heures de jeu (la télé). */
  onTempsPasse?: (heures: number) => void;
}

export function InterieurLieu3D(props: ProprietesInterieur) {
  if(props.slug==='universite')return <CampusUniversitaire onSortir={props.onSortir}>{props.children}</CampusUniversitaire>;
  return <InterieurStandard {...props}/>;
}

function InterieurStandard({ slug, nom, onSortir, children, demo, onDemo, onDemoArticle, onDormi, nuit = true, onTempsPasse }: ProprietesInterieur) {
  const directions = useMemo(() => new Set<Direction>(), []);
  const [activites, setActivites] = useState(false);
  const residence = slug === 'residence';
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
  // Meubles utilisables : choix d'un meuble, trajet, action chronométrée, puis effet sur les besoins.
  const objets = useMemo(() => objetsPour(slug, autreFamille), [slug, autreFamille]);
  const [selection, setSelection] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageObjet | null>(null);
  const [progres, setProgres] = useState(0);
  const [retour, setRetour] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const connecte = useAuthStore(s => Boolean(s.user));
  const estDemo = demo ?? !connecte;
  const client = useQueryClient();
  const agir = useMutation({
    mutationFn: ({ besoin, article }: { besoin: BesoinServeur; article?: string }) => api.post<{ message: string; carriere: Record<string, unknown>; coutPaye: number }>(`/carriere/besoins/${besoin}`, article ? { article } : undefined),
    onSuccess: res => {
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ({ ...ancienne, ...res.carriere }));
      client.invalidateQueries({ queryKey: ['carriere', 'me'] });
    },
  });
  const etat = useRef({ usage, selection, estDemo, mutate: agir.mutate, onDemo, onDemoArticle, onDormi, onTempsPasse });
  etat.current = { usage, selection, estDemo, mutate: agir.mutate, onDemo, onDemoArticle, onDormi, onTempsPasse };
  const objetChoisi = objets.find(o => o.id === selection) ?? null;
  // Sur téléphone, le panneau des pièces se replie pour laisser voir (et toucher) les meubles.
  const [panneauOuvert, setPanneauOuvert] = useState(() => objets.length === 0 || typeof window === 'undefined' || window.matchMedia?.('(min-width: 640px)').matches !== false);
  const lancer = (objet: ObjetInterieur, action: ActionObjet) => {
    directions.clear(); setSelection(null); setRetour(null); setDestination(null);
    setUsage({ objet, action, phase: 'trajet', debut: 0 });
  };
  const annuler = useCallback(() => { if (etat.current.usage) setRetour({ texte: 'Action interrompue.' }); setUsage(null); }, []);
  const accesAtteint = useCallback(() => {
    const u = etat.current.usage;
    if (!u || u.phase !== 'trajet') return;
    // En démonstration aussi, l'article de la maison se paie au début : un solde insuffisant arrête tout.
    const refus = u.action.article && etat.current.estDemo ? etat.current.onDemoArticle?.(u.action.article) : null;
    if (refus) { setUsage(null); setRetour({ texte: refus, erreur: true }); return; }
    setUsage({ ...u, phase: 'action', debut: Date.now() });
    // Le serveur est sollicité au début : un refus (solde insuffisant…) arrête l'action tout de suite.
    if (u.action.besoin && !etat.current.estDemo) etat.current.mutate({ besoin: u.action.besoin, article: u.action.article }, {
      onError: e => { setUsage(null); setRetour({ texte: e instanceof Error && e.message ? e.message : 'Action impossible. Réessaie.', erreur: true }); },
    });
  }, []);
  useEffect(() => {
    if (usage?.phase !== 'action') { setProgres(0); return; }
    const minuteur = window.setInterval(() => {
      const a = avancement(usage.debut, Date.now(), usage.action.duree);
      setProgres(a);
      if (a < 1) return;
      window.clearInterval(minuteur);
      setUsage(null);
      const { besoin, message, article: idArticle } = usage.action, article = articleMaison(idArticle);
      const cout = article ? article.prix : besoin ? COUTS_BESOINS[besoin] : 0;
      if (besoin && etat.current.estDemo) {
        if (!(article && etat.current.onDemoArticle)) etat.current.onDemo?.(EFFETS_DEMO[besoin]);
        setRetour({ texte: `${message} (démo : rien n'est sauvegardé)` });
      } else setRetour({ texte: cout ? `${message} · −${cout.toLocaleString('fr-FR')} F` : message });
      if (usage.action.id === 'dormir') etat.current.onDormi?.();
      if (usage.action.heures) etat.current.onTempsPasse?.(usage.action.heures);
    }, 120);
    return () => window.clearInterval(minuteur);
  }, [usage]);
  useEffect(() => { if (!retour) return; const t = window.setTimeout(() => setRetour(null), 6000); return () => window.clearTimeout(t); }, [retour]);
  const interactions: InteractionsInterieur = { objets, selection, usage, onChoisir: id => { if (!etat.current.usage) setSelection(id); }, onAccesAtteint: accesAtteint, onAnnule: annuler };
  const stationArrivee = (universite || bureau || autreFamille) ? points.find(p => p.detail === description) : undefined;
  const sortirRef = useRef(onSortir);
  sortirRef.current = onSortir;
  useEffect(() => {
    const changer = (event: KeyboardEvent, actif: boolean) => { const d = TOUCHES[event.code]; if (!d) return; event.preventDefault(); actif ? directions.add(d) : directions.delete(d); };
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return; if (e.code === 'Escape') { if (etat.current.selection) setSelection(null); else if (etat.current.usage) annuler(); else sortirRef.current(); } else changer(e, true); };
    const up = (e: KeyboardEvent) => changer(e, false);
    const clear = () => directions.clear();
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); directions.clear(); };
  }, [directions, annuler]);
  return <section className={`fixed inset-0 z-[100] bg-[#2a2219] ${POLICES_JEU} hud-texte`} aria-label={`Dans ${nom}`}>
    <Canvas shadows dpr={1} camera={{ position: [5.8, 5.5, 10.3], fov: 52 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}><FluiditeMonde qualite={qualite} actif rayonOcclusion={.45} /><RefletsMonde/>{universite ? <UniversiteRealiste directions={directions} destination={destination} onArrivee={setDescription} /> : bureau ? <BureauxRealistes type={bureau} directions={directions} destination={destination} onArrivee={setDescription} /> : residence ? <ResidenceRealiste directions={directions} destination={destination} onArrivee={setDescription} interactions={interactions} /> : autreFamille ? <AutresLieuxRealistes slug={slug} directions={directions} destination={destination} onArrivee={setDescription} interactions={interactions} /> : <Salle slug={slug} nom={nom} directions={directions} />}</Canvas>
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5"><div className="hud-verre pointer-events-auto min-w-0 px-4 py-2.5"><span className="hud-legende text-jeu-or">Intérieur visitable</span><h2 className="hud-titre truncate text-lg leading-tight sm:text-2xl">{nom}</h2><p className="text-[11.5px] text-jeu-ivoire/65">Déplacez-vous librement dans le bâtiment</p></div><button onClick={onSortir} className="hud-bouton hud-bouton-principal pointer-events-auto shrink-0 px-4 py-3 text-sm">🚪 Sortir</button></header>
    <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-1.5"><span /><Bouton d="avant" symbole="▲" directions={directions} /><span /><Bouton d="gauche" symbole="◀" directions={directions} /><Bouton d="arriere" symbole="▼" directions={directions} /><Bouton d="droite" symbole="▶" directions={directions} /></div>
    <button onClick={() => { directions.clear(); setActivites(v => !v); }} aria-expanded={activites} className="hud-bouton hud-bouton-or absolute right-4 top-28 px-4 py-3 text-sm">{activites ? 'Fermer les activités' : 'Services et activités'}</button>
    {universite && <button className="hud-verre hud-bouton absolute right-4 top-44 px-3 py-3 text-sm" onClick={()=>{setCameraLibre(v=>!v);window.dispatchEvent(new Event('campus-camera'));}}>{cameraLibre ? 'Revenir au joueur' : 'Caméra libre · tourner / zoomer'}</button>}
    {activites && children}
    {!activites && <div className="hud-verre absolute left-3 right-3 top-44 max-h-[calc(100dvh-20rem)] overflow-y-auto p-3.5 sm:left-5 sm:right-auto sm:top-32 sm:max-h-[calc(100dvh-16rem)] sm:w-72">
      <button type="button" aria-expanded={panneauOuvert} onClick={() => setPanneauOuvert(v => !v)} className="hud-legende flex w-full items-center justify-between gap-2 text-left text-jeu-or">{universite ? 'Campus · 2 niveaux' : bureau ? 'Espaces de travail' : autreFamille ? 'Espaces du bâtiment' : 'Votre appartement'}<span aria-hidden="true">{panneauOuvert ? '▴' : '▾'}</span></button>
      {panneauOuvert && <>
      <div className="mt-2 grid grid-cols-2 gap-2">{points.map((piece, index) => <button key={piece.id} className="hud-bouton hud-bouton-verre justify-start px-3 py-2 text-left text-sm" onClick={() => { directions.clear(); setFiche(false); setUsage(null); setSelection(null); setDestination(v => v === null ? index : (Math.floor(v / points.length) + 1) * points.length + index); setDescription(`En route vers : ${piece.label.toLowerCase()}…`); }}>{piece.label}</button>)}</div>
      <p role="status" className="mt-2 text-xs leading-relaxed text-jeu-ivoire/75">{description}</p>
      {objets.length > 0 && <>
        <p className="mt-1 text-xs font-bold text-jeu-or">Touche un meuble pour interagir.</p>
        {/* Même choix depuis la liste : utile quand un meuble est masqué, et accessible au clavier. */}
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Meubles utilisables">{objets.map(o => <button key={o.id} disabled={Boolean(usage)} aria-pressed={selection === o.id} onClick={() => setSelection(o.id)} className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${selection === o.id ? 'border-transparent bg-[linear-gradient(180deg,#EE7A4E,#CF532D)] text-white' : 'border-white/15 bg-white/[.06] text-jeu-ivoire hover:border-jeu-or/50'}`}>{o.actions[0].icone} {o.nom}</button>)}</div>
      </>}
      {universite && <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]"><span>XP<br/><b className="text-amber-200">{etatCampus.xp}</b></span><span>Focus<br/><b className="text-emerald-300">{etatCampus.concentration}%</b></span><span>Social<br/><b className="text-sky-300">{etatCampus.social}%</b></span></div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/70">{etatCampus.derniereAction}</p>
      </div>}
      {universite && stationArrivee && <AtelierCampus key={stationArrivee.id} station={stationArrivee.id} onReussite={() => setEtatCampus(etat => ({...realiserActivite(etat, stationArrivee.id), derniereAction: 'Exercice réussi : réponse validée avec le responsable.'}))} />}
      {!universite && stationArrivee && !fiche && <button className="hud-bouton hud-bouton-principal mt-3 w-full p-2 text-sm" onClick={() => setFiche(true)}>Consulter la fiche du poste</button>}
      {!universite && stationArrivee && fiche && <FichePosteBureau key={stationArrivee.id} station={stationArrivee.id} onFermer={() => setFiche(false)} />}
      </>}
    </div>}
    {objetChoisi && !usage && <section aria-label={`Actions : ${objetChoisi.nom}`} className="hud-verre absolute inset-x-3 bottom-3 z-30 mx-auto max-w-md p-4 sm:left-auto sm:right-5 sm:mx-0 sm:w-[340px]">
      <div className="flex items-start justify-between gap-3"><div><p className="hud-legende text-jeu-or">Que veux-tu faire ?</p><h2 className="hud-titre text-xl leading-tight">{objetChoisi.nom}</h2></div><button aria-label="Fermer le menu" onClick={() => setSelection(null)} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button></div>
      <div className="mt-3 grid gap-2">{objetChoisi.actions.map(choix => actionSelonHeure(choix, nuit)).map(action => <button key={action.id} onClick={() => lancer(objetChoisi, action)} className={`hud-bouton w-full flex-col items-start p-3 text-left text-sm ${action.besoin ? 'hud-bouton-principal' : 'hud-bouton-verre'}`}>
        <span>{action.icone} {action.label}</span>
        <span className="mt-0.5 text-[11.5px] font-semibold opacity-85">{effetAction(action, estDemo)} · {action.duree} s</span>
      </button>)}</div>
    </section>}
    {usage && <div role="status" className="hud-verre absolute inset-x-3 bottom-[176px] z-30 mx-auto max-w-sm px-4 py-3 sm:bottom-24">
      <div className="flex items-center justify-between gap-3"><strong className="text-sm">{usage.action.icone} {usage.phase === 'trajet' ? `En route : ${usage.objet.nom.toLowerCase()}` : usage.action.label}</strong><button onClick={annuler} className="hud-bouton hud-bouton-verre shrink-0 rounded-full px-3 py-1 text-xs">Arrêter</button></div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[linear-gradient(90deg,#2F9C84,#4CC3A5)]" style={{ width: `${Math.round(progres * 100)}%` }} /></div>
    </div>}
    {retour && !usage && <p role={retour.erreur ? 'alert' : 'status'} className={`hud-verre hud-entree absolute inset-x-3 bottom-[176px] z-30 mx-auto w-fit max-w-[calc(100%-24px)] rounded-full px-4 py-2 text-center text-[12.5px] font-semibold leading-snug sm:bottom-24 ${retour.erreur ? 'text-[#F08A4B]' : ''}`}>{retour.texte}</p>}
    <p className="hud-verre pointer-events-none absolute bottom-5 right-5 hidden rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 sm:block">ZQSD / flèches · Échap pour sortir</p>
  </section>;
}
