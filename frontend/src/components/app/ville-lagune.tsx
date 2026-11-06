'use client';

import { useFrame, ThreeEvent } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import { LIMITES_VILLE, QUARTIERS } from '@/lib/ville';
import { ArbresAbidjan, EauLagune, JardinsUrbains } from './ambiance-lagune';
import { DetailsAbidjan, FlaquesLumiere } from './details-abidjan';
import { MateriauMonde, SurfaceBloc, type MatiereMonde } from './materiaux-monde';
import { VoitureMonde } from './vehicule-monde';
import { CirculationVille, EtalRue, LigneElectrique, VehiculeGare } from './rue-abidjan';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import { phaseSignal } from '@/lib/itineraire-ville';
import { ParcsMonde } from './parcs-monde';
import { aDevanture, FacadeAbidjan } from './facades-abidjan';
import { construireArchitecture, STYLES_LIEUX, type BlocArchitecture } from '@/lib/architecture-ville';
import { construireVoirie } from '@/lib/voirie-ville';
import { BlocsInstances } from './blocs-instances';
import { ToitTuiles } from './toits-monde';
import { PlacePalmiers } from './place-palmiers';
import { BateauxPlage } from './bateaux-plage';
import {
  ARRETS_BUS, BANCS_PROMENADE, ETALS_RUE, FEUX_TRICOLORES, FILET_PLAGE, FLAMBOYANTS_CENTRE, GARDE_CORPS, GBAKAS_GARES, KIOSQUE_TRANSFERT,
  KIOSQUES_PLAGE, LAMPADAIRES_CENTRE, MOTOS_GAREES, PALMIERS, PANNEAUX_AFFICHAGE, PANNEAUX_RUE, PARASOLS_PLAGE, POTEAUX_ELECTRIQUES,
  REPERES_QUARTIERS, transatParasol, tronconsGardeCorps, VOITURES_GAREES, Z_ETALS,
} from '@/lib/decor-ville';

type V = [number, number, number];
function Bloc({ p, s, c, r = 0, e, m }: { p: V; s: V; c: string; r?: number; e?: string; m?: MatiereMonde }) {
  return <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow><boxGeometry args={s} />{e?<meshStandardMaterial color={c} emissive={e} emissiveIntensity={.65}/>:m?<MateriauMonde type={m} couleur={c} echelle={1.6} relief={.9} rugosite={.65} metal={.45}/>:<SurfaceBloc dimensions={s} couleur={c} mouillable/>}</mesh>;
}

function VoitureStationnee({ p, r = 0, c }: { p: V; r?: number; c: string }) {
  return <group position={p} rotation={[0,r,0]}><group scale={ECHELLE_PERSONNAGES}><VoitureMonde couleur={c}/></group></group>;
}
function VoitureStationneeAncienne({ p, r = 0, c }: { p: V; r?: number; c: string }) {
  return <group position={p} rotation={[0, r, 0]}>
    <Bloc p={[0, 0.52, 0]} s={[3.5, 0.58, 1.65]} c={c} />
    <mesh position={[-0.25, 1.05, 0]} castShadow><boxGeometry args={[1.8, 0.55, 1.42]} /><meshPhysicalMaterial color="#28434d" roughness={0.18} metalness={0.2} clearcoat={0.7} /></mesh>
    {[-1.05, 1.05].flatMap(x => [-0.84, 0.84].map(z => <mesh key={`${x}-${z}`} position={[x, 0.28, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.34, 0.34, 0.2, 16]} /><meshStandardMaterial color="#171b1d" roughness={0.95} /></mesh>))}
    {[-0.5, 0.5].map(z => <mesh key={z} position={[1.77, 0.58, z]}><boxGeometry args={[0.04, 0.2, 0.34]} /><meshStandardMaterial color="#fff1bf" emissive="#f2d077" emissiveIntensity={0.35} /></mesh>)}
  </group>;
}

