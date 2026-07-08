// Géométrie des parcelles du quartier résidentiel — partagée entre le rendu du quartier iso
// (pour faire marcher le joueur jusqu'à SA maison) et le composant qui affiche les maisons.
import { hashStable } from './hash';

// Grille élargie (8x3 = 24 parcelles) pour accueillir plus de voisins visibles à la fois —
// le nombre réellement affiché reste borné (voir joueursActifs côté backend), seule la
// capacité d'accueil du quartier grandit.
export const RESID_ORIGIN = { x: 90, y: 740 };
export const RESID_COL_GAP = 100;
export const RESID_ROW_GAP = 95;
export const RESID_ROW_SHIFT = 25;
export const RESID_COLS = 8;
export const RESID_ROWS = 3;
export const RESID_PLOTS = RESID_COLS * RESID_ROWS;
export const MAISON_W = 40;
export const MAISON_D = 32;
export const MAISON_H = 34;

export function plotPosition(index: number) {
  const col = index % RESID_COLS;
  const row = Math.floor(index / RESID_COLS);
  return {
    x: RESID_ORIGIN.x + col * RESID_COL_GAP + row * RESID_ROW_SHIFT,
    y: RESID_ORIGIN.y + row * RESID_ROW_GAP,
  };
}

/** Le plot "maison" d'un joueur donné est toujours le même — pas de stockage nécessaire. */
export function monPlotIndex(userId?: string): number {
  return hashStable(userId ?? 'moi') % RESID_PLOTS;
}

export function plotIndexPour(id: string, pris: Set<number>): number {
  let idx = hashStable(id) % RESID_PLOTS;
  let tentatives = 0;
  while (pris.has(idx) && tentatives < RESID_PLOTS) {
    idx = (idx + 1) % RESID_PLOTS;
    tentatives += 1;
  }
  pris.add(idx);
  return idx;
}
