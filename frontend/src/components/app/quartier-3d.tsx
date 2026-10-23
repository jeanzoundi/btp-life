'use client';

import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, MapControls, Text } from '@react-three/drei';
import { EclairageMonde } from './eclairage-monde';
import { HumainMonde } from './humain-monde';
import { FluiditeMonde, StatistiquesRendu } from './fluidite-monde';
import { orienterProgressivement, type QualiteMonde } from '@/lib/fluidite-monde';
import { itineraireVille } from '@/lib/itineraire-ville';
import { AZIMUT_VUE, decalageVue } from '@/lib/camera-monde';
import { distance as distanceEntre, porteBatiment } from '@/lib/minicarte';
import { progressionVersNiveauSuivant } from '@/lib/niveau';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '@/lib/api';
import type { JoueurActif } from './autres-joueurs';
import { Architecture, PaysageLagune } from './ville-lagune';
import { InteractionLieu } from './interaction-lieu';
import { InterieurLieu3D } from './interieur-lieu-3d';
import { DialoguePersonnage, HABITANTS } from './dialogue-personnage';
import { LIMITES_VILLE, QUARTIERS } from '@/lib/ville';
import { PanneauModesJeu } from './panneau-modes-jeu';
import { ControleZoneMusicale } from './zone-musicale';
import { avancerMode, MODES_JEU, type ModeJeuId } from '@/lib/modes-jeu';
import { useAuthStore } from '@/lib/auth-store';
import { avancerHorloge, peutRestaurerMonde, appliquerTempsEcoule, chargerEtatMondeLocal, choisirEtatMondeRecent, sauvegarderEtatMondeLocal, type EtatMonde } from '@/lib/sauvegarde-monde';
import { besoinCritique, humeurDepuisBesoins, type Humeur } from './besoins';
import { BullePensee, Plumbob3D, usePenseePeriodique } from './humeur-monde';
import { Pluie } from './meteo-monde';
import { ambianceMeteo, LIBELLES_METEO, meteoDuMoment, METEOS, type Meteo } from '@/lib/meteo-monde';
import { penseeJoueur, penseePnj, type ContextePensee } from '@/lib/pensees-monde';
import { alertesBesoins, objectifDuMoment, type CleBesoin } from '@/lib/objectif-monde';
import { BoutonHud, CapObjectif, CarteJoueur, HorlogeMonde, ICONES, JaugesBesoins, PileNotifications, type NotificationMonde, type TypeNotification } from './hud-monde';
import { Minicarte } from './minicarte';
import { ChantierVivant, type ChargementLivraison } from './chantier-vivant';
import { InterieurChantier3D } from './interieur-chantier-3d';
import { PanneauJourneeChantier, PanneauPlanning, PanneauRecrutement, TacheChantier, type ResultatJournee, type StatutJournee } from './panneau-journee-chantier';
import {
  appliquerJournee, bilanJournee, bungalowChantier, CHANTIER_QUARTIER_INITIAL, chantierOuvert, enRepos, enregistrerRecrutement, etapeSimulateur, etatVisuel, etatVisuelSimulateur,
  evenementsDuJour, FIN_DE_JOURNEE, journeeDisponible, lireChantierQuartier, nouvelleJournee, phaseJournee, postesChantier, repondre, situation, tacheALaZone, tachesDisponibles,
  TITRES_PHASES, type ChantierQuartier, type ChantierSimulateur, type EtatVisuel, type Journee, type PhaseJournee, type PosteVille, type SituationTerrain, type TacheJour,
} from '@/lib/journee-chantier';
import { budgetRecrutement, candidats, PROGRAMME, TOTAL_JOURS, type EvaluationEquipe, type Metier, type Ouvrier } from '@/lib/programme-chantier';
import { LIBELLES_STATIONS, type StationChantier } from '@/lib/interieur-chantier';
import { appliquerEffet } from '@/lib/objets-interieurs';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { EMPRISES_PALMIERS, degagerPositionPalmiers } from '@/lib/place-palmiers';
import type { IdentitePersonnage } from '@/lib/identites-personnages';

type Critique = { icone: string; label: string } | null;
const VITESSES = [1, 2, 3] as const;
const NOMS_PNJ = ['Awa', 'Yao', 'Mariam', 'Koffi', 'Fatou'];
// Chaque habitant garde son modèle : Yao est en tenue de chef de chantier, casque compris.
const IDENTITES_PNJ: Record<string, IdentitePersonnage> = { Awa: 'awa', Yao: 'yao', Mariam: 'mariam', Koffi: 'koffi', Fatou: 'fatou' };

type Direction = 'avant' | 'arriere' | 'gauche' | 'droite';
type PointMonde = [number, number];

export interface BesoinsJoueur { energie: number; moral: number; faim: number; social: number; }
interface Batiment3D {
  slug: string; nom: string; href: string;
  position: [number, number, number]; taille: [number, number, number]; couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

const BATIMENTS: Batiment3D[] = [
  { slug: 'universite', nom: 'Université BTP', href: '/app/academie', position: [-29, 4, -23], taille: [17, 8, 12], couleur: '#d8c092', type: 'campus' },
  { slug: 'entreprise', nom: 'Tour BTP Life', href: '/app/entreprise', position: [29, 9, -24], taille: [13, 18, 11], couleur: '#53677a', type: 'tour' },
  { slug: 'chantier', nom: 'Grand chantier', href: '/app/chantiers', position: [31, 2, 22], taille: [21, 4, 15], couleur: '#d97706', type: 'chantier' },
  { slug: 'residence', nom: 'Résidence Lagune', href: '/app/lieu/residence', position: [-31, 4, 22], taille: [15, 8, 12], couleur: '#b45309', type: 'maison' },
  { slug: 'maquis', nom: 'Le Maquis', href: '/app/lieu/maquis', position: [-11, 2.3, 31], taille: [10, 4.6, 8], couleur: '#be563c', type: 'commerce' },
  { slug: 'cafe', nom: 'Café social', href: '/app/lieu/cafe', position: [10, 2.3, -34], taille: [10, 4.6, 8], couleur: '#6b7a3f', type: 'commerce' },
  { slug: 'banque', nom: 'Banque BTL', href: '/app/lieu/banque', position: [-41, 4, -1], taille: [12, 8, 10], couleur: '#d6bd75', type: 'campus' },
  { slug: 'fournisseur', nom: 'Dépôt matériaux', href: '/app/fournisseur', position: [42, 3.5, -1], taille: [14, 7, 11], couleur: '#8e785e', type: 'commerce' },
  { slug: 'mairie', nom: 'Hôtel de ville', href: '/app/lieu/mairie', position: [-26, 4.5, -91], taille: [18, 9, 13], couleur: '#d8ccb2', type: 'campus' },
  { slug: 'laboratoire', nom: 'Laboratoire des matériaux', href: '/app/lieu/laboratoire', position: [28, 3, -91], taille: [16, 6, 12], couleur: '#98b8ae', type: 'campus' },
  { slug: 'bureau-etudes', nom: 'Maison des ingénieurs', href: '/app/competences', position: [0, 6, -114], taille: [16, 12, 10], couleur: '#6e8e99', type: 'tour' },
  { slug: 'jardins-residence', nom: 'Résidences des Jardins', href: '/app/lieu/residence', position: [-88, 3, -33], taille: [14, 6, 12], couleur: '#d7b58b', type: 'maison' },
  { slug: 'marche', nom: 'Marché des Jardins', href: '/app/lieu/maquis', position: [-88, 2, -58], taille: [16, 4, 10], couleur: '#b65d45', type: 'commerce' },
  { slug: 'atelier', nom: 'Atelier de formation', href: '/app/logiciels', position: [87, 3, -33], taille: [18, 6, 12], couleur: '#b1aa82', type: 'campus' },
  { slug: 'logistique', nom: 'Plateforme logistique', href: '/app/depot', position: [88, 3, -54], taille: [22, 6, 14], couleur: '#788d99', type: 'campus' },
  { slug: 'agence', nom: 'Agence des talents', href: '/app/offres', position: [-88, 4.5, -88], taille: [14, 9, 12], couleur: '#a2b5a1', type: 'tour' },
  { slug: 'construction-nord', nom: 'Chantier du Plateau', href: '/app/chantiers', position: [87, 2, -88], taille: [20, 4, 16], couleur: '#c39b64', type: 'chantier' },
  { slug: 'centre-azur', nom: 'Centre commercial Azur', href: '/app/inventaire', position: [-84, 5, 24], taille: [28, 10, 18], couleur: '#88aeb2', type: 'commerce' },
  { slug: 'galerie-palmiers', nom: 'Galerie des Palmiers', href: '/app/inventaire', position: [84, 4, 25], taille: [26, 8, 18], couleur: '#c0936f', type: 'commerce' },
  { slug: 'marina', nom: 'Marina BTP Life', href: '/app/lieu/cafe', position: [89, 2.5, 55], taille: [18, 5, 10], couleur: '#4b858c', type: 'commerce' },
  { slug: 'sports', nom: 'Complexe sportif', href: '/app/recompenses', position: [-89, 3, 55], taille: [20, 6, 10], couleur: '#6f8f55', type: 'campus' },
];
const BATIMENT_CHANTIER = BATIMENTS.find(b => b.slug === 'chantier')!;
const CENTRE_CHANTIER: PointMonde = [BATIMENT_CHANTIER.position[0], BATIMENT_CHANTIER.position[2]];
const POSTES_CHANTIER = postesChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2]);
const LIBELLES_POSTES: Record<PosteVille, string> = { yao: 'Yao', entree: 'Entrer sur le chantier' };
const ANNONCES_PHASES: Record<PhaseJournee, string> = {
  epi: 'Passe au vestiaire pour t’équiper.',
  recrutement: 'Équipé ! Passe au bureau de chantier pour recruter l’équipe.',
  travaux: 'Au travail : les balises dorées montrent les tâches du jour.',
  bilan: 'Tout est fait. Retourne voir Yao, devant la base vie, pour le bilan.',
};
/** Libellé d'une tâche, figé à l'ouverture (la journée peut avancer pendant que le retour s'affiche). */
const libelleTache = (t: TacheJour, journee: Journee) => t.type === 'epi' ? 'Équipement' : t.type === 'livraison' ? 'Réception' : t.type === 'securite' ? 'Sécurité' : `${PROGRAMME.find(e => e.id === journee.etape)?.nom ?? 'Travaux'} · jour ${journee.jourEtape}/${journee.joursEtape}`;
const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];
/** Équipe du Chantier du Plateau, qu'on visite sans y travailler. */
const EQUIPE_VISITE: Ouvrier[] = candidats(7, GROS_OEUVRE).filter(o => o.id.endsWith('-q'));
const ETAT_VISITE = etatVisuel(11);
const EMPRISES=[...BATIMENTS.map(b=>({x:b.position[0],z:b.position[2],largeur:b.taille[0],profondeur:b.taille[2]})), ...EMPRISES_PALMIERS, bungalowChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2])];
const POINTS_DECOUVERTE = [
  { id: 'fontaine-plateau', nom: 'Fontaine du Plateau', position: [0, -52] as PointMonde },
  { id: 'promenade-lagune', nom: 'Promenade de la Lagune', position: [0, 47] as PointMonde },
  { id: 'marche-jardins', nom: 'Marché des Jardins', position: [-88, 11] as PointMonde },
  { id: 'marina', nom: 'Marina BTP Life', position: [89, 47] as PointMonde },
  { id: 'campus-batisseurs', nom: 'Campus des Bâtisseurs', position: [87, -24] as PointMonde },
  { id: 'plage-sables', nom: 'Plage des Sables', position: [-25, 58] as PointMonde },
];