function PanneauRue({ p, texte }: { p: V; texte: string }) {
  return <group position={p}><Bloc p={[0, 1.35, 0]} s={[0.1, 2.7, 0.1]} c="#344449" /><mesh position={[0, 2.65, 0]}><boxGeometry args={[3.2, 0.72, 0.12]} /><meshStandardMaterial color="#1d5558" roughness={0.55} /></mesh><Text position={[0, 2.65, 0.08]} fontSize={0.27} color="#fff3d2" anchorX="center" anchorY="middle">{texte}</Text></group>;
}
function PanneauAffichage({ p, titre, texte, r = 0, couleur = '#d89b3e' }: { p: V; titre: string; texte: string; r?: number; couleur?: string }) {
  return <group position={p} rotation={[0, r, 0]}>
    {[-1.65, 1.65].map(x => <Bloc key={x} p={[x, 1.3, 0]} s={[.13, 2.6, .13]} c="#344348" />)}
    <Bloc p={[0, 2.6, 0]} s={[4, 2.3, .22]} c="#25373d" />
    <Bloc p={[0, 2.6, .13]} s={[3.62, 1.92, .04]} c={couleur} e={couleur} />
    <Text position={[0, 2.93, .17]} fontSize={.3} maxWidth={3.2} textAlign="center" color="#17272c" anchorX="center">{titre}</Text>
    <Text position={[0, 2.42, .17]} fontSize={.17} maxWidth={3.1} textAlign="center" lineHeight={1.25} color="#fff6df" anchorX="center">{texte}</Text>
    <Bloc p={[0, 1.25, 0]} s={[4.4, .15, .7]} c="#706354" />
  </group>;
}
/** Cocotier à la taille de ceux des boulevards d'Abidjan : une fois et demie un lampadaire de quartier. */
function Palmier({ p, scale = 1 }: { p: V; scale?: number }) {
  return <group position={p} scale={scale * 1.25}>
    <mesh position={[0, 2.5, 0]} rotation={[0, 0, -0.08]} castShadow><cylinderGeometry args={[0.13, 0.26, 5, 12]} /><meshStandardMaterial color="#887053" roughness={1} /></mesh>
    <FeuillagePalmier />
    {[-.17, .17].map(x => <mesh key={x} position={[x + .2, 4.8, .12]} castShadow><sphereGeometry args={[.18, 8, 6]} /><meshStandardMaterial color="#697341" roughness={1} /></mesh>)}
  </group>;
}

/** Une foliole de palme : quatre triangles en V, nervure au milieu. */
function geometrieFoliole() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, -.11, -.04, .42, 0, .035, .55,
    0, .035, .55, -.11, -.04, .42, 0, -.2, 1,
    0, 0, 0, 0, .035, .55, .11, -.04, .42,
    0, .035, .55, 0, -.2, 1, .11, -.04, .42,
  ], 3));
  g.computeVertexNormals();
  return g;
}
const FOLIOLES_PAR_PALMIER = 216;
/** Les folioles d'un cocotier, dans le repère du palmier : neuf palmes de douze paires, qui s'inclinent vers le bout. */
function placerFolioles(appliquer: (matrice: THREE.Matrix4, sombre: boolean) => void) {
  const m = new THREE.Object3D();
  for (let frond = 0; frond < 9; frond++) {
    const angle = frond * Math.PI * 2 / 9;
    for (let leaf = 0; leaf < 12; leaf++) {
      const t = (leaf + .5) / 12, radius = t * 2.8;
      for (const side of [-1, 1]) {
        m.position.set(.2 + Math.sin(angle) * radius, 5.1 + Math.sin(t * Math.PI) * .55 - t * t * 1.2, Math.cos(angle) * radius);
        m.rotation.set(.18 + t * .6, angle + side * .95, 0);
        m.scale.setScalar(.9 * (1 - t * .65));
        m.updateMatrix();
        appliquer(m.matrix, frond % 3 !== 0);
      }
    }
  }
}

/** Feathered fronds, batched into one draw call per palm instead of solid paddles. */
function FeuillagePalmier() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(geometrieFoliole, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    let index = 0;
    const clair = new THREE.Color('#657b39'), sombre = new THREE.Color('#3e6336');
    placerFolioles((matrice, fonce) => { ref.current!.setMatrixAt(index, matrice); ref.current!.setColorAt(index++, fonce ? sombre : clair); });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, []);
  return <instancedMesh ref={ref} args={[geometry, undefined, FOLIOLES_PAR_PALMIER]} castShadow receiveShadow>
    <meshStandardMaterial roughness={.92} side={THREE.DoubleSide} />
  </instancedMesh>;
}

/** Tous les cocotiers de la ville en trois commandes de dessin (troncs, folioles, noix) au lieu de quatre par arbre : le
 * même dessin que Palmier, assemblé une fois pour toutes. */
