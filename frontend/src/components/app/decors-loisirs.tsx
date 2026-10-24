'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import type { ArticleCarte } from '@/lib/lieux-vie';
import { ARTICLES_AZUR, TABLES_AZUR } from '@/lib/lieux-vie/azur';
import type { BoutiqueGalerie } from '@/lib/lieux-vie/galerie';
import { CAP_AMARRE, PONTONS, surLeTour, TABLES_MARINA, TOUR_PIROGUE } from '@/lib/lieux-vie/marina';
import { ARTICLES_SPORT } from '@/lib/lieux-vie/sport';
import type { Assise } from '@/lib/navigation-plan';
import { BlocsInstances } from './blocs-instances';
import { Boite, Cyl, Enseigne, Mur, MursCoupe, Plafonniers, Sol, SolCarrele, Verre } from './decors-lieux';
import { chaiseBistrot, chaisePlastique, Fumee, Gens, PlatServi, QUATRE_PLACES } from './decors-lieux-vie';
import { HumainMonde } from './humain-monde';
import { MateriauMonde } from './materiaux-monde';

// Décors des lieux de loisirs : marché, marina, complexe sportif, centre commercial, galerie marchande.
// Même règle que les autres lieux : la caméra regarde depuis le sud-sud-est, enseignes et ardoises sont tournées vers
// le sud, et aucune bâche, paillote ni auvent ne passe entre la caméra et un vendeur, un hôte ou le joueur.

/** Fruits et légumes en tas : une seule géométrie instanciée par tas. */
function Fruits({ points, r, c }: { points: V3[]; r: number; c: string }) {
  const tas = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const matrice = new THREE.Matrix4();
    points.forEach((p, i) => tas.current?.setMatrixAt(i, matrice.makeTranslation(p[0], p[1], p[2])));
    if (tas.current) tas.current.instanceMatrix.needsUpdate = true;
  }, [points]);
  return <instancedMesh ref={tas} args={[undefined, undefined, points.length]} castShadow><sphereGeometry args={[r, 10, 8]} /><meshStandardMaterial color={c} roughness={.6} /></instancedMesh>;
}
/** Pyramide d'étal : base carrée, chaque rang posé dans les creux du précédent. */
function pyramide(x: number, y: number, z: number, base: number, r: number): V3[] {
  const points: V3[] = [];
  for (let n = base, rang = 0; n > 0; n--, rang++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) points.push([x + (i - (n - 1) / 2) * r * 2, y + r + rang * r * 1.42, z + (j - (n - 1) / 2) * r * 2]);
  return points;
}

/** Cocotier : stipe un peu penché, palmes qui retombent, quelques noix. */
function Cocotier({ p, hauteur = 5.5, penche = .12, r = 0 }: { p: V3; hauteur?: number; penche?: number; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}><group rotation={[0, 0, penche]}>
    <Cyl p={[0, hauteur / 2, 0]} r={.17} haut={.12} h={hauteur} c="#7A6247" />
    {Array.from({ length: 8 }, (_, i) => <group key={i} position={[0, hauteur, 0]} rotation={[0, i * Math.PI / 4 + .2, 0]}>
      <mesh position={[0, -.25, 1]} rotation={[.45 + (i % 2) * .15, 0, 0]} castShadow><boxGeometry args={[.42, .03, 2.1]} /><meshStandardMaterial color={i % 2 ? '#3F7A35' : '#4E8A3A'} roughness={.85} /></mesh>
    </group>)}
    {[0, 1, 2].map(i => <mesh key={`n${i}`} position={[Math.cos(i * 2.1) * .18, hauteur - .2, Math.sin(i * 2.1) * .18]} castShadow><sphereGeometry args={[.11, 10, 8]} /><meshStandardMaterial color="#6B7A2E" roughness={.7} /></mesh>)}
  </group></group>;
}

