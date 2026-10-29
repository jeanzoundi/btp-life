'use client';

// La scène 3D du quartier : bâtiments, joueur, habitants, passants, concurrent du fil rouge, voisins en ligne et caméra.
// L'état du jeu (horloge, séances, chantier, panneaux, HUD) reste dans quartier-3d.tsx, qui lui passe tout par ses props.
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, MapControls, Text } from '@react-three/drei';
import { EclairageMonde } from './eclairage-monde';
import { HumainMonde } from './humain-monde';
import { orienterProgressivement } from '@/lib/fluidite-monde';
import { itineraireVille } from '@/lib/itineraire-ville';
import { decalageVue } from '@/lib/camera-monde';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { JoueurActif } from './autres-joueurs';
import { Architecture, PaysageLagune } from './ville-lagune';
import { HABITANTS } from './dialogue-personnage';
import { LIMITES_VILLE } from '@/lib/ville';
import { type Humeur } from './besoins';
import { BullePensee, Plumbob3D, usePenseePeriodique } from './humeur-monde';
import { Pluie } from './meteo-monde';
import { ambianceMeteo, type Meteo } from '@/lib/meteo-monde';
import { penseeJoueur, penseePnj, type ContextePensee } from '@/lib/pensees-monde';
import { EmoteJoueur3D, VoisinsEnLigne3D } from './monde-en-ligne';
import type { Emote, VoisinEnLigne } from '@/lib/en-ligne';
import { ChantierVivant, type ChargementLivraison } from './chantier-vivant';
import { bungalowChantier, postesChantier, type EtatVisuel, type PosteVille } from '@/lib/journee-chantier';
import { CAMPAGNE, PARCELLE_AKWABA } from '@/lib/campagne';
import { CONCURRENT, PENSEES_CONCURRENT, ROUTE_CONCURRENT, presenceConcurrent } from '@/lib/concurrent';
import { positionPlan, type PlanCamera } from '@/lib/plans-camera';
import { ImmeubleAkwaba } from './immeuble-akwaba';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import { creneauPnj, effetsMeteo, passantsPresents } from '@/lib/vie-urbaine';
import { HumainJoueur } from './personnage-joueur';
import { LIEUX_MONDE } from '@/lib/liens-modes';
import { EMPRISES_PALMIERS } from '@/lib/place-palmiers';
import type { IdentitePersonnage } from '@/lib/identites-personnages';

type Critique = { icone: string; label: string } | null;
// Chaque habitant garde son modèle : Yao est en tenue de chef de chantier, casque compris.
const IDENTITES_PNJ: Record<string, IdentitePersonnage> = { Awa: 'awa', Yao: 'yao', Mariam: 'mariam', Koffi: 'koffi', Fatou: 'fatou' };

export type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
export type PointMonde = [number, number];