const Palmiers = memo(function Palmiers({ palmiers }: { palmiers: readonly { p: readonly [number, number]; echelle: number; y: number }[] }) {
  const troncs = useRef<THREE.InstancedMesh>(null), folioles = useRef<THREE.InstancedMesh>(null), noix = useRef<THREE.InstancedMesh>(null);
  const geometrie = useMemo(geometrieFoliole, []);
  useEffect(() => () => geometrie.dispose(), [geometrie]);
  useLayoutEffect(() => {
    if (!troncs.current || !folioles.current || !noix.current) return;
    const arbre = new THREE.Object3D(), piece = new THREE.Object3D(), m = new THREE.Matrix4();
    const clair = new THREE.Color('#657b39'), sombre = new THREE.Color('#3e6336');
    let f = 0;
    palmiers.forEach(({ p: [x, z], echelle, y }, i) => {
      arbre.position.set(x, y, z); arbre.scale.setScalar(echelle * 1.25); arbre.updateMatrix();
      piece.position.set(0, 2.5, 0); piece.rotation.set(0, 0, -.08); piece.updateMatrix();
      troncs.current!.setMatrixAt(i, m.multiplyMatrices(arbre.matrix, piece.matrix));
      [-.17, .17].forEach((dx, k) => {
        piece.position.set(dx + .2, 4.8, .12); piece.rotation.set(0, 0, 0); piece.updateMatrix();
        noix.current!.setMatrixAt(i * 2 + k, m.multiplyMatrices(arbre.matrix, piece.matrix));
      });
      placerFolioles((matrice, fonce) => { folioles.current!.setMatrixAt(f, m.multiplyMatrices(arbre.matrix, matrice)); folioles.current!.setColorAt(f++, fonce ? sombre : clair); });
    });
    for (const mesh of [troncs.current, folioles.current, noix.current]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
    if (folioles.current.instanceColor) folioles.current.instanceColor.needsUpdate = true;
  }, [palmiers]);
  return <group>
    <instancedMesh ref={troncs} args={[undefined, undefined, palmiers.length]} castShadow><cylinderGeometry args={[0.13, 0.26, 5, 12]} /><meshStandardMaterial color="#887053" roughness={1} /></instancedMesh>
    <instancedMesh ref={folioles} args={[geometrie, undefined, palmiers.length * FOLIOLES_PAR_PALMIER]} castShadow receiveShadow><meshStandardMaterial roughness={.92} side={THREE.DoubleSide} /></instancedMesh>
    <instancedMesh ref={noix} args={[undefined, undefined, palmiers.length * 2]} castShadow><sphereGeometry args={[.18, 8, 6]} /><meshStandardMaterial color="#697341" roughness={1} /></instancedMesh>
  </group>;
});
function Banc({ p, r = 0 }: { p: V; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    {[0, 0.23, 0.46].map(z => <Bloc key={z} p={[0, 0.55, z]} s={[2.2, 0.12, 0.18]} c="#9b603c" />)}
    <Bloc p={[0, 0.98, -0.05]} s={[2.2, 0.55, 0.12]} c="#9b603c" />
    {[-0.8, 0.8].map(x => <Bloc key={x} p={[x, 0.25, 0.2]} s={[0.12, 0.5, 0.6]} c="#344449" />)}
  </group>;
}
function Parasol({ p, c }: { p: V; c: string }) {
  return <group position={p}>
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 3, 8]} /><meshStandardMaterial color="#796447" /></mesh>
    <mesh position={[0, 3, 0]} castShadow><coneGeometry args={[1.85, 0.65, 8]} /><meshStandardMaterial color={c} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.8, 0.8, 0.12, 12]} /><meshStandardMaterial color="#c18b53" /></mesh>
    {[-1, 1].map(x => <Bloc key={x} p={[x, 0.45, 0]} s={[0.5, 0.9, 0.5]} c="#eee0c3" />)}
  </group>;
}
/** Lampadaire de rue de 6 m : socle, mât effilé, crosse et tête LED tournée vers la chaussée (bras vers +x avant rotation). */
function Lampadaire({ p, r = 0 }: { p: V; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    <Bloc p={[0, .25, 0]} s={[.36, .5, .36]} c="#2a3437" />
    <mesh position={[0, 3.1, 0]} castShadow><cylinderGeometry args={[.07, .11, 5.6, 10]} /><meshStandardMaterial color="#2c383c" metalness={.5} roughness={.45} /></mesh>
    <mesh position={[.52, 5.86, 0]} rotation={[0, 0, -1.25]} castShadow><cylinderGeometry args={[.045, .045, 1.15, 8]} /><meshStandardMaterial color="#2c383c" metalness={.5} roughness={.45} /></mesh>
    <mesh position={[1.12, 6.02, 0]} castShadow><boxGeometry args={[.72, .14, .32]} /><meshStandardMaterial color="#1f2a2d" metalness={.4} roughness={.5} /></mesh>
    <mesh position={[1.12, 5.94, 0]}><boxGeometry args={[.62, .03, .26]} /><meshStandardMaterial color="#fff2bd" emissive="#ffd76a" emissiveIntensity={1.4} /></mesh>
  </group>;
}
/** Les lampadaires de la ville en cinq commandes de dessin (socle, mât, crosse, tête, LED) au lieu de cinq par lampadaire :
 * le même dessin que Lampadaire, assemblé une fois. */
const PIECES_LAMPADAIRE: { position: V; rotation: V; geometrie: THREE.BufferGeometry; couleur: string; metal: number; rugosite: number; emissive?: string }[] = [
  { position: [0, .25, 0], rotation: [0, 0, 0], geometrie: new THREE.BoxGeometry(.36, .5, .36), couleur: '#2a3437', metal: .2, rugosite: .7 },
  { position: [0, 3.1, 0], rotation: [0, 0, 0], geometrie: new THREE.CylinderGeometry(.07, .11, 5.6, 10), couleur: '#2c383c', metal: .5, rugosite: .45 },
  { position: [.52, 5.86, 0], rotation: [0, 0, -1.25], geometrie: new THREE.CylinderGeometry(.045, .045, 1.15, 8), couleur: '#2c383c', metal: .5, rugosite: .45 },
  { position: [1.12, 6.02, 0], rotation: [0, 0, 0], geometrie: new THREE.BoxGeometry(.72, .14, .32), couleur: '#1f2a2d', metal: .4, rugosite: .5 },
  { position: [1.12, 5.94, 0], rotation: [0, 0, 0], geometrie: new THREE.BoxGeometry(.62, .03, .26), couleur: '#fff2bd', metal: 0, rugosite: .5, emissive: '#ffd76a' },
];
const Lampadaires = memo(function Lampadaires({ lampadaires }: { lampadaires: readonly { p: readonly [number, number]; r: number }[] }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const pied = new THREE.Object3D(), piece = new THREE.Object3D(), m = new THREE.Matrix4();
    PIECES_LAMPADAIRE.forEach((p, k) => {
      const mesh = refs.current[k];
      if (!mesh) return;
      lampadaires.forEach(({ p: [x, z], r }, i) => {
        pied.position.set(x, 0, z); pied.rotation.set(0, r, 0); pied.updateMatrix();
        piece.position.set(...p.position); piece.rotation.set(...p.rotation); piece.updateMatrix();
        mesh.setMatrixAt(i, m.multiplyMatrices(pied.matrix, piece.matrix));
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    });
  }, [lampadaires]);
  return <group>{PIECES_LAMPADAIRE.map((p, k) => <instancedMesh key={k} ref={m => { refs.current[k] = m; }} args={[p.geometrie, undefined, lampadaires.length]} castShadow={!p.emissive}>
    <meshStandardMaterial color={p.couleur} metalness={p.metal} roughness={p.rugosite} emissive={p.emissive ?? '#000000'} emissiveIntensity={p.emissive ? 1.4 : 0} />
  </instancedMesh>)}</group>;
});
const TOUS_LES_LAMPADAIRES = [
  ...LAMPADAIRES_CENTRE.map(([x, z]) => ({ p: [x, z] as const, r: z < 0 ? -Math.PI / 2 : Math.PI / 2 })),
  ...REPERES_QUARTIERS.map(q => ({ p: q.lampadaire, r: 0 })),
];

function ArretBus({ p, r = 0 }: { p: V; r?: number }) {
  return <group position={p} rotation={[0, r, 0]}>
    <Bloc p={[0, 1.25, 0]} s={[3.5, 0.12, 1.5]} c="#d4ddd8" />
    <Bloc p={[0, 2.55, 0]} s={[3.8, 0.18, 1.7]} c="#9fb0b0" m="corrugated_iron" />
    {[-1.65, 1.65].map(x => <Bloc key={x} p={[x, 1.3, 0]} s={[0.1, 2.5, 0.1]} c="#304b54" />)}
    <Bloc p={[0, 0.55, 0.15]} s={[2.7, 0.16, 0.55]} c="#b67a49" />
    <Bloc p={[0, 1.45, -0.7]} s={[3.2, 2.1, 0.08]} c="#78a6aa" />
  </group>;
}
function Kiosque({ p }: { p: V }) {
  return <group position={p}><Bloc p={[0, 1.1, 0]} s={[3.6, 2.2, 2.8]} c="#c86e43" /><Bloc p={[0, 2.45, 0]} s={[4.2, 0.25, 3.4]} c="#f0d07c" m="corrugated_iron" /><Bloc p={[0, 1.25, 1.43]} s={[2.3, 1.05, 0.08]} c="#33555b" /><Textile p={[0, 2.25, 1.7]} /></group>;
}
function Textile({ p }: { p: V }) { return <group position={p}>{[-1.5, -0.5, 0.5, 1.5].map((x, i) => <Bloc key={x} p={[x, 0, 0]} s={[1, 0.18, 0.9]} c={i % 2 ? '#efe3bf' : '#3e7666'} />)}</group>; }

/** Original modular architecture: recessed glass, wraparound balconies and shopfronts. */
export const Architecture = memo(function Architecture({ width: w, height: h, depth: d, kind, color, nuit = false, slug = '' }: { width: number; height: number; depth: number; kind: string; color: string; nuit?: boolean; slug?: string }) {
  const devanture = aDevanture(slug);
  // Maquis et marché en tuiles rouges, les autres en terre cuite.
  const vivrier = slug === 'maquis' || slug === 'marche';
  const plan = useMemo(() => construireArchitecture(w, h, d, kind, color, devanture, nuit, vivrier ? '#b83a2a' : '#c9652f', STYLES_LIEUX[slug]), [w, h, d, kind, color, devanture, nuit, vivrier, slug]);
  return <group>
    <BlocsInstances blocs={plan.solides} interactif={false} mouillable />
    <BlocsInstances blocs={plan.vitres} matiere="vitre" interactif={false} />
    <BlocsInstances blocs={plan.lumieres} matiere="lumiere" interactif={false} />
    <BlocsInstances blocs={plan.fleurs} arrondi interactif={false} />
    {plan.toit && <ToitTuiles toit={plan.toit} />}
    {/* Simple click volume: no per-window intersection work when moving the mouse. */}
    <mesh position={[0, (kind === 'chantier' ? 7 : h) / 2, 0]}>
      <boxGeometry args={[w, kind === 'chantier' ? 7 : h, d]} /><meshBasicMaterial visible={false} />
    </mesh>
    {devanture && <FacadeAbidjan slug={slug} largeur={w} profondeur={d} nuit={nuit} />}
    {kind === 'commerce' && <>
      <Parasol p={[-3, 0, d / 2 + 4]} c={vivrier ? '#c8372d' : '#db9e54'} /><Parasol p={[3, 0, d / 2 + 4]} c={vivrier ? '#fff4e0' : '#f1ddab'} />
    </>}
  </group>;
});

function Bateau({ pause, offset, rythme = 1 }: { pause: boolean; offset: number; rythme?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current && !pause) ref.current.position.x = ((ref.current.position.x + Math.min(delta, 0.05) * 1.5 * rythme + 130) % 260) - 130; });
  return <group ref={ref} position={[offset, 0.3, 82]}><mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}><coneGeometry args={[1.6, 6, 4]} /><meshStandardMaterial color="#f3eee0" /></mesh><Bloc p={[0, 1, 0]} s={[2.8, 1.2, 1.8]} c="#3e7781" /><Bloc p={[0, 2.6, 0]} s={[0.12, 4, 0.12]} c="#614d3e" /><mesh position={[0, 3.2, 0.05]}><planeGeometry args={[3.4, 2.4]} /><meshStandardMaterial color="#f0dba7" side={THREE.DoubleSide} /></mesh></group>;
}
function Oiseaux({ pause }: { pause: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current && !pause) ref.current.rotation.y += delta * 0.09; });
  return <group ref={ref}>{Array.from({ length: 7 }, (_, i) => <group key={i} position={[28 + i * 4, 19 + i % 3, 15 + i * 3]} rotation={[0, i, 0]}><mesh rotation={[0, 0, 0.4]}><boxGeometry args={[1.1, 0.05, 0.22]} /><meshBasicMaterial color="#25393b" /></mesh><mesh rotation={[0, 0, -0.4]}><boxGeometry args={[1.1, 0.05, 0.22]} /><meshBasicMaterial color="#25393b" /></mesh></group>)}</group>;
}
function Fontaine() {
  return <group position={[0, 0, -52]}><mesh position={[0, 0.4, 0]}><cylinderGeometry args={[4.2, 4.5, 0.8, 32]} /><meshStandardMaterial color="#b5b4a5" /></mesh><mesh position={[0, 0.8, 0]}><cylinderGeometry args={[3.6, 3.6, 0.18, 32]} /><meshStandardMaterial color="#55a6b2" /></mesh>{[-1.8, 0, 1.8].map(x => <mesh key={x} position={[x, 2, 0]}><cylinderGeometry args={[0.08, 0.14, 2.5, 8]} /><meshStandardMaterial color="#9adbea" transparent opacity={0.75} /></mesh>)}</group>;
}

