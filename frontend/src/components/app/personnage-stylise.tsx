'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Detailed, Text } from '@react-three/drei';
import * as THREE from 'three';
import { IDENTITES_PERSONNAGES, identiteDepuisNom, type DesignPersonnage, type IdentitePersonnage, type Coiffure } from '@/lib/identites-personnages';
import { BlocsInstances } from './blocs-instances';
import type { BlocArchitecture } from '@/lib/architecture-ville';

type V = [number, number, number];
export interface PersonnageStyliseProps {
  variante?: number; couleur?: string; marche?: boolean; assis?: boolean; prof?: boolean;
  casque?: boolean; nom?: string; scale?: number; identite?: IdentitePersonnage;
  /** Palette et silhouette imposées (le personnage choisi par le joueur), à la place d'une identité du jeu. */
  design?: DesignPersonnage;
  /** Version lointaine seule (silhouette instanciée), quand le modèle détaillé est affiché ailleurs. */
  silhouette?: boolean;
}
function Galbe({ p, s, c, rugosite = .76 }: { p: V; s: V; c: string; rugosite?: number }) {
  return <mesh position={p} scale={s} castShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={c} roughness={rugosite} /></mesh>;
}
function Piece({ p, s, c, r = 0 }: { p: V; s: V; c: string; r?: number }) {
  return <mesh position={p} rotation={[0, 0, r]} castShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={.74} /></mesh>;
}
function Coupe({ points, p, couleur, profondeur = .63 }: { points: [number, number][]; p: V; couleur: string; profondeur?: number }) {
  const profil = useMemo(() => points.map(([x, y]) => new THREE.Vector2(x, y)), [points]);
  return <mesh position={p} scale={[1, 1, profondeur]} castShadow><latheGeometry args={[profil, 28]} /><meshStandardMaterial color={couleur} roughness={.88} /></mesh>;
}

/** Boucles et tresses instanciées : une seule passe de dessin pour la coiffure (de la couleur choisie, sinon brun très foncé).
 * Sous un casque, seules les tresses dépassent : le reste de la chevelure traverserait la coque. */
