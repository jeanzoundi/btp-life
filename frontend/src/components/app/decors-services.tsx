'use client';

import { Text } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { BlocArchitecture, V3 } from '@/lib/architecture-ville';
import { api } from '@/lib/api';
import { BlocsInstances } from './blocs-instances';
import { Boite, Cyl, Enseigne, MursCoupe, Plafonniers, SolCarrele, Verre } from './decors-lieux';
import { HumainMonde } from './humain-monde';
import type { ProprietesDecor } from './interieur-lieu-programme';

// Décors des lieux de service : la banque et l'agence des talents. Comme ailleurs, ce qu'il faut lire (enseignes,
// écrans, tampons) est tourné vers le sud, face à la caméra.

function Gens({ p, r = 0, assis = false, prof = false, variante = 0 }: { p: V3; r?: number; assis?: boolean; prof?: boolean; variante?: number }) {
  return <group position={p} rotation={[0, r, 0]}><HumainMonde assis={assis} prof={prof} variante={variante} /></group>;
}

/** Bureau en bois avec écran et chaise visiteur, tourné vers le sud. */
function Bureau({ p, ecran = '#2E5A78', largeur = 2.2 }: { p: V3; ecran?: string; largeur?: number }) {
  return <group position={p}>
    <Boite p={[0, .74, 0]} s={[largeur, .05, 1]} c="#8B6A45" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Boite key={`${a}${b}`} p={[a * (largeur / 2 - .08), .37, b * .42]} s={[.05, .74, .05]} c="#5A3E2B" />)}
    <Boite p={[-.3, 1.02, -.3]} s={[.6, .38, .03]} c="#1C1C1E" /><Boite p={[-.3, 1.02, -.28]} s={[.55, .32, .01]} c="#10202A" emissif={ecran} />
    <Boite p={[0, .45, .85]} s={[.46, .06, .46]} c="#2B3A44" /><Boite p={[0, .72, 1.06]} s={[.46, .5, .05]} c="#2B3A44" />
  </group>;
}

/** Chaises d'attente alignées, en blocs instanciés. */
function chaises(x1: number, x2: number, zs: number[], couleur: string): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [];
  for (const z of zs) for (let x = x1; x <= x2 + .01; x += .7) blocs.push(
    { position: [x, .45, z], taille: [.5, .06, .46], couleur, rotation: 0 }, { position: [x, .74, z - .22], taille: [.5, .5, .05], couleur, rotation: 0 },
    { position: [x, .22, z], taille: [.42, .44, .38], couleur: '#5E6B70', rotation: 0 });
  return blocs;
}

// ─── Banque BTL ───

