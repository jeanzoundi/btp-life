'use client';

import { memo, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import { bungalowChantier, type EtatVisuel, type PointPlan, type PosteChantier } from '@/lib/journee-chantier';
import { planChantier } from '@/lib/plan-chantier';
import { BlocsInstances } from './blocs-instances';
import { HumainMonde } from './humain-monde';
import { MateriauMonde } from './materiaux-monde';

export type ChargementLivraison = 'ciment' | 'fers' | 'parpaings';

const JAUNE_GRUE = '#E8B23A';

/** Le Grand chantier du quartier : palissade, bungalow, grue, bétonnière, matériaux, ouvriers, et l'ouvrage qui monte phase par phase. */
export const ChantierVivant = memo(function ChantierVivant({ centre, largeur, profondeur, etat, nomChantier, livraison, postes, pause, rythme, nuit, selectionne, onPoste, onSelect }: {
  centre: PointPlan; largeur: number; profondeur: number; etat: EtatVisuel; nomChantier: string; livraison: ChargementLivraison | null;
  postes: { id: PosteChantier | 'yao'; position: PointPlan; libelle: string }[]; pause: boolean; rythme: number; nuit: boolean; selectionne: boolean;
  onPoste: (poste: PosteChantier | 'yao') => void; onSelect: () => void;
}) {
  const hx = largeur / 2, hz = profondeur / 2;
  const plan = useMemo(() => planChantier(etat), [etat]);
  const decor = useMemo(() => decorChantier(hx, hz), [hx, hz]);
  const bungalow = bungalowChantier([0, 0], largeur, profondeur);
  const livre = etat.phase === 'livre';
  const clic = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 5) onSelect(); };
  return <group position={[centre[0], 0, centre[1]]}>
    {/* Sol de la parcelle, cliquable pour rejoindre le portail. */}
    <mesh position={[0, .05, 0]} receiveShadow onClick={clic}><boxGeometry args={[largeur, .1, profondeur]} /><meshStandardMaterial color="#9C8B72" roughness={1} /></mesh>
    <Palissade hx={hx} hz={hz} onClick={clic} />
    <PanneauChantier position={[-6.4, 1.35, hz + .09]} nom={nomChantier} etat={etat} />
    <Bungalow position={[bungalow.x, 0, bungalow.z]} taille={[bungalow.largeur, 2.5, bungalow.profondeur]} nuit={nuit} />
    <BlocsInstances blocs={plan.structure} interactif={false} />
    <BlocsInstances blocs={plan.echafaudage} interactif={false} />
    <BlocsInstances blocs={plan.vitres} matiere="vitre" interactif={false} />
    <BlocsInstances blocs={decor} interactif={false} />
    {[[8.6, -5.2, 1.5, '#D7B98A'], [8.4, -2.2, 1.1, '#8E8C86']].map(([x, z, r, c]) => <mesh key={String(c)} position={[x as number, (r as number) * .45, z as number]} castShadow receiveShadow><coneGeometry args={[r as number, (r as number) * .9, 18]} /><meshStandardMaterial color={c as string} roughness={1} /></mesh>)}
    {!livre && <Grue position={[-8.4, 0, -5.2]} hauteurCharge={plan.hauteurTravail} pause={pause} rythme={rythme} />}
    {!livre && <Betonniere position={[6.2, 0, 4.3]} pause={pause} rythme={rythme} />}
    {!livre && <>
      <OuvrierEnBoucle points={[[-6.6, 3.9], [-4.6, 2.4]]} depart={0} variante={0} porte pause={pause} rythme={rythme} />
      <OuvrierEnBoucle points={[[-3.6, 4.7], [5, 3.6]]} depart={1} variante={2} porte pause={pause} rythme={rythme} />
      <OuvrierPoste position={[6.7, 0, 3]} rotation={-1.2} variante={4} />
      <OuvrierPoste position={[1.6, Math.max(.1, plan.hauteurTravail - .05), -1.2]} rotation={.4} variante={1} />
    </>}
    {livraison && <CamionLivraison position={[6.6, 0, hz + 4.3]} chargement={livraison} />}
    {postes.map(p => <Balise key={p.id} position={[p.position[0] - centre[0], 0, p.position[1] - centre[1]]} libelle={p.libelle} onClick={() => onPoste(p.id)} />)}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .19, 0]}><ringGeometry args={[Math.max(largeur, profondeur) * .65, Math.max(largeur, profondeur) * .65 + .25, 48]} /><meshBasicMaterial color="#E8B04A" transparent opacity={.75} /></mesh>}
  </group>;
});