function Chevelure({ style, couleur, sousCasque = false }: { style: Coiffure; couleur?: string; sousCasque?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const boucles = useMemo(() => {
    const list: { p: V; s: V }[] = [];
    if (style === 'foulard' || style === 'chauve') return list;
    const n = sousCasque ? 0 : style === 'afro' ? 100 : 65;
    for (let j = 0; j < n; j++) {
      const a = j * 2.399963, v = (j + .5) / n, r = Math.sqrt(1 - v * v);
      const rayon = style === 'afro' ? .202 : .154;
      list.push({ p: [Math.cos(a) * r * rayon, .087 + v * (style === 'afro' ? .22 : .14), Math.sin(a) * r * rayon - .025], s: style === 'afro' ? [.052, .05, .048] : [.024, .022, .025] });
    }
    if (style === 'tresses') for (let braid = 0; braid < 10; braid++) for (let knot = 0; knot < 7; knot++) {
      const a = Math.PI * .15 + braid / 9 * Math.PI * .7;
      list.push({ p: [Math.cos(a) * .15, .1 - knot * .045, -Math.sin(a) * .14 - .025], s: [.022, .032, .022] });
    }
    return list;
  }, [style, sousCasque]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Object3D();
    // Une mèche sur cinq un peu plus claire, pour le volume.
    const fonce = new THREE.Color(couleur ?? '#211b19'), clair = couleur ? fonce.clone().lerp(new THREE.Color('#ffffff'), .14) : new THREE.Color('#35251d');
    boucles.forEach((b, i) => { m.position.fromArray(b.p); m.scale.fromArray(b.s); m.rotation.set(0, i * .3, 0); m.updateMatrix(); ref.current!.setMatrixAt(i, m.matrix); ref.current!.setColorAt(i, i % 5 === 0 ? clair : fonce); });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [boucles, couleur]);
  if (!boucles.length) return null;
  return <instancedMesh ref={ref} args={[undefined, undefined, boucles.length]} castShadow><sphereGeometry args={[1, 7, 6]} /><meshStandardMaterial roughness={.96} /></instancedMesh>;
}

/** Moustache, bouc ou barbe (moustache comprise), de la couleur des cheveux. */
function Pilosite({ style, couleur }: { style: 'moustache' | 'barbe' | 'bouc'; couleur: string }) {
  return <>
    <Galbe p={[0, -.066, .146]} s={[.042, .01, .014]} c={couleur} rugosite={.95} />
    {style === 'bouc' && <Galbe p={[0, -.118, .118]} s={[.034, .03, .028]} c={couleur} rugosite={.95} />}
    {style === 'barbe' && <><Galbe p={[0, -.126, .079]} s={[.098, .049, .073]} c={couleur} rugosite={.95} />{[-1, 1].map(s => <Galbe key={s} p={[s * .082, -.072, .062]} s={[.032, .062, .058]} c={couleur} rugosite={.95} />)}</>}
  </>;
}

const TORSE_HOMME: [number, number][] = [[.175, 0], [.185, .1], [.195, .3], [.23, .43], [.225, .47], [.145, .53], [.074, .55]];
const TORSE_FEMME: [number, number][] = [[.19, 0], [.159, .14], [.178, .32], [.202, .43], [.194, .47], [.13, .52], [.068, .54]];
const JUPE: [number, number][] = [[.24, 0], [.232, .13], [.24, .35], [.225, .52], [.18, .64]];
const CUISSE: [number, number][] = [[.073, 0], [.085, .1], [.097, .29], [.09, .41]];
const MOLLET: [number, number][] = [[.066, 0], [.065, .09], [.076, .27], [.076, .39]];
const AVANT_BRAS: [number, number][] = [[.036, 0], [.045, .1], [.054, .2], [.051, .26]];

/** Un seul modèle articulé partagé par le monde, les intérieurs et l'atelier de revue. */
export function PersonnageStylise({ variante = 0, couleur, marche = false, assis = false, prof = false, casque = false, nom, scale = 1, identite, design, silhouette: seulementSilhouette = false }: PersonnageStyliseProps) {
  const i = Math.abs(Math.floor(variante));
  const reconnu = identite ?? identiteDepuisNom(nom);
  const base = design ?? IDENTITES_PERSONNAGES[reconnu ?? (casque ? (i % 2 ? 'yao' : 'batisseur') : prof ? 'awa' : (['koffi', 'awa', 'mariam', 'fatou'] as const)[i % 4])];
  const haut = design || reconnu || !couleur ? base.haut : couleur;
  const peau = base.peau;
  const corps = useRef<THREE.Group>(null), tete = useRef<THREE.Group>(null), yeux = useRef<THREE.Group>(null), etiquette = useRef<THREE.Group>(null);
  const membres = useRef<Array<THREE.Group | null>>([]), genoux = useRef<Array<THREE.Group | null>>([]);
  const phase = useRef(i), poids = useRef(0);
  const monde = useMemo(() => new THREE.Vector3(), []);
  const visible = useRef(true);
  const casqueCouleur = base.casque;
  const gilet = base.tenue === 'gilet';
  const jupe = base.tenue === 'pagne' && !assis;
  const silhouette = useMemo<BlocArchitecture[]>(() => [
    { position: [0, assis ? .89 : 1.2, 0], taille: [.44 * base.largeur, .62, .3], couleur: haut, rotation: 0 },
    { position: [0, assis ? 1.3 : 1.7, 0], taille: [.3, .38, .27], couleur: peau, rotation: 0 },
    ...[-1, 1].map(s => ({ position: [s * .1, .43, assis ? .24 : 0] as V, taille: [.17, .82, .18] as V, couleur: base.pantalon, rotation: 0 })),
  ], [base, haut, peau, assis]);
  useFrame(({ clock, camera }, delta) => {
    if (corps.current) { corps.current.getWorldPosition(monde); visible.current = camera.position.distanceTo(monde) < 46 * scale; }
    if (etiquette.current) etiquette.current.visible = camera.position.distanceTo(monde) < 15;
    if (!visible.current) return;
    const dt = Math.min(delta, .08), t = clock.elapsedTime;
    poids.current = THREE.MathUtils.damp(poids.current, marche ? 1 : 0, 8, dt);
    phase.current += dt * 6.8;
    const p = phase.current, m = poids.current;
    if (corps.current) { corps.current.position.y = (assis ? -.39 : 0) + Math.abs(Math.sin(p)) * .021 * m + Math.sin(t * 1.6 + i) * .003; corps.current.rotation.z = Math.sin(p) * .022 * m; }
    membres.current.forEach((b, j) => { if (b) b.rotation.x = THREE.MathUtils.damp(b.rotation.x, assis ? (j < 2 ? -.5 : -Math.PI / 2) : Math.sin(p + (j % 2 ? 0 : Math.PI)) * (j < 2 ? -.36 : .43) * m + (j < 2 ? -.07 : 0), 16, dt); });
    genoux.current.forEach((g, j) => { if (g) g.rotation.x = THREE.MathUtils.damp(g.rotation.x, assis ? Math.PI / 2 : Math.max(0, Math.sin(p + (j ? 0 : Math.PI))) * .66 * m, 16, dt); });
    if (tete.current) tete.current.rotation.y = Math.sin(t * .45 + i) * .07 * (1 - m);
    if (yeux.current) yeux.current.scale.y = Math.sin(t * .72 + i * 2) > .995 ? .15 : 1;
  });
  if (seulementSilhouette) return <group scale={scale * base.hauteur}><BlocsInstances blocs={silhouette} arrondi /></group>;
  return <group scale={scale * base.hauteur}>
    <Detailed distances={[0, 46]} hysteresis={.15}>
      <group ref={corps} scale={[base.largeur, 1, 1]}>
        <Coupe points={base.feminin ? TORSE_FEMME : TORSE_HOMME} p={[0, .89, 0]} couleur={haut} profondeur={base.feminin ? .72 : .67} />
        <Galbe p={[0, .91, 0]} s={[.18, .13, .12]} c={base.pantalon} />
        <Galbe p={[0, 1.47, 0]} s={[.074, .09, .073]} c={peau} />
        <Piece p={[0, .94, .123]} s={[.33, .032, .024]} c="#48372a" /><Piece p={[.015, .942, .142]} s={[.038, .031, .008]} c={base.accent} />
        {/* Vêtement : col, patte, poches, gilet ou revers. */}
        {[-1, 1].map(s => <group key={`col-${s}`}>
          <Piece p={[s * .076, 1.405, .094]} s={[.105, .052, .03]} c={gilet ? '#233d50' : base.tenue === 'veste' ? base.accent : '#fff5df'} r={s * .42} />
          {gilet && <><Piece p={[s * .142, 1.19, .139]} s={[.042, .35, .016]} c={base.accent} /><Piece p={[s * .1, 1.08, .15]} s={[.13, .07, .018]} c={haut} /><Piece p={[s * .1, 1.115, .16]} s={[.13, .012, .009]} c="#694e2e" /></>}
          {base.tenue === 'veste' && <Piece p={[s * .065, 1.26, .134]} s={[.073, .26, .018]} c="#e8d9b7" r={s * -.26} />}
        </group>)}
        {gilet && <><Piece p={[0, 1.035, .143]} s={[.355, .038, .018]} c={base.accent} /><Piece p={[0, 1.035, -.137]} s={[.355, .038, .018]} c={base.accent} /><Piece p={[0, 1.23, .147]} s={[.018, .36, .014]} c="#253b43" /></>}
        {(base.tenue === 'chemise' || base.tenue === 'veste') && <>{[1.12, 1.22, 1.32].map(y => <Galbe key={y} p={[0, y, .145]} s={[.009, .009, .007]} c={base.accent} />)}<Piece p={[.105, 1.29, .145]} s={[.09, .095, .014]} c={haut} /><Piece p={[.12, 1.33, .16]} s={[.009, .07, .008]} c="#235b75" /></>}
        {jupe && <><Coupe points={JUPE} p={[0, .32, 0]} couleur={base.pantalon} profondeur={.78} />{[.39, .51, .63, .75, .87].map((y, j) => <group key={y}>{[-.12, 0, .12].map(x => <Piece key={x} p={[x, y, .178 - (j > 3 ? .015 : 0)]} s={[.045, .045, .008]} c={j % 2 ? base.haut : base.accent} r={Math.PI / 4} />)}</group>)}</>}
        <group ref={tete} position={[0, 1.69, 0]}>
          <Galbe p={[0, 0, 0]} s={[.147, .189, .137]} c={peau} />
          <Galbe p={[0, -.095, .026]} s={[.115, .087, .112]} c={peau} />
          {[-1, 1].map(s => <group key={s}>
            <Galbe p={[s * .146, -.015, -.005]} s={[.026, .044, .022]} c={peau} />
            <Galbe p={[s * .148, -.014, .013]} s={[.013, .025, .008]} c="#623d30" />
            <Galbe p={[s * .075, -.042, .101]} s={[.058, .035, .031]} c={peau} />
            <Piece p={[s * .057, .049, .129]} s={[.06, .011, .012]} c="#2a211c" r={s * -.1} />
            {base.feminin && <mesh position={[s * .155, -.057, .015]}><torusGeometry args={[.022, .004, 6, 16]} /><meshStandardMaterial color="#d4a33a" metalness={.6} roughness={.3} /></mesh>}
          </group>)}
          <group ref={yeux}>{[-1, 1].map(s => <group key={s} position={[s * .058, .018, .126]}><Galbe p={[0, 0, 0]} s={[.027, .012, .009]} c="#d8c3a4" /><Galbe p={[s * -.002, 0, .008]} s={[.01, .01, .004]} c="#31251e" /><Galbe p={[-.004, .004, .012]} s={[.002, .002, .002]} c="#fff5da" /></group>)}</group>
          <Galbe p={[0, -.016, .138]} s={[.025, .043, .031]} c={peau} />
          <Galbe p={[0, -.042, .153]} s={[.035, .017, .025]} c={peau} />
          <Galbe p={[0, -.084, .128]} s={[.034, .005, .009]} c={base.feminin ? '#8b3e3a' : '#5c3227'} />
          <Galbe p={[0, -.093, .126]} s={[.032, .006, .009]} c={base.feminin ? '#a65a4d' : '#8d573e'} />
          {reconnu === 'yao' && <Galbe p={[0, -.126, .079]} s={[.098, .049, .073]} c="#33251e" />}
          <Chevelure style={base.cheveux} couleur={base.couleurCheveux} sousCasque={Boolean(casqueCouleur)} />
          {base.pilosite && base.pilosite !== 'aucune' && <Pilosite style={base.pilosite} couleur={base.couleurCheveux ?? '#211b19'} />}
          {base.cheveux === 'foulard' && !casqueCouleur && <><Galbe p={[0, .115, -.015]} s={[.17, .13, .15]} c={haut} /><Galbe p={[.1, .245, -.015]} s={[.087, .08, .075]} c={base.accent} /><mesh position={[0, .09, 0]} rotation={[Math.PI / 2, .13, 0]}><torusGeometry args={[.153, .018, 8, 32]} /><meshStandardMaterial color={base.accent} /></mesh></>}
          {(base.lunettes || prof) && <>{[-.059, .059].map(x => <mesh key={x} position={[x, .018, .146]}><torusGeometry args={[.037, .004, 6, 20]} /><meshStandardMaterial color="#704b2b" metalness={.5} /></mesh>)}<Piece p={[0, .02, .15]} s={[.04, .005, .008]} c="#704b2b" /></>}
          {casqueCouleur && <><Galbe p={[0, .14, -.005]} s={[.177, .115, .169]} c={casqueCouleur} rugosite={.42} /><Galbe p={[0, .085, .047]} s={[.192, .016, .194]} c={casqueCouleur} /><Piece p={[0, .238, .025]} s={[.024, .027, .2]} c={base.accent} /><Piece p={[0, .16, .154]} s={[.065, .035, .008]} c="#244e53" /></>}
        </group>
        {[-1, 1].map((s, j) => <group key={`membres-${s}`}>
          <group ref={v => { membres.current[j] = v; }} position={[s * .225, 1.345, 0]} rotation={[0, 0, s * .09]}>
            <Galbe p={[0, -.095, 0]} s={[.079, .155, .082]} c={gilet ? '#253d51' : haut} />
            <Piece p={[0, -.19, .056]} s={[.12, .027, .022]} c={base.accent} />
            <group position={[0, -.255, 0]} rotation={[-.16, 0, 0]}>
              <Coupe points={AVANT_BRAS} p={[0, -.23, 0]} couleur={peau} profondeur={1} />
              <Galbe p={[0, -.249, .01]} s={[.047, .069, .03]} c={peau} />
              <Galbe p={[-s * .037, -.23, .026]} s={[.016, .034, .019]} c={peau} />
              {j === 0 && <><Piece p={[0, -.196, .045]} s={[.09, .045, .025]} c="#263b3c" /><Piece p={[0, -.196, .061]} s={[.052, .034, .006]} c="#afbeb7" /></>}
            </group>
          </group>
          <group ref={v => { membres.current[j + 2] = v; }} position={[s * .095, .88, 0]}>
            <Coupe points={CUISSE} p={[0, -.39, 0]} couleur={base.pantalon} profondeur={1.05} />
            {!base.feminin && <Piece p={[s * .075, -.15, .03]} s={[.04, .14, .135]} c={base.pantalon} />}
            <group ref={v => { genoux.current[j] = v; }} position={[0, -.39, 0]}>
              <Coupe points={MOLLET} p={[0, -.38, 0]} couleur={jupe ? peau : base.pantalon} profondeur={1.05} />
              <Galbe p={[0, -.37, .05]} s={[.082, .081, .147]} c={base.chaussures} rugosite={.7} />
              <Piece p={[0, -.43, .054]} s={[.158, .036, .277]} c={base.tenue === 'tshirt' ? '#fff4dc' : '#342c25'} />
              {[-.035, 0, .035].map(z => <Piece key={z} p={[0, -.315, .073 + z]} s={[.076, .008, .012]} c={base.accent} />)}
            </group>
          </group>
        </group>)}
        {(base.tenue === 'tshirt' || base.tenue === 'chemise') && <><Piece p={[0, 1.22, .161]} s={[.036, .49, .022]} c="#3d342b" r={-.48} /><Galbe p={[.18, .99, .1]} s={[.11, .15, .071]} c={base.tenue === 'chemise' ? '#b37d42' : '#25383c'} /><Piece p={[.18, 1.07, .17]} s={[.14, .012, .015]} c={base.accent} /></>}
        {reconnu === 'awa' && <group position={[-.24, .98, -.02]} rotation={[0, 0, -.1]}><mesh rotation={[0, 0, .1]}><cylinderGeometry args={[.037, .037, .38, 16]} /><meshStandardMaterial color="#efe8d7" /></mesh><Piece p={[0, 0, .037]} s={[.055, .04, .01]} c="#326777" /></group>}
      </group>
      <group><BlocsInstances blocs={silhouette} arrondi /></group>
    </Detailed>
    {nom && <group ref={etiquette}><Billboard position={[0, 2.17, 0]}><Text fontSize={.14} color="#fff4d9" outlineColor="#193d39" outlineWidth={.012}>{nom}</Text></Billboard></group>}
  </group>;
}
