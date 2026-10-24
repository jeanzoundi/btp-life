'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import type { ArticleCarte } from '@/lib/lieux-vie';
import { ARTICLES_CAFE, TABLES_CAFE } from '@/lib/lieux-vie/cafe';
import { ARTICLES_MAQUIS, TABLE_COLLEGUES, TABLES_MAQUIS } from '@/lib/lieux-vie/maquis';
import type { Professionnel } from '@/lib/lieux-vie/cafe';
import type { Point } from '@/lib/navigation-plan';
import { RANGEES_AMPHI } from '@/lib/universite';
import { BlocsInstances } from './blocs-instances';
import { Boite, Cyl, Enseigne, Mur, MursCoupe, Plafonniers, Sol, SolCarrele, Verre } from './decors-lieux';
import { HumainMonde } from './humain-monde';
import { MateriauMonde } from './materiaux-monde';

// Décors des lieux de vie. La caméra regarde depuis le sud-sud-est : enseignes, ardoises et écrans sont tournés vers
// le sud, et rien de ce qu'il faut voir n'est caché sous un toit (l'auvent du maquis reste étroit et haut).

/** Un habitant du lieu : client attablé, braiseur, ouvrier qui a posé son casque. */
export function Gens({ p, r = 0, assis = false, casque = false, prof = false, variante = 0 }: { p: V3; r?: number; assis?: boolean; casque?: boolean; prof?: boolean; variante?: number }) {
  return <group position={p} rotation={[0, r, 0]}><HumainMonde assis={assis} casque={casque} sansCasque={casque} prof={prof} variante={variante} /></group>;
}

/** Fait pivoter un décalage local autour d'un siège tourné de `a` (même convention que les personnages). */
const pivoter = (dx: number, dz: number, a: number): Point => [dx * Math.cos(a) + dz * Math.sin(a), -dx * Math.sin(a) + dz * Math.cos(a)];

/** Chaise en plastique moulé, en blocs : assise, dossier derrière le convive, quatre pieds. */
export function chaisePlastique(blocs: BlocArchitecture[], x: number, z: number, a: number, couleur: string) {
  const bloc = (dx: number, y: number, dz: number, taille: V3) => { const [ox, oz] = pivoter(dx, dz, a); blocs.push({ position: [x + ox, y, z + oz], taille, couleur, rotation: a }); };
  bloc(0, .44, 0, [.44, .04, .42]); bloc(0, .7, -.2, [.44, .44, .04]);
  for (const [lx, lz] of [[-.19, -.18], [.19, -.18], [-.19, .18], [.19, .18]]) bloc(lx, .21, lz, [.04, .42, .04]);
}
/** Les quatre chaises autour d'une table carrée, tournées vers elle. */
export const QUATRE_PLACES: [number, number, number][] = [[0, -.62, 0], [0, .62, Math.PI], [-.62, 0, Math.PI / 2], [.62, 0, -Math.PI / 2]];

/** Assiette servie : la couleur du plat dit ce qu'on mange (attiéké blanc, alloco doré, foutou jaune…). */
const COULEURS_PLATS: Record<string, [string, string]> = {
  garba: ['#F2EEDF', '#B8742E'], 'alloco-poisson': ['#E0A23A', '#9C5A2C'], 'attieke-carpe': ['#F2EEDF', '#8E5A34'], 'foutou-graine': ['#E8D07A', '#7A3A1E'],
  'poulet-braise': ['#F2EEDF', '#A0522D'], 'cafe-croissant': ['#D9A55B', '#3B2416'],
  mangues: ['#F2EEDF', '#F2A23A'], ananas: ['#F2EEDF', '#F4D35E'], 'banane-braisee': ['#E0A23A', '#8E5A34'], choukouya: ['#E9DFC8', '#7A3A1E'], 'panier-fruits': ['#C49A64', '#E86A2E'],
  'brochettes-crevettes': ['#F2EEDF', '#E8774A'], shawarma: ['#E8D9B5', '#9C5A2C'], glace: ['#F4E3C3', '#F2A23A'], patisserie: ['#D9A55B', '#8E5A34'],
};
/** Boisson posée à côté : jus, bouteille, ou noix de coco percée d'une paille. */
const COULEURS_BOISSONS: Record<string, string> = { gingembre: '#E9D58A', bissap: '#8E1B3A', 'jus-passion': '#8E1B3A', 'cocktail-fruits': '#F2A23A', 'jus-buvette': '#F2A23A' };
export function PlatServi({ p, article }: { p: V3; article: ArticleCarte }) {
  const [base, garniture] = COULEURS_PLATS[article.id] ?? ['#F2EEDF', '#C8392E'];
  return <group position={p}>
    {article.categorie === 'plat' && <><Cyl p={[0, .01, 0]} r={.17} h={.02} c="#FFFFFF" /><Cyl p={[-.04, .04, 0]} r={.09} h={.05} c={base} /><Boite p={[.06, .045, .02]} s={[.12, .04, .07]} c={garniture} /></>}
    {article.id === 'coco'
      ? <><mesh position={[.2, .14, -.06]} castShadow><sphereGeometry args={[.14, 12, 10]} /><meshStandardMaterial color="#5E8C3A" roughness={.7} /></mesh><Cyl p={[.24, .32, -.06]} r={.01} h={.18} c="#F4F1EA" /></>
      : <Cyl p={[.24, .07, -.08]} r={.04} h={.14} c={COULEURS_BOISSONS[article.id] ?? '#3B2416'} />}
  </group>;
}

