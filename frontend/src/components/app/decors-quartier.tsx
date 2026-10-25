'use client';

import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import { BlocsInstances } from './blocs-instances';
import { Bungalow, Grue, OuvrierPoste } from './chantier-vivant';
import { Boite, Cyl, Enseigne, Mur } from './decors-lieux';
import { HumainMonde } from './humain-monde';
import type { ProprietesDecor } from './interieur-lieu-programme';
import { MateriauMonde } from './materiaux-monde';

// Décors des derniers bâtiments du quartier : la cour des Résidences des Jardins et le Chantier du Plateau.
// Dans les deux, chaque étape validée efface un problème du décor (la panne réparée, le danger corrigé).
// La caméra regarde depuis le sud-sud-est : façades, portes et panneaux lisibles sont tournés vers le sud ou l'est.

function Gens({ p, r = 0, casque = false, prof = false, variante = 0, echelle = 1 }: { p: V3; r?: number; casque?: boolean; prof?: boolean; variante?: number; echelle?: number }) {
  return <group position={p} rotation={[0, r, 0]} scale={echelle}><HumainMonde casque={casque} prof={prof} variante={variante} /></group>;
}

// ─── Résidences des Jardins ───

/** Façade d'immeuble vue de la cour : fenêtres, balcons au linge, climatiseurs ; `axe` 'z' = façade au sud, 'x' = à l'est. */
function facade(blocs: BlocArchitecture[], { x1, x2, z, axe, niveaux, couleurBalcon, portes }: {
  x1: number; x2: number; z: number; axe: 'z' | 'x'; niveaux: number; couleurBalcon: string; portes: number[];
}) {
  const poser = (u: number, y: number, profondeur: number, taille: V3, couleur: string) => blocs.push({
    position: axe === 'z' ? [u, y, z + profondeur] : [z + profondeur, y, u],
    taille: axe === 'z' ? taille : [taille[2], taille[1], taille[0]], couleur, rotation: 0,
  });
  const linges = ['#C8392E', '#F4C430', '#2E6FB0', '#F2EEDF', '#3E8E5A'];
  for (let niveau = 0; niveau < niveaux; niveau++) {
    const y = 1.5 + niveau * 3;
    for (let u = x1 + 1.2, k = 0; u < x2 - .8; u += 2.2, k++) {
      if (niveau === 0 && portes.some(p => Math.abs(p - u) < 1.1)) continue;
      poser(u, y, .02, [1.1, 1.3, .04], '#2B3A44');                      // vitre
      poser(u, y + .72, .05, [1.3, .1, .1], '#F2EEDF');                   // linteau
      if (niveau > 0 && k % 2 === 0) {
        poser(u, y - .9, .55, [1.9, .12, 1.1], '#D9D2C2');                // dalle du balcon
        poser(u, y - .45, 1.08, [1.9, .8, .05], couleurBalcon);            // garde-corps
        if (k % 4 === 0) for (let i = 0; i < 3; i++) poser(u - .5 + i * .5, y + .2, .8, [.32, .5, .03], linges[(k + i + niveau) % linges.length]);
      } else if (niveau > 0) poser(u + .8, y - .2, .25, [.7, .45, .5], '#F4F4F0'); // climatiseur
    }
  }
}

