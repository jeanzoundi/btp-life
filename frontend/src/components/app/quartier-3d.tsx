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
import { useModeExperienceStore } from '@/lib/mode-experience-store';
import { avancerHorloge, heureDeDepart, peutRestaurerMonde, appliquerTempsEcoule, chargerEtatMondeLocal, choisirEtatMondeRecent, sauvegarderEtatMondeLocal, type EtatMonde } from '@/lib/sauvegarde-monde';
import { besoinCritique, humeurDepuisBesoins, type Humeur } from './besoins';
import { BullePensee, Plumbob3D, usePenseePeriodique } from './humeur-monde';
import { Pluie } from './meteo-monde';
import { ambianceMeteo, LIBELLES_METEO, meteoDuMoment, saisonDuMoment, type Meteo } from '@/lib/meteo-monde';
import { penseeJoueur, penseePnj, type ContextePensee } from '@/lib/pensees-monde';
import { alertesBesoins, objectifDuMoment, type CleBesoin } from '@/lib/objectif-monde';
import { BoutonHud, CapObjectif, CarteJoueur, HorlogeMonde, ICONES, JaugesBesoins, PileNotifications, ReglageTemps, type NotificationMonde, type TypeNotification } from './hud-monde';
import { Minicarte } from './minicarte';
import { ChatQuartier, EmoteJoueur3D, useMondeEnLigne, usePromeneurs, VoisinsEnLigne3D } from './monde-en-ligne';
import type { Emote, VoisinEnLigne } from '@/lib/en-ligne';
import { ChantierVivant, type ChargementLivraison } from './chantier-vivant';
import { InterieurChantier3D } from './interieur-chantier-3d';
import { PanneauJourneeChantier, PanneauPlanning, PanneauRecrutement, TacheChantier, type ResultatJournee, type StatutJournee } from './panneau-journee-chantier';
import {
  appliquerJournee, bilanJournee, bungalowChantier, CHANTIER_QUARTIER_INITIAL, chantierOuvert, enRepos, enregistrerRecrutement, etapeSimulateur, etatVisuel, etatVisuelSimulateur,
  evenementsDuJour, FIN_DE_JOURNEE, journeeDisponible, OUVERTURE_CHANTIER, lireChantierQuartier, nouvelleJournee, phaseJournee, postesChantier, repondre, situation, tacheALaZone, tachesDisponibles,
  TITRES_PHASES, type ChantierQuartier, type ChantierSimulateur, type EtatVisuel, type Journee, type PhaseJournee, type PosteVille, type SituationTerrain, type TacheJour,
} from '@/lib/journee-chantier';
import { budgetRecrutement, PROGRAMME, TOTAL_JOURS, type EvaluationEquipe, type Ouvrier } from '@/lib/programme-chantier';
import { LIBELLES_STATIONS, type StationChantier } from '@/lib/interieur-chantier';
import { aUnProgramme, LIEUX_PROGRAMME, serviceA, type TypeServiceLieu } from '@/lib/lieux-programme';
import type { BilanSeance } from '@/lib/programme-lieu';
import { DECORS_LIEUX, MENTORS_LIEUX } from './registre-lieux';
import { PanneauChantiers, PanneauCompetences, PanneauEpargne, PanneauLogiciels, PanneauMarches, PanneauOffres, type EpargneDemo } from './panneaux-services';
import { InterieurLieuProgramme } from './interieur-lieu-programme';
import { PanneauxLieu, useProgrammesLieux } from './programmes-lieux';
import { CAMPAGNE, CHAPITRES, PARCELLE_AKWABA, stadeAkwaba, type BilanChapitre } from '@/lib/campagne';
import { CONCURRENT, PENSEES_CONCURRENT, ROUTE_CONCURRENT, nouvelleReplique, presenceConcurrent, repliqueConcurrent } from '@/lib/concurrent';
import { planChapitre, positionPlan, type PlanCamera } from '@/lib/plans-camera';
import { BandeauCinema } from './bandeau-cinema';
import { EcranTravaux, useTravauxMaison } from './renovation-maison';
import { PanneauPremiersPas, usePremiersPas } from './premiers-pas';
import { PanneauFinCampagne, finCampagneAMontrer, type SuiteCampagne } from './fin-campagne';
import { EcranCelebration, celebrationsEntre, celebrer, useCelebrations } from './celebration';
import { useRouter } from 'next/navigation';
import { DISTANCE_PREMIERS_PAS, ETAPES_PREMIERS_PAS, type EtapePremiersPas } from '@/lib/premiers-pas';
import { ENERGIE_JOURNEE_TRAVAUX, type NiveauLogement } from '@/lib/patrimoine';
import { interlocuteur as interlocuteurChapitre, nomLieu, PanneauxFilRouge, useCampagne, type EtatCampagne } from './fil-rouge';
import { ImmeubleAkwaba } from './immeuble-akwaba';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import { creneauPnj, effetsMeteo, passantsPresents } from '@/lib/vie-urbaine';
import { minutesLisibles, trajet } from '@/lib/transports';
import { Telephone, TrajetEnCours, type AppelTelephone, type AppTelephone, type DestinationTelephone } from './telephone';
import { EcranDefis, PanneauImprevu, useDefisQuartier } from './defis-quartier';
import { EcranPatrimoine } from './patrimoine-telephone';
import { gagnerAffinite } from '@/lib/affinite';
import { facteurSocialTraits } from '@/lib/traits';
import { heureLisible } from './panneau-programme-lieu';
import { appliquerArticle, prixArticle, type ArticleCarte, type OptionsArticle } from '@/lib/lieux-vie';
import { ChoixPersonnage, lireChoixDemo, useEnregistrerPersonnage, type ChoixPersonnageJoueur } from './choix-personnage';
import { LieuAzur } from './lieu-azur';
import { LieuCafe } from './lieu-cafe';
import { LieuGalerie } from './lieu-galerie';
import { LieuMaquis } from './lieu-maquis';
import { LieuMarche } from './lieu-marche';
import { LieuMarina } from './lieu-marina';
import { LieuSport } from './lieu-sport';
import { LieuUniversite } from './lieu-universite';
import { PanneauChezToi, PanneauMatin } from './panneau-chez-toi';
import { dormirJusquAuMatin, HEURE_REVEIL, programmeDuJour } from '@/lib/journee-joueur';
import { articleMaison } from '@/lib/lieux-vie/maison';
import { FournisseurPersonnage, HumainJoueur } from './personnage-joueur';
import { personnageChoisi, personnageDe, personnageProche } from '@/lib/personnages-joueur';
import { LIEUX_MONDE } from '@/lib/liens-modes';
import type { ConsommationLieu } from './service-lieu';
import { appliquerEffet, DUREE_SIESTE, EFFETS_DEMO } from '@/lib/objets-interieurs';
import { declinMonde, type BesoinsComplets } from '@/lib/humeurs';
import { ajouterTemps, ecartHorloge, PAS_HORLOGE_MAX } from '@/lib/temps-monde';
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