export function DecorBanque({ faites }: ProprietesDecor) {
  const attente = useMemo(() => chaises(-5.4, -.6, [.9, 2], '#1F3A5F'), []);
  const coffreOuvert = faites >= 5;
  return <>
    <SolCarrele largeur={22} profondeur={16} c="#E8E4DA" joint="#CFC8B8" pas={1} />
    <MursCoupe hx={11} hz={8} hauteur={4} c="#EDEAE2" />
    <Boite p={[-4, 2, -7.98]} s={[13.6, 4, .02]} c="#1F3A5F" />
    <Text position={[-4, 3.35, -7.95]} fontSize={.42} color="#E9C46A" anchorX="center" anchorY="middle" letterSpacing={.1}>BANQUE BTL</Text>
    <Text position={[-4, 2.9, -7.95]} fontSize={.14} color="#C9D6E3" anchorX="center" anchorY="middle">La banque des bâtisseurs</Text>
    {/* Guichets : comptoir, vitres, numéros ; le guichet d'épargne à l'ouest. */}
    <Boite p={[-4, .55, -5.8]} s={[13.2, 1.1, 1.2]} c="#3A4A5C" /><Boite p={[-4, 1.13, -5.8]} s={[13.4, .06, 1.35]} c="#E9E4D8" />
    <Verre p={[-4, 1.85, -6.2]} s={[13.2, 1.4, .03]} c="#D6E6EE" opacite={.16} />
    {[-9.6, -7, -4.4, -1.8, .8].map((x, i) => <group key={x}>
      <Boite p={[x + 1.3, 1.85, -6.2]} s={[.05, 1.4, .1]} c="#2B3A44" />
      <Enseigne p={[x, 2.75, -6.18]} largeur={i === 0 ? 2.2 : 1} hauteur={.34} fond={i === 0 ? '#2F8F5B' : '#1F3A5F'} texte={i === 0 ? 'ÉPARGNE' : String(i)} taille={.17} />
      <Gens p={[x, 0, -6.95]} prof variante={i} />
    </group>)}
    {/* Salle des coffres : porte ronde en acier, ouverte quand le prêt est accordé. */}
    <Boite p={[8.5, 1.6, -7.96]} s={[3, 3.2, .06]} c="#5E6B70" metal={.5} />
    <group position={[7.4, 1.5, -7.85]} rotation={[0, coffreOuvert ? -1.2 : 0, 0]}>
      <mesh position={[1.1, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[1.1, 1.1, .3, 32]} /><meshStandardMaterial color="#AEB3B6" metalness={.8} roughness={.3} /></mesh>
      <mesh position={[1.1, 0, .2]} rotation={[0, 0, 0]}><torusGeometry args={[.35, .05, 8, 24]} /><meshStandardMaterial color="#6B6F72" metalness={.8} roughness={.3} /></mesh>
    </group>
    {coffreOuvert && [0, 1, 2].map(k => <Boite key={k} p={[8 + k * .4, .3 + k * .25, -7.7]} s={[.35, .22, .3]} c="#C9A227" metal={.7} />)}
    <Enseigne p={[8.5, 3.5, -7.9]} largeur={2.6} hauteur={.36} fond="#2B3A44" texte="SALLE DES COFFRES" taille={.15} />
    {/* Conseillère et bureau des prêts : le dossier grossit, le tableau d'amortissement s'affiche, puis le tampon. */}
    <Bureau p={[7, 0, -1.6]} ecran={faites >= 2 ? '#2F8F5B' : '#2E5A78'} />
    {faites >= 2 && [0, 1, 2, 3].map(i => <Boite key={i} p={[6.55 + i * .1, 1.0 + i * .03, -1.87]} s={[.06, .08 + i * .05, .01]} c="#7FE0A8" emissif="#4FBF7F" />)}
    <Bureau p={[7, 0, 2.6]} ecran={faites >= 4 ? '#3E8E5A' : '#2E5A78'} />
    {faites >= 3 && <Boite p={[7.5, .79 + Math.min(faites - 2, 3) * .02, 2.5]} s={[.32, .04 + Math.min(faites - 2, 3) * .04, .24]} c="#C1502E" />}
    {faites >= 4 && [0, 1, 2, 3, 4].map(i => <Boite key={i} p={[6.7, 1.12 - i * .055, 2.315]} s={[.42, .012, .002]} c="#DFF5E6" emissif="#9FE0B8" />)}
    {coffreOuvert && <Text position={[7.1, .9, 3.02]} rotation={[-Math.PI / 2, 0, .2]} fontSize={.16} color="#2F8F5B" anchorX="center" anchorY="middle" outlineWidth={.008} outlineColor="#FFFFFF">PRÊT ACCORDÉ</Text>}
    <Gens p={[7, 0, 3.45]} r={Math.PI} assis variante={3} />
    {/* Accueil, carte bancaire posée dès l'ouverture du compte. */}
    <Boite p={[3, .55, 4.9]} s={[3, 1.1, 1]} c="#1F3A5F" /><Boite p={[3, 1.13, 4.9]} s={[3.2, .06, 1.15]} c="#E9E4D8" />
    <Gens p={[3, 0, 4.0]} prof variante={1} />
    {faites >= 1 && <Boite p={[3.6, 1.17, 5.1]} s={[.17, .01, .11]} c="#2F6FB0" />}
    {/* Salle d'attente, distributeur, colonnes, plantes. */}
    <BlocsInstances blocs={attente} interactif={false} />
    <Gens p={[-4.7, 0, .9]} assis variante={4} /><Gens p={[-2, 0, 2]} assis variante={0} />
    <group position={[-10.6, 0, 3]}><Boite p={[0, .8, 0]} s={[.7, 1.6, 1.1]} c="#2B3A44" /><Boite p={[.36, 1.25, 0]} s={[.01, .35, .5]} c="#10202A" emissif="#3E7FB0" /><Text position={[.37, 1.62, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={.09} color="#FFFFFF" anchorX="center">DAB</Text></group>
    {[-3, 3].map(x => <Cyl key={x} p={[x, 2, -2]} r={.3} h={4} c="#F2EEE6" segments={24} />)}
    {[[-10.4, 7.2], [10.4, 7.2], [10.4, -.5]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .3, z]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[x, 1.2, z]} castShadow><coneGeometry args={[.55, 1.4, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>)}
    <Plafonniers points={[[-7, 3.7, -3], [-1, 3.7, -3], [6, 3.7, -3], [-7, 3.7, 3], [-1, 3.7, 3], [6, 3.7, 3]]} couleur="#FFF6E8" />
  </>;
}

// ─── Agence des talents ───

interface OffreMur { id: string; titre: string; niveauMin: number }
const OFFRES_SECOURS: OffreMur[] = [
  { id: 'a', titre: 'Chef de chantier gros œuvre', niveauMin: 6 }, { id: 'b', titre: 'Conducteur de travaux', niveauMin: 10 },
  { id: 'c', titre: 'Métreur', niveauMin: 4 }, { id: 'd', titre: 'Chef d’équipe maçonnerie', niveauMin: 3 },
];

export function DecorAgence({ faites }: ProprietesDecor) {
  // Le mur des offres affiche les vraies offres du jeu (même requête que le tableau des annonces du café).
  const { data } = useQuery({ queryKey: ['catalog', 'offres'], queryFn: () => api.get<{ items: OffreMur[] }>('/catalog/offres-emploi?pageSize=50'), staleTime: 300_000, retry: 1 });
  const offres = (data?.items?.length ? data.items : OFFRES_SECOURS).slice(0, 6);
  const attente = useMemo(() => chaises(2.6, 4.7, [5.1], '#2F6F6A'), []);
  return <>
    <SolCarrele largeur={22} profondeur={16} c="#C9CED1" joint="#B3B9BD" pas={.5} />
    <MursCoupe hx={11} hz={8} hauteur={3.6} c="#F0EFEA" />
    <Boite p={[0, 1.8, -7.98]} s={[22, 3.6, .02]} c="#2F6F6A" />
    <Text position={[2.2, 3.05, -7.95]} fontSize={.36} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={.08}>AGENCE DES TALENTS</Text>
    <Text position={[2.2, 2.62, -7.95]} fontSize={.14} color="#CFE7E4" anchorX="center" anchorY="middle">Ton prochain chantier commence ici</Text>
    {/* Mur des offres : un grand écran, les offres du moment. */}
    <group position={[-6.5, 2.05, -7.9]}>
      <Boite p={[0, 0, 0]} s={[3.6, 2.1, .06]} c="#111214" /><Boite p={[0, 0, .035]} s={[3.4, 1.9, .01]} c="#0F2A33" emissif="#123844" />
      <Text position={[0, .78, .05]} fontSize={.15} color="#7FD6C9" anchorX="center" anchorY="middle">OFFRES DU MOMENT</Text>
      {offres.map((o, i) => <Text key={o.id} position={[-1.55, .48 - i * .24, .05]} fontSize={.105} color="#F4F6F8" anchorX="left" anchorY="middle" maxWidth={3.1}>{`${o.titre} · niv. ${o.niveauMin}`}</Text>)}
    </group>
    {/* Accueil : comptoir, chargé d'accueil, dossier du candidat qui s'épaissit. */}
    <Boite p={[0, .55, -6]} s={[8, 1.1, 1.2]} c="#2F6F6A" /><Boite p={[0, 1.13, -6]} s={[8.2, .06, 1.35]} c="#F4F2EC" />
    <Gens p={[-1.4, 0, -7.1]} prof variante={2} />
    {faites >= 1 && <Boite p={[1.2, 1.18 + Math.min(faites, 4) * .015, -5.8]} s={[.32, .03 + Math.min(faites, 4) * .03, .24]} c="#E9C46A" />}
    {/* Espace CV : trois postes, deux candidats au travail ; le CV sort de l'imprimante. */}
    <Boite p={[-8.5, .74, 1.7]} s={[3.8, .05, 1]} c="#E6E3DA" />
    {[-9.8, -8.5, -7.2].map((x, i) => <group key={x}>
      <Boite p={[x, 1.02, 1.45]} s={[.55, .38, .03]} c="#1C1C1E" /><Boite p={[x, 1.02, 1.47]} s={[.5, .32, .01]} c="#F4F6F8" emissif="#DDE6EE" />
      {i < 2 && <Gens p={[x, 0, 2.4]} r={Math.PI} assis variante={i + 3} />}
    </group>)}
    <Boite p={[-10.2, .5, 3.4]} s={[.6, 1, .5]} c="#5E6B70" /><Boite p={[-10.2, 1.04, 3.4]} s={[.5, .08, .4]} c="#2B2B2E" />
    {faites >= 2 && <Boite p={[-10.2, 1.1, 3.5]} s={[.3, .01, .4]} c="#FFFFFF" />}
    {/* Salle de test : copies, et la tienne notée une fois le test réussi. */}
    <Boite p={[-.4, .74, 1]} s={[3.6, .05, 1.2]} c="#8B6A45" />
    {[-1.6, -.4, .8].map(x => <Boite key={x} p={[x, .77, .9]} s={[.3, .005, .4]} c="#FFFFFF" />)}
    {faites >= 3 && <Text position={[-.4, .79, .95]} rotation={[-Math.PI / 2, 0, 0]} fontSize={.09} color="#C1502E" anchorX="center">17/20</Text>}
    {/* Bureaux d'entretien : le recruteur, puis Esther ; le contrat signé à la fin. */}
    <Boite p={[6.5, .74, -3.1]} s={[2.2, .05, 1]} c="#E6E3DA" /><Gens p={[6.5, 0, -4.1]} prof variante={3} />
    {faites >= 4 && <Boite p={[6.2, .77, -2.9]} s={[.3, .01, .4]} c="#FFF4C2" />}
    <Boite p={[6.5, .74, 1.9]} s={[2.2, .05, 1]} c="#E6E3DA" />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([a, b]) => [-3.1, 1.9].map(z => <Boite key={`${a}${b}${z}`} p={[6.5 + a * 1, .37, z + b * .42]} s={[.05, .74, .05]} c="#5E6B70" />))}
    {faites >= 5 && <Enseigne p={[6.5, 1.25, 2.25]} largeur={1.3} hauteur={.4} fond="#2F8F5B" texte="CONTRAT SIGNÉ" taille={.11} />}
    {/* Attente, fontaine à eau, plantes. */}
    <BlocsInstances blocs={attente} interactif={false} />
    <Gens p={[3.3, 0, 5.1]} assis prof variante={1} />
    <Cyl p={[10.4, .6, -7.2]} r={.2} h={1.2} c="#D9E6EC" /><Cyl p={[10.4, 1.35, -7.2]} r={.16} h={.4} c="#9FC6D6" />
    {[[-10.4, -7.2], [10.4, 7.2], [-10.4, 7.2]].map(([x, z]) => <group key={`${x}${z}`}><Cyl p={[x, .3, z]} r={.3} haut={.36} h={.6} c="#B5653C" /><mesh position={[x, 1.2, z]} castShadow><coneGeometry args={[.55, 1.4, 8]} /><meshStandardMaterial color="#4E7A3A" roughness={.9} /></mesh></group>)}
    <Plafonniers points={[[-7, 3.3, -3], [-1, 3.3, -3], [6, 3.3, -3], [-7, 3.3, 3], [-1, 3.3, 3], [6, 3.3, 3]]} couleur="#F4F7FF" />
  </>;
}