/** Plante d'intérieur en pot. */
function Plante({ p }: { p: V3 }) {
  return <group position={p}><Cyl p={[0, .3, 0]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[0, 1.2, 0]} castShadow><coneGeometry args={[.55, 1.4, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>;
}

// ─── Marché des Jardins ───

const ETALS_DECOR = [{ x: -6, bache: '#2E6FB0' }, { x: -1, bache: '#E8772E' }, { x: 4, bache: '#3E8E5A' }, { x: 9, bache: '#C8392E' }];

/** Un étal : table sur tréteaux, cageots dessous, réserve derrière, bâche haute et relevée vers la rue. */
function Etal({ x, bache }: { x: number; bache: string }) {
  return <group position={[x, 0, 0]}>
    <Boite p={[0, .84, -5.8]} s={[3.6, .06, 1.1]} c="#8B6A45" />
    {[[-1.7, -6.25], [1.7, -6.25], [-1.7, -5.35], [1.7, -5.35]].map(([dx, dz]) => <Boite key={`${dx}${dz}`} p={[dx, .41, dz]} s={[.07, .82, .07]} c="#5A3E2B" />)}
    {[-1.1, 0, 1.1].map(dx => <Boite key={dx} p={[dx, .17, -5.8]} s={[.6, .32, .42]} c={dx ? '#C8392E' : '#E9C46A'} />)}
    <Boite p={[0, .45, -7.45]} s={[3.4, .9, .5]} c="#6B4A33" />
    {[-1.9, 1.9].map(dx => <group key={dx}><Cyl p={[dx, 1.7, -8]} r={.04} h={3.4} c="#7A6247" /><Cyl p={[dx, 1.85, -5.9]} r={.04} h={3.7} c="#7A6247" /></group>)}
    <mesh position={[0, 3.55, -6.95]} rotation={[-.13, 0, 0]} castShadow><boxGeometry args={[4, .03, 2.25]} /><meshStandardMaterial color={bache} roughness={.8} side={THREE.DoubleSide} /></mesh>
  </group>;
}

export function DecorMarche({ preparation, servi }: {
  /** L'étal qui prépare une commande : la braise fume davantage. */
  preparation: string | null;
  /** Ce qu'on a acheté, posé sur le banc en attendant d'être mangé. */
  servi: ArticleCarte | null;
}) {
  const tas = useMemo(() => ({
    mangues: pyramide(-7.1, .87, -5.8, 4, .075), manguesVertes: pyramide(-6.1, .87, -5.8, 3, .075),
    tomates: pyramide(-2.1, .87, -5.8, 4, .055), oignons: pyramide(-1, .87, -5.8, 4, .06), piments: pyramide(.1, .87, -5.65, 3, .035),
    paniers: [...pyramide(7.9, .38, 4.5, 2, .08), ...pyramide(8.4, .34, 5.4, 2, .07)],
  }), []);
  const pagnes = useMemo(() => {
    const blocs: BlocArchitecture[] = [], motifs = ['#C8392E', '#F4C430', '#2E6FB0', '#3E8E5A', '#E8772E', '#7A2E6E', '#1C1C1E', '#F2EEDF'];
    for (let pile = 0; pile < 3; pile++) for (let k = 0; k < 8; k++) blocs.push({ position: [2.9 + pile * 1.1, .9 + k * .045, -5.8], taille: [.62, .04, .4], couleur: motifs[(pile * 3 + k) % motifs.length], rotation: 0 });
    for (let k = 0; k < 6; k++) blocs.push({ position: [2.7 + k * .52, 1.85, -7.62], taille: [.46, 1.2, .03], couleur: motifs[(k * 5) % motifs.length], rotation: 0 });
    // Sacs de riz et d'oignons, à l'ouest.
    for (let col = 0; col < 3; col++) for (let rang = 0; rang < 3 - col % 2; rang++) blocs.push({ position: [-11.7, .2 + rang * .38, -1.4 + col * 1.4], taille: [1, .36, .62], couleur: col === 1 ? '#B8322A' : '#EDE6D6', rotation: 0 });
    return blocs;
  }, []);
  const epices: [number, string][] = [[7.8, '#B8322A'], [8.5, '#D9A23A'], [9.2, '#7A4A2A'], [9.9, '#6B8A3A']];
  return <>
    <Sol largeur={26} profondeur={18} c="#B98A62" echelle={3} />
    {/* La halle au fond : mur de briques peintes, enseigne au-dessus des bâches. */}
    <Mur p={[0, 2.5, -8.9]} s={[26.4, 5, .2]} c="#E8C9A0" />
    <Boite p={[0, .5, -8.78]} s={[26, 1, .02]} c="#9B4A2A" />
    <Enseigne p={[0, 4.35, -8.77]} largeur={8.6} hauteur={.9} fond="#2E6FB0" texte="MARCHÉ DES JARDINS" couleur="#FFD54A" taille={.5} />
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 13.1, .6, 0]} s={[.2, 1.2, 18.2]} c="#D9B48A" />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * 8.05, .45, 9.1]} s={[10.1, .9, .2]} c="#D9B48A" />)}
    {/* Les quatre étals : fruits de Maman Akoua, légumes, pagnes, épices et poisson fumé. */}
    {ETALS_DECOR.map(e => <Etal key={e.x} {...e} />)}
    <Fruits points={tas.mangues} r={.075} c="#F2A23A" /><Fruits points={tas.manguesVertes} r={.075} c="#B7B23A" />
    {[-5.2, -4.85, -4.5].map(x => <group key={x}><Cyl p={[x, 1.01, -5.85]} r={.1} h={.28} c="#C98F2E" /><mesh position={[x, 1.25, -5.85]} castShadow><coneGeometry args={[.09, .26, 6]} /><meshStandardMaterial color="#4E7A3A" roughness={.8} /></mesh></group>)}
    <group position={[-4.55, 1.05, -5.27]}>
      <Boite p={[0, 0, 0]} s={[.7, .34, .03]} c="#1E2422" />
      <Text position={[0, .07, .02]} fontSize={.06} color="#F4F1EA" anchorX="center" anchorY="middle">MANGUES 300 F</Text>
      <Text position={[0, -.06, .02]} fontSize={.06} color="#F4F1EA" anchorX="center" anchorY="middle">ANANAS 500 F</Text>
    </group>
    <Fruits points={tas.tomates} r={.055} c="#D63A2A" /><Fruits points={tas.oignons} r={.06} c="#9B5A7A" /><Fruits points={tas.piments} r={.035} c="#C8392E" />
    {[.6, .8, 1].map(x => <Boite key={x} p={[x, .91, -5.95]} s={[.09, .08, .32]} c="#4B2A5A" />)}
    <BlocsInstances blocs={pagnes} interactif={false} />
    {epices.map(([x, c]) => <group key={x}><Cyl p={[x, .93, -5.8]} r={.24} h={.12} c="#C9CDD0" metal={.5} /><mesh position={[x, 1.06, -5.8]} castShadow><coneGeometry args={[.21, .18, 12]} /><meshStandardMaterial color={c} roughness={.95} /></mesh></group>)}
    {[10.4, 10.65].map(x => <Boite key={x} p={[x, .92, -5.8]} s={[.16, .06, .5]} c="#7A4A2A" />)}
    <Gens p={[-1, 0, -6.7]} variante={1} /><Gens p={[4, 0, -6.7]} variante={4} /><Gens p={[9, 0, -6.7]} variante={3} />
    {/* Grill de choukouya : demi-fût, braise, brochettes de mouton ; Ibrahim derrière, la fumée au-dessus. */}
    <group position={[-8, 0, 0]}>
      <Boite p={[0, .8, 0]} s={[3.2, .3, .9]} c="#2B2B2E" metal={.4} />
      {[[-1.5, -.38], [1.5, -.38], [-1.5, .38], [1.5, .38]].map(([x, z]) => <Boite key={`${x}${z}`} p={[x, .33, z]} s={[.06, .66, .06]} c="#2B2B2E" />)}
      <Boite p={[0, .96, 0]} s={[3, .02, .7]} c="#3A1A08" emissif="#E0601A" />
      {Array.from({ length: 9 }, (_, i) => <Boite key={i} p={[-1.3 + i * .32, 1.01, (i % 2 ? .08 : -.08)]} s={[.08, .06, .5]} c={i % 3 ? '#7A3A1E' : '#9C5A2C'} />)}
      <Boite p={[1.3, .98, .3]} s={[.4, .03, .25]} c="#8B6A45" /><Cyl p={[1.25, 1.03, .3]} r={.06} h={.06} c="#E9D7E0" />
      <group position={[-1.6, 0, -1.3]}><Cyl p={[0, 1.1, 0]} r={.03} h={2.2} c="#6B4A33" /><Enseigne p={[0, 2.25, .03]} largeur={1.3} hauteur={.4} fond="#7A1F1F" texte="CHOUKOUYA" couleur="#FFE7B0" taille={.16} /></group>
    </group>
    <Fumee p={[-8, 1.1, 0]} dense={preparation === 'choukouya'} />
    <Gens p={[-8, 0, -1.45]} variante={0} />
    {/* Banane braisée : brasero rond, plantains et arachides ; Tantie Rose. */}
    <group position={[6, 0, 0]}>
      <Cyl p={[0, .55, 0]} r={.55} h={.12} c="#2B2B2E" metal={.4} />
      {[0, 2.1, 4.2].map(a => <Boite key={a} p={[Math.cos(a) * .4, .25, Math.sin(a) * .4]} s={[.04, .5, .04]} c="#2B2B2E" />)}
      <Cyl p={[0, .62, 0]} r={.5} h={.02} c="#3A1A08" />
      <Boite p={[0, .63, 0]} s={[.7, .01, .6]} c="#3A1A08" emissif="#D9541A" />
      {[[-.25, -.15, .3], [.05, -.2, -.2], [.25, .05, .5], [-.15, .2, -.4], [.12, .25, .1]].map(([x, z, r]) => <Boite key={`${x}${z}`} p={[x, .68, z]} s={[.38, .07, .09]} r={r} c={x > 0 ? '#C98F2E' : '#8E5A34'} />)}
      <Boite p={[-1.4, .45, 0]} s={[1, .9, .7]} c="#7A5A3A" /><Cyl p={[-1.6, .98, 0]} r={.25} h={.15} c="#C49A64" /><Cyl p={[-1.6, 1.06, 0]} r={.22} h={.02} c="#B07A3A" />
      <Cyl p={[1.2, .2, .1]} r={.32} h={.4} c="#2F6FB0" />
    </group>
    <Fumee p={[6, .75, 0]} dense={preparation === 'banane'} />
    <Gens p={[6, 0, -1.45]} variante={1} />
    {/* Mariette et ses paniers tressés, pleins de fruits pour les équipes. */}
    {[[7, 4.6, .45], [7.9, 4.5, .38], [8.8, 4.7, .42], [7.4, 5.4, .36], [8.4, 5.4, .4], [9.2, 5.3, .3]].map(([x, z, r]) => <Cyl key={`${x}${z}`} p={[x, .2, z]} r={r * .72} haut={r} h={.4} c="#C9A66B" />)}
    {[0, 1, 2].map(k => <Cyl key={k} p={[6.85, .45 + k * .12, 5.5]} r={.28} haut={.36} h={.12} c={k % 2 ? '#B08A52' : '#C9A66B'} />)}
    <Fruits points={tas.paniers} r={.08} c="#E86A2E" />
    <Boite p={[10.15, .22, 5]} s={[.36, .44, .36]} c="#7A5A3A" />
    <Gens p={[10.1, 0, 5]} r={-Math.PI / 2} assis variante={1} />
    {/* Le banc des clients, dossier au nord : on y mange face à la rue. */}
    <Boite p={[-5, .44, 5.05]} s={[3, .06, .42]} c="#8B6A45" /><Boite p={[-5, .76, 4.82]} s={[3, .45, .05]} c="#7A5A3A" />
    {[-6.3, -3.7].map(x => <Boite key={x} p={[x, .21, 5.05]} s={[.08, .42, .38]} c="#5A3E2B" />)}
    <Gens p={[-3.9, 0, 5.02]} assis variante={2} />
    {servi && <PlatServi p={[-5.55, .47, 5.08]} article={servi} />}
    {/* Le pousse-pousse du porteur, garé contre le mur ouest. */}
    <group position={[-12.1, 0, 4.4]}>
      <Boite p={[0, .62, 0]} s={[1, .08, 2]} c="#8B6A45" /><Boite p={[0, .9, .3]} s={[.8, .45, 1]} c="#EDE6D6" />
      {[-.55, .55].map(x => <Cyl key={x} p={[x, .35, -.4]} r={.35} h={.07} c="#2B2B2E" rot={[0, 0, Math.PI / 2]} />)}
      {[-.35, .35].map(x => <Boite key={`b${x}`} p={[x, .7, 1.4]} s={[.05, .05, 1]} c="#6B4A33" />)}
    </group>
    {/* Clients aux étals, fanions au-dessus de l'allée. */}
    <Gens p={[-1.2, 0, -4.35]} r={Math.PI} variante={4} /><Gens p={[4.6, 0, -4.45]} r={Math.PI} variante={0} /><Gens p={[9.4, 0, -4.4]} r={Math.PI} variante={2} />
    <Boite p={[0, 3.15, -2.8]} s={[25, .012, .012]} c="#2B2B2E" />
    {Array.from({ length: 24 }, (_, i) => <mesh key={i} position={[-11.5 + i, 3.02, -2.8]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[.13, .26, 3]} /><meshStandardMaterial color={['#C8392E', '#F4C430', '#2E8B57', '#2E6FB0'][i % 4]} roughness={.8} side={THREE.DoubleSide} /></mesh>)}
  </>;
}