export type BesoinsJoueur = BesoinsComplets;
/** Besoins de la démonstration au premier pas dans le monde (et d'un compte encore en chargement). */
const BESOINS_DEPART: BesoinsJoueur = { energie: 78, moral: 82, faim: 64, social: 70, hygiene: 72, divertissement: 66 };
interface Batiment3D {
  slug: string; nom: string; href: string;
  position: [number, number, number]; taille: [number, number, number]; couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

const BATIMENTS: Batiment3D[] = [
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
const PARCELLE_BATIMENT: Batiment3D = {
  slug: PARCELLE_AKWABA.slug, nom: CAMPAGNE.nom, href: '', position: [PARCELLE_AKWABA.x, 1, PARCELLE_AKWABA.z],
  taille: [PARCELLE_AKWABA.largeur, 2, PARCELLE_AKWABA.profondeur], couleur: '#A88C66', type: 'chantier',
};
/** La minicarte montre la parcelle avec les lieux, et la touche y envoie le joueur. */
const BATIMENTS_CARTE = [...BATIMENTS, PARCELLE_BATIMENT];
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
const EMPRISES=[...[...BATIMENTS, PARCELLE_BATIMENT].map(b=>({x:b.position[0],z:b.position[2],largeur:b.taille[0],profondeur:b.taille[2]})), ...EMPRISES_PALMIERS, bungalowChantier(CENTRE_CHANTIER, BATIMENT_CHANTIER.taille[0], BATIMENT_CHANTIER.taille[2])];
const POINTS_DECOUVERTE = [
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
  return <HumainMonde {...props} scale={ECHELLE_PERSONNAGES}/>;
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

type PlanEnCours = { plan: PlanCamera; debut: number };
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

function Scene({ joueur, vue, suiviPnj, chantier, akwaba, onPoste, yaoAuChantier, nomJoueur, joueurs, directions, destination, heure, pause, selection, objectif, onSelect, interlocuteur, onParler, positionInitiale, onPosition, decouvertes, onDecouverte, meteo, rythme, humeur, critique, bulles, voisins, monEmote, plan, onConcurrent, coequipiers, onVoisin }: { joueur: React.MutableRefObject<THREE.Vector3>; vue: React.MutableRefObject<{ azimut: number }>; suiviPnj: React.MutableRefObject<Map<string, THREE.Vector3>>; chantier: { etat: EtatVisuel; nom: string; livraison: ChargementLivraison | null; postes: { id: PosteVille; position: PointMonde; libelle: string }[] };
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

function BoutonDirection({ direction, symbole, setDirection }: { direction: Direction; symbole: string; setDirection: (d: Direction, actif: boolean) => void }) {
  return <button type="button" aria-label={direction} className="hud-verre hud-bouton h-10 w-10 select-none rounded-xl text-base" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDirection(direction, true); }} onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}>{symbole}</button>;
}

export interface ProfilJoueur { argent?: number; niveau?: number; poste?: string; xp?: number; reputation?: number }

export function Quartier3D({ nomJoueur: nomCompte, besoins, profil, avatar, lieuInitial, demo = false, immersif = false }: {
  nomJoueur?: string; besoins?: BesoinsJoueur; profil?: ProfilJoueur;
  /** Avatar du compte (nom, configuration du dressing et personnage choisi) ; absent pendant son chargement. */
  avatar?: { nomPersonnage?: string; config?: unknown } | null;
  /** Lieu à ouvrir dès l'arrivée (/app/monde?lieu=banque, depuis une page du mode classique). */
  lieuInitial?: string | null;
  demo?: boolean; immersif?: boolean;
}) {
  const userId = useAuthStore((s) => s.user?.id);
  // Le personnage du joueur : choisi au premier pas dans le monde, rangé dans le compte (ou ce navigateur en démonstration).
  const [choixDemo, setChoixDemo] = useState<ChoixPersonnageJoueur | null>(null);
  const [choixDemoLu, setChoixDemoLu] = useState(false);
  useEffect(() => { if (demo) { setChoixDemo(lireChoixDemo()); setChoixDemoLu(true); } }, [demo]);
  const idPersonnage = demo ? choixDemo?.personnage ?? null : personnageChoisi(avatar?.config);
  const personnage = useMemo(() => personnageDe(demo ? choixDemo : avatar?.config), [demo, choixDemo, avatar?.config]);
  const nomJoueur = demo ? choixDemo?.nom || nomCompte : nomCompte;
  const [choixPersonnageOuvert, setChoixPersonnageOuvert] = useState(false);
  const premierChoix = demo ? choixDemoLu && !choixDemo : avatar !== undefined && !idPersonnage;
  const enregistrerPersonnage = useEnregistrerPersonnage(demo, setChoixDemo);
  const configPortrait = demo ? choixDemo : avatar?.config;
  const directionsRef = useRef(new Set<Direction>());
  const destination = useRef<PointMonde | null>(null);
  const [, rafraichir] = useState(0);
  const [heure, setHeure] = useState(() => heureDeDepart(demo));
  const [qualite, setQualite] = useState<QualiteMonde>('auto');
  useEffect(() => {
    try { const choix = localStorage.getItem('btp-life-qualite'); if (choix === 'fluide' || choix === 'elevee' || choix === 'auto') setQualite(choix); } catch { /* Stockage facultatif. */ }
  }, []);
  const [pause, setPause] = useState(false);
  // Vitesse et météo forcée restent propres à la session : le format de sauvegarde ne change pas.
  const [vitesse, setVitesse] = useState<(typeof VITESSES)[number]>(1);
  const vitesseRef = useRef(1);
  const [selection, setSelection] = useState<Batiment3D | null>(null);
  const [interieur, setInterieur] = useState<Batiment3D | null>(null);
  // Le lieu où l'on est (dedans, ou devant avec sa fiche) : la bascule vers le mode classique ouvre sa page.
  const setLieuMonde = useModeExperienceStore((s) => s.setLieuMonde);
  useEffect(() => { setLieuMonde(interieur?.slug ?? selection?.slug ?? null); }, [interieur?.slug, selection?.slug, setLieuMonde]);
  useEffect(() => () => setLieuMonde(null), [setLieuMonde]);
  const lieuEnApproche = useRef<Batiment3D | null>(null);
  const [interlocuteur, setInterlocuteur] = useState<string | null>(null);
  const [relations, setRelations] = useState<Record<string, number>>({});
  const parler = useCallback((nom: string) => { setDialogueLibre(false); setInterlocuteur(nom); setSelection(null); directionsRef.current.clear(); destination.current = null; }, []);
  const [plan, setPlan] = useState(false);
  const [options, setOptions] = useState(false);
  // Au réveil, après une nuit dans son lit : le programme de la journée.
  const [matin, setMatin] = useState(false);
  // Le téléphone ouvert (et son application de départ), et la course en taxi ou en gbaka en cours.
  const [telephone, setTelephone] = useState<AppTelephone | null>(null);
  const [voyage, setVoyage] = useState<{ mode: 'gbaka' | 'taxi'; nom: string; minutes: number; prix: number } | null>(null);
  // Trajets de la démonstration (ils comptent pour les défis), et l'imprévu du jour ouvert au Grand chantier.
  const [trajetsDemo, setTrajetsDemo] = useState(0);
  const [imprevuOuvert, setImprevuOuvert] = useState(false);
  const [cameraProche,setCameraProche]=useState(true);
  const [zonePlan, setZonePlan] = useState('Toutes les zones');
  const [demoStats, setDemoStats] = useState(besoins ?? BESOINS_DEPART);
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
  // Le quartier partagé : position signalée toutes les dix secondes, voisins connectés et chat (C).
  const enLigne = useMondeEnLigne({ demo, position: joueurRef, lieu: interieur?.slug ?? null, nom: nomJoueur ?? 'Moi' });
  const coequipiers = useMemo(() => enLigne.equipe.equipe?.membres.map(m => m.userId) ?? [], [enLigne.equipe.equipe]);
  // Une invitation d'équipe reçue : une notification pour accepter tout de suite (refuser se fait dans le chat).
  const invitationsVues = useRef(new Set<string>());
  useEffect(() => {
    for (const invitation of enLigne.equipe.invitations) {
      if (invitationsVues.current.has(invitation.id)) continue;
      invitationsVues.current.add(invitation.id);
      notifier(`🤝 ${invitation.de} t’invite dans son équipe : à deux dans le même lieu, +10 % d’XP.`, 'info', { label: 'Accepter', executer: () => { void enLigne.repondre(invitation, true); } });
    }
  }, [enLigne.equipe.invitations, enLigne.repondre, notifier]);
  const [chat, setChat] = useState(false);
  // Plans de caméra des moments clés : le plan en cours (lu image par image par la caméra) et son bandeau.
  const planRef = useRef<PlanEnCours | null>(null);
  const planAttente = useRef<PlanCamera | null>(null);
  const [planCinema, setPlanCinema] = useState<PlanCamera | null>(null);
  const passerPlan = useCallback(() => { planRef.current = null; setPlanCinema(null); }, []);
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
  const horlogeRef = useRef({ heure: heureDeDepart(demo), instant: Date.now(), pause: false });
  const hydratationRef = useRef(false);
  // Arrivée depuis le mode classique : on se présente à la porte du lieu demandé et on entre.
  const lieuDemande = useRef(lieuInitial ?? null);
  const ouvrirLieuDemande = useCallback(() => {
    const lieu = lieuDemande.current ? BATIMENTS.find(b => b.slug === lieuDemande.current) : undefined;
    lieuDemande.current = null;
    if (!lieu) return;
    const porte: PointMonde = [lieu.position[0], THREE.MathUtils.clamp(lieu.position[2] + lieu.taille[2] / 2 + 2, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)];
    setPositionInitiale(porte); setPositionCourante(porte);
    setSelection(null); setInterieur(lieu);
    if (!demo) try { window.history.replaceState(null, '', '/app/monde'); } catch { /* L'adresse reste telle quelle. */ }
  }, [demo]);
  useEffect(() => { if (demo) ouvrirLieuDemande(); }, [demo, ouvrirLieuDemande]);
  // Le temps du monde fait baisser les besoins à son rythme, mais seulement pendant qu'on y joue (hors ligne, le
  // serveur garde son déclin lent en temps réel). L'horloge compte les heures de jeu passées, pas à pas ou d'un coup
  // quand on attend ou qu'on dort ; le serveur les reçoit par heures entières, la démonstration les applique seule.
  const derniereHeure = useRef<number | null>(demo ? heureDeDepart(true) : null);
  const tempsEnAttente = useRef({ eveil: 0, sommeil: 0 });
  const tempsEnVol = useRef({ eveil: 0, sommeil: 0 });
  const [tempsAffiche, setTempsAffiche] = useState({ eveil: 0, sommeil: 0 });
  const rafraichirTemps = useCallback(() => setTempsAffiche({
    eveil: tempsEnAttente.current.eveil + tempsEnVol.current.eveil, sommeil: tempsEnAttente.current.sommeil + tempsEnVol.current.sommeil,
  }), []);
  // La météo du moment accompagne les heures passées debout (le gestionnaire du temps la lit à jour).
  const meteoRef = useRef<Meteo>('soleil');
  const envoyerTemps = useCallback(async (heures: number, sommeil: boolean) => {
    const cle = sommeil ? 'sommeil' : 'eveil';
    tempsEnVol.current[cle] += heures;
    try {
      const carriere = await api.post<Record<string, unknown>>('/carriere/temps-monde', { heures, sommeil, ...(sommeil ? {} : { meteo: meteoRef.current }) });
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ancienne ? { ...ancienne, ...carriere } : ancienne);
    } catch { tempsEnAttente.current[cle] += heures; }
    finally { tempsEnVol.current[cle] -= heures; rafraichirTemps(); }
  }, [client, rafraichirTemps]);
  const compterTemps = useCallback((heures: number, sommeil = false) => {
    const { attente, aDeclarer } = ajouterTemps(tempsEnAttente.current, heures, sommeil);
    tempsEnAttente.current = attente;
    const { eveil, sommeil: dormi } = aDeclarer;
    if (demo) { if (eveil || dormi) setDemoStats(s => declinMonde(declinMonde(s, dormi, true), eveil, false, meteoRef.current)); }
    else { if (dormi) void envoyerTemps(dormi, true); if (eveil) void envoyerTemps(eveil, false); }
    rafraichirTemps();
  }, [demo, envoyerTemps, rafraichirTemps]);
  /** Chaque pas de l'horloge (cinq minutes de jeu) compte ; un grand saut (onglet endormi, horloge recalée) non. */
  const suivreHorloge = useCallback((h: number) => {
    const avant = derniereHeure.current;
    derniereHeure.current = h;
    if (avant === null || document.visibilityState === 'hidden') return;
    const ecart = ecartHorloge(avant, h);
    if (ecart <= PAS_HORLOGE_MAX) compterTemps(ecart);
  }, [compterTemps]);
  /** Laisse passer le temps jusqu'à une heure (le lendemain si elle est passée) : attendre l'ouverture d'un lieu, revenir le
   * lendemain, dormir. Les besoins baissent pendant ce temps, deux fois moins vite en dormant. */
  const passerA = useCallback((cible: number, sommeil = false) => {
    const maintenant = avancerHorloge(horlogeRef.current, Date.now(), vitesseRef.current).heure;
    suivreHorloge(maintenant);
    compterTemps(ecartHorloge(maintenant, cible), sommeil);
    derniereHeure.current = cible;
    horlogeRef.current = { heure: cible, instant: Date.now(), pause: horlogeRef.current.pause };
    setHeure(cible);
  }, [suivreHorloge, compterTemps]);
  const passerDuree = (heures: number, sommeil = false) => passerA((avancerHorloge(horlogeRef.current, Date.now(), vitesseRef.current).heure + heures) % 24, sommeil);
  /** Dormir : le soir, la nuit passe jusqu'au réveil et le programme du jour s'affiche ; le jour, c'est une sieste. */
  const dormir = () => {
    if (dormirJusquAuMatin(heure)) { passerA(HEURE_REVEIL, true); setMatin(true); }
    else passerDuree(DUREE_SIESTE, true);
  };
  // Lieux à programme (laboratoire, dépôt, hôtel de ville) : une séance par jour, guidée par le mentor du lieu.
  const recompenserLieu = useCallback((bilan: BilanSeance) => {
    if (!demo) return;
    setProgresDemo(p => ({ argent: p.argent + bilan.paie, xp: p.xp + bilan.xp }));
    setDemoStats(s => ({ ...s, energie: Math.max(0, s.energie - 5), faim: Math.max(0, s.faim - 4) }));
  }, [demo]);
  // Fil rouge et séances des lieux se partagent le joueur : une seule séance à la fois, lue au moment de commencer.
  const campagneRef = useRef<EtatCampagne | null>(null);
  const lieux = useProgrammesLieux({ cle: `btp-life-programme:${userId ?? 'demo'}`, demo, heure, notifier, recompenser: recompenserLieu, passerA,
    occupe: () => campagneRef.current?.seance ? `Un chapitre du fil rouge est en cours (${nomLieu(campagneRef.current.seance.slug)}) : termine-le d’abord.` : null });
  // Le premier quart d'heure guidé : chaque geste découvert est validé, et récompensé, au moment où il est fait.
  const premiersPas = usePremiersPas({ demo, onEtape: useCallback((etape: EtapePremiersPas, termine: boolean, r: { argent: number; xp: number }) => {
    const titre = ETAPES_PREMIERS_PAS.find(e => e.id === etape)?.titre ?? etape;
    if (demo) setProgresDemo(p => ({ argent: p.argent + r.argent, xp: p.xp + r.xp }));
    if (termine) celebrer({ icone: '🎉', titre: 'Premiers pas terminés !', sousTitre: `+${r.argent.toLocaleString('fr-FR')} F et +${r.xp} XP. Le quartier est à toi.`, son: 'succes' });
    else notifier(`✓ ${titre} : +${r.argent.toLocaleString('fr-FR')} F et +${r.xp} XP.`, 'succes');
  }, [demo, notifier]) });
  const validerGuide = useRef(premiersPas.valider);
  validerGuide.current = premiersPas.valider;
  const departGuide = useRef<PointMonde | null>(null);
  useEffect(() => { if (positionInitiale && !departGuide.current) departGuide.current = positionInitiale; }, [positionInitiale]);
  useEffect(() => {
    // Sans position restaurée (nouveau joueur, démonstration), le joueur apparaît au centre de la place.
    const d = departGuide.current ?? [0, 0];
    if (Math.hypot(positionCourante[0] - d[0], positionCourante[1] - d[1]) > DISTANCE_PREMIERS_PAS) void validerGuide.current('deplacement');
  }, [positionCourante]);
  useEffect(() => { if (telephone) void validerGuide.current('telephone'); }, [telephone]);
  useEffect(() => { if (interieur) void validerGuide.current('lieu'); }, [interieur]);
  useEffect(() => { const r = lieux.resultat; if (r && !r.erreur && r.bilan.compte) void validerGuide.current('seance'); }, [lieux.resultat]);
  useEffect(() => { if (enLigne.monEmote) void validerGuide.current('quartier'); }, [enLigne.monEmote]);
  const cleGuide = `btp-life-guide:${userId ?? 'demo'}`;
  const [guide, setGuide] = useState({ ouvert: false, masque: false });
  // Déplié seulement s'il tient sous le HUD : sur téléphone et sur les écrans bas, il reste replié sur l'étape en cours.
  useEffect(() => {
    let masque = false;
    try { masque = localStorage.getItem(cleGuide) === 'masque'; } catch { /* Stockage facultatif. */ }
    setGuide({ ouvert: window.matchMedia('(min-width: 640px) and (min-height: 820px)').matches, masque });
  }, [cleGuide]);
  const masquerGuide = () => { setGuide(g => ({ ...g, masque: true })); try { localStorage.setItem(cleGuide, 'masque'); } catch { /* Stockage facultatif. */ } };
  // Le fil rouge : la Résidence Akwaba, de lieu en lieu jusqu'à sa réception sur la parcelle du Plateau Nord.
  const recompenserChapitre = useCallback((bilan: BilanChapitre) => {
    if (!demo) return;
    setProgresDemo(p => ({ argent: p.argent + bilan.argent, xp: p.xp + bilan.xp }));
    setDemoStats(s => ({ ...s, energie: Math.max(0, s.energie - 5), faim: Math.max(0, s.faim - 4) }));
  }, [demo]);
  const campagne = useCampagne({ cle: `btp-life-campagne:${userId ?? 'demo'}`, demo, heure, notifier, recompenser: recompenserChapitre,
    occupe: lieux.seance ? nomLieu(lieux.seance.slug) : null });
  campagneRef.current = campagne;
  const { ouvrir: ouvrirFilRouge } = campagne;
  // Échap dans la ville ferme aussi la tâche ou le panneau du fil rouge (lu à jour, le gestionnaire du clavier vit plus longtemps).
  const fermerFilRougeRef = useRef<() => boolean>(() => false);
  fermerFilRougeRef.current = campagne.fermerPanneau;
  // Défis du jour et de la semaine, imprévu du jour au Grand chantier (en démonstration, mesurés sur les totaux du jeu).
  const totauxDefisDemo = { seances: Object.keys(LIEUX_PROGRAMME).reduce((s, slug) => s + lieux.progresDe(slug).seances, 0), chapitres: campagne.progres.chapitres, trajets: trajetsDemo };
  const defisQuartier = useDefisQuartier({ demo, totauxDemo: totauxDefisDemo, recompenserDemo: ({ xp, argent }) => setProgresDemo(p => ({ argent: Math.max(0, p.argent + argent), xp: p.xp + xp })) });
  // Services des lieux à programme (guichet d'épargne, mur des offres…), ouverts à tout moment.
  const [serviceLieu, setServiceLieu] = useState<TypeServiceLieu | null>(null);
  const [epargneDemo, setEpargneDemo] = useState(0);
  const epargneDemoOps: EpargneDemo = {
    solde: progresDemo.argent, epargne: epargneDemo,
    operer: (sens, montant) => {
      if (sens === 'deposer' ? montant > progresDemo.argent : montant > epargneDemo) return sens === 'deposer' ? 'Solde insuffisant pour ce dépôt.' : 'Épargne insuffisante pour ce retrait.';
      const signe = sens === 'deposer' ? -1 : 1;
      setProgresDemo(p => ({ ...p, argent: p.argent + signe * montant })); setEpargneDemo(e => e - signe * montant);
      return null;
    },
  };
  // Lieux de vie (maquis, café) : l'article est payé au comptoir, ses effets comptent une fois consommé.
  const consommerArticle = useCallback(async (article: ArticleCarte, options: OptionsArticle): Promise<ConsommationLieu> => {
    if (demo) {
      const prix = prixArticle(article, options.remise);
      if (progresDemo.argent < prix) throw new Error(`Pas assez d’argent : ${prix.toLocaleString('fr-FR')} F requis.`);
      setProgresDemo(p => ({ ...p, argent: p.argent - prix }));
      const message = options.victoire && article.bonusVictoire ? `${article.message} ${article.bonusVictoire.message}` : article.message;
      return { message, coutPaye: prix, appliquer: () => setDemoStats(s => appliquerArticle(s, article, options)) };
    }
    const res = await api.post<{ message: string; carriere: Record<string, unknown>; coutPaye: number }>(`/carriere/besoins/${article.action}`, { article: article.id, ...options });
    return {
      message: res.message, coutPaye: res.coutPaye,
      appliquer: () => { client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ({ ...ancienne, ...res.carriere })); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); },
    };
  }, [demo, progresDemo.argent, client]);
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
    // Devant la parcelle Akwaba : pas de fiche de lieu, c'est le fil rouge qui s'ouvre (projet, ou réception avec Mme Touré).
    if (b.slug === PARCELLE_AKWABA.slug) { setSelection(null); setPlan(false); directionsRef.current.clear(); destination.current = null; ouvrirFilRouge(b.slug); return; }
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
  }, [mode, secondes, etapeMode, score, positionCourante, notifier, ouvrirFilRouge]);
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
  // Quand presque personne n'est connecté, des joueurs passés récemment se promènent sur la place (la démonstration a ses voisins).
  const promeneursPlace = usePromeneurs({ actif: !demo, recents: joueurs, connectes: enLigne.voisins });
  const voisins3d = useMemo(() => [...enLigne.voisins, ...promeneursPlace], [enLigne.voisins, promeneursPlace]);
  // Messages non lus : la pastille du téléphone dans le HUD (le téléphone lit la même liste).
  const { data: messages = [] } = useQuery({ queryKey: ['messages', 'mine'], queryFn: () => api.get<{ lu: boolean }[]>('/users/me/messages'), enabled: !demo, staleTime: 30_000, refetchInterval: 60_000 });
  const messagesNonLus = demo ? 1 : messages.filter(m => !m.lu).length;
  // Les traits du joueur (le sociable se fait des amis plus vite) ; la démonstration n'en choisit pas.
  const { data: carriereMe } = useQuery({ queryKey: ['carriere', 'me'], queryFn: () => api.get<{ traits?: string[] }>('/carriere/me'), enabled: !demo, staleTime: 60_000 });
  const traitsJoueur = Array.isArray(carriereMe?.traits) ? carriereMe.traits : [];
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
    // Le temps passé hors ligne avance l'horloge, mais pas les besoins : le serveur l'a déjà compté en temps réel.
    derniereHeure.current = etat.heure;
    etatRef.current = etat;
    pretRef.current = true;
    ouvrirLieuDemande();
    if (etat !== etatMonde) modifieRef.current = true;
    setEtatSauvegarde(isError ? 'erreur' : 'sauvegarde-ok');
  }, [etatMonde, demo, userId, isFetchedAfterMount, isFetching, isError, ouvrirLieuDemande]);
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
      if (!pretRef.current) return;
      const h = avancerHorloge(horlogeRef.current, Date.now(), vitesseRef.current).heure;
      suivreHorloge(h);
      setHeure(h);
    }, 5000 / vitesse);
    return () => window.clearInterval(timer);
  }, [pause, vitesse, suivreHorloge]);
  const changerVitesse = useCallback((nouvelle: (typeof VITESSES)[number]) => {
    // Recale l'horloge à l'ancienne vitesse avant de changer, pour ne pas réécrire le temps déjà écoulé.
    const maintenant = Date.now();
    horlogeRef.current = { ...avancerHorloge(horlogeRef.current, maintenant, vitesseRef.current), pause: false };
    vitesseRef.current = nouvelle;
    suivreHorloge(horlogeRef.current.heure);
    setVitesse(nouvelle); setPause(false); setHeure(horlogeRef.current.heure);
  }, [suivreHorloge]);
  useEffect(() => {
    if (pause || secondes === null || secondes <= 0 || etapeMode >= modeActif.etapes.length) return;
    const timer = window.setInterval(() => setSecondes(s => s === null ? null : Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pause, secondes, etapeMode, modeActif.etapes.length]);
  useEffect(() => {
    const changer = (code: string, actif: boolean) => { const direction = TOUCHES[code]; if (!direction) return; if (actif) directions.add(direction); else directions.delete(direction); };
    if (interieur) { directions.clear(); return; }
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')) return; if (e.code === 'Escape') { fermerFilRougeRef.current(); setTelephone(null); setChat(false); planRef.current = null; setPlanCinema(null); setSelection(null); setInterlocuteur(null); setPlan(false); setOptions(false); setMenuModes(false); destination.current = null; lieuEnApproche.current = null; directions.clear(); } if (TOUCHES[e.code]) { e.preventDefault(); lieuEnApproche.current = null; changer(e.code, true); return; } if (e.ctrlKey || e.metaKey || e.altKey) return; const touche = e.key.toLowerCase(); if (touche === 'm') { setPlan(v => !v); setOptions(false); setSelection(null); } else if (touche === 'j') setMenuModes(v => !v); else if (touche === 'o') { setOptions(v => !v); setPlan(false); } else if (touche === 'p') setPause(v => !v); else if (touche === 't') setTelephone(v => v ? null : 'accueil'); else if (touche === 'c') setChat(v => !v); else if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') changerVitesse(Number(e.code.slice(-1)) as (typeof VITESSES)[number]); };
    const up = (e: KeyboardEvent) => changer(e.code, false);
    const clear = () => directions.clear();
    window.addEventListener('blur', clear);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', clear); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); document.body.style.cursor = 'default'; };
  }, [directions, interieur, changerVitesse]);
  const setDirection = (d: Direction, actif: boolean) => { if (actif) { lieuEnApproche.current = null; directions.add(d); } else directions.delete(d); rafraichir((v) => v + 1); };
  const minutesTotales = Math.floor(heure * 60) % 1440;
  const affichageHeure = `${String(Math.floor(minutesTotales / 60)).padStart(2, '0')}:${String(minutesTotales % 60).padStart(2, '0')}`;
  // Les besoins affichés suivent l'horloge entre deux déclarations au serveur (ou deux heures pleines en démonstration).
  const stats = declinMonde(declinMonde(demo ? demoStats : besoins ?? BESOINS_DEPART, tempsAffiche.sommeil, true), tempsAffiche.eveil, false, meteoRef.current);
  const humeur = humeurDepuisBesoins(stats);
  const critique = besoinCritique(stats);
  // Météo automatique : des épisodes tirés au hasard selon la saison, les mêmes pour tous au même instant.
  const instantMeteo = new Date();
  const meteo = meteoDuMoment(instantMeteo);
  const saison = saisonDuMoment(instantMeteo);
  meteoRef.current = meteo;
  const nuit = heure >= 19 || heure < 6;
  const libelleSauvegarde = demo ? 'Aperçu libre' : etatSauvegarde === 'chargement' ? 'Chargement de la partie…' : etatSauvegarde === 'sauvegarde' ? 'Sauvegarde…' : etatSauvegarde === 'erreur' ? 'Sauvegarde locale · serveur à reprendre' : '✓ Partie sauvegardée';
  const etapeEnCours = mode !== 'libre' ? modeActif.etapes[etapeMode] : undefined;
  const objectifVie = objectifDuMoment(stats, decouvertes.length, POINTS_DECOUVERTE.length);
  // Pendant l'orage, le Grand chantier est à l'arrêt : on ne propose pas la journée.
  const travailPropose = !etapeEnCours && !journee && !objectifVie.lieu && !effetsMeteo(meteo).chantierArrete && journeeDisponible(chantierQuartier, heure, Date.now());
  // Le fil rouge passe avant la journée de Yao quand son interlocuteur reçoit à cette heure ; un besoin urgent passe avant tout.
  const chapitreFilRouge = campagne.chapitre;
  const horairesFilRouge = chapitreFilRouge ? interlocuteurChapitre(chapitreFilRouge).horaires : null;
  const filRougePropose = Boolean(chapitreFilRouge && horairesFilRouge && !etapeEnCours && !journee && !lieux.seance && !campagne.seance && !objectifVie.lieu
    && heure >= horairesFilRouge.ouverture && heure < horairesFilRouge.fermeture);
  const yaoEnTete = travailPropose && !lieux.seance && !campagne.seance && !filRougePropose;
  const phase = journee ? phaseJournee(journee) : null;
  const surLeChantier = interieur?.slug === 'chantier';
  const travauxDuJour = journee ? journee.taches.filter(t => t.type !== 'epi' && t.type !== 'recrutement') : [];
  const objectif: { texte: string; etiquette?: string; lieu?: string } = etapeEnCours
    ? { texte: etapeEnCours.titre, etiquette: secondes !== null ? `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}` : `${etapeMode + 1}/${modeActif.etapes.length}` }
    : journee && phase ? (surLeChantier ? { texte: TITRES_PHASES[phase], etiquette: phase === 'travaux' ? `${travauxDuJour.filter(t => journee.reponses[t.id] !== undefined).length}/${travauxDuJour.length}` : undefined, lieu: 'chantier' } : { texte: 'Retourne sur le chantier', lieu: 'chantier' })
    : lieux.seance ? { texte: `Séance en cours · ${BATIMENTS.find(b => b.slug === lieux.seance!.slug)?.nom ?? LIEUX_PROGRAMME[lieux.seance.slug].programme.titre}`, etiquette: `${Object.keys(lieux.seance.scores).length}/${lieux.seance.taches.length}`, lieu: lieux.seance.slug }
    : campagne.seance ? { texte: `Fil rouge · ${CHAPITRES[campagne.seance.etape].titre}`, etiquette: `${Object.keys(campagne.seance.scores).length}/${campagne.seance.taches.length}`, lieu: campagne.seance.slug }
    : filRougePropose && chapitreFilRouge ? { texte: `Fil rouge · ${chapitreFilRouge.titre}`, etiquette: `Ch. ${campagne.progres.chapitres + 1}/${CHAPITRES.length}`, lieu: chapitreFilRouge.lieu }
    : yaoEnTete ? { texte: 'Journée de travail avec Yao', etiquette: '6 h – 18 h', lieu: 'chantier' }
    : objectifVie;
  const argent = profil?.argent ?? (demo ? progresDemo.argent : undefined);
  // Démonstration : les achats du téléphone et des travaux se paient sur le solde affiché.
  const depenserDemo = (montant: number) => { if (montant > 0 && progresDemo.argent < montant) return false; setProgresDemo(p => ({ ...p, argent: p.argent - montant })); return true; };
  const [logementDemo, setLogementDemo] = useState<NiveauLogement>('studio');
  // Les travaux chez soi : un même chantier pour l'application Patrimoine et le panneau « Chez toi ».
  const travaux = useTravauxMaison({ demo, argent: argent ?? 0, depenserDemo, logementDemo,
    onJourneeDemo: () => setDemoStats(s => ({ ...s, energie: Math.max(0, s.energie - ENERGIE_JOURNEE_TRAVAUX) })) });
  const niveau = profil?.niveau ?? (demo ? 3 : 1);
  const progressionXp = progressionVersNiveauSuivant(profil?.xp ?? (demo ? progresDemo.xp : 0), niveau).pct;
  const reputation = profil?.reputation ?? (demo ? 520 : undefined);
  const couleurSauvegarde = etatSauvegarde === 'erreur' ? '#E2653C' : etatSauvegarde === 'sauvegarde-ok' ? '#4CC3A5' : 'rgb(251 245 234 / .3)';
  const hautHud = immersif ? 'top-20' : 'top-3';
  const allerVers = (slug: string) => { const lieu = BATIMENTS_CARTE.find(b => b.slug === slug); if (lieu) { setMenuModes(false); setInterlocuteur(null); choisir(lieu); } };
  /** On sort de chez soi pour un rendez-vous de la journée : le joueur repart vers le lieu. */
  const quitterPour = (slug: string) => { directions.clear(); setInterieur(null); allerVers(slug); };
  /** Ouvre le fil rouge dans un intérieur : le panneau du mentor, le programme et les services du lieu se ferment d'abord. */
  const ouvrirFilRougeIci = (slug: string) => { lieux.sortir(); setServiceLieu(null); ouvrirFilRouge(slug); };
  const attendreFilRouge = (h: number) => { notifier(`${heure >= h ? 'Le lendemain à' : 'Il est'} ${heureLisible(h)} : ton rendez-vous du fil rouge t’attend.`, 'info'); passerA(h); };
  // Le chapitre du fil rouge figure en tête du programme du jour, au réveil comme chez soi.
  const rendezVousFilRouge = chapitreFilRouge && horairesFilRouge ? {
    slug: chapitreFilRouge.lieu, nom: nomLieu(chapitreFilRouge.lieu), ouverture: horairesFilRouge.ouverture, fermeture: horairesFilRouge.fermeture,
    titre: `Fil rouge · ${chapitreFilRouge.titre}`, detail: `${CAMPAGNE.nom}, chapitre ${campagne.progres.chapitres + 1}/${CHAPITRES.length}`,
  } : null;
  const akwabaScene = useMemo(() => ({ stade: campagne.progres.chapitres, appel: chapitreFilRouge?.lieu === PARCELLE_AKWABA.slug ? 'Réception · Mme Touré' : null }),
    [campagne.progres.chapitres, chapitreFilRouge?.lieu]);
  // Le téléphone : les destinations du GPS et du taxi (porte de chaque lieu), et les appels du moment, tirés de l'état du jeu.
  const destinationsTelephone = useMemo<DestinationTelephone[]>(() => BATIMENTS_CARTE.map(b => ({
    slug: b.slug, nom: b.nom, porte: porteBatiment(b.position, b.taille, LIMITES_VILLE),
    quartier: [...QUARTIERS].sort((a, c) => Math.hypot(b.position[0] - a.x, b.position[2] - a.z) - Math.hypot(b.position[0] - c.x, b.position[2] - c.z))[0].nom,
  })), []);
  const appelsTelephone: AppelTelephone[] = [];
  if (chapitreFilRouge && !campagne.seance) {
    const qui = interlocuteurChapitre(chapitreFilRouge);
    appelsTelephone.push({ id: `fil-rouge-${chapitreFilRouge.id}`, de: qui.nom, role: qui.role, lieu: chapitreFilRouge.lieu, nomLieu: nomLieu(chapitreFilRouge.lieu),
      message: `Bonjour ${nomJoueur ?? 'Bâtisseur'} ! Pour la Résidence Akwaba, j’ai besoin de toi : ${chapitreFilRouge.resume.charAt(0).toLowerCase()}${chapitreFilRouge.resume.slice(1)} Je te reçois de ${heureLisible(qui.horaires.ouverture)} à ${heureLisible(qui.horaires.fermeture)}.` });
  }
  if (lieux.seance) {
    const { mentor } = LIEUX_PROGRAMME[lieux.seance.slug].programme;
    appelsTelephone.push({ id: `seance-${lieux.seance.slug}`, de: mentor.nom, role: mentor.role, lieu: lieux.seance.slug, nomLieu: nomLieu(lieux.seance.slug), message: 'Ta séance est restée en plan : on t’attend pour la finir.' });
  }
  if (travailPropose) appelsTelephone.push({ id: 'yao', de: 'Yao', role: 'Chef de chantier', lieu: 'chantier', nomLieu: nomLieu('chantier'), message: 'Le chantier tourne : viens prendre ta journée, je t’attends devant la base vie.' });
  if (stats.social < 40) appelsTelephone.push({ id: 'awa', de: 'Awa', role: 'Amie du quartier', lieu: 'cafe', nomLieu: nomLieu('cafe'), message: 'Ça fait longtemps ! On se retrouve au café ce soir ?' });
  const piqueConcurrent = repliqueConcurrent(campagne.progres.chapitres);
  if (piqueConcurrent) appelsTelephone.push({ id: 'concurrent', de: CONCURRENT.nom, role: CONCURRENT.role, message: piqueConcurrent });
  if (stats.faim < 35) appelsTelephone.push({ id: 'bintou', de: 'Tantie Bintou', role: 'Le Maquis', lieu: 'maquis', nomLieu: nomLieu('maquis'), message: 'Le garba est chaud : viens manger avant qu’il n’y en ait plus !' });
  const pluie = ambianceMeteo(meteo).pluie > 0;
  /** Course en taxi ou en gbaka : payée (au serveur, ou sur le solde de démonstration), puis le trajet, l'arrivée à la porte
   * du lieu et le temps du trajet qui passe sur l'horloge du monde. Renvoie l'erreur à afficher dans le téléphone. */
  const voyager = async (mode: 'gbaka' | 'taxi', slug: string): Promise<string | null> => {
    const d = destinationsTelephone.find(x => x.slug === slug);
    if (!d) return 'Destination inconnue.';
    const t = trajet(mode, positionCourante, d.porte, pluie);
    if (demo) {
      if (progresDemo.argent < t.prix) return `Pas assez d’argent pour ce trajet : ${t.prix.toLocaleString('fr-FR')} F.`;
      setProgresDemo(p => ({ ...p, argent: p.argent - t.prix })); setTrajetsDemo(n => n + 1);
    } else {
      try { await api.post('/monde/transport', { mode, distance: t.distance, pluie }); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); }
      catch (e) { return (e as Error).message || 'Le chauffeur ne répond pas.'; }
    }
    setTelephone(null); directions.clear(); destination.current = null; lieuEnApproche.current = null;
    setVoyage({ mode, nom: d.nom, minutes: t.minutes, prix: t.prix });
    window.setTimeout(() => {
      setPositionInitiale([d.porte[0], d.porte[1]]); setPositionCourante([d.porte[0], d.porte[1]]);
      passerDuree(t.minutes / 60);
      setVoyage(null);
      notifier(`Arrivé : ${d.nom}, en ${mode === 'taxi' ? 'taxi' : 'gbaka'} · ${minutesLisibles(t.minutes)} · ${t.prix.toLocaleString('fr-FR')} F.`, 'succes');
    }, 2400);
    return null;
  };
  // Cible de l'objectif : la porte du lieu à rejoindre, ou le repère non découvert le plus proche.
  const lieuObjectif = etapeEnCours?.lieu ?? ('lieu' in objectif ? objectif.lieu : undefined);
  const batimentObjectif = lieuObjectif ? BATIMENTS.find(b => b.slug === lieuObjectif) : undefined;
  const repereProche = useMemo(() => POINTS_DECOUVERTE.filter(p => !decouvertes.includes(p.id)).sort((a, b) => distanceEntre(a.position, positionCourante) - distanceEntre(b.position, positionCourante))[0], [decouvertes, positionCourante]);
  // Pendant la journée, la flèche ramène à l'entrée du chantier ; avant, elle vise Yao (s'il est l'objectif affiché).
  const posteCible: PosteVille | null = journee ? 'entree' : yaoEnTete ? 'yao' : null;
  const cibleObjectif: PointMonde | null = posteCible ? POSTES_CHANTIER[posteCible]
    : lieuObjectif === PARCELLE_AKWABA.slug ? porteBatiment(PARCELLE_BATIMENT.position, PARCELLE_BATIMENT.taille, LIMITES_VILLE)
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
    if (effetsMeteo(meteo).chantierArrete) { notifier('Orage : le chantier est à l’arrêt. On ne coule pas et on ne monte pas sur les échafaudages ; reviens après l’orage.', 'alerte'); return; }
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
    // Fin de journée à 17 h, comme une vraie journée de chantier : l'horloge y passe, et les besoins avec elle.
    if (horlogeRef.current.heure < FIN_DE_JOURNEE && horlogeRef.current.heure >= 6) passerA(FIN_DE_JOURNEE);
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
  const sortirDuLieu = (nom: string) => { directions.clear(); setInterieur(null); notifier(`Tu es sorti de ${nom}.`, 'info'); };
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
  // Un chapitre du fil rouge vient d'être validé : peu après, le prochain interlocuteur appelle (on décroche sur le téléphone).
  // En entrant sur le Grand chantier, l'imprévu du jour se présente (une fois) tant qu'il n'est pas réglé.
  const imprevuPresente = useRef<string | null>(null);
  useEffect(() => {
    if (!surLeChantier || !defisQuartier.imprevu || defisQuartier.decision || imprevuPresente.current === defisQuartier.imprevu.slug) return;
    imprevuPresente.current = defisQuartier.imprevu.slug;
    setImprevuOuvert(true);
  }, [surLeChantier, defisQuartier.imprevu, defisQuartier.decision]);
  // Un défi vient d'être réussi : la récompense attend dans le téléphone.
  const reclamablesVus = useRef(0);
  useEffect(() => {
    const avant = reclamablesVus.current;
    reclamablesVus.current = defisQuartier.aReclamer;
    if (defisQuartier.aReclamer > avant) notifier('🎯 Défi réussi ! Ta récompense t’attend dans le téléphone.', 'succes', { label: 'Réclamer', executer: () => setTelephone('defis') });
  }, [defisQuartier.aReclamer, notifier]);
  const chapitresVus = useRef<number | null>(null);
  useEffect(() => {
    if (!campagne.pret) return;
    const avant = chapitresVus.current, maintenant = campagne.progres.chapitres;
    chapitresVus.current = maintenant;
    if (avant === null || maintenant <= avant || !campagne.chapitre) return;
    const qui = interlocuteurChapitre(campagne.chapitre);
    const minuteur = window.setTimeout(() => notifier(`📞 ${qui.nom} t’appelle au sujet de la Résidence Akwaba.`, 'info', { label: 'Décrocher', executer: () => setTelephone('appels') }), 4000);
    return () => window.clearTimeout(minuteur);
  }, [campagne.pret, campagne.progres.chapitres, campagne.chapitre, notifier]);
  // Un chapitre validé : la caméra salue l'étape franchie par l'immeuble dès que le joueur est dans la rue, bilan refermé
  // (la validation se fait souvent chez le mentor), puis le concurrent envoie sa pique.
  const chapitresFilmes = useRef<number | null>(null);
  useEffect(() => {
    if (!campagne.pret) return;
    const avant = chapitresFilmes.current, maintenant = campagne.progres.chapitres;
    chapitresFilmes.current = maintenant;
    if (avant === null || maintenant <= avant) return;
    planAttente.current = planChapitre({ centre: [PARCELLE_AKWABA.x, PARCELLE_AKWABA.z], chapitres: maintenant, total: CHAPITRES.length, etape: stadeAkwaba({ chapitres: maintenant }), titreChantier: CAMPAGNE.nom });
    const pique = nouvelleReplique(maintenant);
    if (!pique) return;
    const minuteur = window.setTimeout(() => notifier(`📱 ${CONCURRENT.prenom} (${CONCURRENT.entreprise}) : « ${pique} »`, 'info'), 10_000);
    return () => window.clearTimeout(minuteur);
  }, [campagne.pret, campagne.progres.chapitres, notifier]);
  useEffect(() => {
    if (interieur || campagne.panneau || !planAttente.current || planCinema) return;
    const plan = planAttente.current;
    planAttente.current = null;
    planRef.current = { plan, debut: performance.now() };
    setPlanCinema(plan);
  }, [interieur, campagne.panneau, campagne.progres.chapitres, planCinema]);
  useEffect(() => {
    if (!planCinema) return;
    const fin = window.setTimeout(() => setPlanCinema(null), planCinema.duree * 1000);
    return () => window.clearTimeout(fin);
  }, [planCinema]);
  // La campagne finie, et son dernier plan de caméra passé : un écran salue le parcours et oriente vers la suite, une fois.
  const router = useRouter();
  const cleFinCampagne = `btp-life-fin-campagne:${userId ?? 'demo'}`;
  const [finCampagne, setFinCampagne] = useState(false);
  useEffect(() => {
    let dejaVue = false;
    try { dejaVue = localStorage.getItem(cleFinCampagne) === 'vue'; } catch { /* Stockage facultatif. */ }
    const occupe = Boolean(interieur || campagne.panneau || planCinema || planAttente.current);
    if (finCampagneAMontrer({ chapitres: campagne.progres.chapitres, total: CHAPITRES.length, pret: campagne.pret, dejaVue, occupe })) setFinCampagne(true);
  }, [campagne.progres.chapitres, campagne.pret, campagne.panneau, interieur, planCinema, cleFinCampagne]);
  // Les grands moments du joueur : niveau, promotion, équipe formée, comparés à l'état précédent (jamais au chargement).
  const celebrations = useCelebrations();
  const etatCelebre = useRef<{ niveau?: number; poste?: string; coequipiers?: number } | null>(null);
  useEffect(() => {
    if (!demo && (!profil || !enLigne.equipePrete)) return;
    const membres = enLigne.equipe.equipe?.membres ?? [];
    const apres = { niveau: profil?.niveau, poste: profil?.poste, coequipiers: membres.length, avec: membres.filter(m => m.nom !== nomJoueur).map(m => m.nom) };
    celebrationsEntre(etatCelebre.current, apres).forEach(celebrer);
    etatCelebre.current = apres;
  }, [demo, profil, enLigne.equipePrete, enLigne.equipe.equipe, nomJoueur]);
  const fermerFinCampagne = () => { setFinCampagne(false); try { localStorage.setItem(cleFinCampagne, 'vue'); } catch { /* Stockage facultatif. */ } };
  const suiteCampagne = (suite: SuiteCampagne) => {
    fermerFinCampagne();
    if (suite === 'equipe') setChat(true);
    else if (demo) notifier('Ta carrière et tes chantiers continuent dans le jeu complet : crée ton compte pour les jouer.', 'info');
    else router.push(suite === 'carriere' ? '/app/parcours' : '/app/chantiers');
  };
  // Fil d'événements dans les intérieurs : à droite sous « Sortir » sur grand écran, au-dessus des commandes sur téléphone.
  const pileInterieur = <div className={`pointer-events-none absolute z-30 ${large ? 'right-5 top-24 w-[330px]' : 'inset-x-3 bottom-[120px]'}`}><PileNotifications notifications={notifications} onFermer={fermerNotification} max={large ? undefined : 1} /></div>;
  const cap = <CapObjectif texte={objectif.texte} etiquette={objectif.etiquette} cible={cibleObjectif} joueur={joueurRef} vue={vueRef} ouvert={menuModes} onClick={() => setMenuModes(v => !v)} compacte={!large} />;
  // Panneaux de la journée : dans la ville devant le portail, ou par-dessus l'intérieur du chantier.
  const panneauxChantier = <>
    {imprevuOuvert && <PanneauImprevu etat={defisQuartier} onFermer={() => setImprevuOuvert(false)} />}
    {interlocuteur === 'Yao' && !dialogueLibre && <PanneauJourneeChantier statut={statutJournee} nomJoueur={nomJoueur ?? 'Bâtisseur'} nomChantier={nomChantier} etat={etatChantier} simulateur={Boolean(chantierActif)} demo={demo} journee={journee} resultat={resultatJournee} enCours={jouerJournee.isPending}
      onCommencer={commencerJournee} onBilan={faireLeBilan} onTerminer={terminerJournee} onAbandonner={() => { setJournee(null); setRecrues([]); setInterlocuteur(null); notifier('Journée interrompue. Yao te retrouvera au chantier.', 'info'); }}
      onDiscuter={() => setDialogueLibre(true)} onPlanning={() => setPlanningOuvert(true)} onFermer={() => { if (resultatJournee) terminerJournee(); else setInterlocuteur(null); }}
      onAttendre={() => { notifier(`${heure >= OUVERTURE_CHANTIER ? 'Le lendemain à' : 'Il est'} ${OUVERTURE_CHANTIER} h : Yao t’attend au chantier.`, 'info'); passerA(OUVERTURE_CHANTIER); }} />}
    {tache && <TacheChantier key={tache.id} etape={tache.etape} situation={tache.situation} onRepondre={choix => repondreTache(tache.id, choix)} onFermer={() => setTache(null)} />}
    {recrutementOuvert && journee && <PanneauRecrutement graine={journee.numero + chantierQuartier.journees * 31} metiers={journee.recrutement} budget={budgetRecrutement(journee.recrutement)} onValider={validerRecrutement} onFermer={() => setRecrutementOuvert(false)} />}
    {planningOuvert && <PanneauPlanning etat={etatChantier} equipe={equipeChantier} onFermer={() => setPlanningOuvert(false)} />}
    {interlocuteur && (interlocuteur !== 'Yao' || dialogueLibre) && <DialoguePersonnage key={interlocuteur} nom={interlocuteur} affinite={relations[interlocuteur] ?? 0} onLien={gain => setRelations(r => ({ ...r, [interlocuteur]: gagnerAffinite(r[interlocuteur] ?? 0, gain, facteurSocialTraits(traitsJoueur)) }))} onLieu={slug => { setInterlocuteur(null); setInterieur(null); const lieu = BATIMENTS.find(b => b.slug === slug); if (lieu) { setSelection(lieu); setPlan(false); } }} onClose={() => { setInterlocuteur(null); directionsRef.current.clear(); destination.current = null; }} />}
  </>;
  return <FournisseurPersonnage personnage={personnage}><div className={`relative w-full overflow-hidden bg-jeu-nuit ${POLICES_JEU} hud-texte ${immersif ? 'h-[100dvh] min-h-[620px] rounded-none' : 'h-[86vh] min-h-[580px] rounded-2xl border border-black/20 shadow-[0_24px_60px_-28px_rgba(0,0,0,.7)]'}`} data-testid="quartier-3d">
    {/* Contexte d'empilement isolé : les bulles de pensée restent sous l'interface et les intérieurs. */}
    <div className="absolute inset-0 isolate">
    <Canvas shadows={qualite !== 'fluide' ? { type: THREE.PCFSoftShadowMap } : false} dpr={1} camera={{ position: [20, 22, 30], fov: 48, near: 0.1, far: 400 }} gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <FluiditeMonde qualite={qualite} actif={!interieur} nuit={nuit} />
      <Scene joueur={joueurRef} vue={vueRef} suiviPnj={suiviPnj} chantier={chantierScene} akwaba={akwabaScene} onPoste={surPoste} yaoAuChantier={chantierOuvert(heure) || Boolean(journee)} meteo={meteo} rythme={pause ? 0 : vitesse} humeur={humeur} critique={critique} bulles={!interieur && !plan} voisins={voisins3d} monEmote={enLigne.monEmote} plan={planRef} coequipiers={coequipiers} onVoisin={() => setChat(true)}
        onConcurrent={() => notifier(`${CONCURRENT.prenom} (${CONCURRENT.entreprise}) : « ${repliqueConcurrent(campagne.progres.chapitres) ?? 'Bonne chance avec Mme Touré.'} »`, 'info')} nomJoueur={nomJoueur} joueurs={joueurs} directions={directions} destination={destination} heure={heure} pause={pause} selection={selection?.slug} objectif={lieuObjectif} onSelect={b => { setInterlocuteur(null); choisir(b); }} interlocuteur={interlocuteur} onParler={parler} positionInitiale={positionInitiale} onPosition={setPositionCourante} decouvertes={decouvertes} onDecouverte={(id, nom) => { if (decouvertes.includes(id)) return; setDecouvertes(d => [...d, id]); setScore(s => s + 75); notifier(`${nom} découvert ! +75 points d’exploration.`, 'succes'); }} />
    </Canvas>
    </div>
    {/* HUD « Lagune » : le bâtisseur et son objectif à gauche, l'heure et la minicarte à droite, le centre reste dégagé. */}
    <header className={`pointer-events-none absolute inset-x-3 z-10 flex items-start justify-between gap-3 ${hautHud}`}>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <CarteJoueur nom={nomJoueur ?? 'Bâtisseur'} poste={profil?.poste ?? 'Apprenti'} niveau={niveau} progression={progressionXp} argent={argent} reputation={reputation} humeur={humeur} etatSauvegarde={{ libelle: libelleSauvegarde, couleur: couleurSauvegarde }} compacte={!large}
          portrait={configPortrait} onPortrait={() => setChoixPersonnageOuvert(true)} />
        {cap}
      </div>
      <div className="relative flex shrink-0 flex-col items-end gap-2">
        <HorlogeMonde heure={affichageHeure} meteo={{ icone: LIBELLES_METEO[meteo].icone, nom: `${LIBELLES_METEO[meteo].nom} · ${saison.nom}` }} pause={pause} vitesse={vitesse} vitesses={VITESSES} onPause={() => setPause(v => !v)} onVitesse={v => changerVitesse(v as (typeof VITESSES)[number])} compacte={!large} />
        <Minicarte taille={large ? 168 : 116} batiments={BATIMENTS_CARTE} reperes={reperesCarte} cible={cibleObjectif} lieuCible={lieuObjectif} nomsPnj={NOMS_PNJ} destination={destination} joueur={joueurRef} vue={vueRef} pnj={suiviPnj} nomQuartier={quartierActuel.nom}
          onBatiment={allerVers} onPoint={point => { lieuEnApproche.current = null; setSelection(null); destination.current = [THREE.MathUtils.clamp(point[0], LIMITES_VILLE.minX, LIMITES_VILLE.maxX), THREE.MathUtils.clamp(point[1], LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]; }} />
        {/* Sur téléphone, la rangée de boutons passe sous la minicarte sans élargir la colonne : le bâtisseur et son objectif gardent leur place. */}
        <div className={large ? 'flex gap-1.5' : 'absolute right-0 top-full mt-2 flex gap-1.5'}>
          <BoutonHud libelle="Planning du jour" raccourci="J" actif={menuModes} onClick={() => setMenuModes(v => !v)}>{ICONES.planning}</BoutonHud>
          <BoutonHud libelle="Plan et lieux" raccourci="M" actif={plan} onClick={() => { setPlan(v => !v); setOptions(false); setSelection(null); }}>{ICONES.carte}</BoutonHud>
          <span className="relative"><BoutonHud libelle="Téléphone" raccourci="T" actif={Boolean(telephone)} onClick={() => setTelephone(v => v ? null : 'accueil')}>{ICONES.telephone}</BoutonHud>
            {messagesNonLus > 0 && <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E2653C] px-1 text-[9.5px] font-bold text-white">{messagesNonLus}</span>}</span>
          <span className="relative"><BoutonHud libelle="Quartier en ligne" raccourci="C" actif={chat} onClick={() => setChat(v => !v)}>{ICONES.quartier}</BoutonHud>
            {enLigne.voisins.length > 0 && <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-jeu-lagune px-1 text-[9.5px] font-bold text-[#0f2426]">{enLigne.voisins.length}</span>}</span>
          <BoutonHud libelle="Options" raccourci="O" actif={options} onClick={() => { setOptions(v => !v); setPlan(false); }}>{ICONES.reglages}</BoutonHud>
        </div>
      </div>
    </header>
    {/* Fil d'événements : sous le bâtisseur sur grand écran, au-dessus des besoins sur téléphone. */}
    <div className={`pointer-events-none absolute z-20 ${large ? `left-3 w-[320px] ${immersif ? 'top-[216px]' : 'top-[148px]'}` : 'inset-x-3 bottom-[120px]'}`}>
      <PileNotifications notifications={notifications} onFermer={fermerNotification} max={large ? undefined : 1} />
    </div>
    <PanneauModesJeu haut={hautHud} ouvert={menuModes} mode={mode} etape={etapeMode} score={score} secondes={secondes} record={records[mode] ?? 0} decouvertes={decouvertes.length} totalDecouvertes={POINTS_DECOUVERTE.length} conseil={objectifDuMoment(stats, decouvertes.length, POINTS_DECOUVERTE.length)} onAller={allerVers} onToggle={() => setMenuModes(v => !v)} onMode={changerMode} />
    <ControleZoneMusicale position={positionCourante} interieur={Boolean(interieur)} />
    {!surLeChantier && panneauxChantier}
    {!interieur && <PanneauxFilRouge ici={PARCELLE_AKWABA.slug} campagne={campagne} nomJoueur={nomJoueur ?? 'Bâtisseur'} demo={demo} onAller={slug => { campagne.fermer(); allerVers(slug); }} onAttendre={attendreFilRouge} />}
    {options && <section aria-label="Options" className={`hud-verre absolute inset-x-3 z-30 grid max-h-[calc(100%-24px)] gap-2 overflow-y-auto p-4 text-sm sm:inset-x-auto sm:right-3 sm:w-[300px] ${hautHud}`}>
      <div className="flex items-center justify-between gap-2"><h2 className="hud-titre text-[17px]">Options</h2><button type="button" aria-label="Fermer les options" onClick={() => setOptions(false)} className="hud-bouton hud-bouton-verre h-8 w-8 rounded-full text-xs">✕</button></div>
      <div className="hud-separateur" />
      <button type="button" onClick={() => { setOptions(false); setChoixPersonnageOuvert(true); }} className="hud-bouton hud-bouton-verre justify-start px-3 py-2.5 text-left">🧍 Changer de personnage · {personnage.titre}</button>
      <button type="button" onClick={() => { const choix = qualite === 'auto' ? 'elevee' : qualite === 'elevee' ? 'fluide' : 'auto'; setQualite(choix); try { localStorage.setItem('btp-life-qualite', choix); } catch { /* Stockage facultatif. */ } }} className="hud-bouton hud-bouton-verre justify-start px-3 py-2.5 text-left" aria-label="Changer la qualité graphique">{qualite === 'auto' ? 'Qualité automatique' : qualite === 'elevee' ? 'Qualité élevée' : 'Mode fluide'}</button>
      <StatistiquesRendu />
      <p className="rounded-xl bg-white/[.04] px-3 py-2.5 text-[13px] text-jeu-ivoire/80">{LIBELLES_METEO[meteo].icone} {LIBELLES_METEO[meteo].nom} · {saison.nom}<span className="mt-0.5 block text-[11px] text-jeu-ivoire/50">Météo automatique, au gré des saisons.</span></p>
      {!large && <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[.04] px-3 py-2"><span className="text-[13px] text-jeu-ivoire/80">Temps</span><ReglageTemps pause={pause} vitesse={vitesse} vitesses={VITESSES} onPause={() => setPause(v => !v)} onVitesse={v => changerVitesse(v as (typeof VITESSES)[number])} /></div>}
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
    {selection && <InteractionLieu key={selection.slug} {...selection} demo={demo} onClose={() => setSelection(null)} onEnter={() => { setInterieur(selection); setSelection(null); directionsRef.current.clear(); destination.current = null; }} sieste={!dormirJusquAuMatin(heure)} onDemo={action => {
        // En journée, dormir depuis la fiche de la résidence est une sieste, comme dans le lit.
        const sieste = action.besoin === 'repos' && !dormirJusquAuMatin(heure);
        setDemoStats(s => sieste ? appliquerArticle(s, articleMaison('sieste-maison')!) : appliquerEffet(s, EFFETS_DEMO[action.besoin]));
        notifier(`${sieste ? 'Sieste' : action.label} : ${sieste ? 'énergie en hausse' : 'besoin restauré'} (démo, non sauvegardé).`, 'succes');
        if (action.besoin === 'repos') dormir();
      }}
      onFait={action => { if (action.besoin === 'repos') dormir(); }} />}
    {/* Les deux chantiers ont un vrai intérieur de chantier ; on ne travaille qu'au Grand chantier, le Chantier du Plateau se visite. */}
    {interieur && interieur.slug === 'chantier' ? <InterieurChantier3D
      nomChantier={nomChantier} etat={etatChantier} equipe={equipeChantier}
      journee={journee} statut={statutJournee} postes={postesInterieur} livraison={livraisonEnCours}
      demo={demo} visite={false} onPoste={surStation} onSortir={() => sortirDuChantier(interieur.nom)} onPlanning={() => setPlanningOuvert(true)} onEchap={fermerPanneauChantier}>
      {panneauxChantier}
      {pileInterieur}
    </InterieurChantier3D>
    : interieur && aUnProgramme(interieur.slug) ? <InterieurLieuProgramme key={interieur.slug} nom={interieur.nom} href={interieur.href} programme={LIEUX_PROGRAMME[interieur.slug].programme} plan={LIEUX_PROGRAMME[interieur.slug].plan}
      decor={DECORS_LIEUX[interieur.slug]} mentor={MENTORS_LIEUX[interieur.slug]}
      faites={lieux.faites(interieur.slug)} cycle={lieux.cycleAffiche(interieur.slug)} seance={lieux.seance} statut={lieux.statut(interieur.slug)} demo={demo}
      postes={campagne.postes(interieur.slug) ?? [...lieux.postes(interieur.slug), ...(LIEUX_PROGRAMME[interieur.slug].services ?? []).map(s => s.station)]}
      onPoste={station => {
        // Pendant un chapitre ici, ses tâches et son bilan passent d'abord ; les services du lieu restent ouverts.
        if (campagne.surStation(interieur.slug, station)) return;
        const service = serviceA(interieur.slug, station);
        if (service) { setServiceLieu(service.type); return; }
        if (campagne.seance?.slug === interieur.slug) { notifier(`${LIEUX_PROGRAMME[interieur.slug].plan.libelles[station] ?? station} : rien à faire ici pour ce chapitre.`, 'info'); return; }
        campagne.fermer(); lieux.surStation(interieur.slug, station);
      }}
      filRouge={campagne.concerne(interieur.slug) ? {
        titre: `Chapitre ${(campagne.seance?.etape ?? campagne.progres.chapitres) + 1}/${CHAPITRES.length} · ${CHAPITRES[campagne.seance?.etape ?? campagne.progres.chapitres].titre}`,
        seance: campagne.seance?.slug === interieur.slug ? campagne.seance : null, bilan: campagne.statut(interieur.slug) === 'bilan', onOuvrir: () => ouvrirFilRougeIci(interieur.slug),
      } : null}
      onProgramme={() => lieux.setProgrammeOuvert(true)} onAttendre={() => lieux.attendreOuverture(interieur.slug)}
      onEchap={() => { if (serviceLieu) { setServiceLieu(null); return true; } if (campagne.fermerPanneau()) return true; return lieux.fermerPanneau(); }}
      onSortir={() => { directions.clear(); lieux.sortir(); campagne.sortir(); setServiceLieu(null); setInterieur(null); notifier(`Tu es sorti de ${interieur.nom}.`, 'info'); }}>
      <PanneauxLieu slug={interieur.slug} lieux={lieux} nomJoueur={nomJoueur ?? 'Bâtisseur'} demo={demo}
        filRouge={campagne.concerne(interieur.slug) && !campagne.seance && campagne.chapitre ? { libelle: `Chapitre ${campagne.progres.chapitres + 1} · ${campagne.chapitre.titre}`, onOuvrir: () => ouvrirFilRougeIci(interieur.slug) } : null} />
      <PanneauxFilRouge ici={interieur.slug} campagne={campagne} nomJoueur={nomJoueur ?? 'Bâtisseur'} demo={demo}
        onAller={slug => { campagne.fermer(); directions.clear(); lieux.sortir(); setServiceLieu(null); setInterieur(null); allerVers(slug); }} onAttendre={() => lieux.attendreOuverture(interieur.slug)} />
      {serviceLieu === 'epargne' && <PanneauEpargne demo={demo} epargneDemo={epargneDemoOps} onFermer={() => setServiceLieu(null)} />}
      {serviceLieu === 'offres' && <PanneauOffres demo={demo} niveau={niveau} onFermer={() => setServiceLieu(null)} />}
      {serviceLieu === 'competences' && <PanneauCompetences demo={demo} onFermer={() => setServiceLieu(null)} />}
      {serviceLieu === 'logiciels' && <PanneauLogiciels demo={demo} onFermer={() => setServiceLieu(null)} />}
      {serviceLieu === 'chantiers' && <PanneauChantiers demo={demo} onFermer={() => setServiceLieu(null)} />}
      {serviceLieu === 'marches' && <PanneauMarches demo={demo} onFermer={() => setServiceLieu(null)} />}
      {pileInterieur}
    </InterieurLieuProgramme>
    : interieur && interieur.slug === 'maquis' ? <LieuMaquis demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      allerVers={slug => { directions.clear(); setInterieur(null); allerVers(slug); }} onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuMaquis>
    : interieur && interieur.slug === 'cafe' ? <LieuCafe demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} niveau={niveau} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      relations={relations} onRelation={(nom, valeur) => setRelations(r => ({ ...r, [nom]: Math.max(0, Math.min(100, valeur)) }))} onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuCafe>
    : interieur && interieur.slug === 'universite' ? <LieuUniversite demo={demo} heure={heure} cleLocale={`btp-life-universite:${userId ?? 'demo'}`} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuUniversite>
    : interieur && interieur.slug === 'marche' ? <LieuMarche demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuMarche>
    : interieur && interieur.slug === 'marina' ? <LieuMarina demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuMarina>
    : interieur && interieur.slug === 'sports' ? <LieuSport demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuSport>
    : interieur && interieur.slug === 'centre-azur' ? <LieuAzur demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuAzur>
    : interieur && interieur.slug === 'galerie-palmiers' ? <LieuGalerie demo={demo} heure={heure} besoins={stats} argent={argent ?? 0} niveau={niveau} consommer={consommerArticle} notifier={notifier} passerA={passerA}
      onSortir={() => sortirDuLieu(interieur.nom)}>{pileInterieur}</LieuGalerie>
    : interieur && <InterieurLieu3D slug={interieur.slug} nom={interieur.nom} demo={demo} onDemo={effet => setDemoStats(s => appliquerEffet(s, effet))}
      onDemoArticle={id => {
        const article = articleMaison(id);
        if (!article) return null;
        if (progresDemo.argent < article.prix) return `Pas assez d’argent : ${article.prix.toLocaleString('fr-FR')} F requis.`;
        setProgresDemo(p => ({ ...p, argent: p.argent - article.prix }));
        setDemoStats(s => appliquerArticle(s, article));
        return null;
      }}
      onDormi={dormir} nuit={dormirJusquAuMatin(heure)} onTempsPasse={h => passerDuree(h)} onSortir={() => { directions.clear(); setInterieur(null); notifier(`Tu es sorti de ${interieur.nom}.`, 'info'); }}>
      {interieur.slug === 'residence'
        ? <PanneauChezToi demo={demo} heure={heure} besoins={stats} rendezVous={programmeDuJour(lieux.progresDe, journeeDisponible(chantierQuartier, heure, Date.now()), rendezVousFilRouge)} onAller={quitterPour} travaux={<EcranTravaux travaux={travaux} chezToi />} />
        : <InteractionLieu {...interieur} demo={demo} onClose={() => setInterieur(null)} onDemo={action => setDemoStats(s => appliquerEffet(s, EFFETS_DEMO[action.besoin]))} />}
    </InterieurLieu3D>}
    {planCinema && !interieur && <BandeauCinema titre={planCinema.titre} sousTitre={planCinema.sousTitre} onPasser={passerPlan} />}
    {finCampagne && !interieur && <PanneauFinCampagne nomJoueur={nomJoueur ?? 'Bâtisseur'} onSuite={suiteCampagne} onFermer={fermerFinCampagne} />}
    {celebrations.courante && !planCinema && <EcranCelebration celebration={celebrations.courante} onFermer={celebrations.fermer} />}
    {/* Le guide, sous la colonne de droite du HUD (68 px plus bas en mode immersif), sans descendre sur les commandes du bas. */}
    {premiersPas.afficher && !guide.masque && !interieur && !telephone && !planCinema && <div className={`pointer-events-none absolute right-3 z-20 flex flex-col ${large
      ? `w-[262px] ${immersif ? 'top-[420px] max-h-[calc(100%-476px)]' : 'top-[352px] max-h-[calc(100%-408px)]'}`
      : `w-[230px] ${immersif ? 'top-[324px] max-h-[calc(100%-430px)]' : 'top-[256px] max-h-[calc(100%-362px)]'}`}`}>
      <PanneauPremiersPas faites={premiersPas.faites} ouvert={guide.ouvert} onBasculer={() => setGuide(g => ({ ...g, ouvert: !g.ouvert }))} onMasquer={masquerGuide} />
    </div>}
    {chat && !interieur && <ChatQuartier demo={demo} moi={nomJoueur ?? 'Moi'} voisins={enLigne.voisins} onEmote={enLigne.emote} onFermer={() => setChat(false)}
      equipe={enLigne.equipe} onInviter={enLigne.inviter} onRepondre={enLigne.repondre} onQuitter={enLigne.quitter} onEnvoi={() => void validerGuide.current('quartier')} />}
    {telephone && !interieur && <Telephone appInitiale={telephone} demo={demo} heure={affichageHeure} meteo={LIBELLES_METEO[meteo].nom} pluie={pluie} position={positionCourante}
      destinations={destinationsTelephone} argent={argent ?? 0} epargne={epargneDemo} niveau={niveau} appels={appelsTelephone}
      rendezVous={programmeDuJour(lieux.progresDe, journeeDisponible(chantierQuartier, heure, Date.now()), rendezVousFilRouge)}
      filRouge={chapitreFilRouge ? { chapitre: campagne.progres.chapitres + 1, total: CHAPITRES.length, titre: chapitreFilRouge.titre, resume: chapitreFilRouge.resume, lieu: chapitreFilRouge.lieu, nomLieu: nomLieu(chapitreFilRouge.lieu), interlocuteur: interlocuteurChapitre(chapitreFilRouge).nom } : null}
      defis={<EcranDefis etat={defisQuartier} onChantier={() => { setTelephone(null); allerVers('chantier'); }} />} defisAReclamer={defisQuartier.aReclamer}
      patrimoine={<EcranPatrimoine demo={demo} argent={argent ?? 0} depenserDemo={depenserDemo} travaux={<EcranTravaux travaux={travaux} chezToi={false} />} onLogementDemo={setLogementDemo} />}
      onAller={slug => { setTelephone(null); allerVers(slug); }} onVoyager={voyager} onEpargneDemo={(sens, montant) => epargneDemoOps.operer(sens, montant)} onFermer={() => setTelephone(null)} />}
    {voyage && <TrajetEnCours {...voyage} />}
    {matin && <PanneauMatin heure={heure} besoins={stats} rendezVous={programmeDuJour(lieux.progresDe, journeeDisponible(chantierQuartier, heure, Date.now()), rendezVousFilRouge)}
      onAller={slug => { setMatin(false); quitterPour(slug); }} onFermer={() => setMatin(false)} />}
    {/* Bas d'écran : besoins, rappel des commandes sur grand écran, croix de déplacement sur téléphone. */}
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-3">
      <JaugesBesoins besoins={stats} compacte={!large} />
      {large && <p className="hud-verre mb-1 hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] text-jeu-ivoire/70 lg:flex">Clique un lieu, le sol ou la minicarte<span className="px-1 text-jeu-ivoire/30">·</span><b className="hud-chiffre text-jeu-or">M</b> plan <b className="hud-chiffre ml-1 text-jeu-or">J</b> planning <b className="hud-chiffre ml-1 text-jeu-or">P</b> pause</p>}
      {large ? <span aria-hidden="true" className="w-px" /> : <div className="pointer-events-auto grid grid-cols-3 gap-1.5"><span /><BoutonDirection direction="avant" symbole="▲" setDirection={setDirection} /><span /><BoutonDirection direction="gauche" symbole="◀" setDirection={setDirection} /><BoutonDirection direction="arriere" symbole="▼" setDirection={setDirection} /><BoutonDirection direction="droite" symbole="▶" setDirection={setDirection} /></div>}
    </div>
    <p role="status" className="sr-only">{libelleSauvegarde}</p>
    {(premierChoix || choixPersonnageOuvert) && <ChoixPersonnage initial={idPersonnage ?? personnageProche(avatar?.config)} nomInitial={nomJoueur ?? ''} avatarConfig={configPortrait}
      premierChoix={premierChoix} demo={demo} enCours={enregistrerPersonnage.isPending} erreur={enregistrerPersonnage.error ? (enregistrerPersonnage.error as Error).message || 'Enregistrement impossible pour l’instant.' : null}
      onAnnuler={premierChoix ? undefined : () => setChoixPersonnageOuvert(false)}
      onValider={(id, nom, gabarit) => enregistrerPersonnage.mutate({ personnage: id, nom, ...gabarit }, { onSuccess: () => { setChoixPersonnageOuvert(false); notifier(demo ? `${nom} est prêt pour les Palmiers.` : `${nom} est prêt pour les Palmiers. Le même personnage t’attend en mode classique.`, 'succes'); } })} />}
  </div></FournisseurPersonnage>;
}
