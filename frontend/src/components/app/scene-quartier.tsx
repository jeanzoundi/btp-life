'use client';

// La scène 3D du quartier : bâtiments, joueur, habitants, passants, concurrent du fil rouge, voisins en ligne et caméra.
// L'état du jeu (horloge, séances, chantier, panneaux, HUD) reste dans quartier-3d.tsx, qui lui passe tout par ses props.
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, MapControls, Text } from '@react-three/drei';
import { EclairageMonde } from './eclairage-monde';
import { HumainMonde, PersonnagesApresLaVille } from './humain-monde';
import { orienterProgressivement } from '@/lib/fluidite-monde';
import { decalageVue, DISTANCE_LOIN, DISTANCE_PROCHE, inclinaisonPourDistance } from '@/lib/camera-monde';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { JoueurActif } from './autres-joueurs';
import { Architecture, PaysageLagune } from './ville-lagune';
import { HABITANTS } from './dialogue-personnage';
import { LIMITES_VILLE } from '@/lib/ville';
import { type Humeur } from './besoins';
import { BullePensee, Plumbob3D, usePenseePeriodique } from './humeur-monde';
import { Pluie } from './meteo-monde';
import { SolsMouilles } from './sols-mouilles';
import { ambianceMeteo, type Meteo } from '@/lib/meteo-monde';
import { penseeJoueur, penseePnj, type ContextePensee } from '@/lib/pensees-monde';
import { EmoteJoueur3D, VoisinsEnLigne3D } from './monde-en-ligne';
import type { Emote, VoisinEnLigne } from '@/lib/en-ligne';
import { ChantierVivant, type ChargementLivraison } from './chantier-vivant';
import { postesChantier, type EtatVisuel, type PosteVille } from '@/lib/journee-chantier';
import { PARCELLE_AKWABA } from '@/lib/campagne';
import { BATIMENTS, BATIMENTS_CARTE, PARCELLE_BATIMENT, PARCELLE_RONIERS_BATIMENT, PARCELLES_BATIMENTS, POINTS_DECOUVERTE, type Batiment3D, type PointMonde } from '@/lib/batiments-ville';
import { boucleHabitants, NAVIGATION_VILLE as NAVIGATION } from '@/lib/decor-ville';
import { CONCURRENT, PENSEES_CONCURRENT, routeConcurrent } from '@/lib/concurrent';
import { positionPlan, type PlanCamera } from '@/lib/plans-camera';
import { ImmeubleAkwaba } from './immeuble-akwaba';
import { ImmeubleRoniers } from './immeuble-roniers';
import { ChantierDossier } from './chantier-dossier';
import { CHANTIERS_DOSSIERS } from '@/lib/plan-dossiers';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import { creneauPnj, effetsMeteo, passantsPresents, ROUTES_PASSANTS } from '@/lib/vie-urbaine';
import { etapePnj, JOURNEES_PNJ } from '@/lib/journee-pnj';
import { HabitantJournee } from './habitant-journee';
import { HumainJoueur } from './personnage-joueur';
import type { IdentitePersonnage } from '@/lib/identites-personnages';

type Critique = { icone: string; label: string } | null;
// Chaque habitant garde son modèle : Yao est en tenue de chef de chantier, casque compris.
const IDENTITES_PNJ: Record<string, IdentitePersonnage> = { Awa: 'awa', Yao: 'yao', Mariam: 'mariam', Koffi: 'koffi', Fatou: 'fatou' };

export type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
export type { Batiment3D, PointMonde };
export { BATIMENTS, BATIMENTS_CARTE, PARCELLE_BATIMENT, PARCELLES_BATIMENTS, POINTS_DECOUVERTE };

export const BATIMENT_CHANTIER = BATIMENTS.find(b => b.slug === 'chantier')!;
const CENTRE_CHANTIER: PointMonde = [BATIMENT_CHANTIER.position[0], BATIMENT_CHANTIER.position[2]];
export const POSTES_CHANTIER = postesChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2]);