export function DecorJardins({ faites }: ProprietesDecor) {
  const facades = useMemo(() => {
    const b: BlocArchitecture[] = [];
    facade(b, { x1: -12.6, x2: -1.2, z: -6.6, axe: 'z', niveaux: 3, couleurBalcon: '#B8442E', portes: [-6.6] });
    facade(b, { x1: 1.2, x2: 12.6, z: -6.6, axe: 'z', niveaux: 3, couleurBalcon: '#2F6E8E', portes: [3.8, 9.4] });
    facade(b, { x1: -4.4, x2: 4, z: -10.6, axe: 'x', niveaux: 2, couleurBalcon: '#6B7A3F', portes: [0] });
    return b;
  }, []);
  // Les pannes encore à réparer, qui disparaissent une à une.
  const fuite = faites < 1, prise = faites < 2, fissure = faites < 3, moisissure = faites < 4, peinture = faites >= 5;
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[26, 18]} /><MateriauMonde type="brick_pavement_02" couleur="#D2C4AE" echelle={1.6} relief={.5} rugosite={.9} /></mesh>
    {/* Les immeubles : A (Madame Yao) et B (Monsieur Diallo, Mademoiselle Akissi) au nord, C (les Kouamé) à l'ouest. */}
    <Mur p={[-6.9, 4.5, -10.3]} s={[11.4, 9, 7.4]} c={peinture ? '#F0D9B8' : '#E2CBA8'} />
    <Mur p={[6.9, 4.5, -10.3]} s={[11.4, 9, 7.4]} c="#CFE0D6" />
    <Mur p={[-14.3, 3, -.2]} s={[7.4, 6, 8.4]} c="#E7C7A8" />
    <BlocsInstances blocs={facades} interactif={false} />
    {[[-6.6, -6.58, 'A'], [3.8, -6.58, 'B'], [9.4, -6.58, 'B']].map(([x, z, nom], i) => <group key={i}>
      <Boite p={[x as number, 1.1, z as number]} s={[1.2, 2.2, .06]} c="#6B4A33" />
      <Boite p={[x as number, 2.55, (z as number) + .3]} s={[1.8, .08, .6]} c="#5E6B70" />
      <Text position={[x as number, 2.85, (z as number) + .05]} fontSize={.22} color="#2B2B2E" anchorX="center" anchorY="middle">{`BÂTIMENT ${nom}`}</Text>
    </group>)}
    <Boite p={[-10.58, 1.1, 0]} s={[.06, 2.2, 1.2]} c="#6B4A33" />
    <Text position={[-10.55, 2.6, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={.22} color="#2B2B2E" anchorX="center" anchorY="middle">BÂTIMENT C</Text>
    {/* Toits : citernes noires et paraboles, comme partout à Abidjan. */}
    {[[-10, -11], [-3.6, -11.6], [4.4, -11], [10.6, -11.4]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, 9.6, z]} r={.6} h={1.2} c="#1C1C1E" /><Cyl p={[x, 10.25, z]} r={.25} h={.1} c="#1C1C1E" /></group>)}
    {[[-7.5, -7.4], [8, -7.6]].map(([x, z]) => <mesh key={x} position={[x, 9.3, z]} rotation={[-.9, 0, 0]}><cylinderGeometry args={[.45, .05, .2, 16]} /><meshStandardMaterial color="#E8ECEE" metalness={.4} /></mesh>)}
    {/* Jardin central : muret, pelouse, manguier, bancs. */}
    <Boite p={[0, .25, 0]} s={[5.6, .5, 4.8]} c="#B9A88E" />
    <Boite p={[0, .52, 0]} s={[5.2, .04, 4.4]} c="#5E8C3A" rugosite={1} />
    <Cyl p={[0, 2, -.4]} r={.3} haut={.22} h={3.2} c="#5A3E2B" />
    {([[0, 4.2, -.4, 2], [-1.2, 3.6, .5, 1.3], [1.2, 3.7, -1.1, 1.4]] as [number, number, number, number][]).map(([x, y, z, r]) => <mesh key={`${x}${z}`} position={[x, y, z]} castShadow><sphereGeometry args={[r, 14, 10]} /><meshStandardMaterial color="#3E6B32" roughness={.9} /></mesh>)}
    {[-1, 1].map(cote => <group key={cote}><Boite p={[cote * 2, .78, 1.8]} s={[1.6, .06, .45]} c="#8B6A45" /><Boite p={[cote * 2, 1.05, 2]} s={[1.6, .5, .05]} c="#7A5A3A" /></group>)}
    {/* Loge du gardien et local des compteurs. */}
    <Mur p={[-11, 1.5, 7.2]} s={[4, 3, 3.6]} c="#E8D3B5" />
    <Boite p={[-9.02, 1.1, 7.6]} s={[.06, 2.2, 1]} c="#6B4A33" /><Boite p={[-9.02, 1.6, 6.2]} s={[.06, 1, 1]} c="#2B3A44" />
    <Enseigne p={[-9, 2.65, 7.2]} r={Math.PI / 2} largeur={2.6} hauteur={.4} fond="#2F4F5F" texte="LOGE DU GARDIEN" taille={.17} />
    <Mur p={[11.7, 1.3, 5.7]} s={[2.6, 2.6, 3.8]} c="#C9C2B4" />
    <Enseigne p={[11.7, 2, 7.62]} largeur={2.4} hauteur={.4} fond="#5E6B70" texte="COMPTEURS · POUBELLES" taille={.15} />
    {/* Mur d'enceinte bas, portail au sud, bougainvillées. */}
    {[-1, 1].map(cote => <Mur key={cote} p={[cote * 7.5, .6, 9.1]} s={[11, 1.2, .2]} c="#E2CBA8" />)}
    {[-11, -5, 5, 11].map(x => <mesh key={x} position={[x, 1.4, 9.1]} castShadow><sphereGeometry args={[.8, 12, 8]} /><meshStandardMaterial color="#C2357A" roughness={.9} /></mesh>)}
    {/* Les pannes : la flaque chez Madame Yao, la prise noircie chez Monsieur Diallo, la fissure des Kouamé,
        les moisissures chez Mademoiselle Akissi ; et le rez-de-chaussée repeint une fois le devis accepté. */}
    {fuite && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.2, .012, -5.9]}><circleGeometry args={[.9, 24]} /><meshStandardMaterial color="#5F8FA6" roughness={.05} metalness={.3} transparent opacity={.7} /></mesh>}
    {prise ? <Boite p={[5.2, 1.4, -6.57]} s={[.9, .7, .02]} c="#1C1C1E" /> : <Boite p={[5.2, .6, -6.56]} s={[.12, .12, .02]} c="#F4F4F0" />}
    {fissure ? [[0, 0], [.2, .35], [.05, .7], [.3, 1.05], [.15, 1.4]].map(([dz, dy], i) => <Boite key={i} p={[-10.57, 1.2 + dy, 1.5 + dz]} s={[.02, .38, .04]} c="#3A2E24" r={0} />)
      : <Boite p={[-10.57, 1.9, 1.65]} s={[.02, 1.8, .7]} c="#EFE0C8" />}
    {moisissure ? [[0, 0, .5], [.4, .3, .35], [-.3, .5, .3], [.2, .8, .4]].map(([dx, dy, r], i) => <mesh key={i} position={[9.4 + 1.2 + dx, 4.6 + dy, -6.57]}><circleGeometry args={[r, 12]} /><meshStandardMaterial color="#2B2F2A" roughness={1} /></mesh>)
      : <Boite p={[10.6, 5, -6.56]} s={[.4, .4, .03]} c="#F4F4F0" />}
    {!peinture && <group position={[-8.2, 0, 5]}>
      <Boite p={[0, 1.5, 0]} s={[.08, 3, .08]} c="#B9BDB5" metal={.4} /><Boite p={[.5, 1.5, 0]} s={[.08, 3, .08]} c="#B9BDB5" metal={.4} />
      {[.6, 1.2, 1.8, 2.4].map(y => <Boite key={y} p={[.25, y, 0]} s={[.5, .05, .06]} c="#B9BDB5" metal={.4} />)}
      {[0, 1].map(i => <Cyl key={i} p={[1 + i * .4, .18, .4]} r={.15} h={.36} c={i ? '#F2EEDF' : '#E86A2E'} />)}
    </group>}
    {/* Les voisins à leur porte ; des enfants autour du manguier. */}
    <Gens p={[-7.8, 0, -6.1]} variante={1} /><Gens p={[2.6, 0, -6.1]} variante={3} /><Gens p={[10.6, 0, -6.1]} variante={4} />
    <Gens p={[-10, 0, 1.6]} r={Math.PI / 2} variante={0} /><Gens p={[-10, 0, 2.3]} r={Math.PI / 2} variante={1} />
    <Gens p={[4.3, 0, 2.4]} r={-.6} variante={0} echelle={.7} /><Gens p={[5.4, 0, 3.4]} r={2.4} variante={1} echelle={.68} />
  </>;
}