const ROUTES_PNJ: PointMonde[][] = [
  [[-4, -38], [-4, 36], [4, 36], [4, -38]],
  [[-47, -4], [47, -4], [47, 4], [-47, 4]],
  [[-22, 13], [-4, 13], [-4, -13], [22, -13], [22, 13]],
  [[14, 36], [4, 25], [4, 4], [34, 4], [34, 28]],
  [[-42, 6], [-20, 6], [-4, 18], [-4, 35], [-28, 35]],
];
const ROUTES_PASSANTS: PointMonde[][] = [
  [[-112, -12], [-62, -12], [-62, 36], [-110, 36]],
  [[62, -12], [112, -12], [112, 37], [62, 37]],
  [[-42, -73], [-42, -113], [42, -113], [42, -73]],
  [[-108, 44], [-58, 44], [-58, 63], [-108, 63]],
  [[58, 44], [108, 44], [108, 63], [58, 63]],
  [[-48, -58], [48, -58], [48, -74], [-48, -74]],
];

const TOUCHES: Record<string, Direction | undefined> = {
  KeyW: 'avant', KeyZ: 'avant', ArrowUp: 'avant', KeyS: 'arriere', ArrowDown: 'arriere',
  KeyA: 'gauche', KeyQ: 'gauche', ArrowLeft: 'gauche', KeyD: 'droite', ArrowRight: 'droite',
};


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
  return <HumainMonde {...props} scale={1.1}/>;
}
function PersonnageAncien({ nom, couleur = '#c1502e', marche = false, casque = false, variante = 0 }: { nom?: string; couleur?: string; marche?: boolean; casque?: boolean; variante?: number }) {
  const corps = useRef<THREE.Group>(null);
  const brasG = useRef<THREE.Group>(null); const brasD = useRef<THREE.Group>(null);
  const jambeG = useRef<THREE.Group>(null); const jambeD = useRef<THREE.Group>(null);
  const tete = useRef<THREE.Group>(null); const yeux = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 8;
    if (corps.current) corps.current.position.y = marche ? Math.abs(Math.sin(phase)) * 0.07 : Math.sin(clock.elapsedTime * 2) * 0.018;
    const balancement = marche ? Math.sin(phase) * 0.55 : 0;
    if (brasG.current) brasG.current.rotation.x = balancement;
    if (brasD.current) brasD.current.rotation.x = -balancement;
    if (jambeG.current) jambeG.current.rotation.x = -balancement;
    if (jambeD.current) jambeD.current.rotation.x = balancement;
    if (tete.current) tete.current.rotation.y = marche ? Math.sin(phase * 0.5) * 0.06 : Math.sin(clock.elapsedTime * 0.7 + variante) * 0.18;
    if (yeux.current) yeux.current.scale.y = Math.sin(clock.elapsedTime * 0.55 + variante) > 0.985 ? 0.08 : 1;
  });
  const indexPeau = ((variante % 5) + 5) % 5;
  const indexCheveux = ((variante % 3) + 3) % 3;
  const peau = ['#6f3f24', '#8d5524', '#a96f44', '#c58b61', '#74472d'][indexPeau];
  const cheveux = ['#181311', '#2c1b15', '#40271c'][indexCheveux];
  const pantalon = ['#26364a', '#3c3b35', '#263f38', '#4a3540'][Math.abs(variante) % 4];
  return <group ref={corps} scale={0.9}>
    <group position={[0, 1.55, 0]}>
      <mesh castShadow><capsuleGeometry args={[0.39, 0.72, 6, 12]} /><meshStandardMaterial color={couleur} roughness={0.72} /></mesh>
      {casque && <mesh castShadow position={[0, -0.08, 0.38]}><boxGeometry args={[0.52, 0.48, 0.08]} /><meshStandardMaterial color="#f4c430" /></mesh>}
    </group>
    <group ref={brasG} position={[-0.52, 1.86, 0]}><mesh castShadow position={[0, -0.43, 0]}><capsuleGeometry args={[0.13, 0.58, 5, 8]} /><meshStandardMaterial color={peau} /></mesh></group>
    <group ref={brasD} position={[0.52, 1.86, 0]}><mesh castShadow position={[0, -0.43, 0]}><capsuleGeometry args={[0.13, 0.58, 5, 8]} /><meshStandardMaterial color={peau} /></mesh></group>
    <group ref={jambeG} position={[-0.22, 1.05, 0]}><mesh castShadow position={[0, -0.48, 0]}><capsuleGeometry args={[0.16, 0.68, 5, 8]} /><meshStandardMaterial color={pantalon} roughness={0.88} /></mesh><mesh castShadow position={[0, -0.95, 0.1]}><boxGeometry args={[0.3, 0.2, 0.52]} /><meshStandardMaterial color="#342820" /></mesh></group>
    <group ref={jambeD} position={[0.22, 1.05, 0]}><mesh castShadow position={[0, -0.48, 0]}><capsuleGeometry args={[0.16, 0.68, 5, 8]} /><meshStandardMaterial color={pantalon} roughness={0.88} /></mesh><mesh castShadow position={[0, -0.95, 0.1]}><boxGeometry args={[0.3, 0.2, 0.52]} /><meshStandardMaterial color="#342820" /></mesh></group>
    <group ref={tete}><mesh castShadow position={[0, 2.45, 0]} scale={[0.88, 1.12, 0.95]}><sphereGeometry args={[0.4, 18, 18]} /><meshStandardMaterial color={peau} roughness={0.9} /></mesh>
    <group ref={yeux}>{[-0.14, 0.14].map(x => <group key={x} position={[x, 2.5, 0.35]}>
      <mesh scale={[1, 0.65, 0.4]}><sphereGeometry args={[0.078, 10, 8]} /><meshStandardMaterial color="#f5e8d5" /></mesh>
      <mesh position={[0, 0, 0.03]}><sphereGeometry args={[0.036, 8, 8]} /><meshStandardMaterial color="#25201e" /></mesh>
      <mesh position={[0, 0.11, -0.01]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><boxGeometry args={[0.17, 0.035, 0.055]} /><meshStandardMaterial color="#34231c" /></mesh>
    </group>)}</group>
    <mesh position={[0, 2.38, 0.4]} scale={[0.7, 1, 0.9]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color={peau} /></mesh>
    <mesh position={[0, 2.24, 0.35]}><boxGeometry args={[0.17, 0.025, 0.04]} /><meshStandardMaterial color="#633c2b" /></mesh>
    <mesh castShadow position={[0, 2.7, -0.08]} scale={variante % 2 ? [1.08, 0.62, 1.04] : [1.02, 0.48, 1.02]}><sphereGeometry args={[0.41, 16, 16]} /><meshStandardMaterial color={cheveux} roughness={1} /></mesh>
    {variante % 3 === 2 && <mesh castShadow position={[0, 2.82, -0.18]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color={cheveux} roughness={1} /></mesh>}
    {variante % 4 === 0 && <group><mesh position={[0, 1.65, -0.43]}><boxGeometry args={[0.72, 0.9, 0.22]} /><meshStandardMaterial color="#5f4637" /></mesh><mesh position={[-0.34, 1.85, -0.1]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.08, 1.2, 0.08]} /><meshStandardMaterial color="#5f4637" /></mesh><mesh position={[0.34, 1.85, -0.1]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.08, 1.2, 0.08]} /><meshStandardMaterial color="#5f4637" /></mesh></group>}
    {casque && <group position={[0, 2.8, 0]}><mesh castShadow scale={[1.08, 0.48, 1.08]}><sphereGeometry args={[0.46, 16, 12]} /><meshStandardMaterial color="#f4c430" /></mesh><mesh position={[0, -0.08, 0.31]}><boxGeometry args={[0.65, 0.08, 0.26]} /><meshStandardMaterial color="#e3aa16" /></mesh></group>}
    <mesh castShadow position={[0, 3.22, 0]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.24]} /><meshStandardMaterial color="#6fbd45" emissive="#315c16" emissiveIntensity={0.3} /></mesh>
    {nom && <Billboard position={[0, 3.62, 0]}><Text fontSize={0.34} color="#2b2b2e" outlineWidth={0.045} outlineColor="white" anchorX="center" anchorY="middle">{nom}</Text></Billboard>}</group>
  </group>;
}