/** `progression` : où en est le joueur dans le programme du lieu, écrit sous son nom sur l'enseigne. */
function Batiment({ batiment, selectionne, nuit, onSelect, progression }: { batiment: Batiment3D; selectionne: boolean; nuit: boolean; onSelect: (b: Batiment3D) => void; progression?: string }) {
  return <group position={[batiment.position[0], 0, batiment.position[2]]} onClick={(e) => { e.stopPropagation(); if (e.delta < 5) onSelect(batiment); }}>
    <Architecture width={batiment.taille[0]} height={batiment.taille[1]} depth={batiment.taille[2]} color={batiment.couleur} kind={batiment.type} nuit={nuit} slug={batiment.slug} />
    {batiment.type !== 'chantier' && <group position={[0, Math.min(4.15, batiment.taille[1] - .4), batiment.taille[2] / 2 + 0.48]}>
      <mesh><boxGeometry args={[Math.min(batiment.taille[0] - 1, Math.max(4.8, batiment.nom.length * 0.32)), 0.78, 0.14]} /><meshStandardMaterial color="#18363b" roughness={0.5} /></mesh>
      <Text position={[0, progression ? .13 : 0, 0.09]} fontSize={0.28} maxWidth={batiment.taille[0] - 1.5} color="#fff0ce" anchorX="center" anchorY="middle">{batiment.nom}</Text>
      {progression && <Text position={[0, -.2, 0.09]} fontSize={0.17} maxWidth={batiment.taille[0] - 1.5} color="#f2c14e" anchorX="center" anchorY="middle">{progression}</Text>}
    </group>}
    {selectionne && <Billboard position={[0, Math.max(batiment.taille[1], batiment.type === 'chantier' ? 14 : 0) + 2, 0]}><mesh><planeGeometry args={[Math.max(7, batiment.nom.length * 0.48), 1.55]} /><meshBasicMaterial color="#9b6422" transparent opacity={0.94} /></mesh><Text position={[0, 0, 0.02]} fontSize={0.55} color="#fff5dc" anchorX="center" anchorY="middle">{batiment.nom}</Text></Billboard>}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]}><ringGeometry args={[Math.max(...[batiment.taille[0], batiment.taille[2]]) * 0.65, Math.max(batiment.taille[0], batiment.taille[2]) * 0.65 + 0.25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
}

function Personnage(props: { nom?: string; couleur?: string; marche?: boolean; casque?: boolean; variante?: number; identite?: IdentitePersonnage; allure?: number }) {
  return <HumainMonde {...props} scale={ECHELLE_PERSONNAGES}/>;
}

/** `vitesse` : mètres par seconde (4,5 par beau temps, moins sous la pluie). */
function Joueur({ nom, directions, destination, positionRef, pause, positionInitiale, onPosition, humeur, critique, contexte, bulles, vitesse = 4.5, parle = false }: { nom?: string; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; positionRef: React.MutableRefObject<THREE.Vector3>; pause: boolean; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; humeur: Humeur; critique: Critique; contexte: ContextePensee; bulles: boolean; vitesse?: number; parle?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const pensee = usePenseePeriodique(graine => penseeJoueur(critique, contexte, graine), bulles, 3, critique ? 11 : 26);
  const route=useRef<PointMonde[]>([]),cibleRoute=useRef<PointMonde|null>(null),essais=useRef(0);
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
      if(cibleRoute.current!==destination.current){cibleRoute.current=destination.current;route.current=NAVIGATION.chemin([ref.current.position.x,ref.current.position.z],destination.current);}
      const point=route.current[0];
      if(point){mouvement.set(point[0]-ref.current.position.x,0,point[1]-ref.current.position.z);if(mouvement.lengthSq()<.025){route.current.shift();mouvement.set(0,0,0);}}
      if(!route.current.length){destination.current=null;cibleRoute.current=null;}
    }
    const actif = mouvement.lengthSq() > 0.001;
    if (actif) {
      const distance=Math.min(mouvement.length(),vitesse*Math.min(delta,.05));mouvement.normalize();
      prochain.copy(ref.current.position).addScaledVector(mouvement, distance);
      // Ni bâtiment ni décor : contre un obstacle, on glisse le long ; coincé sur un trajet, on cherche un autre chemin
      // (deux fois au plus, puis on s'arrête).
      if (NAVIGATION.passe(prochain.x, prochain.z)) { ref.current.position.copy(prochain); essais.current = 0; }
      else if (NAVIGATION.passe(prochain.x, ref.current.position.z)) ref.current.position.x = prochain.x;
      else if (NAVIGATION.passe(ref.current.position.x, prochain.z)) ref.current.position.z = prochain.z;
      else if (destination.current && essais.current < 2) { essais.current++; cibleRoute.current = null; route.current = []; }
      else { destination.current = null; essais.current = 0; }
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
    <HumainJoueur nom={nom} marche={marche} casque allure={4.5} scale={ECHELLE_PERSONNAGES} geste={parle ? 'parle' : undefined} /><Plumbob3D humeur={humeur} /><BullePensee pensee={pensee} />
  </group>;
}

function PnjAutonome({ nom, couleur, route, depart, pause, joueur, destination, onParler, rythme, contexte, bulles, suivi }: { nom: string; couleur: string; route: PointMonde[]; depart: number; pause: boolean; joueur: React.MutableRefObject<THREE.Vector3>; destination: React.MutableRefObject<PointMonde | null>; onParler: (nom: string) => void; rythme: number; contexte: ContextePensee; bulles: boolean; suivi?: React.MutableRefObject<Map<string, THREE.Vector3>> }) {
  const ref = useRef<THREE.Group>(null);
  // La minicarte lit directement la position de l'habitant, sans copie à chaque image.
  useEffect(() => { const carte = suivi?.current; if (!carte || !ref.current) return; carte.set(nom, ref.current.position); return () => { carte.delete(nom); }; }, [nom, suivi]);
  // Son circuit contourne le décor ; il part du point d'origine qui lui revient.
  const { points: trace, reperes } = useMemo(() => boucleHabitants(route), [route]);
  const debut = reperes[depart % reperes.length];
  const index = useRef(debut);
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
    const cible = trace[index.current % trace.length];
    mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z);
    if (mouvement.lengthSq() < 0.18) index.current = (index.current % trace.length + 1) % trace.length;
    else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.8 * Math.min(delta, 0.05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); }
  });
  const point = trace[debut];
  return <group ref={ref} position={[point[0], 0, point[1]]} onClick={e => {
    e.stopPropagation(); if (e.delta >= 5 || !ref.current) return;
    if (ref.current.position.distanceTo(joueur.current) <= 4) onParler(nom);
    else { approche.current = true; setAttend(true); destination.current = [ref.current.position.x, ref.current.position.z]; }
  }}><Personnage nom={`${nom} · Parler`} couleur={couleur} marche={!pause && !attend} variante={depart + 1} allure={1.8 * rythme} identite={IDENTITES_PNJ[nom]} /><BullePensee pensee={pensee} hauteur={2.9} /></group>;
}
/** Passant sur son itinéraire, qui contourne le décor ; sous la pluie, il sort son parapluie. */
function Passant({ route, depart, pause, couleur, rythme, parapluie = false }: { route: PointMonde[]; depart: number; pause: boolean; couleur: string; rythme: number; parapluie?: boolean }) {
  const { points: trace, reperes } = useMemo(() => boucleHabitants(route), [route]);
  const debut = reperes[depart % reperes.length];
  const ref = useRef<THREE.Group>(null); const index = useRef(debut);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => { if (!ref.current || pause) return; const cible = trace[index.current % trace.length]; mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z); if (mouvement.lengthSq() < 0.2) index.current = (index.current + 1) % trace.length; else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.5 * Math.min(delta, 0.05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); } });
  const point = trace[debut];
  return <group ref={ref} position={[point[0], 0, point[1]]}><Personnage couleur={couleur} marche={!pause} casque={!parapluie && depart % 3 === 0} variante={depart + Math.round(point[0])} allure={1.5 * rythme} />
    {parapluie && <group position={[.18, 0, .12]}>
      <mesh position={[0, 1.75, 0]}><cylinderGeometry args={[.012, .012, .9, 6]} /><meshStandardMaterial color="#2B2B2E" /></mesh>
      <mesh position={[0, 2.3, 0]} castShadow><coneGeometry args={[.62, .28, 10, 1, true]} /><meshStandardMaterial color={couleur} side={THREE.DoubleSide} roughness={.6} /></mesh>
    </group>}</group>;
}