/** Matériaux stockés : palette de parpaings, sacs de ciment, botte d'aciers, et la bande de marquage de la sortie. */
function decorChantier(hx: number, hz: number): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  const bloc = (position: V3, taille: V3, couleur: string, rotation = 0) => blocs.push({ position, taille, couleur, rotation });
  bloc([-6.6, .08, 5.2], [1.3, .15, 1.1], '#8B6A45');
  for (let y = 0; y < 3; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) bloc([-7 + i * .42, .3 + y * .22, 4.95 + k * .5], [.4, .2, .48], '#9E9A91');
  bloc([-3.6, .08, 5.7], [1.5, .15, 1.1], '#8B6A45');
  for (let y = 0; y < 2; y++) for (let i = 0; i < 4; i++) bloc([-4.15 + i * .37, .27 + y * .2, 5.7], [.35, .18, .9], '#DCCFB2', (y + i) % 2 ? .05 : -.05);
  for (let i = 0; i < 7; i++) bloc([3.8, .08 + (i % 3) * .05, -6.3 + i * .07], [6, .035, .035], '#8A5A3C');
  bloc([0, .11, hz - .4], [4.6, .02, .5], '#E2653C');
  bloc([-hx + .6, .4, hz - .6], [.5, .8, .5], '#3B6E48');
  return blocs;
}

