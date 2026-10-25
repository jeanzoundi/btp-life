'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Teinte le casque d'un modèle réaliste (matériau « …_helmet ») pour ce seul personnage. Les modèles partagent leurs
// matériaux entre instances (Yao et le joueur peuvent porter le même) : on travaille sur une copie, et la texture
// blanche du casque prend la couleur choisie sans rien changer au reste du modèle.

export function TeinteCasque({ couleur, children }: { couleur: string; children: ReactNode }) {
  const groupe = useRef<THREE.Group>(null);
  const origines = useRef(new WeakMap<THREE.Mesh, THREE.Material>());
  const teintes = useRef(new WeakMap<THREE.Mesh, string>());
  const copies = useRef(new Set<THREE.Material>());
  // Le modèle arrive après son chargement, et chaque changement de modèle en apporte un neuf : on vérifie à chaque image,
  // ce qui ne coûte presque rien pour un seul personnage (une poignée de maillages).
  useFrame(() => {
    groupe.current?.traverse(o => {
      const maillage = o as THREE.Mesh;
      if (!maillage.isMesh || Array.isArray(maillage.material) || teintes.current.get(maillage) === couleur) return;
      const origine = origines.current.get(maillage) ?? maillage.material;
      if (!/_helmet$/i.test(origine.name ?? '') || !(origine as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      const copie = (origine as THREE.MeshStandardMaterial).clone();
      copie.color.set(couleur);
      if (maillage.material !== origine) { maillage.material.dispose(); copies.current.delete(maillage.material); }
      origines.current.set(maillage, origine); teintes.current.set(maillage, couleur);
      maillage.material = copie; copies.current.add(copie);
    });
  });
  useEffect(() => () => { copies.current.forEach(m => m.dispose()); copies.current.clear(); }, []);
  return <group ref={groupe}>{children}</group>;
}
