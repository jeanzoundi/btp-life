'use client';

import { memo, useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { CAMPAGNE, PARCELLE_AKWABA, stadeAkwaba } from '@/lib/campagne';
import type { V3 } from '@/lib/architecture-ville';
import {
  bornageAkwaba, DEMI_LARGEUR, DEMI_PROFONDEUR, echafaudageAkwaba, elementsAkwaba, fouillesAkwaba, IMMEUBLE, implantationAkwaba, muretAkwaba, SONDAGES,
  sondagesAkwaba, stocksAkwaba, structureAkwaba,
} from '@/lib/plan-akwaba';
import { BlocsInstances } from './blocs-instances';
import { Balise, Betonniere, Bungalow, Grue, MiniPelle, OuvrierEnBoucle, OuvrierPoste, Palissade } from './chantier-vivant';
import { HumainMonde } from './humain-monde';
import { Architecture } from './ville-lagune';

/** Panneau sur deux pieds (ou fixé à la palissade) : bandeau de couleur, titre, trois lignes. */
function PanneauParcelle({ position, titre, lignes, couleur, pieds = true }: { position: V3; titre: string; lignes: readonly string[]; couleur: string; pieds?: boolean }) {
  return <group position={position}>
    <mesh castShadow><boxGeometry args={[4.2, 1.7, .08]} /><meshStandardMaterial color="#F7F2E8" roughness={.7} /></mesh>
    <mesh position={[0, .66, .05]}><planeGeometry args={[4.2, .38]} /><meshBasicMaterial color={couleur} /></mesh>
    <Text position={[0, .66, .06]} fontSize={.19} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.06}>{titre}</Text>
    {lignes.map((l, i) => <Text key={l} position={[0, .2 - i * .34, .06]} fontSize={i ? .17 : .22} color={i ? '#5A4F42' : '#2B2B2E'} anchorX="center" anchorY="middle" maxWidth={3.95}>{l}</Text>)}
    {pieds && [-1.8, 1.8].map(x => <mesh key={x} position={[x, -1.05, -.05]} castShadow><boxGeometry args={[.08, 1.2, .08]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
  </group>;
}

/** Trépied du pénétromètre, laissé sur le premier point de sondage le temps de l'étude. */
function AppareilSondage({ position }: { position: V3 }) {
  return <group position={position}>
    {[0, 2.1, 4.2].map(a => <mesh key={a} position={[Math.sin(a) * .45, 1, Math.cos(a) * .45]} rotation={[Math.cos(a) * .22, 0, -Math.sin(a) * .22]} castShadow><boxGeometry args={[.06, 2.1, .06]} /><meshStandardMaterial color="#E8B23A" /></mesh>)}
    <mesh position={[0, 2.05, 0]} castShadow><boxGeometry args={[.32, .3, .32]} /><meshStandardMaterial color="#5E6B70" metalness={.4} roughness={.5} /></mesh>
    <mesh position={[0, 1, 0]}><boxGeometry args={[.04, 2, .04]} /><meshStandardMaterial color="#2B2B2E" metalness={.6} /></mesh>
  </group>;
}

/** La Résidence Akwaba vue de la ville : la parcelle bornée devient chantier, puis immeuble habité, au fil des chapitres. */
export const ImmeubleAkwaba = memo(function ImmeubleAkwaba({ stade, nuit, pause, rythme, selectionne, appel, onSelect }: {
  stade: number; nuit: boolean; pause: boolean; rythme: number; selectionne: boolean;
  /** Libellé de la balise du portail quand la parcelle attend le joueur (la réception) ; rien sinon. */
  appel: string | null;
  onSelect: () => void;
}) {
  const e = elementsAkwaba(stade), hx = DEMI_LARGEUR, hz = DEMI_PROFONDEUR;
  const bornage = useMemo(() => e.bornes ? bornageAkwaba() : [], [e.bornes]);
  const sondages = useMemo(() => e.sondages ? sondagesAkwaba() : [], [e.sondages]);
  const implantation = useMemo(() => e.implantation ? implantationAkwaba() : [], [e.implantation]);
  const fouilles = useMemo(() => e.fouilles ? fouillesAkwaba() : [], [e.fouilles]);
  const stocks = useMemo(() => e.stocks ? stocksAkwaba() : [], [e.stocks]);
  const structure = useMemo(() => e.grosOeuvre ? structureAkwaba() : [], [e.grosOeuvre]);
  const echafaudage = useMemo(() => e.grosOeuvre ? echafaudageAkwaba() : [], [e.grosOeuvre]);
  const muret = useMemo(() => e.livre ? muretAkwaba() : [], [e.livre]);
  const clic = (ev: ThreeEvent<MouseEvent>) => { ev.stopPropagation(); if (ev.delta < 5) onSelect(); };
  const zFacade = IMMEUBLE.centreZ + IMMEUBLE.profondeur / 2;
  // Avant le permis, le panneau tient sur ses pieds derrière la rubalise ; ensuite, il est fixé à la palissade.
  const yPanneau = e.palissade ? 1.3 : 1.35, zPanneau = e.palissade ? hz + .09 : hz + .45;
  return <group position={[PARCELLE_AKWABA.x, 0, PARCELLE_AKWABA.z]} onClick={clic}>
    <mesh position={[0, .04, 0]} receiveShadow><boxGeometry args={[hx * 2, .08, hz * 2]} /><meshStandardMaterial color={e.livre ? '#8F9E74' : '#A88C66'} roughness={1} /></mesh>
    <BlocsInstances blocs={bornage} interactif={false} />
    <BlocsInstances blocs={sondages} interactif={false} />
    <BlocsInstances blocs={implantation} interactif={false} />
    <BlocsInstances blocs={fouilles} interactif={false} />
    <BlocsInstances blocs={stocks} interactif={false} />
    <BlocsInstances blocs={structure} interactif={false} />
    <BlocsInstances blocs={echafaudage} interactif={false} />
    <BlocsInstances blocs={muret} interactif={false} />
    {e.appareilSondage && <AppareilSondage position={[SONDAGES[0][0], .08, SONDAGES[0][1]]} />}
    {e.palissade && <Palissade hx={hx} hz={hz} />}
    {stade === 0 && <PanneauParcelle position={[-5.6, 1.35, hz + .45]} titre="TERRAIN RÉSERVÉ" lignes={[CAMPAGNE.nom, `Propriété de ${CAMPAGNE.cliente}`, 'Accès interdit']} couleur="#5E6B70" />}
    {e.panneauProjet && <PanneauParcelle position={[-5.6, yPanneau, zPanneau]} pieds={!e.palissade} titre={`PROJET · ${CAMPAGNE.nom.toUpperCase()}`}
      lignes={[`Immeuble ${CAMPAGNE.ouvrage}`, `Maître d’ouvrage : ${CAMPAGNE.cliente}`, `Entreprise : BTP Life Construction · ${stadeAkwaba({ chapitres: stade })}`]} couleur="#C1502E" />}
    {e.permis && <PanneauParcelle position={[5.6, 1.3, hz + .09]} pieds={false} titre="PERMIS DE CONSTRUIRE"
      lignes={['N° PC 2026-PLN-0142 · Mme Touré', 'R+3 · 8 logements · 432 m² de plancher', 'Dossier consultable à l’hôtel de ville']} couleur="#2F6FB3" />}
    {e.baseVie && <>
      <Bungalow position={[-8.1, 0, 1.6]} taille={[3.2, 2.5, 2.2]} nuit={nuit} rotation={Math.PI / 2} libelle="BASE VIE · AKWABA" />
      <mesh position={[-8.4, 1.15, -3.6]} castShadow><boxGeometry args={[1.05, 2.3, 1.05]} /><meshStandardMaterial color="#3D6F9E" roughness={.6} /></mesh>
    </>}
    {e.fouilles && <>
      <MiniPelle position={[3.2, 0, 5.1]} rotation={-.5} pause={pause} rythme={rythme} />
      <mesh position={[8.3, .55, 4.6]} castShadow receiveShadow><coneGeometry args={[1.3, 1.1, 16]} /><meshStandardMaterial color="#6B5240" roughness={1} /></mesh>
    </>}
    {e.grosOeuvre && <>
      <Grue position={[8.3, 0, -4.4]} hauteurCharge={IMMEUBLE.niveaux * IMMEUBLE.hauteurNiveau} pause={pause} rythme={rythme} />
      <Betonniere position={[8.2, 0, 4.6]} pause={pause} rythme={rythme} />
      <OuvrierEnBoucle points={[[7.4, 2.6], [3.2, 5.3]]} depart={0} variante={0} porte pause={pause} rythme={rythme} />
      <OuvrierPoste position={[1.6, .4 + IMMEUBLE.niveaux * IMMEUBLE.hauteurNiveau, -1.4]} rotation={.4} variante={1} />
      <OuvrierPoste position={[-3, .4 + 2 * IMMEUBLE.hauteurNiveau - .06, zFacade + .9]} rotation={Math.PI} variante={3} />
    </>}
    {e.immeuble && <group position={[0, 0, IMMEUBLE.centreZ]}>
      <Architecture width={IMMEUBLE.largeur} height={IMMEUBLE.niveaux * IMMEUBLE.hauteurNiveau} depth={IMMEUBLE.profondeur} kind="maison" color="#E6CFA4" nuit={nuit} slug={CAMPAGNE.id} />
      <group position={[0, 3.05, IMMEUBLE.profondeur / 2 + .3]}>
        <mesh><boxGeometry args={[4.6, .55, .1]} /><meshStandardMaterial color="#18363B" roughness={.5} /></mesh>
        <Text position={[0, 0, .06]} fontSize={.3} color="#FFF0CE" anchorX="center" anchorY="middle" letterSpacing={.08}>{CAMPAGNE.nom.toUpperCase()}</Text>
      </group>
    </group>}
    {e.reception && <>
      {/* Banderole tendue au-dessus du portail, et Mme Touré qui attend devant l'immeuble fini. */}
      {[-1, 1].map(s => <mesh key={s} position={[s * 2.75, 1.6, hz + .05]} castShadow><boxGeometry args={[.1, 3.2, .1]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
      <mesh position={[0, 2.85, hz + .08]}><planeGeometry args={[5.4, .55]} /><meshBasicMaterial color="#E8B04A" /></mesh>
      <Text position={[0, 2.85, hz + .1]} fontSize={.26} color="#2A1C0E" anchorX="center" anchorY="middle" letterSpacing={.08}>RÉCEPTION DES TRAVAUX</Text>
      <group position={[-1.3, .08, hz - 1]}><HumainMonde nom="Mme Touré · Cliente" prof variante={0} sansCasque scale={1.1} /></group>
    </>}
    {e.livre && <>
      <group position={[-1.8, .08, zFacade + 1.6]} rotation={[0, .5, 0]}><HumainMonde variante={1} sansCasque scale={1.1} /></group>
      <group position={[1.5, .08, zFacade + 1.9]} rotation={[0, -.7, 0]}><HumainMonde variante={2} sansCasque scale={1.1} /></group>
    </>}
    {appel && <Balise position={[0, 0, hz + 2]} libelle={appel} onClick={onSelect} />}
    {selectionne && <Billboard position={[0, (e.immeuble ? IMMEUBLE.niveaux * IMMEUBLE.hauteurNiveau + 3.5 : e.grosOeuvre ? 17 : 5) + 2, 0]}>
      <mesh><planeGeometry args={[Math.max(7, CAMPAGNE.nom.length * .48), 1.55]} /><meshBasicMaterial color="#9b6422" transparent opacity={.94} /></mesh>
      <Text position={[0, 0, .02]} fontSize={.55} color="#fff5dc" anchorX="center" anchorY="middle">{CAMPAGNE.nom}</Text>
    </Billboard>}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .19, 0]}><ringGeometry args={[hx * 1.25, hx * 1.25 + .25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
});
