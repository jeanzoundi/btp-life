'use client';

import { memo, useMemo, useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import { PARCELLE_RONIERS, RONIERS, STADES_RONIERS } from '@/lib/campagne';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import type { V3 } from '@/lib/architecture-ville';
import { bornage, echafaudage, implantation, muret, sondages, structure } from '@/lib/plan-akwaba';
import {
  BASE_VIE_RONIERS, DEMI_LARGEUR_RONIERS, DEMI_PROFONDEUR_RONIERS, elementsRoniers, GRUE_RONIERS, IMMEUBLE_RONIERS, longrinesRoniers, PIEUX_RONIERS, piquetsPieux,
  POTEAUX_RONIERS, SONDAGES_RONIERS, stocksRoniers, tetesPieux,
} from '@/lib/plan-roniers';
import { BlocsInstances } from './blocs-instances';
import { Balise, Bungalow, Grue, OuvrierEnBoucle, OuvrierPoste, Palissade } from './chantier-vivant';
import { HumainMonde } from './humain-monde';
import { MateriauMonde } from './materiaux-monde';
import { PanneauParcelle } from './immeuble-akwaba';
import { Architecture } from './ville-lagune';

/** La sondeuse du laboratoire, sur son porteur : son mât a percé la parcelle jusqu'à quinze mètres. */
function Sondeuse({ position }: { position: V3 }) {
  return <group position={position}>
    <mesh position={[0, .6, 0]} castShadow><boxGeometry args={[2.2, .7, 1.2]} /><meshStandardMaterial color="#C99A2E" roughness={.6} /></mesh>
    <mesh position={[-.7, 1.3, 0]} castShadow><boxGeometry args={[.8, .7, 1.1]} /><meshStandardMaterial color="#E8E2D6" roughness={.7} /></mesh>
    {[-.6, .6].map(x => <mesh key={x} position={[x, .24, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, 1.3, 12]} /><meshStandardMaterial color="#2B2B2E" /></mesh>)}
    <mesh position={[.85, 3.1, 0]} castShadow><boxGeometry args={[.22, 4.4, .22]} /><meshStandardMaterial color="#C99A2E" /></mesh>
    <mesh position={[.85, 1.55, .26]}><cylinderGeometry args={[.05, .05, 2.6, 8]} /><meshStandardMaterial color="#5E6B70" metalness={.6} roughness={.4} /></mesh>
    {/* Les carottes remontées, rangées dans leurs caisses à côté du porteur. */}
    {[0, 1, 2].map(i => <mesh key={i} position={[-.4 + i * .42, .12, 1.05]} castShadow><boxGeometry args={[.36, .16, .9]} /><meshStandardMaterial color={i === 2 ? '#C7A86A' : '#6B5240'} roughness={1} /></mesh>)}
  </group>;
}

/** La foreuse de pieux : chenilles, mât et tarière qui tourne au-dessus du pieu en cours. */
function Foreuse({ position, pause, rythme }: { position: V3; pause: boolean; rythme: number }) {
  const tariere = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (!pause && tariere.current) tariere.current.rotation.y += Math.min(delta, .05) * 2.4 * rythme; });
  return <group position={position}>
    {[-.75, .75].map(z => <mesh key={z} position={[0, .3, z]} castShadow><boxGeometry args={[3, .6, .55]} /><meshStandardMaterial color="#2F3336" roughness={.8} /></mesh>)}
    <mesh position={[0, .95, 0]} castShadow><boxGeometry args={[2.6, .8, 1.9]} /><meshStandardMaterial color="#D4A017" roughness={.55} /></mesh>
    <mesh position={[-.6, 1.8, .45]} castShadow><boxGeometry args={[1.1, .9, .9]} /><meshStandardMaterial color="#E9E7DF" roughness={.6} /></mesh>
    <mesh position={[-.6, 1.85, .91]}><planeGeometry args={[.8, .5]} /><meshStandardMaterial color="#3B5664" /></mesh>
    <mesh position={[1.25, 5, 0]} castShadow><boxGeometry args={[.42, 8.2, .42]} /><meshStandardMaterial color="#D4A017" roughness={.55} /></mesh>
    <mesh position={[.55, 2.5, 0]} rotation={[0, 0, -.55]} castShadow><boxGeometry args={[.14, 2.6, .14]} /><meshStandardMaterial color="#B8860B" /></mesh>
    <mesh ref={tariere} position={[1.25, 2.2, .45]} castShadow><cylinderGeometry args={[.3, .3, 3.2, 10]} /><meshStandardMaterial color="#6E7477" metalness={.55} roughness={.45} /></mesh>
  </group>;
}