export type PlanEnCours = { plan: PlanCamera; debut: number };
/** Le concurrent du fil rouge, qui fait les cent pas devant la parcelle du dossier en cours ; un clic, et il lâche sa
 * dernière pique. */
function Concurrent3D({ route, pause, rythme, bulles, onParler }: { route: [number, number][]; pause: boolean; rythme: number; bulles: boolean; onParler: () => void }) {
  const ref = useRef<THREE.Group>(null), index = useRef(0);
  const trace = useMemo(() => boucleHabitants(route).points, [route]);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  const pensee = usePenseePeriodique(graine => PENSEES_CONCURRENT[Math.abs(Math.floor(graine)) % PENSEES_CONCURRENT.length], bulles && !pause, 4, 16);
  useFrame((_, delta) => {
    if (!ref.current || pause) return;
    const cible = trace[index.current % trace.length];
    mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z);
    if (mouvement.lengthSq() < .05) index.current = (index.current + 1) % trace.length;
    else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, .9 * Math.min(delta, .05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); }
  });
  return <group ref={ref} position={[trace[0][0], 0, trace[0][1]]} onClick={e => { e.stopPropagation(); if (e.delta < 5) onParler(); }}>
    <Personnage nom={`${CONCURRENT.prenom} · ${CONCURRENT.entreprise}`} couleur="#3B4A6B" marche={!pause} casque variante={7} allure={.9 * rythme} />
    <BullePensee pensee={pensee} hauteur={2.9} />
  </group>;
}