function Palissade({ hx, hz, onClick }: { hx: number; hz: number; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const portail = 2.6;
  const panneaux: { p: V3; s: V3 }[] = [
    { p: [0, 1.1, -hz], s: [hx * 2, 2.2, .08] },
    { p: [-hx, 1.1, 0], s: [.08, 2.2, hz * 2] },
    { p: [hx, 1.1, 0], s: [.08, 2.2, hz * 2] },
    { p: [-(hx + portail) / 2, 1.1, hz], s: [hx - portail, 2.2, .08] },
    { p: [(hx + portail) / 2, 1.1, hz], s: [hx - portail, 2.2, .08] },
  ];
  return <group onClick={onClick}>
    {panneaux.map((panneau, i) => <group key={i}>
      <mesh position={panneau.p} castShadow receiveShadow><boxGeometry args={panneau.s} /><MateriauMonde type="corrugated_iron" couleur="#C9CDC4" echelle={1.6} relief={.9} rugosite={.6} metal={.4} /></mesh>
      {/* Bandeau terre cuite aux couleurs de BTP Life. */}
      <mesh position={[panneau.p[0], 2.12, panneau.p[2]]}><boxGeometry args={[panneau.s[0] + .02, .22, panneau.s[2] + .02]} /><meshStandardMaterial color="#C1502E" roughness={.6} /></mesh>
    </group>)}
    {/* Vantaux du portail, ouverts vers l'intérieur. */}
    {[-1, 1].map(cote => <mesh key={cote} position={[cote * (portail - .9), 1.05, hz - .9]} rotation={[0, cote * 1.2, 0]} castShadow><boxGeometry args={[1.9, 2.1, .06]} /><meshStandardMaterial color="#5E6B70" metalness={.5} roughness={.5} /></mesh>)}
  </group>;
}

function PanneauChantier({ position, nom, etat }: { position: V3; nom: string; etat: EtatVisuel }) {
  return <group position={position}>
    <mesh castShadow><boxGeometry args={[4.4, 1.9, .08]} /><meshStandardMaterial color="#F7F2E8" roughness={.7} /></mesh>
    <mesh position={[0, .78, .05]}><planeGeometry args={[4.4, .34]} /><meshBasicMaterial color="#C1502E" /></mesh>
    <Text position={[0, .78, .06]} fontSize={.17} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.08}>BTP LIFE · CHANTIER EN COURS</Text>
    <Text position={[0, .32, .06]} fontSize={.28} color="#2B2B2E" anchorX="center" anchorY="middle" maxWidth={4.1}>{nom}</Text>
    <Text position={[0, -.12, .06]} fontSize={.19} color="#5A4F42" anchorX="center" anchorY="middle" maxWidth={4.1}>{`${etat.nom} · ${Math.round(etat.avancement)} %`}</Text>
    <mesh position={[0, -.5, .05]}><planeGeometry args={[3.6, .14]} /><meshBasicMaterial color="#DDD6C8" /></mesh>
    <mesh position={[-1.8 + 1.8 * etat.avancement / 100, -.5, .055]}><planeGeometry args={[3.6 * etat.avancement / 100 + .001, .14]} /><meshBasicMaterial color="#E8B04A" /></mesh>
    <Text position={[0, -.78, .06]} fontSize={.13} color="#6F675C" anchorX="center" anchorY="middle">Port du casque obligatoire · Accès réservé</Text>
    {[-1.9, 1.9].map(x => <mesh key={x} position={[x, -1.2, -.05]}><boxGeometry args={[.08, 1.1, .08]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
  </group>;
}

function Bungalow({ position, taille, nuit }: { position: V3; taille: V3; nuit: boolean }) {
  const [l, h, p] = taille;
  return <group position={position}>
    <mesh position={[0, h / 2 + .25, 0]} castShadow receiveShadow><boxGeometry args={[l, h, p]} /><meshStandardMaterial color="#E9E7DF" roughness={.7} /></mesh>
    <mesh position={[0, h + .3, 0]} castShadow><boxGeometry args={[l + .2, .12, p + .2]} /><meshStandardMaterial color="#5E6B70" /></mesh>
    {[-1, 1].map(x => <mesh key={x} position={[x * (l / 2 - .2), .12, 0]}><boxGeometry args={[.25, .25, p]} /><meshStandardMaterial color="#4B4F52" /></mesh>)}
    <mesh position={[-.9, 1.45, p / 2 + .01]}><planeGeometry args={[1.5, .8]} /><meshStandardMaterial color={nuit ? '#E8C27A' : '#3B5664'} emissive={nuit ? '#B97736' : '#000000'} emissiveIntensity={nuit ? .8 : 0} /></mesh>
    <mesh position={[1.05, 1.15, p / 2 + .01]}><planeGeometry args={[.9, 1.8]} /><meshStandardMaterial color="#5E6B70" /></mesh>
    <mesh position={[1.05, .2, p / 2 + .35]} receiveShadow><boxGeometry args={[1.1, .2, .6]} /><meshStandardMaterial color="#8E8C86" /></mesh>
    <Text position={[0, h + .02, p / 2 + .02]} fontSize={.2} color="#2B2B2E" anchorX="center" anchorY="middle">BUREAU DE CHANTIER · EPI</Text>
    {/* Râtelier de casques à côté de la porte. */}
    <mesh position={[2.15, .95, p / 2 + .25]}><boxGeometry args={[.5, .05, .4]} /><meshStandardMaterial color="#8B6A45" /></mesh>
    {[-.12, .12].map((x, i) => <mesh key={x} position={[2.15 + x, 1.04, p / 2 + .25]} scale={[1, .7, 1]}><sphereGeometry args={[.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={i ? '#F2F0EA' : '#F4C430'} /></mesh>)}
  </group>;
}

/** Grue à tour : la flèche tourne lentement, le chariot va et vient, la charge pend au bout du câble. */
function Grue({ position, hauteurCharge, pause, rythme }: { position: V3; hauteurCharge: number; pause: boolean; rythme: number }) {
  const tete = useRef<THREE.Group>(null), chariot = useRef<THREE.Group>(null);
  const hauteur = 17;
  useFrame(({ clock }, delta) => {
    if (pause || !tete.current || !chariot.current) return;
    tete.current.rotation.y += Math.min(delta, .05) * .12 * rythme;
    chariot.current.position.x = 9.5 + Math.sin(clock.elapsedTime * .18 * rythme) * 4.5;
  });
  const cable = hauteur - Math.max(2.2, hauteurCharge + 1.6);
  return <group position={position}>
    <mesh position={[0, .3, 0]} castShadow><boxGeometry args={[2.4, .6, 2.4]} /><meshStandardMaterial color="#9E9A91" /></mesh>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x * .45, hauteur / 2, z * .45]} castShadow><boxGeometry args={[.1, hauteur, .1]} /><meshStandardMaterial color={JAUNE_GRUE} /></mesh>)}
    {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[0, 1 + i * 1.5, .45]} rotation={[0, 0, i % 2 ? .78 : -.78]}><boxGeometry args={[1.25, .05, .05]} /><meshStandardMaterial color={JAUNE_GRUE} /></mesh>)}
    <group ref={tete} position={[0, hauteur, 0]}>
      <mesh position={[0, .7, 0]} castShadow><boxGeometry args={[1.3, 1.2, 1.2]} /><meshStandardMaterial color="#F0EDE4" /></mesh>
      <mesh position={[7, .1, 0]} castShadow><boxGeometry args={[16, .45, .55]} /><meshStandardMaterial color={JAUNE_GRUE} /></mesh>
      <mesh position={[-3, .1, 0]} castShadow><boxGeometry args={[5, .45, .7]} /><meshStandardMaterial color={JAUNE_GRUE} /></mesh>
      <mesh position={[-4.9, -.4, 0]} castShadow><boxGeometry args={[1.3, 1.1, 1]} /><meshStandardMaterial color="#8E8C86" /></mesh>
      <mesh position={[0, 2.4, 0]}><boxGeometry args={[.12, 3.2, .12]} /><meshStandardMaterial color={JAUNE_GRUE} /></mesh>
      <group ref={chariot} position={[9.5, 0, 0]}>
        <mesh position={[0, -.25, 0]}><boxGeometry args={[.6, .2, .6]} /><meshStandardMaterial color="#4B4F52" /></mesh>
        <mesh position={[0, -cable / 2, 0]}><boxGeometry args={[.03, cable, .03]} /><meshStandardMaterial color="#2B2B2E" /></mesh>
        <mesh position={[0, -cable - .1, 0]} castShadow><boxGeometry args={[1.2, .14, 1]} /><meshStandardMaterial color="#8B6A45" /></mesh>
        <mesh position={[0, -cable + .18, 0]} castShadow><boxGeometry args={[1.05, .42, .85]} /><meshStandardMaterial color="#9E9A91" /></mesh>
      </group>
    </group>
  </group>;
}