function FeuTricolore({ p, axe }: { p: V; axe: 'horizontal' | 'vertical' }) {
  const rouge = useRef<THREE.MeshStandardMaterial>(null);
  const orange = useRef<THREE.MeshStandardMaterial>(null);
  const vert = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const phase=phaseSignal(clock.elapsedTime,axe);
    if(rouge.current)rouge.current.emissiveIntensity=phase==='rouge'?2.2:.08;
    if(orange.current)orange.current.emissiveIntensity=phase==='orange'?2.4:.05;
    if(vert.current)vert.current.emissiveIntensity=phase==='vert'?2.2:.08;
  });
  return <group position={p}>
    <Bloc p={[0, 1.4, 0]} s={[0.12, 2.8, 0.12]} c="#2d393d" />
    <Bloc p={[0, 2.9, 0]} s={[0.42, 1.05, 0.32]} c="#202a2e" />
    {[[3.2, '#e95645', rouge], [2.9, '#eab83e', orange], [2.6, '#48b66f', vert]].map(([y, couleur, ref], i) => <mesh key={i} position={[0, y as number, 0.17]}><sphereGeometry args={[0.095, 10, 8]} /><meshStandardMaterial ref={ref as React.RefObject<THREE.MeshStandardMaterial>} color={couleur as string} emissive={couleur as string} emissiveIntensity={0.08} /></mesh>)}
  </group>;
}