/** Fumée de la braisière : des bouffées qui montent et s'effacent, plus denses quand un plat est en cuisson. */
export function Fumee({ p, dense }: { p: V3; dense: boolean }) {
  const groupe = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    groupe.current?.children.forEach((enfant, i) => {
      const t = (clock.elapsedTime * (dense ? .45 : .3) + i / 6) % 1;
      enfant.position.set(Math.sin(i * 2.1 + t * 3) * .25, t * 2.6, Math.cos(i * 1.7) * .15);
      enfant.scale.setScalar(.25 + t * .9);
      ((enfant as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = (1 - t) * (dense ? .45 : .25);
    });
  });
  return <group ref={groupe} position={p}>{Array.from({ length: 6 }, (_, i) => <mesh key={i} userData={{ sansOcclusion: true }}><sphereGeometry args={[.35, 10, 8]} /><meshStandardMaterial color="#DDD8D0" transparent opacity={.3} depthWrite={false} /></mesh>)}</group>;
}

/** Guirlande d'ampoules tendue au-dessus de la cour : elle s'allume franchement le soir. */
function Guirlande({ z, nuit }: { z: number; nuit: boolean }) {
  return <group>
    <Boite p={[0, 3, z]} s={[23.6, .015, .015]} c="#2B2B2E" />
    {Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[-11.25 + i * 1.5, 2.88, z]}><sphereGeometry args={[.07, 8, 6]} /><meshStandardMaterial color="#FFE7B0" emissive="#FFC860" emissiveIntensity={nuit ? 2.4 : .5} /></mesh>)}
  </group>;
}