// ─── Marina ───

/** La lagune : un plan d'eau jusqu'à la brume, et des reflets qui dérivent lentement. */
function Lagune() {
  const reflets = useRef<THREE.Group>(null);
  const traits = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: ((i * 37) % 30) - 15, z: -2.5 - ((i * 53) % 22), l: .8 + (i % 4) * .5 })), []);
  useFrame(({ clock }) => {
    reflets.current?.children.forEach((enfant, i) => {
      const t = clock.elapsedTime;
      enfant.position.x = ((traits[i].x + t * .35 + 15) % 30 + 30) % 30 - 15;
      ((enfant as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = .18 + Math.sin(t * 1.3 + i) * .12;
    });
  });
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.03, -41.2]} receiveShadow><planeGeometry args={[160, 80]} /><meshStandardMaterial color="#2A6670" roughness={.14} metalness={.35} /></mesh>
    <group ref={reflets}>{traits.map((t, i) => <mesh key={i} position={[t.x, -.02, t.z]} rotation={[-Math.PI / 2, 0, 0]} userData={{ sansOcclusion: true }}><planeGeometry args={[t.l, .05]} /><meshBasicMaterial color="#DDEFF2" transparent opacity={.2} depthWrite={false} /></mesh>)}</group>
  </>;
}

/** Coque de pirogue : demi-ellipsoïde peint, liston de couleur, bancs ; vue de dessus, on voit dedans. */
function Coque({ couleur, liston, longueur = 5.2 }: { couleur: string; liston: string; longueur?: number }) {
  const demi = longueur / 2;
  return <group>
    <mesh position={[0, .4, 0]} scale={[.5, .55, demi]} castShadow receiveShadow><sphereGeometry args={[1, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color={couleur} roughness={.65} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, .4, 0]} scale={[.51, .56, demi + .01]}><sphereGeometry args={[1, 20, 2, 0, Math.PI * 2, Math.PI / 2, .32]} /><meshStandardMaterial color={liston} roughness={.6} side={THREE.DoubleSide} /></mesh>
    {[-.5, 0, .5].map(k => <Boite key={k} p={[0, .42, k * demi]} s={[Math.sqrt(1 - k * k) - .06, .05, .24]} c="#7A5A3A" />)}
  </group>;
}

/** La pirogue du capitaine : amarrée au grand ponton, ou en balade sur la boucle, le joueur assis au milieu.
 * Elle déplace aussi l'assise du joueur, que celui-ci relit à chaque image. */
function PirogueBalade({ balade }: { balade: { depuis: number; duree: number; assise: Assise } | null }) {
  const groupe = useRef<THREE.Group>(null);
  const cap = useRef(CAP_AMARRE);
  useFrame(({ clock }, delta) => {
    const g = groupe.current;
    if (!g) return;
    const { position, cap: voulu } = balade ? surLeTour((Date.now() - balade.depuis) / (balade.duree * 1000)) : { position: TOUR_PIROGUE[0], cap: CAP_AMARRE };
    // Le cap suit la route en douceur : la pirogue vire, elle ne pivote pas sur place.
    cap.current += Math.atan2(Math.sin(voulu - cap.current), Math.cos(voulu - cap.current)) * (1 - Math.exp(-3 * Math.min(delta, .1)));
    g.position.set(position[0], Math.sin(clock.elapsedTime * 1.6) * .025, position[1]);
    g.rotation.set(0, cap.current, Math.sin(clock.elapsedTime * 1.1) * .03);
    if (balade) { balade.assise.position = [position[0], position[1]]; balade.assise.rotation = cap.current; }
  });
  return <group ref={groupe} position={[TOUR_PIROGUE[0][0], 0, TOUR_PIROGUE[0][1]]} rotation={[0, CAP_AMARRE, 0]}>
    <Coque couleur="#2E6FB0" liston="#F4C430" />
    {/* Le piroguier, debout à la poupe, et sa perche. */}
    <group position={[0, .06, -1.9]}><HumainMonde variante={0} /></group>
    <Cyl p={[.35, 1.3, -1.55]} r={.025} h={4.2} c="#8B6A45" rot={[.55, 0, -.2]} />
  </group>;
}

function Ponton({ x1, x2, bout }: { x1: number; x2: number; bout: number }) {
  const pieux: [number, number][] = [];
  for (let z = -1.6; z > bout - .01; z -= 1.6) pieux.push([x1 - .06, z], [x2 + .06, z]);
  return <>
    <mesh position={[(x1 + x2) / 2, .01, (bout - 1.2) / 2]} castShadow receiveShadow><boxGeometry args={[x2 - x1, .08, -1.2 - bout]} /><MateriauMonde type="wood_floor" couleur="#A07C55" echelle={1.2} relief={.6} rugosite={.85} /></mesh>
    {pieux.map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .2, z]} r={.09} h={.5} c="#5A4632" />)}
  </>;
}