// ─── Chantier du Plateau ───

/** Échafaudage de façade : montants, planchers, plinthes et garde-corps ; avant correction, un garde-corps manque
 * au deuxième niveau et une planche laisse un trou. */
function Echafaudage({ conforme }: { conforme: boolean }) {
  const blocs = useMemo(() => {
    const b: BlocArchitecture[] = [];
    for (let x = -8; x <= 8.01; x += 2) for (const z of [-4.4, -3.5]) b.push({ position: [x, 4.75, z], taille: [.07, 9.5, .07], couleur: '#9AA0A6', rotation: 0 });
    for (const y of [2, 4, 6, 8]) {
      for (let x = -7; x <= 7.01; x += 2) {
        if (!conforme && y === 2 && x === 1) continue;                          // la planche manquante
        b.push({ position: [x, y, -3.95], taille: [1.95, .06, .8], couleur: '#B08A52', rotation: 0 });
      }
      b.push({ position: [0, y + .08, -3.53], taille: [16, .15, .03], couleur: '#E8B23A', rotation: 0 });     // plinthe
      for (const dy of [.5, 1]) {
        if (!conforme && y === 4) { // le garde-corps manquant au deuxième niveau, sur toute la travée centrale
          b.push({ position: [-5, y + dy, -3.5], taille: [6, .05, .05], couleur: '#E86A2E', rotation: 0 }, { position: [5, y + dy, -3.5], taille: [6, .05, .05], couleur: '#E86A2E', rotation: 0 });
        } else b.push({ position: [0, y + dy, -3.5], taille: [16, .05, .05], couleur: '#E86A2E', rotation: 0 });
      }
    }
    return b;
  }, [conforme]);
  return <BlocsInstances blocs={blocs} interactif={false} />;
}