export function DecorMaquis({ nuit, collegues, servi, enCuisine }: {
  /** Le soir, la guirlande et deux lampes éclairent la cour. */
  nuit: boolean; collegues: boolean;
  /** Plat posé sur une table, en attendant d'être mangé. */
  servi: { station: 'table' | 'collegues'; article: ArticleCarte } | null;
  /** Une commande est en préparation : la braisière fume davantage. */
  enCuisine: boolean;
}) {
  const mobilier = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    TABLES_MAQUIS.forEach(([x, z], k) => {
      blocs.push({ position: [x, .72, z], taille: [.84, .04, .84], couleur: '#F2F0EA', rotation: 0 });
      for (const [lx, lz] of [[-.36, -.36], [.36, -.36], [-.36, .36], [.36, .36]]) blocs.push({ position: [x + lx, .36, z + lz], taille: [.04, .72, .04], couleur: '#E6E3DA', rotation: 0 });
      for (const [dx, dz, a] of QUATRE_PLACES) chaisePlastique(blocs, x + dx, z + dz, a, k % 3 === 1 ? '#C8392E' : '#F2F0EA');
    });
    const [cx, cz] = TABLE_COLLEGUES.centre;
    blocs.push({ position: [cx, .72, cz], taille: [TABLE_COLLEGUES.largeur, .04, TABLE_COLLEGUES.profondeur], couleur: '#F2F0EA', rotation: 0 });
    for (const lx of [-1.4, 1.4]) for (const lz of [-.36, .36]) blocs.push({ position: [cx + lx, .36, cz + lz], taille: [.04, .72, .04], couleur: '#E6E3DA', rotation: 0 });
    for (const x of [6.8, 7.8, 8.8]) chaisePlastique(blocs, x, cz - .62, 0, '#2E8B57');
    for (const x of [6.9, 8.7]) chaisePlastique(blocs, x, cz + .62, Math.PI, '#2E8B57');
    return blocs;
  }, []);
  const [cx, cz] = TABLE_COLLEGUES.centre;
  const nappes = ['#C8392E', '#2E6FA8', '#E9C46A', '#2E6FA8', '#C8392E', '#E9C46A'];
  return <>
    <Sol largeur={24} profondeur={16} c="#CDB596" echelle={3} />
    {/* Murs de la cour : ocre, soubassement brique ; au nord, le bâtiment de la cuisine porte l'enseigne. */}
    <Mur p={[0, 2.6, -8.1]} s={[24.4, 5.2, .2]} c="#E2A25B" />
    <Boite p={[0, .5, -7.99]} s={[24, 1, .02]} c="#9B4A2A" />
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 12.1, 1.1, 0]} s={[.2, 2.2, 16.4]} c="#D98E48" />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * 7.1, .6, 8.1]} s={[10.2, 1.2, .2]} c="#D98E48" />)}
    {[-1, 1].map(cote => <Boite key={`p${cote}`} p={[cote * 2.1, .9, 8.1]} s={[.4, 1.8, .4]} c="#9B4A2A" />)}
    <Enseigne p={[0, 4.35, -7.98]} largeur={9.4} hauteur={1.1} fond="#B8322A" texte="MAQUIS CHEZ TANTIE BINTOU" couleur="#FFD54A" taille={.55} />
    {/* Auvent étroit en tôle, sur la cuisine et le bar, et ses poteaux. */}
    <mesh position={[1.5, 3.5, -7.45]} rotation={[.08, 0, 0]} castShadow receiveShadow><boxGeometry args={[16.4, .06, 1.3]} /><MateriauMonde type="corrugated_iron" couleur="#B9BDB5" echelle={1.4} relief={.9} rugosite={.6} metal={.4} /></mesh>
    {[-6.3, 2.2, 3.8, 9.2].map(x => <Boite key={x} p={[x, 1.75, -6.9]} s={[.12, 3.5, .12]} c="#6B4A33" />)}
    {/* Cuisine : banc de cuisson et marmites, étagère d'épices, bonbonne de gaz. */}
    <Boite p={[-4.2, .45, -7.5]} s={[3.6, .9, .8]} c="#8E8478" />
    {[-5.2, -3.6].map(x => <group key={x}><Cyl p={[x, 1.12, -7.5]} r={.32} h={.42} c="#C8CCCF" metal={.6} /><Cyl p={[x, 1.35, -7.5]} r={.33} h={.04} c="#AEB3B6" metal={.6} /></group>)}
    <Boite p={[-4.4, .93, -7.5]} s={[.5, .04, .4]} c="#3A1A08" emissif="#D9541A" />
    <Cyl p={[-2.3, .25, -7.6]} r={.15} h={.5} c="#2F6FB0" />
    <Boite p={[0, 1.8, -7.85]} s={[3, .05, .35]} c="#8B6A45" />
    {Array.from({ length: 8 }, (_, i) => <Cyl key={i} p={[-1.3 + i * .37, 1.95, -7.85]} r={.06} h={.22} c={['#C8392E', '#E9C46A', '#4E7A3A', '#8E5A34'][i % 4]} />)}
    {/* Comptoir carrelé de bleu : attiéké, poisson frit, alloco, piles d'assiettes. */}
    <Boite p={[-2, .5, -5.4]} s={[8.4, 1, .8]} c="#2F6E8E" /><Boite p={[-2, 1.03, -5.4]} s={[8.6, .06, .95]} c="#E8E2D6" />
    <Cyl p={[-3.4, 1.13, -5.45]} r={.3} h={.15} c="#F2EEDF" /><Boite p={[-1.6, 1.09, -5.4]} s={[.6, .06, .4]} c="#B8742E" /><Cyl p={[-.6, 1.11, -5.4]} r={.25} h={.1} c="#E0A23A" />
    <Cyl p={[.6, 1.14, -5.45]} r={.13} h={.16} c="#FFFFFF" /><Boite p={[1.6, 1.12, -5.4]} s={[.3, .12, .22]} c="#6B6F72" metal={.4} />
    {enCuisine && <Cyl p={[-.2, 1.07, -5.15]} r={.17} h={.02} c="#FFFFFF" />}
    {/* Braisière : demi-fût sur pieds, braises, poissons et poulets, le braiseur et sa fumée. */}
    <group position={[-8.7, 0, -5.6]}>
      <Boite p={[0, .85, 0]} s={[1.4, .25, .6]} c="#2B2B2E" metal={.4} />
      {[[-.6, -.22], [.6, -.22], [-.6, .22], [.6, .22]].map(([x, z]) => <Boite key={`${x}${z}`} p={[x, .36, z]} s={[.05, .72, .05]} c="#2B2B2E" />)}
      <Boite p={[0, .99, 0]} s={[1.3, .02, .5]} c="#3A1A08" emissif="#E0601A" />
      {[-.4, -.1, .2, .45].map((x, i) => <Boite key={x} p={[x, 1.03, (i % 2 ? .1 : -.08)]} s={[.22, .05, .1]} c={i % 2 ? '#A0522D' : '#9C5A2C'} />)}
    </group>
    <Fumee p={[-8.7, 1.1, -5.6]} dense={enCuisine} />
    <Gens p={[-9.6, 0, -4.95]} r={Math.PI / 2} variante={3} />
    {/* Ardoise sur chevalet, à côté de la braisière : la carte du jour. */}
    <group position={[-7.6, 0, -4.75]} rotation={[0, -.35, 0]}>
      <Boite p={[0, 1.1, 0]} s={[1, 1.35, .05]} c="#1E2422" />
      {[-.42, .42].map(x => <Boite key={x} p={[x, .55, -.08]} s={[.04, 1.1, .04]} c="#6B4A33" />)}
      <Text position={[0, 1.66, .03]} fontSize={.12} color="#FFE7B0" anchorX="center" anchorY="middle">CARTE DU JOUR</Text>
      {ARTICLES_MAQUIS.map((a, i) => <Text key={a.id} position={[0, 1.47 - i * .14, .03]} fontSize={.075} color="#F4F1EA" anchorX="center" anchorY="middle">{`${a.nom} · ${a.prix.toLocaleString('fr-FR')} F`}</Text>)}
    </group>
    {/* Bar : comptoir, réfrigérateur vitré, casiers de bouteilles, téléviseur accroché à l'auvent. */}
    <Boite p={[6.5, .55, -6.5]} s={[5.4, 1.1, .7]} c="#6B4A33" /><Boite p={[6.5, 1.13, -6.5]} s={[5.6, .06, .85]} c="#3A2A20" />
    <Boite p={[7.9, 1, -7.55]} s={[1.2, 2, .8]} c="#E8ECEE" /><Boite p={[7.9, 1.05, -7.14]} s={[1, 1.6, .02]} c="#9FC6D6" emissif="#4F7F94" />
    {Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[7.6 + (i % 3) * .3, .55 + Math.floor(i / 3) * .55, -7.3]} r={.04} h={.24} c={['#7A3A1E', '#E9C46A', '#2E8B57'][i % 3]} />)}
    {[0, 1, 2].map(k => <Boite key={k} p={[4.4, .16 + k * .3, -7.4]} s={[.6, .3, .45]} c={k % 2 ? '#E9C46A' : '#C8392E'} />)}
    <group position={[6.5, 2.72, -6.78]}>
      <Boite p={[0, 0, 0]} s={[1.3, .78, .06]} c="#111214" /><Boite p={[0, 0, .035]} s={[1.18, .66, .01]} c="#1F5F2A" emissif="#2E8B3A" />
      <Boite p={[0, 0, .042]} s={[.01, .66, .002]} c="#FFFFFF" emissif="#FFFFFF" />
      <Boite p={[0, .5, 0]} s={[.04, .3, .04]} c="#111214" />
    </group>
    {/* Tables de la cour, nappes de couleur, chaises en plastique ; quelques clients. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {TABLES_MAQUIS.map(([x, z], i) => <Boite key={`n${i}`} p={[x, .747, z]} s={[.9, .01, .9]} c={nappes[i]} />)}
    <Gens p={[1, 0, -2.82]} assis variante={1} /><Gens p={[.38, 0, -2.2]} r={Math.PI / 2} assis variante={0} />
    <Gens p={[-6.38, 0, 1.4]} r={-Math.PI / 2} assis variante={4} />
    {[[1.1, -2.1], [.6, -2.25], [-6.7, 1.35]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .82, z]} r={.04} h={.16} c="#7A3A1E" />)}
    {/* Table des collègues : une longue table, leurs casques posés dessus quand ils sont là. */}
    <Boite p={[cx, .747, cz]} s={[TABLE_COLLEGUES.largeur + .06, .01, TABLE_COLLEGUES.profondeur + .06]} c="#E9EEF0" />
    {collegues && <>
      {[6.8, 7.8, 8.8].map((x, i) => <Gens key={x} p={[x, 0, cz - .62]} assis casque variante={i} />)}
      <Gens p={[8.7, 0, cz + .62]} r={Math.PI} assis casque variante={3} />
      {[[7.2, '#F4C430'], [8.2, '#FFFFFF'], [9.1, '#E86A2E']].map(([x, c]) => <mesh key={String(x)} position={[x as number, .8, cz + .05]} castShadow><sphereGeometry args={[.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c as string} roughness={.5} /></mesh>)}
      {[6.8, 7.8, 8.8].map(x => <Cyl key={`a${x}`} p={[x, .76, cz - .2]} r={.15} h={.02} c="#FFFFFF" />)}
    </>}
    {servi && <PlatServi p={servi.station === 'table' ? [-3, .75, 1.72] : [6.9, .75, cz + .22]} article={servi.article} />}
    {/* Lave-mains : bidon bleu à robinet, bassine, savon. */}
    <group position={[-9.6, 0, 5.2]}>
      <Boite p={[0, .45, 0]} s={[.7, .9, .5]} c="#7A5233" /><Cyl p={[0, 1.25, -.05]} r={.28} h={.7} c="#2F6FB0" />
      <Cyl p={[0, 1, .2]} r={.03} h={.12} c="#C8CCCF" metal={.6} rot={[Math.PI / 2, 0, 0]} /><Cyl p={[0, .95, .12]} r={.25} h={.08} c="#C8CCCF" metal={.5} />
      <Boite p={[.25, .92, .1]} s={[.08, .03, .05]} c="#F4D35E" />
    </group>
    {/* Manguier le long du mur ouest, banc et casiers vides au coin sud-est, enceinte au mur est. */}
    <Cyl p={[-10.8, 1.3, -.5]} r={.28} h={2.6} c="#5A3E2B" />
    {([[-10.6, 3.2, -.4, 1.7], [-9.7, 2.8, .5, 1.15], [-11.2, 2.9, -1.4, 1.3]] as [number, number, number, number][]).map(([x, y, z, r]) => <mesh key={`${x}${z}`} position={[x, y, z]} castShadow><sphereGeometry args={[r, 14, 10]} /><meshStandardMaterial color="#3E6B32" roughness={.9} /></mesh>)}
    <Boite p={[9.9, .45, 5.2]} s={[2, .08, .45]} c="#8B6A45" />{[9.1, 10.7].map(x => <Boite key={x} p={[x, .22, 5.2]} s={[.08, .44, .4]} c="#6B4A33" />)}
    {[0, 1, 2, 3].map(k => <Boite key={`c${k}`} p={[10.6 + (k % 2) * .62, .16 + Math.floor(k / 2) * .3, 6.6]} s={[.6, .3, .45]} c={k % 2 ? '#C8392E' : '#E9C46A'} />)}
    <Boite p={[11.85, 2.2, -3]} s={[.3, .45, .3]} c="#1C1C1E" />
    <Guirlande z={-2.6} nuit={nuit} /><Guirlande z={2.4} nuit={nuit} />
    {nuit && <><pointLight position={[-4, 2.7, 0]} intensity={6} distance={14} decay={2} color="#FFC870" /><pointLight position={[5, 2.7, 0]} intensity={6} distance={14} decay={2} color="#FFC870" /></>}
  </>;
}