export function DecorMarina({ balade, servi }: {
  /** La balade en cours : départ, durée, et l'assise du joueur que la pirogue emmène. */
  balade: { depuis: number; duree: number; assise: Assise } | null;
  servi: { station: 'kiosque' | 'terrasse'; article: ArticleCarte } | null;
}) {
  const mobilier = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    for (const [x, z] of TABLES_MARINA) for (const [dx, dz, a] of QUATRE_PLACES) chaiseBistrot(blocs, x + dx, z + dz, a);
    return blocs;
  }, []);
  const cocos = useMemo(() => pyramide(6.9, 1.12, 4.7, 3, .13), []);
  return <>
    <Lagune />
    {/* Le quai : pavés, margelle de pierre, bittes d'amarrage. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .002, 4.4]} receiveShadow><planeGeometry args={[28, 11.2]} /><MateriauMonde type="brick_pavement_02" couleur="#D8CBB6" echelle={1.6} relief={.5} rugosite={.9} /></mesh>
    <Boite p={[0, .06, -1.1]} s={[28, .12, .3]} c="#BDB6A8" />
    {[-12, -8, -4, 4, 10.5, 13].map(x => <group key={x}><Cyl p={[x, .3, -1.25]} r={.1} h={.4} c="#2B2B2E" metal={.4} /><Cyl p={[x, .52, -1.25]} r={.14} h={.06} c="#2B2B2E" metal={.4} /></group>)}
    {PONTONS.map(p => <Ponton key={p.x1} {...p} />)}
    {[[1.08, -5.6], [1.08, -6.8], [1.08, -8]].map(([x, z]) => <mesh key={z} position={[x, .02, z]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.18, .07, 8, 16]} /><meshStandardMaterial color="#1C1C1E" roughness={.9} /></mesh>)}
    {/* Portique de l'embarcadère, tourné vers la rue. */}
    {[-1.15, 1.15].map(x => <Cyl key={x} p={[x, 1.3, -.95]} r={.08} h={2.6} c="#6B4A33" />)}
    <Enseigne p={[0, 2.45, -.92]} largeur={2.6} hauteur={.5} fond="#2E6FB0" texte="EMBARCADÈRE · PIROGUES" couleur="#FFE7B0" taille={.15} />
    <PirogueBalade balade={balade} />
    {/* Autres pirogues : le long des pontons, une à terre sur ses tréteaux, un pêcheur au large. */}
    <group position={[-1.75, 0, -3.8]} rotation={[0, Math.PI, 0]}><Coque couleur="#C8392E" liston="#2E8B57" longueur={4.4} /></group>
    <group position={[9.2, 0, -3.8]} rotation={[0, Math.PI, 0]}><Coque couleur="#F4C430" liston="#2E6FB0" longueur={4.4} /></group>
    <group position={[-6, 0, -26]} rotation={[0, .8, 0]}><Coque couleur="#5A4632" liston="#C8392E" longueur={4.6} /><group position={[0, .06, -1.4]}><HumainMonde variante={3} /></group></group>
    <group position={[12, .55, 7.3]} rotation={[0, Math.PI / 2, 0]}><Coque couleur="#2E8B57" liston="#F2EEDF" longueur={3} /></group>
    {[11, 13].map(x => <Boite key={x} p={[x, .4, 7.3]} s={[.12, .8, 1.2]} c="#6B4A33" />)}
    <Cyl p={[12.9, .15, 8.3]} r={.14} h={.3} c="#2E6FB0" />
    {/* Terrasse : tables en bois sous de hautes paillotes, des clients face à la lagune. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {TABLES_MARINA.map(([x, z]) => <group key={`${x}${z}`}>
      <Boite p={[x, .74, z]} s={[.9, .05, .9]} c="#8B6A45" />
      {[[-.38, -.38], [.38, -.38], [-.38, .38], [.38, .38]].map(([dx, dz]) => <Boite key={`${dx}${dz}`} p={[x + dx, .36, z + dz]} s={[.05, .72, .05]} c="#5A3E2B" />)}
      <Cyl p={[x, 1.95, z]} r={.04} h={2.5} c="#6B4A33" />
      <mesh position={[x, 3.3, z]} castShadow><coneGeometry args={[.95, .7, 10]} /><meshStandardMaterial color="#C9A66B" roughness={1} /></mesh>
    </group>)}
    <Gens p={[-10, 0, 3.4]} assis variante={1} /><Gens p={[-10.62, 0, 6.6]} r={Math.PI / 2} assis variante={0} /><Gens p={[-7, 0, 7.22]} r={Math.PI} assis variante={4} />
    {[[-10, 3.72], [-10.3, 6.6], [-7, 6.3]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .78, z]} r={.15} h={.02} c="#FFFFFF" />)}
    {servi?.station === 'terrasse' && <PlatServi p={[-7, .77, 3.72]} article={servi.article} />}
    {/* Kiosque à cocos : comptoir au sud, toit de paille, cocos en tas ; le neveu du capitaine derrière. */}
    <Boite p={[7.5, .55, 4.1]} s={[3, 1.1, 1.6]} c="#8B6A45" /><Boite p={[7.5, 1.12, 4.6]} s={[3.1, .05, .8]} c="#6B4A33" />
    {[[6.1, 3.3], [8.9, 3.3], [6.1, 4.9], [8.9, 4.9]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, 1.4, z]} r={.05} h={2.8} c="#6B4A33" />)}
    <mesh position={[7.5, 3.05, 4.1]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.1, .9, 4]} /><meshStandardMaterial color="#C9A66B" roughness={1} /></mesh>
    <Fruits points={cocos} r={.13} c="#5E8C3A" />
    <Boite p={[8.3, 1.16, 4.75]} s={[.45, .02, .07]} c="#C9CDD0" metal={.7} />
    <Gens p={[7.6, 0, 3.6]} variante={2} />
    {servi?.station === 'kiosque' && <PlatServi p={[7.7, 1.14, 4.85]} article={servi.article} />}
    {/* Tarifs du capitaine, à côté de lui. */}
    <group position={[3.7, 0, -.6]}>
      {[-.4, .4].map(x => <Boite key={x} p={[x, .7, 0]} s={[.06, 1.4, .06]} c="#6B4A33" />)}
      <Boite p={[0, 1.35, .03]} s={[1.1, .7, .04]} c="#F2EEDF" />
      <Text position={[0, 1.55, .06]} fontSize={.09} color="#2E6FB0" anchorX="center" anchorY="middle">PIROGUE · LE TOUR</Text>
      <Text position={[0, 1.36, .06]} fontSize={.13} color="#1C1C1E" anchorX="center" anchorY="middle">2 000 F</Text>
      <Text position={[0, 1.17, .06]} fontSize={.07} color="#5A4632" anchorX="center" anchorY="middle">gilets fournis</Text>
    </group>
    <Cocotier p={[-13, 0, .4]} penche={.14} /><Cocotier p={[-12.8, 0, 8.6]} r={2} hauteur={6} /><Cocotier p={[13.2, 0, .6]} r={1} penche={-.1} /><Cocotier p={[13.4, 0, 4.6]} r={3} hauteur={4.8} />
  </>;
}

// ─── Complexe sportif ───

/** Les neuf autres joueurs du match : chacun court dans sa zone, les gardiens glissent devant leur but. */
const JOUEURS_MATCH: { centre: [number, number]; amplitude: [number, number]; vitesse: [number, number]; phase: number; variante: number; gardien?: boolean }[] = [
  { centre: [-8.1, -6], amplitude: [.25, 1.3], vitesse: [.9, 1.1], phase: 0, variante: 3, gardien: true },
  { centre: [-4.5, -4], amplitude: [2.4, 1.7], vitesse: [.95, 1.2], phase: 1, variante: 0 },
  { centre: [-3, -8], amplitude: [2.6, 1.4], vitesse: [1, 1.1], phase: 2.3, variante: 2 },
  { centre: [2.5, -5.5], amplitude: [3, 2.4], vitesse: [.8, 1], phase: 4, variante: 4 },
  { centre: [8.1, -6], amplitude: [.25, 1.3], vitesse: [.95, 1.05], phase: 1.5, variante: 1, gardien: true },
  { centre: [4.5, -8], amplitude: [2.4, 1.3], vitesse: [1, 1.15], phase: .7, variante: 3 },
  { centre: [4, -3.6], amplitude: [2.6, 1.2], vitesse: [.9, 1.3], phase: 3.1, variante: 0 },
  { centre: [-1.5, -6], amplitude: [3.2, 2.6], vitesse: [.75, .95], phase: 5.2, variante: 2 },
  { centre: [0, -7.5], amplitude: [3.6, 1.6], vitesse: [.85, .9], phase: 2, variante: 4 },
];
const placeJoueur = (j: (typeof JOUEURS_MATCH)[number], t: number): [number, number] =>
  [j.centre[0] + j.amplitude[0] * Math.sin(j.vitesse[0] * t + j.phase), j.centre[1] + j.amplitude[1] * Math.sin(j.vitesse[1] * t + j.phase * 1.7)];
/** Le ballon passe d'un joueur à l'autre, en cloche, toutes les 1,3 s. */
const PASSES = [1, 3, 7, 2, 8, 6, 3, 5, 1, 8, 2, 6, 7, 3];

function Match({ depuis }: { depuis: number }) {
  const joueurs = useRef<(THREE.Group | null)[]>([]);
  const ballon = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = (Date.now() - depuis) / 1000;
    JOUEURS_MATCH.forEach((j, i) => {
      const g = joueurs.current[i];
      if (!g) return;
      const [x, z] = placeJoueur(j, t);
      const vx = j.amplitude[0] * j.vitesse[0] * Math.cos(j.vitesse[0] * t + j.phase), vz = j.amplitude[1] * j.vitesse[1] * Math.cos(j.vitesse[1] * t + j.phase * 1.7);
      g.position.set(x, 0, z);
      if (Math.hypot(vx, vz) > .05) g.rotation.y = Math.atan2(vx, vz);
    });
    const n = Math.floor(t / 1.3), k = t / 1.3 - n;
    const de = placeJoueur(JOUEURS_MATCH[PASSES[n % PASSES.length]], t), vers = placeJoueur(JOUEURS_MATCH[PASSES[(n + 1) % PASSES.length]], t);
    ballon.current?.position.set(de[0] + (vers[0] - de[0]) * k, .11 + Math.sin(Math.PI * k) * .5, de[1] + (vers[1] - de[1]) * k);
  });
  return <>
    {JOUEURS_MATCH.map((j, i) => <group key={i} ref={g => { joueurs.current[i] = g; }} position={[j.centre[0], 0, j.centre[1]]}><HumainMonde marche allure={j.gardien ? 1.4 : 3.4} variante={j.variante} /></group>)}
    <mesh ref={ballon} castShadow><sphereGeometry args={[.11, 14, 10]} /><meshStandardMaterial color="#F4F4F0" roughness={.5} /></mesh>
  </>;
}

/** Une cage : poteaux, transversale et filet, ouverte vers le centre du terrain. */
function Cage({ cote }: { cote: number }) {
  const x = cote * 8.75;
  return <group>
    {[-7.5, -4.5].map(z => <Cyl key={z} p={[x, 1, z]} r={.05} h={2} c="#F4F4F0" />)}
    <Cyl p={[x, 2, -6]} r={.05} h={3} c="#F4F4F0" rot={[Math.PI / 2, 0, 0]} />
    <Verre p={[x + cote * .45, 1, -6]} s={[.02, 2, 3]} c="#FFFFFF" opacite={.28} />
    <Verre p={[x + cote * .22, 2, -6]} s={[.45, .02, 3]} c="#FFFFFF" opacite={.28} />
    {[-1, 1].map(s => <Verre key={s} p={[x + cote * .22, 1, -6 + s * 1.5]} s={[.45, 2, .02]} c="#FFFFFF" opacite={.28} />)}
  </group>;
}

