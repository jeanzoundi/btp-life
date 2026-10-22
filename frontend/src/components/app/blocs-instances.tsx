'use client';

import { memo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BlocArchitecture } from '@/lib/architecture-ville';
import { Finition } from './materiaux-monde';

const sansRaycast: THREE.InstancedMesh['raycast'] = () => {};

export const BlocsInstances = memo(function BlocsInstances({ blocs, matiere = 'solide', interactif = true, arrondi = false }: {
  blocs: BlocArchitecture[]; matiere?: 'solide' | 'vitre' | 'lumiere'; interactif?: boolean; arrondi?: boolean;
}) {
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
  if (!blocs.length) return null;
  return <instancedMesh key={blocs.length} ref={ref} args={[undefined, undefined, blocs.length]} raycast={interactif ? THREE.InstancedMesh.prototype.raycast : sansRaycast} castShadow receiveShadow>
    {arrondi ? <sphereGeometry args={[.5, 8, 6]} /> : <boxGeometry />}
    {matiere === 'solide' ? <Finition couleur="#ffffff" /> : <meshPhysicalMaterial color="#ffffff" metalness={.48}
      roughness={.16} clearcoat={1} emissive={matiere === 'lumiere' ? '#b97736' : '#000000'} emissiveIntensity={.65} />}
  </instancedMesh>;
});