export interface Batiment3D {
  slug: string; nom: string; href: string;
  position: [number, number, number]; taille: [number, number, number]; couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

export const BATIMENTS: Batiment3D[] = [
  { slug: 'universite', ...LIEUX_MONDE['universite'], position: [-29, 4, -23], taille: [17, 8, 12], couleur: '#d8c092', type: 'campus' },
  { slug: 'entreprise', ...LIEUX_MONDE['entreprise'], position: [29, 9, -24], taille: [13, 18, 11], couleur: '#53677a', type: 'tour' },
  { slug: 'chantier', ...LIEUX_MONDE['chantier'], position: [31, 2, 22], taille: [21, 4, 15], couleur: '#d97706', type: 'chantier' },
  { slug: 'residence', ...LIEUX_MONDE['residence'], position: [-31, 4, 22], taille: [15, 8, 12], couleur: '#b45309', type: 'maison' },
  { slug: 'maquis', ...LIEUX_MONDE['maquis'], position: [-11, 2.3, 31], taille: [10, 4.6, 8], couleur: '#be563c', type: 'commerce' },
  { slug: 'cafe', ...LIEUX_MONDE['cafe'], position: [10, 2.3, -34], taille: [10, 4.6, 8], couleur: '#6b7a3f', type: 'commerce' },
  { slug: 'banque', ...LIEUX_MONDE['banque'], position: [-41, 4, -1], taille: [12, 8, 10], couleur: '#d6bd75', type: 'campus' },
  { slug: 'fournisseur', ...LIEUX_MONDE['fournisseur'], position: [42, 3.5, -1], taille: [14, 7, 11], couleur: '#8e785e', type: 'commerce' },
  { slug: 'mairie', ...LIEUX_MONDE['mairie'], position: [-26, 4.5, -91], taille: [18, 9, 13], couleur: '#d8ccb2', type: 'campus' },
  { slug: 'laboratoire', ...LIEUX_MONDE['laboratoire'], position: [28, 3, -91], taille: [16, 6, 12], couleur: '#98b8ae', type: 'campus' },
  { slug: 'bureau-etudes', ...LIEUX_MONDE['bureau-etudes'], position: [0, 6, -114], taille: [16, 12, 10], couleur: '#6e8e99', type: 'tour' },
  { slug: 'jardins-residence', ...LIEUX_MONDE['jardins-residence'], position: [-88, 3, -33], taille: [14, 6, 12], couleur: '#d7b58b', type: 'maison' },
  { slug: 'marche', ...LIEUX_MONDE['marche'], position: [-88, 2, -58], taille: [16, 4, 10], couleur: '#b65d45', type: 'commerce' },
  { slug: 'atelier', ...LIEUX_MONDE['atelier'], position: [87, 3, -33], taille: [18, 6, 12], couleur: '#b1aa82', type: 'campus' },
  { slug: 'logistique', ...LIEUX_MONDE['logistique'], position: [88, 3, -54], taille: [22, 6, 14], couleur: '#788d99', type: 'campus' },
  { slug: 'agence', ...LIEUX_MONDE['agence'], position: [-88, 4.5, -88], taille: [14, 9, 12], couleur: '#a2b5a1', type: 'tour' },
  { slug: 'construction-nord', ...LIEUX_MONDE['construction-nord'], position: [87, 2, -88], taille: [20, 4, 16], couleur: '#c39b64', type: 'chantier' },
  { slug: 'centre-azur', ...LIEUX_MONDE['centre-azur'], position: [-84, 5, 24], taille: [28, 10, 18], couleur: '#88aeb2', type: 'commerce' },
  { slug: 'galerie-palmiers', ...LIEUX_MONDE['galerie-palmiers'], position: [84, 4, 25], taille: [26, 8, 18], couleur: '#c0936f', type: 'commerce' },
  { slug: 'marina', ...LIEUX_MONDE['marina'], position: [89, 2.5, 55], taille: [18, 5, 10], couleur: '#4b858c', type: 'commerce' },
  { slug: 'sports', ...LIEUX_MONDE['sports'], position: [-89, 3, 55], taille: [20, 6, 10], couleur: '#6f8f55', type: 'campus' },
];
/** La parcelle du fil rouge, traitée comme un lieu pour y aller (porte côté avenue) ; on n'y entre pas, on y retrouve Mme Touré. */
export const PARCELLE_BATIMENT: Batiment3D = {
  slug: PARCELLE_AKWABA.slug, nom: CAMPAGNE.nom, href: '', position: [PARCELLE_AKWABA.x, 1, PARCELLE_AKWABA.z],
  taille: [PARCELLE_AKWABA.largeur, 2, PARCELLE_AKWABA.profondeur], couleur: '#A88C66', type: 'chantier',
};
/** La minicarte montre la parcelle avec les lieux, et la touche y envoie le joueur. */
export const BATIMENTS_CARTE = [...BATIMENTS, PARCELLE_BATIMENT];
export const BATIMENT_CHANTIER = BATIMENTS.find(b => b.slug === 'chantier')!;
const CENTRE_CHANTIER: PointMonde = [BATIMENT_CHANTIER.position[0], BATIMENT_CHANTIER.position[2]];
export const POSTES_CHANTIER = postesChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2]);
const EMPRISES=[...[...BATIMENTS, PARCELLE_BATIMENT].map(b=>({x:b.position[0],z:b.position[2],largeur:b.taille[0],profondeur:b.taille[2]})), ...EMPRISES_PALMIERS, bungalowChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2])];
export const POINTS_DECOUVERTE = [
  { id: 'fontaine-plateau', nom: 'Fontaine du Plateau', position: [0, -52] as PointMonde },
  { id: 'promenade-lagune', nom: 'Promenade de la Lagune', position: [0, 47] as PointMonde },
  { id: 'marche-jardins', nom: 'Marché des Jardins', position: [-88, 11] as PointMonde },
  { id: 'marina', nom: 'Marina BTP Life', position: [89, 47] as PointMonde },
  { id: 'campus-batisseurs', nom: 'Campus des Bâtisseurs', position: [87, -24] as PointMonde },
  { id: 'plage-sables', nom: 'Plage des Sables', position: [-25, 58] as PointMonde },
];