function CameraSims({ joueur, vue, plan }: { joueur: React.MutableRefObject<THREE.Vector3>; vue?: React.MutableRefObject<{ azimut: number }>; plan?: React.MutableRefObject<PlanEnCours | null> }) {
  const [proche,setProche]=useState(true);
  const enPlan = useRef(false);
  const controles = useRef<ComponentRef<typeof MapControls>>(null);
  const cible = useMemo(() => new THREE.Vector3(), []);
  const ecart = useMemo(() => new THREE.Vector3(), []);
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
    camera.position.add(cible); controles.current.target.add(cible);
    // Vue d'ensemble : l'inclinaison suit le zoom, basse de près pour les façades, plongeante de loin pour le plan.
    if (proche) {
      const t = controles.current.target;
      ecart.copy(camera.position).sub(t);
      const distance = ecart.length(), horizontal = Math.hypot(ecart.x, ecart.z);
      const actuelle = Math.atan2(ecart.y, horizontal), voulue = inclinaisonPourDistance(distance);
      if (distance > 0 && Math.abs(voulue - actuelle) > 1e-4) {
        const suivante = actuelle + (voulue - actuelle) * (1 - Math.exp(-5 * delta)), azimut = Math.atan2(ecart.x, ecart.z);
        const h = distance * Math.cos(suivante);
        camera.position.set(t.x + h * Math.sin(azimut), t.y + distance * Math.sin(suivante), t.z + h * Math.cos(azimut));
      }
    }
    controles.current.update();
    // La minicarte et la flèche d'objectif s'orientent comme la caméra, y compris en caméra libre.
    if (vue) vue.current.azimut = Math.atan2(camera.position.x - controles.current.target.x, camera.position.z - controles.current.target.z);
  });
  return <MapControls ref={controles} makeDefault enableDamping dampingFactor={0.08} enableRotate={!proche} minDistance={proche?DISTANCE_PROCHE:3} maxDistance={proche?DISTANCE_LOIN:95} minPolarAngle={0.3} maxPolarAngle={1.48} enablePan={false} mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} />;
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