/** Chaise de bistrot en bois, en blocs. */
export function chaiseBistrot(blocs: BlocArchitecture[], x: number, z: number, a: number) {
  const bloc = (dx: number, y: number, dz: number, taille: V3, couleur: string) => { const [ox, oz] = pivoter(dx, dz, a); blocs.push({ position: [x + ox, y, z + oz], taille, couleur, rotation: a }); };
  bloc(0, .46, 0, [.4, .04, .4], '#6B4A33'); bloc(0, .76, -.18, [.4, .5, .04], '#5A3E2B');
  for (const [lx, lz] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) bloc(lx, .23, lz, [.035, .46, .035], '#3A2A20');
}

export function DecorCafe({ soir, servi, professionnels }: {
  /** Le soir, les suspensions éclairent plus chaud. */
  soir: boolean;
  servi: { station: 'table' | 'reseau'; article: ArticleCarte } | null;
  professionnels: Professionnel[];
}) {
  const mobilier = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    for (const [x, z] of TABLES_CAFE) { chaiseBistrot(blocs, x, z - .6, 0); chaiseBistrot(blocs, x, z + .6, Math.PI); }
    for (const [x, z, a] of [[5.5, .55, 0], [4.55, 1.5, Math.PI / 2], [6.45, 1.5, -Math.PI / 2], [5.5, 2.45, Math.PI]] as [number, number, number][]) chaiseBistrot(blocs, x, z, a);
    return blocs;
  }, []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 14]} /><MateriauMonde type="wood_floor" couleur="#C29A6B" echelle={2.2} relief={.5} rugosite={.7} /></mesh>
    <MursCoupe hx={10} hz={7} hauteur={3.4} c="#ECE4D4" />
    {/* Vitrine côté rue : grandes vitres au-dessus du muret. */}
    {[-1, 1].map(cote => <Verre key={cote} p={[cote * 6.3, 2, 7.1]} s={[7.2, 2.2, .04]} c="#CFE3EA" opacite={.12} />)}
    {/* Mur du comptoir, vert sombre, et l'enseigne. */}
    <Boite p={[-3, 1.7, -6.98]} s={[9.6, 3.4, .02]} c="#2F5D5E" />
    <Text position={[-3, 2.95, -6.95]} fontSize={.38} color="#E9C46A" anchorX="center" anchorY="middle" letterSpacing={.08}>CAFÉ DES BÂTISSEURS</Text>
    {/* Ardoise des boissons. */}
    <Boite p={[-6, 1.95, -6.95]} s={[2.4, 1.3, .04]} c="#1E2422" />
    {ARTICLES_CAFE.map((a, i) => <Text key={a.id} position={[-6, 2.42 - i * .2, -6.92]} fontSize={.11} color="#F4F1EA" anchorX="center" anchorY="middle">{`${a.nom} · ${a.prix.toLocaleString('fr-FR')} F`}</Text>)}
    <Boite p={[-.4, 2, -6.9]} s={[2.6, .05, .3]} c="#6B4A33" />
    {Array.from({ length: 7 }, (_, i) => <Cyl key={i} p={[-1.5 + i * .36, 2.15, -6.9]} r={.08} h={.22} c={i % 2 ? '#6B4A33' : '#C8A06A'} />)}
    {/* Comptoir : bois et pierre sombre, machine à expresso, moulin, vitrine à croissants, tasses. */}
    <Boite p={[-3, .55, -5.3]} s={[8.6, 1.1, .9]} c="#6B4A33" /><Boite p={[-3, 1.13, -5.3]} s={[8.8, .06, 1.05]} c="#2B2B2E" />
    <Boite p={[-4.6, 1.42, -5.55]} s={[.9, .52, .55]} c="#C9CDD0" metal={.7} />
    {[-4.85, -4.35].map(x => <Cyl key={x} p={[x, 1.25, -5.22]} r={.05} h={.12} c="#2B2B2E" metal={.5} />)}
    <Cyl p={[-3.7, 1.42, -5.6]} r={.12} h={.5} c="#2B2B2E" />
    <Verre p={[-1.4, 1.37, -5.3]} s={[1.2, .42, .6]} c="#E6F1F4" opacite={.25} />
    {[-1.75, -1.4, -1.05].map(x => <Boite key={x} p={[x, 1.22, -5.3]} s={[.24, .08, .12]} c="#D9A55B" />)}
    {[.2, .45].map(x => <Cyl key={x} p={[x, 1.24, -5.4]} r={.05} h={.12} c="#FFFFFF" />)}
    {/* Tables de bistrot et clients. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {TABLES_CAFE.map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .74, z]} r={.42} h={.04} c="#2B2B2E" /><Cyl p={[x, .37, z]} r={.05} h={.72} c="#1C1C1E" /><Cyl p={[x, .02, z]} r={.24} h={.04} c="#1C1C1E" /></group>)}
    <Gens p={[-6.2, 0, -2.2]} assis variante={1} /><Gens p={[1.6, 0, -2.2]} assis variante={0} /><Gens p={[1.6, 0, -1]} r={Math.PI} assis variante={3} />
    <Gens p={[-6.2, 0, 1.6]} assis prof variante={1} />
    <Boite p={[-6.2, .79, 2.05]} s={[.32, .02, .22]} c="#1C1C1E" /><Boite p={[-6.2, .9, 1.95]} s={[.32, .2, .01]} c="#2B3A44" emissif="#3E6F8E" />
    {[[-6.15, -1.45], [1.5, -1.75], [1.7, -1.4]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .8, z]} r={.04} h={.08} c="#FFFFFF" />)}
    {/* Table du réseau : l'architecte, le patron de PME, l'ingénieure ; plans roulés, tasses. */}
    <Cyl p={[5.5, .75, 1.5]} r={.7} h={.05} c="#3A2A20" /><Cyl p={[5.5, .37, 1.5]} r={.06} h={.72} c="#1C1C1E" />
    {professionnels.map(pro => <group key={pro.nom} position={[pro.place.position[0], 0, pro.place.position[1]]} rotation={[0, pro.place.rotation, 0]}><HumainMonde assis prof={pro.prof} variante={pro.variante} /></group>)}
    <Cyl p={[5.3, .82, 1.4]} r={.05} h={.6} c="#EDE7D8" rot={[0, 0, Math.PI / 2]} /><Cyl p={[5.5, .82, 1.65]} r={.04} h={.5} c="#C9DDEA" rot={[0, .6, Math.PI / 2]} />
    {[[5.2, 1.05], [5.85, 1.3], [5.75, 1.85]].map(([x, z]) => <Cyl key={`t${x}${z}`} p={[x, .82, z]} r={.04} h={.08} c="#FFFFFF" />)}
    {servi && <PlatServi p={servi.station === 'table' ? [-2.5, .77, 2.5] : [5.5, .79, 2.05]} article={servi.article} />}
    {/* Tableau des annonces : liège, petites annonces, titre. */}
    <group position={[6.2, 1.85, -6.96]}>
      <Boite p={[0, 0, 0]} s={[2.8, 1.6, .05]} c="#6B4A33" /><Boite p={[0, 0, .03]} s={[2.6, 1.4, .02]} c="#C49A64" />
      {[[-.9, .35, '#FFF4C2'], [-.3, .4, '#FFFFFF'], [.35, .3, '#D7EEF7'], [.95, .38, '#FFFFFF'], [-.7, -.3, '#FFFFFF'], [0, -.25, '#FFE1D6'], [.75, -.35, '#FFF4C2']].map(([x, y, c]) => <Boite key={`${x}${y}`} p={[x as number, y as number, .045]} s={[.42, .48, .01]} c={c as string} />)}
      <Text position={[0, .95, .03]} fontSize={.16} color="#2B2B2E" anchorX="center" anchorY="middle">ANNONCES · EMPLOI</Text>
    </group>
    {/* Coin salon : canapé, fauteuil, table basse, tapis ; grandes plantes. */}
    <Boite p={[-8, .01, 5.6]} s={[3, .01, 2.4]} c="#C9B79A" />
    <Boite p={[-8, .3, 6.5]} s={[2.4, .45, .8]} c="#7A4A3A" /><Boite p={[-8, .7, 6.85]} s={[2.4, .5, .2]} c="#6B3F31" />
    {[-1, 1].map(cote => <Boite key={cote} p={[-8 + cote * 1.25, .45, 6.5]} s={[.2, .5, .8]} c="#6B3F31" />)}
    <Boite p={[-8, .22, 5.3]} s={[1.2, .06, .6]} c="#3A2A20" /><Boite p={[-6.9, .3, 5.0]} s={[.8, .45, .8]} c="#7A4A3A" />
    {[[9.3, -6.3], [-9.3, -6.2]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .3, z]} r={.32} haut={.38} h={.6} c="#B5653C" /><mesh position={[x, 1.25, z]} castShadow><coneGeometry args={[.6, 1.5, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>)}
    {/* Suspensions au-dessus des tables, plus chaudes le soir. */}
    {[[-6.2, -1.6], [-2.5, -1.6], [1.6, -1.6], [-6.2, 2.2], [-2.5, 2.2], [5.5, 1.5]].map(([x, z]) => <group key={`l${x}${z}`}>
      <Boite p={[x, 3.05, z]} s={[.01, .7, .01]} c="#2B2B2E" />
      <mesh position={[x, 2.66, z]}><sphereGeometry args={[.14, 12, 8]} /><meshStandardMaterial color="#FFE7B0" emissive="#FFC860" emissiveIntensity={soir ? 2.2 : .8} /></mesh>
    </group>)}
    <pointLight position={[-4, 2.6, 0]} intensity={soir ? 7 : 4} distance={13} decay={2} color="#FFD9A0" />
    <pointLight position={[4.5, 2.6, 0]} intensity={soir ? 7 : 4} distance={13} decay={2} color="#FFD9A0" />
  </>;
}