export function DecorSport({ phase, depuisMatch, score, nuit, jusServi }: {
  phase: 'libre' | 'match' | 'tirs'; depuisMatch: number; score: [number, number];
  /** Le soir, les projecteurs éclairent le terrain. */
  nuit: boolean;
  /** Le jus commandé attend sur le comptoir de la buvette. */
  jusServi: boolean;
}) {
  const lignes = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    const trait = (x: number, z: number, lx: number, lz: number) => blocs.push({ position: [x, .012, z], taille: [lx, .004, lz], couleur: '#F4F4F0', rotation: 0 });
    trait(0, -10.5, 17.4, .08); trait(0, -1.5, 17.4, .08); trait(-8.7, -6, .08, 9); trait(8.7, -6, .08, 9); trait(0, -6, .08, 9);
    for (const cote of [-1, 1]) { trait(cote * 6.5, -6, .08, 5); trait(cote * 7.6, -8.5, 2.2, .08); trait(cote * 7.6, -3.5, 2.2, .08); trait(cote * 5.5, -6, .16, .16); }
    // Piste de footing : quatre bandes de tartan autour de l'aire est, ligne de départ.
    for (const [x, z, lx, lz] of [[10.3, -3.45, 1, 13.1], [14, -3.45, 1, 13.1], [12.15, -9.5, 4.7, 1], [12.15, 2.6, 4.7, 1]]) blocs.push({ position: [x, .006, z], taille: [lx, .01, lz], couleur: '#B4553C', rotation: 0 });
    blocs.push({ position: [10.3, .014, 1.2], taille: [1, .004, .08], couleur: '#F4F4F0', rotation: 0 });
    // Haltères rangés sur leur support.
    for (let k = 0; k < 6; k++) blocs.push({ position: [-13.3 + k * .45, .55, 2.4], taille: [.32, .1, .1], couleur: '#2B2B2E', rotation: 0 });
    return blocs;
  }, []);
  const poteaux = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let x = -9.3; x <= 9.31; x += 3.1) points.push([x, -10.9, 4]);
    for (let z = -7.8; z <= -1; z += 3.4) { points.push([-9.3, z, 3]); points.push([9.3, z, 3]); }
    for (const x of [-9.3, -5.3, -1.25, 1.25, 5.3, 9.3]) points.push([x, -1, 1.4]);
    return points;
  }, []);
  const tableau = phase === 'libre' ? 'COMPLEXE SPORTIF' : phase === 'match' ? `EQUIPE ${score[0]} - ${score[1]} DÉPÔT` : `TIRS AU BUT · ${score[0]} - ${score[1]}`;
  return <>
    <Sol largeur={30} profondeur={22} c="#C9C2B4" echelle={3} />
    {/* Terrain synthétique, lignes, cages, grillage (bas au sud pour qu'on voie le jeu). */}
    <Boite p={[0, .005, -6]} s={[18, .01, 9.6]} c="#3F8F4C" rugosite={.95} />
    <BlocsInstances blocs={lignes} interactif={false} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .013, -6]}><ringGeometry args={[1.45, 1.55, 40]} /><meshStandardMaterial color="#F4F4F0" /></mesh>
    <Cage cote={-1} /><Cage cote={1} />
    {poteaux.map(([x, z, h]) => <Cyl key={`${x}${z}`} p={[x, h / 2, z]} r={.05} h={h} c="#4A5A52" />)}
    <Verre p={[0, 2, -10.9]} s={[18.6, 4, .02]} c="#6E8C7A" opacite={.2} />
    {[-1, 1].map(cote => <Verre key={cote} p={[cote * 9.3, 1.5, -5.95]} s={[.02, 3, 9.9]} c="#6E8C7A" opacite={.2} />)}
    {[-1, 1].map(cote => <Verre key={`s${cote}`} p={[cote * 5.27, .7, -1]} s={[8.05, 1.4, .02]} c="#6E8C7A" opacite={.2} />)}
    {/* Tableau d'affichage au-dessus du grillage nord. */}
    <Boite p={[0, 4.9, -10.95]} s={[3.8, 1, .12]} c="#1C1C1E" />
    <Text position={[0, 4.9, -10.88]} fontSize={.3} color="#FFD54A" anchorX="center" anchorY="middle" maxWidth={3.6} textAlign="center">{tableau}</Text>
    {/* Projecteurs aux quatre coins. */}
    {[[-9.8, -11], [9.8, -11], [-9.8, -.6], [9.8, -.6]].map(([x, z]) => <group key={`${x}${z}`}>
      <Cyl p={[x, 3.75, z]} r={.1} h={7.5} c="#8E9499" metal={.5} />
      <Boite p={[x - Math.sign(x) * .3, 7.6, z + (z < -5 ? .3 : -.3)]} s={[.9, .45, .3]} c="#2B2B2E" emissif={nuit ? '#FFF6D8' : undefined} />
    </group>)}
    {nuit && <><pointLight position={[-5, 7, -6]} intensity={30} distance={26} decay={2} color="#FFF4DE" /><pointLight position={[5, 7, -6]} intensity={30} distance={26} decay={2} color="#FFF4DE" /></>}
    {phase === 'match' && <Match depuis={depuisMatch} />}
    {phase === 'libre' && <><Gens p={[-8.1, 0, -6]} r={Math.PI / 2} variante={3} /><Gens p={[-5.6, 0, -6]} r={-Math.PI / 2} variante={0} /><mesh position={[-5.98, .11, -6]} castShadow><sphereGeometry args={[.11, 14, 10]} /><meshStandardMaterial color="#F4F4F0" roughness={.5} /></mesh></>}
    {phase === 'tirs' && <>
      {[[-1.2, -4.9, 0], [-.4, -5.1, 2], [.4, -4.9, 4], [1.2, -5.1, 1]].map(([x, z, v]) => <Gens key={x} p={[x, 0, z]} r={Math.PI / 2} variante={v} />)}
      <Gens p={[8.35, 0, -6]} r={-Math.PI / 2} variante={1} />
      <mesh position={[5.5, .11, -6]} castShadow><sphereGeometry args={[.11, 14, 10]} /><meshStandardMaterial color="#F4F4F0" roughness={.5} /></mesh>
    </>}
    {[[-6.5, -1.9], [-3.5, -1.9], [3.5, -1.9], [6.5, -1.9]].map(([x, z]) => <Cyl key={x} p={[x, .15, z]} r={.12} haut={.02} h={.3} c="#F07F2E" />)}
    {/* Aire de musculation en plein air : sol souple, banc, rack, barre de traction. */}
    <Boite p={[-12.2, .01, 5]} s={[4.4, .02, 6]} c="#3A3D40" rugosite={1} />
    <Boite p={[-11.75, .44, 5]} s={[1.2, .08, .34]} c="#2B2B2E" />
    {[-12.25, -11.25].map(x => <Boite key={x} p={[x, .2, 5]} s={[.06, .4, .3]} c="#5A5F63" />)}
    {[4.6, 5.4].map(z => <Boite key={z} p={[-12.6, .6, z]} s={[.06, 1.2, .06]} c="#5A5F63" metal={.4} />)}
    <Cyl p={[-12.6, 1.1, 5]} r={.02} h={1.8} c="#C9CDD0" metal={.8} rot={[Math.PI / 2, 0, 0]} />
    {[-1, 1].map(s => <Cyl key={s} p={[-12.6, 1.1, 5 + s * .72]} r={.22} h={.05} c="#1C1C1E" rot={[Math.PI / 2, 0, 0]} />)}
    <Boite p={[-12.2, .45, 2.4]} s={[3, .08, .5]} c="#5A5F63" />
    {[3.4, 6.6].map(z => <Cyl key={z} p={[-14, 1.3, z]} r={.05} h={2.6} c="#5A5F63" metal={.4} />)}
    <Cyl p={[-14, 2.5, 5]} r={.03} h={3.2} c="#C9CDD0" metal={.8} rot={[Math.PI / 2, 0, 0]} />
    <Gens p={[-13.3, 0, 7.4]} r={Math.PI / 2} variante={0} />
    <group position={[-12.2, 0, 1.95]}>{[-1, 1].map(s => <Cyl key={s} p={[s * 1.2, 1.2, 0]} r={.04} h={2.4} c="#5A5F63" />)}<Enseigne p={[0, 2.25, .03]} largeur={2.6} hauteur={.45} fond="#1C1C1E" texte="MUSCULATION" couleur="#F07F2E" taille={.2} /></group>
    {/* Buvette : comptoir au sud, tabourets bas, toit court pour ne pas cacher la vendeuse. */}
    <Boite p={[11.5, 1.4, 4.1]} s={[5, 2.8, .15]} c="#F2EDE2" />
    {[-1, 1].map(s => <Boite key={s} p={[11.5 + s * 2.43, 1.4, 5.55]} s={[.15, 2.8, 2.9]} c="#F2EDE2" />)}
    <Boite p={[11.5, 2.85, 5.45]} s={[5.3, .1, 3.1]} c="#2E6FB0" />
    <Enseigne p={[11.5, 3.2, 7.02]} largeur={2.4} hauteur={.5} fond="#F07F2E" texte="BUVETTE" taille={.24} />
    <Boite p={[11.5, .55, 7.05]} s={[4.6, 1.1, .4]} c="#2E6FB0" /><Boite p={[11.5, 1.13, 7.08]} s={[4.8, .05, .55]} c="#E8E2D6" />
    <Boite p={[13.2, 1, 4.6]} s={[1, 2, .7]} c="#E8ECEE" /><Boite p={[13.2, 1.05, 4.96]} s={[.85, 1.6, .02]} c="#9FC6D6" emissif="#4F7F94" />
    {Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[10 + i * .25, 1.24, 6.95]} r={.04} h={.18} c={i % 2 ? '#F2A23A' : '#E9D58A'} />)}
    {[10.5, 11.5, 12.5].map(x => <group key={x}><Cyl p={[x, .42, 7.55]} r={.17} h={.04} c="#C8392E" /><Cyl p={[x, .2, 7.55]} r={.03} h={.4} c="#5A5F63" /></group>)}
    <Gens p={[11.5, 0, 6.4]} variante={1} />
    {jusServi && <Cyl p={[11.5, 1.23, 7.2]} r={.045} h={.16} c="#F2A23A" />}
    {/* Tribune basse face au terrain, et le tableau du coach. */}
    <Boite p={[0, .22, 8]} s={[6, .44, .8]} c="#B9B2A4" />
    <Gens p={[-1.6, 0, 8.05]} r={Math.PI} assis variante={2} /><Gens p={[.4, 0, 8.05]} r={Math.PI} assis variante={1} /><Gens p={[2.1, 0, 8.05]} r={Math.PI} assis variante={3} />
    <group position={[4.5, 0, 1.6]}>
      {[-.55, .55].map(x => <Boite key={x} p={[x, .8, 0]} s={[.05, 1.6, .05]} c="#5A5F63" />)}
      <Boite p={[0, 1.55, .03]} s={[1.5, 1, .04]} c="#F7F7F2" />
      <Text position={[0, 1.93, .06]} fontSize={.09} color="#2E6FB0" anchorX="center" anchorY="middle">PROGRAMME DU JOUR</Text>
      {ARTICLES_SPORT.map((a, i) => <Text key={a.id} position={[0, 1.74 - i * .16, .06]} fontSize={.075} color="#1C1C1E" anchorX="center" anchorY="middle">{`${a.nom} · ${a.prix.toLocaleString('fr-FR')} F`}</Text>)}
    </group>
  </>;
}