function Betonniere({ position, pause, rythme }: { position: V3; pause: boolean; rythme: number }) {
  const cuve = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (!pause && cuve.current) cuve.current.rotation.y += Math.min(delta, .05) * 2.2 * rythme; });
  return <group position={position} rotation={[0, -.5, 0]}>
    <mesh position={[0, .45, 0]} castShadow><boxGeometry args={[1.1, .12, .7]} /><meshStandardMaterial color="#5E6B70" /></mesh>
    {[-1, 1].map(x => <mesh key={x} position={[x * .5, .22, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, .12, 14]} /><meshStandardMaterial color="#2B2B2E" /></mesh>)}
    <group position={[0, 1, 0]} rotation={[0, 0, .55]}>
      <mesh ref={cuve} castShadow><cylinderGeometry args={[.32, .5, .95, 16, 1, true]} /><meshStandardMaterial color="#E07A3A" side={THREE.DoubleSide} roughness={.55} /></mesh>
    </group>
  </group>;
}

function CamionLivraison({ position, chargement }: { position: V3; chargement: ChargementLivraison }) {
  return <group position={position} rotation={[0, Math.PI, 0]}>
    <mesh position={[2.5, 1.2, 0]} castShadow><boxGeometry args={[1.8, 1.9, 2.2]} /><meshStandardMaterial color="#F0EDE4" roughness={.5} /></mesh>
    <mesh position={[3.25, 1.55, 0]}><boxGeometry args={[.3, .8, 1.9]} /><meshStandardMaterial color="#2F3A40" metalness={.3} roughness={.2} /></mesh>
    <mesh position={[-.9, .85, 0]} castShadow receiveShadow><boxGeometry args={[5, .25, 2.3]} /><meshStandardMaterial color="#4B4F52" /></mesh>
    {[-2.4, -.3, 2.6].flatMap(x => [-1, 1].map(z => <mesh key={`${x}${z}`} position={[x, .42, z * 1.05]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.42, .42, .3, 16]} /><meshStandardMaterial color="#202326" /></mesh>))}
    {chargement === 'fers' && Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-.9, 1.05 + (i % 3) * .07, -.3 + i * .07]} castShadow><boxGeometry args={[4.6, .04, .04]} /><meshStandardMaterial color="#8A5A3C" /></mesh>)}
    {chargement !== 'fers' && Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[-2.6 + (i % 6) * .7, 1.17 + Math.floor(i / 6) * .38, 0]} castShadow><boxGeometry args={[.62, .36, 1.9]} /><meshStandardMaterial color={chargement === 'ciment' ? '#DCCFB2' : '#9E9A91'} /></mesh>)}
  </group>;
}