function Joueur({ nom, directions, destination, positionRef, pause, positionInitiale, onPosition, humeur, critique, contexte, bulles }: { nom?: string; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; positionRef: React.MutableRefObject<THREE.Vector3>; pause: boolean; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; humeur: Humeur; critique: Critique; contexte: ContextePensee; bulles: boolean }) {
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
      const distance=Math.min(mouvement.length(),4.5*Math.min(delta,.05));mouvement.normalize();
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
    <Personnage nom={nom} marche={marche} casque variante={1} identite="batisseur" allure={4.5} /><Plumbob3D humeur={humeur} /><BullePensee pensee={pensee} />
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
function Passant({ route, depart, pause, couleur, rythme }: { route: PointMonde[]; depart: number; pause: boolean; couleur: string; rythme: number }) {
  const ref = useRef<THREE.Group>(null); const index = useRef(depart % route.length);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => { if (!ref.current || pause) return; const cible = route[index.current]; mouvement.set(cible[0] - ref.current.position.x, 0, cible[1] - ref.current.position.z); if (mouvement.lengthSq() < 0.2) index.current = (index.current + 1) % route.length; else { mouvement.normalize(); ref.current.position.addScaledVector(mouvement, 1.5 * Math.min(delta, 0.05) * rythme); ref.current.rotation.y = orienterProgressivement(ref.current.rotation.y, Math.atan2(mouvement.x, mouvement.z), delta); } });
  const point = route[depart % route.length];
  return <group ref={ref} position={[point[0], 0, point[1]]}><Personnage couleur={couleur} marche={!pause} casque={depart % 3 === 0} variante={depart + Math.round(point[0])} allure={1.5 * rythme} /></group>;
}

function CameraSims({ joueur, vue }: { joueur: React.MutableRefObject<THREE.Vector3>; vue?: React.MutableRefObject<{ azimut: number }> }) {
  const [proche,setProche]=useState(true);
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

function Scene({ joueur, vue, suiviPnj, chantier, onPoste, yaoAuChantier, nomJoueur, joueurs, directions, destination, heure, pause, selection, objectif, onSelect, interlocuteur, onParler, positionInitiale, onPosition, decouvertes, onDecouverte, meteo, rythme, humeur, critique, bulles }: { joueur: React.MutableRefObject<THREE.Vector3>; vue: React.MutableRefObject<{ azimut: number }>; suiviPnj: React.MutableRefObject<Map<string, THREE.Vector3>>; chantier: { etat: EtatVisuel; nom: string; livraison: ChargementLivraison | null; postes: { id: PosteVille; position: PointMonde; libelle: string }[] }; onPoste: (poste: PosteVille) => void; yaoAuChantier: boolean; nomJoueur?: string; joueurs: JoueurActif[]; directions: Set<Direction>; destination: React.MutableRefObject<PointMonde | null>; heure: number; pause: boolean; selection: string | undefined; objectif?: string; onSelect: (b: Batiment3D) => void; interlocuteur: string | null; onParler: (nom: string) => void; positionInitiale?: PointMonde; onPosition?: (p: PointMonde) => void; decouvertes: string[]; onDecouverte: (id: string, nom: string) => void; meteo: Meteo; rythme: number; humeur: Humeur; critique: Critique; bulles: boolean }) {
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
    <PaysageLagune pause={pause} rythme={rythme} onDestination={choisirDestination} /><MarqueurDestination destination={destination} />
    {POINTS_DECOUVERTE.map(point => <PointDecouverte key={point.id} point={point} trouve={decouvertes.includes(point.id)} onTrouver={(id, nom) => {
      if (Math.hypot(joueur.current.x - point.position[0], joueur.current.z - point.position[1]) <= 6) onDecouverte(id, nom);
      else destination.current = point.position;
    }} />)}
    {BATIMENTS.map((b) => b.slug === 'chantier'
      ? <ChantierVivant key={b.slug} centre={CENTRE_CHANTIER} largeur={b.taille[0]} profondeur={b.taille[2]} etat={chantier.etat} nomChantier={chantier.nom} livraison={chantier.livraison} postes={chantier.postes} pause={pause} rythme={rythme} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onPoste={onPoste} onSelect={() => onSelect(b)} />
      : <Batiment key={b.slug} batiment={b} nuit={nuit} selectionne={selection === b.slug || objectif === b.slug} onSelect={onSelect} />)}
    <Joueur nom={nomJoueur} directions={directions} destination={destination} positionRef={joueur} pause={pause || !!interlocuteur} positionInitiale={positionInitiale} onPosition={onPosition} humeur={humeur} critique={critique} contexte={contexte} bulles={bulles && !interlocuteur} />
    {noms.map((nom, i) => <PnjAutonome key={`${nom}-${i}`} nom={nom} couleur={HABITANTS[i].couleur} route={nom === 'Yao' && yaoAuChantier ? [POSTES_CHANTIER.yao] : ROUTES_PNJ[i]} depart={i} pause={pause || interlocuteur === nom} joueur={joueur} destination={destination} onParler={onParler} rythme={rythme} contexte={contexte} bulles={bulles && !interlocuteur} suivi={suiviPnj} />)}
    {ROUTES_PASSANTS.flatMap((route, i) => [0, 2].map((depart, j) => <Passant key={`passant-${i}-${j}`} route={route} depart={depart} pause={pause} rythme={rythme} couleur={['#5f7f68', '#b66e54', '#5d75a0', '#9670a0'][i % 4]} />))}
    <CameraSims joueur={joueur} vue={vue} />
  </>;
}

function BoutonDirection({ direction, symbole, setDirection }: { direction: Direction; symbole: string; setDirection: (d: Direction, actif: boolean) => void }) {
  return <button type="button" aria-label={direction} className="hud-verre hud-bouton h-10 w-10 select-none rounded-xl text-base" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection(direction, true); }} onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}>{symbole}</button>;
}

export interface ProfilJoueur { argent?: number; niveau?: number; poste?: string; xp?: number; reputation?: number }