/** A pedestrian square, tree-lined boulevards and a lagoon promenade. */
/** Tirets de chaussée, voirie (bordures, caniveaux, trottoirs, passages piétons) et garde-corps de la promenade : des
 * centaines de petits blocs regroupés en quelques commandes de dessin (une par matière) au lieu d'un maillage chacun. */
const BLOCS_REPETES: BlocArchitecture[] = [
  ...[-66, -10, 10].flatMap(z => Array.from({ length: 56 }, (_, i): BlocArchitecture => ({ position: [(i - 27.5) * 4.3, 0.08, z], taille: [2, 0.015, 0.1], couleur: '#e6dcbf', rotation: 0 }))),
  ...construireVoirie(),
  // Le garde-corps de la promenade, ouvert là où l'on descend à la plage (decor-ville.ts).
  ...tronconsGardeCorps().flatMap((t): BlocArchitecture[] => [
    ...t.poteaux.map((x): BlocArchitecture => ({ position: [x, 0.9, GARDE_CORPS.z], taille: [0.12, 1.4, 0.12], couleur: '#e1dfca', rotation: 0, matiere: 'metal' })),
    { position: [(t.de + t.a) / 2, 1.55, GARDE_CORPS.z], taille: [t.a - t.de, 0.08, 0.08], couleur: '#e1dfca', rotation: 0, matiere: 'metal' },
    { position: [(t.de + t.a) / 2, 1.1, GARDE_CORPS.z], taille: [t.a - t.de, 0.05, 0.05], couleur: '#e1dfca', rotation: 0, matiere: 'metal' },
  ]),
];

