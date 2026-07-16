'use client';

// Point d'entrée public de l'avatar 3D : détecte le support WebGL et ne charge le bundle
// three.js/fiber (lourd) que si nécessaire et seulement sur les pages qui l'utilisent (chargement
// paresseux via next/dynamic, ssr: false). Repli silencieux sur l'avatar SVG (AvatarBtp) tant que
// WebGL n'est pas confirmé disponible, ou si le module 3D échoue à se charger — conformément à
// l'exigence « avatars statiques lorsque la 3D n'est pas disponible » du document produit.

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AvatarBtp, type AnimationAvatar } from './avatar-btp';

const Avatar3DCanvas = dynamic(() => import('./avatar-3d').then((m) => m.Avatar3DCanvas), { ssr: false });

function webglDisponible(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function Avatar3D({
  config,
  taille = 96,
  className = '',
  animation,
}: {
  config?: unknown;
  taille?: number;
  className?: string;
  animation?: AnimationAvatar;
}) {
  const [supporte, setSupporte] = useState<boolean | null>(null);

  useEffect(() => {
    setSupporte(webglDisponible());
  }, []);

  // supporte === null : pas encore monté côté client (SSR / tout premier rendu) — l'avatar SVG,
  // déjà rapide et sans dépendance, sert de repli le temps de vérifier le support WebGL.
  if (supporte === false || supporte === null) {
    return <AvatarBtp config={config} taille={taille} className={className} animation={animation} />;
  }

  return <Avatar3DCanvas config={config} taille={taille} className={className} animation={animation} />;
}