// ─── Université ───

/** Étudiants assis dans l'amphi (bloc, rang, siège) : jamais sur ta place, troisième rang à droite de l'allée. */
const ETUDIANTS: [number, number, number][] = [[-9.2, 0, 1], [-7, 0, 0], [-5.6, 1, 3], [-1.6, 1, 2], [.8, 0, 4], [-8.4, 2, 1], [-.4, 2, 0], [1.6, 3, 3], [-6.4, 3, 2]];

export function DecorUniversite({ titreEcran, sousTitreEcran, lignesTableau }: {
  /** Ce que le grand écran projette : le cours en cours, ou le prochain. */
  titreEcran: string; sousTitreEcran: string;
  /** Emploi du temps : un module par ligne, avec son avancement. */
  lignesTableau: string[];
}) {
  const mobilier = useMemo(() => {
    const blocs: BlocArchitecture[] = [];
    for (const z of RANGEES_AMPHI) for (const [x1, x2] of [[-10.2, -4.7], [-3.3, 2.2]]) {
      const cx = (x1 + x2) / 2, l = x2 - x1;
      blocs.push({ position: [cx, .74, z - .3], taille: [l, .05, .42], couleur: '#C8A06A', rotation: 0 }, { position: [cx, .45, z - .3], taille: [l, .55, .04], couleur: '#8B6A45', rotation: 0 });
      blocs.push({ position: [cx, .44, z + .25], taille: [l, .06, .4], couleur: '#2F4F5F', rotation: 0 }, { position: [cx, .7, z + .44], taille: [l, .5, .05], couleur: '#2F4F5F', rotation: 0 });
      for (const x of [x1 + .1, x2 - .1]) blocs.push({ position: [x, .37, z], taille: [.08, .74, 1], couleur: '#5A3E2B', rotation: 0 });
    }
    // Livres sur les rayonnages : six étagères, des dos de toutes les couleurs.
    const couleurs = ['#7A2E26', '#2F5D6E', '#C8A06A', '#2E8B57', '#5A3E2B', '#B8742E', '#3B4A6B'];
    for (let etage = 0; etage < 6; etage++) for (let i = 0; i < 40; i++) blocs.push({ position: [11.05, .32 + etage * .5, -6 + i * .3 + ((i * 7) % 3) * .02], taille: [.22, .34 + ((i * 13) % 4) * .03, .24], couleur: couleurs[(i * 3 + etage) % couleurs.length], rotation: 0 });
    return blocs;
  }, []);
  return <>
    <SolCarrele largeur={24} profondeur={18} c="#E6E0D3" joint="#CFC6B4" />
    <Boite p={[-3.9, .006, -.8]} s={[13.2, .012, 7.6]} c="#2F4F5F" rugosite={1} />
    <MursCoupe hx={12} hz={9} hauteur={4.4} c="#EDE8DD" porte={3} />
    {/* Estrade en bois, pupitre, grand écran et le nom de la faculté. */}
    <Boite p={[0, .02, -7.7]} s={[16.4, .04, 2.6]} c="#8B6A45" />
    <Boite p={[-5, .55, -6.85]} s={[.75, 1.1, .5]} c="#5A3E2B" /><Boite p={[-5, 1.12, -6.95]} s={[.8, .04, .55]} c="#3A2A20" />
    <Boite p={[1.5, 2.55, -8.95]} s={[7.4, 2.9, .05]} c="#1C1C1E" />
    <Boite p={[1.5, 2.55, -8.92]} s={[7.1, 2.6, .01]} c="#F4F6F8" emissif="#D9E3EC" />
    <Text position={[1.5, 3.2, -8.9]} fontSize={.17} color="#2F5D6E" anchorX="center" anchorY="middle">{sousTitreEcran}</Text>
    <Text position={[1.5, 2.6, -8.9]} fontSize={.3} color="#1C2A33" anchorX="center" anchorY="middle" maxWidth={6.6} textAlign="center">{titreEcran}</Text>
    <Text position={[0, 4.15, -8.95]} fontSize={.32} color="#5A3E2B" anchorX="center" anchorY="middle" letterSpacing={.08}>UNIVERSITÉ BTP · FACULTÉ DU BÂTIMENT</Text>
    {/* Gradins : tables et bancs de part et d'autre de l'allée, étudiants attentifs. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {ETUDIANTS.map(([x, rang, v]) => <group key={`${x}${rang}`} position={[x, 0, RANGEES_AMPHI[rang] + .25]} rotation={[0, Math.PI, 0]}><HumainMonde assis variante={v} /></group>)}
    {/* Bibliothèque : rayonnages, tables de lecture et lampes vertes. */}
    <Boite p={[11.3, 1.55, 0]} s={[.6, 3.1, 13]} c="#6B4A33" />
    {[0, 1, 2, 3, 4, 5].map(e => <Boite key={e} p={[11.1, .14 + e * .5, 0]} s={[.5, .03, 12.8]} c="#5A3E2B" />)}
    {[-1, 3].map(z => <group key={z}>
      <Boite p={[7, .75, z]} s={[2, .05, 1.4]} c="#8B6A45" />
      {[[-.9, -.6], [.9, -.6], [-.9, .6], [.9, .6]].map(([x, dz]) => <Boite key={`${x}${dz}`} p={[7 + x, .37, z + dz]} s={[.06, .74, .06]} c="#5A3E2B" />)}
      <Cyl p={[6.4, .82, z - .3]} r={.06} h={.1} c="#C9A227" metal={.6} /><Boite p={[6.4, .98, z - .3]} s={[.3, .1, .16]} c="#1F5F3A" emissif="#3E8E5A" />
      <Boite p={[7.4, .79, z + .1]} s={[.4, .04, .3]} c="#7A2E26" />
    </group>)}
    <Enseigne p={[11, 3.4, 0]} r={-Math.PI / 2} largeur={4} hauteur={.5} fond="#2F4F5F" texte="BIBLIOTHÈQUE" taille={.26} />
    {/* Emploi du temps du semestre, au mur nord, à droite de l'écran. */}
    <group position={[9.6, 2.1, -8.95]}>
      <Boite p={[0, 0, 0]} s={[3, 2.2, .05]} c="#6B4A33" /><Boite p={[0, 0, .03]} s={[2.8, 2, .02]} c="#F7F4EC" />
      <Text position={[0, .8, .05]} fontSize={.17} color="#2F4F5F" anchorX="center" anchorY="middle">EMPLOI DU TEMPS</Text>
      {lignesTableau.slice(0, 7).map((l, i) => <Text key={i} position={[-1.3, .52 - i * .22, .05]} fontSize={.1} color="#33464A" anchorX="left" anchorY="middle" maxWidth={2.6}>{l}</Text>)}
    </group>
    {/* Vitrine des diplômés, coin sud-ouest ; plantes ; plafonniers. */}
    <Boite p={[-11.3, .5, 6.7]} s={[1.2, 1, 4.4]} c="#5A3E2B" /><Verre p={[-11.3, 1.55, 6.7]} s={[1.1, 1.1, 4.3]} c="#E6F1F4" opacite={.2} />
    {[5.4, 6.4, 7.4, 8.2].map((z, i) => <Cyl key={z} p={[-11.3, 1.18, z]} r={.09} h={.35} c={i % 2 ? '#C9A227' : '#B8B8B8'} metal={.7} />)}
    {[[-11, -8], [11, -8], [4, 8]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .3, z]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[x, 1.2, z]} castShadow><coneGeometry args={[.55, 1.4, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>)}
    <Plafonniers points={[[-7, 4.1, -3], [-1, 4.1, -3], [5, 4.1, -3], [-7, 4.1, 3], [-1, 4.1, 3], [7, 4.1, 2]]} couleur="#F4F7FF" />
  </>;
}