/** L'immeuble en R+3 : dalles, poteaux, aciers en attente au dernier niveau, premiers murs d'agglos. */
function Ossature() {
  const blocs = useMemo(() => {
    const b: BlocArchitecture[] = [];
    for (const y of [3, 6, 9]) b.push({ position: [0, y, -7.6], taille: [16, .25, 6], couleur: '#B9B4AA', rotation: 0 });
    for (let x = -7.8; x <= 7.81; x += 3.9) for (const z of [-10.4, -7.6, -4.8]) for (const etage of [0, 1, 2]) b.push({ position: [x, 1.5 + etage * 3, z], taille: [.35, 3, .35], couleur: '#A8A39A', rotation: 0 });
    for (let x = -7.8; x <= 7.81; x += 3.9) for (const z of [-10.4, -7.6, -4.8]) for (const [dx, dz] of [[-.1, -.1], [.1, .1]]) b.push({ position: [x + dx, 9.8, z + dz], taille: [.03, 1.4, .03], couleur: '#8E4B2E', rotation: 0 });
    for (let i = 0; i < 18; i++) b.push({ position: [-7.6 + (i % 9) * .45, .2 + Math.floor(i / 9) * .2, -10.2], taille: [.4, .2, .2], couleur: '#B5B0A6', rotation: 0 });
    return b;
  }, []);
  return <BlocsInstances blocs={blocs} interactif={false} />;
}