// ─── Centre commercial Azur ───

const COMPTOIRS_AZUR: { x: number; nom: string; couleur: string; article: string }[] = [
  { x: 4.5, nom: 'SHAWARMA', couleur: '#C8392E', article: 'shawarma' }, { x: 7, nom: 'JUS FRAIS', couleur: '#E8772E', article: 'cocktail-fruits' }, { x: 9.5, nom: 'GLACES', couleur: '#2E8FB0', article: 'glace' },
];

/** Un escalier mécanique incliné vers le nord, rampes noires, côtés vitrés. */
function Escalator({ x }: { x: number }) {
  const angle = Math.atan2(3.8, 4.4), longueur = Math.hypot(3.8, 4.4);
  return <group position={[x, 1.9, -6.8]} rotation={[angle, 0, 0]}>
    <mesh castShadow receiveShadow><boxGeometry args={[1.2, .3, longueur]} /><meshStandardMaterial color="#9AA0A6" metalness={.6} roughness={.35} /></mesh>
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[s * .6, .55, 0]} userData={{ sansOcclusion: true }}><boxGeometry args={[.03, .8, longueur]} /><meshPhysicalMaterial color="#CFE3EA" transparent opacity={.25} depthWrite={false} /></mesh>
      <mesh position={[s * .6, .97, 0]}><boxGeometry args={[.08, .06, longueur]} /><meshStandardMaterial color="#1C1C1E" roughness={.5} /></mesh>
    </group>)}
  </group>;
}

