'use client';

import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import { BlocsInstances } from './blocs-instances';
import { Bungalow, CamionLivraison } from './chantier-vivant';
import { Boite, Cyl, Enseigne, Mur, MursCoupe, Plafonniers, Sol, SolCarrele, Verre } from './decors-lieux';
import { HumainMonde } from './humain-monde';
import type { ProprietesDecor } from './interieur-lieu-programme';
import { MateriauMonde } from './materiaux-monde';

// Décors des lieux de métier : Maison des ingénieurs, atelier de formation, plateforme logistique, Tour BTP Life.
// Chaque intérieur évolue avec les étapes validées (faites) ; ce qu'il faut lire est tourné vers le sud.

function Gens({ p, r = 0, assis = false, prof = false, casque = false, variante = 0 }: { p: V3; r?: number; assis?: boolean; prof?: boolean; casque?: boolean; variante?: number }) {
  return <group position={p} rotation={[0, r, 0]}><HumainMonde assis={assis} prof={prof} casque={casque} variante={variante} /></group>;
}

/** Rangée de postes de travail tournés vers le nord : plateau, écrans, chaises (les écrans portent la couleur du logiciel). */
function postes(blocs: BlocArchitecture[], x1: number, x2: number, z: number, n: number) {
  const pas = (x2 - x1) / n;
  blocs.push({ position: [(x1 + x2) / 2, .74, z], taille: [x2 - x1, .05, .8], couleur: '#E6E3DA', rotation: 0 });
  for (let i = 0; i < n; i++) {
    const x = x1 + pas * (i + .5);
    blocs.push({ position: [x, .37, z - .3], taille: [.05, .74, .05], couleur: '#5E6B70', rotation: 0 });
    blocs.push({ position: [x, .45, z + .7], taille: [.46, .06, .46], couleur: '#2B3A44', rotation: 0 }, { position: [x, .72, z + .92], taille: [.46, .5, .05], couleur: '#2B3A44', rotation: 0 });
  }
}
function Ecrans({ x1, x2, z, n, couleur }: { x1: number; x2: number; z: number; n: number; couleur: string }) {
  const pas = (x2 - x1) / n;
  return <>{Array.from({ length: n }, (_, i) => <group key={i}>
    <Boite p={[x1 + pas * (i + .5), 1.03, z - .2]} s={[.6, .38, .03]} c="#1C1C1E" />
    <Boite p={[x1 + pas * (i + .5), 1.03, z - .18]} s={[.55, .32, .01]} c="#10202A" emissif={couleur} />
  </group>)}</>;
}
function Plante({ x, z }: { x: number; z: number }) {
  return <group><Cyl p={[x, .3, z]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[x, 1.2, z]} castShadow><coneGeometry args={[.55, 1.4, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>;
}

// ─── Maison des ingénieurs ───

export function DecorBureauEtudes({ faites }: ProprietesDecor) {
  const mobilier = useMemo(() => { const b: BlocArchitecture[] = []; postes(b, -6, 2, -2.7, 4); postes(b, -6, 2, .7, 4); return b; }, []);
  // Maquette de la structure : dalle de sol, poteaux, semelles, poutres, plancher, puis le visa.
  const poteaux = [-1.4, 0, 1.4].flatMap(x => [-.8, .8].map(z => [7 + x, -2 + z] as [number, number]));
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[22, 16]} /><MateriauMonde type="wood_floor" couleur="#B79063" echelle={2.2} relief={.5} rugosite={.7} /></mesh>
    <MursCoupe hx={11} hz={8} hauteur={3.8} c="#EEEAE2" />
    <Text position={[-4, 3.25, -7.95]} fontSize={.3} color="#2F4F5F" anchorX="center" anchorY="middle" letterSpacing={.06}>MAISON DES INGÉNIEURS · BUREAU D’ÉTUDES</Text>
    {/* Tableau des compétences (service), au mur nord. */}
    <group position={[1, 1.9, -7.95]}>
      <Boite p={[0, 0, 0]} s={[2.8, 1.8, .05]} c="#6B4A33" /><Boite p={[0, 0, .03]} s={[2.6, 1.6, .02]} c="#F7F4EC" />
      <Text position={[0, .62, .05]} fontSize={.15} color="#2F4F5F" anchorX="center" anchorY="middle">TABLEAU DES COMPÉTENCES</Text>
      {['Béton et ferraillage', 'Géotechnique', 'Lecture de plans', 'Contrôle qualité'].map((nom, i) => <group key={nom}>
        <Text position={[-1.15, .3 - i * .28, .05]} fontSize={.09} color="#33464A" anchorX="left" anchorY="middle">{nom}</Text>
        <Boite p={[.65, .3 - i * .28, .045]} s={[1, .07, .005]} c="#E1E4E6" /><Boite p={[.2 + (.35 + i * .1) / 2, .3 - i * .28, .05]} s={[.35 + i * .1, .07, .005]} c="#3E8E5A" />
      </group>)}
    </group>
    {/* Archives : armoires à plans, rouleaux ; traceur au coin nord-est. */}
    <Boite p={[-8, .55, -7.3]} s={[5.2, 1.1, 1.4]} c="#5E6B70" />
    {Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[-9.8 + i * .7, 1.2, -7.2]} r={.06} h={.9} c={i % 2 ? '#F2EEE4' : '#D9E4EC'} rot={[0, 0, Math.PI / 2]} />)}
    <Boite p={[10.4, .6, -7.2]} s={[1.2, 1.2, 1.6]} c="#2B2B2E" /><Boite p={[10.4, 1.22, -6.6]} s={[1, .02, .6]} c="#FFFFFF" />
    {/* Postes de calcul : écrans de modèles aux éléments finis, ingénieurs au travail. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    <Ecrans x1={-6} x2={2} z={-2.7} n={4} couleur="#3E6F9E" /><Ecrans x1={-6} x2={2} z={.7} n={4} couleur="#3E8E7A" />
    <Gens p={[-5, 0, -2]} r={Math.PI} assis prof variante={2} /><Gens p={[-1, 0, -2]} r={Math.PI} assis variante={3} /><Gens p={[-3, 0, 1.4]} r={Math.PI} assis prof variante={0} />
    {/* La maquette de la structure se monte au fil de l'étude. */}
    <Boite p={[7, .45, -2]} s={[4, .9, 2.8]} c="#8B6A45" /><Boite p={[7, .91, -2]} s={[3.8, .02, 2.6]} c="#E8E2D6" />
    {faites >= 1 && <Boite p={[7, .95, -2]} s={[3.4, .04, 2.2]} c="#BDB8AE" />}
    {faites >= 3 && poteaux.map(([x, z]) => <Boite key={`s${x}${z}`} p={[x, .99, z]} s={[.3, .05, .3]} c="#7A7268" />)}
    {faites >= 2 && poteaux.map(([x, z]) => <Boite key={`p${x}${z}`} p={[x, 1.2, z]} s={[.08, .4, .08]} c="#CFC9BF" />)}
    {faites >= 4 && [-.8, .8].map(z => <Boite key={z} p={[7, 1.42, -2 + z]} s={[3, .07, .07]} c="#C1502E" />)}
    {faites >= 5 && <Boite p={[7, 1.47, -2]} s={[3.2, .04, 2]} c="#E6E1D8" />}
    {faites >= 6 && <Enseigne p={[7, 1.85, -.75]} largeur={1.1} hauteur={.34} fond="#2F8F5B" texte="VISA OBTENU" taille={.1} />}
    {/* Bureau d'Inès : ordinateur, plans roulés, son casque de chantier. */}
    <Boite p={[7, .74, 3.5]} s={[3.2, .05, 1]} c="#8B6A45" />
    {[[-1.5, -.42], [1.5, -.42], [-1.5, .42], [1.5, .42]].map(([x, z]) => <Boite key={`${x}${z}`} p={[7 + x, .37, 3.5 + z]} s={[.05, .74, .05]} c="#5A3E2B" />)}
    <Boite p={[6.5, 1.02, 3.2]} s={[.6, .38, .03]} c="#1C1C1E" /><Boite p={[6.5, 1.02, 3.22]} s={[.55, .32, .01]} c="#10202A" emissif="#3E6F9E" />
    <Cyl p={[7.6, .8, 3.5]} r={.05} h={.8} c="#F2EEE4" rot={[0, .3, Math.PI / 2]} />
    <mesh position={[8.2, .82, 3.7]}><sphereGeometry args={[.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#F2F0EA" /></mesh>
    {/* Table de revue : plans étalés. */}
    <Boite p={[-8, .74, 3.8]} s={[2.8, .05, 1.6]} c="#8B6A45" /><Boite p={[-8, .77, 3.8]} s={[2.4, .005, 1.2]} c="#E9F0F5" />
    {[3.5, 3.8, 4.1].map(z => <Boite key={z} p={[-8, .775, z]} s={[2, .002, .01]} c="#3E6F9E" />)}
    <Gens p={[-8, 0, 2.8]} prof variante={1} />
    <Plante x={-10.3} z={7.2} /><Plante x={10.3} z={7.2} />
    <Plafonniers points={[[-7, 3.5, -3], [-1, 3.5, -3], [6, 3.5, -3], [-7, 3.5, 3], [-1, 3.5, 3], [6, 3.5, 3]]} couleur="#F4F7FF" />
  </>;
}

// ─── Atelier de formation ───

/** Ce que montre le grand écran : le logiciel de l'étape en cours. */
const ECRANS_ATELIER = [
  { titre: 'TABLEUR · MÉTRÉ', couleur: '#2E8B57' }, { titre: 'PLAN NUMÉRIQUE · CALQUES', couleur: '#3E6F9E' },
  { titre: 'PLANNING · GANTT', couleur: '#B8742E' }, { titre: 'RAPPORT JOURNALIER', couleur: '#5E6B70' }, { titre: 'MAQUETTE BIM', couleur: '#7A4A9E' },
];

export function DecorAtelier({ faites }: ProprietesDecor) {
  const mobilier = useMemo(() => { const b: BlocArchitecture[] = []; for (const z of [-2.5, 0, 2.5]) postes(b, -8.5, 1.5, z, 5); return b; }, []);
  const ecran = ECRANS_ATELIER[Math.min(faites, ECRANS_ATELIER.length - 1)];
  return <>
    <SolCarrele largeur={22} profondeur={16} c="#CFCFCB" joint="#BABAB5" pas={.6} />
    <MursCoupe hx={11} hz={8} hauteur={3.6} c="#F0EFEA" />
    <Boite p={[0, 1.8, -7.98]} s={[22, 3.6, .02]} c="#3A4048" />
    <Text position={[5.5, 3.1, -7.95]} fontSize={.3} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.06}>ATELIER DE FORMATION</Text>
    <Text position={[5.5, 2.7, -7.95]} fontSize={.14} color="#C9CED6" anchorX="center" anchorY="middle">Les logiciels du chantier</Text>
    {/* Grand écran : le logiciel de l'étape du jour. */}
    <group position={[-2, 2, -7.9]}>
      <Boite p={[0, 0, 0]} s={[4.6, 2.5, .06]} c="#111214" /><Boite p={[0, 0, .035]} s={[4.4, 2.3, .01]} c="#F4F6F8" emissif="#DDE6EE" />
      <Boite p={[0, .98, .04]} s={[4.4, .3, .005]} c={ecran.couleur} emissif={ecran.couleur} />
      <Text position={[0, .98, .05]} fontSize={.14} color="#FFFFFF" anchorX="center" anchorY="middle">{ecran.titre}</Text>
      {faites === 2 ? [0, 1, 2, 3].map(i => <Boite key={i} p={[-1.4 + i * .55 + i * .2, .5 - i * .38, .045]} s={[.9 + (i % 2) * .4, .2, .005]} c={['#B8742E', '#C1502E', '#2E8B57', '#3E6F9E'][i]} />)
        : Array.from({ length: 5 }, (_, i) => <Boite key={i} p={[0, .55 - i * .32, .045]} s={[3.8, .015, .005]} c="#B9C2C8" />)}
    </group>
    {/* Trois rangs de postes, stagiaires au travail. */}
    <BlocsInstances blocs={mobilier} interactif={false} />
    {[-2.5, 0, 2.5].map(z => <Ecrans key={z} x1={-8.5} x2={1.5} z={z} n={5} couleur={ecran.couleur} />)}
    {[[-7.5, -2.5, 1], [-3.5, -2.5, 4], [-5.5, 0, 0], [-1.5, 0, 3], [-7.5, 2.5, 2], [.5, 2.5, 1]].map(([x, z, v]) => <Gens key={`${x}${z}`} p={[x, 0, z + .7]} r={Math.PI} assis variante={v} />)}
    {/* Imprimante 3D : la maquette imprimée grandit avec la formation. */}
    <Boite p={[7.5, .45, -3]} s={[3, .9, 2]} c="#5E6B70" /><Boite p={[7.5, .91, -3]} s={[3.1, .02, 2.1]} c="#E6E3DA" />
    <group position={[6.8, .92, -3.2]}>
      {[[-.35, -.35], [.35, -.35], [-.35, .35], [.35, .35]].map(([x, z]) => <Boite key={`${x}${z}`} p={[x, .5, z]} s={[.04, 1, .04]} c="#2B2B2E" />)}
      <Boite p={[0, 1, 0]} s={[.78, .04, .78]} c="#2B2B2E" />
      <Boite p={[0, .05 + Math.min(faites, 5) * .06, 0]} s={[.4, .1 + Math.min(faites, 5) * .12, .4]} c="#E9C46A" />
    </group>
    {[[8.4, -3.4], [8.6, -2.6]].map(([x, z], i) => <Boite key={i} p={[x, .99 + i * .05, z]} s={[.3, .14 + i * .1, .3]} c={i ? '#E9C46A' : '#C9CED6'} />)}
    {/* Rayon des logiciels (service) : boîtes et manuels, mur est. */}
    <Boite p={[10.6, 1.4, 3]} s={[.6, 2.8, 4]} c="#6B4A33" />
    {Array.from({ length: 24 }, (_, i) => <Boite key={i} p={[10.4, .4 + Math.floor(i / 6) * .6, 1.4 + (i % 6) * .62]} s={[.25, .42, .5]} c={['#2E8B57', '#3E6F9E', '#B8742E', '#7A4A9E', '#C1502E'][i % 5]} />)}
    <Enseigne p={[10.25, 3.1, 3]} r={-Math.PI / 2} largeur={2.6} hauteur={.4} fond="#3A4048" texte="LOGICIELS" taille={.2} />
    <Boite p={[-10.3, 1, -7.3]} s={[1.3, 2, 1.3]} c="#5E6B70" />
    <Plante x={-10.3} z={7.2} /><Plante x={10.3} z={7.2} />
    <Plafonniers points={[[-7, 3.3, -3], [-1, 3.3, -3], [6, 3.3, -3], [-7, 3.3, 3], [-1, 3.3, 3], [6, 3.3, 3]]} couleur="#F4F7FF" />
  </>;
}