export function DecorPlateau({ faites }: ProprietesDecor) {
  const epiRespectes = faites >= 1, echafaudageConforme = faites >= 2, trancheeBlindee = faites >= 3, levageSur = faites >= 4, inspectionFinie = faites >= 5;
  const stock = useMemo(() => {
    const b: BlocArchitecture[] = [];
    for (let i = 0; i < 4; i++) for (let n = 0; n < 3; n++) b.push({ position: [-13 + i * 1.3, .3 + n * .42, 6.6], taille: [1.2, .4, 1.1], couleur: '#B5B0A6', rotation: 0 });
    for (let i = 0; i < 6; i++) b.push({ position: [-11, .15 + i * .06, 8.6], taille: [5, .05, .05 + (i % 2) * .02], couleur: '#8E4B2E', rotation: 0 });
    for (let i = 0; i < 8; i++) b.push({ position: [-9.2 + (i % 4) * .5, .15 + Math.floor(i / 4) * .25, 7], taille: [.45, .22, .7], couleur: '#D8D2C4', rotation: 0 });
    return b;
  }, []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 22]} /><MateriauMonde type="concrete_floor" couleur="#A88A66" echelle={4} relief={.6} rugosite={.95} /></mesh>
    {/* Palissade haute au nord et sur les côtés, grillage bas au sud pour voir dedans ; portail au milieu. */}
    {([[0, -11.05, 30.2, .08], [-15.05, 0, .08, 22.2], [15.05, 0, .08, 22.2]] as [number, number, number, number][]).map(([x, z, l, p], i) => <mesh key={i} position={[x, 1.1, z]} castShadow receiveShadow><boxGeometry args={[l, 2.2, p]} /><MateriauMonde type="corrugated_iron" couleur="#C9CDC4" echelle={1.6} relief={.9} rugosite={.6} metal={.4} /></mesh>)}
    {[-1, 1].map(cote => <group key={cote}><Boite p={[cote * 8.6, .5, 11.05]} s={[12.8, 1, .04]} c="#7C8A84" /><Boite p={[cote * 8.6, 1.02, 11.05]} s={[12.8, .06, .08]} c="#C1502E" /></group>)}
    <group position={[-4.6, 0, 10.6]}>
      {[-1.4, 1.4].map(x => <Boite key={x} p={[x, 1, 0]} s={[.08, 2, .08]} c="#6A6F72" />)}
      <Boite p={[0, 2.1, .02]} s={[3.2, 1.2, .06]} c="#F7F2E8" />
      <Boite p={[0, 2.55, .06]} s={[3.2, .3, .01]} c="#C1502E" />
      <Text position={[0, 2.55, .08]} fontSize={.15} color="#FFFFFF" anchorX="center" anchorY="middle">CHANTIER DU PLATEAU · R+3</Text>
      <Text position={[0, 2.12, .08]} fontSize={.16} color="#2B2B2E" anchorX="center" anchorY="middle">PORT DES EPI OBLIGATOIRE</Text>
      <Text position={[0, 1.78, .08]} fontSize={.11} color="#5A4F42" anchorX="center" anchorY="middle">Casque · chaussures · gilet</Text>
    </group>
    {/* L'immeuble et son échafaudage. */}
    <Ossature />
    <Echafaudage conforme={echafaudageConforme} />
    <OuvrierPoste position={[-5, 2.03, -3.95]} rotation={Math.PI} variante={0} />
    <OuvrierPoste position={[3.4, 6.03, -3.95]} rotation={Math.PI} variante={1} />
    <OuvrierPoste position={[-2.4, 9.12, -6.4]} rotation={0} variante={2} />
    {/* La grue ; avant correction, une benne de béton passe au-dessus de deux coffreurs, ensuite la zone est balisée. */}
    <Grue position={[11, 0, -8.4]} hauteurCharge={6} pause={false} rythme={1} />
    {levageSur ? <>
      <Boite p={[5.6, .45, -1.8]} s={[1.1, .9, 1.1]} c="#5E6B70" metal={.4} />
      {([[3.6, -2.6], [7.6, -2.6], [7.6, -.8], [3.6, -.8]] as [number, number][]).map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, .5, z]} r={.04} h={1} c="#E8E2D6" />)}
      {([[5.6, -2.6, 4, .03], [5.6, -.8, 4, .03], [3.6, -1.7, .03, 1.8], [7.6, -1.7, .03, 1.8]] as [number, number, number, number][]).map(([x, z, l, p], i) => <Boite key={i} p={[x, .9, z]} s={[l, .08, p]} c={i % 2 ? '#F4F4F0' : '#D9342B'} />)}
    </> : <>
      <Cyl p={[5.6, 7.4, -1.8]} r={.015} h={6.2} c="#2B2B2E" />
      <Boite p={[5.6, 4, -1.8]} s={[1.1, .9, 1.1]} c="#5E6B70" metal={.4} />
      <OuvrierPoste position={[5.2, 0, -1.4]} rotation={Math.PI} variante={3} /><OuvrierPoste position={[6.3, 0, -1.9]} rotation={-2.4} variante={0} />
    </>}
    {/* La tranchée ; avant correction, parois nues et déblais au bord, un ouvrier prêt à descendre. */}
    <Boite p={[-11.7, .012, -1]} s={[3, .02, 10]} c="#4A3626" rugosite={1} />
    {[-13.25, -10.15].map(x => <Boite key={x} p={[x, .1, -1]} s={[.1, .2, 10]} c="#6B4A33" />)}
    {trancheeBlindee ? <>
      {[-13.1, -10.3].map(x => [-4.5, -2, .5, 3].map(z => <Boite key={`${x}${z}`} p={[x, .55, z]} s={[.08, 1, 2.2]} c="#2F6E8E" metal={.4} />))}
      {[-4.6, -1.2, 2.2].map(z => <group key={z}><Boite p={[-9.85, .5, z]} s={[.06, 1, .06]} c="#E8E2D6" /><Boite p={[-9.85, .9, z + 1.7]} s={[.04, .08, 3.4]} c="#D9342B" /></group>)}
      <mesh position={[-12, .4, 7.2]} scale={[1.6, .8, 1.2]} castShadow><sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8C6A4A" roughness={1} /></mesh>
    </> : <>
      <mesh position={[-9.7, 0, -1]} scale={[.45, .9, 3.6]} castShadow><sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8C6A4A" roughness={1} /></mesh>
      <Gens p={[-9.7, 0, -4.6]} r={-Math.PI / 2} casque variante={0} />
    </>}
    {/* Accueil sécurité : le bungalow, le râtelier de casques, le panneau de l'inspection ; le visiteur sans EPI, avant. */}
    <Bungalow position={[11.5, 0, 7.2]} taille={[5.4, 2.6, 4]} nuit={false} libelle="ACCUEIL SÉCURITÉ · EPI" />
    <group position={[9.6, 1.6, 9.24]}>
      <Boite p={[0, 0, 0]} s={[1.6, .7, .04]} c={inspectionFinie ? '#2E8B57' : '#E8772E'} />
      <Text position={[0, .1, .03]} fontSize={.13} color="#FFFFFF" anchorX="center" anchorY="middle">INSPECTION</Text>
      <Text position={[0, -.14, .03]} fontSize={.15} color="#FFFFFF" anchorX="center" anchorY="middle">{inspectionFinie ? 'CONFORME' : 'EN COURS'}</Text>
    </group>
    <Gens p={[-1.6, 0, 9]} r={Math.PI * .9} casque={epiRespectes} variante={2} />
    {/* Le stock : agglos sur palettes, aciers, sacs de ciment. */}
    <BlocsInstances blocs={stock} interactif={false} />
  </>;
}