/** La nuit, la lumière des lampadaires du centre tombe sous leur tête, comme celle des lampadaires des places de quartier. */
const TACHES_LUMIERE: [number, number][] = [
  ...LAMPADAIRES_CENTRE.map(([x, z]): [number, number] => [x, z < 0 ? z + 1.12 : z - 1.12]),
  ...QUARTIERS.slice(1).map((q): [number, number] => [q.x - 3.68, q.z - 3.5]),
];

/** `rythme` suit la vitesse du temps (1x, 2x, 3x) : la circulation accélère avec l'horloge. */
/** `heure` (entière) règle la densité de la circulation : moins de véhicules la nuit, plus aux heures de pointe. */
export const PaysageLagune = memo(function PaysageLagune({ onDestination, pause = false, rythme = 1, artistique = true, heure = 12 }: { onDestination: (p: [number, number]) => void; pause?: boolean; rythme?: number; artistique?: boolean; heure?: number }) {
  const sol = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 5) onDestination([THREE.MathUtils.clamp(e.point.x, LIMITES_VILLE.minX, LIMITES_VILLE.maxX), THREE.MathUtils.clamp(e.point.z, LIMITES_VILLE.minZ, LIMITES_VILLE.maxZ)]); };
  const nuit = heure >= 19 || heure < 6;
  return <group onClick={sol}>
    <EauLagune pause={pause} /><JardinsUrbains /><ParcsMonde/>
    <DetailsAbidjan pause={pause} rythme={rythme} />
    <FlaquesLumiere points={TACHES_LUMIERE} nuit={nuit} />
    {FLAMBOYANTS_CENTRE.map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, .22, z]} receiveShadow><cylinderGeometry args={[1.6, 1.8, .44, 10]} /><meshStandardMaterial color="#ada78f" /></mesh>)}
    <ArbresAbidjan arbres={FLAMBOYANTS_CENTRE} flamboyants />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]} receiveShadow><planeGeometry args={[300, 260]} /><meshStandardMaterial color="#829079" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -40]} receiveShadow><planeGeometry args={[240, 176]} />{/* Pavés photographiques (Poly Haven, CC0) recolorés en grès chaud. */}<MateriauMonde type="brick_pavement_02" echelle={2.4} relief={.85} mouillable /></mesh>
    {[-66, -10, 10].map(z => <Bloc key={z} p={[0, 0.05, z]} s={[240, 0.04, 6]} c="#555d60" />)}
    {[-54, 54].map(x => <Bloc key={x} p={[x, 0.075, -40]} s={[6, 0.035, 176]} c="#555d60" />)}
    {/* Bordures, caniveaux, trottoirs et passages piétons, coupés aux carrefours : une vraie échelle routière. */}
    <BlocsInstances blocs={BLOCS_REPETES} interactif={false} mouillable />
    {FEUX_TRICOLORES.map(({ p: [x, z], axe }) => <FeuTricolore key={`signal-${x}-${z}`} p={[x, 0, z]} axe={axe} />)}
    {REPERES_QUARTIERS.map(q => <group key={q.nom} position={[q.x, 0, q.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}><ringGeometry args={[4.7, 5.1, 40]} /><meshStandardMaterial color="#8d9b7e" /></mesh>
      <Billboard position={[0, 4.2, 0]}><Text fontSize={0.52} color="#183c3d" outlineColor="#fff0d3" outlineWidth={0.055}>{q.nom}</Text></Billboard>
    </group>)}
    <Lampadaires lampadaires={TOUS_LES_LAMPADAIRES} />
    {/* Tous les cocotiers de la ville, dessinés en trois commandes (troncs, palmes, noix). */}
    <Palmiers palmiers={PALMIERS} />
    {/* Arrêts du bus de ligne sur l'avenue du Plateau (il s'y arrête), gare des gbakas à l'ouest, côté Jardins. */}
    {ARRETS_BUS.map(({ p: [x, z], r }) => <ArretBus key={`${x}-${z}`} p={[x, 0.1, z]} r={r} />)}
    {GBAKAS_GARES.map(({ p: [x, z], couleur }) => <VehiculeGare key={x} p={[x, 0, z]} type="gbaka" couleur={couleur} />)}
    <LigneElectrique z={POTEAUX_ELECTRIQUES.z} poteaux={POTEAUX_ELECTRIQUES.x} />
    {PANNEAUX_RUE.map(({ p: [x, z], texte }) => <PanneauRue key={texte} p={[x, 0, z]} texte={texte} />)}
    {PANNEAUX_AFFICHAGE.map(({ p: [x, z], r, titre, texte, couleur }) => <PanneauAffichage key={titre} p={[x, 0, z]} r={r} titre={titre} texte={texte} couleur={couleur} />)}
    <Bloc p={[-31.5, 0.08, -15.2]} s={[17, 0.05, 3.2]} c="#666b69" />
    <Bloc p={[31.5, 0.08, -74]} s={[22, 0.05, 5.5]} c="#666b69" />
    {VOITURES_GAREES.map(({ p: [x, z], couleur }) => <VoitureStationnee key={`${x}-${z}`} p={[x, 0, z]} c={couleur} />)}
    <PlaceCentrale artistique={artistique} />
    {/* Le commerce du trottoir, au sud de l'avenue de la Lagune, et les motos garées à côté. */}
    {ETALS_RUE.map(({ x, couleur }, i) => <EtalRue key={x} p={[x, 0.1, Z_ETALS]} r={Math.PI} couleur={couleur} vendeuse={i} />)}
    {MOTOS_GAREES.map(({ p: [x, z], r, couleur }) => <VehiculeGare key={`${x}-${z}`} p={[x, 0.1, z]} r={r} type="moto" couleur={couleur} />)}
    <Kiosque p={[KIOSQUE_TRANSFERT[0], 0, KIOSQUE_TRANSFERT[1]]} />
    {/* Beach district, waterfront and timber promenade. */}
    <Bloc p={[0, 0.08, 58]} s={[240, 0.16, 20]} c="#e7cf92" />
    <Bloc p={[0, -0.06, 82]} s={[300, 0.1, 30]} c="#44878b" />
    <Bloc p={[0, 0.18, 47]} s={[240, 0.35, 5]} c="#a58c6d" />
    {BANCS_PROMENADE.map(([x, z]) => <Banc key={x} p={[x, 0.3, z]} />)}
    {PARASOLS_PLAGE.map(([x, z], i) => { const [tx, tz] = transatParasol([x, z]); return <group key={x}><Parasol p={[x, 0.1, z]} c={i % 2 ? '#d4664f' : '#f1d471'} /><Bloc p={[tx, 0.18, tz]} s={[2.4, 0.18, 0.75]} c="#55a1a2" r={-0.15} /></group>; })}
    <group position={[FILET_PLAGE.x, 0.1, FILET_PLAGE.z]}><Bloc p={[0, 0.08, 0]} s={[12, 0.12, 7]} c="#e8d5a4" />{[-FILET_PLAGE.demiLargeur, FILET_PLAGE.demiLargeur].map(x => <Bloc key={x} p={[x, 1.4, 0]} s={[0.12, 2.8, 0.12]} c="#e8ece5" />)}<Bloc p={[0, 2.75, 0]} s={[12, 0.12, 0.12]} c="#e8ece5" /></group>
    {KIOSQUES_PLAGE.map(([x, z], i) => <group key={x} position={[x, 0, z]}><Kiosque p={[0, 0, 0]} />{i < 2 && <Parasol p={[3.3, 0, 2]} c="#efcf78" />}</group>)}
    {/* Les pirogues des pêcheurs, tirées sur le sable au bord de l'eau, et celles qui rentrent de la pêche. */}
    <BateauxPlage pause={pause} rythme={rythme} />
    <Fontaine /><CirculationVille pause={pause} rythme={rythme} heure={heure} /><Bateau pause={pause} offset={-60} rythme={rythme} /><Bateau pause={pause} offset={30} rythme={rythme} /><Oiseaux pause={pause} />
    {/* Skyline gives the playable district a wider urban context. */}
    {Array.from({ length: 12 }, (_, i) => <ArchitectureBlock key={i} i={i} />)}
  </group>;
});