export function DecorAzur({ servi }: { servi: ArticleCarte | null }) {
  const mobilier = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    for (const [x, z] of TABLES_AZUR) for (const [dx, dz, a] of QUATRE_PLACES) chaisePlastique(blocs, x + dx, z + dz, a, '#E8772E');
    // Portants de la Boutique Lagune : chemises, robes en pagne, gilets haute visibilité.
    const tissus = ['#E8E23A', '#F07F2E', '#2E6FB0', '#C8392E', '#F4F4F0', '#3E8E5A', '#7A2E6E', '#1C1C1E'];
    for (const [z, x0] of [[-7, -12], [-6, -12]] as [number, number][]) for (let k = 0; k < 24; k++) blocs.push({ position: [x0 + k * .24, 1.2, z], taille: [.05, .95, .5], couleur: tissus[(k * 3 + (z === -6 ? 1 : 0)) % tissus.length], rotation: 0 });
    // Casques et chaussures de sécurité sur l'étagère du fond.
    for (let k = 0; k < 10; k++) blocs.push({ position: [-12.2 + k * .6, .3, -8.75], taille: [.34, .14, .26], couleur: '#2B2B2E', rotation: 0 });
    return blocs;
  }, []);
  return <>
    <SolCarrele largeur={26} profondeur={18} c="#ECEAE4" joint="#D6D1C6" pas={1.2} />
    <MursCoupe hx={13} hz={9} hauteur={5.2} c="#F1EEE8" porte={4} />
    {/* Fond : escaliers mécaniques vers le niveau 1, grande enseigne. */}
    <Escalator x={-1.3} /><Escalator x={.5} />
    <Boite p={[-.4, 4.4, -9.02]} s={[3.6, 1.6, .02]} c="#2A2F33" />
    <Enseigne p={[-.4, 4.85, -8.98]} largeur={4.2} hauteur={.55} fond="#1F4E5F" texte="NIVEAU 1 · CINÉMA · RESTAURANTS" taille={.18} />
    <Text position={[6.5, 4.5, -8.98]} fontSize={.42} color="#1F4E5F" anchorX="center" anchorY="middle" letterSpacing={.06}>CENTRE COMMERCIAL AZUR</Text>
    {/* Espace restauration : trois comptoirs, leurs menus lumineux, Mireille au milieu. */}
    <Boite p={[7, 1.6, -8.98]} s={[8, 3.2, .02]} c="#2F4F5F" />
    {COMPTOIRS_AZUR.map(c => {
      const article = ARTICLES_AZUR.find(a => a.id === c.article)!;
      return <group key={c.x}>
        <Boite p={[c.x, .52, -6.85]} s={[2.4, 1.05, 1.1]} c={c.couleur} /><Boite p={[c.x, 1.07, -6.75]} s={[2.5, .05, 1.3]} c="#E8E2D6" />
        <Boite p={[c.x, 2.9, -7.5]} s={[2.2, .8, .06]} c="#1C1C1E" emissif="#2A2A2A" />
        <Text position={[c.x, 3.08, -7.46]} fontSize={.22} color="#FFE7B0" anchorX="center" anchorY="middle">{c.nom}</Text>
        <Text position={[c.x, 2.76, -7.46]} fontSize={.1} color="#F4F1EA" anchorX="center" anchorY="middle">{`${article.nom} · ${article.prix.toLocaleString('fr-FR')} F`}</Text>
      </group>;
    })}
    <Cyl p={[3.9, 1.5, -7.25]} r={.17} haut={.1} h={.7} c="#9C5A2C" /><Boite p={[3.9, 1.5, -7.55]} s={[.5, .8, .05]} c="#3A1A08" emissif="#D9541A" />
    <Cyl p={[6.4, 1.25, -6.9]} r={.09} h={.32} c="#E6F1F4" /><Fruits points={pyramide(7.6, 1.1, -6.8, 3, .07)} r={.07} c="#F2A23A" />
    <Verre p={[9.5, 1.3, -6.75]} s={[2, .4, .9]} c="#E6F1F4" opacite={.3} />
    {['#F4E3C3', '#F2A23A', '#7A3A1E', '#C8392E', '#E9EEF0'].map((c, i) => <Boite key={c} p={[8.8 + i * .35, 1.16, -6.75]} s={[.28, .1, .5]} c={c} />)}
    <Gens p={[4.4, 0, -7.35]} variante={0} /><Gens p={[9.6, 0, -7.35]} variante={1} />
    {/* Tables de l'espace restauration ; des familles déjà installées. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {TABLES_AZUR.map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .74, z]} r={.5} h={.04} c="#F4F4F0" /><Cyl p={[x, .37, z]} r={.05} h={.72} c="#9AA0A6" metal={.6} /><Cyl p={[x, .02, z]} r={.28} h={.04} c="#9AA0A6" metal={.6} /></group>)}
    <Gens p={[2, 0, -1.62]} assis variante={1} /><Gens p={[2.62, 0, -1]} r={-Math.PI / 2} assis variante={0} /><Gens p={[6.62, 0, -1]} r={-Math.PI / 2} assis variante={3} /><Gens p={[2, 0, 3.12]} r={Math.PI} assis variante={4} />
    {[[2, -1.25], [2.3, -.9], [6.3, -1], [2, 2.8]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .77, z]} r={.14} h={.02} c="#FFFFFF" />)}
    {servi && <PlatServi p={[6, .77, 2.32]} article={servi} />}
    {/* Boutique Lagune : portants, mannequin casqué, étagère d'EPI, enseigne. */}
    {[-7, -6].map(z => <group key={z}>{[-12.1, -6.5].map(x => <Boite key={x} p={[x, .85, z]} s={[.05, 1.7, .05]} c="#9AA0A6" />)}<Cyl p={[-9.3, 1.7, z]} r={.02} h={5.6} c="#C9CDD0" metal={.8} rot={[0, 0, Math.PI / 2]} /></group>)}
    <Boite p={[-9.2, 1.5, -8.82]} s={[6.4, .05, .4]} c="#E8E2D6" /><Boite p={[-9.2, .2, -8.82]} s={[6.4, .05, .4]} c="#E8E2D6" />
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-12 + i * .8, 1.53, -8.8]} castShadow><sphereGeometry args={[.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={['#F4C430', '#F4F4F0', '#2E6FB0', '#F07F2E'][i % 4]} roughness={.45} /></mesh>)}
    <Enseigne p={[-9.2, 3.4, -8.98]} largeur={5.6} hauteur={.7} fond="#1F4E5F" texte="BOUTIQUE LAGUNE · TENUES ET EPI" taille={.26} />
    <Cyl p={[-6.6, .05, -6.5]} r={.35} h={.1} c="#E8E2D6" /><group position={[-6.6, .1, -6.5]}><HumainMonde casque variante={0} /></group>
    {/* Cabine d'essayage : rideau rouge à moitié tiré, miroir, tabouret. */}
    <Boite p={[-12.35, 1.15, .3]} s={[.1, 2.3, 2.6]} c="#E8E2D6" />
    {[-.95, 1.55].map(z => <Boite key={z} p={[-11.4, 1.15, z]} s={[2, 2.3, .1]} c="#E8E2D6" />)}
    <Boite p={[-10.45, 1.2, -.35]} s={[.04, 2.1, 1.2]} c="#B8322A" rugosite={.95} />
    <Boite p={[-11.4, 2.33, .3]} s={[2, .05, 2.6]} c="#C9CDD0" metal={.5} />
    <Boite p={[-12.28, 1.3, .3]} s={[.02, 1.6, .7]} c="#DDEAF0" metal={.9} rugosite={.05} />
    <Cyl p={[-11.6, .22, .5]} r={.18} h={.44} c="#7A5A3A" />
    <Text position={[-11.4, 2.05, 1.62]} fontSize={.14} color="#1F4E5F" anchorX="center" anchorY="middle">CABINE</Text>
    {/* Opticien à l'est, pharmacie à l'ouest ; plantes et plafonniers. */}
    <Boite p={[12.2, .5, 4]} s={[1.5, 1, 3.9]} c="#2B2B2E" /><Verre p={[12.2, 1.35, 4]} s={[1.45, .7, 3.85]} c="#E6F1F4" opacite={.25} />
    {Array.from({ length: 8 }, (_, i) => <Boite key={i} p={[12.1, 1.05 + (i % 2) * .3, 2.6 + Math.floor(i / 2) * .9]} s={[.12, .05, .3]} c="#1C1C1E" />)}
    <Enseigne p={[12.98, 3, 4]} r={-Math.PI / 2} largeur={3} hauteur={.6} fond="#F4F4F0" texte="OPTIQUE AZUR" couleur="#1F4E5F" taille={.26} />
    <group position={[-12.95, 3, 5.5]}><Boite p={[0, 0, 0]} s={[.05, .6, .2]} c="#2E9E4A" emissif="#3ECF5A" /><Boite p={[0, 0, 0]} s={[.05, .2, .6]} c="#2E9E4A" emissif="#3ECF5A" /></group>
    <Enseigne p={[-12.98, 2.2, 5.5]} r={Math.PI / 2} largeur={2.6} hauteur={.5} fond="#2E9E4A" texte="PHARMACIE" taille={.22} />
    <Verre p={[-12.95, 1.1, 5.5]} s={[.04, 2.1, 1.8]} c="#CFE3EA" opacite={.2} />
    <Plante p={[-12.2, 0, 8.2]} /><Plante p={[12.2, 0, 8.2]} /><Plante p={[-12.2, 0, -4.4]} />
    <Gens p={[-3.5, 0, 2.4]} r={Math.PI} variante={4} /><Gens p={[-7.8, 0, 6.6]} r={1} variante={2} /><Gens p={[10, 0, 6.8]} r={-2.4} variante={0} />
    <Plafonniers points={[[-8, 5, -3], [-2, 5, -3], [4, 5, -3], [10, 5, -3], [-8, 5, 4], [-2, 5, 4], [4, 5, 4], [10, 5, 4]]} couleur="#F4F7FF" />
  </>;
}

// ─── Galerie des Palmiers ───

