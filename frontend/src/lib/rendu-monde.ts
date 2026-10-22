import type { QualiteMonde } from './fluidite-monde';

/** 0 : rendu direct · 1 : bloom + anti-crénelage · 2 : + occlusion demi-résolution · 3 : occlusion pleine résolution. */
export type NiveauEffets = 0 | 1 | 2 | 3;

export interface ReglagesEffets {
  composition: boolean;
  occlusion: boolean;
  echelleOcclusion: number;
  bloom: boolean;
  antiCrenelage: boolean;
}

export function niveauInitial(qualite: QualiteMonde, mobile: boolean): NiveauEffets {
  if (qualite === 'fluide') return 0;
  if (qualite === 'elevee') return 3;
  return mobile ? 1 : 2;
}

export function reglagesEffets(niveau: NiveauEffets): ReglagesEffets {
  return {
    composition: niveau > 0,
    occlusion: niveau >= 2,
    echelleOcclusion: niveau === 3 ? 1 : .5,
    bloom: niveau > 0,
    antiCrenelage: niveau > 0,
  };
}

/** En automatique, on ne retire un effet qu'une fois la résolution déjà au plancher : jamais de remontée, pour éviter les oscillations. */
export function ajusterEffets(niveau: NiveauEffets, fps: number, dpr: number, plancher: number): NiveauEffets {
  if (!Number.isFinite(fps) || fps <= 0 || niveau === 0) return niveau;
  return fps < 30 && dpr <= plancher + .001 ? (niveau - 1) as NiveauEffets : niveau;
}

/** Le seuil s'applique aux valeurs linéaires avant l'étalonnage : un mur au soleil approche 1, d'où un seuil plus haut le jour. */
export function reglagesBloom(nuit: boolean) {
  return nuit ? { seuil: .55, intensite: .65, rayon: .5 } : { seuil: 1.4, intensite: .16, rayon: .3 };
}