export function Scene({ joueur, vue, suiviPnj, chantier, progressionLieux, akwaba, roniers, chantiersDossiers, onPoste, yaoAuChantier, nomJoueur, joueurs, directions, destination, heure, pause, selection, objectif, onSelect, interlocuteur, onParler, positionInitiale, onPosition, decouvertes, onDecouverte, meteo, rythme, humeur, critique, bulles, voisins, monEmote, plan, onConcurrent, coequipiers, onVoisin }: { joueur: React.MutableRefObject<THREE.Vector3>; vue: React.MutableRefObject<{ azimut: number }>; suiviPnj: React.MutableRefObject<Map<string, THREE.Vector3>>; chantier: { etat: EtatVisuel; nom: string; livraison: ChargementLivraison | null; postes: { id: PosteVille; position: PointMonde; libelle: string }[]; contribution?: string; ouvriers?: number };
  /** La progression du joueur dans le programme de chaque lieu à mentor, affichée sur son enseigne. */
  progressionLieux?: Record<string, string>;
  /** La Résidence Akwaba : son stade (chapitres validés du fil rouge) et la balise du portail quand Mme Touré attend. */
  akwaba: { stade: number; appel: string | null };
  /** La Résidence Les Rôniers, deuxième dossier : son stade (chapitres validés du dossier) et la balise quand M. Touré attend. */
  roniers: { stade: number; appel: string | null };
  /** Les chantiers des dossiers suivants (école, centre de santé, marché couvert, résidence universitaire, château d'eau). */
  chantiersDossiers: { id: string; stade: number; appel: string | null }[]; onPoste: (poste: PosteVille) => void;
  /** Une journée de chantier est en cours : Yao reste à son poste, quelle que soit l'heure. */
  yaoAuChantier: boolean; nomJoueur?: string; joueurs: JoueurActif[]; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; heure: number; pause: boolean; selection: string | undefined; objectif?: string; onSelect: (b: Batiment3D) => void; interlocuteur: string | null; onParler: (nom: string) => void; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; decouvertes: string[]; onDecouverte: (id: string, nom: string) => void; meteo: Meteo; rythme: number; humeur: Humeur; critique: Critique; bulles: boolean; voisins: VoisinEnLigne[]; monEmote: Emote | null; plan: React.MutableRefObject<PlanEnCours | null>; onConcurrent: () => void; coequipiers: string[]; onVoisin: () => void }) {
  const nuit = heure >= 19 || heure < 6;
  const sombre = nuit || ambianceMeteo(meteo).soleil < .3;
  const pluie = ambianceMeteo(meteo).pluie;
  const contexte = useMemo<ContextePensee>(() => ({ meteo, heure }), [meteo, heure]);
  const noms = ['Awa', 'Yao', 'Mariam', 'Koffi', 'Fatou'];
  const choisirDestination = useCallback((point: PointMonde) => { destination.current = point; }, [destination]);
  // Les habitants ne téléchargent leur modèle réaliste qu'une fois la ville affichée ; le joueur, tout de suite.
  return <PersonnagesApresLaVille>
    <EclairageMonde heure={heure} meteo={meteo} />
    {sombre && [[-42, 4, -15], [0, 4, -15], [42, 4, -15], [-42, 4, 15], [0, 4, 15], [42, 4, 15], [0, 4, 47]].map((p, i) => <pointLight key={i} position={p as [number, number, number]} color="#ffd778" intensity={nuit ? 7 : 4} distance={18} decay={2} />)}
    {pluie > 0 && <Pluie intensite={pluie} pause={pause} />}
    {/* Les sols foncent et brillent sous l'averse, des flaques s'ouvrent, puis tout sèche après la pluie. */}
    <SolsMouilles pluie={pluie} pause={pause} />
    <PaysageLagune pause={pause} rythme={rythme} heure={Math.floor(heure)} onDestination={choisirDestination} /><MarqueurDestination destination={destination} />
    {POINTS_DECOUVERTE.map(point => <PointDecouverte key={point.id} point={point} trouve={decouvertes.includes(point.id)} onTrouver={(id, nom) => {
      if (Math.hypot(joueur.current.x - point.position[0], joueur.current.z - point.position[1]) <= point.rayon) onDecouverte(id, nom);
      else destination.current = point.position;
    }} />)}
    {BATIMENTS.map((b) => b.slug === 'chantier'
      ? <ChantierVivant key={b.slug} centre={CENTRE_CHANTIER} largeur={b.taille[0]} profondeur={b.taille[2]} etat={chantier.etat} nomChantier={chantier.nom} livraison={chantier.livraison} postes={chantier.postes} pause={pause} rythme={rythme} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onPoste={onPoste} onSelect={() => onSelect(b)} contribution={chantier.contribution} ouvriers={chantier.ouvriers} />
      : <Batiment key={b.slug} batiment={b} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onSelect={onSelect} progression={progressionLieux?.[b.slug]} />)}
    <ImmeubleAkwaba stade={akwaba.stade} appel={akwaba.appel} nuit={nuit} pause={pause} rythme={rythme} selectionne={objectif === PARCELLE_AKWABA.slug} onSelect={() => onSelect(PARCELLE_BATIMENT)} />
    <ImmeubleRoniers stade={roniers.stade} appel={roniers.appel} nuit={nuit} pause={pause} rythme={rythme} selectionne={objectif === PARCELLE_RONIERS_BATIMENT.slug} onSelect={() => onSelect(PARCELLE_RONIERS_BATIMENT)} />
    {CHANTIERS_DOSSIERS.map(({ dossier, gabarit }) => {
      const etat = chantiersDossiers.find(c => c.id === dossier.id), parcelle = PARCELLES_BATIMENTS.find(b => b.slug === dossier.parcelle.slug);
      return etat && parcelle && <ChantierDossier key={dossier.id} dossier={dossier} gabarit={gabarit} stade={etat.stade} appel={etat.appel} nuit={nuit} pause={pause} rythme={rythme}
        selectionne={objectif === parcelle.slug} onSelect={() => onSelect(parcelle)} />;
    })}
    <Joueur nom={nomJoueur} directions={directions} destination={destination} positionRef={joueur} pause={pause || !!interlocuteur} positionInitiale={positionInitiale} onPosition={onPosition} humeur={humeur} critique={critique} contexte={contexte} bulles={bulles && !interlocuteur} vitesse={4.5 * effetsMeteo(meteo).vitesseMarche} parle={Boolean(interlocuteur)} />
    {/* Le concurrent du fil rouge rôde devant la parcelle Akwaba aux heures de chantier, jusqu'à la livraison. */}
    {routeConcurrent(akwaba.stade, heure) && <Concurrent3D key={routeConcurrent(akwaba.stade, heure)!.join()} route={routeConcurrent(akwaba.stade, heure)!} pause={pause} rythme={rythme} bulles={bulles} onParler={onConcurrent} />}
    {/* Les autres joueurs connectés, avec leur personnage et leurs émotes (monde en ligne). */}
    <VoisinsEnLigne3D voisins={voisins} coequipiers={coequipiers} onSelect={onVoisin} /><EmoteJoueur3D position={joueur} emote={monEmote} />
    {/* Yao, Koffi et Awa vivent une journée continue (lib/journee-pnj) : trajet, travail, déjeuner assis au maquis, soirée,
        retour ; Yao reste à son poste tant qu'une journée de chantier est en cours. Les autres suivent leurs créneaux
        (lib/vie-urbaine) : au travail aux heures de leur lieu, en sortie le soir, chez eux la nuit. */}
    {noms.map((nom, i) => {
      if (JOURNEES_PNJ[nom]) {
        const etape = nom === 'Yao' && yaoAuChantier ? { de: 0, a: 24, phase: 'travail' as const, activite: 'Au chantier', allees: [POSTES_CHANTIER.yao], avancee: 0 } : etapePnj(nom, heure);
        return etape ? <HabitantJournee key={`${nom}-${i}`} nom={nom} identite={IDENTITES_PNJ[nom]} couleur={HABITANTS[i].couleur} variante={i + 1} etape={etape} heure={heure} rythme={rythme} pause={pause} enConversation={interlocuteur === nom}
          joueur={joueur} destination={destination} onParler={onParler} contexte={contexte} bulles={bulles && !interlocuteur} suivi={suiviPnj} /> : null;
      }
      const route = creneauPnj(nom, heure)?.route;
      return route ? <PnjAutonome key={`${nom}-${i}`} nom={nom} couleur={HABITANTS[i].couleur} route={route} depart={i} pause={pause || interlocuteur === nom} joueur={joueur} destination={destination} onParler={onParler} rythme={rythme} contexte={contexte} bulles={bulles && !interlocuteur} suivi={suiviPnj} /> : null;
    })}
    {/* La foule suit l'heure, le quartier et la pluie : le marché le matin, la plage le soir, des rues vides sous l'orage. */}
    {passantsPresents(heure, pluie).map(({ route: i, depart: j }) => <Passant key={`passant-${i}-${j}`} route={ROUTES_PASSANTS[i]} depart={[0, 2][j]} pause={pause} rythme={rythme} couleur={['#5f7f68', '#b66e54', '#5d75a0', '#9670a0'][i % 4]} parapluie={effetsMeteo(meteo).parapluies} />)}
    <CameraSims joueur={joueur} vue={vue} plan={plan} />
  </PersonnagesApresLaVille>;
}