/** Balise d'une tâche : anneau au sol, colonne de lumière et libellé. Un clic y envoie le joueur, ou ouvre la tâche s'il est arrivé. */
function Balise({ position, libelle, onClick }: { position: V3; libelle: string; onClick: () => void }) {
  const anneau = useRef<THREE.Mesh>(null), losange = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (anneau.current) anneau.current.scale.setScalar(1 + Math.sin(t * 3) * .08);
    if (losange.current) { losange.current.rotation.y = t * 1.4; losange.current.position.y = 2.9 + Math.sin(t * 2) * .12; }
  });
  const clic = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); };
  return <group position={position} onClick={clic}>
    {/* Volume de clic invisible jusqu'au libellé : le texte et le losange seuls laissent passer le clic jusqu'au sol. */}
    <mesh position={[0, 1.95, 0]}><cylinderGeometry args={[1.1, 1.1, 3.9, 12]} /><meshBasicMaterial visible={false} /></mesh>
    <mesh ref={anneau} rotation={[-Math.PI / 2, 0, 0]} position={[0, .08, 0]} userData={{ sansOcclusion: true }}><ringGeometry args={[.7, .95, 40]} /><meshBasicMaterial color="#E8B04A" transparent opacity={.9} depthWrite={false} /></mesh>
    <mesh position={[0, 1.4, 0]} userData={{ sansOcclusion: true }}><cylinderGeometry args={[.5, .5, 2.8, 20, 1, true]} /><meshBasicMaterial color="#F6CF7A" transparent opacity={.16} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <mesh ref={losange} position={[0, 2.9, 0]} castShadow><octahedronGeometry args={[.32, 0]} /><meshStandardMaterial color="#E8B04A" emissive="#B97736" emissiveIntensity={.8} metalness={.3} roughness={.3} /></mesh>
    <Billboard position={[0, 3.6, 0]}><Text fontSize={.32} color="#FFF4D9" outlineColor="#2A1C0E" outlineWidth={.04} anchorX="center" anchorY="middle">{libelle}</Text></Billboard>
  </group>;
}

/** Ouvrier qui fait l'aller-retour entre deux points, un parpaing ou un sac dans les mains. */
function OuvrierEnBoucle({ points, depart, variante, porte = false, pause, rythme }: { points: PointPlan[]; depart: number; variante: number; porte?: boolean; pause: boolean; rythme: number }) {
  const ref = useRef<THREE.Group>(null), cible = useRef(depart % points.length), charge = useRef<THREE.Mesh>(null);
  const mouvement = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (!ref.current || pause) return;
    const [x, z] = points[cible.current];
    mouvement.set(x - ref.current.position.x, 0, z - ref.current.position.z);
    if (mouvement.lengthSq() < .04) cible.current = (cible.current + 1) % points.length;
    else {
      mouvement.normalize();
      ref.current.position.addScaledVector(mouvement, 1.2 * Math.min(delta, .05) * rythme);
      ref.current.rotation.y = Math.atan2(mouvement.x, mouvement.z);
    }
    // On porte à l'aller (vers le second point), on revient les mains vides.
    if (charge.current) charge.current.visible = porte && cible.current === 1;
  });
  const [x, z] = points[depart % points.length];
  return <group ref={ref} position={[x, 0, z]}>
    <HumainMonde casque variante={variante} marche={!pause} allure={1.2 * rythme} />
    <mesh ref={charge} position={[0, 1.15, .38]} castShadow><boxGeometry args={[.4, .2, .3]} /><meshStandardMaterial color="#9E9A91" /></mesh>
  </group>;
}

function OuvrierPoste({ position, rotation, variante }: { position: V3; rotation: number; variante: number }) {
  return <group position={position} rotation={[0, rotation, 0]}><HumainMonde casque prof variante={variante} /></group>;
}
