'use client';

import { useEffect, useState } from 'react';

/** Vrai sur un écran tactile sans souris (téléphone, tablette) : les raccourcis clavier n'y ont pas de sens. */
export function useEcranTactile() {
  const [tactile, setTactile] = useState(false);
  useEffect(() => {
    const requete = typeof window.matchMedia === 'function' ? window.matchMedia('(hover: none) and (pointer: coarse)') : null;
    if (!requete) return;
    const suivre = () => setTactile(requete.matches);
    suivre();
    requete.addEventListener?.('change', suivre);
    return () => requete.removeEventListener?.('change', suivre);
  }, []);
  return tactile;
}