// ─── Plateforme logistique ───

export function DecorLogistique({ faites }: ProprietesDecor) {
  const stock = useMemo(() => {
    const b: BlocArchitecture[] = [];
    // Racks : montants bleus, lisses orange ; palettes sur trois niveaux, de plus en plus pleins une fois rangés.
    for (let i = 0; i <= 6; i++) b.push({ position: [-14 + i * 2, 1.6, -9.9], taille: [.12, 3.2, .12], couleur: '#2F6E8E', rotation: 0 }, { position: [-14 + i * 2, 1.6, -7.5], taille: [.12, 3.2, .12], couleur: '#2F6E8E', rotation: 0 });
    for (const y of [.15, 1.2, 2.25]) b.push({ position: [-8, y, -9.9], taille: [12.2, .1, .1], couleur: '#E86A2E', rotation: 0 }, { position: [-8, y, -7.5], taille: [12.2, .1, .1], couleur: '#E86A2E', rotation: 0 });
    const niveaux = faites >= 2 ? 3 : 2;
    for (let n = 0; n < niveaux; n++) for (let i = 0; i < 6; i++) b.push({ position: [-13 + i * 2, .55 + n * 1.05, -8.7], taille: [1.6, .7, 1.8], couleur: ['#DCCFB2', '#9E9A91', '#C9B79A'][(i + n) % 3], rotation: 0 });
    return b;
  }, [faites]);
  const charge = faites >= 4;
  return <>
    <Sol largeur={30} profondeur={22} c="#A8A49C" echelle={4} />
    {/* Clôture et portail. */}
    <Mur p={[0, 1.2, -11.1]} s={[30.4, 2.4, .2]} c="#D9D2C2" />
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 15.1, 1.2, 0]} s={[.2, 2.4, 22.4]} c="#D9D2C2" />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * 8.65, .6, 11.1]} s={[12.9, 1.2, .2]} c="#D9D2C2" />)}
    {/* Entrepôt : toit sur le fond seulement, racks et palettes ; quai et portes sectionnelles. */}
    <mesh position={[-1, 5.2, -10.2]} castShadow receiveShadow><boxGeometry args={[28, .06, 2]} /><MateriauMonde type="corrugated_iron" couleur="#C9CDC4" echelle={1.6} relief={.9} rugosite={.6} metal={.4} /></mesh>
    <BlocsInstances blocs={stock} interactif={false} />
    <Boite p={[7.7, .45, -9.1]} s={[13.4, .9, 3]} c="#8E8A82" />
    <Boite p={[7.7, .92, -7.62]} s={[13.4, .06, .08]} c="#E9C46A" />
    {[4.25, 7.7, 10.25].map(x => <Boite key={x} p={[x, 2.4, -10.95]} s={[2.6, 3, .08]} c="#B9BDB5" metal={.3} />)}
    <Text position={[7.7, 4.3, -10.9]} fontSize={.4} color="#2B3A44" anchorX="center" anchorY="middle" letterSpacing={.06}>PLATEFORME LOGISTIQUE</Text>
    {/* Camions à quai, chargés une fois l'étape du chargement atteinte. */}
    <CamionLivraison position={[4.25, 0, -4.2]} rotation={-Math.PI / 2} chargement={charge ? 'ciment' : null} />
    <CamionLivraison position={[10.25, 0, -4.2]} rotation={-Math.PI / 2} chargement={charge ? 'fers' : faites >= 1 ? 'agglos' : null} />
    {/* Conteneurs : le premier ouvert une fois réceptionné. */}
    {[[-11.3, 3, '#B8442E'], [-11.3, 5.2, '#2F6E8E']].map(([x, z, c], i) => <group key={i}>
      <Boite p={[x as number, 1.3, z as number]} s={[6, 2.6, 2.1]} c={c as string} metal={.3} />
      {i === 0 && faites >= 1 && <Boite p={[-8.25, 1.3, 2.35]} s={[.05, 2.4, 1]} c="#8E2E1E" />}
    </group>)}
    {/* Bureau du dispatch, panneau des tournées, chariot garé, chef de quai et magasiniers. */}
    <Bungalow position={[12.4, 0, 6]} taille={[4, 2.6, 4.8]} rotation={-Math.PI / 2} nuit={false} libelle="DISPATCH" casques={false} />
    <group position={[14.9, 1.8, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
      <Boite p={[0, 0, 0]} s={[3, 1.6, .06]} c="#1C1C1E" /><Boite p={[0, 0, .035]} s={[2.8, 1.4, .01]} c="#0F2A33" emissif="#123844" />
      <Text position={[0, .5, .05]} fontSize={.14} color="#7FD6C9" anchorX="center" anchorY="middle">TOURNÉES DU JOUR</Text>
      {['Chantier A · béton · 7 h', 'Chantier B · agglos · 9 h', 'Chantier C · fers · 10 h'].map((l, i) => <Text key={l} position={[-1.25, .18 - i * .26, .05]} fontSize={.1} color={faites >= 3 ? '#F4F6F8' : '#7C8A90'} anchorX="left" anchorY="middle">{l}</Text>)}
    </group>
    <group position={[-1, 0, -3.6]}>
      <Boite p={[0, .55, 0]} s={[1.1, .8, 1.7]} c="#E8B23A" /><Boite p={[0, .6, -.7]} s={[1.1, .9, .4]} c="#4B4F52" />
      {[-1, 1].map(a => <Boite key={a} p={[a * .4, 1.5, -.2]} s={[.06, 1.9, .06]} c="#2B2B2E" />)}<Boite p={[0, 2.4, -.2]} s={[1, .06, 1.2]} c="#2B2B2E" />
      {[-.3, .3].map(a => <Boite key={`f${a}`} p={[a, .15, 1.2]} s={[.12, .05, 1.1]} c="#4B4F52" />)}
    </group>
    <Gens p={[7.2, 0, -7.9]} casque variante={1} /><Gens p={[-6, 0, -6.4]} casque variante={0} r={Math.PI} />
  </>;
}

// ─── Tour BTP Life ───

export function DecorEntreprise({ faites }: ProprietesDecor) {
  const mobilier = useMemo(() => {
    const b: BlocArchitecture[] = []; postes(b, 1, 7, -2.5, 3); postes(b, 1, 7, 1, 3);
    // Chaises du conseil, de part et d'autre de la longue table.
    for (let x = -7.6; x <= -2.4; x += 1.3) for (const [z, r] of [[-6.95, 0], [-4.05, Math.PI]] as [number, number][]) b.push({ position: [x, .5, z], taille: [.5, .1, .5], couleur: '#2B2B2E', rotation: r }, { position: [x, .8, z + (r ? .23 : -.23)], taille: [.5, .55, .06], couleur: '#2B2B2E', rotation: r });
    return b;
  }, []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[24, 16]} /><MateriauMonde type="wood_floor" couleur="#A07850" echelle={2.2} relief={.5} rugosite={.6} /></mesh>
    {/* Façade vitrée au nord : la lagune et les tours du Plateau, au loin. */}
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 12.1, 1.9, 0]} s={[.2, 3.8, 16.4]} c="#E9E6E0" />)}
    {[-1, 1].map(cote => <Mur key={`s${cote}`} p={[cote * 6.85, .45, 8.1]} s={[10.5, .9, .2]} c="#E9E6E0" />)}
    <Verre p={[0, 1.9, -8.05]} s={[24.4, 3.8, .06]} c="#CFE3EA" opacite={.14} />
    {[-9, -3, 3, 9].map(x => <Boite key={x} p={[x, 1.9, -8.05]} s={[.12, 3.8, .14]} c="#3A4048" metal={.4} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.03, -42]}><planeGeometry args={[140, 56]} /><meshStandardMaterial color="#4B8FA0" roughness={.3} /></mesh>
    {[[-30, 9, -55], [-18, 14, -60], [-6, 11, -52], [8, 18, -62], [22, 12, -56], [34, 8, -50]].map(([x, h, z]) => <Boite key={`${x}${z}`} p={[x, h / 2, z]} s={[6, h, 6]} c="#9FB4C0" />)}
    <Text position={[0, 3.45, -7.9]} fontSize={.3} color="#2B3A44" anchorX="center" anchorY="middle" letterSpacing={.08}>BTP LIFE CONSTRUCTION</Text>
    {/* Salle du conseil : longue table, administrateurs ; le dossier d'appel d'offres posé dessus. */}
    <Boite p={[-5, .74, -5.5]} s={[6.4, .06, 2.2]} c="#3A2A20" /><Cyl p={[-5, .37, -5.5]} r={.3} h={.74} c="#2B2B2E" />
    <BlocsInstances blocs={mobilier} interactif={false} />
    {[-7.6, -5, -2.4].map((x, i) => <Gens key={x} p={[x, 0, -6.95]} assis prof variante={i} />)}
    {faites >= 1 && <Boite p={[-4.6, .82, -5.2]} s={[.4, .1, .3]} c="#2F6E8E" />}
    {/* Plateau des bureaux : le chiffrage, puis la trésorerie à l'écran. */}
    <Ecrans x1={1} x2={7} z={-2.5} n={3} couleur={faites >= 2 ? '#2E8B57' : '#3E6F9E'} /><Ecrans x1={1} x2={7} z={1} n={3} couleur={faites >= 3 ? '#B8742E' : '#3E6F9E'} />
    {[[2, -2.5, 3], [6, -2.5, 1], [4, 1, 0]].map(([x, z, v]) => <Gens key={`${x}${z}`} p={[x, 0, z + .7]} r={Math.PI} assis prof variante={v} />)}
    {/* Finances. */}
    <Boite p={[-8, .74, 3.5]} s={[3, .05, 1]} c="#8B6A45" />
    <Boite p={[-8.4, 1.03, 3.2]} s={[.6, .38, .03]} c="#1C1C1E" /><Boite p={[-8.4, 1.03, 3.22]} s={[.55, .32, .01]} c="#10202A" emissif={faites >= 3 ? '#3E8E5A' : '#2E5A78'} />
    <Gens p={[-8, 0, 2.6]} prof variante={0} />
    {/* Bureau du directeur : maquette d'un immeuble, trophées ; le bilan de l'exercice à la fin. */}
    <Boite p={[9, .74, 2.3]} s={[3.2, .06, 1.2]} c="#3A2A20" />
    {[[-1.5, -.5], [1.5, -.5], [-1.5, .5], [1.5, .5]].map(([x, z]) => <Boite key={`${x}${z}`} p={[9 + x, .37, 2.3 + z]} s={[.06, .74, .06]} c="#2B2B2E" />)}
    <Boite p={[9.8, 1.05, 2.2]} s={[.35, .55, .35]} c="#C9D6E3" /><Boite p={[9.8, 1.38, 2.2]} s={[.25, .1, .25]} c="#9FB4C0" />
    {[0, 1].map(i => <Cyl key={i} p={[8 + i * .3, .95, 2.05]} r={.06} h={.36} c="#C9A227" metal={.7} />)}
    {faites >= 5 && <Enseigne p={[9, 1.35, 2.85]} largeur={1.5} hauteur={.4} fond="#2F8F5B" texte="EXERCICE CLÔTURÉ" taille={.1} />}
    {/* Écran des marchés (service), au mur nord. */}
    <group position={[6, 2, -7.85]}>
      <Boite p={[0, 0, 0]} s={[3.2, 1.8, .06]} c="#111214" /><Boite p={[0, 0, .035]} s={[3, 1.6, .01]} c="#0F2A33" emissif="#123844" />
      <Text position={[0, .6, .05]} fontSize={.14} color="#7FD6C9" anchorX="center" anchorY="middle">APPELS D’OFFRES</Text>
      {['École de six classes', 'Voirie régionale', 'Immeuble de bureaux'].map((l, i) => <Text key={l} position={[-1.35, .25 - i * .27, .05]} fontSize={.11} color="#F4F6F8" anchorX="left" anchorY="middle">{l}</Text>)}
    </group>
    {/* Ascenseurs, plantes, éclairage. */}
    {[5.8, 7.2].map(z => <Boite key={z} p={[-11.95, 1.2, z]} s={[.06, 2.4, 1.1]} c="#AEB3B6" metal={.7} />)}
    <Plante x={11} z={7} /><Plante x={-6} z={7} />
    <Plafonniers points={[[-7, 3.5, -3], [-1, 3.5, -3], [6, 3.5, -3], [-7, 3.5, 3], [-1, 3.5, 3], [6, 3.5, 3]]} couleur="#FFF6E8" />
  </>;
}