const ROUTES_PASSANTS: PointMonde[][] = [
  [[-112, -12], [-62, -12], [-62, 36], [-110, 36]],
  [[62, -12], [112, -12], [112, 37], [62, 37]],
  // Au Plateau Nord, les passants longent la parcelle Akwaba par le trottoir de l'avenue, sans traverser l'immeuble.
  [[-42, -70.4], [-42, -113], [42, -113], [42, -70.4]],
  [[-108, 44], [-58, 44], [-58, 63], [-108, 63]],
  [[58, 44], [108, 44], [108, 63], [58, 63]],
  [[-48, -58], [48, -58], [48, -71.3], [-48, -71.3]],
];

function Batiment({ batiment, selectionne, nuit, onSelect }: { batiment: Batiment3D; selectionne: boolean; nuit: boolean; onSelect: (b: Batiment3D) => void }) {
  return <group position={[batiment.position[0], 0, batiment.position[2]]} onClick={(e) => { e.stopPropagation(); if (e.delta < 5) onSelect(batiment); }}>
    <Architecture width={batiment.taille[0]} height={batiment.taille[1]} depth={batiment.taille[2]} color={batiment.couleur} kind={batiment.type} nuit={nuit} slug={batiment.slug} />
    {batiment.type !== 'chantier' && <group position={[0, Math.min(4.15, batiment.taille[1] - .4), batiment.taille[2] / 2 + 0.48]}>
      <mesh><boxGeometry args={[Math.min(batiment.taille[0] - 1, Math.max(4.8, batiment.nom.length * 0.32)), 0.78, 0.14]} /><meshStandardMaterial color="#18363b" roughness={0.5} /></mesh>
      <Text position={[0, 0, 0.09]} fontSize={0.28} maxWidth={batiment.taille[0] - 1.5} color="#fff0ce" anchorX="center" anchorY="middle">{batiment.nom}</Text>
    </group>}
    {selectionne && <Billboard position={[0, Math.max(batiment.taille[1], batiment.type === 'chantier' ? 14 : 0) + 2, 0]}><mesh><planeGeometry args={[Math.max(7, batiment.nom.length * 0.48), 1.55]} /><meshBasicMaterial color="#9b6422" transparent opacity={0.94} /></mesh><Text position={[0, 0, 0.02]} fontSize={0.55} color="#fff5dc" anchorX="center" anchorY="middle">{batiment.nom}</Text></Billboard>}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}><ringGeometry args={[Math.max(...[batiment.taille[0], batiment.taille[2]]) * 0.65, Math.max(batiment.taille[0], batiment.taille[2]) * 0.65 + 0.25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
}

function Personnage(props: { nom?: string; couleur?: string; marche?: boolean; casque?: boolean; variante?: number; identite?: IdentitePersonnage; allure?: number }) {
  return <HumainMonde {...props} scale={ECHELLE_PERSONNAGES}/>;
}

/** `vitesse` : mètres par seconde (4,5 par beau temps, moins sous la pluie). */
function Joueur({ nom, directions, destination, positionRef, pause, positionInitiale, onPosition, humeur, critique, contexte, bulles, vitesse = 4.5 }: { nom?: string; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; positionRef: React.MutableRefObject<THREE.Vector3>; pause: boolean; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; humeur: Humeur; critique: Critique; contexte: ContextePensee; bulles: boolean; vitesse?: number }) {
  const ref = useRef<THREE.Group>(null);
  const pensee = usePenseePeriodique(graine => penseeJoueur(critique, contexte, graine), bulles, 3, critique ? 11 : 26);
  const route=useRef<PointMonde[]>([]),cibleRoute=useRef<PointMonde|null>(null);
  const delaiSignal = useRef(0);
  const vecteurs = useMemo(() => ({ mouvement: new THREE.Vector3(), avant: new THREE.Vector3(), droite: new THREE.Vector3(), prochain: new THREE.Vector3() }), []);
  const [marche, setMarche] = useState(false);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!ref.current || !positionInitiale) return;
    ref.current.position.set(positionInitiale[0], 0, positionInitiale[1]);
    positionRef.current.copy(ref.current.position);
  }, [positionInitiale?.[0], positionInitiale?.[1], positionRef]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (pause) { if (marche) setMarche(false); return; }
    const { mouvement, avant, droite, prochain } = vecteurs;
    mouvement.set(0, 0, 0);
    if (directions.size) {
      camera.getWorldDirection(avant); avant.y = 0; avant.normalize();
      droite.set(-avant.z, 0, avant.x);
      mouvement.addScaledVector(avant, Number(directions.has('avant')) - Number(directions.has('arriere')));
      mouvement.addScaledVector(droite, Number(directions.has('droite')) - Number(directions.has('gauche')));
      destination.current = null;
      route.current=[];cibleRoute.current=null;
    } else if (destination.current) {
      if(cibleRoute.current!==destination.current){cibleRoute.current=destination.current;route.current=itineraireVille([ref.current.position.x,ref.current.position.z],destination.current,EMPRISES);}
      const point=route.current[0];
      if(point){mouvement.set(point[0]-ref.current.position.x,0,point[1]-ref.current.position.z);if(mouvement.lengthSq()<.025){route.current.shift();mouvement.set(0,0,0);}}
      if(!route.current.length){destination.current=null;cibleRoute.current=null;}
    }
    const actif = mouvement.lengthSq() > 0.001;
    if (actif) {
      const distance=Math.min(mouvement.length(),vitesse*Math.min(delta,.05));mouvement.normalize();
      prochain.copy(ref.current.position).addScaledVector(mouvement, distance);
      const bloque = EMPRISES.some(b => Math.abs(prochain.x - b.x) < b.largeur / 2 + 0.7 && Math.abs(prochain.z - b.z) < b.profondeur / 2 + 0.7);
      if (!bloque) ref.current.position.copy(prochain);
      else {
        const libre = (x: number, z: number) => !EMPRISES.some(b => Math.abs(x - b.x) < b.largeur / 2 + 0.7 && Math.abs(z - b.z) < b.profondeur / 2 + 0.7);
        if (libre(prochain.x, ref.current.position.z)) ref.current.position.x = prochain.x;
        else if (libre(ref.current.position.x, prochain.z)) ref.current.position.z = prochain.z;
        else destination.current = null;
      }
      ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, LIMITES_VILLE.minX, LIMITES_VILLE.maxX);
      ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ);
      ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta);
    }
    positionRef.current.copy(ref.current.position);
    delaiSignal.current += delta;
    if (actif && delaiSignal.current >= 1.5) { delaiSignal.current = 0; onPosition?.([ref.current.position.x, ref.current.position.z]); }
    if (actif !== marche) { if (!actif) onPosition?.([ref.current.position.x, ref.current.position.z]); setMarche(actif); }
  });
  return <group ref={ref}>
    {/* Anneau du joueur, visible même derrière un bâtiment, comme le losange. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 0]} renderOrder={9} userData={{ sansOcclusion: true }}><ringGeometry args={[.62, .82, 40]} /><meshBasicMaterial color="#dff3f7" transparent opacity={.85} depthTest={false} depthWrite={false} /></mesh>
    <HumainJoueur nom={nom} marche={marche} casque allure={4.5} scale={ECHELLE_PERSONNAGES} /><Plumbob3D humeur={humeur} /><BullePensee pensee={pensee} />
  </group>;
}

function PnjAutonome({ nom, couleur, route, depart, pause, joueur, destination, onParler, rythme, contexte, bulles, suivi }: { nom: string; couleur: string; route: PointMonde[]; depart: number; pause: boolean; joueur: React.MutableRefObject<THREE.Vector3>; destination: React.MutableRefObject<PointMonde | null>; onParler: (nom: string) => void; rythme: number; contexte: ContextePensee; bulles: boolean; suivi?: React.MutableRefObject<Map<string, THREE.Vector3>> }) {
  const ref = useRef<THREE.Group>(null);
  // La minicarte lit directement la position de l'habitant, sans copie à chaque image.
  useEffect(() => { const carte = suivi?.current; if (!carte || !ref.current) return; carte.set(nom, ref.current.position); return () => { carte.delete(nom); }; }, [nom, suivi]);
  const index = useRef(depart % route.length);
  const approche = useRef(false);
  const [attend, setAttend] = useState(false);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  const pensee = usePenseePeriodique(graine => penseePnj(nom, contexte, graine + depart), bulles && !pause, 6 + depart * 3.7, 20,
    () => Boolean(ref.current && ref.current.position.distanceTo(joueur.current) < 34));
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (pause || approche.current) ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(joueur.current.x-ref.current.position.x,joueur.current.z-ref.current.position.z), delta);
    if (pause) return;
    if (approche.current) {
      if (ref.current.position.distanceTo(joueur.current) <= 4) { approche.current = false; setAttend(false); destination.current = null; onParler(nom); }
      return;
    }
    const cible = route[index.current % route.length];
    mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z);
    if (mouvement.lengthSq() < 0.18) index.current = (index.current % route.length + 1) % route.length;
    else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.8 * Math.min(delta, 0.05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); }
  });
  const point = route[depart % route.length];
  return <group ref={ref} position={[point[0], 0, point[1]]} onClick={e => {
    e.stopPropagation(); if (e.delta >= 5 || !ref.current) return;
    if (ref.current.position.distanceTo(joueur.current) <= 4) onParler(nom);
    else { approche.current = true; setAttend(true); destination.current = [ref.current.position.x, ref.current.position.z]; }
  }}><Personnage nom={`${nom} · Parler`} couleur={couleur} marche={!pause && !attend} variante={depart + 1} allure={1.8 * rythme} identite={IDENTITES_PNJ[nom]} /><BullePensee pensee={pensee} hauteur={2.9} /></group>;
}
/** Passant sur son itinéraire ; sous la pluie, il sort son parapluie. */
function Passant({ route, depart, pause, couleur, rythme, parapluie = false }: { route: PointMonde[]; depart: number; pause: boolean; couleur: string; rythme: number; parapluie?: boolean }) {
  const ref = useRef<THREE.Group>(null); const index = useRef(depart % route.length);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => { if (!ref.current || pause) return; const cible = route[index.current]; mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z); if (mouvement.lengthSq() < 0.2) index.current = (index.current + 1) % route.length; else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.5 * Math.min(delta, 0.05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); } });
  const point = route[depart % route.length];
  return <group ref={ref} position={[point[0], 0, point[1]]}><Personnage couleur={couleur} marche={!pause} casque={!parapluie && depart % 3 === 0} variante={depart + Math.round(point[0])} allure={1.5 * rythme} />
    {parapluie && <group position={[.18, 0, .12]}>
      <mesh position={[0, 1.75, 0]}><cylinderGeometry args={[.012, .012, .9, 6]} /><meshStandardMaterial color="#2B2B2E" /></mesh>
      <mesh position={[0, 2.3, 0]} castShadow><coneGeometry args={[.62, .28, 10, 1, true]} /><meshStandardMaterial color={couleur} side={THREE.DoubleSide} roughness={.6} /></mesh>
    </group>}</group>;
}