export function DecorGalerie({ recompenses, pret }: {
  /** Badges et certificats du joueur, exposés dans la vitrine (douze au plus). */
  recompenses: number;
  /** Ce qui est prêt à une boutique : la tenue au pressing, le téléphone rechargé, la pâtisserie. */
  pret: { boutique: BoutiqueGalerie; article: ArticleCarte } | null;
}) {
  const trophees = useMemo(() => Array.from({ length: Math.min(12, recompenses) }, (_, i) => ({ type: i % 3, x: -1.15 + (i % 6) * .46, y: i < 6 ? 1.02 : 1.52 })), [recompenses]);
  const etalages = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    // Vêtements sous housse au pressing, viennoiseries dans la vitrine de la pâtisserie.
    const tissus = ['#2E6FB0', '#F4F4F0', '#1C1C1E', '#C8392E', '#3E8E5A', '#E8E23A'];
    for (let k = 0; k < 15; k++) blocs.push({ position: [5.6 + k * .33, 1.42, -7.5], taille: [.08, 1.1, .55], couleur: tissus[k % tissus.length], rotation: 0 });
    const gateaux = ['#D9A55B', '#C8392E', '#7A3A1E', '#F4E3C3'];
    for (let rang = 0; rang < 2; rang++) for (let k = 0; k < 8; k++) blocs.push({ position: [8.85, 1.0 + rang * .22, -1.3 + k * .36], taille: [.22, .07, .14], couleur: gateaux[(k + rang) % gateaux.length], rotation: 0 });
    return blocs;
  }, []);
  return <>
    <SolCarrele largeur={22} profondeur={16} c="#E8E1D3" joint="#CFC3AE" pas={.6} />
    <MursCoupe hx={11} hz={8} hauteur={4.2} c="#EFE7D8" porte={3} />
    {/* Salon de coiffure : miroirs au mur, trois fauteuils tournés vers la galerie, Serge aux ciseaux. */}
    <Enseigne p={[-7.8, 3.3, -7.98]} largeur={5} hauteur={.6} fond="#1C1C1E" texte="SALON ÉLÉGANCE · COIFFURE" couleur="#E9C46A" taille={.26} />
    {[-9.6, -8, -6.4].map(x => <group key={x}>
      <Boite p={[x, 1.55, -7.9]} s={[1.1, 1.3, .03]} c="#D9E6EC" metal={.9} rugosite={.05} />
      <Boite p={[x, 1, -7.75]} s={[1.2, .05, .3]} c="#F4F4F0" />
      {[-.3, 0, .3].map(dx => <Cyl key={dx} p={[x + dx, 1.1, -7.75]} r={.04} h={.16} c={dx ? '#2E6FB0' : '#E8E23A'} />)}
      <Cyl p={[x, .12, -6.3]} r={.25} h={.24} c="#C9CDD0" metal={.7} />
      <Boite p={[x, .44, -6.3]} s={[.55, .12, .55]} c="#7A1F1F" /><Boite p={[x, .8, -6.58]} s={[.55, .6, .1]} c="#7A1F1F" />
      {[-1, 1].map(s => <Boite key={s} p={[x + s * .3, .62, -6.3]} s={[.06, .06, .5]} c="#2B2B2E" />)}
      <Boite p={[x, .15, -5.95]} s={[.4, .04, .2]} c="#9AA0A6" metal={.6} />
    </group>)}
    <Gens p={[-9.6, 0, -6.3]} assis variante={2} /><Gens p={[-9, 0, -6.75]} r={-.6} variante={0} />
    <Gens p={[-7.35, 0, -6.8]} r={-.6} variante={3} />
    {['#C8392E', '#F4F4F0', '#2E6FB0', '#C8392E', '#F4F4F0', '#2E6FB0'].map((c, i) => <Cyl key={i} p={[-5.2, .98 + i * .15, -5.6]} r={.08} h={.15} c={c} />)}
    {/* Pressing : comptoir, vêtements sous housse, presse à vapeur ; Tantie Odile. */}
    <Enseigne p={[7.8, 3.3, -7.98]} largeur={5} hauteur={.6} fond="#2E6F8E" texte="PRESSING DU PLATEAU" taille={.28} />
    <Boite p={[7.8, .52, -6.35]} s={[5.4, 1.05, .6]} c="#2E6F8E" /><Boite p={[7.8, 1.07, -6.35]} s={[5.5, .05, .75]} c="#F4F4F0" />
    <Cyl p={[7.8, 2, -7.5]} r={.02} h={5} c="#C9CDD0" metal={.8} rot={[0, 0, Math.PI / 2]} />
    <Verre p={[7.8, 1.42, -7.5]} s={[5, 1.15, .6]} c="#F4F4F8" opacite={.35} />
    <Boite p={[10, 1.2, -7.05]} s={[.8, .35, .5]} c="#C9CDD0" metal={.5} /><Boite p={[10, .5, -7.05]} s={[.7, 1, .45]} c="#8E9499" />
    <Gens p={[7, 0, -7]} variante={1} />
    {pret?.boutique === 'pressing' && <><Boite p={[7.8, 1.2, -6.3]} s={[.6, .18, .42]} c="#F4F4F8" /><Boite p={[7.8, 1.32, -6.3]} s={[.5, .06, .36]} c="#2E6FB0" /></>}
    {/* Téléphonie : comptoir jaune, téléphones en démonstration ; Kévin. */}
    <Boite p={[-9.35, .52, 0]} s={[.9, 1.05, 3.1]} c="#F4C430" /><Boite p={[-9.3, 1.07, 0]} s={[1, .05, 3.2]} c="#2B2B2E" />
    {[-1, -.4, .2].map(z => <Boite key={z} p={[-9.2, 1.11, z]} s={[.09, .02, .17]} c="#1C1C1E" emissif="#3E6F8E" />)}
    {pret?.boutique === 'telephonie' && <Boite p={[-8.95, 1.11, .7]} s={[.09, .02, .17]} c="#1C1C1E" emissif="#5ED0FF" />}
    <Boite p={[-10.85, 1.5, 0]} s={[.1, 1.4, 2.4]} c="#E8E2D6" />
    <Enseigne p={[-10.97, 2.7, 0]} r={Math.PI / 2} largeur={3} hauteur={.7} fond="#F4C430" texte="TÉLÉPHONIE · TRANSFERT" couleur="#1C1C1E" taille={.24} />
    <Gens p={[-10.2, 0, 0]} r={Math.PI / 2} variante={0} />
    {/* Pâtisserie de Madame Brou : vitrine réfrigérée, machine à café, gâteau du jour. */}
    <Boite p={[8.9, .45, 0]} s={[.6, .9, 3]} c="#8B6A45" /><Verre p={[8.9, 1.15, 0]} s={[.58, .5, 2.9]} c="#E6F1F4" opacite={.25} />
    <BlocsInstances blocs={etalages} interactif={false} />
    <Boite p={[10.55, .52, 0]} s={[.6, 1.05, 3]} c="#6B4A33" />
    <Boite p={[10.55, 1.33, -.6]} s={[.55, .55, .45]} c="#C9CDD0" metal={.7} /><Cyl p={[10.55, 1.2, .7]} r={.2} h={.18} c="#F4E3C3" />
    <Enseigne p={[10.97, 2.9, 0]} r={-Math.PI / 2} largeur={3.2} hauteur={.7} fond="#7A2E26" texte="PÂTISSERIE DES PALMIERS" couleur="#F4E3C3" taille={.22} />
    {pret?.boutique === 'patisserie' && <PlatServi p={[8.9, 1.42, .3]} article={pret.article} />}
    {/* Vitrine des réussites, au centre de la galerie : tes vrais badges et certificats. */}
    <Boite p={[0, .45, -1.25]} s={[2.9, .9, 1.4]} c="#5A3E2B" />
    <Verre p={[0, 1.45, -1.25]} s={[2.85, 1.1, 1.35]} c="#E6F1F4" opacite={.2} />
    <Boite p={[0, 1.45, -1.25]} s={[2.8, .02, 1.3]} c="#DDEAF0" />
    {trophees.map((t, i) => <group key={i} position={[t.x, t.y, -1.25]}>
      {t.type === 0 && <><Cyl p={[0, .14, 0]} r={.1} h={.02} c="#D4AF37" metal={.8} rot={[Math.PI / 2, 0, 0]} /><Boite p={[0, .3, 0]} s={[.06, .2, .01]} c="#2E6FB0" /></>}
      {t.type === 1 && <><Cyl p={[0, .05, 0]} r={.07} h={.04} c="#5A3E2B" /><Cyl p={[0, .14, 0]} r={.02} h={.14} c="#D4AF37" metal={.8} /><Cyl p={[0, .3, 0]} r={.05} haut={.1} h={.18} c="#D4AF37" metal={.8} /></>}
      {t.type === 2 && <><Boite p={[0, .17, -.01]} s={[.34, .26, .015]} c="#8B6A45" /><Boite p={[0, .17, 0]} s={[.3, .22, .01]} c="#F7F4EC" /></>}
    </group>)}
    {!recompenses && <Text position={[0, 1.2, -.55]} fontSize={.1} color="#5A3E2B" anchorX="center" anchorY="middle">TA PREMIÈRE RÉUSSITE ICI</Text>}
    {[-1.2, 1.2].map(x => <Boite key={x} p={[x, 3.65, -1.25]} s={[.01, 1.1, .01]} c="#2B2B2E" />)}
    <Enseigne p={[0, 3.05, -1.25]} largeur={3.2} hauteur={.55} fond="#2F4F5F" texte="VITRINE DES RÉUSSITES" couleur="#E9C46A" taille={.24} />
    <pointLight position={[0, 2.6, -.4]} intensity={3} distance={5} decay={2} color="#FFE7B0" />
    {/* Banc, enseignes des autres boutiques, plantes, plafonniers. */}
    <Boite p={[-3, .44, 4.7]} s={[2, .06, .45]} c="#8B6A45" />{[-3.9, -2.1].map(x => <Boite key={x} p={[x, .21, 4.7]} s={[.08, .42, .4]} c="#5A3E2B" />)}
    <Gens p={[-2.6, 0, 4.7]} assis variante={4} />
    <Enseigne p={[-10.97, 2.4, 5]} r={Math.PI / 2} largeur={2.4} hauteur={.5} fond="#D4AF37" texte="BIJOUTERIE" couleur="#1C1C1E" taille={.2} />
    <Verre p={[-10.95, 1.1, 5]} s={[.04, 1.6, 2]} c="#CFE3EA" opacite={.2} />
    <Enseigne p={[10.97, 2.4, 5]} r={-Math.PI / 2} largeur={2.4} hauteur={.5} fond="#3E8E5A" texte="LIBRAIRIE" taille={.2} />
    <Verre p={[10.95, 1.1, 5]} s={[.04, 1.6, 2]} c="#CFE3EA" opacite={.2} />
    <Plante p={[-10.3, 0, 7.3]} /><Plante p={[10.3, 0, 7.3]} />
    <Plafonniers points={[[-7, 4, -3], [0, 4, -3], [7, 4, -3], [-7, 4, 3], [0, 4, 3], [7, 4, 3]]} />
  </>;
}