/** La Résidence Les Rôniers vue de la ville : la parcelle des Jardins devient chantier, puis immeuble de six niveaux avec
 * ses deux commerces, au fil des chapitres du deuxième dossier. */
export const ImmeubleRoniers = memo(function ImmeubleRoniers({ stade, nuit, pause, rythme, selectionne, appel, onSelect }: {
  /** Chapitres validés du dossier des Rôniers (0 à 12). */
  stade: number; nuit: boolean; pause: boolean; rythme: number; selectionne: boolean;
  /** Libellé de la balise du portail quand M. Touré attend le joueur (la réception) ; rien sinon. */
  appel: string | null;
  onSelect: () => void;
}) {
  const e = elementsRoniers(stade), hx = DEMI_LARGEUR_RONIERS, hz = DEMI_PROFONDEUR_RONIERS, im = IMMEUBLE_RONIERS;
  const blocsBornage = useMemo(() => e.bornes ? bornage(hx, hz) : [], [e.bornes, hx, hz]);
  const blocsSondages = useMemo(() => e.sondages ? sondages(SONDAGES_RONIERS) : [], [e.sondages]);
  const blocsImplantation = useMemo(() => e.implantation ? implantation(im) : [], [e.implantation, im]);
  const blocsPiquets = useMemo(() => e.piquets ? piquetsPieux() : [], [e.piquets]);
  const blocsTetes = useMemo(() => e.forage ? tetesPieux() : [], [e.forage]);
  const blocsLongrines = useMemo(() => e.longrines ? longrinesRoniers() : [], [e.longrines]);
  const blocsStocks = useMemo(() => e.stocks ? stocksRoniers() : [], [e.stocks]);
  const blocsStructure = useMemo(() => e.niveauxMontes ? structure(im, POTEAUX_RONIERS, e.niveauxMontes) : [], [e.niveauxMontes, im]);
  const blocsEchafaudage = useMemo(() => e.echafaudage ? echafaudage(im) : [], [e.echafaudage, im]);
  const blocsMuret = useMemo(() => e.livre ? muret(hx, hz) : [], [e.livre, hx, hz]);
  const clic = (ev: ThreeEvent<MouseEvent>) => { ev.stopPropagation(); if (ev.delta < 5) onSelect(); };
  const hauteur = im.niveaux * im.hauteurNiveau, zFacade = im.centreZ + im.profondeur / 2;
  const sommet = e.immeuble ? hauteur + 1.6 : e.niveauxMontes ? GRUE_RONIERS.hauteur + 1 : e.forage ? 9.5 : 5;
  // Le pieu en cours de forage : la tarière de la foreuse tourne juste au-dessus.
  const [px, pz] = PIEUX_RONIERS[8];
  // Avant le permis, le panneau tient sur ses pieds derrière la rubalise ; ensuite, il est fixé à la palissade.
  const yPanneau = e.palissade ? 1.3 : 1.35, zPanneau = e.palissade ? hz + .09 : hz + .45;
  return <group position={[PARCELLE_RONIERS.x, 0, PARCELLE_RONIERS.z]} onClick={clic}>
    <mesh position={[0, .04, 0]} receiveShadow><boxGeometry args={[hx * 2, .08, hz * 2]} />
      {e.livre ? <meshStandardMaterial color="#8F9E74" roughness={1} /> : <MateriauMonde type="concrete_floor" couleur="#A88C66" echelle={1.8} relief={.95} rugosite={1} />}
    </mesh>
    <BlocsInstances blocs={blocsBornage} interactif={false} />
    <BlocsInstances blocs={blocsSondages} interactif={false} />
    <BlocsInstances blocs={blocsImplantation} interactif={false} />
    <BlocsInstances blocs={blocsPiquets} interactif={false} />
    <BlocsInstances blocs={blocsTetes} interactif={false} />
    <BlocsInstances blocs={blocsLongrines} interactif={false} />
    <BlocsInstances blocs={blocsStocks} interactif={false} />
    <BlocsInstances blocs={blocsStructure} interactif={false} />
    <BlocsInstances blocs={blocsEchafaudage} interactif={false} />
    <BlocsInstances blocs={blocsMuret} interactif={false} />
    {e.sondeuse && <Sondeuse position={[SONDAGES_RONIERS[0][0] - .85, .08, SONDAGES_RONIERS[0][1]]} />}
    {e.palissade && <Palissade hx={hx} hz={hz} />}
    {e.reserve && <PanneauParcelle position={[-5, 1.35, hz + .45]} titre="TERRAIN RÉSERVÉ" lignes={['Projet d’immeuble R+5', 'Propriété de M. Daouda Touré', 'Accès interdit']} couleur="#5E6B70" />}
    {e.panneauProjet && <PanneauParcelle position={[-5, yPanneau, zPanneau]} pieds={!e.palissade} titre={`PROJET · ${RONIERS.nom.toUpperCase()}`}
      lignes={[`Immeuble ${RONIERS.ouvrage}`, 'Maître d’ouvrage : M. Daouda Touré', `Entreprise : BTP Life Construction · ${STADES_RONIERS[Math.min(stade, STADES_RONIERS.length - 1)]}`]} couleur="#C1502E" />}
    {e.permis && <PanneauParcelle position={[5, 1.3, hz + .09]} pieds={false} titre="PERMIS DE CONSTRUIRE"
      lignes={['N° PC 2027-JDO-0318 · M. Touré', 'R+5 · 10 logements et 2 commerces · 840 m²', 'Dossier consultable à l’hôtel de ville']} couleur="#2F6FB3" />}
    {/* L'affiche promise aux voisins, sur la palissade côté avenue : horaires et durée du forage. */}
    {e.palissade && stade >= 5 && <group position={[hx + .09, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
      <PanneauParcelle position={[0, 1.3, 0]} pieds={false} titre="INFO RIVERAINS" lignes={['Chantier de 7 h à 18 h, du lundi au samedi', 'Forage des pieux : 8 jours', 'Contact : chef de chantier BTP Life']} couleur="#3D7A63" />
    </group>}
    {e.baseVie && <>
      <Bungalow position={[...BASE_VIE_RONIERS.bungalow]} taille={[...BASE_VIE_RONIERS.taille]} nuit={nuit} libelle="BASE VIE · RÔNIERS" />
      <mesh position={[...BASE_VIE_RONIERS.sanitaires]} castShadow><boxGeometry args={[.95, 2.3, .95]} /><meshStandardMaterial color="#3D6F9E" roughness={.6} /></mesh>
    </>}
    {e.sondeuse && <OuvrierPoste position={[SONDAGES_RONIERS[0][0] + 1.4, .08, SONDAGES_RONIERS[0][1] + 1.2]} rotation={-2.2} variante={2} echelle={ECHELLE_PERSONNAGES} />}
    {e.forage && <>
      <Foreuse position={[px - 1.25, .08, pz - .45]} pause={pause} rythme={rythme} />
      <mesh position={[-5.6, .6, 3.2]} castShadow receiveShadow><coneGeometry args={[1.2, 1.1, 16]} /><meshStandardMaterial color="#5C4A3A" roughness={1} /></mesh>
      <OuvrierPoste position={[px + 1.4, .08, pz + 1.3]} rotation={-2.5} variante={1} echelle={ECHELLE_PERSONNAGES} />
    </>}
    {e.grue && <Grue position={[...GRUE_RONIERS.position]} hauteur={GRUE_RONIERS.hauteur} hauteurCharge={Math.max(1, e.niveauxMontes) * im.hauteurNiveau} pause={pause} rythme={rythme} />}
    {e.niveauxMontes > 0 && <>
      <OuvrierEnBoucle points={[[-4.3, 5.9], [3.6, 5.9]]} depart={0} variante={0} porte pause={pause} rythme={rythme} echelle={ECHELLE_PERSONNAGES} />
      <OuvrierPoste position={[3.4, .4 + e.niveauxMontes * im.hauteurNiveau, -1.6]} rotation={.4} variante={3} echelle={ECHELLE_PERSONNAGES} />
      {e.echafaudage && <OuvrierPoste position={[-4, .4 + 3 * im.hauteurNiveau - .06, zFacade + .9]} rotation={Math.PI} variante={1} echelle={ECHELLE_PERSONNAGES} />}
    </>}
    {e.immeuble && <group position={[0, 0, im.centreZ]}>
      <Architecture width={im.largeur} height={hauteur} depth={im.profondeur} kind="campus" color="#E9D3A8" nuit={nuit} slug={RONIERS.id} />
      {/* Le nom de l'immeuble, en lettres sur l'acrotère, comme sur les immeubles d'Abidjan. */}
      <group position={[0, hauteur + 1.15, im.profondeur / 2 + .45]}>
        <mesh><boxGeometry args={[7.2, .7, .12]} /><meshStandardMaterial color="#18363B" roughness={.5} /></mesh>
        <Text position={[0, 0, .07]} fontSize={.4} color="#FFF0CE" anchorX="center" anchorY="middle" letterSpacing={.08}>{RONIERS.nom.toUpperCase()}</Text>
      </group>
    </group>}
    {e.reception && <>
      {/* Banderole au-dessus du portail, et M. Touré qui attend devant l'immeuble fini. */}
      {[-1, 1].map(s => <mesh key={s} position={[s * 2.75, 1.6, hz + .05]} castShadow><boxGeometry args={[.1, 3.2, .1]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
      <mesh position={[0, 2.85, hz + .08]}><planeGeometry args={[5.4, .55]} /><meshBasicMaterial color="#E8B04A" /></mesh>
      <Text position={[0, 2.85, hz + .1]} fontSize={.26} color="#2A1C0E" anchorX="center" anchorY="middle" letterSpacing={.08}>RÉCEPTION DES TRAVAUX</Text>
      <group position={[-1.3, .08, hz - 1]}><HumainMonde nom="M. Touré · Client" prof variante={2} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
    </>}
    {e.livre && <>
      <group position={[-3.2, .08, zFacade + 1.4]} rotation={[0, .4, 0]}><HumainMonde variante={1} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
      <group position={[2.6, .08, zFacade + 1.2]} rotation={[0, -.6, 0]}><HumainMonde variante={3} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
      <group position={[4.4, .08, zFacade + 1.5]} rotation={[0, 2.6, 0]}><HumainMonde variante={0} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
    </>}
    {appel && <Balise position={[0, 0, hz + 2]} libelle={appel} onClick={onSelect} />}
    {selectionne && <Billboard position={[0, sommet + 2, 0]}>
      <mesh><planeGeometry args={[Math.max(7, RONIERS.nom.length * .48), 1.55]} /><meshBasicMaterial color="#9b6422" transparent opacity={.94} /></mesh>
      <Text position={[0, 0, .02]} fontSize={.55} color="#fff5dc" anchorX="center" anchorY="middle">{RONIERS.nom}</Text>
    </Billboard>}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .19, 0]}><ringGeometry args={[hx * 1.25, hx * 1.25 + .25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
});
