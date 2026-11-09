'use client';

import { memo, useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { DossierCampagne } from '@/lib/campagne';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import { bornage, echafaudage, implantation, muret, sondages, structure } from '@/lib/plan-akwaba';
import {
  CHATEAU, chateauFini, elementsDossier, etalsHalle, fondationsDossier, futEnElevation, HALLE, poteauxDossier, sondagesDossier, stocksDossier,
  type GabaritDossier,
} from '@/lib/plan-dossiers';
import { BlocsInstances } from './blocs-instances';
import { Balise, Bungalow, Grue, OuvrierEnBoucle, OuvrierPoste, Palissade } from './chantier-vivant';
import { HumainMonde } from './humain-monde';
import { PanneauParcelle } from './immeuble-akwaba';
import { Finition, MateriauMonde } from './materiaux-monde';
import { Architecture } from './ville-lagune';

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
/** Hauteur de l'ouvrage fini, du sol à son point le plus haut. */
export function hauteurOuvrage(g: GabaritDossier) {
  if (g.forme === 'chateau-eau') return CHATEAU.radier.epaisseur + CHATEAU.fut.hauteur + CHATEAU.cone + CHATEAU.cuve.hauteur + .8;
  if (g.forme === 'halle') return .3 + HALLE.poteau + HALLE.faitage + .5;
  return g.ouvrage.niveaux * g.ouvrage.hauteurNiveau;
}

/** Le sol de la parcelle : la terre du chantier, puis, l'ouvrage livré, des pavés, une pelouse ou du gravier. */
function SolParcelle({ hx, hz, livre, sol }: { hx: number; hz: number; livre: boolean; sol: GabaritDossier['sol'] }) {
  return <mesh position={[0, .04, 0]} receiveShadow>
    <boxGeometry args={[hx * 2, .08, hz * 2]} />
    {!livre ? <MateriauMonde type="concrete_floor" couleur="#A88A62" echelle={1.8} relief={.95} rugosite={1} />
      : sol === 'pave' ? <MateriauMonde type="brick_pavement_02" couleur="#E9DFD0" echelle={2.4} relief={.7} rugosite={.95} />
      : sol === 'gravier' ? <MateriauMonde type="concrete_floor" couleur="#C9C0AE" echelle={1.6} relief={.9} rugosite={1} />
      : <meshStandardMaterial color="#7F9A62" roughness={1} />}
  </mesh>;
}

/** La charpente de la halle : massifs, poteaux et arbalétriers des portiques, pannes ; couverte, ses bacs d'acier, ses
 * plaques translucides, son faîtage aéré et ses gouttières. */
function CharpenteHalle({ g, couverte }: { g: GabaritDossier; couverte: boolean }) {
  const { largeur: l, profondeur: p, centreZ: cz } = g.ouvrage, demi = p / 2, base = .3, sabliere = base + HALLE.poteau;
  const pente = Math.atan2(HALLE.faitage, demi), rampant = Math.hypot(demi, HALLE.faitage);
  const portiques = Array.from({ length: HALLE.portiques }, (_, i) => -l / 2 + l * i / (HALLE.portiques - 1));
  const acier = <meshStandardMaterial color={g.couleur} metalness={.55} roughness={.42} />;
  return <group position={[0, 0, cz]}>
    {portiques.map(x => <group key={x}>
      {[-demi, demi].map(z => <group key={z}>
        <mesh position={[x, base / 2, z]} castShadow receiveShadow><boxGeometry args={[.9, base, .9]} /><Finition couleur="#BDB8AD" /></mesh>
        <mesh position={[x, base + HALLE.poteau / 2, z]} castShadow><boxGeometry args={[.27, HALLE.poteau, .27]} />{acier}</mesh>
      </group>)}
      {[-1, 1].map(cote => <mesh key={cote} position={[x, sabliere + HALLE.faitage / 2, cote * demi / 2]} rotation={[cote * pente, 0, 0]} castShadow>
        <boxGeometry args={[.22, .32, rampant]} />{acier}
      </mesh>)}
    </group>)}
    {/* Les pannes, portées par les arbalétriers, sur toute la longueur de la halle. */}
    {[-1, 1].flatMap(cote => [.12, .5, .88].map(t => <mesh key={`${cote}${t}`} position={[0, sabliere + HALLE.faitage * (1 - t) + .22, cote * demi * t]} castShadow>
      <boxGeometry args={[l + .3, .12, .1]} />{acier}
    </mesh>))}
    {couverte && <>
      {[-1, 1].map(cote => <group key={cote} position={[0, sabliere + HALLE.faitage / 2 + .3, cote * demi / 2]} rotation={[cote * pente, 0, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[l + .8, .05, rampant + .5]} /><MateriauMonde type="corrugated_iron" couleur="#A9B2B0" echelle={1.4} relief={.9} rugosite={.55} metal={.45} /></mesh>
        {/* Les plaques translucides laissent passer la lumière du jour. */}
        {[-l / 4, l / 4].map(x => <mesh key={x} position={[x, .035, 0]}><boxGeometry args={[1.4, .02, rampant + .4]} /><meshStandardMaterial color="#EEF3EE" transparent opacity={.72} roughness={.3} /></mesh>)}
      </group>)}
      <mesh position={[0, sabliere + HALLE.faitage + .45, 0]} castShadow><boxGeometry args={[l + .8, .22, .7]} /><meshStandardMaterial color="#8F9799" metalness={.5} roughness={.45} /></mesh>
      {[-1, 1].map(cote => <group key={cote}>
        <mesh position={[0, sabliere + .2, cote * (demi + .35)]}><boxGeometry args={[l + .8, .16, .22]} /><meshStandardMaterial color="#6F777A" metalness={.6} roughness={.4} /></mesh>
        {[-l / 2 - .3, l / 2 + .3].map(x => <mesh key={x} position={[x, sabliere / 2, cote * (demi + .35)]}><cylinderGeometry args={[.06, .06, sabliere, 8]} /><meshStandardMaterial color="#6F777A" metalness={.6} roughness={.4} /></mesh>)}
      </group>)}
      {/* L'enseigne, accrochée sous la gouttière, côté rue. */}
      <group position={[0, sabliere - .55, demi + .5]}>
        <mesh><boxGeometry args={[Math.min(l - 2, g.enseigne.texte.length * .28), .62, .08]} /><meshStandardMaterial color={g.enseigne.couleur} roughness={.6} /></mesh>
        <Text position={[0, 0, .05]} fontSize={.34} color="#FFF4DC" anchorX="center" anchorY="middle" letterSpacing={.06}>{g.enseigne.texte}</Text>
      </group>
    </>}
  </group>;
}

/** Le château d'eau : le cône qui relie le fût à la cuve, et le nom de la Régie sur le bandeau de la cuve. */
function TeteChateau({ g, nuit }: { g: GabaritDossier; nuit: boolean }) {
  const { radier, fut, cone, cuve } = CHATEAU, cz = g.ouvrage.centreZ, haut = radier.epaisseur + fut.hauteur;
  return <group position={[0, 0, cz]}>
    <mesh position={[0, haut + cone / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[cuve.rayon, fut.rayon, cone, 32]} /><Finition couleur="#ECEAE4" />
    </mesh>
    <Text position={[0, haut + cone + cuve.hauteur * .62, cuve.rayon + .1]} fontSize={.5} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.1}>RÉGIE DES EAUX</Text>
    {/* Le feu de balisage au sommet, qui clignote doucement la nuit pour les avions. */}
    <mesh position={[0, haut + cone + cuve.hauteur + 1, 0]}><sphereGeometry args={[.18, 12, 8]} /><meshStandardMaterial color="#D9443A" emissive="#FF3B2F" emissiveIntensity={nuit ? 2.2 : .3} /></mesh>
  </group>;
}

/** Un chantier du fil rouge après les Rôniers, vu de la ville : la parcelle réservée devient chantier, puis ouvrage livré
 * et habité, au fil des chapitres de son dossier. */
export const ChantierDossier = memo(function ChantierDossier({ dossier, gabarit: g, stade, nuit, pause, rythme, selectionne, appel, onSelect }: {
  dossier: DossierCampagne; gabarit: GabaritDossier;
  /** Chapitres validés du dossier (0 à 8). */
  stade: number; nuit: boolean; pause: boolean; rythme: number; selectionne: boolean;
  /** Libellé de la balise du portail quand le client attend le joueur (la réception) ; rien sinon. */
  appel: string | null;
  onSelect: () => void;
}) {
  const e = elementsDossier(stade), { parcelle } = dossier, hx = parcelle.largeur / 2, hz = parcelle.profondeur / 2, im = g.ouvrage;
  const poteaux = useMemo(() => poteauxDossier(g), [g]);
  const blocsBornage = useMemo(() => e.bornes ? bornage(hx, hz) : [], [e.bornes, hx, hz]);
  const blocsSondages = useMemo(() => e.sondages ? sondages(sondagesDossier(g)) : [], [e.sondages, g]);
  const blocsImplantation = useMemo(() => e.implantation && g.forme !== 'chateau-eau' ? implantation(im) : [], [e.implantation, g.forme, im]);
  const blocsFondations = useMemo(() => e.fondations ? fondationsDossier(g) : [], [e.fondations, g]);
  const blocsStocks = useMemo(() => e.stocks ? stocksDossier(g) : [], [e.stocks, g]);
  const blocsGrosOeuvre = useMemo(() => !e.grosOeuvre ? [] : g.forme === 'batiment' ? [...structure(im, poteaux), ...echafaudage(im)] : g.forme === 'chateau-eau' ? futEnElevation(g) : [],
    [e.grosOeuvre, g, im, poteaux]);
  const blocsChateau = useMemo(() => e.ouvrage && g.forme === 'chateau-eau' ? chateauFini(g) : [], [e.ouvrage, g]);
  const blocsEtals = useMemo(() => e.ouvrage && g.forme === 'halle' ? etalsHalle(g) : [], [e.ouvrage, g]);
  const blocsMuret = useMemo(() => e.livre && g.forme !== 'halle' ? muret(hx, hz) : [], [e.livre, g.forme, hx, hz]);
  const clic = (ev: ThreeEvent<MouseEvent>) => { ev.stopPropagation(); if (ev.delta < 5) onSelect(); };
  const hauteur = im.niveaux * im.hauteurNiveau, zFacade = im.centreZ + im.profondeur / 2, sommet = e.ouvrage ? hauteurOuvrage(g) : e.grue ? g.grue.hauteur : 5;
  const yPanneau = e.palissade ? 1.3 : 1.35, zPanneau = e.palissade ? hz + .09 : hz + .45, xPanneau = Math.min(hx - 2.3, 5);
  const etape = dossier.stades[Math.min(stade, dossier.stades.length - 1)];
  return <group position={[parcelle.x, 0, parcelle.z]} onClick={clic}>
    <SolParcelle hx={hx} hz={hz} livre={e.livre} sol={g.sol} />
    <BlocsInstances blocs={blocsBornage} interactif={false} />
    <BlocsInstances blocs={blocsSondages} interactif={false} />
    <BlocsInstances blocs={blocsImplantation} interactif={false} />
    <BlocsInstances blocs={blocsFondations} interactif={false} />
    <BlocsInstances blocs={blocsStocks} interactif={false} />
    <BlocsInstances blocs={blocsGrosOeuvre} interactif={false} />
    <BlocsInstances blocs={blocsChateau} interactif={false} />
    <BlocsInstances blocs={blocsEtals} interactif={false} />
    <BlocsInstances blocs={blocsMuret} interactif={false} />
    {e.palissade && <Palissade hx={hx} hz={hz} />}
    {e.reserve && <PanneauParcelle position={[-xPanneau, 1.35, hz + .45]} titre="TERRAIN RÉSERVÉ" lignes={[dossier.nom, `Maître d’ouvrage : ${dossier.client}`, 'Accès interdit']} couleur="#5E6B70" />}
    {e.panneauProjet && <PanneauParcelle position={[-xPanneau, yPanneau, zPanneau]} pieds={!e.palissade} titre="PROJET"
      lignes={[dossier.nom, `${majuscule(dossier.client)} · ${dossier.ouvrage}`, `Entreprise : BTP Life Construction · ${etape}`]} couleur="#C1502E" />}
    {e.permis && <PanneauParcelle position={[xPanneau, 1.3, hz + .09]} pieds={false} titre="PERMIS DE CONSTRUIRE"
      lignes={[dossier.nom, dossier.ouvrage, 'Dossier consultable à l’hôtel de ville']} couleur="#2F6FB3" />}
    {e.baseVie && <>
      <Bungalow position={g.baseVie} taille={[2.6, 2.3, 1.3]} nuit={nuit} libelle="BASE VIE · BTP LIFE" />
      <mesh position={g.sanitaires} castShadow><boxGeometry args={[.95, 2.3, .95]} /><meshStandardMaterial color="#3D6F9E" roughness={.6} /></mesh>
    </>}
    {e.grue && <Grue position={g.grue.position} hauteur={g.grue.hauteur} hauteurCharge={e.grosOeuvre ? (g.forme === 'chateau-eau' ? CHATEAU.fut.hauteur * .65 : g.forme === 'halle' ? HALLE.poteau : hauteur) : 1} pause={pause} rythme={rythme} />}
    {e.grosOeuvre && g.forme === 'halle' && <CharpenteHalle g={g} couverte={false} />}
    {e.ouvrage && g.forme === 'halle' && <CharpenteHalle g={g} couverte />}
    {e.ouvrage && g.forme === 'chateau-eau' && <TeteChateau g={g} nuit={nuit} />}
    {e.ouvrage && g.forme === 'batiment' && <group position={[0, 0, im.centreZ]}>
      <Architecture width={im.largeur} height={hauteur} depth={im.profondeur} kind="campus" color={g.couleur} nuit={nuit} slug={dossier.id} />
      <group position={[0, hauteur + 1.1, im.profondeur / 2 + .45]}>
        <mesh><boxGeometry args={[Math.min(im.largeur - .6, g.enseigne.texte.length * .27 + .8), .66, .12]} /><meshStandardMaterial color={g.enseigne.couleur} roughness={.5} /></mesh>
        <Text position={[0, 0, .07]} fontSize={.34} color="#FFF4DC" anchorX="center" anchorY="middle" letterSpacing={.06} maxWidth={im.largeur - 1}>{g.enseigne.texte}</Text>
      </group>
      {g.croix && <group position={[im.largeur / 2 - 1.4, hauteur * .62, im.profondeur / 2 + .55]}>
        {[[.36, 1.15], [1.15, .36]].map(([l, h]) => <mesh key={l}><boxGeometry args={[l, h, .14]} /><meshStandardMaterial color="#2E9E5B" emissive="#2EBF62" emissiveIntensity={nuit ? 1.4 : .25} /></mesh>)}
      </group>}
    </group>}
    {/* Le chantier vit : un compagnon à la semelle ou au sommet, un manœuvre qui porte entre le stock et l'ouvrage. */}
    {e.fondations && poteaux[1] && <OuvrierPoste position={[poteaux[1][0] + 1.2, .08, poteaux[1][1] + .9]} rotation={-2.4} variante={1} echelle={ECHELLE_PERSONNAGES} />}
    {e.fondations && g.forme === 'chateau-eau' && <OuvrierPoste position={[1.6, CHATEAU.radier.epaisseur, im.centreZ + 2.4]} rotation={-2.6} variante={2} echelle={ECHELLE_PERSONNAGES} />}
    {(e.fondations || e.grosOeuvre) && <OuvrierEnBoucle points={g.forme === 'chateau-eau' ? [[4.2, hz - .9], [-3, hz - .9]] : [[g.stocks[0] - 2.2, g.stocks[2] - .2], [g.stocks[0] - 5.2, g.stocks[2] - .2]]}
      depart={0} variante={0} porte pause={pause} rythme={rythme} echelle={ECHELLE_PERSONNAGES} />}
    {e.grosOeuvre && g.forme === 'batiment' && <OuvrierPoste position={[im.largeur / 4, .4 + hauteur, im.centreZ - .8]} rotation={.4} variante={3} echelle={ECHELLE_PERSONNAGES} />}
    {e.reception && <>
      {[-1, 1].map(s => <mesh key={s} position={[s * 2.75, 1.6, hz + .05]} castShadow><boxGeometry args={[.1, 3.2, .1]} /><meshStandardMaterial color="#6A6F72" /></mesh>)}
      <mesh position={[0, 2.85, hz + .08]}><planeGeometry args={[5.4, .55]} /><meshBasicMaterial color="#E8B04A" /></mesh>
      <Text position={[0, 2.85, hz + .1]} fontSize={.24} color="#2A1C0E" anchorX="center" anchorY="middle" letterSpacing={.08}>{g.forme === 'chateau-eau' ? 'MISE EN SERVICE' : 'RÉCEPTION DES TRAVAUX'}</Text>
      <group position={[-1.3, .08, hz - 1]}><HumainMonde nom={`${dossier.accueil.nom} · Client`} prof variante={2} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
    </>}
    {e.livre && <>
      <group position={[-2.6, .08, Math.min(hz - 1.2, zFacade + 1.4)]} rotation={[0, .4, 0]}><HumainMonde variante={1} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
      <group position={[2.2, .08, Math.min(hz - 1.1, zFacade + 1.2)]} rotation={[0, -.6, 0]}><HumainMonde variante={3} sansCasque scale={ECHELLE_PERSONNAGES} /></group>
      {g.forme === 'halle' && [-4.6, -.6, 3.4].map((x, i) => <group key={x} position={[x, .08, im.centreZ - im.profondeur / 4 + .9]} rotation={[0, Math.PI, 0]}><HumainMonde variante={i} sansCasque scale={ECHELLE_PERSONNAGES} /></group>)}
    </>}
    {appel && <Balise position={[0, 0, hz + 2]} libelle={appel} onClick={onSelect} />}
    {selectionne && <Billboard position={[0, sommet + 2.5, 0]}>
      <mesh><planeGeometry args={[Math.max(7, dossier.nom.length * .48), 1.55]} /><meshBasicMaterial color="#9b6422" transparent opacity={.94} /></mesh>
      <Text position={[0, 0, .02]} fontSize={.55} color="#fff5dc" anchorX="center" anchorY="middle">{dossier.nom}</Text>
    </Billboard>}
    {selectionne && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .19, 0]}><ringGeometry args={[Math.max(hx, hz) * 1.25, Math.max(hx, hz) * 1.25 + .25, 48]} /><meshBasicMaterial color="#ffd47a" /></mesh>}
  </group>;
});