export type PlanEnCours = { plan: PlanCamera; debut: number };
/** Le concurrent du fil rouge, qui fait les cent pas devant la parcelle Akwaba ; un clic, et il lâche sa dernière pique. */
function Concurrent3D({ pause, rythme, bulles, onParler }: { pause: boolean; rythme: number; bulles: boolean; onParler: () => void }) {
  const ref = useRef<THREE.Group>(null), index = useRef(0);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  const pensee = usePenseePeriodique(graine => PENSEES_CONCURRENT[Math.abs(Math.floor(graine)) % PENSEES_CONCURRENT.length], bulles && !pause, 4, 16);
  useFrame((_, delta) => {
    if (!ref.current || pause) return;
    const cible = ROUTE_CONCURRENT[index.current];
    mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z);
    if (mouvement.lengthSq() < .05) index.current = (index.current + 1) % ROUTE_CONCURRENT.length;
    else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, .9 * Math.min(delta, .05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); }
  });
  return <group ref={ref} position={[ROUTE_CONCURRENT[0][0], 0, ROUTE_CONCURRENT[0][1]]} onClick={e => { e.stopPropagation(); if (e.delta < 5) onParler(); }}>
    <Personnage nom={`${CONCURRENT.prenom} · ${CONCURRENT.entreprise}`} couleur="#3B4A6B" marche={!pause} casque variante={7} allure={.9 * rythme} />
    <BullePensee pensee={pensee} hauteur={2.9} />
  </group>;
}

