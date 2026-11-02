'use client';

import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture, MatiereBloc } from '@/lib/architecture-ville';
import { Finition, MateriauMonde } from './materiaux-monde';

const sansRaycast: THREE.InstancedMesh['raycast'] = () => {};
type Matiere = MatiereBloc | 'vitre' | 'lumiere';

/** Le matériau d'un lot : enduit photographique, béton brut, bois, métal satiné, ou vitre (éclairée la nuit). Enduit et
 * béton de la ville sont `mouillables` : la pluie les fonce et fait briller leurs faces horizontales. */
function MateriauLot({ matiere, mouillable }: { matiere: Matiere; mouillable: boolean }) {
  if (matiere === 'enduit') return <Finition couleur="#ffffff" mouillable={mouillable} />;
  if (matiere === 'beton') return <MateriauMonde type="concrete_floor" couleur="#ffffff" echelle={2.2} relief={.75} rugosite={.95} mouillable={mouillable} />;
  if (matiere === 'bois') return <MateriauMonde type="wood_floor" couleur="#ffffff" echelle={1.3} relief={.55} rugosite={.8} />;
  if (matiere === 'metal') return <meshStandardMaterial color="#ffffff" metalness={.72} roughness={.36} />;
  return <meshPhysicalMaterial color="#ffffff" metalness={.48} roughness={.16} clearcoat={1} emissive={matiere === 'lumiere' ? '#b97736' : '#000000'} emissiveIntensity={.65} />;
}

function LotInstances({ blocs, matiere, forme, interactif, arrondi, mouillable }: { blocs: BlocArchitecture[]; matiere: Matiere; forme?: 'cylindre'; interactif: boolean; arrondi: boolean; mouillable: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const objet = new THREE.Object3D(), couleur = new THREE.Color();
    blocs.forEach((bloc, i) => {
      objet.position.fromArray(bloc.position); objet.scale.fromArray(bloc.taille);
      objet.rotation.set(0, bloc.rotation, 0); objet.updateMatrix();
      ref.current!.setMatrixAt(i, objet.matrix);
      ref.current!.setColorAt(i, couleur.set(bloc.couleur));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [blocs]);
  return <instancedMesh key={blocs.length} ref={ref} args={[undefined, undefined, blocs.length]} raycast={interactif ? THREE.InstancedMesh.prototype.raycast : sansRaycast} castShadow receiveShadow>
    {arrondi ? <sphereGeometry args={[.5, 8, 6]} /> : forme === 'cylindre' ? <cylinderGeometry args={[.5, .5, 1, 14]} /> : <boxGeometry />}
    <MateriauLot matiere={matiere} mouillable={mouillable} />
  </instancedMesh>;
}

/** Des centaines de blocs en quelques commandes de dessin : une par matière et par forme présentes. Les blocs pleins
 * prennent la matière qu'ils portent (l'enduit par défaut) ; `matiere` impose la vitre ou la lumière à tout le lot. */
export const BlocsInstances = memo(function BlocsInstances({ blocs, matiere = 'solide', interactif = true, arrondi = false, mouillable = false }: {
  blocs: BlocArchitecture[]; matiere?: 'solide' | 'vitre' | 'lumiere'; interactif?: boolean; arrondi?: boolean;
  /** En ville, à ciel ouvert : la pluie mouille l'enduit et le béton (jamais dans les intérieurs). */
  mouillable?: boolean;
}) {
  const lots = useMemo(() => {
    const parLot = new Map<string, { matiere: Matiere; forme?: 'cylindre'; blocs: BlocArchitecture[] }>();
    for (const bloc of blocs) {
      const m: Matiere = matiere === 'solide' ? bloc.matiere ?? 'enduit' : matiere;
      const cle = `${m}|${bloc.forme ?? ''}`;
      const lot = parLot.get(cle) ?? parLot.set(cle, { matiere: m, forme: bloc.forme, blocs: [] }).get(cle)!;
      lot.blocs.push(bloc);
    }
    return [...parLot.entries()];
  }, [blocs, matiere]);
  return <>{lots.map(([cle, lot]) => <LotInstances key={cle} blocs={lot.blocs} matiere={lot.matiere} forme={lot.forme} interactif={interactif} arrondi={arrondi} mouillable={mouillable} />)}</>;
});