/** Même secteur dans le jeu et dans l'atelier : la comparaison ne reconstruit pas un décor différent. */
export function PlaceCentrale({ artistique = true }: { artistique?: boolean }) {
  return <group>
    <mesh position={[0, .14, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[5.8, 64]} /><meshStandardMaterial color="#b99471" /></mesh>
    <mesh position={[0, .16, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.3, 5.5, 64]} /><meshStandardMaterial color="#eee2c3" /></mesh>
    {[-18, -9, 9, 18].flatMap(x => [-3.8, 3.8].map(z => <group key={`${x}-${z}`}>
      <Bloc p={[x, .35, z]} s={[3.8, .7, 2.6]} c="#adac92" />
      <Bloc p={[x, .73, z]} s={[3.5, .1, 2.3]} c="#596847" />
      {(!artistique || Math.abs(x) === 18) && <Palmier p={[x, .8, z]} scale={.8} />}
    </group>))}
    {!artistique && [-12, 12].map(x => <Banc key={x} p={[x, .2, 1.8]} r={Math.PI} />)}
    {artistique && <PlacePalmiers />}
  </group>;
}

export function ApercuPlaceCentrale({ artistique }: { artistique: boolean }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .03, -10]} receiveShadow><planeGeometry args={[90, 90]} /><MateriauMonde type="brick_pavement_02" echelle={2.4} relief={.85} /></mesh>
    {[-10, 10].map(z => <group key={z}>
      <Bloc p={[0, .05, z]} s={[90, .04, 6]} c="#555d60" />
      {Array.from({ length: 20 }, (_, i) => <Bloc key={i} p={[(i - 9.5) * 4.3, .08, z]} s={[2, .015, .1]} c="#e6dcbf" />)}
      {[-3.15, 3.15].map(o => <Bloc key={o} p={[0, .12, z + o]} s={[90, .2, .25]} c="#ede2c8" />)}
    </group>)}
    <PlaceCentrale artistique={artistique} />
    {[-14, 14].map(x => <Lampadaire key={x} p={[x, 0, -15]} />)}
    <VoitureStationnee p={[-27, 0, -15.2]} c="#d5c9aa" />
  </group>;
}
function ArchitectureBlock({ i }: { i: number }) {
  const h = 9 + (i * 7 % 20);
  return <group position={[(i - 5.5) * 20, 0, -145 - i % 3 * 7]}>
    <Bloc p={[0, h / 2, 0]} s={[8, h, 9]} c={['#9ea9a1', '#98a5a2', '#b8b6a4'][i % 3]} />
    {Array.from({ length: Math.floor(h / 3) }, (_, f) => <Bloc key={f} p={[0, f * 3 + 2, 4.55]} s={[7, 0.9, 0.08]} c="#6d898a" />)}
  </group>;
}