function CameraSims({ joueur, vue, plan }: { joueur: React.MutableRefObject<THREE.Vector3>; vue?: React.MutableRefObject<{ azimut: number }>; plan?: React.MutableRefObject<PlanEnCours | null> }) {
  const [proche,setProche]=useState(true);
  const enPlan = useRef(false);
  const controles = useRef<ComponentRef<typeof MapControls>>(null);
  const cible = useMemo(() => new THREE.Vector3(), []);
  const camera = useThree(s => s.camera);
  const aspect = useThree(s => s.size.width / Math.max(1, s.size.height));
  // Vue d'ensemble de trois quarts par défaut (reculée en portrait) ; caméra libre basse en option.
  const decalage = useMemo<[number, number, number]>(() => proche ? decalageVue(aspect) : [5, 3.8, 7], [proche, aspect]);
  useEffect(()=>{const basculer=()=>setProche(v=>!v);window.addEventListener('btp-camera',basculer);return()=>window.removeEventListener('btp-camera',basculer);},[]);
  useEffect(()=>{camera.position.set(joueur.current.x+decalage[0],decalage[1],joueur.current.z+decalage[2]);controles.current?.target.set(joueur.current.x,1.2,joueur.current.z);controles.current?.update();},[decalage,camera,joueur]);
  useEffect(() => {
    const recentrer = (event: KeyboardEvent) => {
      if (event.code !== 'KeyR' || (event.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return;
      const position = joueur.current;
      camera.position.set(position.x+decalage[0],decalage[1],position.z+decalage[2]);
      controles.current?.target.set(position.x, 1, position.z);
      controles.current?.update();
    };
    window.addEventListener('keydown', recentrer);
    return () => window.removeEventListener('keydown', recentrer);
  }, [camera, joueur, decalage]);
  useFrame((_, delta) => {
    if (!controles.current) return;
    // Plan de caméra d'un moment clé (chapitre validé) : la caméra tourne autour de l'immeuble, puis revient au joueur.
    const enCours = plan?.current;
    if (enCours) {
      const t = (performance.now() - enCours.debut) / 1000;
      if (t < enCours.plan.duree) {
        const { camera: c, cible: v } = positionPlan(enCours.plan, t);
        camera.position.set(c[0], c[1], c[2]); controles.current.target.set(v[0], v[1], v[2]); controles.current.update();
        enPlan.current = true;
        return;
      }
      if (plan) plan.current = null;
    }
    if (enPlan.current) {
      enPlan.current = false;
      const p = joueur.current;
      camera.position.set(p.x + decalage[0], decalage[1], p.z + decalage[2]); controles.current.target.set(p.x, 1, p.z); controles.current.update();
    }
    cible.set(joueur.current.x, 1, joueur.current.z);
    cible.sub(controles.current.target).multiplyScalar(1 - Math.exp(-6 * delta));
    camera.position.add(cible); controles.current.target.add(cible); controles.current.update();
    // La minicarte et la flèche d'objectif s'orientent comme la caméra, y compris en caméra libre.
    if (vue) vue.current.azimut = Math.atan2(camera.position.x - controles.current.target.x, camera.position.z - controles.current.target.z);
  });
  return <MapControls ref={controles} makeDefault enableDamping dampingFactor={0.08} enableRotate={!proche} minDistance={proche?14:3} maxDistance={proche?60:95} minPolarAngle={0.3} maxPolarAngle={1.48} enablePan={false} mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} />;
}


function MarqueurDestination({ destination }: { destination: React.MutableRefObject<PointMonde | null> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.visible = Boolean(destination.current);
    if (destination.current) { ref.current.position.set(destination.current[0], 0.12, destination.current[1]); ref.current.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 5) * 0.12); }
  });
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.35, 0.55, 24]} /><meshBasicMaterial color="#f4c430" transparent opacity={0.9} /></mesh>;
}