export function Quartier3D({ nomJoueur, besoins, profil, demo = false, immersif = false }: { nomJoueur?: string; besoins?: BesoinsJoueur; profil?: ProfilJoueur; demo?: boolean; immersif?: boolean }) {
  const userId = useAuthStore((s) => s.user?.id);
  const directionsRef = useRef(new Set<Direction>());
  const destination = useRef<PointMonde | null>(null);
  const [, rafraichir] = useState(0);
  const [heure, setHeure] = useState(16);
  const [qualite, setQualite] = useState<QualiteMonde>('auto');
  useEffect(() => {
    try { const choix = localStorage.getItem('btp-life-qualite'); if (choix === 'fluide' || choix === 'elevee' || choix === 'auto') setQualite(choix); } catch { /* Stockage facultatif. */ }
  }, []);
  const [pause, setPause] = useState(false);
  // Vitesse et météo forcée restent propres à la session : le format de sauvegarde ne change pas.
  const [vitesse, setVitesse] = useState<(typeof VITESSES)[number]>(1);
  const vitesseRef = useRef(1);
  const [meteoForcee, setMeteoForcee] = useState<Meteo | null>(null);
  const [selection, setSelection] = useState<Batiment3D | null>(null);
  const [interieur, setInterieur] = useState<Batiment3D | null>(null);
  const lieuEnApproche = useRef<Batiment3D | null>(null);
  const [interlocuteur, setInterlocuteur] = useState<string | null>(null);
  const [relations, setRelations] = useState<Record<string, number>>({});
  const parler = useCallback((nom: string) => { setDialogueLibre(false); setInterlocuteur(nom); setSelection(null); directionsRef.current.clear(); destination.current = null; }, []);
  const [plan, setPlan] = useState(false);
  const [options, setOptions] = useState(false);
  const [cameraProche,setCameraProche]=useState(true);
  const [zonePlan, setZonePlan] = useState('Toutes les zones');
  const [demoStats, setDemoStats] = useState(besoins ?? { energie: 78, moral: 82, faim: 64, social: 70 });
  const [notifications, setNotifications] = useState<NotificationMonde[]>([]);
  const compteurNotifications = useRef(0);
  const fermerNotification = useCallback((id: number) => setNotifications(n => n.filter(x => x.id !== id)), []);
  /** Ajoute un événement au fil (trois au plus) ; il se retire seul après quelques secondes. */
  const notifier = useCallback((texte: string, type: TypeNotification = 'info', action?: NotificationMonde['action']) => {
    const id = ++compteurNotifications.current;
    setNotifications(n => [...n.filter(x => x.texte !== texte), { id, texte, type, action }].slice(-3));
    window.setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), action ? 10000 : 6000);
  }, []);
  // Lues par la minicarte et la flèche d'objectif, écrites par la scène à chaque image : aucun rendu React en plus.
  const joueurRef = useRef(new THREE.Vector3());
  const vueRef = useRef({ azimut: AZIMUT_VUE });
  const suiviPnj = useRef(new Map<string, THREE.Vector3>());
  const [large, setLarge] = useState(true);
  // Journée de travail au Grand chantier : chantier du quartier (gardé dans le navigateur) ou vrai chantier du simulateur.
  const client = useQueryClient();
  const cleChantier = `btp-life-chantier-quartier:${userId ?? 'demo'}`;
  const [chantierQuartier, setChantierQuartier] = useState<ChantierQuartier>(CHANTIER_QUARTIER_INITIAL);
  useEffect(() => { try { setChantierQuartier(lireChantierQuartier(JSON.parse(localStorage.getItem(cleChantier) ?? 'null'))); } catch { /* Stockage facultatif. */ } }, [cleChantier]);
  const enregistrerChantier = useCallback((c: ChantierQuartier) => { setChantierQuartier(c); try { localStorage.setItem(cleChantier, JSON.stringify(c)); } catch { /* Stockage facultatif. */ } }, [cleChantier]);
  const [journee, setJournee] = useState<Journee | null>(null);
  const [resultatJournee, setResultatJournee] = useState<ResultatJournee | null>(null);
  const [tache, setTache] = useState<{ id: string; situation: SituationTerrain; etape: string } | null>(null);
  const [recrutementOuvert, setRecrutementOuvert] = useState(false);
  const [recrues, setRecrues] = useState<Ouvrier[]>([]);
  const [planningOuvert, setPlanningOuvert] = useState(false);
  const [dialogueLibre, setDialogueLibre] = useState(false);
  const posteEnApproche = useRef<PosteVille | null>(null);
  const [progresDemo, setProgresDemo] = useState({ argent: 150_000, xp: 760 });
  const { data: chantiersSimulateur } = useQuery({ queryKey: ['chantiers', 'mine'], queryFn: () => api.get<ChantierSimulateur[]>('/chantiers/mine'), enabled: !demo, staleTime: 60_000 });
  const chantierActif = chantiersSimulateur?.find(c => c.statut === 'en_cours');
  const jouerJournee = useMutation({
    mutationFn: (id: string) => api.post<ChantierSimulateur>(`/chantiers/mine/${id}/journee`),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['chantiers'] }); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); },
  });
  useEffect(() => {
    const requete = window.matchMedia('(min-width: 640px)');
    const suivre = () => setLarge(requete.matches);
    suivre(); requete.addEventListener('change', suivre);
    return () => requete.removeEventListener('change', suivre);
  }, []);
  const [mode, setMode] = useState<ModeJeuId>('libre');
  const [menuModes, setMenuModes] = useState(false);
  const [etapeMode, setEtapeMode] = useState(0);
  const [score, setScore] = useState(0);
  const [secondes, setSecondes] = useState<number | null>(null);
  const [decouvertes, setDecouvertes] = useState<string[]>([]);
  const [records, setRecords] = useState<Partial<Record<ModeJeuId, number>>>({});
  const [positionInitiale, setPositionInitiale] = useState<PointMonde | undefined>();
  const [positionCourante, setPositionCourante] = useState<PointMonde>([0, 0]);
  const [etatSauvegarde, setEtatSauvegarde] = useState<'chargement' | 'sauvegarde' | 'sauvegarde-ok' | 'erreur'>(demo ? 'sauvegarde-ok' : 'chargement');
  const etatRef = useRef<EtatMonde | null>(null);
  const modifieRef = useRef(false);
  const localModifieRef = useRef(false);
  const pretRef = useRef(demo);
  const horlogeRef = useRef({ heure: 16, instant: Date.now(), pause: false });
  const hydratationRef = useRef(false);
  const modeActif = MODES_JEU.find(m => m.id === mode)!;
  const quartierActuel = useMemo(() => [...QUARTIERS].sort((a, b) => Math.hypot(positionCourante[0] - a.x, positionCourante[1] - a.z) - Math.hypot(positionCourante[0] - b.x, positionCourante[1] - b.z))[0] ?? QUARTIERS[0], [positionCourante]);
  const choisir = useCallback((b: Batiment3D) => {
    if (!pretRef.current) return;
    const distance = Math.hypot(Math.max(0, Math.abs(positionCourante[0] - b.position[0]) - b.taille[0] / 2), Math.max(0, Math.abs(positionCourante[1] - b.position[2]) - b.taille[2] / 2));
    if (distance > 5) {
      const [x, , z] = b.position;
      // On arrive par la porte, côté façade : la vue d'ensemble se tient au sud, le joueur n'est jamais caché par le bâtiment.
      destination.current = [x, THREE.MathUtils.clamp(z + b.taille[2] / 2 + 2, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]; lieuEnApproche.current = b;
      notifier(`En route vers ${b.nom}.`, 'trajet'); setPlan(false); return;
    }
    lieuEnApproche.current = null;
    setSelection(b); setPlan(false); directionsRef.current.clear(); destination.current = null;
    if (mode === 'libre' || secondes === 0) return;
    const resultat = avancerMode(MODES_JEU.find(m => m.id === mode)!, etapeMode, b.slug);
    if (resultat.points) {
      const bonus = resultat.termine ? Math.max(0, secondes ?? 0) * 5 : 0;
      const nouveauScore = score + resultat.points + bonus;
      setEtapeMode(resultat.etape); setScore(nouveauScore);
      if (resultat.termine) setRecords(r => ({ ...r, [mode]: Math.max(r[mode] ?? 0, nouveauScore) }));
      notifier(resultat.termine ? `Mission accomplie ! Bonus rapidité : ${bonus} points. Rejoue pour améliorer ton record.` : `Objectif validé ! +${resultat.points} points.`, 'succes');
    } else notifier(`Ce lieu n'est pas l'objectif actuel. Consulte le planning du jour.`, 'info');
  }, [mode, secondes, etapeMode, score, positionCourante, notifier]);
  useEffect(() => {
    const poste = posteEnApproche.current;
    if (poste && Math.hypot(positionCourante[0] - POSTES_CHANTIER[poste][0], positionCourante[1] - POSTES_CHANTIER[poste][1]) <= 4.5) {
      posteEnApproche.current = null;
      if (poste === 'yao') parler('Yao'); else { setInterieur(BATIMENT_CHANTIER); setSelection(null); destination.current = null; }
    }
    const lieu = lieuEnApproche.current;
    if (!lieu) return;
    // Arrivée validée devant la porte, pas en longeant un mur pendant le contournement.
    const porte = [lieu.position[0], THREE.MathUtils.clamp(lieu.position[2] + lieu.taille[2] / 2 + 2, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)];
    if (Math.hypot(positionCourante[0] - porte[0], positionCourante[1] - porte[1]) <= 2.5) choisir(lieu);
  }, [positionCourante, choisir]);
  const changerMode = useCallback((id: ModeJeuId) => {
    const nouveau = MODES_JEU.find(m => m.id === id)!;
    setMode(id); setEtapeMode(0); setScore(0); setSecondes(nouveau.duree); setMenuModes(false); setSelection(null); notifier(id === 'libre' ? 'Exploration libre activée.' : `${nouveau.nom} lancé : suis les objectifs.`, 'info');
  }, [notifier]);
  const { data: joueurs = [] } = useQuery({ queryKey: ['carriere', 'joueurs-actifs'], queryFn: () => api.get<JoueurActif[]>('/carriere/joueurs-actifs'), staleTime: 45_000, refetchInterval: 45_000, enabled: !demo });
  const { data: etatMonde, isFetchedAfterMount, isFetching, isError } = useQuery({
    queryKey: ['carriere', 'monde'],
    queryFn: () => api.get<EtatMonde>('/carriere/monde'),
    enabled: !demo,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const directions = useMemo(() => directionsRef.current, []);
  useEffect(() => {
    if (demo || pretRef.current) return;
    const local = chargerEtatMondeLocal(userId);
    if (!peutRestaurerMonde(isFetchedAfterMount, isFetching, isError, Boolean(local))) {
      if (isFetchedAfterMount && isError && !local) setEtatSauvegarde('erreur');
      return;
    }
    const plusRecent = isError ? local ?? undefined : choisirEtatMondeRecent(etatMonde, local);
    if (!plusRecent) return;
    const etat = appliquerTempsEcoule(plusRecent);
    hydratationRef.current = true;
    const positionLibre = degagerPositionPalmiers([etat.position.x, etat.position.z]);
    setPositionInitiale(positionLibre); setPositionCourante(positionLibre);
    setRelations(etat.relations ?? {}); setMode(etat.mode); setEtapeMode(etat.etapeMode); setScore(etat.score); setSecondes(etat.secondes);
    setDecouvertes(etat.decouvertes ?? []); setRecords(etat.records ?? {});
    setHeure(etat.heure); setPause(etat.pause);
    horlogeRef.current = { heure: etat.heure, instant: Date.now(), pause: etat.pause };
    etatRef.current = etat;
    pretRef.current = true;
    if (etat !== etatMonde) modifieRef.current = true;
    setEtatSauvegarde(isError ? 'erreur' : 'sauvegarde-ok');
  }, [etatMonde, demo, userId, isFetchedAfterMount, isFetching, isError]);
  useEffect(() => {
    if (!pretRef.current) return;
    if (hydratationRef.current) { hydratationRef.current = false; return; }
    const quartier = [...QUARTIERS].sort((a, b) => Math.hypot(positionCourante[0] - a.x, positionCourante[1] - a.z) - Math.hypot(positionCourante[0] - b.x, positionCourante[1] - b.z))[0]?.nom ?? 'Les Palmiers';
    const maintenant = Date.now();
    horlogeRef.current = { ...avancerHorloge(horlogeRef.current, maintenant, vitesseRef.current), pause };
    const etat: EtatMonde = { version: 4, position: { x: positionCourante[0], z: positionCourante[1] }, quartier, relations, mode, etapeMode, score, secondes, heure: horlogeRef.current.heure, heureCalculeeLe: new Date(maintenant).toISOString(), pause, decouvertes, records, sauvegardeLe: new Date(maintenant).toISOString() };
    etatRef.current = etat;
    if (pretRef.current && !demo) {
      localModifieRef.current = true;
      if (hydratationRef.current) hydratationRef.current = false;
      else modifieRef.current = true;
    }
  }, [positionCourante, relations, mode, etapeMode, score, secondes, pause, decouvertes, records, demo]);
  useEffect(() => {
    if (demo) return;
    let enCours = false;
    const sauvegarder = async () => {
      if (enCours || !pretRef.current || !modifieRef.current || !etatRef.current) return;
      enCours = true;
      const instantane = etatRef.current;
      modifieRef.current = false; setEtatSauvegarde('sauvegarde');
      try {
        const enregistre = await api.patch<EtatMonde>('/carriere/monde', { etat: instantane });
        if (etatRef.current === instantane) {
          etatRef.current = enregistre;
          sauvegarderEtatMondeLocal(userId, enregistre);
          localModifieRef.current = false;
        }
        setEtatSauvegarde('sauvegarde-ok');
      }
      catch { modifieRef.current = true; setEtatSauvegarde('erreur'); }
      finally { enCours = false; }
    };
    const sauvegarderAvantSortie = () => {
      if (!pretRef.current || !modifieRef.current || !etatRef.current) return;
      sauvegarderEtatMondeLocal(userId, etatRef.current);
      localModifieRef.current = false;
      void api.patchKeepalive('/carriere/monde', { etat: etatRef.current });
    };
    const sauvegarderLocal = () => {
      if (!pretRef.current || !localModifieRef.current || !etatRef.current) return;
      sauvegarderEtatMondeLocal(userId, etatRef.current);
      localModifieRef.current = false;
    };
    const surVisibilite = () => { if (document.visibilityState === 'hidden') sauvegarderAvantSortie(); };
    const timerLocal = window.setInterval(sauvegarderLocal, 5000);
    const timerServeur = window.setInterval(sauvegarder, 30000);
    window.addEventListener('pagehide', sauvegarderAvantSortie);
    document.addEventListener('visibilitychange', surVisibilite);
    return () => {
      window.clearInterval(timerLocal);
      window.clearInterval(timerServeur);
      window.removeEventListener('pagehide', sauvegarderAvantSortie);
      document.removeEventListener('visibilitychange', surVisibilite);
      sauvegarderAvantSortie();
    };
  }, [demo, userId]);
  useEffect(() => {
    if (pause) return;
    // Toujours cinq minutes de jeu par pas, quelle que soit la vitesse : le soleil avance sans à-coups visibles.
    const timer = window.setInterval(() => {
      if (pretRef.current) setHeure(avancerHorloge(horlogeRef.current, Date.now(), vitesseRef.current).heure);
    }, 5000 / vitesse);
    return () => window.clearInterval(timer);
  }, [pause, vitesse]);
  const changerVitesse = useCallback((nouvelle: (typeof VITESSES)[number]) => {
    // Recale l'horloge à l'ancienne vitesse avant de changer, pour ne pas réécrire le temps déjà écoulé.
    const maintenant = Date.now();
    horlogeRef.current = { ...avancerHorloge(horlogeRef.current, maintenant, vitesseRef.current), pause: false };
    vitesseRef.current = nouvelle;
    setVitesse(nouvelle); setPause(false); setHeure(horlogeRef.current.heure);
  }, []);
  useEffect(() => {
    if (pause || secondes === null || secondes <= 0 || etapeMode >= modeActif.etapes.length) return;
    const timer = window.setInterval(() => setSecondes(s => s === null ? null : Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pause, secondes, etapeMode, modeActif.etapes.length]);
  useEffect(() => {
    const changer = (code: string, actif: boolean) => { const direction = TOUCHES[code]; if (!direction) return; if (actif) directions.add(direction); else directions.delete(direction); };
    if (interieur) { directions.clear(); return; }
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return; if (e.code === 'Escape') { setSelection(null); setInterlocuteur(null); setPlan(false); setOptions(false); setMenuModes(false); destination.current = null; lieuEnApproche.current = null; directions.clear(); } if (TOUCHES[e.code]) { e.preventDefault(); lieuEnApproche.current = null; changer(e.code, true); return; } if (e.ctrlKey || e.metaKey || e.altKey) return; const touche = e.key.toLowerCase(); if (touche === 'm') { setPlan(v => !v); setOptions(false); setSelection(null); } else if (touche === 'j') setMenuModes(v => !v); else if (touche === 'o') { setOptions(v => !v); setPlan(false); } else if (touche === 'p') setPause(v => !v); else if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') changerVitesse(Number(e.code.slice(-1)) as (typeof VITESSES)[number]); };
    const up = (e: KeyboardEvent) => changer(e.code, false);
    const clear = () => directions.clear();
    window.addEventListener('blur', clear);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', clear); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); document.body.style.cursor = 'default'; };
  }, [directions, interieur, changerVitesse]);
  const setDirection = (d: Direction, actif: boolean) => { if (actif) { lieuEnApproche.current = null; directions.add(d); } else directions.delete(d); rafraichir((v) => v + 1); };
  const minutesTotales = Math.floor(heure * 60) % 1440;
  const affichageHeure = `${String(Math.floor(minutesTotales / 60)).padStart(2, '0')}:${String(minutesTotales % 60).padStart(2, '0')}`;
  const stats = demo ? demoStats : besoins ?? { energie: 78, moral: 82, faim: 64, social: 70 };
  const humeur = humeurDepuisBesoins(stats);
  const critique = besoinCritique(stats);
  const meteo = meteoForcee ?? meteoDuMoment(new Date(), heure);
  const nuit = heure >= 19 || heure < 6;
  const libelleSauvegarde = demo ? 'Aperçu libre' : etatSauvegarde === 'chargement' ? 'Chargement de la partie…' : etatSauvegarde === 'sauvegarde' ? 'Sauvegarde…' : etatSauvegarde === 'erreur' ? 'Sauvegarde locale · serveur à reprendre' : '✓ Partie sauvegardée';
  const etapeEnCours = mode !== 'libre' ? modeActif.etapes[etapeMode] : undefined;
  const objectifVie = objectifDuMoment(stats, decouvertes.length, POINTS_DECOUVERTE.length);
  const travailPropose = !etapeEnCours && !journee && !objectifVie.lieu && journeeDisponible(chantierQuartier, heure, Date.now());
  const phase = journee ? phaseJournee(journee) : null;
  const surLeChantier = interieur?.slug === 'chantier';
  const travauxDuJour = journee ? journee.taches.filter(t => t.type !== 'epi' && t.type !== 'recrutement') : [];
  const objectif: { texte: string; etiquette?: string; lieu?: string } = etapeEnCours
    ? { texte: etapeEnCours.titre, etiquette: secondes !== null ? `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}` : `${etapeMode + 1}/${modeActif.etapes.length}` }
    : journee && phase ? (surLeChantier ? { texte: TITRES_PHASES[phase], etiquette: phase === 'travaux' ? `${travauxDuJour.filter(t => journee.reponses[t.id] !== undefined).length}/${travauxDuJour.length}` : undefined, lieu: 'chantier' } : { texte: 'Retourne sur le chantier', lieu: 'chantier' })
    : travailPropose ? { texte: 'Journée de travail avec Yao', etiquette: '6 h – 18 h', lieu: 'chantier' }
    : objectifVie;
  const argent = profil?.argent ?? (demo ? progresDemo.argent : undefined);
  const niveau = profil?.niveau ?? (demo ? 3 : 1);
  const progressionXp = progressionVersNiveauSuivant(profil?.xp ?? (demo ? progresDemo.xp : 0), niveau).pct;
  const reputation = profil?.reputation ?? (demo ? 520 : undefined);
  const couleurSauvegarde = etatSauvegarde === 'erreur' ? '#E2653C' : etatSauvegarde === 'sauvegarde-ok' ? '#4CC3A5' : 'rgb(251 245 234 / .3)';
  const hautHud = immersif ? 'top-20' : 'top-3';
  const allerVers = (slug: string) => { const lieu = BATIMENTS.find(b => b.slug === slug); if (lieu) { setMenuModes(false); setInterlocuteur(null); choisir(lieu); } };
  // Cible de l'objectif : la porte du lieu à rejoindre, ou le repère non découvert le plus proche.
  const lieuObjectif = etapeEnCours?.lieu ?? ('lieu' in objectif ? objectif.lieu : undefined);
  const batimentObjectif = lieuObjectif ? BATIMENTS.find(b => b.slug === lieuObjectif) : undefined;
  const repereProche = useMemo(() => POINTS_DECOUVERTE.filter(p => !decouvertes.includes(p.id)).sort((a, b) => distanceEntre(a.position, positionCourante) - distanceEntre(b.position, positionCourante))[0], [decouvertes, positionCourante]);
  // Pendant la journée, la flèche ramène à l'entrée du chantier ; avant, elle vise Yao.
  const posteCible: PosteVille | null = journee ? 'entree' : travailPropose ? 'yao' : null;
  const cibleObjectif: PointMonde | null = posteCible ? POSTES_CHANTIER[posteCible]
    : batimentObjectif ? porteBatiment(batimentObjectif.position, batimentObjectif.taille, LIMITES_VILLE)
    : !etapeEnCours && objectif.texte === 'Trouve les repères' && repereProche ? repereProche.position : null;
  // Pendant une journée, le chantier montre le jour joué (un nouvel ouvrage peut démarrer après une livraison).
  const etatChantier = useMemo(() => chantierActif ? etatVisuelSimulateur(chantierActif) : etatVisuel(journee ? journee.numero : chantierQuartier.jours), [chantierActif, journee?.numero, chantierQuartier.jours]); // eslint-disable-line react-hooks/exhaustive-deps
  const nomChantier = chantierActif?.chantier.nom ?? 'Résidence Lagune II';
  const statutJournee: StatutJournee = resultatJournee ? 'resultat' : journee ? (phase === 'bilan' ? 'bilan' : 'en_cours') : !chantierOuvert(heure) ? 'ferme' : enRepos(chantierQuartier, heure, Date.now()) ? 'repos' : 'disponible';
  const tacheLivraison = journee?.taches.find(t => t.type === 'livraison');
  const livraisonEnCours = journee && phase === 'travaux' && tacheLivraison && journee.reponses[tacheLivraison.id] === undefined ? journee.livraison : null;
  const postesVisibles: PosteVille[] = journee ? ['entree'] : statutJournee === 'disponible' ? ['yao'] : [];
  const postesInterieur = useMemo<StationChantier[]>(() => journee ? (phase === 'bilan' ? ['yao'] : [...new Set(tachesDisponibles(journee).map(t => t.zone))]) : statutJournee === 'disponible' ? ['yao'] : [], [journee, phase, statutJournee]);
  // L'équipe visible sur le chantier : celle du quartier, plus les recrues du jour (elles signent au bilan).
  const equipeChantier = useMemo(() => chantierActif ? [] : [...chantierQuartier.equipe.filter(o => !recrues.some(r => r.metier === o.metier)), ...recrues], [chantierActif, chantierQuartier.equipe, recrues]);
  const chantierScene = useMemo(() => ({
    etat: etatChantier, nom: nomChantier, livraison: livraisonEnCours,
    postes: postesVisibles.map(id => ({ id, position: POSTES_CHANTIER[id], libelle: LIBELLES_POSTES[id] })),
  }), [etatChantier, nomChantier, livraisonEnCours, postesVisibles.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const entrerSurLeChantier = () => { setInterieur(BATIMENT_CHANTIER); setSelection(null); directionsRef.current.clear(); destination.current = null; };
  /** Balise de la ville touchée : on y va, puis on parle à Yao ou l'on entre sur le chantier. */
  const surPoste = (poste: PosteVille) => {
    const point = POSTES_CHANTIER[poste];
    if (Math.hypot(joueurRef.current.x - point[0], joueurRef.current.z - point[1]) > 4.5) {
      posteEnApproche.current = poste; lieuEnApproche.current = null; setSelection(null); destination.current = point;
      notifier(poste === 'yao' ? 'En route pour retrouver Yao.' : 'En route vers l’entrée du chantier.', 'trajet');
      return;
    }
    if (poste === 'yao') parler('Yao'); else entrerSurLeChantier();
  };
  const commencerJournee = () => {
    setJournee(nouvelleJournee(chantierQuartier, chantierActif ? etapeSimulateur(chantierActif) : undefined));
    setRecrues([]); setResultatJournee(null); setInterlocuteur(null);
    if (!surLeChantier) entrerSurLeChantier();
    notifier('Journée commencée : passe d’abord au vestiaire pour t’équiper.', 'trajet');
  };
  /** Poste du chantier atteint : la tâche qui s'y fait maintenant, le recrutement, ou Yao. */
  const surStation = (station: StationChantier) => {
    if (station === 'yao') { parler('Yao'); return; }
    if (!journee || !phase) { notifier(`${LIBELLES_STATIONS[station]} : rien à faire ici pour l’instant.`, 'info'); return; }
    const t = tacheALaZone(journee, station);
    if (!t) { notifier(phase === 'bilan' ? 'La journée est faite : va voir Yao pour le bilan.' : `Pas encore : ${TITRES_PHASES[phase].toLowerCase()} d’abord.`, 'info'); return; }
    if (t.type === 'recrutement') { setRecrutementOuvert(true); return; }
    const s = situation(t.id);
    if (s) setTache({ id: t.id, situation: s, etape: libelleTache(t, journee) });
  };
  const annoncerSuite = (avant: Journee, apres: Journee) => {
    const p = phaseJournee(apres);
    if (p !== phaseJournee(avant)) notifier(ANNONCES_PHASES[p], p === 'bilan' ? 'succes' : 'trajet');
  };
  const repondreTache = (id: string, choix: number) => {
    if (!journee) return;
    const suivante = repondre(journee, id, choix);
    setJournee(suivante); annoncerSuite(journee, suivante);
  };
  const validerRecrutement = (choisis: Ouvrier[], evaluation: EvaluationEquipe) => {
    if (!journee) return;
    setRecrues(r => [...r.filter(o => !choisis.some(c => c.metier === o.metier)), ...choisis]);
    const suivante = enregistrerRecrutement(journee, evaluation.note);
    setJournee(suivante); annoncerSuite(journee, suivante);
  };
  const faireLeBilan = () => {
    if (!journee) return;
    const bilan = bilanJournee(journee), heureFin = Math.max(heure, FIN_DE_JOURNEE), maintenant = Date.now();
    if (chantierActif) {
      // Vrai chantier : la journée passe par le simulateur (salaires, matériaux, imprévus) ; on se repose ensuite jusqu'au lendemain.
      const avant = etatChantier.avancement;
      enregistrerChantier({ ...chantierQuartier, journees: chantierQuartier.journees + 1, repos: { heure: heureFin, le: maintenant } });
      jouerJournee.mutate(chantierActif.id, {
        onSuccess: res => setResultatJournee({ bilan, avant, apres: res.statut === 'en_cours' ? res.avancementPct : 100, recompenses: 'simulateur', evenements: evenementsDuJour(res) }),
        onError: (erreur: Error) => setResultatJournee({ bilan, avant, apres: avant, recompenses: 'simulateur', erreur: erreur.message, idChantier: chantierActif.id }),
      });
      return;
    }
    const apres = appliquerJournee(chantierQuartier, journee, bilan, recrues, heureFin, maintenant);
    enregistrerChantier(apres); setRecrues([]);
    if (demo) {
      setProgresDemo(p => ({ argent: p.argent + bilan.paie, xp: p.xp + bilan.xp }));
      setDemoStats(s => ({ ...s, energie: Math.max(0, s.energie - 8), faim: Math.max(0, s.faim - 6) }));
    }
    setResultatJournee({
      bilan, avant: Math.round(journee.numero / TOTAL_JOURS * 100), apres: Math.round(apres.jours / TOTAL_JOURS * 100), recompenses: demo ? 'demo' : 'apprentissage',
      etapeAvant: PROGRAMME.find(e => e.id === journee.etape)?.nom, etapeApres: etatVisuel(apres.jours).nom,
    });
  };
  const terminerJournee = () => {
    const r = resultatJournee;
    setResultatJournee(null); setJournee(null); setRecrues([]); setInterlocuteur(null);
    // Fin de journée à 17 h, comme une vraie journée de chantier.
    if (horlogeRef.current.heure < FIN_DE_JOURNEE && horlogeRef.current.heure >= 6) { horlogeRef.current = { heure: FIN_DE_JOURNEE, instant: Date.now(), pause: horlogeRef.current.pause }; setHeure(FIN_DE_JOURNEE); }
    if (!r) return;
    if (r.recompenses === 'simulateur') notifier(`Journée terminée : le chantier est à ${Math.round(r.apres)} %.`, 'succes');
    else if (!r.bilan.compte) notifier('Journée à refaire : le chantier n’a pas avancé.', 'alerte');
    else notifier(r.apres >= 100 ? 'Ouvrage livré ! Un nouvel ouvrage démarrera demain.' : `Journée terminée : chantier à ${Math.round(r.apres)} % · demain, ${r.etapeApres?.toLowerCase() ?? 'la suite'}.`, 'succes');
  };
  /** Échap sur le chantier : ferme d'abord le panneau ouvert. */
  const fermerPanneauChantier = () => {
    if (tache) { setTache(null); return true; }
    if (recrutementOuvert) { setRecrutementOuvert(false); return true; }
    if (planningOuvert) { setPlanningOuvert(false); return true; }
    if (interlocuteur) { if (resultatJournee) terminerJournee(); else setInterlocuteur(null); return true; }
    return false;
  };
  const sortirDuChantier = (nom: string) => { directions.clear(); setInterieur(null); setTache(null); setRecrutementOuvert(false); setPlanningOuvert(false); notifier(`Tu es sorti de ${nom}.`, 'info'); };
  const reperesCarte = useMemo(() => POINTS_DECOUVERTE.map(p => ({ id: p.id, position: p.position, trouve: decouvertes.includes(p.id) })), [decouvertes]);
  // Un besoin qui devient critique déclenche une alerte avec le trajet vers le bon lieu (une fois, jusqu'à remontée).
  const signalesRef = useRef(new Set<CleBesoin>());
  useEffect(() => {
    const { nouvelles, signales } = alertesBesoins(stats, signalesRef.current);
    signalesRef.current = signales;
    for (const alerte of nouvelles) notifier(`${alerte.texte} (${Math.round(stats[alerte.cle])} %).`, 'alerte', { label: alerte.action, executer: () => allerVers(alerte.lieu) });
  });
  useEffect(() => { if (etatSauvegarde === 'erreur' && !demo) notifier('Sauvegarde locale : le serveur reprendra dès que possible.', 'alerte'); }, [etatSauvegarde, demo, notifier]);
  // Accueil une seule fois, même avec le double montage du mode strict.
  const accueilFait = useRef(false);
  useEffect(() => {
    if (accueilFait.current) return;
    accueilFait.current = true;
    window.setTimeout(() => notifier(demo ? 'Bienvenue aux Palmiers ! Touche un bâtiment, le sol ou la minicarte pour te déplacer.' : `Content de te revoir${nomJoueur ? `, ${nomJoueur}` : ''} !`, 'info'), 1500);
  }, [demo, nomJoueur, notifier]);
  const cap = <CapObjectif texte={objectif.texte} etiquette={objectif.etiquette} cible={cibleObjectif} joueur={joueurRef} vue={vueRef} ouvert={menuModes} onClick={() => setMenuModes(v => !v)} compacte={!large} />;
  // Panneaux de la journée : dans la ville devant le portail, ou par-dessus l'intérieur du chantier.
  const panneauxChantier = <>
    {interlocuteur === 'Yao' && !dialogueLibre && <PanneauJourneeChantier statut={statutJournee} nomJoueur={nomJoueur ?? 'Bâtisseur'} nomChantier={nomChantier} etat={etatChantier} simulateur={Boolean(chantierActif)} demo={demo} journee={journee} resultat={resultatJournee} enCours={jouerJournee.isPending}
      onCommencer={commencerJournee} onBilan={faireLeBilan} onTerminer={terminerJournee} onAbandonner={() => { setJournee(null); setRecrues([]); setInterlocuteur(null); notifier('Journée interrompue. Yao te retrouvera au chantier.', 'info'); }}
      onDiscuter={() => setDialogueLibre(true)} onPlanning={() => setPlanningOuvert(true)} onFermer={() => { if (resultatJournee) terminerJournee(); else setInterlocuteur(null); }} />}
    {tache && <TacheChantier key={tache.id} etape={tache.etape} situation={tache.situation} onRepondre={choix => repondreTache(tache.id, choix)} onFermer={() => setTache(null)} />}
    {recrutementOuvert && journee && <PanneauRecrutement graine={journee.numero + chantierQuartier.journees * 31} metiers={journee.recrutement} budget={budgetRecrutement(journee.recrutement)} onValider={validerRecrutement} onFermer={() => setRecrutementOuvert(false)} />}
    {planningOuvert && <PanneauPlanning etat={etatChantier} equipe={equipeChantier} onFermer={() => setPlanningOuvert(false)} />}
    {interlocuteur && (interlocuteur !== 'Yao' || dialogueLibre) && <DialoguePersonnage key={interlocuteur} nom={interlocuteur} affinite={relations[interlocuteur] ?? 0} onLien={() => setRelations(r => ({ ...r, [interlocuteur]: Math.min(100, (r[interlocuteur] ?? 0) + 1) }))} onLieu={slug => { setInterlocuteur(null); setInterieur(null); const lieu = BATIMENTS.find(b => b.slug === slug); if (lieu) { setSelection(lieu); setPlan(false); } }} onClose={() => { setInterlocuteur(null); directionsRef.current.clear(); destination.current = null; }} />}
  </>;
  return <div className={`relative w-full overflow-hidden bg-jeu-nuit ${POLICES_JEU} hud-texte ${immersif ? 'h-[100dvh] min-h-[620px] rounded-none' : 'h-[86vh] min-h-[580px] rounded-2xl border border-black/20 shadow-[0_24px_60px_-28px_rgba(0,0,0,.7)]'}`} data-testid="quartier-3d">
    {/* Contexte d'empilement isolé : les bulles de pensée restent sous l'interface et les intérieurs. */}
    <div className="absolute inset-0 isolate">
    <Canvas shadows={qualite !== 'fluide' ? { type: THREE.PCFSoftShadowMap } : false} dpr={1} camera={{ position: [20, 22, 30], fov: 48, near: 0.1, far: 400 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <FluiditeMonde qualite={qualite} actif={!interieur} nuit={nuit} />
      <Scene joueur={joueurRef} vue={vueRef} suiviPnj={suiviPnj} chantier={chantierScene} onPoste={surPoste} yaoAuChantier={chantierOuvert(heure) || Boolean(journee)} meteo={meteo} rythme={pause ? 0 : vitesse} humeur={humeur} critique={critique} bulles={!interieur && !plan} nomJoueur={nomJoueur} joueurs={joueurs} directions={directions} destination={destination} heure={heure} pause={pause} selection={selection?.slug} objectif={lieuObjectif} onSelect={b => { setInterlocuteur(null); choisir(b); }} interlocuteur={interlocuteur} onParler={parler} positionInitiale={positionInitiale} onPosition={setPositionCourante} decouvertes={decouvertes} onDecouverte={(id, nom) => { if (decouvertes.includes(id)) return; setDecouvertes(d => [...d, id]); setScore(s => s + 75); notifier(`${nom} découvert ! +75 points d’exploration.`, 'succes'); }} />
    </Canvas>
    </div>
    {/* HUD « Lagune » : le bâtisseur et son objectif à gauche, l'heure et la minicarte à droite, le centre reste dégagé. */}
    <header className={`pointer-events-none absolute inset-x-3 z-10 flex items-start justify-between gap-3 ${hautHud}`}>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <CarteJoueur nom={nomJoueur ?? 'Bâtisseur'} poste={profil?.poste ?? 'Apprenti'} niveau={niveau} progression={progressionXp} argent={argent} reputation={reputation} humeur={humeur} etatSauvegarde={{ libelle: libelleSauvegarde, couleur: couleurSauvegarde }} compacte={!large} />
        {cap}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <HorlogeMonde heure={affichageHeure} meteo={LIBELLES_METEO[meteo]} pause={pause} vitesse={vitesse} vitesses={VITESSES} onPause={() => setPause(v => !v)} onVitesse={v => changerVitesse(v as (typeof VITESSES)[number])} compacte={!large} />
        <Minicarte taille={large ? 168 : 116} batiments={BATIMENTS} reperes={reperesCarte} cible={cibleObjectif} lieuCible={lieuObjectif} nomsPnj={NOMS_PNJ} destination={destination} joueur={joueurRef} vue={vueRef} pnj={suiviPnj} nomQuartier={quartierActuel.nom}
          onBatiment={allerVers} onPoint={point => { lieuEnApproche.current = null; setSelection(null); destination.current = [THREE.MathUtils.clamp(point[0], LIMITES_VILLE.minX, LIMITES_VILLE.maxX), THREE.MathUtils.clamp(point[1], LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]; }} />
        <div className="flex gap-1.5">
          <BoutonHud libelle="Planning du jour" raccourci="J" actif={menuModes} onClick={() => setMenuModes(v => !v)}>{ICONES.planning}</BoutonHud>
          <BoutonHud libelle="Plan et lieux" raccourci="M" actif={plan} onClick={() => { setPlan(v => !v); setOptions(false); setSelection(null); }}>{ICONES.carte}</BoutonHud>
          <BoutonHud libelle="Options" raccourci="O" actif={options} onClick={() => { setOptions(v => !v); setPlan(false); }}>{ICONES.reglages}</BoutonHud>
        </div>
      </div>
    </header>
    {/* Fil d'événements : sous le bâtisseur sur grand écran, au-dessus des besoins sur téléphone. */}
    <div className={`pointer-events-none absolute z-20 ${large ? `left-3 w-[320px] ${immersif ? 'top-[216px]' : 'top-[148px]'}` : 'inset-x-3 bottom-[120px]'}`}>
      <PileNotifications notifications={notifications} onFermer={fermerNotification} />
    </div>
    <PanneauModesJeu haut={hautHud} ouvert={menuModes} mode={mode} etape={etapeMode} score={score} secondes={secondes} record={records[mode] ?? 0} decouvertes={decouvertes.length} totalDecouvertes={POINTS_DECOUVERTE.length} conseil={objectifDuMoment(stats, decouvertes.length, POINTS_DECOUVERTE.length)} onAller={allerVers} onToggle={() => setMenuModes(v => !v)} onMode={changerMode} />
    <ControleZoneMusicale position={positionCourante} interieur={Boolean(interieur)} />
    {!surLeChantier && panneauxChantier}
    {options && <section aria-label="Options" className={`hud-verre absolute inset-x-3 z-30 grid max-h-[calc(100%-24px)] gap-2 overflow-y-auto p-4 text-sm sm:inset-x-auto sm:right-3 sm:w-[300px] ${hautHud}`}>
      <div className="flex items-center justify-between gap-2"><h2 className="hud-titre text-[17px]">Options</h2><button type="button" aria-label="Fermer les options" onClick={() => setOptions(false)} className="hud-bouton hud-bouton-verre h-8 w-8 rounded-full text-xs">✕</button></div>
      <div className="hud-separateur" />
      <button type="button" onClick={() => { const choix = qualite === 'auto' ? 'elevee' : qualite === 'elevee' ? 'fluide' : 'auto'; setQualite(choix); try { localStorage.setItem('btp-life-qualite', choix); } catch { /* Stockage facultatif. */ } }} className="hud-bouton hud-bouton-verre justify-start px-3 py-2.5 text-left" aria-label="Changer la qualité graphique">{qualite === 'auto' ? 'Qualité automatique' : qualite === 'elevee' ? 'Qualité élevée' : 'Mode fluide'}</button>
      <StatistiquesRendu />
      <button type="button" className="hud-bouton hud-bouton-verre justify-start px-3 py-2.5 text-left" aria-label="Changer la météo" onClick={() => setMeteoForcee(m => { const suivante = m === null ? 0 : METEOS.indexOf(m) + 1; return suivante >= METEOS.length ? null : METEOS[suivante]; })}>{meteoForcee ? `Météo : ${LIBELLES_METEO[meteoForcee].nom}` : `Météo automatique · ${LIBELLES_METEO[meteo].nom}`}</button>
      <button type="button" className="hud-bouton hud-bouton-verre justify-start px-3 py-2.5 text-left" aria-label="Changer la caméra" onClick={()=>{setCameraProche(v=>!v);window.dispatchEvent(new Event('btp-camera'));}}>{cameraProche ? 'Passer en caméra libre' : 'Revenir à la vue d’ensemble'}</button>
      <p className="hud-legende px-1">{libelleSauvegarde}</p>
      <div className="rounded-xl bg-black/25 p-3 text-[11.5px] leading-relaxed text-jeu-ivoire/75">
        <p className="hud-legende mb-1.5">Commandes</p>
        Bâtiment, sol ou minicarte : y aller<br />ZQSD / flèches : marcher · R : recentrer<br />M : plan · J : planning · O : options<br />P : pause · 1, 2, 3 : vitesse · Échap : fermer<br />{cameraProche ? 'Vue d’ensemble : angle fixe' : 'Glisser : tourner'} · Molette : zoom
      </div>
    </section>}
    {plan && <nav aria-label="Lieux du quartier" className={`hud-verre absolute inset-x-3 z-30 max-h-[calc(100%-24px)] overflow-y-auto p-4 sm:inset-x-auto sm:right-3 sm:w-[340px] ${hautHud}`}>
      <div className="flex items-center justify-between gap-2"><h2 className="hud-titre text-[17px]">Plan · {BATIMENTS.length} lieux</h2><button type="button" aria-label="Fermer le plan" onClick={() => setPlan(false)} className="hud-bouton hud-bouton-verre h-8 w-8 rounded-full text-xs">✕</button></div>
      <div className="hud-separateur mt-2" />
      <section className="my-3 rounded-xl border border-white/10 bg-white/[.04] p-3" aria-label="Carnet d’exploration">
        <h3 className="flex items-center justify-between text-sm font-bold">Carnet d’exploration<span className="hud-chiffre text-jeu-or">{decouvertes.length}/{POINTS_DECOUVERTE.length}</span></h3>
        <p className="my-1 text-xs text-jeu-ivoire/65">Rejoins les repères dorés et touche-les à proximité. Chaque découverte est conservée.</p>
        {POINTS_DECOUVERTE.map(point => <button key={point.id} className="flex min-h-10 w-full items-center justify-between border-t border-white/10 py-2 text-left text-xs font-semibold hover:text-jeu-or" onClick={() => { destination.current = point.position; setPlan(false); notifier(`Cap sur ${point.nom}.`, 'trajet'); }}><span>{point.nom}</span><span className="hud-chiffre">{decouvertes.includes(point.id) ? '✓' : '+75'}</span></button>)}
      </section>
      <div aria-label="Plan de la ville" className="relative my-2 h-44 overflow-hidden rounded-xl border border-white/10 bg-[#33402B]" style={{ backgroundImage: 'linear-gradient(rgba(251,245,234,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,245,234,.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <span className="hud-legende absolute left-2 top-1.5">N ↑</span>
        <div className="absolute bottom-0 h-3 w-full bg-[#2C7C7E]" />
        {QUARTIERS.map(q => <button key={q.nom} title={`Se déplacer vers ${q.nom}`} onClick={() => { destination.current = [q.x, q.z]; setPlan(false); notifier(`Itinéraire vers ${q.nom}.`, 'trajet'); }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-center text-[9.5px] font-bold ${q.nom === quartierActuel.nom ? 'bg-jeu-terre text-white' : 'border border-white/15 bg-black/45 text-jeu-ivoire hover:bg-white/15'}`} style={{ left: `${(q.x + 130) / 260 * 100}%`, top: `${(q.z + 130) / 190 * 100}%` }}>{q.nom}</button>)}
      </div>
      <p className="px-1 text-[10.5px] text-jeu-ivoire/60">Touche un quartier pour lancer l’itinéraire, ou choisis directement un lieu.</p>
      <label className="my-3 block text-xs font-bold">Explorer par zone<select value={zonePlan} onChange={e => setZonePlan(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#2A211B] p-2.5 text-jeu-ivoire"><option className="bg-[#2A211B]">Toutes les zones</option>{QUARTIERS.map(q => <option key={q.nom} className="bg-[#2A211B]">{q.nom}</option>)}</select></label>
      {QUARTIERS.filter(q => zonePlan === 'Toutes les zones' || q.nom === zonePlan).map(q => <section key={q.nom} className="my-3 rounded-xl border border-white/10 bg-white/[.03] p-2"><h3 className="text-sm font-bold text-jeu-or">{q.nom}</h3><p className="my-1 text-xs text-jeu-ivoire/60">{q.description}</p>{BATIMENTS.filter(b => [...QUARTIERS].sort((a, c) => Math.hypot(b.position[0] - a.x, b.position[2] - a.z) - Math.hypot(b.position[0] - c.x, b.position[2] - c.z))[0].nom === q.nom).map(b => <button key={b.slug} onClick={() => { setInterlocuteur(null); choisir(b); }} className="block w-full rounded-lg p-2.5 text-left text-sm font-semibold hover:bg-white/[.06]">{b.nom}<span className="hud-chiffre mt-0.5 block text-[10.5px] font-semibold text-jeu-ivoire/55">{Math.round(Math.hypot(b.position[0] - positionCourante[0], b.position[2] - positionCourante[1]))} m · Rejoindre</span></button>)}</section>)}
    </nav>}
    {selection && <InteractionLieu key={selection.slug} {...selection} demo={demo} onClose={() => setSelection(null)} onEnter={() => { setInterieur(selection); setSelection(null); directionsRef.current.clear(); destination.current = null; }} onDemo={action => { const cible = action.besoin === 'repos' ? 'energie' : action.besoin === 'repas' ? 'faim' : 'social'; setDemoStats(s => ({ ...s, [cible]: 100, moral: Math.min(100, s.moral + (action.besoin === 'repos' ? 4 : action.besoin === 'repas' ? 3 : 6)) })); notifier(`${action.label} : besoin restauré (démo, non sauvegardé).`, 'succes'); }} />}
    {/* Les deux chantiers ont un vrai intérieur de chantier ; on ne travaille qu'au Grand chantier, le Chantier du Plateau se visite. */}
    {interieur && (interieur.slug === 'chantier' || interieur.slug === 'construction-nord') ? <InterieurChantier3D
      nomChantier={interieur.slug === 'chantier' ? nomChantier : interieur.nom} etat={interieur.slug === 'chantier' ? etatChantier : ETAT_VISITE} equipe={interieur.slug === 'chantier' ? equipeChantier : EQUIPE_VISITE}
      journee={interieur.slug === 'chantier' ? journee : null} statut={statutJournee} postes={interieur.slug === 'chantier' ? postesInterieur : []} livraison={interieur.slug === 'chantier' ? livraisonEnCours : null}
      demo={demo} visite={interieur.slug !== 'chantier'} onPoste={surStation} onSortir={() => sortirDuChantier(interieur.nom)} onPlanning={() => setPlanningOuvert(true)} onEchap={fermerPanneauChantier}>
      {interieur.slug === 'chantier' && panneauxChantier}
      <div className={`pointer-events-none absolute z-30 ${large ? 'right-5 top-24 w-[330px]' : 'inset-x-3 bottom-[120px]'}`}><PileNotifications notifications={notifications} onFermer={fermerNotification} /></div>
    </InterieurChantier3D>
    : interieur && <InterieurLieu3D slug={interieur.slug} nom={interieur.nom} demo={demo} onDemo={effet => setDemoStats(s => appliquerEffet(s, effet))} onSortir={() => { directions.clear(); setInterieur(null); notifier(`Tu es sorti de ${interieur.nom}.`, 'info'); }}>
      <InteractionLieu {...interieur} demo={demo} onClose={() => setInterieur(null)} onDemo={action => {
        const cible = action.besoin === 'repos' ? 'energie' : action.besoin === 'repas' ? 'faim' : 'social';
        setDemoStats(s => ({ ...s, [cible]: 100 }));
      }} />
    </InterieurLieu3D>}
    {/* Bas d'écran : besoins, rappel des commandes sur grand écran, croix de déplacement sur téléphone. */}
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-3">
      <JaugesBesoins besoins={stats} compacte={!large} />
      {large && <p className="hud-verre mb-1 hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 lg:flex">Clique un lieu, le sol ou la minicarte<span className="px-1 text-jeu-ivoire/30">·</span><b className="hud-chiffre text-jeu-or">M</b> plan <b className="hud-chiffre ml-1 text-jeu-or">J</b> planning <b className="hud-chiffre ml-1 text-jeu-or">P</b> pause</p>}
      {large ? <span aria-hidden="true" className="w-px" /> : <div className="pointer-events-auto grid grid-cols-3 gap-1.5"><span /><BoutonDirection direction="avant" symbole="▲" setDirection={setDirection} /><span /><BoutonDirection direction="gauche" symbole="◀" setDirection={setDirection} /><BoutonDirection direction="arriere" symbole="▼" setDirection={setDirection} /><BoutonDirection direction="droite" symbole="▶" setDirection={setDirection} /></div>}
    </div>
    <p role="status" className="sr-only">{libelleSauvegarde}</p>
  </div>;
}