function PointDecouverte({ point, trouve, onTrouver }: { point: (typeof POINTS_DECOUVERTE)[number]; trouve: boolean; onTrouver: (id: string, nom: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current && !trouve) { ref.current.rotation.y = clock.elapsedTime * 0.7; ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 2) * 0.15; } });
  return <group ref={ref} position={[point.position[0], 1.4, point.position[1]]} onClick={(e) => { e.stopPropagation(); onTrouver(point.id, point.nom); }}>
    <mesh castShadow><octahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color={trouve ? '#78927a' : '#f4c430'} emissive={trouve ? '#183c3d' : '#c47a16'} emissiveIntensity={trouve ? 0.15 : 0.8} metalness={0.35} roughness={0.3} /></mesh>
    <Billboard position={[0, 1.1, 0]}><Text fontSize={0.38} color="#fff5cf" outlineColor="#152b30" outlineWidth={0.04}>{trouve ? 'Découvert' : point.nom}</Text></Billboard>
  </group>;
}

export function Scene({ joueur, vue, suiviPnj, chantier, akwaba, onPoste, yaoAuChantier, nomJoueur, joueurs, directions, destination, heure, pause, selection, objectif, onSelect, interlocuteur, onParler, positionInitiale, onPosition, decouvertes, onDecouverte, meteo, rythme, humeur, critique, bulles, voisins, monEmote, plan, onConcurrent, coequipiers, onVoisin }: { joueur: React.MutableRefObject<THREE.Vector3>; vue: React.MutableRefObject<{ azimut: number }>; suiviPnj: React.MutableRefObject<Map<string, THREE.Vector3>>; chantier: { etat: EtatVisuel; nom: string; livraison: ChargementLivraison | null; postes: { id: PosteVille; position: PointMonde; libelle: string }[] };
  /** La Résidence Akwaba : son stade (chapitres validés du fil rouge) et la balise du portail quand Mme Touré attend. */
  akwaba: { stade: number; appel: string | null }; onPoste: (poste: PosteVille) => void; yaoAuChantier: boolean; nomJoueur?: string; joueurs: JoueurActif[]; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; heure: number; pause: boolean; selection: string | undefined; objectif?: string; onSelect: (b: Batiment3D) => void; interlocuteur: string | null; onParler: (nom: string) => void; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; decouvertes: string[]; onDecouverte: (id: string, nom: string) => void; meteo: Meteo; rythme: number; humeur: Humeur; critique: Critique; bulles: boolean; voisins: VoisinEnLigne[]; monEmote: Emote | null; plan: React.MutableRefObject<PlanEnCours | null>; onConcurrent: () => void; coequipiers: string[]; onVoisin: () => void }) {
  const nuit = heure >= 19 || heure < 6;
  const sombre = nuit || ambianceMeteo(meteo).soleil < .3;
  const pluie = ambianceMeteo(meteo).pluie;
  const contexte = useMemo<ContextePensee>(() => ({ meteo, heure }), [meteo, heure]);
  const noms = ['Awa', 'Yao', 'Mariam', 'Koffi', 'Fatou'];
  const choisirDestination = useCallback((point: PointMonde) => { destination.current = point; }, [destination]);
  return <>
    <EclairageMonde heure={heure} meteo={meteo} />
    {sombre && [[-42, 4, -15], [0, 4, -15], [42, 4, -15], [-42, 4, 15], [0, 4, 15], [42, 4, 15], [0, 4, 47]].map((p, i) => <pointLight key={i} position={p as [number, number, number]} color="#ffd778" intensity={nuit ? 7 : 4} distance={18} decay={2} />)}
    {pluie > 0 && <Pluie intensite={pluie} pause={pause} />}
    <PaysageLagune pause={pause} rythme={rythme} heure={Math.floor(heure)} onDestination={choisirDestination} /><MarqueurDestination destination={destination} />
    {POINTS_DECOUVERTE.map(point => <PointDecouverte key={point.id} point={point} trouve={decouvertes.includes(point.id)} onTrouver={(id, nom) => {
      if (Math.hypot(joueur.current.x - point.position[0], joueur.current.z - point.position[1]) <= 6) onDecouverte(id, nom);
      else destination.current = point.position;
    }} />)}
    {BATIMENTS.map((b) => b.slug === 'chantier'
      ? <ChantierVivant key={b.slug} centre={CENTRE_CHANTIER} largeur={b.taille[0]} profondeur={b.taille[2]} etat={chantier.etat} nomChantier={chantier.nom} livraison={chantier.livraison} postes={chantier.postes} pause={pause} rythme={rythme} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onPoste={onPoste} onSelect={() => onSelect(b)} />
      : <Batiment key={b.slug} batiment={b} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onSelect={onSelect} />)}
    <ImmeubleAkwaba stade={akwaba.stade} appel={akwaba.appel} nuit={nuit} pause={pause} rythme={rythme} selectionne={objectif === PARCELLE_AKWABA.slug} onSelect={() => onSelect(PARCELLE_BATIMENT)} />
    <Joueur nom={nomJoueur} directions={directions} destination={destination} positionRef={joueur} pause={pause || !!interlocuteur} positionInitiale={positionInitiale} onPosition={onPosition} humeur={humeur} critique={critique} contexte={contexte} bulles={bulles && !interlocuteur} vitesse={4.5 * effetsMeteo(meteo).vitesseMarche} />
    {/* Le concurrent du fil rouge rôde devant la parcelle Akwaba aux heures de chantier, jusqu'à la livraison. */}
    {presenceConcurrent(akwaba.stade, heure) && <Concurrent3D pause={pause} rythme={rythme} bulles={bulles} onParler={onConcurrent} />}
    {/* Les autres joueurs connectés, avec leur personnage et leurs émotes (monde en ligne). */}
    <VoisinsEnLigne3D voisins={voisins} coequipiers={coequipiers} onSelect={onVoisin} /><EmoteJoueur3D position={joueur} emote={monEmote} />
    {/* Chaque habitant suit sa journée (lib/vie-urbaine) : au travail aux heures de son lieu, en sortie le soir, chez lui la nuit. */}
    {noms.map((nom, i) => {
      const route = nom === 'Yao' && yaoAuChantier ? [POSTES_CHANTIER.yao] : creneauPnj(nom, heure)?.route;
      return route ? <PnjAutonome key={`${nom}-${i}`} nom={nom} couleur={HABITANTS[i].couleur} route={route} depart={i} pause={pause || interlocuteur === nom} joueur={joueur} destination={destination} onParler={onParler} rythme={rythme} contexte={contexte} bulles={bulles && !interlocuteur} suivi={suiviPnj} /> : null;
    })}
    {/* La foule suit l'heure, le quartier et la pluie : le marché le matin, la plage le soir, des rues vides sous l'orage. */}
    {passantsPresents(heure, pluie).map(({ route: i, depart: j }) => <Passant key={`passant-${i}-${j}`} route={ROUTES_PASSANTS[i]} depart={[0, 2][j]} pause={pause} rythme={rythme} couleur={['#5f7f68', '#b66e54', '#5d75a0', '#9670a0'][i % 4]} parapluie={effetsMeteo(meteo).parapluies} />)}
    <CameraSims joueur={joueur} vue={vue} plan={plan} />
  </>;
}
